import React from 'react';
import { GroundingSource } from '../types';
import { classifySourceTier } from '../services/truthEyesEnricher';

interface EvidenceSourcesViewProps {
  sources?: GroundingSource[];
}

export const EvidenceSourcesView: React.FC<EvidenceSourcesViewProps> = ({ sources = [] }) => {
  if (!sources || sources.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/40 rounded-[2.5rem] border border-slate-800 text-slate-500 font-bold text-xs uppercase">
        교차 검증된 외부 링크 데이터가 없습니다.
      </div>
    );
  }

  // Enrich sources with tier classification
  const enrichedSources = sources.map((s, idx) => {
    const classification = classifySourceTier(s.uri, s.title);
    return {
      ...s,
      tier: s.tier || classification.tier,
      tierLabel: s.tierLabel || classification.tierLabel,
      tierDescription: s.tierDescription || classification.tierDescription,
      badgeClass: classification.badgeClass,
      domain: s.uri ? new URL(s.uri).hostname.replace('www.', '') : '웹 출처'
    };
  });

  // Count by tier
  const tier1Count = enrichedSources.filter(s => s.tier === 1).length;
  const tier2Count = enrichedSources.filter(s => s.tier === 2).length;
  const tier3Count = enrichedSources.filter(s => s.tier === 3).length;

  return (
    <div className="space-y-6">
      {/* Tier Explanation Summary Bar */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
            T1
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">공식 1차 출처</span>
              <span className="text-[10px] font-bold text-emerald-400">100% 가중치</span>
            </div>
            <p className="text-[11px] text-slate-400">정부·사법부·공시 등 ({tier1Count}건)</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs">
            T2
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">주요 제도권 언론</span>
              <span className="text-[10px] font-bold text-blue-400">75% 가중치</span>
            </div>
            <p className="text-[11px] text-slate-400">연합·지상파·주요 일간지 ({tier2Count}건)</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
            T3
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">일반 매체/오피니언</span>
              <span className="text-[10px] font-bold text-amber-400">40% 가중치</span>
            </div>
            <p className="text-[11px] text-slate-400">기명 칼럼·블로그·커뮤니티 ({tier3Count}건)</p>
          </div>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enrichedSources.map((source, idx) => (
          <a
            key={idx}
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 bg-slate-900/60 border border-slate-800 rounded-3xl hover:border-blue-500/40 hover:bg-slate-900/90 transition-all flex flex-col justify-between gap-4 group shadow-lg relative overflow-hidden"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${source.badgeClass}`}>
                  {source.tierLabel}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {source.domain}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                {source.title || source.uri || `검증 출처 #${idx + 1}`}
              </h4>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-medium">
              <span className="truncate max-w-[200px]">{source.tierDescription}</span>
              <svg className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
