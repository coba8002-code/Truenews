
import React, { useState, useMemo } from 'react';
import { TruthEyesEngine } from '../services/truthEyesEngine';
import { EnsembleBreakdown, TruthEyesAnalysis } from '../types';

const MethodologyCenter: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  
  // 엔진 최적화 고정 가중치
  const weights = useMemo(() => ({ ...TruthEyesEngine.DEFAULT_WEIGHTS }), []);

  // 시뮬레이션을 위한 가상의 분석 데이터
  const mockAnalysis: TruthEyesAnalysis = {
    article_title: "표준 분석 샘플",
    reporter_name: "시스템 검증",
    summary: "",
    bias_check: "",
    correction_suggestion: "",
    trutheyes_commentary: "",
    missing_context: ["배경 지식 누락", "통계 수치 미흡"],
    highlight_annotations: [
      { quoted_text: "", issue_type: "Logical Fallacy", explanation: "", correction_evidence: "", search_query_suggestion: "" },
      { quoted_text: "", issue_type: "Logical Fallacy", explanation: "", correction_evidence: "", search_query_suggestion: "" }
    ],
    creator_reputation_check: {
      evaluation: "",
      check_points: ["공식 인증 매체", "기존 오보 이력 없음"]
    },
    meta_analysis: {
      credibility_score: 0,
      verdict_badge: "Caution",
      political_leaning_assessment: "Center",
      emotional_intensity: 4
    },
    grounding_sources: [{}, {}, {}]
  };

  const steps = [
    { title: "데이터 포렌식", icon: "📡", desc: "뉴스 원문과 메타데이터를 정밀 수집하여 위변조 여부를 1차 검토합니다." },
    { title: "핵심 주장 추출", icon: "🔍", desc: "기사 내에서 사실 확인이 필요한 핵심 주장과 논리 구조를 분리합니다." },
    { title: "실시간 교차 검증", icon: "🔗", desc: "구글 검색 기반 Grounding 기술로 전 세계 보도 자료와 실시간 대조합니다." },
    { title: "AI 논리 심층 분석", icon: "🧠", desc: "차세대 TruthEyes AI 심층 엔진이 문맥의 모순과 편향성을 다각도로 정밀 분석합니다." },
    { title: "최종 신뢰도 판정", icon: "🛡️", desc: "검증된 데이터와 논리 점수를 합산하여 최종 신뢰 지수를 산출합니다." }
  ];

  const moduleLabels: Record<keyof EnsembleBreakdown, string> = {
    source: "출처 신뢰도",
    cross_check: "교차 검증",
    logic: "논리적 무결성",
    context: "맥락 충분성",
    bias: "보도 중립성"
  };

  // TruthEyesEngine을 사용한 최적화된 결과 계산
  const { finalScore, contributionBreakdown, moduleScores } = useMemo(() => {
    const result = TruthEyesEngine.calculateEnsembleScore(mockAnalysis, weights);
    return { 
      finalScore: result.score, 
      contributionBreakdown: result.contribution,
      moduleScores: result.breakdown
    };
  }, [weights]);

  const getVerdict = (score: number) => {
    if (score >= 88) return { label: "신뢰 가능", color: "text-emerald-400" };
    if (score >= 65) return { label: "주의 요망", color: "text-yellow-400" };
    if (score >= 40) return { label: "왜곡 가능성", color: "text-orange-400" };
    return { label: "허위/선전", color: "text-red-400" };
  };

  const verdict = getVerdict(finalScore);

  return (
    <div className="space-y-20 pb-20 animate-in fade-in duration-700">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">분석 방법론 가이드</h2>
        <p className="text-slate-500 text-base leading-relaxed">
          TruthEyes AI는 복잡한 뉴스를 5가지 핵심 지표로 분해하여 분석합니다.<br />
          최신 <span className="text-blue-400 font-bold">AI 포렌식 엔진 v3.1</span>은 인간의 직관을 넘어선 정밀한 검증을 제공합니다.
        </p>
      </div>

      {/* 신뢰성 핵심 기술 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] space-y-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeWidth="2"/></svg>
          </div>
          <h4 className="text-base font-black text-white uppercase">실시간 팩트 체크</h4>
          <p className="text-sm text-slate-500 leading-relaxed">
            AI가 단순히 아는 정보를 말하는 것이 아니라, <strong>실시간 구글 검색</strong>을 통해 현재 시점의 가장 정확한 정보를 바탕으로 기사의 진위 여부를 확인합니다.
          </p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] space-y-4">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2"/></svg>
          </div>
          <h4 className="text-base font-black text-white uppercase">심층 논리 분석</h4>
          <p className="text-sm text-slate-500 leading-relaxed">
            기사 속에 숨겨진 <strong>논리적 오류나 선동적인 문구</strong>를 찾아냅니다. AI가 문장을 하나하나 뜯어보며 앞뒤 맥락이 맞는지 꼼꼼하게 검토합니다.
          </p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] space-y-4">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth="2"/></svg>
          </div>
          <h4 className="text-base font-black text-white uppercase">객관적 수치화</h4>
          <p className="text-sm text-slate-500 leading-relaxed">
            주관적인 느낌이 아닌, <strong>정해진 알고리즘</strong>에 따라 점수를 매깁니다. 누가 분석해도 동일한 기준에 따라 결과가 나오도록 설계되었습니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-800 hidden md:block" />
        {steps.map((step, i) => (
          <div 
            key={i} 
            onClick={() => setActiveStep(i)}
            className={`relative z-10 p-6 rounded-[2rem] border transition-all cursor-pointer group ${
              activeStep === i ? 'bg-blue-600 border-blue-400 shadow-2xl scale-105' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center text-xl ${
              activeStep === i ? 'bg-white shadow-lg' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
            }`}>
              {step.icon}
            </div>
            <h4 className="text-sm font-black uppercase mb-2 tracking-widest">{step.title}</h4>
            <p className={`text-xs leading-relaxed font-medium ${activeStep === i ? 'text-blue-100' : 'text-slate-500'}`}>{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-12 overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start relative z-10">
          <div className="space-y-8">
            <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs font-black text-blue-400 uppercase tracking-widest">분석 엔진 상태 v3.1</div>
            <h3 className="text-3xl font-black text-white tracking-tight">가중치 융합 최적화 기준</h3>
            <p className="text-slate-400 text-base leading-relaxed">
              TruthEyes 엔진은 수만 건의 데이터를 학습하여 도출된 <strong>최적의 가중치</strong>를 사용합니다. 이는 조작이 불가능한 고정된 기준으로, 분석의 일관성을 보장합니다.
            </p>
            <div className="space-y-6 pt-4">
              {(Object.keys(weights) as Array<keyof EnsembleBreakdown>).map((key) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-black uppercase">
                    <span className="text-slate-500">{moduleLabels[key]} 중요도</span>
                    <span className="text-blue-400">{weights[key]}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-lg overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${weights[key]}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                    <span>샘플 점수: {moduleScores[key]}점</span>
                    <span className="text-emerald-500/50">최적화 완료</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 p-10 rounded-[3rem] border border-slate-800 shadow-2xl space-y-10">
            <div className="text-center space-y-2">
              <span className="text-slate-500 text-xs font-black uppercase tracking-widest">엔진 표준 신뢰 점수</span>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-7xl font-black text-white">{finalScore}</span>
                <span className="text-2xl font-black text-slate-700">%</span>
              </div>
              <div className={`text-sm font-black uppercase tracking-widest ${verdict.color}`}>{verdict.label}</div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">지표별 기여도 분석</h4>
                 <span className="text-[10px] text-slate-600 font-bold uppercase italic">Standard Attribution</span>
              </div>
              <div className="space-y-4">
                {(Object.entries(contributionBreakdown) as [keyof EnsembleBreakdown, number][]).map(([key, val]) => (
                  <div key={key} className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold uppercase">
                      <span className="text-slate-500">{moduleLabels[key]}</span>
                      <span className="text-slate-300">{val}% 기여</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="h-full bg-blue-600 transition-all duration-300" 
                        style={{ width: `${val}%`, opacity: 0.3 + (val / 100) }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-blue-600/5 rounded-2xl border border-blue-500/20">
               <div className="flex gap-4 items-start">
                  <div className="text-blue-500 pt-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/></svg></div>
                  <p className="text-xs text-blue-400/80 font-medium leading-relaxed">
                    위 결과는 표준 샘플 데이터를 바탕으로 산출된 예시입니다. 
                    실제 분석 시에는 기사의 내용에 따라 각 모듈의 점수가 실시간으로 계산되며, 
                    고정된 최적 가중치와 결합하여 최종 신뢰 지수를 도출합니다.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MethodologyCenter;
