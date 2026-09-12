
import { TruthEyesAnalysis, Verdict, EnsembleBreakdown } from "../types";

/**
 * TruthEyes Ensemble Engine v2.6
 * 5개 분석 모듈의 가중치 융합 엔진
 */
export class TruthEyesEngine {
  public static DEFAULT_WEIGHTS: EnsembleBreakdown = {
    source: 20,
    cross_check: 20,
    logic: 25,
    context: 15,
    bias: 20
  };

  /**
   * 분석 객체로부터 각 모듈의 원시 점수(0-100)를 추출합니다.
   */
  static calculateModuleScores(analysis: TruthEyesAnalysis): EnsembleBreakdown {
    if (!analysis) {
      return { source: 0, cross_check: 0, logic: 0, context: 0, bias: 0 };
    }

    // 1. 출처 신뢰도: 평판 체크 포인트 수 및 평가 내용 기반
    const checkPoints = analysis.creator_reputation_check?.check_points || [];
    const reputationEval = analysis.creator_reputation_check?.evaluation?.toLowerCase() || "";
    let sourceScore = Math.max(0, 100 - (checkPoints.length < 2 ? 40 : 10));
    if (reputationEval.includes("신뢰") || reputationEval.includes("공식")) sourceScore = Math.min(100, sourceScore + 10);
    if (reputationEval.includes("편향") || reputationEval.includes("주의")) sourceScore = Math.max(0, sourceScore - 20);
    
    // 2. 교차 검증: Grounding 소스 개수 및 유사 기사 일치도 기반
    const groundingCount = analysis.grounding_sources?.length || 0;
    const similarCount = analysis.similar_articles?.length || 0;
    let crossScore = 60;
    if (groundingCount > 3 && similarCount > 2) crossScore = 98;
    else if (groundingCount > 0 || similarCount > 0) crossScore = 80;
    
    // 3. 논리적 무결성: 감지된 논리적 오류의 심각도 및 개수 기반
    const annotations = analysis.highlight_annotations || [];
    const logicErrors = annotations.filter(a => a.issue_type === "Logical Fallacy").length;
    const factualErrors = annotations.filter(a => a.issue_type === "Factual Error").length;
    const logicScore = Math.max(0, 100 - (logicErrors * 20) - (factualErrors * 35));
    
    // 4. 맥락 충분성: 누락된 맥락의 구체성 기반
    const missingContext = analysis.missing_context || [];
    const contextScore = Math.max(0, 100 - (missingContext.length * 15));
    
    // 5. 보도 중립성: 감정 강도 및 편향적 어휘 기반
    const emotionalIntensity = analysis.meta_analysis?.emotional_intensity || 0;
    const biasedWordingCount = (analysis.highlight_annotations || []).filter(a => a.issue_type === "Biased Wording").length;
    
    // 기본 점수 100에서 감정 강도(최대 10)와 편향 어휘 수에 따라 감점
    // 감점 폭을 줄여서 아주 최악이 아니면 50점 이상은 나오도록 조정
    let biasScore = 100 - (emotionalIntensity * 5) - (biasedWordingCount * 5);
    
    // 편향성 코멘트 분석
    const biasComment = (analysis.bias_check || "").toLowerCase();
    if (biasComment.includes("중립") || biasComment.includes("객관")) biasScore += 10;
    if (biasComment.includes("균형")) biasScore += 5;
    
    // 최소값 보장 (차트에 보일 정도는 되어야 함)
    biasScore = Math.max(15, Math.min(100, biasScore)); 

    return {
      source: Math.round(sourceScore),
      cross_check: Math.round(crossScore),
      logic: Math.round(logicScore),
      context: Math.round(contextScore),
      bias: Math.round(biasScore)
    };
  }

  /**
   * 동적 가중치를 적용하여 최종 앙상블 점수를 산출합니다.
   */
  static calculateEnsembleScore(
    analysis: TruthEyesAnalysis, 
    customWeights?: EnsembleBreakdown
  ): { score: number, breakdown: EnsembleBreakdown, contribution: EnsembleBreakdown } {
    
    const scores = this.calculateModuleScores(analysis);
    const weights = customWeights || this.DEFAULT_WEIGHTS;
    
    const totalWeight = weights.source + weights.cross_check + weights.logic + weights.context + weights.bias;
    const safeTotalWeight = totalWeight || 1;

    // 가중 합산 점수 계산
    const weightedSum = (
      (scores.source * weights.source) +
      (scores.cross_check * weights.cross_check) +
      (scores.logic * weights.logic) +
      (scores.context * weights.context) +
      (scores.bias * weights.bias)
    );

    const finalScore = Math.round(weightedSum / safeTotalWeight);

    // 각 모듈의 최종 점수 기여도(Contribution) 계산: (W_i * S_i) / Sum(W_j * S_j)
    const totalWeightedValue = weightedSum || 1;
    const contribution: EnsembleBreakdown = {
      source: Math.round(((scores.source * weights.source) / totalWeightedValue) * 100),
      cross_check: Math.round(((scores.cross_check * weights.cross_check) / totalWeightedValue) * 100),
      logic: Math.round(((scores.logic * weights.logic) / totalWeightedValue) * 100),
      context: Math.round(((scores.context * weights.context) / totalWeightedValue) * 100),
      bias: Math.round(((scores.bias * weights.bias) / totalWeightedValue) * 100)
    };

    return {
      score: finalScore,
      breakdown: scores, // 모듈별 원시 점수
      contribution: contribution // 최종 점수 내 비중
    };
  }

  static determineVerdict(score: number): Verdict {
    if (score >= 86) return "Trustworthy";
    if (score >= 71) return "Caution";
    if (score >= 55) return "Misleading";
    return "Propaganda";
  }
}
