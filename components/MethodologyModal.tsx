
import React from 'react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Analysis Methodology</h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">분석 방법론 가이드 v3.1</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12">
          
          {/* SECTION 1: TRUTHEYES STRUCTURE */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">01</div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">트루스아이즈 구조 (TruthEyes Structure)</h3>
            </div>
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-blue-600 mb-2"><svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" strokeWidth="2"/><path d="M14 3v5h5" strokeWidth="2"/></svg></div>
                  <p className="text-sm font-black text-slate-900 uppercase">Input Article</p>
                  <p className="text-xs text-slate-500 mt-1">뉴스 원문 수집</p>
                </div>
                <div className="text-slate-300"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" strokeWidth="3"/></svg></div>
                <div className="flex-1 text-center p-6 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200">
                  <div className="text-white mb-2"><svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth="2"/></svg></div>
                  <p className="text-sm font-black text-white uppercase">AI Analysis</p>
                  <p className="text-xs text-blue-100 mt-1">포렌식 엔진 분석</p>
                </div>
                <div className="text-slate-300"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" strokeWidth="3"/></svg></div>
                <div className="flex-1 text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-emerald-500 mb-2"><svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/></svg></div>
                  <p className="text-sm font-black text-slate-900 uppercase">Output Result</p>
                  <p className="text-xs text-slate-500 mt-1">신뢰도 리포트 생성</p>
                </div>
              </div>
              <p className="mt-8 text-sm text-slate-600 leading-relaxed text-center font-medium">
                트루스아이즈(TruthEyes) AI는 입력된 기사를 다각도로 분해하여 사실 관계를 대조하고, <br className="hidden md:block"/>
                논리적 결함과 편향성을 추적하여 최종적인 신뢰 지수를 도출합니다.
              </p>
            </div>
          </section>

          {/* SECTION 2: KEY ANALYSIS ALGORITHMS */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">02</div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Key Analysis Algorithms (주요 분석 알고리즘)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-5">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeWidth="2"/></svg>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase mb-1">Semantic Analysis (의미론적 분석)</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">문장의 숨은 의도와 맥락을 파악하여 단순 텍스트 이상의 의미를 분석합니다.</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeWidth="2"/></svg>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase mb-1">Fact Verification (팩트 검증)</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">실시간 검색 데이터를 기반으로 보도 내용의 사실 여부를 교차 검증합니다.</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-5">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2"/></svg>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase mb-1">Bias Detection (편향 감지)</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">정치적, 감정적 편향성을 감지하여 보도의 중립성을 평가합니다.</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-5">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2"/></svg>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase mb-1">Credibility Scoring (신뢰도 평가)</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">매체와 기자의 과거 이력 및 분석 결과를 종합하여 0-100% 점수를 산출합니다.</p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: VERIFICATION PROCESS */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">03</div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Verification Process (검증 절차)</h3>
            </div>
            <div className="relative">
              <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-slate-100 hidden md:block" />
              <div className="space-y-8">
                {[
                  { step: "Step 1", title: "Extract key claims from article", desc: "기사 내 핵심 주장과 사실 확인 대상을 추출합니다." },
                  { step: "Step 2", title: "Cross-reference with reliable sources", desc: "신뢰할 수 있는 다수의 소스와 실시간 대조 작업을 수행합니다." },
                  { step: "Step 3", title: "Analyze writing style and tone", desc: "문체, 단어 선택, 감정적 표현을 분석하여 편향성을 확인합니다." },
                  { step: "Step 4", title: "Generate credibility report", desc: "모든 분석 결과를 종합하여 최종 신뢰도 리포트를 생성합니다." }
                ].map((item, i) => (
                  <div key={i} className="relative flex gap-6 items-start">
                    <div className="w-12 h-12 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center text-blue-600 font-black text-xs z-10 shadow-sm shrink-0">
                      {i + 1}
                    </div>
                    <div className="pt-1">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 4: RATING SYSTEM */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">04</div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Rating System (평가 시스템)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500 mx-auto flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3"/></svg>
                </div>
                <h4 className="text-sm font-black text-emerald-700 uppercase">Trustworthy</h4>
                <p className="text-xs text-emerald-600/80 font-bold">80 - 100%</p>
                <p className="text-[10px] text-emerald-600 font-medium">신뢰도가 높으며 사실 관계가 명확함</p>
              </div>
              <div className="p-6 bg-yellow-50 rounded-3xl border border-yellow-100 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-yellow-500 mx-auto flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2"/></svg>
                </div>
                <h4 className="text-sm font-black text-yellow-700 uppercase">Caution</h4>
                <p className="text-xs text-yellow-600/80 font-bold">50 - 79%</p>
                <p className="text-[10px] text-yellow-600 font-medium">일부 사실 확인이 필요하거나 편향적임</p>
              </div>
              <div className="p-6 bg-red-50 rounded-3xl border border-red-100 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-500 mx-auto flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg>
                </div>
                <h4 className="text-sm font-black text-red-700 uppercase">Misleading</h4>
                <p className="text-xs text-red-600/80 font-bold">0 - 49%</p>
                <p className="text-[10px] text-red-600 font-medium">허위 정보 또는 심각한 왜곡이 감지됨</p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">TruthEyes AI Forensics Engine Methodology Guide</p>
        </div>
      </div>
    </div>
  );
};

export default MethodologyModal;
