import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../src/lib/firebase';
import { collection, query, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { SavedAnalysis, SavedNeutralArticle } from '../types';
import AnalysisReport from './AnalysisReport';
import NeutralArticleModal from './NeutralArticleModal';

const MyPage: React.FC = () => {
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [savedArticles, setSavedArticles] = useState<SavedNeutralArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analyses' | 'articles'>('analyses');
  
  const [selectedAnalysis, setSelectedAnalysis] = useState<SavedAnalysis | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<SavedNeutralArticle | null>(null);

  useEffect(() => {
    fetchSavedData();
  }, []);

  const fetchSavedData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      // Fetch Analyses
      const analysesRef = collection(db, 'users', user.uid, 'saved_analyses');
      const analysesQuery = query(analysesRef, orderBy('savedAt', 'desc'));
      const analysesSnapshot = await getDocs(analysesQuery);
      const analysesList = analysesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedAnalysis));
      setSavedAnalyses(analysesList);

      // Fetch Articles
      const articlesRef = collection(db, 'users', user.uid, 'saved_neutral_articles');
      const articlesQuery = query(articlesRef, orderBy('savedAt', 'desc'));
      const articlesSnapshot = await getDocs(articlesQuery);
      const articlesList = articlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedNeutralArticle));
      setSavedArticles(articlesList);
    } catch (error) {
      console.error("Failed to fetch saved data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnalysis = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) return;

    if (!confirm("정말 이 리포트를 삭제하시겠습니까?")) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'saved_analyses', id));
      setSavedAnalyses(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/saved_analyses/${id}`);
    }
  };

  const handleDeleteArticle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) return;

    if (!confirm("정말 이 기사를 삭제하시겠습니까?")) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'saved_neutral_articles', id));
      setSavedArticles(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/saved_neutral_articles/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-10">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-white tracking-tight uppercase">마이페이지 (My Workspace)</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">분석한 리포트와 생성된 기사를 확인하고 관리하세요</p>
        </div>
        <div className="flex gap-2 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 backdrop-blur-xl">
          <button 
            onClick={() => setActiveTab('analyses')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'analyses' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
          >
            분석 리포트 ({savedAnalyses.length})
          </button>
          <button 
            onClick={() => setActiveTab('articles')}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'articles' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
          >
            중립 기사 ({savedArticles.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeTab === 'analyses' ? (
          savedAnalyses.length > 0 ? (
            savedAnalyses.map((item) => (
              <motion.div 
                key={item.id}
                layoutId={item.id}
                onClick={() => setSelectedAnalysis(item)}
                className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 hover:border-blue-500/30 transition-all cursor-pointer group flex flex-col relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl group-hover:bg-blue-600/10 transition-all" />
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Analysis Report</span>
                  <button 
                    onClick={(e) => handleDeleteAnalysis(item.id, e)}
                    className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center text-slate-600 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2"/></svg>
                  </button>
                </div>
                <h4 className="text-sm font-black text-white leading-relaxed line-clamp-2 group-hover:text-blue-400 transition-colors mb-4">{item.title}</h4>
                <div className="mt-auto pt-6 border-t border-slate-800/50 flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{new Date(item.savedAt).toLocaleDateString()}</span>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    item.reportData.meta_analysis.verdict_badge === 'Trustworthy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    item.reportData.meta_analysis.verdict_badge === 'Caution' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                    'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {item.reportData.meta_analysis.verdict_badge}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[3rem] text-slate-600 font-bold uppercase text-xs tracking-widest">
              저장된 분석 리포트가 없습니다
            </div>
          )
        ) : (
          savedArticles.length > 0 ? (
            savedArticles.map((item) => (
              <motion.div 
                key={item.id}
                layoutId={item.id}
                onClick={() => setSelectedArticle(item)}
                className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 hover:border-blue-500/30 transition-all cursor-pointer group flex flex-col relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 rounded-full blur-2xl group-hover:bg-emerald-600/10 transition-all" />
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Neutral Article</span>
                  <button 
                    onClick={(e) => handleDeleteArticle(item.id, e)}
                    className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center text-slate-600 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2"/></svg>
                  </button>
                </div>
                <h4 className="text-sm font-black text-white leading-relaxed line-clamp-2 group-hover:text-emerald-400 transition-colors mb-4">{item.title}</h4>
                <div className="mt-auto pt-6 border-t border-slate-800/50 flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{new Date(item.savedAt).toLocaleDateString()}</span>
                  <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Level: {item.level}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[3rem] text-slate-600 font-bold uppercase text-xs tracking-widest">
              저장된 중립 기사가 없습니다
            </div>
          )
        )}
      </div>

      {selectedAnalysis && (
        <div className="fixed inset-0 z-[500] bg-slate-950/90 backdrop-blur-md overflow-y-auto pt-20 pb-20 px-4 md:px-10">
          <div className="max-w-5xl mx-auto relative">
            <button 
              onClick={() => setSelectedAnalysis(null)} 
              className="absolute -top-12 left-0 text-white flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:text-blue-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3"/></svg>
              닫기
            </button>
            <AnalysisReport 
              data={selectedAnalysis.reportData} 
              onGenerateNeutralArticle={() => {}} // Disabled in preview
              onOpenArticle={() => {}} // Disabled in preview
            />
          </div>
        </div>
      )}

      {selectedArticle && (
        <NeutralArticleModal 
          isOpen={!!selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
          title={selectedArticle.title} 
          content={selectedArticle.content} 
        />
      )}
    </div>
  );
};

export default MyPage;
