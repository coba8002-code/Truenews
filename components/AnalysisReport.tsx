
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import Skeleton from './Skeleton';
import { TruthEyesAnalysis, RealEstateAnalysis, StockAnalysis, NewsItem, EnsembleBreakdown } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../src/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ExecutiveBriefingCard } from './ExecutiveBriefingCard';
import { EvidenceSourcesView } from './EvidenceSourcesView';
import { InteractiveHighlightViewer } from './InteractiveHighlightViewer';
import { PoliticalCompass2DView } from './PoliticalCompass2DView';
import { DiffSplitView } from './DiffSplitView';
import { enrichTruthEyesAnalysis } from '../services/truthEyesEnricher';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LabelList
} from 'recharts';

const StockInsight: React.FC<{ insight: StockAnalysis }> = ({ insight }) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Header Section */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.3em]">주식 포렌식 리포트</h3>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              DART Grounding
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-4xl font-black text-white tracking-tight">{insight.company_name || '분석 종목'}</span>
            <span className="text-lg font-mono font-bold text-slate-500 bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700/50">
              {insight.ticker || 'TICKER'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-8 bg-slate-950/50 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">하이프 지수 (Hype Index)</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-black tracking-tighter ${insight.hype_index > 70 ? 'text-red-500' : insight.hype_index > 40 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                {insight.hype_index}
              </span>
              <span className="text-sm font-bold text-slate-500">%</span>
            </div>
          </div>
          <div className="w-px h-16 bg-slate-800" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">시장 심리 (Sentiment)</span>
            <div className="flex items-center gap-3">
              <span className={`text-3xl ${insight.sentiment_gauge === 'Bullish' ? 'text-red-500' : insight.sentiment_gauge === 'Bearish' ? 'text-blue-500' : 'text-slate-400'}`}>
                {insight.sentiment_gauge === 'Bullish' ? '📈' : insight.sentiment_gauge === 'Bearish' ? '📉' : '↔️'}
              </span>
              <span className={`text-lg font-black uppercase tracking-widest ${insight.sentiment_gauge === 'Bullish' ? 'text-red-500' : insight.sentiment_gauge === 'Bearish' ? 'text-blue-500' : 'text-slate-400'}`}>
                {insight.sentiment_gauge}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* DART Fact Check */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <span className="text-sm font-black text-slate-300 uppercase tracking-widest">DART 공시 기반 팩트체크</span>
          </div>
          
          <div className="space-y-4">
            {(Array.isArray(insight.dart_fact_check) ? insight.dart_fact_check : [])?.map((check, i) => (
              <div key={i} className={`p-6 rounded-3xl border transition-all hover:shadow-lg ${check.is_consistent ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40' : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <p className="text-base font-bold text-white leading-relaxed flex-1">{check.claim}</p>
                  <span className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${check.is_consistent ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                    {check.is_consistent ? '일치 (Consistent)' : '불일치 (Contradictory)'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800/50">
                  <p className="text-sm text-slate-400 font-medium">{check.official_status}</p>
                  {check.evidence_link && (
                    <a href={check.evidence_link} target="_blank" rel="noreferrer" className="shrink-0 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-[11px] font-bold text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all flex items-center gap-2">
                      공시 원문 확인
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insider & Earnings */}
        <div className="space-y-6">
          {/* Insider Move */}
          <div className="p-8 bg-slate-950/80 rounded-[2.5rem] border border-slate-800/80 space-y-6 backdrop-blur-sm hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between border-b border-slate-800/50 pb-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">내부자 행보</span>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${insight.insider_move_check?.caution_level === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/30' : insight.insider_move_check?.caution_level === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                {insight.insider_move_check?.caution_level === 'High' ? '고위험 (High)' : insight.insider_move_check?.caution_level === 'Medium' ? '중위험 (Medium)' : '저위험 (Low)'} 위험 (Risk)
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">{insight.insider_move_check?.evaluation}</p>
            {insight.insider_move_check?.recent_trades && insight.insider_move_check.recent_trades.length > 0 && (
              <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                {(Array.isArray(insight.insider_move_check.recent_trades) ? insight.insider_move_check.recent_trades : []).map((trade, i) => (
                  <div key={i} className="text-xs text-slate-400 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-slate-600 rounded-full mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{trade}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Earnings Quality */}
          <div className="p-8 bg-slate-950/80 rounded-[2.5rem] border border-slate-800/80 space-y-6 backdrop-blur-sm hover:border-slate-700 transition-all">
            <div className="border-b border-slate-800/50 pb-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">실적의 질 (Earnings Quality)</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">본업 이익 비중</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white tracking-tighter">{insight.earnings_quality?.main_operating_profit_ratio}</span>
                <span className="text-xl font-bold text-slate-500">%</span>
              </div>
            </div>
            
            <p className="text-sm text-slate-400 leading-relaxed bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
              {insight.earnings_quality?.one_time_gains_info}
            </p>
            
            {insight.earnings_quality?.warning_message && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                <span className="text-red-400 text-lg">⚠️</span>
                <p className="text-xs text-red-400 font-bold leading-relaxed pt-0.5">
                  {insight.earnings_quality.warning_message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-slate-800/80 relative z-10">
        <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800/50 space-y-4 hover:bg-slate-800/30 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <span className="text-indigo-400 text-xs">🎯</span>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">테마 검증 (Theme)</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-black text-white">{insight.theme_cluster_validation?.theme_name}</span>
            <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">{insight.theme_cluster_validation?.relevance_score}% Match</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">{insight.theme_cluster_validation?.relevance_reason}</p>
        </div>

        <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800/50 space-y-4 hover:bg-slate-800/30 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <span className="text-amber-400 text-xs">🌍</span>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">거시 상관관계 (Macro)</span>
          </div>
          <p className="text-lg font-black text-white">{insight.macro_correlation?.factor}</p>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">{insight.macro_correlation?.correlation_desc}</p>
        </div>

        <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800/50 space-y-4 hover:bg-slate-800/30 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <span className="text-emerald-400 text-xs">🌱</span>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">그린워싱 탐지 (ESG)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${insight.greenwashing_detection?.is_greenwashing ? 'bg-red-500 text-red-500' : 'bg-emerald-500 text-emerald-500'}`} />
            <span className={`text-sm font-black uppercase tracking-widest ${insight.greenwashing_detection?.is_greenwashing ? 'text-red-400' : 'text-emerald-400'}`}>
              {insight.greenwashing_detection?.is_greenwashing ? '그린워싱 의심' : '정상 보도'}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">{insight.greenwashing_detection?.claim}</p>
        </div>

        {/* Strategic Valuation Advancement */}
        {insight.strategic_valuation && (
          <div className="col-span-full p-8 bg-blue-600/10 border border-blue-500/30 rounded-[2.5rem] space-y-8 mt-4">
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-4">
              <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                전략적 가치 평가 리포트 (Investment Forensic)
              </h4>
              <span className="text-[10px] text-blue-300/60 font-mono tracking-widest uppercase italic">Advanced Analytic Verdict v3.1</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">내재 가치 추정</span>
                <p className="text-base font-bold text-white leading-relaxed">{insight.strategic_valuation.intrinsic_value_estimate}</p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">적정 가격 갭 분석</span>
                <p className="text-base font-bold text-white leading-relaxed">{insight.strategic_valuation.fair_price_gap}</p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">컨센서스 감사 결과</span>
                <p className="text-base font-bold text-white leading-relaxed">{insight.strategic_valuation.analyst_consensus_audit}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface AnalysisReportProps {
  data: TruthEyesAnalysis;
  onOpenArticle?: (article: NewsItem) => void;
  onGenerateNeutralArticle?: (data: TruthEyesAnalysis, level: 'easy' | 'normal' | 'expert') => void;
}

const RealEstateInsight: React.FC<{ insight: RealEstateAnalysis }> = ({ insight }) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.3em]">부동산 특화 분석</h3>
            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              포렌식 인사이트 (Forensic Insight)
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-4xl font-black text-white tracking-tight">{insight.region || '전국'}</span>
            <span className="text-lg font-bold text-slate-500 uppercase tracking-widest">지역 분석</span>
          </div>
        </div>

        <div className="flex items-center gap-8 bg-slate-950/50 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">하이프 점수 (Hype Score)</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-black tracking-tighter ${insight.hype_score > 70 ? 'text-red-500' : insight.hype_score > 40 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                {insight.hype_score}
              </span>
              <span className="text-sm font-bold text-slate-500">%</span>
            </div>
          </div>
          <div className="w-px h-16 bg-slate-800" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">시장 심리 (Market Sentiment)</span>
            <div className="flex items-center gap-3">
              <span className={`text-3xl ${insight.market_sentiment === 'Bullish' ? 'text-red-500' : insight.market_sentiment === 'Bearish' ? 'text-blue-500' : 'text-slate-400'}`}>
                {insight.market_sentiment === 'Bullish' ? '📈' : insight.market_sentiment === 'Bearish' ? '📉' : '↔️'}
              </span>
              <span className={`text-lg font-black uppercase tracking-widest ${insight.market_sentiment === 'Bullish' ? 'text-red-500' : insight.market_sentiment === 'Bearish' ? 'text-blue-500' : 'text-slate-400'}`}>
                {insight.market_sentiment}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
        {/* Hype vs Fact */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <span className="text-sm font-black text-slate-300 uppercase tracking-widest">하이프(Hype) 분석 및 근거</span>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>시장 과열도</span>
                <span>{insight.hype_score}%</span>
              </div>
              <div className="h-2.5 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/30">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${insight.hype_score}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`h-full ${insight.hype_score > 70 ? 'bg-gradient-to-r from-red-600 to-red-400' : insight.hype_score > 40 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
                />
              </div>
            </div>

            <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-sm">
              <ul className="space-y-4">
                {(Array.isArray(insight.hype_reasons) ? insight.hype_reasons : [])?.map((reason, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-4 group">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                    <span className="leading-relaxed font-medium group-hover:text-slate-200 transition-colors">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Policy & Supply/Demand */}
        <div className="space-y-6">
          <div className="p-8 bg-slate-950/80 rounded-[2.5rem] border border-slate-800/80 space-y-6 backdrop-blur-sm hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <span className="text-amber-400 text-xs">⚖️</span>
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">정책 영향 시뮬레이션</span>
            </div>
            <p className="text-base font-bold text-slate-200 leading-relaxed italic">"{insight.policy_impact}"</p>
          </div>

          <div className="p-8 bg-slate-950/80 rounded-[2.5rem] border border-slate-800/80 space-y-6 backdrop-blur-sm hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <span className="text-indigo-400 text-xs">📊</span>
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">공급/수요 데이터 그라운딩</span>
            </div>
            <p className="text-base font-bold text-slate-200 leading-relaxed italic">"{insight.supply_demand_status}"</p>
          </div>
        </div>

        {/* Strategic Foresight Advancement */}
        {insight.strategic_foresight && (
          <div className="col-span-full p-8 bg-emerald-600/10 border border-emerald-500/30 rounded-[2.5rem] space-y-8 mt-4">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
              <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                부동산 전략적 전망 (Strategic Outlook)
              </h4>
              <span className="text-[10px] text-emerald-300/60 font-mono tracking-widest uppercase italic">Geo-Policy Forensic v2.8</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">단기 시장 전망</span>
                <p className="text-base font-bold text-white leading-relaxed">{insight.strategic_foresight.short_term_outlook}</p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">장기 리스크 요인</span>
                <p className="text-base font-bold text-white leading-relaxed">{insight.strategic_foresight.long_term_risk}</p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">최종 자산 판결</span>
                <p className="text-base font-bold text-white leading-relaxed">{insight.strategic_foresight.investment_verdict}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AnalysisReport: React.FC<AnalysisReportProps> = ({ data, onOpenArticle, onGenerateNeutralArticle }) => {
  // Ensure all enrichment fields (executive_briefing, political_compass, diff_comparison, source tiering) are present
  const enriched = useMemo(() => enrichTruthEyesAnalysis(data), [data]);
  
  const [activeTab, setActiveTab] = useState<'commentary' | 'original' | 'diff'>('commentary');
  const [summaryLevel, setSummaryLevel] = useState<'easy' | 'general' | 'expert'>('general');
  const [neutralLevel, setNeutralLevel] = useState<'easy' | 'normal' | 'expert'>('normal');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [copySummaryStatus, setCopySummaryStatus] = useState<'idle' | 'copied'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const ensembleBreakdown = enriched.meta_analysis?.ensemble_breakdown || { source: 0, cross_check: 0, logic: 0, context: 0, bias: 0 };

  const ensembleData = useMemo(() => {
    const modules: Record<string, string> = {
      source: "출처 신뢰도 (Source)",
      cross_check: "교차 검증 (Cross-check)",
      logic: "논리적 무결성 (Logic)",
      context: "맥락 충분성 (Context)",
      bias: "보도 중립성 (Neutrality)"
    };
    
    // Use raw individual scores for this horizontal quality chart
    const rawBreakdown = enriched.ensemble_breakdown || enriched.meta_analysis?.ensemble_breakdown || {
      source: 0, cross_check: 0, logic: 0, context: 0, bias: 0
    };
    
    const order: (keyof EnsembleBreakdown)[] = ['source', 'cross_check', 'logic', 'context', 'bias'];
    
    return order.map(key => {
      const value = rawBreakdown[key] || 0;
      const label = modules[key as string] || (key as string);
      return {
        name: label.split(' (')[0], // Use shorter name for axis
        fullName: label,
        score: value,
        color: value > 80 ? '#10b981' : value > 60 ? '#f59e0b' : '#ef4444'
      };
    });
  }, [enriched.ensemble_breakdown, enriched.meta_analysis]);

  const getShareUrl = () => {
    const serializedData = btoa(encodeURIComponent(JSON.stringify(enriched)));
    return `${window.location.origin}${window.location.pathname}?report=${serializedData}`;
  };

  const handleCopyLink = () => {
    try {
      const shareUrl = getShareUrl();
      navigator.clipboard.writeText(shareUrl).then(() => {
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 3000);
      });
    } catch (err) {
      console.error('Failed to generate share link:', err);
      alert('공유 링크 생성에 실패했습니다.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    try {
      const verdictLabel = verdictMap[enriched.meta_analysis?.verdict_badge || '']?.label || '판정 완료';
      const score = enriched.meta_analysis?.credibility_score ?? 0;
      const briefing = enriched.executive_briefing;
      const shareUrl = getShareUrl();

      const summaryText = `[TruthEyes AI 팩트체크 검증 리포트]
📰 기사 제목: "${enriched.article_title}"
🛡️ 신뢰 지수: ${score}% (${verdictLabel})
⚡ 핵심 판정: ${briefing?.one_line_verdict || enriched.summary}

🔍 독자 주의 3대 포인트:
• 자극/편향 어휘: ${briefing?.key_caveats[0]?.detail || '분석 완료'}
• 사실/논리 검증: ${briefing?.key_caveats[1]?.detail || '분석 완료'}
• 배경 맥락 충분성: ${briefing?.key_caveats[2]?.detail || '분석 완료'}

💡 권장 소비 가이드: ${briefing?.reader_guidance || '공식 1차 자료와 교차 검증을 권장합니다.'}
🔗 전체 리포트 상세 확인: ${shareUrl}`;

      navigator.clipboard.writeText(summaryText).then(() => {
        setCopySummaryStatus('copied');
        setTimeout(() => setCopySummaryStatus('idle'), 3000);
      });
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  const shareToSocial = (platform: 'twitter' | 'facebook' | 'kakao') => {
    const shareUrl = getShareUrl();
    const text = data.meta_analysis 
      ? `[TruthEyes AI] "${data.article_title}" 팩트체크 리포트 결과: 신뢰 지수 ${data.meta_analysis?.credibility_score ?? 0}% (${verdictMap[data.meta_analysis?.verdict_badge || '']?.label || '분석 중'})`
      : `[TruthEyes AI] "${data.article_title}" 팩트체크 분석 중...`;
    
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'kakao':
        // KakaoTalk web link sharing (simple version)
        url = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    setSaveStatus('saving');
    try {
      const analysesRef = collection(db, 'users', user.uid, 'saved_analyses');
      await addDoc(analysesRef, {
        userId: user.uid,
        title: data.article_title,
        url: data.original_url || '',
        reportData: data,
        savedAt: new Date().toISOString()
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/saved_analyses`);
    } finally {
      setSaveStatus('idle');
    }
  };

  const verdictMap: Record<string, { label: string; range: string; styles: string; desc: string }> = {
    'Trustworthy': { 
      label: "신뢰", 
      range: "86-100%", 
      styles: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      desc: "내용이 객관적이며 교차 검증이 완료된 고품질 기사입니다."
    },
    'Caution': { 
      label: "주의", 
      range: "71-85%", 
      styles: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      desc: "사실이나 자극적인 표현이나 일부 배경 설명이 누락되었습니다."
    },
    'Misleading': { 
      label: "왜곡", 
      range: "55-70%", 
      styles: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      desc: "의도적인 맥락 누락이나 논리적 비약이 다수 발견되었습니다."
    },
    'Propaganda': { 
      label: "선전", 
      range: "0-54%", 
      styles: 'bg-red-500/10 text-red-400 border-red-500/30',
      desc: "특정 의도를 가진 허위 사실 유포나 감정 선동 목적의 콘텐츠입니다."
    },
  };

  const issueTypeMap: Record<string, string> = {
    "Factual Error": "사실 관계 오류",
    "Logical Fallacy": "논리적 오류",
    "Missing Context": "맥락 누락",
    "Biased Wording": "편향적 어휘",
    "Exaggeration": "과장 보도"
  };

  const moduleLabels: Record<string, string> = {
    source: "출처 신뢰도",
    cross_check: "교차 검증",
    logic: "논리적 무결성",
    context: "맥락 충분성",
    bias: "보도 중립성"
  };

  const currentVerdict = verdictMap[enriched.meta_analysis?.verdict_badge || ''] || { label: "분석 중...", range: "-", styles: 'bg-slate-500/20 text-slate-400 border-slate-500/50 animate-pulse', desc: "데이터를 수집하고 분석하는 중입니다..." };
  const credibilityScore = enriched.meta_analysis?.credibility_score ?? 0;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      
      {/* Official Print Certificate Header (Printed on paper/PDF only) */}
      <div className="print-certificate-header hidden print:block">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-xl text-slate-900 uppercase tracking-tight">TRUTHEYES AI</span>
              <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-black uppercase">Official Media Audit</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">
              미디어 포렌식 팩트체크 검증 인증서
            </h1>
            <p className="text-xs text-slate-700 font-bold mt-1">
              기사 제목: {enriched.article_title}
            </p>
          </div>
          <div className="text-right text-xs text-slate-700 space-y-1">
            <p className="font-mono">발급 일시: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p className="font-bold text-slate-900">최종 신뢰도: {credibilityScore}% ({currentVerdict.label})</p>
            <p>검증 엔진: TruthEyes AI Multi-Agent Engine v3.1</p>
          </div>
        </div>
      </div>

      {/* 30-Second Executive Briefing Card */}
      <ExecutiveBriefingCard 
        data={enriched}
        onCopySummary={handleCopySummary}
        onPrint={handlePrint}
        copyStatus={copySummaryStatus}
      />

      {/* Quick Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl no-print">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider pl-2">리포트 활용 도구</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border border-slate-700 active:scale-95"
            title="3줄 요약 복사"
          >
            <span>📋</span>
            <span>{copySummaryStatus === 'copied' ? '3줄 요약 복사됨 ✓' : '3줄 요약 복사'}</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border border-slate-700 active:scale-95"
            title="리포트 링크 복사"
          >
            <span>🔗</span>
            <span>{shareStatus === 'copied' ? '링크 복사됨 ✓' : '리포트 링크 공유'}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border border-slate-700 active:scale-95"
            title="내 보관함에 리포트 저장"
          >
            <span>💾</span>
            <span>{saveStatus === 'saving' ? '저장 중...' : saveStatus === 'saved' ? '보관함 저장됨 ✓' : '보관함 저장'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-blue-900/30 active:scale-95"
            title="PDF로 저장하거나 인쇄"
          >
            <span>🖨️</span>
            <span>PDF 출력 / 인쇄</span>
          </button>
        </div>
      </div>
      
      {/* Top Tabs: Commentary vs Interactive Highlight vs Diff Split */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-4 flex flex-col gap-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap p-1.5 bg-slate-950/50 rounded-2xl border border-slate-800 self-center gap-1">
          <button 
            onClick={() => setActiveTab('commentary')}
            className={`px-6 md:px-8 py-3 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'commentary' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            AI 심층 논평
          </button>
          <button 
            onClick={() => setActiveTab('original')}
            className={`px-6 md:px-8 py-3 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'original' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            대화형 본문 검증
          </button>
          <button 
            onClick={() => setActiveTab('diff')}
            className={`px-6 md:px-8 py-3 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'diff' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            원문 vs 중립 (Diff)
          </button>
        </div>

        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {activeTab === 'commentary' ? (
              <motion.div
                key="commentary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-800" />
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em]">트루스아이즈 논평 (TruthEyes Editorial)</span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>
                <div className="max-w-4xl mx-auto space-y-6">
                  <h3 className="text-2xl md:text-3xl font-black text-white text-center leading-snug tracking-tight">
                    {data.article_title || <Skeleton height="36px" className="w-3/4 mx-auto" />}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
                    <div className="md:col-span-8 space-y-6 text-slate-200 leading-relaxed text-lg font-normal">
                      {data.trutheyes_commentary ? (
                        data.trutheyes_commentary.split('\n').map((para, i) => (
                          para.trim() && <p key={i}>{para}</p>
                        ))
                      ) : (
                        <div className="space-y-4">
                          <Skeleton height="20px" className="w-full" />
                          <Skeleton height="20px" className="w-full" />
                          <Skeleton height="20px" className="w-3/4" />
                          <Skeleton height="20px" className="w-full" />
                          <Skeleton height="20px" className="w-1/2" />
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-4 p-6 bg-slate-950 border-l-4 border-blue-600 rounded-r-2xl">
                      <span className="text-xs font-black text-slate-600 uppercase mb-3 block">핵심 요약</span>
                      {data.meta_analysis ? (
                        <p className="text-sm font-bold text-white italic leading-relaxed">
                          "본 기사는 {data.meta_analysis?.verdict_badge === 'Trustworthy' ? '신뢰할 수 있는 데이터 구조를 갖추고 있으나' : '다양한 포렌식 결함이 발견되었으며'}, 특히 {data.missing_context?.[0] || '배경 맥락'} 부분에서 보정이 시급합니다."
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <Skeleton height="14px" className="w-full" />
                          <Skeleton height="14px" className="w-full" />
                          <Skeleton height="14px" className="w-3/4" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-10 mt-8">
                    <div className="flex items-center justify-between mb-10">
                       <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth="2"/></svg>
                         포렌식 알고리즘 분석 상세 (Forensic Breakdown)
                       </h4>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ensembleData} layout="vertical" margin={{ left: 20, right: 40, top: 0, bottom: 0 }}>
                          <XAxis type="number" hide domain={[0, 100]} />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            stroke="#94a3b8" 
                            fontSize={13} 
                            width={100}
                            fontWeight="900"
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1.5rem', color: '#fff' }}
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                          />
                          <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={24}>
                            <LabelList 
                              dataKey="score" 
                              position="right" 
                              fill="#94a3b8" 
                              formatter={(val: number) => `${val}%`}
                              style={{ fontSize: '12px', fontWeight: '900', fontFamily: 'Inter' }}
                              offset={10}
                            />
                            {ensembleData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'original' ? (
              <motion.div
                key="original"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-800" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">대화형 본문 검증 및 요약 (Interactive Inspector)</span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>
                
                {/* Summary Level Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">요약 난이도:</span>
                    <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
                      {(['easy', 'general', 'expert'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setSummaryLevel(level)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            summaryLevel === level 
                              ? 'bg-blue-600 text-white shadow-lg' 
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {level === 'easy' ? '쉬움' : level === 'general' ? '일반' : '전문가'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {enriched.original_url && (
                    <a 
                      href={enriched.original_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-black uppercase rounded-xl transition-all border border-slate-700"
                    >
                      기사 원문 링크 ↗
                    </a>
                  )}
                </div>

                {/* Interactive Highlight Inspection */}
                <InteractiveHighlightViewer 
                  content={enriched.original_content}
                  annotations={enriched.highlight_annotations}
                  summary={enriched.summaries ? enriched.summaries[summaryLevel] : enriched.summary}
                />
              </motion.div>
            ) : (
              <motion.div
                key="diff"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <DiffSplitView 
                  data={enriched}
                  onGenerateNeutralArticle={onGenerateNeutralArticle}
                  neutralLevel={neutralLevel}
                  setNeutralLevel={setNeutralLevel}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Article Info Section */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 md:p-14 backdrop-blur-3xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-7v-2h7v2zm3-4h-10v-2h10v2zm0-4h-10V7h10v2z"/></svg>
        </div>
        <div className="relative z-10 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-black uppercase tracking-widest">앙상블 분석 로직 적용됨</span>
               {data.analysis_time_ms !== undefined && (
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">분석 소요: {data.analysis_time_ms === 0 ? "캐시됨" : `${(data.analysis_time_ms/1000).toFixed(2)}초`}</span>
               )}
            </div>
            <div className="relative">
             {onGenerateNeutralArticle && (
                <div className='flex items-center gap-2'>
                  <select 
                      value={neutralLevel} 
                      onChange={(e) => setNeutralLevel(e.target.value as any)}
                      className="px-3 py-3 bg-slate-800 text-slate-300 text-sm font-black uppercase rounded-xl border border-slate-700"
                  >
                      <option value="easy">쉬움</option>
                      <option value="normal">보통</option>
                      <option value="expert">전문가</option>
                  </select>
                  <button
                    onClick={() => onGenerateNeutralArticle(data, neutralLevel)}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-lg transition-all"
                  >
                    중립 기사 생성
                  </button>
                </div>
              )}
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
            {data.article_title || <Skeleton height="48px" className="w-3/4" />}
          </h2>
          <div className="flex flex-col md:flex-row gap-8 text-slate-400 items-start md:items-center pt-6 border-t border-slate-800">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-blue-500 shadow-inner"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2"/></svg></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">작성자/출처</p>
                  {data.reporter_name ? (
                    <p className="text-slate-200 font-bold text-lg">{data.reporter_name}</p>
                  ) : (
                    <Skeleton width="120px" height="24px" className="mt-1" />
                  )}
                </div>
             </div>
             {data.summary ? (
               <p className="text-base font-medium leading-relaxed max-w-2xl text-slate-300">{data.summary}</p>
             ) : (
               <div className="flex-1 space-y-2">
                 <Skeleton height="16px" className="w-full" />
                 <Skeleton height="16px" className="w-2/3" />
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Main Analysis Stats & Verdict Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-[3rem] p-10 flex flex-col items-center justify-center space-y-4 shadow-2xl">
          <span className="text-sm font-black uppercase text-slate-500 tracking-[0.3em]">최종 신뢰 지수</span>
          {data.meta_analysis ? (
            <>
              <div className="text-7xl font-black text-white tracking-tighter">{credibilityScore}<span className="text-xl text-slate-700">%</span></div>
              <div className={`px-5 py-1.5 rounded-full border text-sm font-black uppercase tracking-widest ${currentVerdict.styles}`}>{currentVerdict.label}</div>
              <span className="text-[10px] font-bold text-slate-600 uppercase mt-2">Final Credibility Index</span>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Skeleton width="100px" height="72px" />
              <Skeleton width="80px" height="32px" className="rounded-full" />
            </div>
          )}
        </div>

        {/* 1. 판정 기준 가이드 섹션 */}
        <div className="lg:col-span-1 bg-slate-950/40 border border-slate-800 rounded-[3rem] p-8 space-y-4">
           <div className="flex flex-col mb-2">
             <span className="text-sm font-black text-slate-600 uppercase tracking-widest block">지수 판정 가이드</span>
             <span className="text-[9px] font-bold text-slate-700 uppercase tracking-tighter">Index Verdict Guide</span>
           </div>
           <div className="space-y-3">
              {Object.entries(verdictMap).map(([key, info]) => (
                <div key={key} className={`flex items-center gap-3 p-2 rounded-xl border ${data.meta_analysis?.verdict_badge === key ? 'bg-slate-800 border-slate-700' : 'border-transparent opacity-40'}`}>
                   <div className={`w-2 h-2 rounded-full ${(info.styles || "").split(' ')[0]}`} />
                   <div className="flex-1">
                      <div className="flex justify-between items-center mb-0.5">
                         <span className="text-sm font-black text-slate-200">{info.label}</span>
                         <span className="text-xs font-bold text-slate-500">{info.range}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-tight">{info.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-[3rem] p-10 space-y-8">
          <div className="space-y-4">
             <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-500 uppercase tracking-widest">앙상블 GNN 세부 기여도</span>
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Ensemble Weighted Contribution (Sum: 100%)</span>
                </div>
                <span className="text-xs text-blue-400 font-bold uppercase">TruthEyes Engine v3.0</span>
             </div>
             <div className="grid grid-cols-5 gap-4 h-24">
                {data.meta_analysis ? (
                  ['source', 'cross_check', 'logic', 'context', 'bias'].map((key) => {
                    const val = (ensembleBreakdown as any)[key] || 0;
                    // Ensure minimum visibility for bars > 0
                    const barHeight = val > 0 ? Math.max(val, 2) : 0;
                    return (
                      <div key={key} className="relative group flex flex-col items-center justify-end">
                        <span className="text-[10px] font-black text-blue-400 mb-1">{val}%</span>
                        <div className="w-full bg-blue-600 rounded-sm transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.3)]" style={{ height: `${barHeight}%` }} />
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-950 border border-slate-800 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap z-30 pointer-events-none">{moduleLabels[key] || key}: {val}%</div>
                      </div>
                    );
                  })
                ) : (
                  [...Array(5)].map((_, i) => <Skeleton key={i} className="w-full h-full rounded-sm" />)
                )}
             </div>
             <div className="flex justify-between text-xs text-slate-600 font-bold uppercase pt-1">
                <span>출처</span><span>교차</span><span>논리</span><span>맥락</span><span>중립</span>
             </div>
          </div>
          <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="flex flex-col mb-1">
              <span className="text-sm font-black text-slate-600 uppercase block">보도 중립성 코멘트</span>
              <span className="text-[9px] font-bold text-slate-700 uppercase tracking-tighter">Reporting Neutrality Comment</span>
            </div>
            {data.bias_check ? (
              <p className="text-base font-bold text-orange-400 italic leading-relaxed">{data.bias_check}</p>
            ) : (
              <Skeleton height="24px" className="w-full" />
            )}
          </div>
        </div>
      </div>

      {/* 부동산 특화 분석 (있을 경우) */}
      {data.real_estate_insight && (
        <RealEstateInsight insight={data.real_estate_insight} />
      )}

      {/* 주식 특화 분석 (있을 경우) */}
      {data.stock_insight && (
        <StockInsight insight={data.stock_insight} />
      )}

      {/* Political Leaning & Event Timeline Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2D Political & Economic Compass View */}
        <PoliticalCompass2DView data={enriched} />

        {/* Event Timeline / Flowchart */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">사건 흐름도 (Timeline)</h3>
            <span className="text-[10px] font-bold text-blue-500 uppercase">Event Sequence</span>
          </div>

          <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {data.event_timeline && data.event_timeline.length > 0 ? (
              data.event_timeline.map((event, idx) => (
                <div key={event.id} className="relative group">
                  <div className={`absolute -left-8 top-1.5 w-6 h-6 rounded-full border-4 border-slate-900 z-10 transition-all duration-500 ${
                    event.importance > 70 ? 'bg-blue-500 scale-125' : 'bg-slate-700'
                  }`} />
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{event.time}</span>
                    <h4 className="text-sm font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">{event.label}</h4>
                  </div>
                </div>
              ))
            ) : (
               <div className="p-8 text-center text-slate-600 font-black text-xs uppercase">데이터 없음</div>
            )}
          </div>
        </div>
      </div>

      {/* Public Data Verification Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 px-4">
          <h3 className="text-base font-black text-slate-500 uppercase tracking-[0.5em]">공공 데이터 검증 (Multi-Agent)</h3>
          <div className="h-px flex-1 bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
          {data.public_data_verification && data.public_data_verification.length > 0 ? (
            data.public_data_verification.map((item, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-[10px] font-black uppercase tracking-widest">
                      {item.source_name}
                    </span>
                    <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                      item.verification_status === 'Verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      item.verification_status === 'Contradictory' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-slate-700/20 text-slate-400 border border-slate-600/30'
                    }`}>
                      {item.verification_status === 'Verified' ? '일치(Verified)' : 
                       item.verification_status === 'Contradictory' ? '불일치(Contradictory)' : '판단 보류'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest">공식 데이터 확인 결과</p>
                    <p className="text-lg font-bold text-white leading-relaxed italic">"{item.official_data}"</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
             <div className="col-span-full p-8 text-center bg-slate-900/40 rounded-[2.5rem] border border-slate-800 text-slate-600 font-black text-xs uppercase">데이터 없음</div>
          )}
        </div>
      </div>
      {/* Forensic Annotations */}
      <div className="space-y-8">
        <h3 className="text-base font-black text-slate-500 uppercase tracking-[0.5em] px-4">포렌식 어노테이션</h3>
        <div className="grid grid-cols-1 gap-6">
          {data.highlight_annotations && data.highlight_annotations.length > 0 ? (
            data.highlight_annotations.map((item, i) => (
              <div key={i} className="group bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 hover:border-blue-500/20 transition-all">
                <div className="flex flex-col items-start gap-12">
                   <div className="flex-1 space-y-5">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-xs font-black uppercase tracking-widest">{issueTypeMap[item.issue_type] || item.issue_type}</span>
                      </div>
                      <p className="text-xl font-bold text-white italic leading-relaxed border-l-4 border-slate-700 pl-8">"{item.quoted_text}"</p>
                      <p className="text-slate-400 text-sm leading-relaxed">{item.explanation}</p>
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center bg-slate-900/40 rounded-[2.5rem] border border-slate-800 text-slate-600 font-black text-xs uppercase">데이터 없음</div>
          )}
        </div>
      </div>

      {/* 2. 포렌식 보정 권고 (위치 변경) */}
      <div className="bg-blue-600 rounded-[2.5rem] p-10 shadow-2xl shadow-blue-900/40 relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-xl">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5"/></svg>
            </div>
            <div>
               <h4 className="text-sm font-black text-white/70 uppercase tracking-[0.3em] mb-2">포렌식 보정 권고</h4>
               <p className="text-xl md:text-2xl font-bold text-white italic leading-relaxed">"{data.correction_suggestion}"</p>
            </div>
         </div>
      </div>

      {/* 3. 트루스렌즈 에디토리얼 논평 (기사 형식) - 제거됨 (상단 탭으로 이동) */}

      {/* Additional Analysis Information */}
      <div className="space-y-6 px-4">
        <h3 className="text-base font-black text-slate-500 uppercase tracking-[0.5em]">추가 분석 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8">
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4 block">감정적 강도 (Emotional Intensity)</span>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min(data.meta_analysis?.emotional_intensity ?? 0, 10) * 10}%` }} />
              </div>
              <span className="text-2xl font-black text-white">{Math.min(data.meta_analysis?.emotional_intensity ?? 0, 10)}/10</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8">
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4 block">작성자 평판 검증</span>
            <p className="text-sm font-bold text-white leading-relaxed">{data.creator_reputation_check?.evaluation || "검증 중..."}</p>
          </div>
          <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8">
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4 block">누락된 맥락 (Missing Context)</span>
            {data.missing_context && data.missing_context.length > 0 ? (
              <ul className="list-disc list-inside space-y-2 text-sm text-slate-300">
                {data.missing_context.map((context, i) => <li key={i}>{context}</li>)}
              </ul>
            ) : (
              <div className="space-y-2">
                <Skeleton height="14px" className="w-full" />
                <Skeleton height="14px" className="w-2/3" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Methodology Summary */}
      <div className="space-y-6 px-4">
        <h3 className="text-base font-black text-slate-500 uppercase tracking-[0.5em]">검증 방법론 요약</h3>
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8">
          <p className="text-sm text-slate-300 leading-relaxed">
            TruthEyes AI는 <strong>데이터 포렌식, 핵심 주장 추출, 실시간 교차 검증, AI 논리 심층 분석, 최종 신뢰도 판정</strong>의 5단계 과정을 통해 기사를 검증합니다. 
            본 리포트는 실시간 구글 검색을 통해 전 세계 보도 자료와 대조하고, 논리적 모순과 편향성을 다각도로 분석하여 산출되었습니다.
          </p>
        </div>
      </div>

      {/* Grounding Sources (Tier 1 / Tier 2 / Tier 3 Categorized) & Similar Articles */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-base font-black text-slate-500 uppercase tracking-[0.5em]">팩트체크 검증 데이터 소스 (3단계 공신력 분류)</h3>
          <span className="text-[10px] font-bold text-slate-600 uppercase">Tier 1 / 2 / 3 Hierarchy</span>
        </div>
        
        {/* Tiered Evidence Sources View */}
        <div className="px-4">
          <EvidenceSourcesView sources={enriched.grounding_sources} />
        </div>

        {/* Similar Articles */}
        {data.similar_articles && data.similar_articles.length > 0 && (
          <div className="grid grid-cols-1 gap-4 px-4 mt-4">
            {(Array.isArray(data.similar_articles) ? data.similar_articles : [])?.map((article, idx) => (
              <div 
                key={idx} 
                onClick={() => onOpenArticle?.({
                  title: article.title,
                  url: article.url,
                  source: article.source,
                  time: '관련 기사'
                })}
                className="p-6 bg-slate-900/40 border border-slate-800 rounded-[2rem] hover:border-blue-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-800 text-blue-400 rounded-lg text-xs font-black uppercase tracking-widest">{article.source}</span>
                    {article.reporter && <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{article.reporter} 기자</span>}
                  </div>
                  <h4 className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors">{article.title}</h4>
                </div>
                <div className="flex items-center gap-2 text-blue-500 text-sm font-black uppercase tracking-widest">
                  기사 보기
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="2.5"/></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisReport;
