
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { TruthEyesAnalysis, InputData, NewsItem, NewsCategory, GroupedNewsTopic, GeneratedFactCheckNews } from "../types";
import { TruthEyesEngine } from "./truthEyesEngine";
import { enrichTruthEyesAnalysis } from "./truthEyesEnricher";

const MODEL_NAME = "gemini-3-flash-preview";

function getAI(): GoogleGenAI {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error("API Key missing or invalid. Please select a valid key.");
  }
  return new GoogleGenAI({ apiKey });
}

function parseAiJson(text: string): any {
  if (!text) return null;
  let cleaned = text.trim();
  try {
    const jsonMatch = cleaned.match(/```json\s*([\s\S]*?)\s*```/) || cleaned.match(/```\s*([\s\S]*?)\s*```/);
    let candidate = jsonMatch ? jsonMatch[1] : cleaned;
    candidate = candidate.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
    return JSON.parse(candidate);
  } catch (e) {
    console.error("JSON parsing error", text);
    return null;
  }
}

export async function analyzeContent(input: InputData): Promise<TruthEyesAnalysis> {
  console.log("Analyzing content...", input);
  const ai = getAI();
  const prompt = `당신은 전문 뉴스 분석 에디터입니다.
  다음 JSON 구조를 가진 객체만 반환하십시오. 다른 설명이나 텍스트를 포함하지 마십시오.
  
  인터페이스: {
    article_title: string,
    reporter_name: string,
    summary: string,
    summaries: { easy: string, general: string, expert: string },
    meta_analysis: { credibility_score: number, verdict_badge: string, political_leaning_assessment: string, emotional_intensity: number },
    bias_check: string,
    highlight_annotations: { quoted_text: string, issue_type: string, explanation: string, correction_evidence: string, search_query_suggestion: string }[],
    missing_context: string[],
    creator_reputation_check: { evaluation: string, check_points: string[] },
    correction_suggestion: string,
    trutheyes_commentary: string,
    original_content: string,
    original_url: string,
    grounding_sources: { title: string, uri: string }[],
    public_data_verification: { source_name: string, official_data: string, verification_status: string, official_link: string }[],
    similar_articles: { title: string, source: string, url: string }[],
    event_timeline: { id: string, time: string, label: string, gapRate: number, importance: number }[],
    political_leaning_map: { name: string, x: number, y: number },
    real_estate_insight?: { 
      region: string, 
      hype_score: number, 
      hype_reasons: string[], 
      policy_impact: string, 
      supply_demand_status: string, 
      market_sentiment: string,
      strategic_foresight: { short_term_outlook: string, long_term_risk: string, investment_verdict: string }
    },
    stock_insight?: {
      ticker: string,
      company_name: string,
      dart_fact_check: { claim: string, official_status: string, is_consistent: boolean, evidence_link: string }[],
      insider_move_check: { evaluation: string, recent_trades: string[], caution_level: string },
      earnings_quality: { main_operating_profit_ratio: number, one_time_gains_info: string, warning_message: string },
      theme_cluster_validation: { theme_name: string, relevance_score: number, relevance_reason: string },
      macro_correlation: { factor: string, correlation_desc: string, historical_pattern: string },
      greenwashing_detection: { claim: string, contradictory_evidence: string, is_greenwashing: boolean },
      hype_index: number,
      sentiment_gauge: string,
      strategic_valuation: { intrinsic_value_estimate: string, fair_price_gap: string, analyst_consensus_audit: string }
    }
  }

  분석 지침:
  1. 입력 데이터가 주식 관련(기업, 증시, 배당 등)이라면 'stock_insight'를, 부동산 관련(아파트, 분양, 지역 개발 등)이라면 'real_estate_insight'를 반드시 포함하십시오.
  2. 'strategic_foresight'와 'strategic_valuation' 필드에는 데이터 포렌식에 기반한 고도의 투자 전략적 관점을 기술하십시오.
  3. 모든 점수는 0-100 사이의 숫자여야 합니다.
  4. 입력 데이터에 '[YouTube 영상 분석 데이터]'가 포함되어 있다면, 제공된 자막(Transcript) 내용을 정밀하게 분석하여 사실 관계를 검증하십시오. 자막이 누락되었거나 부족한 경우 'missing_context'에 명시하십시오.

  입력 데이터: ${JSON.stringify(input)}`;
  console.log("Gemini Prompt:", prompt);
  
  const result = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { 
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }]
    }
  });
  console.log("Gemini Result Parsed:", result.text);
  
  const analysis = parseAiJson(result.text) as TruthEyesAnalysis;
  if (!analysis) {
      console.error("Gemini Response Text:", result.text);
      throw new Error("분석 데이터를 생성하지 못했습니다.");
  }
  
  // Extract grounding metadata if available and add to analysis
  const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks && groundingChunks.length > 0) {
    const sources = groundingChunks.map((chunk: any) => ({
      title: chunk.web?.title || '참고 자료',
      uri: chunk.web?.uri || ''
    })).filter((s: any) => s.uri);
    analysis.grounding_sources = [...(analysis.grounding_sources || []), ...sources];
  }
  analysis.reporter_name = analysis.reporter_name || "트루스아이즈 AI 정밀 에디터";
  
  if (!analysis.meta_analysis) {
      analysis.meta_analysis = {
        credibility_score: 50,
        verdict_badge: "Caution",
        political_leaning_assessment: "Center",
        emotional_intensity: 5
      };
  }

  const { score, breakdown, contribution } = TruthEyesEngine.calculateEnsembleScore(analysis);
  analysis.meta_analysis.credibility_score = score;
  analysis.meta_analysis.ensemble_breakdown = contribution; // Contributions summing to 100%
  analysis.ensemble_breakdown = breakdown; // Raw quality scores 0-100
  analysis.meta_analysis.verdict_badge = TruthEyesEngine.determineVerdict(score);
  return enrichTruthEyesAnalysis(analysis);
}

export async function fetchTopNews(category: NewsCategory, language: string, query?: string): Promise<NewsItem[]> {
  const ai = getAI();
  const prompt = `카테고리 ${category}에 대한 최신 뉴스 ${query ? `(검색어: ${query})` : ''}를 JSON 배열로 반환하십시오. {title, url, source, time, image, category}.`;
  const result = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  return parseAiJson(result.text) || [];
}

export async function fetchGroupedNews(language: 'English' | 'Korean' = 'Korean'): Promise<GroupedNewsTopic[]> {
  const ai = getAI();
  const prompt = `대한민국 쟁점 뉴스 이슈 4가지를 선정하여 이슈별로 그룹화된 JSON 배열로 반환하십시오. {id, topic_title, articles: [{title, url, source, time, image, perspective, perspective_label, key_difference, credibility_hint}]}`;
  const result = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  return parseAiJson(result.text) || [];
}

export async function generateNeutralFactCheckNews(analysis: TruthEyesAnalysis, level: 'easy' | 'normal' | 'expert' = 'normal'): Promise<GeneratedFactCheckNews> {
    const ai = getAI();
    const prompt = `당신은 대한민국 주요 종합 일간지(예: 연합뉴스, YTN, 연합뉴스TV)의 20년 경력 베테랑 뉴스 에디터입니다.
    제공된 '분석 리포트' 내의 검증된 사실(Fact)들만을 재구성하여, 실제 뉴스 포털 메인에 걸릴 법한 중립적이고 사실 중심의 '뉴스 기사'를 작성하십시오.
    
    기사 작성 원칙 (CRITICAL):
    1. **기자 관점 원칙**: 독자에게 사실을 보도하는 기자의 시각을 견지하십시오. "분석 결과에 따르면 이 기사는 편향적입니다"와 같은 '평가'나 '리뷰' 형식의 문장은 절대 사용하지 마십시오.
    2. **내러티브 재구성**: 분석 리포트에서 추출된 팩트(공공 데이터, 타 매체 보도 내용, 수치 등)를 활용하여, 해당 사건을 가장 중립적으로 전달하는 '새로운 기사' 본문을 작성하십시오.
    3. **정확한 문체**: '~다'로 끝나는 평어체를 사용하며, 기성 언론사 특유의 무미건조하지만 신뢰감 있는 문체를 사용하십시오. (예: "취재 결과 ~로 나타났다", "관련 기관은 ~라고 밝혔다")
    4. **근거 제시**: 공공 데이터 검증 결과에서 확보된 구체적인 수치나 출처를 기사 내에 자연스럽게 인용하십시오. 
    5. **균형 중심**: 대립되는 주장이 있을 경우 "한쪽에서는 A라고 주장하는 반면, 다른 쪽에서는 B라는 입장을 보이고 있다"는 식으로 양방향의 의견을 균등하게 배치하십시오.
    
    기사 난이도 및 분량 상세 (${level}):
    - 'easy': 핵심 사실만 간추린 3-4개 문단 구성 (300자 내외).
    - 'normal': 육하원칙에 기반한 정석적인 스트레이트 뉴스 (600자 내외).
    - 'expert': 심층적인 배경 설명과 데이터 분석 결과가 포함된 기획/분석 기사 (1000자 이상).
    
    분석 데이터: ${JSON.stringify(analysis)}
    
    결과는 반드시 다음 JSON 형식으로만 반환하십시오: { "title": string, "content": string }
    다른 어떠한 설명이나 분석 코멘트도 포함하지 말고 오직 JSON 결과값만 출력하십시오.`;

    const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    const parsed = parseAiJson(result.text);
    if (!parsed) throw new Error("팩트체크 뉴스 기사를 생성하지 못했습니다.");
    return {
        id: Date.now().toString(),
        originalTitle: analysis.article_title,
        title: parsed.title,
        content: parsed.content,
        createdAt: new Date().toISOString(),
        analysisId: analysis.article_title // Use title as ID for now
    };
}

export async function generateMultiSourceReport(query: string, articles: NewsItem[]): Promise<TruthEyesAnalysis> {
    const ai = getAI();
    const prompt = `다음 뉴스 기사들을 종합 분석하여 사실 관계를 대조하고 중립적인 리포트를 생성하십시오.
    기사들: ${JSON.stringify(articles)}
    JSON 형식으로 TruthEyesAnalysis 구조에 맞춰 반환하십시오.`;
    
    const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    
    const parsed = parseAiJson(result.text);
    if (!parsed) throw new Error("멀티 소스 리포트를 생성하지 못했습니다.");
    parsed.reporter_name = parsed.reporter_name || "트루스아이즈 AI 정밀 에디터";
    return parsed;
}
