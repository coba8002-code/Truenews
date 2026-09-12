import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple in-memory cache
const newsCache: Record<string, { data: any[], timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// User-Agent rotation to avoid blocking
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/118.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
];

// Primary & Fallback: Crawl news from Google News RSS
async function crawlGoogleNews(query: string, limit: number = 20) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
    const response = await axios.get(url, {
      headers: { 
        'User-Agent': USER_AGENTS[0],
        'Accept': 'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 7000
    });
    
    const $ = cheerio.load(response.data, { xmlMode: true });
    const articles: any[] = [];
    
    $('item').each((i, el) => {
      if (articles.length >= limit) return false;
      const titleRaw = $(el).find('title').text();
      const link = $(el).find('link').text().trim();
      const pubDate = $(el).find('pubDate').text();
      const source = $(el).find('source').text().trim() || "주요 언론";
      
      // Clean up title (Google News adds " - Source" to the end)
      const cleanTitle = titleRaw.split(' - ')[0].trim();
      
      if (!cleanTitle || !link || link.includes('example.com')) return;

      articles.push({
        title: cleanTitle,
        url: link,
        image: `https://picsum.photos/seed/${encodeURIComponent(cleanTitle.substring(0, 15))}/600/400`,
        source: source,
        time: pubDate ? new Date(pubDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : "최근",
        urgency: 1,
        credibility_hint: 86 + Math.floor(Math.random() * 8),
        keyword: query.toUpperCase()
      });
    });
    
    return articles;
  } catch (e: any) {
    console.warn(`[Google News] Fallback warning for ${query}:`, e.message);
    return [];
  }
}

// Crawl news from Daum News Search (Provides real Korean news headlines, press names & CDN thumbnails)
async function crawlDaumNews(query: string, limit: number = 15) {
  try {
    const url = `https://search.daum.net/search?w=news&q=${encodeURIComponent(query)}&sort=recency`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
        'Referer': 'https://www.daum.net/'
      },
      timeout: 7000
    });

    const $ = cheerio.load(res.data);
    const articles: any[] = [];

    $('.item-title a, a.tit_main, strong.tit-g a').each((i, el) => {
      if (articles.length >= limit) return false;
      const title = $(el).text().trim();
      const link = $(el).attr('href');
      if (!title || !link || link.includes('example.com')) return;

      const card = $(el).closest('li');
      const cardText = card.text().trim();
      const firstWord = cardText.split(/\s+/)[0] || "";
      const press = (firstWord && !firstWord.includes("분") && !firstWord.includes("시간") && firstWord.length < 20) 
        ? firstWord 
        : "주요 언론";
      
      const timeMatch = cardText.match(/(\d+\s*(?:분|시간|일)\s*전|\d{4}\.\d{2}\.\d{2})/);
      const time = timeMatch ? timeMatch[0] : "방금 전";

      let img = card.find('img').attr('data-original-src') || card.find('img').attr('src') || '';
      if (img.startsWith('//')) img = 'https:' + img;
      if (!img || img.startsWith('data:') || img.includes('blank.gif') || img.includes('transparent')) {
        img = `https://picsum.photos/seed/${encodeURIComponent(title.substring(0, 15))}/600/400`;
      }

      articles.push({
        title,
        url: link,
        image: img,
        source: press,
        time,
        urgency: 1,
        credibility_hint: 88 + Math.floor(Math.random() * 8),
        keyword: query.toUpperCase()
      });
    });

    return articles;
  } catch (err: any) {
    console.warn(`[Daum News] Crawl warning for ${query}:`, err.message);
    return [];
  }
}

// Helper to crawl news combining Daum Real-time + Google News RSS with caching
async function crawlNews(query: string = "최신뉴스", category: string = "all", limit: number = 30, start: number = 1) {
  const cacheKey = `${query}_${category}_${limit}_${start}`;
  const now = Date.now();

  if (newsCache[cacheKey] && (now - newsCache[cacheKey].timestamp < CACHE_DURATION)) {
    console.log(`Serving from cache: ${cacheKey}`);
    return newsCache[cacheKey].data;
  }

  try {
    // Concurrent fetch from Daum News and Google News
    const [daumArticles, googleArticles] = await Promise.all([
      crawlDaumNews(query, Math.min(limit, 15)),
      crawlGoogleNews(query, Math.max(limit - 5, 15))
    ]);

    // Combine with deduplication (by normalized title substring)
    const combinedArticles: any[] = [...daumArticles];
    const seenTitles = new Set(daumArticles.map(a => a.title.replace(/\s+/g, '').substring(0, 18)));

    for (const gArticle of googleArticles) {
      if (combinedArticles.length >= limit) break;
      const normTitle = gArticle.title.replace(/\s+/g, '').substring(0, 18);
      if (!seenTitles.has(normTitle)) {
        seenTitles.add(normTitle);
        combinedArticles.push(gArticle);
      }
    }

    // Deep Crawl for missing/placeholder images on top articles
    const articlesToEnhance = combinedArticles.slice(0, 8).filter(a => a.image.includes('picsum.photos'));
    if (articlesToEnhance.length > 0) {
      const startTime = Date.now();
      const BATCH_TIMEOUT = 3000;

      await Promise.all(articlesToEnhance.map(async (article) => {
        if (Date.now() - startTime > BATCH_TIMEOUT) return;
        try {
          const artRes = await axios.get(article.url, {
            headers: { 
              'User-Agent': USER_AGENTS[0],
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 2500,
            maxRedirects: 3
          });
          const $art = cheerio.load(artRes.data);
          const ogImage = $art('meta[property="og:image"]').attr('content') || 
                          $art('meta[name="twitter:image"]').attr('content');
          
          if (ogImage && ogImage.startsWith('http')) {
            article.image = ogImage;
          }
        } catch {
          // Ignore individual article image fetch failures
        }
      }));
    }

    console.log(`[Crawl] Successfully fetched ${combinedArticles.length} articles for: ${query}`);
    newsCache[cacheKey] = { data: combinedArticles, timestamp: now };
    return combinedArticles;
  } catch (error: any) {
    console.warn(`[Crawl] Fallback for ${query}:`, error.message);
    const fallbackList = await crawlGoogleNews(query, limit);
    return fallbackList;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Route for News (Direct Crawling)
  app.get("/api/news", async (req, res) => {
    try {
      const { category, q, limit, start } = req.query;
      const categoryStr = String(category || 'general');
      const queryStr = String(q || '');
      const limitNum = parseInt(String(limit || '30'), 10);
      const startNum = parseInt(String(start || '1'), 10);
      
      // Map category to search keywords if no specific query is provided
      let finalQuery = queryStr;
      if (!finalQuery) {
        const categoryMap: Record<string, string> = {
          'politics': '정치',
          'business': '경제',
          'technology': 'IT 기술',
          'science': '과학',
          'health': '건강',
          'sports': '스포츠',
          'entertainment': '연예',
          'land': '부동산 시장 아파트 분양 매매 전세 규제 정책',
          'finance': '증시 주식 코스피 코스닥 상장사 공시 실적',
          'general': '최신 뉴스'
        };
        finalQuery = categoryMap[categoryStr] || '최신 뉴스';
      }

      console.log(`Crawling news for: ${finalQuery} (limit: ${limitNum}, start: ${startNum})`);
      const articles = await crawlNews(finalQuery, categoryStr, limitNum, startNum);
      
      if (articles.length === 0) {
        // Return some fallback data if crawling fails completely, so the UI isn't empty
        return res.json([
          {
            title: `[시스템 알림] '${finalQuery}' 관련 실시간 뉴스를 수집 중입니다. 잠시 후 다시 시도해 주세요.`,
            url: "#",
            source: "시스템",
            time: "방금 전",
            urgency: 1,
            credibility_hint: 100,
            keyword: "SYSTEM"
          }
        ]);
      }
      
      res.json(articles);
    } catch (error: any) {
      console.error("Error in news API:", error.message);
      res.status(500).json({ error: "Failed to fetch news", details: error.message });
    }
  });

  // API Route for URL Content Extraction
  app.get("/api/extract", async (req, res) => {
    const urlStr = req.query.url ? String(req.query.url) : "";
    try {
      if (!urlStr) return res.status(400).json({ error: "URL is required" });

      if (!urlStr.startsWith('http')) {
        return res.status(400).json({ error: "Invalid URL format. URL must start with http or https." });
      }
      
      console.log(`Extracting content from: ${urlStr}`);

      // YouTube special handling
      if (urlStr.includes('youtube.com') || urlStr.includes('youtu.be')) {
        try {
          // Try oEmbed for clean metadata
          let ytTitle = "YouTube Video";
          let ytDesc = "";
          try {
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(urlStr)}&format=json`;
            const oembedRes = await axios.get(oembedUrl);
            ytTitle = oembedRes.data.title || ytTitle;
            ytDesc = oembedRes.data.author_name ? `채널: ${oembedRes.data.author_name}` : "";
          } catch (oe) {
            console.warn("oEmbed failed, falling back to cheerio", oe.message);
            const ytRes = await axios.get(urlStr, {
              headers: { 'User-Agent': USER_AGENTS[0] },
              timeout: 5000
            });
            const $yt = cheerio.load(ytRes.data);
            ytTitle = $yt('title').text().replace('- YouTube', '').trim();
            ytDesc = $yt('meta[name="description"]').attr('content') || "";
          }
          
          let transcriptText = "";
          try {
            const { YoutubeTranscript } = await import('youtube-transcript');
            const transcript = await YoutubeTranscript.fetchTranscript(urlStr);
            transcriptText = transcript.map(t => t.text).join(' ');
            console.log(`Successfully extracted transcript for: ${ytTitle} (${transcriptText.length} chars)`);
          } catch (te) {
            console.warn("Failed to fetch transcript:", te);
            transcriptText = "자막을 추출할 수 없습니다. (비공개 영상, 자막 비활성화 또는 지역 제한)";
          }
          
          const content = `[YouTube 영상 분석 데이터]\n\n제목: ${ytTitle}\n\n영상 설명: ${ytDesc}\n\n영상 자막 미리보기/내용:\n${transcriptText.substring(0, 10000)}\n\n시스템 알림: 위 내용은 추출된 자막 및 메타데이터입니다. AI가 이를 바탕으로 사실 관계를 교차 검증합니다.`;
          
          return res.json({ 
            content,
            title: ytTitle 
          });
        } catch (e) {
          return res.json({ content: "YouTube Video Content (Fetching failed. Please ensure the link is public.)" });
        }
      }

      // Fetch with encoding support and SSL agent fallback
      const httpsAgent = new https.Agent({ rejectUnauthorized: false });
      const response = await axios.get(urlStr, {
        headers: {
          'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://www.google.com/',
        },
        timeout: 15000,
        httpsAgent,
        responseType: 'arraybuffer' // Get as buffer to handle encoding
      });

      // Handle encoding (CP949/EUC-KR to UTF-8 fallback)
      const rawBuffer = Buffer.from(response.data);
      const iconv = (await import('iconv-lite')).default || await import('iconv-lite');
      const contentType = (response.headers['content-type'] || '').toLowerCase();
      
      let html = "";
      const isEucKrHeader = contentType.includes('euc-kr') || contentType.includes('cp949') || contentType.includes('ks_c_5601');
      if (isEucKrHeader) {
        html = iconv.decode(rawBuffer, 'cp949');
      } else {
        const utf8Candidate = rawBuffer.toString('utf-8');
        const isMetaEucKr = /charset=["']?(?:euc-kr|cp949|ks_c_5601)/i.test(utf8Candidate);
        if (isMetaEucKr) {
          html = iconv.decode(rawBuffer, 'cp949');
        } else {
          html = utf8Candidate;
        }
      }

      const $ = cheerio.load(html);
      
      // 1. Remove noise - targeted cleaning without destroying article containers
      $('script, style, nav, footer, aside, iframe, noscript, svg, canvas, button, form, input, select, textarea').remove();
      $('.footer, .nav, .sidebar, .ads, .banner, .recom_list, .reply_area, .comment, .social_share, .tags, .author_info, .popular, .side_content, .gnb, .menu, .utility, .copyright').remove();
      $('[class*="ads"], [id*="ads"], [class*="banner"], [id*="banner"], [class*="sidebar"], [class*="footer"]').remove();
      $('[class*="related"], [class*="social"], [class*="share"], [class*="comment"]').remove();
      $('.shortcut, .breadcrumb, .location, .byline, .journalistcard, .newsletter-banner').remove();
      
      // 2. Remove elements that look like navigation/linking lists
      $('section, ul').each((i, el) => {
        const text = $(el).text();
        const linkCount = $(el).find('a').length;
        if (linkCount > 8 && text.length < linkCount * 40) {
          $(el).remove();
        }
      });

      // 3. Extract Title
      const pageTitle = $('meta[property="og:title"]').attr('content') || 
                        $('meta[name="twitter:title"]').attr('content') || 
                        $('title').text().split('|')[0].split('-')[0].trim() || 
                        $('h1').first().text().trim();
      
      // 4. Extract Main Content - Refined Priority Selectors
      // Priority: Major portals -> Semantic tags -> Common article classes
      const selectors = [
        '#dic_area', '#articleBodyContents', '#newsct_article', '#artContents', // Naver
        '.article_view', '#dmccCanvas', // Daum
        '#article-view-content-div', '.article-view-content-div', '#articleBody', '.articleBody', '#article_body', '#article-content', '.article-content', // General & Regional news
        'article', '[itemprop="articleBody"]',
        '#news_content', '.news_content', '#news_body_area', '.news_body_area', '#view_content', '.view_content', '.view_con', 'td.view_content', '#font-resize', // Regional media (NDSoft etc.)
        '.art_txt', '.art-body', '.artBody', '.article_txt', '#CmAdContent',
        '.content', '.post', '.news_body', '.story-body', '.entry-content',
        '.article-body', '.article_content', '.at-body',
        '#contents', '#main_content', '#ct'
      ];
      
      let content = "";
      for (const selector of selectors) {
        const target = $(selector).first();
        if (target.length > 0) {
          // Deep clean within target
          target.find('script, style, .ads, .sidebar, .related, .recommend, button, .sns').remove();
          content = target.text().trim();
          if (content.length > 200) break;
        }
      }
      
      // 5. Fallback: Heuristic-based density or paragraph collection
      if (!content || content.length < 300) {
        // Collect all paragraphs with substantial text
        const paragraphs: string[] = [];
        $('p, div').each((i, el) => {
          const text = $(el).text().trim();
          // Filter out short snippets and look for "sentence-like" content
          if (text.length > 50 && !$(el).find('a').length) {
            paragraphs.push(text);
          }
        });
        
        if (paragraphs.length > 5) {
          content = paragraphs.join('\n\n');
        } else {
          // Absolute fallback: Best element density
          let bestElement = null;
          let maxDensity = 0;
          
          $('div, section, article').each((i, el) => {
            const $el = $(el);
            const text = $el.text().trim();
            if (text.length < 300) return;
            
            const pCount = $el.find('p').length;
            const aCount = $el.find('a').length;
            const score = (text.length * (pCount + 1)) / (aCount + 1);
            
            if (score > maxDensity) {
              maxDensity = score;
              bestElement = $el;
            }
          });
          
          if (bestElement) content = $(bestElement).text().trim();
        }
      }

      // 6. Last resort: just get everything visible
      if (!content || content.length < 100) {
        content = $('main').text().trim() || $('body').text().trim();
      }

      // Final cleaning: remove redundant whitespace and limit length
      content = content.replace(/\s{2,}/g, ' ')
                       .replace(/\n\s*\n/g, '\n')
                       .replace(/&nbsp;/g, ' ')
                       .substring(0, 15000);

      // If still rubbish (e.g. "JavaScript is required"), inform the user
      if (content.length < 200 || content.includes('로그인이 필요합니다') || content.includes('JavaScript를 활성화') || content.includes('내용을 추출하는 데 실패했습니다')) {
        content = `[분석 실패 알림] 해당 웹사이트("${urlStr}")의 내용을 자동으로 추출하는 데 실패했습니다.\n\n사유: 사이트 잠금, 자바스크립트 기반 동적 랜더링, 혹은 접근 차단.\n\n정확한 분석을 위해 해당 기사의 전문을 복사하여 '직접 입력' 탭에 붙여넣어 주세요.`;
      }

      console.log(`Extracted content length: ${content.length}`);

      res.json({ 
        content, 
        title: pageTitle 
      });
    } catch (error: any) {
      console.error("Extraction error:", error.message);
      res.json({ 
        content: `[분석 실패 알림] 해당 웹사이트("${urlStr}")의 내용을 자동으로 추출하는 데 실패했습니다.\n\n사유: 사이트 잠금, 자바스크립트 기반 동적 랜더링, 혹은 접근 차단.\n\n정확한 분석을 위해 해당 기사의 전문을 복사하여 '직접 입력' 탭에 붙여넣어 주세요.`,
        title: "분석 실패 (Extraction Failed)"
      });
    }
  });

  // API Route for Iframe Proxy (Bypassing X-Frame-Options)
  app.get("/api/proxy", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) return res.status(400).send("URL is required");

      const urlStr = String(url);
      if (!urlStr.startsWith('http')) {
        return res.status(400).send("Invalid URL format. URL must start with http or https.");
      }
      
      console.log(`Proxying iframe for: ${urlStr}`);

      const response = await axios.get(urlStr, {
        headers: {
          'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        timeout: 10000,
        responseType: 'text'
      });

      let html = response.data;

      // Inject <base> tag to fix relative links (images, css, js)
      const baseTag = `<base href="${urlStr}">`;
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}`);
      } else if (html.includes('<html>')) {
        html = html.replace('<html>', `<html><head>${baseTag}</head>`);
      } else {
        html = `<head>${baseTag}</head>${html}`;
      }

      // Remove security headers that might be in meta tags
      html = html.replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, '');
      html = html.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');

      // Set headers for the response
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error: any) {
      console.error("Proxy error:", error.message);
      res.status(500).send(`<html><body><h3>기사 원문을 불러올 수 없습니다.</h3><p>${error.message}</p><button onclick="window.open('${req.query.url}', '_blank')">새 창에서 열기</button></body></html>`);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled Server Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  });
}

startServer().catch(err => {
  console.error("Critical: Failed to start server:", err);
  process.exit(1);
});
