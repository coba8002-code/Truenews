
export type Verdict = "Trustworthy" | "Caution" | "Misleading" | "Propaganda";
export type PoliticalLeaning = "Left" | "Center-Left" | "Center" | "Center-Right" | "Right" | "Extreme";
export type IssueType = "Factual Error" | "Logical Fallacy" | "Missing Context" | "Biased Wording" | "Exaggeration";

export interface EnsembleBreakdown {
  source: number;
  cross_check: number;
  logic: number;
  context: number;
  bias: number;
}

export interface MetaAnalysis {
  credibility_score: number;
  verdict_badge: Verdict;
  political_leaning_assessment: PoliticalLeaning;
  emotional_intensity: number; // 0-10
  ensemble_breakdown?: EnsembleBreakdown;
}

export interface HighlightAnnotation {
  quoted_text: string;
  issue_type: IssueType;
  explanation: string;
  correction_evidence: string;
  search_query_suggestion: string;
  severity?: "High" | "Medium" | "Low" | string;
}

export interface CreatorReputationCheck {
  evaluation: string;
  check_points: string[];
}

export interface GroundingSource {
  title?: string;
  uri?: string;
  tier?: 1 | 2 | 3;
  tierLabel?: string;
  tierDescription?: string;
}

export interface ExecutiveBriefing {
  one_line_verdict: string;
  key_caveats: {
    title: string;
    detail: string;
    severity: 'high' | 'medium' | 'low';
    icon: string;
  }[];
  reader_guidance: string;
  fact_ratio: number; // 0-100%
}

export interface PoliticalCompass2D {
  economic: number; // -100 (신자유주의/시장자유) ~ +100 (공공복지/시장개입)
  social: number;   // -100 (진보/자유주의) ~ +100 (보수/전통질서)
  economicLabel: string;
  socialLabel: string;
  quadrantName: string;
  analysisDescription: string;
  mediaComparisonPoints?: {
    name: string;
    economic: number;
    social: number;
    color: string;
  }[];
}

export interface DiffComparison {
  original_paragraphs: {
    text: string;
    has_issue: boolean;
    issue_type?: IssueType;
    issues?: string[];
  }[];
  neutral_paragraphs: {
    text: string;
    is_improved: boolean;
    improvements?: string[];
  }[];
  key_corrections: {
    before: string;
    after: string;
    reason: string;
  }[];
}

export interface SimilarArticle {
  title: string;
  source: string;
  reporter?: string;
  url: string;
}

export interface PublicDataPoint {
  source_name: string;
  official_data: string;
  verification_status: "Verified" | "Contradictory" | "Inconclusive";
  official_link?: string;
}

export interface RealEstateAnalysis {
  region?: string;
  hype_score: number; // 0-100
  hype_reasons: string[];
  policy_impact: string;
  supply_demand_status: string;
  market_sentiment: "Bullish" | "Neutral" | "Bearish";
  strategic_foresight?: {
    short_term_outlook: string;
    long_term_risk: string;
    investment_verdict: string;
  };
}

export interface StockAnalysis {
  ticker?: string;
  company_name?: string;
  dart_fact_check: {
    claim: string;
    official_status: string;
    is_consistent: boolean;
    evidence_link?: string;
  }[];
  insider_move_check: {
    evaluation: string;
    recent_trades: string[];
    caution_level: "Low" | "Medium" | "High";
  };
  earnings_quality: {
    main_operating_profit_ratio: number;
    one_time_gains_info: string;
    warning_message?: string;
  };
  theme_cluster_validation: {
    theme_name: string;
    relevance_score: number;
    relevance_reason: string;
  };
  macro_correlation: {
    factor: string;
    correlation_desc: string;
    historical_pattern: string;
  };
  greenwashing_detection: {
    claim: string;
    contradictory_evidence?: string;
    is_greenwashing: boolean;
  };
  hype_index: number; // 0-100
  sentiment_gauge: "Bullish" | "Neutral" | "Bearish";
  strategic_valuation?: {
    intrinsic_value_estimate: string;
    fair_price_gap: string;
    analyst_consensus_audit: string;
  };
}

export interface GeneratedFactCheckNews {
  id: string;
  originalTitle: string;
  title: string;
  content: string;
  createdAt: string;
  analysisId: string;
}

export interface TruthEyesAnalysis {
  article_title: string;
  reporter_name: string;
  meta_analysis: MetaAnalysis;
  summary: string; 
  summaries?: {
    easy: string;
    general: string;
    expert: string;
  };
  bias_check: string; 
  highlight_annotations: HighlightAnnotation[];
  missing_context: string[];
  creator_reputation_check: CreatorReputationCheck;
  correction_suggestion: string; 
  trutheyes_commentary: string; // 신규 추가: 심층 논평
  original_content?: string; // 신규 추가: 원문 내용 또는 요약
  original_url?: string; // 신규 추가: 원본 기사 링크
  grounding_sources?: GroundingSource[];
  public_data_verification?: PublicDataPoint[]; // 신규 추가: 공공 데이터 검증 결과
  similar_articles?: SimilarArticle[]; // 신규 추가: 유사 기사 리스트
  event_timeline?: TimelineBubble[]; // 신규 추가: 사건 흐름도
  political_leaning_map?: MediaLeaningPoint; // 신규 추가: 정치적 편향성 맵 좌표
  analysis_time_ms?: number;
  ensemble_breakdown?: EnsembleBreakdown;
  real_estate_insight?: RealEstateAnalysis; // 신규 추가: 부동산 특화 분석
  stock_insight?: StockAnalysis; // 신규 추가: 주식 특화 분석
  executive_briefing?: ExecutiveBriefing; // 신규 추가: 30초 핵심 판정 브리핑
  political_compass?: PoliticalCompass2D; // 신규 추가: 2D 정치/경제 4분면 나침반
  diff_comparison?: DiffComparison; // 신규 추가: 원문 vs 중립 기사 비교 Diff
}

export interface NewsItem {
  title: string;
  url: string;
  image?: string;
  source: string;
  time: string;
  urgency?: number;
  credibility_hint?: number;
  keyword?: string;
  category?: NewsCategory;
}

export interface LiveAlert {
  id: string;
  title: string;
  source: string;
  time: string;
  url: string;
  isKeywordMatch?: boolean;
}

export type NewsCategory = 'Breaking' | 'Politics' | 'Economy' | 'Society' | 'IT/Tech' | 'World' | 'Entertainment' | 'Sports' | 'Real Estate' | 'Stock' | 'Debate' | 'Search';

export interface PerspectiveNewsItem extends NewsItem {
  perspective: 'Left' | 'Center' | 'Right' | 'Pro' | 'Neutral' | 'Con';
  perspective_label: string;
  key_difference?: string;
}

export interface GroupedNewsTopic {
  id: string;
  topic_title: string;
  articles: PerspectiveNewsItem[];
  votes?: {
    agree: number;
    disagree: number;
    neutral: number;
  };
}

export interface Comment {
  id: string;
  topicId: string;
  author: string;
  text: string;
  time: string;
  likes: number;
  type: 'agree' | 'disagree' | 'neutral';
}

export interface User {
  uid: string; // Firebase UID
  email: string;
  phone?: string;
  notificationType: 'Telegram' | 'KakaoTalk' | 'SMS' | 'Email' | 'App Push';
  interestedRegions?: string[];
  interestedStocks?: string[];
  photoURL?: string;
  displayName?: string;
}

export interface AlertKeyword {
  id: string;
  keyword: string;
}

export interface InputData {
  title?: string;
  author?: string;
  body?: string;
  url?: string;
  language: 'English' | 'Korean';
  inputType: 'manual' | 'url' | 'search';
  interestedRegions?: string[];
  category?: NewsCategory;
}

export interface MediaLeaningPoint {
  name: string;
  x: number; 
  y: number; 
  z: number; 
  trustScore: number;
}

export interface TimelineBubble {
  id: string;
  time: string;
  label: string;
  gapRate: number; 
  importance: number; 
}

export interface SavedAnalysis {
  id: string;
  userId: string;
  title: string;
  url: string;
  reportData: TruthEyesAnalysis;
  savedAt: string;
}

export interface SavedNeutralArticle {
  id: string;
  userId: string;
  title: string;
  content: string;
  level: 'easy' | 'normal' | 'expert';
  savedAt: string;
  originalUrl?: string;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
