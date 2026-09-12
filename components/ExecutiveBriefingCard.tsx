import React from 'react';
import { motion } from 'motion/react';
import { TruthEyesAnalysis, ExecutiveBriefing } from '../types';
import { buildExecutiveBriefing } from '../services/truthEyesEnricher';

interface ExecutiveBriefingCardProps {
  data: TruthEyesAnalysis;
  onCopySummary?: () => void;
  onPrint?: () => void;
  copyStatus?: 'idle' | 'copied';
}

export const ExecutiveBriefingCard: React.FC<ExecutiveBriefingCardProps> = ({
  data,
  onCopySummary,
  onPrint,
  copyStatus = 'idle'
}) => {
  const briefing: ExecutiveBriefing = data.executive_briefing || buildExecutiveBriefing(data);
  const verdictBadge = data.meta_analysis?.verdict_badge || 'Caution';
  const credibilityScore = data.meta_analysis?.credibility_score ?? 60;

  const verdictMeta: Record<string, { label: string; badgeClass: string; borderClass: string; icon: string }> = {
    Trustworthy: {
      label: '신뢰 (Trustworthy)',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      borderClass: 'border-emerald-500/30',
      icon: '🛡️'
    },
    Caution: {
      label: '주의 (Caution)',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      borderClass: 'border-amber-500/30',
      icon: '⚠️'
    },
    Misleading: {
      label: '왜곡 (Misleading)',
      badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
      borderClass: 'border-orange-500/30',
      icon: '🚨'
    },
    Propaganda: {
      label: '선전 (Propaganda)',
      badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40',
      borderClass: 'border-red-500/30',
      icon: '⛔'
    }
  };

  const currentMeta = verdictMeta[verdictBadge] || verdictMeta.Caution;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-slate-900/90 border ${currentMeta.borderClass} rounded-[2.5rem] p-6 md:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden`}
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-lg">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
                30초 핵심 판정 브리핑
              </h3>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Executive Briefing
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              독자가 30초 내에 기사의 진위와 의도를 파악할 수 있는 핵심 요약입니다.
            </p>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2 no-print">
          {onCopySummary && (
            <button
              onClick={onCopySummary}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border border-slate-700 active:scale-95"
              title="SNS나 메신저에 공유하기 좋은 3줄 요약 복사"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{copyStatus === 'copied' ? '요약 복사됨 ✓' : '요약 복사'}</span>
            </button>
          )}
          {onPrint && (
            <button
              onClick={onPrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-blue-900/30 active:scale-95"
              title="리포트를 PDF로 저장하거나 인쇄"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>PDF / 인쇄</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. 핵심 한 줄 판정 배너 */}
      <div className="mb-6 p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              AI 포렌식 원라인 결론
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${currentMeta.badgeClass}`}>
              {currentMeta.icon} {currentMeta.label}
            </span>
          </div>
          <p className="text-base md:text-lg font-bold text-white leading-relaxed">
            "{briefing.one_line_verdict}"
          </p>
        </div>
        
        <div className="flex items-center gap-4 pl-0 md:pl-6 md:border-l border-slate-800">
          <div className="text-center">
            <span className="text-[10px] font-black uppercase text-slate-500 block">신뢰 지수</span>
            <span className="text-2xl font-black text-white">{credibilityScore}%</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] font-black uppercase text-slate-500 block">사실 비율</span>
            <span className="text-2xl font-black text-blue-400">{briefing.fact_ratio}%</span>
          </div>
        </div>
      </div>

      {/* 2. 독자 주의 3대 포인트 */}
      <div className="mb-6">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">
          독자 주의 3대 포렌식 체크포인트 (Key Forensic Flags)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {briefing.key_caveats.map((caveat, idx) => {
            const severityColor = 
              caveat.severity === 'high' ? 'border-red-500/30 bg-red-500/5 text-red-400' :
              caveat.severity === 'medium' ? 'border-amber-500/30 bg-amber-500/5 text-amber-400' :
              'border-slate-800 bg-slate-950/40 text-slate-300';

            return (
              <div 
                key={idx} 
                className={`p-4 rounded-2xl border ${severityColor} transition-all space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{caveat.icon}</span>
                    <span className="text-xs font-black text-white">{caveat.title}</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    caveat.severity === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                    caveat.severity === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {caveat.severity === 'high' ? '주의 필요' : caveat.severity === 'medium' ? '체크 권장' : '양호'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {caveat.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 권장 정보 소비 가이드 */}
      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
        <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 text-sm mt-0.5">
          💡
        </div>
        <div className="space-y-0.5">
          <span className="text-[11px] font-black uppercase text-blue-400 tracking-wider">
            권장 정보 소비 가이드 (Actionable Reader Guidance)
          </span>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {briefing.reader_guidance}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
