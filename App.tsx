
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeContent, generateMultiSourceReport } from './services/geminiService';
import { fetchRealtimeNews } from './src/services/newsService';
import { TruthEyesAnalysis, InputData, NewsItem, NewsCategory, User, AlertKeyword, GroupedNewsTopic, Comment } from './types';
import AnalysisReport from './components/AnalysisReport';
import NeutralArticleModal from './components/NeutralArticleModal';
import MethodologyModal from './components/MethodologyModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import MyPage from './components/MyPage';
import { auth, loginWithGoogle, loginWithKakao, loginWithNaver, logout, db, handleFirestoreError, OperationType } from './src/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';

/*
 * TruthEyes AI - Elite Media Forensic Platform
 * 트루스아이즈 AI - 엘리트 미디어 데이터 포렌식 및 팩트체크 플랫폼
 */

const apiCategoryMap: Record<string, string> = {
  'Politics': 'politics',
  'Economy': 'business',
  'Society': 'general',
  'IT/Tech': 'technology',
  'World': 'world',
  'Entertainment': 'entertainment',
  'Sports': 'sports',
  'Real Estate': 'land',
  'Stock': 'finance',
  'Search': 'general'
};

const categoryLabels: Record<string, string> = {
  'Breaking': '실시간 이슈', 
  'Politics': '정치', 
  'Economy': '경제', 
  'Society': '사회', 
  'IT/Tech': 'IT/기술', 
  'World': '세계', 
  'Entertainment': '연예',
  'Sports': '스포츠',
  'Real Estate': '부동산',
  'Stock': '주식',
  'Search': '키워드 검색'
};

const truthDetectiveSteps = [
  { title: "실시간 데이터 수집", desc: "키워드와 관련된 최신 보도 자료를 인제스천 중입니다...", icon: "📡" },
  { title: "엔티티 및 수치 추출", desc: "기사 내 핵심 인물, 단체, 통계 수치를 식별하고 있습니다...", icon: "🔍" },
  { title: "공공 데이터 대조", desc: "통계청, 선관위 등 공공기관의 원천 데이터를 검색 및 대조 중입니다...", icon: "🏛️" },
  { title: "멀티 에이전트 분석", desc: "통계, 법률, 논리 전문 에이전트가 다각도로 검증을 수행하고 있습니다...", icon: "🧠" },
  { title: "논리적 모순 탐지", desc: "문장 간의 논리적 비약 및 인과관계 오류를 정밀 분석 중입니다...", icon: "⚖️" },
  { title: "포렌식 리포트 생성", desc: "분석 결과를 종합하여 심층 논평과 보정 권고를 작성 중입니다...", icon: "📄" }
];

const App: React.FC = () => {
  // 1. Core State Hooks (Always at top, never conditional)
  const [activeTab, setActiveTab] = useState<'Home' | 'Dashboard'>('Home');
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [newsLoading, setNewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TruthEyesAnalysis | null>(null);
  const [topNews, setTopNews] = useState<NewsItem[]>([]);
  const [groupedNews, setGroupedNews] = useState<GroupedNewsTopic[]>([]);
  const [activeDiscussion, setActiveDiscussion] = useState<string | null>(null);
  const [debateSort, setDebateSort] = useState<'latest' | 'popular'>('latest');
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('Breaking');
  const [searchQuery, setSearchQuery] = useState(''); // 키워드 검색용
  const [filterText, setFilterText] = useState(''); // 피드 내 필터용
  const [displayLimit, setDisplayLimit] = useState(12);
  const [newsPage, setNewsPage] = useState(1);
  const [subCategory, setSubCategory] = useState<NewsCategory | 'All'>('All');
  const [selectedArticleForIframe, setSelectedArticleForIframe] = useState<NewsItem | null>(null);
  const [modalReaderContent, setModalReaderContent] = useState<{content: string, title: string} | null>(null);
  const [neutralArticleModal, setNeutralArticleModal] = useState<{ isOpen: boolean; title: string; content: string }>({ isOpen: false, title: '', content: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'iframe' | 'reader'>('reader');
  const [user, setUser] = useState<User | null>(null);
  const [alerts, setAlerts] = useState<AlertKeyword[]>([]);
  const [notifiedUrls, setNotifiedUrls] = useState<Set<string>>(new Set());
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMyPage, setShowMyPage] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, 'agree' | 'disagree' | 'neutral'>>({});
  const [formData, setFormData] = useState<InputData>({
    title: '', author: '', body: '', url: '', language: 'Korean', inputType: 'search'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user preferences from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              phone: userData.phone || '',
              notificationType: userData.notificationType || 'Telegram',
              interestedRegions: userData.interestedRegions || [],
              interestedStocks: userData.interestedStocks || []
            });
          } else {
            // New user from social auth
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              notificationType: 'Telegram',
              interestedRegions: [],
              interestedStocks: []
            };
            setUser(newUser);
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          }
          setShowSignupModal(false);
        } catch (error) {
          console.error("Error fetching user doc:", error);
        }
      } else {
        setUser(null);
        // localStorage is fallback if needed, but Firebase is source of truth now
        const savedUser = localStorage.getItem('te_user');
        if (savedUser) setUser(JSON.parse(savedUser));
      }
    });

    const savedAlerts = localStorage.getItem('te_alerts');
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts));
    }

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedArticleForIframe) {
      const blockedDomains = [
        'naver.com', 'daum.net', 'chosun.com', 'donga.com', 'joongang', 
        'hani.co.kr', 'khan.co.kr', 'mk.co.kr', 'hankyung', 'sbs.co.kr', 
        'kbs.co.kr', 'mbc.co.kr', 'yna.co.kr', 'segye.com', 'kmib.co.kr',
        'munhwa.com', 'sedaily.com', 'moneytoday', 'mt.co.kr', 'edaily',
        'asiae.co.kr', 'heraldcorp.com', 'etnews.com'
      ];
      
      const isIframeBlocked = blockedDomains.some(domain => selectedArticleForIframe.url.includes(domain));
      
      // Default to reader mode for blocked sites, but allow switching to iframe (which will use proxy)
      setViewMode(isIframeBlocked ? 'reader' : 'iframe');
      
      const fetchContent = async () => {
        setModalLoading(true);
        setModalReaderContent(null);
        try {
          const res = await fetch(`/api/extract?url=${encodeURIComponent(selectedArticleForIframe.url)}`);
          if (res.ok) {
            const data = await res.json();
            setModalReaderContent(data);
          }
        } catch (err) {
          console.error("Failed to fetch modal content", err);
        } finally {
          setModalLoading(false);
        }
      };
      fetchContent();
    }
  }, [selectedArticleForIframe]);

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const newUser: User = { uid: 'temp-' + Date.now(), email, phone, notificationType: 'Telegram', interestedRegions: [], interestedStocks: [] };
    setUser(newUser);
    localStorage.setItem('te_user', JSON.stringify(newUser));
    setShowSignupModal(false);
  };

  const handleAddRegion = (region: string) => {
    if (!user || !region.trim()) return;
    const updatedRegions = [...(user.interestedRegions || []), region.trim()];
    const updatedUser = { ...user, interestedRegions: updatedRegions };
    setUser(updatedUser);
    localStorage.setItem('te_user', JSON.stringify(updatedUser));
    alert(`'${region}' 지역이 관심 지역으로 등록되었습니다.`);
    loadNews(selectedCategory);
  };

  const handleRemoveRegion = (region: string) => {
    if (!user) return;
    const updatedRegions = (user.interestedRegions || []).filter(r => r !== region);
    const updatedUser = { ...user, interestedRegions: updatedRegions };
    setUser(updatedUser);
    localStorage.setItem('te_user', JSON.stringify(updatedUser));
    loadNews(selectedCategory);
  };

  const handleAddStock = (ticker: string) => {
    if (!user || !ticker.trim()) return;
    const updatedStocks = [...(user.interestedStocks || []), ticker.trim().toUpperCase()];
    const updatedUser = { ...user, interestedStocks: updatedStocks };
    setUser(updatedUser);
    localStorage.setItem('te_user', JSON.stringify(updatedUser));
    alert(`'${ticker.toUpperCase()}' 종목이 관심 주식으로 등록되었습니다.`);
    loadNews(selectedCategory);
  };

  const handleRemoveStock = (ticker: string) => {
    if (!user) return;
    const updatedStocks = (user.interestedStocks || []).filter(t => t !== ticker);
    const updatedUser = { ...user, interestedStocks: updatedStocks };
    setUser(updatedUser);
    localStorage.setItem('te_user', JSON.stringify(updatedUser));
    loadNews(selectedCategory);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setShowMyPage(false);
    localStorage.removeItem('te_user');
  };

  const handleAddAlert = (keyword: string) => {
    if (!keyword.trim()) return;
    const newAlert: AlertKeyword = { id: Date.now().toString(), keyword: keyword.trim() };
    const updatedAlerts = [...alerts, newAlert];
    setAlerts(updatedAlerts);
    localStorage.setItem('te_alerts', JSON.stringify(updatedAlerts));
    alert(`'${keyword}' 알림이 등록되었습니다! 관련 기사가 보도되면 ${user?.notificationType || '알림'}으로 통보해 드립니다.`);
  };

  const handleDeleteAlert = (id: string) => {
    const updatedAlerts = alerts.filter(a => a.id !== id);
    setAlerts(updatedAlerts);
    localStorage.setItem('te_alerts', JSON.stringify(updatedAlerts));
  };

  const toggleNotificationType = () => {
    if (!user) return;
    const updatedUser: User = { 
      ...user, 
      notificationType: user.notificationType === 'Telegram' ? 'KakaoTalk' : 'Telegram' 
    };
    setUser(updatedUser);
    localStorage.setItem('te_user', JSON.stringify(updatedUser));
  };

  const handlePostComment = (topicId: string) => {
    if (!user) {
      setShowSignupModal(true);
      return;
    }
    const text = newCommentText[topicId];
    if (!text?.trim()) return;

    const newComment: Comment = {
      id: Math.random().toString(36).substring(2, 9),
      topicId,
      author: (user.email || "").split('@')[0] || '익명',
      text,
      time: '방금 전',
      likes: 0,
      type: 'neutral'
    };

    setComments(prev => ({
      ...prev,
      [topicId]: [newComment, ...(prev[topicId] || [])]
    }));
    setNewCommentText(prev => ({ ...prev, [topicId]: '' }));
  };

  const handleLikeComment = (topicId: string, commentId: string) => {
    if (!user) {
      setShowSignupModal(true);
      return;
    }
    setComments(prev => ({
      ...prev,
      [topicId]: (prev[topicId] || []).map(c => 
        c.id === commentId ? { ...c, likes: c.likes + 1 } : c
      )
    }));
  };

  const handleVote = (topicId: string, type: 'agree' | 'disagree' | 'neutral') => {
    if (!user) {
      setShowSignupModal(true);
      return;
    }
    
    const previousVote = userVotes[topicId];
    if (previousVote === type) return;

    setUserVotes(prev => ({ ...prev, [topicId]: type }));

    setGroupedNews(prev => prev.map(topic => {
      if (topic.id === topicId) {
        const currentVotes = topic.votes || { agree: 0, disagree: 0, neutral: 0 };
        const newVotes = { ...currentVotes };
        
        if (previousVote) {
          newVotes[previousVote] = Math.max(0, (newVotes[previousVote] || 0) - 1);
        }
        newVotes[type] = (newVotes[type] || 0) + 1;
        
        return { ...topic, votes: newVotes };
      }
      return topic;
    }));
  };

  // 알림 시스템 (브라우저 알림 및 콘솔 로그)
  useEffect(() => {
    if (topNews.length > 0) {
      const newNotifiedUrls: string[] = [];
      
      topNews.forEach(news => {
        if (notifiedUrls.has(news.url)) return;

        const matchingAlert = alerts.find(a => news.title.includes(a.keyword));
        const matchingRegion = (selectedCategory === 'Real Estate' && user?.interestedRegions) 
          ? user.interestedRegions.find(r => news.title.includes(r))
          : null;

        if (matchingAlert || matchingRegion) {
          newNotifiedUrls.push(news.url);
          const reason = matchingAlert ? `키워드 매칭: ${matchingAlert.keyword}` : `관심 지역 매칭: ${matchingRegion}`;
          
          // 브라우저 알림 발송
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(`[트루스아이즈] ${reason}`, {
                body: news.title,
                icon: news.image || "/favicon.ico"
              });
            } catch (err) {
              console.error("Notification error:", err);
            }
          }
          
          console.log(`[NOTIFICATION] ${user?.notificationType}: ${news.title}`);
        }
      });

      if (newNotifiedUrls.length > 0) {
        setNotifiedUrls(prev => {
          const next = new Set(prev);
          newNotifiedUrls.forEach(url => next.add(url));
          return next;
        });
      }
    }
  }, [topNews, alerts, user, notifiedUrls, selectedCategory]);

  const categories: NewsCategory[] = ['Breaking', 'Politics', 'Economy', 'Society', 'IT/Tech', 'World', 'Entertainment', 'Sports', 'Real Estate', 'Stock', 'Search'];

  useEffect(() => {
    // URL 공유 리포트 확인
    const params = new URLSearchParams(window.location.search);
    const sharedReport = params.get('report');
    if (sharedReport) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(atob(sharedReport)));
        setResult(decodedData);
        setActiveTab('Home');
        
        // URL 파라미터 제거 (깔끔한 상태 유지)
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error('Failed to hydrate shared report:', err);
        setError('공유된 리포트 데이터를 불러오는 데 실패했습니다.');
      }
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % truthDetectiveSteps.length);
      }, 1500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const loadNews = useCallback(async (category: NewsCategory, query?: string) => {
    setNewsLoading(true);
    try {
      let news: NewsItem[] = [];

      if (category === 'Debate') {
        const { fetchGroupedNews } = await import('./services/geminiService');
        const grouped = await fetchGroupedNews('Korean');
        
        // Initialize mock votes and comments
        const initializedGrouped = grouped.map(topic => ({
          ...topic,
          votes: {
            agree: Math.floor(Math.random() * 100) + 50,
            disagree: Math.floor(Math.random() * 50) + 20,
            neutral: Math.floor(Math.random() * 40) + 15
          }
        }));
        
        setGroupedNews(initializedGrouped);
        
        setComments(prev => {
          const updated = { ...prev };
          initializedGrouped.forEach(topic => {
            if (!updated[topic.id]) {
              updated[topic.id] = [
                { id: '1', topicId: topic.id, author: '팩트체커_01', text: '이 이슈는 단순한 정치적 갈등을 넘어 경제적 파급효과가 큽니다. 각 매체의 관점 차이를 분석해보니 핵심은 정책의 실효성 여부인 것 같네요.', time: '5분 전', likes: 12, type: 'neutral' },
                { id: '2', topicId: topic.id, author: '비판적시각', text: '보수 매체와 진보 매체의 헤드라인 차이가 너무 극명하네요. 사실 관계는 동일한데 해석이 이렇게 다를 수 있다는 게 놀랍습니다.', time: '12분 전', likes: 8, type: 'disagree' },
                { id: '3', topicId: topic.id, author: '중도주의자', text: '양쪽의 주장을 모두 들어보니 타협점이 보입니다. 극단적인 보도보다는 이런 비교 분석이 더 필요하다고 봅니다.', time: '25분 전', likes: 15, type: 'agree' }
              ];
            }
          });
          return updated;
        });

        setTopNews([]);
        setNewsLoading(false);
        setDisplayLimit(12);
        return;
      }

      if (category === 'World') {
        const crawledNews = await fetchRealtimeNews('world', undefined, 50);
        news = (crawledNews as NewsItem[]).map(item => ({ ...item, category: 'World' }));
      } else if (category === 'Breaking') {
        // Combined fetch for Breaking: 8 from each major category
        const categoriesToCombine: NewsCategory[] = ['Politics', 'Economy', 'Society', 'IT/Tech', 'World', 'Entertainment', 'Sports'];
        const results = await Promise.all(categoriesToCombine.map(async (cat) => {
          const apiCat = apiCategoryMap[cat] || 'general';
          try {
            const crawled = await fetchRealtimeNews(apiCat, undefined, 15);
            return crawled.slice(0, 12).map(item => ({ ...item, category: cat })); 
          } catch (e) {
            return [];
          }
        }));
        news = results.flat();
      } else if (category === 'Real Estate' && user?.interestedRegions?.length) {
        const regionQuery = user.interestedRegions.join(' ');
        const crawledNews = await fetchRealtimeNews('land', regionQuery, 50);
        news = (crawledNews as NewsItem[]).map(item => ({ ...item, category: 'Real Estate' }));
      } else if (category === 'Search') {
        // If alerts exist and no specific search query is provided, use alert keywords
        let finalQuery = query;
        if (!finalQuery && alerts.length > 0) {
          finalQuery = alerts.map(a => a.keyword).join(' ');
        }
        const crawledNews = await fetchRealtimeNews('general', finalQuery, 50); 
        news = (crawledNews as NewsItem[]).map(item => ({ ...item, category: 'Search' }));
      } else if (category === 'Stock' && user?.interestedStocks?.length) {
        const stockQuery = user.interestedStocks.join(' ');
        const crawledNews = await fetchRealtimeNews('finance', stockQuery, 50);
        news = (crawledNews as NewsItem[]).map(item => ({ ...item, category: 'Stock' }));
      } else {
        const apiCategory = apiCategoryMap[category] || 'general';
        const crawledNews = await fetchRealtimeNews(apiCategory, query, 50); 
        news = (crawledNews as NewsItem[]).map(item => ({ ...item, category: category }));
      }
      
      // Filter for last 24 hours (if possible to parse time)
      const filteredByRecency = news.filter(item => {
        if (!item.time) return true;
        const t = item.time.toLowerCase();
        
        // "1시간 전", "23시간 전", "방금 전", "59분 전"
        if (t.includes('분 전') || t.includes('초 전') || t.includes('시간 전') || t.includes('방금')) {
          const match = t.match(/(\d+)시간 전/);
          if (match && parseInt(match[1]) > 24) return false;
          return true;
        }
        
        // "1일 전" -> usually means around 24h, but we'll allow it if we have few results
        if (t.includes('일 전')) {
          const match = t.match(/(\d+)일 전/);
          if (match && parseInt(match[1]) > 1) return false;
          return true; // Allow "1일 전"
        }

        // Date strings like "2024.02.27" or "02.27"
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}.${month}.${day}`;
        const todayShort = `${month}.${day}`;
        
        if (t.includes(todayStr) || t.includes(todayShort)) return true;
        
        // If it's yesterday's date, it might be within 24h
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
        const yDay = String(yesterday.getDate()).padStart(2, '0');
        const yesterdayShort = `${yMonth}.${yDay}`;
        if (t.includes(yesterdayShort)) return true;

        return false;
      });

      // If filtering is too strict and we have very few news, fallback to original news
      const finalNews = filteredByRecency.length >= 8 ? filteredByRecency : news;

      // Ensure the format matches NewsItem
      const formattedNews = finalNews.map(item => ({
        ...item,
        urgency: item.urgency || Math.floor(Math.random() * 3) + 1,
        credibility_hint: item.credibility_hint || 80 + Math.floor(Math.random() * 15)
      }));
      
      setTopNews(formattedNews as NewsItem[]);
      setDisplayLimit(12); // Reset display limit on category change
      setNewsPage(1); // Reset page on category change
    } catch (err) { 
      console.error(err); 
    } finally { 
      setNewsLoading(false); 
    }
  }, [user, alerts]);

  // 2. Strategic Advancement logic: Interest-based News Refinement
  // Consolidated news loading effect
  const lastFetchRef = React.useRef<string>('');

  useEffect(() => {
    // Only fetch if on Home tab and no analysis result is currently displayed
    if (activeTab !== 'Home' || result) return;

    const fetchKey = `${selectedCategory}-${searchQuery || ''}-${user?.uid || 'guest'}-${user?.interestedRegions?.join(',') || ''}-${user?.interestedStocks?.join(',') || ''}`;
    
    if (fetchKey !== lastFetchRef.current) {
      loadNews(selectedCategory, searchQuery);
      lastFetchRef.current = fetchKey;
    }
  }, [selectedCategory, activeTab, result, loadNews, searchQuery, user?.uid, user?.interestedRegions, user?.interestedStocks]);

  const handleLoadMoreNews = async () => {
    if (newsLoading) return;
    
    // If we still have enough local items to show, just increase display limit
    if (displayLimit + 12 <= topNews.length) {
      setDisplayLimit(prev => prev + 12);
      return;
    }
    
    // Otherwise, fetch more from API
    setNewsLoading(true);
    try {
      const nextPage = newsPage + 1;

      let newArticles: NewsItem[] = [];
      const startParam = (nextPage - 1) * 50 + 1;

      if (selectedCategory === 'Breaking') {
        const categoriesToCombine: NewsCategory[] = ['Politics', 'Economy', 'Society', 'IT/Tech', 'World', 'Entertainment', 'Sports'];
        const results = await Promise.all(categoriesToCombine.map(async (cat) => {
          const apiCat = apiCategoryMap[cat] || 'general';
          try {
            const crawled = await fetchRealtimeNews(apiCat, undefined, 15, startParam);
            return crawled.slice(0, 12).map(item => ({ ...item, category: cat })); 
          } catch (e) {
            return [];
          }
        }));
        newArticles = results.flat() as NewsItem[];
      } else if (selectedCategory === 'Real Estate' && user?.interestedRegions?.length) {
        const regionQuery = user.interestedRegions.join(' ');
        const crawledNews = await fetchRealtimeNews('land', regionQuery, 50, startParam);
        newArticles = (crawledNews as NewsItem[]).map(item => ({ ...item, category: 'Real Estate' }));
      } else if (selectedCategory === 'Stock' && user?.interestedStocks?.length) {
        const stockQuery = user.interestedStocks.join(' ');
        const crawledNews = await fetchRealtimeNews('finance', stockQuery, 50, startParam);
        newArticles = (crawledNews as NewsItem[]).map(item => ({ ...item, category: 'Stock' }));
      } else if (selectedCategory === 'Search') {
        let finalQuery = searchQuery;
        if (!finalQuery && alerts.length > 0) {
          finalQuery = alerts.map(a => a.keyword).join(' ');
        }
        const crawledNews = await fetchRealtimeNews('general', finalQuery, 50, startParam); 
        newArticles = (crawledNews as NewsItem[]).map(item => ({ ...item, category: 'Search' }));
      } else {
        const apiCategory = apiCategoryMap[selectedCategory] || 'general';
        const crawledNews = await fetchRealtimeNews(apiCategory, searchQuery, 50, startParam); 
        newArticles = (crawledNews as NewsItem[]).map(item => ({ ...item, category: selectedCategory }));
      }

      // Ensure the format matches NewsItem
      const formattedNews = newArticles.map(item => ({
        ...item,
        urgency: item.urgency || Math.floor(Math.random() * 3) + 1,
        credibility_hint: item.credibility_hint || 80 + Math.floor(Math.random() * 15)
      }));

      setTopNews(prev => {
        // Filter out duplicates based on URL
        const existingUrls = new Set(prev.map(n => n.url));
        const uniqueNew = formattedNews.filter(n => !existingUrls.has(n.url));
        return [...prev, ...uniqueNew];
      });
      setNewsPage(nextPage);
      setDisplayLimit(prev => prev + 12);
    } catch (err) {
      console.error(err);
    } finally {
      setNewsLoading(false);
    }
  };

  const handleAnalyze = async (input: InputData) => {
    if (input.inputType === 'url' && !input.url) return;
    if (input.inputType === 'manual' && !input.body) return;

    setLoading(true);
    setLoadingStep(0);
    setError(null);
    setResult(null); // Clear previous result to prevent "wrong analysis" perception

    try {
      let analysisInput: InputData = { 
        ...input, 
        language: 'Korean' as const,
        interestedRegions: user?.interestedRegions,
        category: selectedCategory
      };
      
      // URL인 경우 서버에서 본문 추출 시도
      if (input.inputType === 'url') {
        try {
          setLoadingStep(0); // "실시간 데이터 수집" 단계
          const extractRes = await fetch(`/api/extract?url=${encodeURIComponent(input.url)}`);
          if (extractRes.ok) {
            const { content, title } = await extractRes.json();
            if (content) {
              // 추출된 내용이 분석 실패 알림인 경우
              if (content.startsWith('[분석 실패 알림]')) {
                throw new Error(content);
              }
              analysisInput.body = content;
            }
            if (title && !analysisInput.title) {
              analysisInput.title = title;
            }
          } else {
            const errData = await extractRes.json();
            throw new Error(errData.details || errData.error || "본문 수집 중 서버 오류가 발생했습니다.");
          }
        } catch (extractErr: any) {
          console.warn("Content extraction failed:", extractErr);
          // If it's a specific "Fail Notification" from our server, we stop and show it
          if (extractErr.message && extractErr.message.includes('[분석 실패 알림]')) {
             throw extractErr;
          }
          // Otherwise, we might proceed with just the URL, but it's better to warn the user
          // throw new Error("링크에서 보도 내용을 가져오지 못했습니다. 기사 전문을 직접 복사하여 분석해 주세요.");
        }
      }

      const data = await analyzeContent(analysisInput);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNeutralArticle = async (data: TruthEyesAnalysis, level: 'easy' | 'normal' | 'expert') => {
    setLoading(true);
    setLoadingStep(5); // Last step
    
    try {
      const { generateNeutralFactCheckNews } = await import('./services/geminiService');
      const news = await generateNeutralFactCheckNews(data, level);
      console.log("Generated Neutral Article:", news);
      
      setNeutralArticleModal({ isOpen: true, title: news.title, content: news.content });
    } catch (err: any) {
      console.error("Failed to generate neutral article", err);
      setError("기사 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMultiSourceReport = async () => {
    if (!searchQuery && alerts.length === 0) return;
    
    setLoading(true);
    setLoadingStep(0);
    setError(null);
    setResult(null);

    try {
      // 1. Fetch news articles for the query
      setLoadingStep(0);
      let query = searchQuery;
      if (!query && alerts.length > 0) {
        query = alerts.map(a => a.keyword).join(' ');
      }
      
      const apiCategory = apiCategoryMap[selectedCategory] || 'general';
      const articles = await fetchRealtimeNews(apiCategory, query, 10);
      
      if (!articles || (articles as NewsItem[]).length === 0) {
        throw new Error("분석할 뉴스를 찾을 수 없습니다.");
      }

      setLoadingStep(1);
      const data = await generateMultiSourceReport(query, articles as NewsItem[]);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '멀티 소스 리포트 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedCategory('Search');
      loadNews('Search', searchQuery);
    }
  };

  const lowCredibilityNews = useMemo(() => {
    return topNews.filter(news => (news.credibility_hint || 100) <= 70);
  }, [topNews]);

  const filteredNews = useMemo(() => {
    let filtered = topNews;
    
    // Sub-category filter for Breaking
    if (selectedCategory === 'Breaking' && subCategory !== 'All') {
      filtered = filtered.filter(news => news.category === subCategory);
    }
    
    // Text search filter
    if (!filterText.trim()) return filtered;
    const lowerFilter = filterText.toLowerCase();
    return filtered.filter(news => 
      news.title.toLowerCase().includes(lowerFilter) || 
      news.source.toLowerCase().includes(lowerFilter)
    );
  }, [topNews, filterText, selectedCategory, subCategory]);

  const sortedTopics = useMemo(() => [...groupedNews].sort((a, b) => {
    if(debateSort === 'latest') return -1;
    const vA = (a.votes?.agree || 0) + (a.votes?.disagree || 0) + (a.votes?.neutral || 0);
    const vB = (b.votes?.agree || 0) + (b.votes?.disagree || 0) + (b.votes?.neutral || 0);
    return vB - vA;
  }), [groupedNews, debateSort]);

  return (
    <div className="min-h-screen pb-32 px-4 md:px-8 bg-[#02040a] text-slate-300 font-['Noto_Sans_KR']">
      
      {/* 0. Main Navigation and Page Switching */}
      <AnimatePresence mode="wait">
        {showMyPage && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 z-[200] bg-[#02040a] overflow-y-auto"
          >
            <header className="max-w-6xl mx-auto pt-10 pb-8 flex justify-between items-center px-4">
              <h1 
                onClick={() => setShowMyPage(false)}
                className="text-4xl font-black text-white tracking-tighter uppercase cursor-pointer"
              >
                TRUTH<span className="text-blue-500">EYES</span> AI
              </h1>
              <button 
                onClick={() => setShowMyPage(false)}
                className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm font-black text-slate-400 hover:text-white transition-all uppercase shadow-2xl"
              >
                대시보드로 돌아가기
              </button>
            </header>
            <MyPage />
          </motion.div>
        )}
      </AnimatePresence>
    
      {/* 뉴스 기사 아이프레임 모달 */}
      <NeutralArticleModal 
        isOpen={neutralArticleModal.isOpen} 
        onClose={() => setNeutralArticleModal(prev => ({...prev, isOpen: false}))}
        title={neutralArticleModal.title}
        content={neutralArticleModal.content}
      />
      <AnimatePresence>
        {selectedArticleForIframe && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col"
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="hidden md:block">
                  <h3 className="text-sm font-black text-white truncate max-w-md">{selectedArticleForIframe.title}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedArticleForIframe.source}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl">
                <button 
                  onClick={() => setViewMode('reader')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'reader' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  리더 뷰 (Reader View)
                </button>
                <button 
                  onClick={() => setViewMode('iframe')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'iframe' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  원문 사이트 (Original Site)
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    handleAnalyze({
                      inputType: 'url',
                      url: selectedArticleForIframe.url,
                      title: selectedArticleForIframe.title,
                      language: 'Korean'
                    });
                    setSelectedArticleForIframe(null);
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                >
                  리포트 생성
                </button>
                <button 
                  onClick={() => window.open(selectedArticleForIframe.url, '_blank')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  새 창에서 열기
                </button>
                <div className="w-px h-8 bg-slate-700 mx-1 hidden md:block"></div>
                <button 
                  onClick={() => setSelectedArticleForIframe(null)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5"/></svg>
                  닫기
                </button>
              </div>
            </div>

            {/* 본문 영역 */}
            <div className="flex-1 bg-white relative overflow-hidden">
              {viewMode === 'iframe' ? (
                <>
                  <iframe 
                    src={selectedArticleForIframe.url.includes('naver.com') || 
                         selectedArticleForIframe.url.includes('daum.net') || 
                         selectedArticleForIframe.url.includes('chosun.com') ||
                         selectedArticleForIframe.url.includes('donga.com') ||
                         selectedArticleForIframe.url.includes('joongang') ||
                         selectedArticleForIframe.url.includes('hani.co.kr') ||
                         selectedArticleForIframe.url.includes('khan.co.kr') ||
                         selectedArticleForIframe.url.includes('mk.co.kr') ||
                         selectedArticleForIframe.url.includes('hankyung') ||
                         selectedArticleForIframe.url.includes('sbs.co.kr') ||
                         selectedArticleForIframe.url.includes('kbs.co.kr') ||
                         selectedArticleForIframe.url.includes('mbc.co.kr') ||
                         selectedArticleForIframe.url.includes('yna.co.kr')
                         ? `/api/proxy?url=${encodeURIComponent(selectedArticleForIframe.url)}` 
                         : selectedArticleForIframe.url} 
                    className="w-full h-full border-none"
                    title="Article Content"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                  {/* CSP 경고 안내 */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="bg-black/80 p-4 rounded-xl text-white text-xs text-center max-w-xs">
                      일부 언론사는 보안 정책상 이 화면에서 직접 볼 수 없을 수 있습니다. 화면이 나오지 않으면 'Reader View' 또는 '새 창에서 열기'를 이용해 주세요.
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full overflow-y-auto bg-slate-50 p-6 md:p-12">
                  <div className="max-w-3xl mx-auto">
                    {modalLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">본문 추출 중 (Extracting)...</p>
                      </div>
                    ) : modalReaderContent ? (
                      <article className="prose prose-slate lg:prose-lg max-w-none">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 leading-tight">
                          {modalReaderContent.title || selectedArticleForIframe.title}
                        </h1>
                        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-200">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                            {selectedArticleForIframe.source}
                          </span>
                          <span className="text-slate-400 text-xs font-medium">
                            {selectedArticleForIframe.time}
                          </span>
                        </div>
                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                          {modalReaderContent.content}
                        </div>
                        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
                          <p className="text-slate-400 text-xs mb-4">본문 추출 결과입니다. 전체 내용을 보려면 원문 사이트를 방문해 주세요.</p>
                          <button 
                            onClick={() => window.open(selectedArticleForIframe.url, '_blank')}
                            className="text-blue-600 font-bold hover:underline"
                          >
                            원문 기사 보러가기 →
                          </button>
                        </div>
                      </article>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">본문을 가져올 수 없습니다</h3>
                        <p className="text-slate-500 mb-6">해당 사이트의 보안 정책으로 인해 본문 추출이 차단되었습니다.</p>
                        <button 
                          onClick={() => setViewMode('iframe')}
                          className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold"
                        >
                          원문 사이트 시도하기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 실시간 뉴스 티커 */}
      <div className="fixed top-0 left-0 w-full z-[150] bg-blue-600/10 backdrop-blur-md border-b border-blue-500/20 py-2 overflow-hidden">
        <div className="flex items-center whitespace-nowrap animate-[marquee_30s_linear_infinite] hover:pause">
          {[...topNews, ...topNews].map((news, i) => (
            <div key={i} onClick={() => setSelectedArticleForIframe(news)} className="flex items-center gap-4 px-8 border-r border-blue-500/20 cursor-pointer hover:bg-white/5 transition-colors">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">BREAKING</span>
              <span className="text-xs font-bold text-white/80">{news.title}</span>
              <span className="text-[10px] text-slate-500">{news.source}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 고속 분석 로딩 오버레이 */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#02040a]/95 backdrop-blur-3xl overflow-hidden"
          >
            {/* 배경 스캔 라인 효과 */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(59,130,246,0.1)_50%,transparent_100%)] bg-[length:100%_4px] animate-[scan_4s_linear_infinite]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              {/* 메인 로더 애니메이션 */}
              <div className="w-72 h-72 relative flex items-center justify-center mb-12">
                {/* 바깥쪽 회전 링 */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-blue-500/20 rounded-full" 
                />
                
                {/* 중간 회전 링 */}
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 border border-blue-400/30 rounded-full border-t-blue-500 border-t-2" 
                />

                {/* 안쪽 맥동하는 원 */}
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-12 bg-blue-600/10 rounded-full blur-xl" 
                />

                <div className="relative flex flex-col items-center">
                  <motion.div 
                    key={loadingStep}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl mb-2"
                  >
                    {truthDetectiveSteps[loadingStep]?.icon}
                  </motion.div>
                  <div className="text-blue-500 text-4xl font-black italic tracking-tighter">TRUTH</div>
                  <div className="text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">Analyzing</div>
                </div>
              </div>

              {/* 단계별 텍스트 애니메이션 */}
              <div className="text-center space-y-6 max-w-md px-6">
                <div className="space-y-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={loadingStep}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                        {truthDetectiveSteps[loadingStep]?.title}
                      </h2>
                      <p className="text-slate-400 text-sm leading-relaxed mt-2 min-h-[3rem]">
                        {truthDetectiveSteps[loadingStep]?.desc}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* 진행 상태 바 */}
                <div className="space-y-3">
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <motion.div 
                      className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                      initial={{ width: "0%" }}
                      animate={{ width: `${((loadingStep + 1) / truthDetectiveSteps.length) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      데이터 분석 중 {loadingStep + 1} / {truthDetectiveSteps.length} 단계
                    </span>
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                      {Math.round(((loadingStep + 1) / truthDetectiveSteps.length) * 100)}% 완료됨
                    </span>
                  </div>
                </div>
              </div>

              {/* 하단 시스템 로그 스타일 텍스트 */}
              <div className="mt-16 font-mono text-[9px] text-slate-700 uppercase tracking-tighter space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                  <span>System: Initializing Deep Forensic Engine...</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                  <span>Kernel: Multi-Agent Consensus Protocol Active</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="max-w-6xl mx-auto pt-10 pb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">TRUTH<span className="text-blue-500">EYES</span> AI</h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">엘리트 미디어 포렌식 분석 시스템 v3.1 <span className="text-blue-500/50 ml-2">Visual Update</span></p>
          </div>
          {user && (
            <div className="hidden lg:flex items-center gap-4 pl-6 border-l border-slate-800">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2"/></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white uppercase tracking-widest">환영합니다, {(user.email || "").split('@')[0] || 'Guest'}님</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setShowMyPage(true); setActiveTab('Home'); setResult(null); }}
                    className="text-[10px] font-bold text-blue-500 hover:text-white uppercase text-left transition-all"
                  >
                    내 작업실 (Workspace)
                  </button>
                  <button onClick={() => setShowSettingsModal(true)} className="text-[10px] font-bold text-slate-500 hover:text-blue-500 uppercase text-left transition-all">설정 (Settings)</button>
                  <button onClick={handleLogout} className="text-[10px] font-bold text-slate-500 hover:text-red-500 uppercase text-left transition-all">로그아웃 (Logout)</button>
                </div>
              </div>
            </div>
          )}
        </div>
        <nav className="flex items-center gap-4 bg-slate-900/50 p-1 rounded-xl border border-slate-800 backdrop-blur-xl">
          <button onClick={() => { setActiveTab('Home'); setResult(null); setSelectedCategory('Breaking'); }} className={`px-6 py-2.5 rounded-lg text-sm font-black uppercase transition-all ${activeTab === 'Home' && selectedCategory !== 'Debate' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/30' : 'text-slate-500 hover:text-slate-300'}`}>
            팩트체크
          </button>
          <button onClick={() => { setActiveTab('Home'); setSelectedCategory('Debate'); }} className={`px-6 py-2.5 rounded-lg text-sm font-black uppercase transition-all ${selectedCategory === 'Debate' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/30' : 'text-slate-500 hover:text-slate-300'}`}>
            토론
          </button>
          <button 
            onClick={() => setShowMethodologyModal(true)} 
            className="px-6 py-2.5 rounded-lg text-sm font-black uppercase text-slate-500 hover:text-slate-300 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/></svg>
            분석 방법론
          </button>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto">
        {!result ? (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {error && (
                    <div className="bg-red-950/40 border border-red-800/80 p-6 rounded-3xl mb-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 text-xl">
                                ⚠️
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-base font-black text-red-200">기사 본문 수집 또는 분석 안내</h4>
                                <p className="text-xs text-red-300/90 leading-relaxed font-medium">
                                    {error}
                                </p>
                                <p className="text-[11px] text-slate-400 pt-1">
                                    💡 <strong>스마트 복구 안내:</strong> 보안 방화벽이나 페이월로 인해 URL 자동 수집이 차단된 경우, 기사 텍스트를 복사하여 <strong>[텍스트 직접 입력]</strong>에 붙여넣으시면 즉시 100% 동일하게 포렌식 분석됩니다.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            <button
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, inputType: 'manual' }));
                                    setError(null);
                                }}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center gap-2 active:scale-95"
                            >
                                <span>✍️ 텍스트 직접 입력으로 전환</span>
                            </button>
                            <button
                                onClick={() => setError(null)}
                                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition-all"
                            >
                                닫기 ✕
                            </button>
                        </div>
                    </div>
                )}
              
              {/* 1. 통합 입력 섹션: 뉴스 검색 / URL 분석 / 텍스트 분석 */}
              <div className="max-w-4xl mx-auto bg-slate-900/40 border border-slate-800 rounded-[3.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden group mb-16">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                 
                 <div className="flex flex-wrap gap-3 mb-10 p-1.5 bg-black/40 rounded-[1.5rem] w-fit border border-slate-800/50">
                    <button onClick={() => setFormData({...formData, inputType: 'search'})} className={`px-8 py-3 rounded-2xl text-sm font-black uppercase transition-all ${formData.inputType === 'search' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>뉴스 검색</button>
                    <button onClick={() => setFormData({...formData, inputType: 'url'})} className={`px-8 py-3 rounded-2xl text-sm font-black uppercase transition-all ${formData.inputType === 'url' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>URL 분석</button>
                    <button onClick={() => setFormData({...formData, inputType: 'manual'})} className={`px-8 py-3 rounded-2xl text-sm font-black uppercase transition-all ${formData.inputType === 'manual' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>텍스트 분석</button>
                 </div>

                 {formData.inputType === 'search' ? (
                   <form onSubmit={handleKeywordSearch} className="w-full relative group">
                      <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                         <svg className="w-6 h-6 text-slate-600 group-focus-within:text-blue-500 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="3"/></svg>
                      </div>
                      <input 
                         type="text"
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         placeholder="검색어를 입력하여 실시간 뉴스를 추적하세요..."
                         className="w-full bg-slate-950 border border-slate-800 rounded-3xl pl-16 pr-48 py-6 text-lg font-black text-white focus:border-blue-500 focus:ring-[12px] focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                      />
                      <button type="submit" className="absolute right-4 top-3 bottom-3 px-10 bg-blue-600 rounded-2xl text-sm font-black text-white hover:bg-blue-500 active:scale-95 transition-all uppercase shadow-xl shadow-blue-500/40">검색</button>
                   </form>
                 ) : formData.inputType === 'url' ? (
                   <div className="w-full relative group">
                      <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeWidth="2.5"/></svg>
                      </div>
                      <input 
                        type="url" 
                        value={formData.url} 
                        onChange={e => setFormData({...formData, url: e.target.value})} 
                        placeholder="분석할 뉴스/유튜브 URL을 입력하십시오..." 
                        className="w-full bg-slate-950 border border-slate-800 rounded-3xl pl-16 pr-48 py-6 text-lg font-black text-white focus:border-blue-500 focus:ring-[12px] focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-600 shadow-inner" 
                      />
                      <button onClick={() => handleAnalyze(formData)} className="absolute right-4 top-3 bottom-3 px-10 bg-blue-600 rounded-2xl text-sm font-black text-white hover:bg-blue-500 active:scale-95 transition-all uppercase shadow-xl shadow-blue-500/40">분석</button>
                   </div>
                 ) : (
                   <div className="space-y-6">
                      <textarea 
                        rows={8} 
                        value={formData.body} 
                        onChange={e => setFormData({...formData, body: e.target.value})} 
                        placeholder="분석할 텍스트 내용을 붙여넣으십시오..." 
                        className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-8 py-8 text-base font-medium focus:border-blue-500 outline-none transition-all shadow-inner placeholder:text-slate-700 leading-relaxed" 
                      />
                      <button onClick={() => handleAnalyze(formData)} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl transition-all uppercase tracking-[0.2em] text-sm shadow-2xl shadow-blue-900/40 active:scale-[0.98]">텍스트 정밀 분석 시작</button>
                   </div>
                 )}
              </div>

              {/* 2. 실시간 뉴스 추적 시스템 & 최신 보도 피드 */}
              <div className="space-y-8">
                 {selectedCategory === 'Real Estate' && (
                   <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                     <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-blue-500" />
                         <h4 className="text-sm font-black text-white uppercase tracking-widest">부동산 관심 지역 관리</h4>
                       </div>
                       <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">설정된 지역 위주로 뉴스를 수집 및 분석합니다</span>
                     </div>
                     <div className="flex flex-wrap gap-3 mb-6">
                       {user?.interestedRegions?.map(region => (
                         <span key={region} className="px-4 py-2 bg-blue-600/10 border border-blue-500/30 rounded-xl text-xs font-black text-blue-400 flex items-center gap-3 group transition-all hover:bg-blue-600/20">
                           {region}
                           <button onClick={() => handleRemoveRegion(region)} className="text-slate-500 hover:text-red-500 transition-colors">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg>
                           </button>
                         </span>
                       ))}
                       <div className="relative">
                         <input 
                           type="text" 
                           placeholder="지역 추가 (예: 강남, 판교)" 
                           className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all w-48 placeholder:text-slate-700"
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               handleAddRegion((e.target as HTMLInputElement).value);
                               (e.target as HTMLInputElement).value = '';
                             }
                           }}
                         />
                       </div>
                     </div>
                     <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10">
                       <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                         * 지역을 추가하면 해당 지역의 실거래가 데이터, 정책 영향, 시장 심리 분석이 우선적으로 적용됩니다.
                       </p>
                     </div>
                   </div>
                 )}
                 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-800/50 pb-8">
                    <div className="space-y-6 flex-1">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] relative">
                            실시간 뉴스 추적 시스템
                            {newsLoading && (
                              <div className="absolute -bottom-2 left-0 w-full h-0.5 bg-slate-800 overflow-hidden">
                                <div className="h-full bg-blue-500 animate-[loading_1.5s_infinite_ease-in-out]" />
                              </div>
                            )}
                          </h3>
                       </div>
                       <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {categories.map(cat => (
                            <button 
                              key={cat} 
                              onClick={() => { setSelectedCategory(cat); setFilterText(''); }} 
                              className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-black border uppercase transition-all tracking-wider ${selectedCategory === cat ? 'bg-white border-white text-black shadow-xl shadow-white/5' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'}`}
                            >
                              {categoryLabels[cat]}
                            </button>
                          ))}
                       </div>

                       {/* Breaking 뉴스 하위 필터 */}
                       {/* REMOVED: Breaking 뉴스 하위 필터 */}
                    </div>
                    
                    {/* 키워드 검색 폼 */}

                 </div>

                 {/* 피드 필터링 및 결과 (8개 제한) */}
                 <div className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                       <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">
                          {selectedCategory === 'Search' ? `"${searchQuery}" 검색 결과` : `${categoryLabels[selectedCategory]} 최신 보도`}
                       </span>
                       <input 
                          type="text" 
                          value={filterText}
                          onChange={e => setFilterText(e.target.value)}
                          placeholder="결과 내 필터링..." 
                          className="bg-transparent text-base font-bold text-blue-500 outline-none placeholder:text-slate-800 border-b border-slate-800 focus:border-blue-500 py-2 transition-all w-48 focus:w-64"
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {selectedCategory === 'Debate' && (
                          <div className="col-span-full space-y-16">
                            {/* 인기 토론 댓글 영역 */}
                            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
                              <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-500">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2"/></svg>
                                </div>
                                <div>
                                  <h4 className="text-xl font-black text-white uppercase tracking-tight">인기 토론 댓글</h4>
                                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">실시간 가장 많은 공감을 얻은 의견들</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {(Object.values(comments).flat() as Comment[]).sort((a, b) => b.likes - a.likes).slice(0, 3).map((comment, idx) => (
                                  <div key={idx} className="bg-slate-950/50 border border-slate-800/50 rounded-2xl p-6 hover:border-blue-500/30 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                                          {comment.author.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400">{comment.author}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-blue-500">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M14 10h4.708c.94 0 1.667.767 1.667 1.708 0 .167-.024.333-.071.492l-2.167 7.333A1.667 1.667 0 0116.542 21H7.333A1.667 1.667 0 015.667 19.333V10c0-.442.175-.867.488-1.18l6.18-6.18a.833.833 0 011.18 1.18L12.333 10H14z"/></svg>
                                        <span className="text-[10px] font-black">{comment.likes}</span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 italic">"{comment.text}"</p>
                                    <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center">
                                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                                        comment.type === 'agree' ? 'bg-emerald-500/10 text-emerald-500' : 
                                        comment.type === 'disagree' ? 'bg-red-500/10 text-red-500' : 
                                        'bg-blue-500/10 text-blue-500'
                                      }`}>
                                        {comment.type === 'agree' ? '찬성 의견' : comment.type === 'disagree' ? '반대 의견' : '중립 의견'}
                                      </span>
                                      <button 
                                        onClick={() => {
                                          setActiveDiscussion(comment.topicId);
                                          const el = document.getElementById(`topic-${comment.topicId}`);
                                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="text-[8px] font-black text-slate-600 hover:text-blue-500 uppercase transition-all"
                                      >
                                        토론 참여 →
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                                                        <div className="flex items-center gap-2 mb-6">
                               <button onClick={() => setDebateSort('latest')} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all ${debateSort === 'latest' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>최신순</button>
                               <button onClick={() => setDebateSort('popular')} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all ${debateSort === 'popular' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>인기순</button>
                            </div>
                            {sortedTopics.slice(0, displayLimit).map((topic) => {
                              const totalVotes = (topic.votes?.agree || 0) + (topic.votes?.disagree || 0) + (topic.votes?.neutral || 0);
                              const agreeRate = totalVotes > 0 ? Math.round((topic.votes?.agree || 0) / totalVotes * 100) : 33;
                              const disagreeRate = totalVotes > 0 ? Math.round((topic.votes?.disagree || 0) / totalVotes * 100) : 33;
                              const neutralRate = 100 - agreeRate - disagreeRate;

                              return (
                                <div key={topic.id} id={`topic-${topic.id}`} className="space-y-8 bg-slate-900/10 p-6 md:p-10 rounded-[3rem] border border-slate-800/30 hover:border-blue-500/20 transition-all shadow-2xl">
                                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                    <div className="flex-1 space-y-4">
                                      <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-blue-600/20 text-blue-500 text-[10px] font-black rounded-lg uppercase tracking-[0.2em] border border-blue-500/20 shadow-lg shadow-blue-900/10">TOPIC #{topic.id.substring(0, 4).toUpperCase()}</span>
                                        <div className="h-px w-20 bg-gradient-to-r from-blue-500/40 to-transparent" />
                                      </div>
                                      <h3 
                                        className="text-2xl md:text-3xl font-black text-white tracking-tight cursor-pointer hover:text-blue-400 transition-colors leading-tight"
                                        onClick={() => setSelectedArticleForIframe(topic.articles[0] as NewsItem)}
                                      >
                                        {topic.topic_title}
                                      </h3>
                                      <div className="flex flex-wrap gap-4 pt-2">
                                        <button 
                                          onClick={() => {
                                            setActiveDiscussion(topic.id);
                                            setTimeout(() => {
                                              const el = document.getElementById(`comments-${topic.id}`);
                                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }, 100);
                                          }}
                                          className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 group"
                                        >
                                          <svg className="w-4 h-4 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" strokeWidth="2.5"/></svg>
                                          토론 참여하기
                                        </button>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/50 rounded-xl border border-slate-800">
                                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{comments[topic.id]?.length || 0} OPINIONS</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* 투표 현황 그래프 (강화된 UI) */}
                                    <div className="w-full lg:w-[400px] bg-slate-950/80 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-xl relative group overflow-hidden">
                                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
                                      </div>
                                      
                                      <div className="flex justify-between items-end mb-6">
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">실시간 여론 동향</p>
                                          <p className="text-xl font-black text-white">{totalVotes} <span className="text-[10px] text-slate-500">VOTES</span></p>
                                        </div>
                                        <div className="flex -space-x-2">
                                          {[...Array(4)].map((_, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-500 overflow-hidden">
                                              <img src={`https://i.pravatar.cc/100?u=${topic.id}-${i}`} alt="user" className="w-full h-full object-cover" />
                                            </div>
                                          ))}
                                          <div className="w-6 h-6 rounded-full border-2 border-slate-950 bg-blue-600 flex items-center justify-center text-[8px] font-black text-white">+</div>
                                        </div>
                                      </div>

                                      <div className="space-y-4">
                                        <div className="flex justify-between text-[10px] font-black uppercase">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="text-slate-400">찬성 <span className="text-white ml-1">{agreeRate}%</span></span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                            <span className="text-slate-400">중립 <span className="text-white ml-1">{neutralRate}%</span></span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,44,44,0.5)]" />
                                            <span className="text-slate-400">반대 <span className="text-white ml-1">{disagreeRate}%</span></span>
                                          </div>
                                        </div>
                                        
                                        <div className="h-4 w-full bg-slate-900/50 rounded-full overflow-hidden flex border border-slate-800 shadow-inner">
                                          <motion.div initial={{ width: 0 }} animate={{ width: `${agreeRate}%` }} className="h-full bg-emerald-500 relative" />
                                          <motion.div initial={{ width: 0 }} animate={{ width: `${neutralRate}%` }} className="h-full bg-blue-500 relative" />
                                          <motion.div initial={{ width: 0 }} animate={{ width: `${disagreeRate}%` }} className="h-full bg-red-500 relative" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {topic.articles.map((article, aIdx) => (
                                      <div 
                                        key={aIdx} 
                                        onClick={() => setSelectedArticleForIframe(article as NewsItem)}
                                        className="bg-slate-900/40 border border-slate-800 rounded-[2rem] hover:border-blue-500/30 transition-all flex flex-col group h-full shadow-xl hover:shadow-blue-900/10 backdrop-blur-sm overflow-hidden cursor-pointer"
                                      >
                                        <div className="h-40 w-full overflow-hidden relative bg-slate-950">
                                          <img 
                                            src={article.image} 
                                            alt={article.title} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-70 group-hover:opacity-100"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.src = `https://picsum.photos/seed/${encodeURIComponent(article.title.substring(0, 10))}/600/400`;
                                            }}
                                          />
                                          <div className="absolute top-4 left-4">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg ${
                                              article.perspective === 'Left' || article.perspective === 'Pro' ? 'bg-blue-600 text-white' :
                                              article.perspective === 'Right' || article.perspective === 'Con' ? 'bg-red-600 text-white' :
                                              'bg-slate-700 text-white'
                                            }`}>
                                              {article.perspective_label}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col space-y-4">
                                          <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{article.source}</span>
                                            <span className="text-[10px] text-slate-600 font-bold">{article.time}</span>
                                          </div>
                                          <h4 className="text-sm font-black text-white leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">{article.title}</h4>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* 토론 커뮤니티 섹션 */}
                                  <div id={`comments-${topic.id}`} className="mt-12 bg-slate-950/40 border border-slate-800/50 rounded-[2.5rem] p-8 md:p-12 shadow-inner">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                                      <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-12 h-12 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-xl shadow-blue-900/10">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" strokeWidth="2.5"/></svg>
                                          </div>
                                          <div className="space-y-1">
                                            <h4 className="text-xl font-black text-white uppercase tracking-tight">쟁점 토널리티 커뮤니티</h4>
                                            <div className="flex items-center gap-3">
                                              <span className="px-2 py-0.5 bg-blue-600 text-[8px] font-black text-white rounded-md uppercase animate-pulse">LIVE</span>
                                              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">{comments[topic.id]?.length || 0} PARTICIPANTS</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 shadow-2xl">
                                        <button 
                                          onClick={() => handleVote(topic.id, 'agree')}
                                          className={`px-6 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${
                                            userVotes[topic.id] === 'agree' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'text-slate-500 hover:text-emerald-500'
                                          }`}
                                        >
                                          찬성
                                        </button>
                                        <button 
                                          onClick={() => handleVote(topic.id, 'neutral')}
                                          className={`px-6 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${
                                            userVotes[topic.id] === 'neutral' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-500 hover:text-blue-500'
                                          }`}
                                        >
                                          중립
                                        </button>
                                        <button 
                                          onClick={() => handleVote(topic.id, 'disagree')}
                                          className={`px-6 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${
                                            userVotes[topic.id] === 'disagree' ? 'bg-red-600 text-white shadow-lg shadow-red-900/30' : 'text-slate-500 hover:text-red-500'
                                          }`}
                                        >
                                          반대
                                        </button>
                                      </div>
                                    </div>

                                    <div className="space-y-12">
                                      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar-slate">
                                        {(comments[topic.id] || []).length > 0 ? (comments[topic.id] || []).map(comment => (
                                          <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={comment.id} className="group flex gap-6">
                                            <div className="flex flex-col items-center gap-3">
                                              <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-lg group-hover:border-blue-500/30 transition-all">
                                                <img src={`https://i.pravatar.cc/80?u=${comment.author}`} alt="avatar" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                              </div>
                                              <div className="w-px flex-1 bg-gradient-to-b from-slate-800 to-transparent" />
                                            </div>
                                            <div className="flex-1 bg-slate-900/40 rounded-3xl p-6 border border-transparent group-hover:border-slate-800 transition-all relative">
                                              <div className="absolute top-6 right-6">
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                                                  comment.type === 'agree' ? 'bg-emerald-500/10 text-emerald-500' : 
                                                  comment.type === 'disagree' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                  {comment.type === 'agree' ? 'PRO' : comment.type === 'disagree' ? 'CON' : 'NEUTRAL'}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-3 mb-3">
                                                <span className="text-xs font-black text-white">{comment.author}</span>
                                                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                <span className="text-[10px] text-slate-500 font-bold">{comment.time}</span>
                                              </div>
                                              <p className="text-sm text-slate-300 leading-relaxed font-medium">{comment.text}</p>
                                              <div className="mt-6 flex items-center gap-6">
                                                <button 
                                                  onClick={() => handleLikeComment(topic.id, comment.id)}
                                                  className="flex items-center gap-2 text-[10px] font-black text-slate-600 hover:text-blue-500 transition-all group/like"
                                                >
                                                  <svg className="w-4 h-4 group-hover/like:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 10h4.708c.94 0 1.667.767 1.667 1.708 0 .167-.024.333-.071.492l-2.167 7.333A1.667 1.667 0 0116.542 21H7.333A1.667 1.667 0 015.667 19.333V10c0-.442.175-.867.488-1.18l6.18-6.18a.833.833 0 011.18 1.18L12.333 10H14z" strokeWidth="2.5"/></svg>
                                                  <span>{comment.likes}</span>
                                                </button>
                                                <button className="text-[10px] font-black text-slate-700 hover:text-slate-400 transition-all uppercase tracking-widest">답글 (Reply)</button>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )) : (
                                          <div className="py-20 text-center space-y-4 bg-slate-950/30 rounded-[2rem] border border-dashed border-slate-800">
                                            <div className="text-3xl">💬</div>
                                            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">아직 의견이 없습니다. 첫 번째 의견을 남겨보세요!</p>
                                          </div>
                                        )}
                                      </div>

                                      <div className="relative pt-6 border-t border-slate-800/50">
                                        {!user && (
                                          <div className="absolute inset-0 z-10 bg-slate-950/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-8 text-center space-y-4">
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">로그인 후 토론에 참여하세요</p>
                                            <button onClick={() => setShowSignupModal(true)} className="px-8 py-3 bg-blue-600 text-white text-[10px] font-black rounded-xl uppercase shadow-2xl shadow-blue-900/40 hover:bg-blue-500 transition-all">Sign In</button>
                                          </div>
                                        )}
                                        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-inner focus-within:border-blue-500/30 transition-all">
                                          <textarea 
                                            value={newCommentText[topic.id] || ''}
                                            onChange={(e) => setNewCommentText(prev => ({ ...prev, [topic.id]: e.target.value }))}
                                            placeholder="상대방을 존중하는 건강한 토론 문화를 함께 만들어주세요..."
                                            className="w-full bg-transparent border-none text-slate-200 text-sm focus:outline-none placeholder:text-slate-800 min-h-[100px] resize-none"
                                          />
                                          <div className="flex justify-end mt-4">
                                            <button 
                                              onClick={() => handlePostComment(topic.id)}
                                              className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl uppercase shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                              의견 등록
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" strokeWidth="3"/></svg>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {selectedCategory === 'Search' && (
                          <div className="col-span-full mb-8 space-y-6">
                            <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-xl">
                              <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                                <div className="space-y-2">
                                  <h4 className="text-lg font-black text-white uppercase tracking-tight">키워드 알림 설정</h4>
                                  <p className="text-sm text-slate-500 font-medium">관심 키워드를 등록하면 관련 뉴스가 보도될 때 즉시 알림을 보내드립니다.</p>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                                  <button 
                                    onClick={toggleNotificationType}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${user?.notificationType === 'Telegram' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                  >
                                    Telegram
                                  </button>
                                  <button 
                                    onClick={toggleNotificationType}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${user?.notificationType === 'KakaoTalk' ? 'bg-yellow-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}
                                  >
                                    KakaoTalk
                                  </button>
                                </div>
                              </div>
                              
                              <div className="mt-8 flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                  <input 
                                    type="text" 
                                    placeholder="추적할 키워드를 입력하세요 (예: 삼성전자, 비트코인)"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-8 py-6 text-lg font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-600"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleAddAlert((e.target as HTMLInputElement).value);
                                        (e.target as HTMLInputElement).value = '';
                                      }
                                    }}
                                  />
                                </div>
                                <button 
                                  onClick={() => {
                                    const input = document.querySelector('input[placeholder*="추적할 키워드"]') as HTMLInputElement;
                                    if (input) {
                                      handleAddAlert(input.value);
                                      input.value = '';
                                    }
                                  }}
                                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-2xl transition-all uppercase tracking-widest shadow-lg shadow-blue-900/20"
                                >
                                  알림 추가
                                </button>
                              </div>

                              {alerts.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-slate-800/50">
                                  <p className="text-[10px] font-black text-slate-600 uppercase mb-4 tracking-widest">등록된 알림 키워드 ({alerts.length})</p>
                                  <div className="flex flex-wrap gap-3">
                                    {alerts.map(alert => (
                                      <div key={alert.id} className="group flex items-center gap-3 bg-slate-950 border border-slate-800 pl-4 pr-2 py-2 rounded-xl hover:border-blue-500/50 transition-all">
                                        <span className="text-xs font-bold text-slate-300">{alert.keyword}</span>
                                        <button 
                                          onClick={() => handleDeleteAlert(alert.id)}
                                          className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-slate-600 hover:bg-red-500 hover:text-white transition-all"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                       {newsLoading && topNews.length === 0 ? [...Array(8)].map((_, i) => (
                         <div key={i} className="h-48 bg-slate-900/40 rounded-[2rem] animate-pulse border border-slate-800/50 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                         </div>
                       )) : 
                        filteredNews.length > 0 ? (
                          filteredNews.slice(0, displayLimit).map((news, i) => (
                           <div 
                             key={i} 
                             onClick={() => setSelectedArticleForIframe(news)}
                             className="bg-slate-900/40 border border-slate-800 rounded-[2rem] hover:border-blue-500/30 transition-all flex flex-col group h-full shadow-xl hover:shadow-blue-900/10 backdrop-blur-sm overflow-hidden cursor-pointer"
                           >
                              {/* 기사 이미지 섹션 */}
                              <div className="h-40 w-full overflow-hidden relative bg-slate-950">
                                 {news.image ? (
                                  <img 
                                    src={news.image} 
                                    alt={news.title} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-70 group-hover:opacity-100"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      if (target.parentElement) {
                                        const placeholder = target.parentElement.querySelector('.image-placeholder');
                                        if (placeholder) placeholder.classList.remove('hidden');
                                      }
                                    }}
                                  />
                                ) : null}
                                <div className={`image-placeholder w-full h-full flex items-center justify-center bg-slate-900/50 ${news.image ? 'hidden' : ''}`}>
                                  <svg className="w-8 h-8 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2"/></svg>
                                </div>
                                <div className="absolute top-4 left-4 flex gap-2">
                                  <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5">{news.source}</span>
                                  {news.category && (
                                    <span className="px-3 py-1 bg-blue-600/60 backdrop-blur-md text-white rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5">
                                      {categoryLabels[news.category]}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="p-8 flex-1 flex flex-col justify-between">
                                <div className="space-y-4">
                                   <div className="flex justify-between items-start">
                                     <div className="flex flex-col gap-1">
                                       <span className="text-[10px] font-bold text-slate-700">{news.time}</span>
                                       {news.urgency && (
                                         <div className="flex items-center gap-1">
                                           <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                                           <span className="text-[9px] font-black text-red-500/70 uppercase">Urgency {news.urgency}%</span>
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                   <div className="space-y-2">
                                     {news.keyword && <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">#{news.keyword}</span>}
                                     <a href={news.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="block group/title">
                                       <h4 className="text-sm font-bold text-slate-200 line-clamp-2 group-hover/title:text-blue-400 group-hover:text-white transition-colors leading-relaxed tracking-tight">
                                         {news.title}
                                       </h4>
                                     </a>
                                   </div>
                                </div>
                                <div className="flex gap-2 mt-6">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleAnalyze({inputType: 'url', url: news.url, title: news.title, language: 'Korean'}); }} 
                                    className="flex-1 py-3.5 bg-slate-950 group-hover:bg-blue-600 text-[10px] font-black text-slate-500 group-hover:text-white rounded-2xl transition-all border border-slate-800 group-hover:border-blue-500 uppercase tracking-widest"
                                  >
                                    리포트 생성
                                  </button>
                                  <a 
                                    href={news.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-4 py-3.5 bg-slate-900 hover:bg-slate-800 text-[10px] font-black text-slate-400 hover:text-white rounded-2xl transition-all border border-slate-800 flex items-center justify-center"
                                    title="원문 기사 보기"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeWidth="2.5"/></svg>
                                  </a>
                                </div>
                              </div>
                           </div>
                         ))
                        ) : (
                          <div className="col-span-full py-32 text-center space-y-6 bg-slate-900/20 border border-dashed border-slate-800 rounded-[3rem]">
                             <div className="text-slate-800 inline-block p-6 rounded-full bg-slate-900/40 border border-slate-800">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2"/></svg>
                             </div>
                             <div className="space-y-1">
                                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">데이터를 찾을 수 없습니다</p>
                                <p className="text-xs text-slate-700 font-medium">검색어를 변경하거나 다른 카테고리를 선택해 보십시오.</p>
                             </div>
                          </div>
                        )}
                    </div>

                    {/* 더보기 버튼 */}
                    {!newsLoading && (
                      <div className="flex justify-center pt-8">
                        <button 
                          onClick={handleLoadMoreNews}
                          className="px-10 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-black text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all uppercase tracking-widest shadow-xl"
                        >
                          {categoryLabels[selectedCategory]} 뉴스 더보기
                        </button>
                      </div>
                    )}
                    
                    {newsLoading && topNews.length > 0 && (
                      <div className="flex justify-center pt-8">
                        <div className="px-10 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                          <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                          불러오는 중...
                        </div>
                      </div>
                    )}

                 </div>
              </div>

              {/* 3. 라이브 모니터링 대시보드 */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-8 mb-8">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                       <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">라이브 모니터링 대시보드</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">System Status: <span className="text-emerald-500">Active</span></span>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                       <p className="text-[10px] font-black text-slate-600 uppercase mb-1">오늘의 분석 건수</p>
                       <p className="text-2xl font-black text-white">1,284 <span className="text-[10px] text-emerald-500">+12%</span></p>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                       <p className="text-[10px] font-black text-slate-600 uppercase mb-1">평균 신뢰 지수</p>
                       <p className="text-2xl font-black text-white">72.4 <span className="text-[10px] text-slate-500">Avg</span></p>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                       <p className="text-[10px] font-black text-slate-600 uppercase mb-1">탐지된 허위 정보</p>
                       <p className="text-2xl font-black text-red-500">42 <span className="text-[10px] text-red-500/50">Critical</span></p>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                       <p className="text-[10px] font-black text-slate-600 uppercase mb-1">실시간 추적 매체</p>
                       <p className="text-2xl font-black text-blue-500">248 <span className="text-[10px] text-blue-500/50">Nodes</span></p>
                    </div>
                 </div>
              </div>
            </div>
          ) : (
           <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex justify-between items-center mb-10">
                <button onClick={() => setResult(null)} className="text-sm font-black uppercase text-slate-500 hover:text-white flex items-center gap-3 group transition-all">
                  <div className="w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center group-hover:border-blue-500 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3"/></svg>
                  </div> 
                  대시보드로 복귀
                </button>
                <div className="flex gap-4">
                  <button 
                    onClick={async () => {
                      if (!user) {
                        setShowSignupModal(true);
                        return;
                      }
                      if (!result) return;
                      try {
                        const analysesRef = collection(db, 'users', user.uid, 'saved_analyses');
                        await addDoc(analysesRef, {
                          userId: user.uid,
                          title: result.article_title,
                          url: result.original_url || '',
                          reportData: result,
                          savedAt: new Date().toISOString()
                        });
                        alert("마이페이지에 저장되었습니다!");
                      } catch (error) {
                         handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/saved_analyses`);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-black uppercase hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
                  >
                    마이페이지 저장
                  </button>
                  <button className="px-4 py-2 border border-slate-800 rounded-xl text-sm font-black text-slate-500 uppercase hover:text-white transition-all">PDF 저장</button>
                </div>
              </div>
              <AnalysisReport 
                data={result} 
                onOpenArticle={(news) => handleAnalyze({
                  inputType: 'url', 
                  url: news.url, 
                  title: news.title, 
                  language: 'Korean'
                })} 
                onGenerateNeutralArticle={handleGenerateNeutralArticle}
              />
           </div>
         )}
      </main>
      
      <footer className="max-w-6xl mx-auto mt-20 pt-10 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
        <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">© 2025 TRUTHEYES AI FORENSICS ENGINE. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-6">
          <span className="text-sm font-bold text-slate-600 uppercase">Privacy Policy</span>
          <span className="text-sm font-bold text-slate-600 uppercase">Terms of Service</span>
          <span className="text-sm font-bold text-slate-600 uppercase">API Access</span>
        </div>
      </footer>

      <MethodologyModal isOpen={showMethodologyModal} onClose={() => setShowMethodologyModal(false)} />

      {/* 회원가입 모달 */}
      {showSignupModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#02040a]/95 backdrop-blur-xl p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-4 mb-10">
              <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeWidth="2"/></svg>
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">System Access</h2>
              <p className="text-slate-400 text-sm font-bold">간편 로그인으로 트루스아이즈의<br/>모든 기능을 무료로 이용하세요.</p>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={() => loginWithGoogle()}
                className="w-full py-4 bg-white text-black font-black rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="G" />
                Google로 계속하기
              </button>
              
              <button 
                onClick={() => loginWithKakao()}
                className="w-full py-4 bg-[#FEE500] text-black font-black rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90"
              >
                <img src="https://k.kakaocdn.net/14/dn/btroDszwNrM/OT7n9s6Ynu3zVdyJZWHo00/o.jpg" className="w-5 h-5 rounded-full" alt="K" />
                Kakao로 계속하기
              </button>

              <button 
                onClick={() => loginWithNaver()}
                className="w-full py-4 bg-[#03C75A] text-white font-black rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90"
              >
                <div className="w-5 h-5 bg-white text-[#03C75A] flex items-center justify-center font-black text-xs rounded-sm">N</div>
                Naver로 계속하기
              </button>

              <div className="flex items-center gap-4 my-8">
                <div className="h-px flex-1 bg-slate-800" />
                <span className="text-[10px] font-black text-slate-700">OR</span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              <button 
                type="button"
                onClick={() => setShowSignupModal(false)}
                className="w-full py-4 bg-slate-950 border border-slate-800 text-slate-500 font-bold rounded-2xl transition-all uppercase tracking-widest text-xs hover:border-slate-600 hover:text-slate-300"
              >
                로그인 없이 둘러보기
              </button>
            </div>
            
            <p className="text-center mt-8 text-[10px] font-bold text-slate-700 uppercase tracking-widest">Secure Forensic Environment</p>
          </div>
        </div>
      )}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#02040a]/95 backdrop-blur-xl p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6 uppercase">설정</h2>
            <div className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase">관심 주식</label>
                 <div className="flex gap-2 mt-2">
                    <input id="stockInput" type="text" placeholder="종목 코드 (예: AAPL)" className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white" />
                    <button onClick={() => {
                        const input = document.getElementById('stockInput') as HTMLInputElement;
                        handleAddStock(input.value);
                        input.value = '';
                    }} className="px-4 bg-blue-600 rounded-xl text-white font-bold text-sm">추가</button>
                 </div>
                 <div className="flex flex-wrap gap-2 mt-4">
                    {user?.interestedStocks?.map(stock => (
                        <div key={stock} className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full text-xs text-white">
                            {stock}
                            <button onClick={() => handleRemoveStock(stock)} className="text-slate-500 hover:text-red-500">×</button>
                        </div>
                    ))}
                 </div>
               </div>
            </div>
            <button onClick={() => setShowSettingsModal(false)} className="w-full mt-8 py-3 bg-slate-800 text-white rounded-xl font-bold">닫기</button>
          </div>
        </div>
      )}
      {/* ⚠️ 주의가 필요한 콘텐츠 섹션 */}
      {lowCredibilityNews.length > 0 && (
        <section className="mb-12 mt-12 pt-12 border-t border-slate-900 px-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-black text-red-500 uppercase tracking-tight">⚠️ 주의가 필요한 콘텐츠</h2>
            <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-black uppercase rounded">신뢰도 70% 이하</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lowCredibilityNews.map(news => (
               <div key={news.url} className="bg-red-950/20 border border-red-900/30 p-4 rounded-xl flex items-start gap-4 hover:border-red-700 transition-all">
                  <div className="text-2xl mt-1">🚨</div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 mb-1 line-clamp-2">{news.title}</h3>
                    <p className="text-[10px] text-red-400 font-black uppercase">{news.source}</p>
                  </div>
               </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default App;
