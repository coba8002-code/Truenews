import React from 'react';
import { TruthEyesAnalysis, DiffComparison } from '../types';
import { buildDiffComparison } from '../services/truthEyesEnricher';

interface DiffSplitViewProps {
  data: TruthEyesAnalysis;
  onGenerateNeutralArticle?: (data: TruthEyesAnalysis, level: 'easy' | 'normal' | 'expert') => void;
  neutralLevel?: 'easy' | 'normal' | 'expert';
  setNeutralLevel?: (level: 'easy' | 'normal' | 'expert') => void;
}

export const DiffSplitView: React.FC<DiffSplitViewProps> = ({
  data,
  onGenerateNeutralArticle,
  neutralLevel = 'normal',
  setNeutralLevel
}) => {
  const diff: DiffComparison = data.diff_comparison || buildDiffComparison(data);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-950/70 border border-slate-800 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-white">
              원문 보도 vs 팩트 기반 중립 기사 비교 (Diff View)
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Neutral Rewrite
            </span>
          </div>
          <p className="text-xs text-slate-500 font-bold mt-1">
            원문의 자극적 수식어와 편향 프레임을 걷어내고, 공공 데이터와 교차 검증된 사실만을 기반으로 재작성된 기사를 비교합니다.
          </p>
        </div>

        {onGenerateNeutralArticle && (
          <div className="flex items-center gap-2">
            {setNeutralLevel && (
              <select
                value={neutralLevel}
                onChange={(e) => setNeutralLevel(e.target.value as any)}
                className="px-3 py-2 bg-slate-800 text-slate-200 text-xs font-black uppercase rounded-xl border border-slate-700 outline-none"
              >
                <option value="easy">쉬움 (요약형)</option>
                <option value="normal">보통 (스트레이트)</option>
                <option value="expert">전문가 (심층분석)</option>
              </select>
            )}
            <button
              onClick={() => onGenerateNeutralArticle(data, neutralLevel)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 active:scale-95"
            >
              <span>✨ 새 중립 기사 생성</span>
            </button>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Original Article */}
        <div className="bg-slate-950/60 border border-red-900/30 rounded-3xl p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                기존 원문 보도 (Original Article)
              </h4>
            </div>
            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
              편향/과장 표현 포함
            </span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {diff.original_paragraphs.map((para, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl text-sm leading-relaxed transition-all ${
                  para.has_issue
                    ? 'bg-red-950/20 border border-red-500/30 text-red-200 font-medium'
                    : 'text-slate-300'
                }`}
              >
                {para.has_issue && (
                  <div className="flex items-center gap-2 mb-1 text-[10px] font-black text-red-400 uppercase">
                    <span>⚠️ 포렌식 플래그 검출</span>
                    {para.issues && para.issues.length > 0 && (
                      <span className="text-slate-400 font-normal">({para.issues[0]})</span>
                    )}
                  </div>
                )}
                <p className={para.has_issue ? 'line-through opacity-80' : ''}>
                  {para.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Neutral Re-written Article */}
        <div className="bg-slate-950/60 border border-emerald-900/30 rounded-3xl p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                TruthEyes 중립 재작성 (Neutral Verified)
              </h4>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              공식 데이터 교차 검증 완료
            </span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {diff.neutral_paragraphs.map((para, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl text-sm leading-relaxed transition-all ${
                  para.is_improved
                    ? 'bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 font-medium'
                    : 'text-slate-300'
                }`}
              >
                {para.is_improved && (
                  <div className="flex items-center gap-2 mb-1 text-[10px] font-black text-emerald-400 uppercase">
                    <span>✓ 사실 중심 보정 문장</span>
                  </div>
                )}
                <p>{para.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Corrections Breakdown */}
      {diff.key_corrections && diff.key_corrections.length > 0 && (
        <div className="p-6 md:p-8 bg-slate-900/70 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚖️</span>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              핵심 보정 포인트 요약 (Key Forensic Corrections)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {diff.key_corrections.map((corr, cIdx) => (
              <div key={cIdx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-block">
                  보정 #{cIdx + 1}
                </span>
                <div>
                  <span className="text-[9px] font-bold text-red-400 uppercase block">원문 진술 (Before)</span>
                  <p className="text-xs text-red-300 line-through truncate font-medium">"{corr.before}"</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase block">팩트 보정 (After)</span>
                  <p className="text-xs text-emerald-300 font-bold leading-snug">"{corr.after}"</p>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80 leading-tight">
                  {corr.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
