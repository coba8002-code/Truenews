export interface NewsArticle {
  title: string;
  url: string;
  image?: string;
  source: string;
  time: string;
  urgency?: number;
  credibility_hint?: number;
  keyword?: string;
}

export const fetchRealtimeNews = async (category: string = 'all', query: string = '', limit: number = 30, start: number = 1): Promise<NewsArticle[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // Increased to 20s for slow Naver crawl

  try {
    const params = new URLSearchParams();
    params.append('category', category);
    if (query) params.append('q', query);
    params.append('limit', limit.toString());
    params.append('start', start.toString());

    // Use absolute URL to be extra safe in varying iframe environments
    const apiBase = window.location.origin;
    const fetchUrl = `${apiBase}/api/news?${params.toString()}`;
    
    console.log(`[API] Fetching: ${fetchUrl}`);

    const response = await fetch(fetchUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error status: ${response.status}`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[API] Request timed out (20s)');
      } else {
        console.error('[API] Fetch failure:', error.message);
      }
    } else {
      console.error('[API] Unknown error:', error);
    }
    return [];
  }
};
