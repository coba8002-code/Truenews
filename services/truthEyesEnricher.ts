import { 
  TruthEyesAnalysis, 
  GroundingSource, 
  ExecutiveBriefing, 
  PoliticalCompass2D, 
  DiffComparison,
  IssueType
} from '../types';

/**
 * 도메인/URI 기반 3단계 출처 신뢰도 자동 분류
 */
export function classifySourceTier(uri?: string, title?: string): { 
  tier: 1 | 2 | 3; 
  tierLabel: string; 
  tierDescription: string;
  badgeClass: string;
} {
  if (!uri) {
    return {
      tier: 3,
      tierLabel: "Tier 3: 일반 출처",
      tierDescription: "온라인 커뮤니티 또는 미확인 웹 소스",
      badgeClass: "bg-slate-700/30 text-slate-300 border-slate-600/40"
    };
  }

  const lower = uri.toLowerCase();

  // Tier 1: 정부, 사법부, 공공기관, 전자공시, 학술/연구
  if (
    lower.includes('.go.kr') || 
    lower.includes('dart.fss.or.kr') || 
    lower.includes('kostat.go.kr') || 
    lower.includes('scourt.go.kr') || 
    lower.includes('assembly.go.kr') || 
    lower.includes('molit.go.kr') || 
    lower.includes('law.go.kr') || 
    lower.includes('mofa.go.kr') || 
    lower.includes('bok.or.kr') || 
    lower.includes('.gov') || 
    lower.includes('.ac.kr') || 
    lower.includes('.edu') || 
    lower.includes('who.int') || 
    lower.includes('oecd.org') ||
    lower.includes('worldbank.org')
  ) {
    return {
      tier: 1,
      tierLabel: "Tier 1: 공식 1차 데이터",
      tierDescription: "정부·사법부·공시 등 법적·제도적 공신력이 검증된 1차 기관 출처 (가중치 100%)",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
    };
  }

  // Tier 2: 주요 제도권 언론사 및 기간통신사
  if (
    lower.includes('yna.co.kr') || 
    lower.includes('yonhap') || 
    lower.includes('reuters.com') || 
    lower.includes('apnews.com') || 
    lower.includes('bloomberg.com') || 
    lower.includes('bbc.com') || 
    lower.includes('kbs.co.kr') || 
    lower.includes('mbc.co.kr') || 
    lower.includes('sbs.co.kr') || 
    lower.includes('ytn.co.kr') || 
    lower.includes('chosun.com') || 
    lower.includes('joongang.co.kr') || 
    lower.includes('donga.com') || 
    lower.includes('hani.co.kr') || 
    lower.includes('khan.co.kr') || 
    lower.includes('mk.co.kr') || 
    lower.includes('hankyung.com') || 
    lower.includes('sedaily.com') || 
    lower.includes('news1.kr') || 
    lower.includes('newsis.com')
  ) {
    return {
      tier: 2,
      tierLabel: "Tier 2: 주요 제도권 언론",
      tierDescription: "사실 확인 데스크 및 편집 강령을 보유한 주요 언론 및 통신사 (가중치 75%)",
      badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/40"
    };
  }

  // Tier 3: 일반 웹페이지, 블로그, 포털 칼럼, 온라인 커뮤니티
  return {
    tier: 3,
    tierLabel: "Tier 3: 일반 매체 / 오피니언",
    tierDescription: "기명 칼럼, 2차 인용 블로그, 온라인 커뮤니티 (가중치 40%)",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/40"
  };
}

/**
 * 30초 핵심 브리핑(Executive Briefing) 자동 생성
 */
export function buildExecutiveBriefing(analysis: TruthEyesAnalysis): ExecutiveBriefing {
  if (analysis.executive_briefing) {
    return analysis.executive_briefing;
  }

  const score = analysis.meta_analysis?.credibility_score ?? 60;
  const verdict = analysis.meta_analysis?.verdict_badge || 'Caution';
  const annotations = analysis.highlight_annotations || [];
  const missingContext = analysis.missing_context || [];

  // 1. 핵심 한 줄 판정
  let one_line_verdict = "";
  if (verdict === 'Trustworthy') {
    one_line_verdict = `해당 기사는 객관적 공식 데이터와 교차 검증을 충실히 거친 높은 신뢰도(${score}점)의 보도입니다.`;
  } else if (verdict === 'Caution') {
    one_line_verdict = `사실에 기반하고 있으나, 자극적인 프레이밍과 핵심 배경 맥락이 일부 누락되어(${score}점) 주의가 필요합니다.`;
  } else if (verdict === 'Misleading') {
    one_line_verdict = `핵심 수치나 인과관계의 비약이 다수 발견되었으며(${score}점), 공식 1차 자료와 상당 부분 어긋납니다.`;
  } else {
    one_line_verdict = `특정 이해관계나 의도적 여론 선동 목적이 강하게 의심되는 심각한 왜곡 보도(${score}점)로 판정되었습니다.`;
  }

  // 2. 독자 주의 3대 포인트
  const biasedCount = annotations.filter(a => a.issue_type === 'Biased Wording' || a.issue_type === 'Exaggeration').length;
  const factualErrorCount = annotations.filter(a => a.issue_type === 'Factual Error' || a.issue_type === 'Logical Fallacy').length;
  const missingCount = missingContext.length;

  const key_caveats: ExecutiveBriefing['key_caveats'] = [
    {
      title: "자극적·편향 어휘 검출",
      detail: biasedCount > 0 
        ? `감정 자극 및 과장 표현이 본문 내 ${biasedCount}건 검출되었습니다.`
        : "감정적 어휘 사용이 절제되어 비교적 건조하게 서술되었습니다.",
      severity: biasedCount >= 3 ? 'high' : biasedCount > 0 ? 'medium' : 'low',
      icon: "🚨"
    },
    {
      title: "사실 관계 및 논리 검증",
      detail: factualErrorCount > 0
        ? `논리적 비약 또는 공식 데이터와 불일치하는 진술 ${factualErrorCount}건이 확인되었습니다.`
        : "핵심 주장의 전개 과정에서 중대한 논리적 결함은 발견되지 않았습니다.",
      severity: factualErrorCount >= 2 ? 'high' : factualErrorCount > 0 ? 'medium' : 'low',
      icon: "🔍"
    },
    {
      title: "배경 맥락 충분성",
      detail: missingCount > 0
        ? `기사 이해에 필수적인 역사적·제도적 배경 ${missingCount}가지가 본문에서 누락되었습니다.`
        : "사건의 전후 맥락과 배경이 균형 있게 제시되었습니다.",
      severity: missingCount >= 2 ? 'medium' : 'low',
      icon: "📉"
    }
  ];

  // 3. 권장 정보 소비 가이드
  let reader_guidance = "";
  if (verdict === 'Trustworthy') {
    reader_guidance = "기사의 주요 주장과 인용 통계를 신뢰할 수 있습니다. 추가적인 관점을 확인하려면 관련 기관 공시와 비교해 보세요.";
  } else if (verdict === 'Caution') {
    reader_guidance = "기사의 자극적인 제목이나 수식어에 현혹되지 마시고, 본문 하단의 '누락된 맥락'을 함께 고려하여 판단하시길 권장합니다.";
  } else {
    reader_guidance = "해당 기사의 단독 주장을 그대로 인용하거나 공유하지 마시고, 공공기관 1차 공시자료나 복수의 주요 기간통신사 보도를 교차 확인하십시오.";
  }

  const fact_ratio = Math.max(15, Math.min(95, score + (verdict === 'Trustworthy' ? 5 : -10)));

  return {
    one_line_verdict,
    key_caveats,
    reader_guidance,
    fact_ratio
  };
}

/**
 * 2D 정치/경제 4분면 나침반(Political Compass) 데이터 생성
 */
export function buildPoliticalCompass(analysis: TruthEyesAnalysis): PoliticalCompass2D {
  if (analysis.political_compass) {
    return analysis.political_compass;
  }

  const existingMap = analysis.political_leaning_map;
  const rawX = existingMap ? existingMap.x : 0; // -100 ~ 100
  const rawY = existingMap ? existingMap.y : 50; // 0 ~ 100

  // Economic: -100(자유시장/감세) ~ +100(공공개입/복지)
  // Social: -100(사회진보/다양성) ~ +100(전통보수/질서)
  let economic = Math.round(rawX * 0.9);
  let social = Math.round((50 - rawY) * 1.5);
  economic = Math.max(-90, Math.min(90, economic));
  social = Math.max(-90, Math.min(90, social));

  let quadrantName = "";
  if (economic >= 0 && social >= 0) quadrantName = "공공규제 / 전통질서 (국가주의·보수복지)";
  else if (economic < 0 && social >= 0) quadrantName = "자유시장 / 전통질서 (신자유주의·보수)";
  else if (economic >= 0 && social < 0) quadrantName = "공공복지 / 사회진보 (사회민주·진보)";
  else quadrantName = "자유시장 / 사회진보 (자유주의·개혁)";

  const economicLabel = economic < -25 ? "자유시장·감세 지향" : economic > 25 ? "공공복지·규제 지향" : "경제적 실용중립";
  const socialLabel = social < -25 ? "사회적 진보·자유" : social > 25 ? "전통질서·안보 중시" : "사회문화적 중도";

  const analysisDescription = `본 기사는 ${economicLabel} 및 ${socialLabel} 성향(${quadrantName})의 프레임워크에서 서술되었습니다.`;

  const mediaComparisonPoints = [
    { name: "진보 언론군 (한겨레/경향)", economic: 45, social: -55, color: "#3b82f6" },
    { name: "보수 언론군 (조선/동아)", economic: -50, social: 50, color: "#ef4444" },
    { name: "경제 전문지군 (매경/한경)", economic: -65, social: 15, color: "#f59e0b" },
    { name: "공영·통신군 (연합/KBS)", economic: 0, social: 0, color: "#10b981" }
  ];

  return {
    economic,
    social,
    economicLabel,
    socialLabel,
    quadrantName,
    analysisDescription,
    mediaComparisonPoints
  };
}

/**
 * 원문 vs 중립 기사 좌우 비교 Diff 데이터 구축
 */
export function buildDiffComparison(analysis: TruthEyesAnalysis): DiffComparison {
  if (analysis.diff_comparison) {
    return analysis.diff_comparison;
  }

  const annotations = analysis.highlight_annotations || [];
  const rawContent = analysis.original_content || analysis.summary || "";
  const paragraphs = rawContent.split(/\n+/).filter(p => p.trim().length > 0);

  const original_paragraphs = (paragraphs.length > 0 ? paragraphs : [analysis.summary || "기사 원문 내용 요약"]).map(para => {
    const matched = annotations.find(a => para.includes(a.quoted_text) || a.quoted_text.includes(para.slice(0, 20)));
    return {
      text: para,
      has_issue: !!matched,
      issue_type: matched?.issue_type,
      issues: matched ? [matched.explanation] : []
    };
  });

  const neutralText = analysis.summaries?.general || analysis.correction_suggestion || analysis.summary || "";
  const neutralParagraphs = neutralText.split(/\n+/).filter(p => p.trim().length > 0);

  const neutral_paragraphs = neutralParagraphs.map((para, idx) => ({
    text: para,
    is_improved: idx === 0 || para.includes("공식") || para.includes("확인"),
    improvements: idx === 0 ? ["주관적 수식어 배제", "공식 데이터 명시"] : ["균형적 서술 보강"]
  }));

  const key_corrections = annotations.slice(0, 3).map(a => ({
    before: a.quoted_text,
    after: a.correction_evidence || "해당 사안은 공공기관 공식 브리핑과 상반되며, 객관적 통계에 근거한 사실로 대체되었습니다.",
    reason: a.explanation
  }));

  if (key_corrections.length === 0 && analysis.correction_suggestion) {
    key_corrections.push({
      before: "기사 내 감정적 수식어 및 단정적 표현",
      after: analysis.correction_suggestion,
      reason: "보도의 객관성과 중립성 강화를 위한 포렌식 권고안"
    });
  }

  return {
    original_paragraphs,
    neutral_paragraphs,
    key_corrections
  };
}

/**
 * 전체 분석 데이터에 고도화 필드를 주입하는 일원화 함수
 */
export function enrichTruthEyesAnalysis(data: TruthEyesAnalysis): TruthEyesAnalysis {
  const enriched: TruthEyesAnalysis = { ...data };

  // 1. Grounding Sources 3단계 계층화
  if (enriched.grounding_sources && Array.isArray(enriched.grounding_sources)) {
    enriched.grounding_sources = enriched.grounding_sources.map(src => {
      const classification = classifySourceTier(src.uri, src.title);
      return {
        ...src,
        tier: classification.tier,
        tierLabel: classification.tierLabel,
        tierDescription: classification.tierDescription
      };
    });
  }

  // 2. 30초 핵심 브리핑 카드 데이터
  enriched.executive_briefing = buildExecutiveBriefing(enriched);

  // 3. 2D 정치/경제 나침반 데이터
  enriched.political_compass = buildPoliticalCompass(enriched);

  // 4. 원문 vs 중립 기사 Diff 비교 데이터
  enriched.diff_comparison = buildDiffComparison(enriched);

  return enriched;
}
