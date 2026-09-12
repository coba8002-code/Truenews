import React from 'react';
import { PoliticalCompass2D, TruthEyesAnalysis } from '../types';
import { buildPoliticalCompass } from '../services/truthEyesEnricher';

interface PoliticalCompass2DViewProps {
  data: TruthEyesAnalysis;
}

export const PoliticalCompass2DView: React.FC<PoliticalCompass2DViewProps> = ({ data }) => {
  const compass: PoliticalCompass2D = data.political_compass || buildPoliticalCompass(data);

  // Compass coordinates: economic (-100 to 100), social (-100 to 100)
  // We map economic to X% (0% = -100, 50% = 0, 100% = +100)
  // We map social to Y% (0% = +100 (top: conservative), 100% = -100 (bottom: progressive))
  const dotX = 50 + (compass.economic / 2);
  const dotY = 50 - (compass.social / 2);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-[3rem] p-8 md:p-10 space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
              2D 정치·경제 성향 나침반
            </h3>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Media Compass 2D
            </span>
          </div>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            단순 1차원 구도를 넘어 경제관(X축)과 사회문화관(Y축)의 4분면 프레임워크로 보도를 입체 분석합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700">
            {compass.quadrantName}
          </span>
        </div>
      </div>

      {/* 2D Compass Stage */}
      <div className="relative aspect-square max-w-[420px] mx-auto p-4">
        {/* Outer Frame with Quadrant Backgrounds */}
        <div className="absolute inset-4 rounded-3xl overflow-hidden border border-slate-700/60 shadow-inner grid grid-cols-2 grid-rows-2">
          {/* Top-Left Quadrant: Social Conservative + Economic Public */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/30 to-transparent border-r border-b border-slate-700/50 p-3 relative">
            <span className="text-[9px] font-black uppercase text-indigo-400/70 block">국가주의·공공규제</span>
            <span className="text-[8px] text-slate-600">State Intervention</span>
          </div>

          {/* Top-Right Quadrant: Social Conservative + Economic Market */}
          <div className="bg-gradient-to-bl from-red-950/40 via-slate-900/30 to-transparent border-b border-slate-700/50 p-3 text-right relative">
            <span className="text-[9px] font-black uppercase text-red-400/70 block">신자유주의·보수안보</span>
            <span className="text-[8px] text-slate-600">Free Market Conservatism</span>
          </div>

          {/* Bottom-Left Quadrant: Social Progressive + Economic Public */}
          <div className="bg-gradient-to-tr from-blue-950/40 via-slate-900/30 to-transparent border-r border-slate-700/50 p-3 flex flex-col justify-end relative">
            <span className="text-[9px] font-black uppercase text-blue-400/70 block">사회민주·진보복지</span>
            <span className="text-[8px] text-slate-600">Social Democratic</span>
          </div>

          {/* Bottom-Right Quadrant: Social Progressive + Economic Market */}
          <div className="bg-gradient-to-tl from-emerald-950/40 via-slate-900/30 to-transparent p-3 flex flex-col justify-end text-right relative">
            <span className="text-[9px] font-black uppercase text-emerald-400/70 block">자유주의·시장개혁</span>
            <span className="text-[8px] text-slate-600">Libertarian Progressive</span>
          </div>
        </div>

        {/* Center Axes */}
        <div className="absolute inset-4 flex items-center justify-center pointer-events-none">
          {/* Horizontal X Axis */}
          <div className="w-full h-[1px] bg-slate-600/60 relative">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-6 border-r-slate-500" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-l-6 border-l-slate-500" />
          </div>
          {/* Vertical Y Axis */}
          <div className="absolute h-full w-[1px] bg-slate-600/60">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-b-6 border-b-slate-500" />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-6 border-t-slate-500" />
          </div>
          {/* Center Point */}
          <div className="w-2 h-2 rounded-full bg-slate-500/80" />
        </div>

        {/* Axes Labels */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
          전통보수 / 안보질서 (+100)
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
          사회진보 / 개인자유 (-100)
        </div>
        <div className="absolute top-1/2 -left-3 -translate-y-1/2 text-[10px] font-black text-blue-400 uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 -rotate-90 origin-center">
          공공복지·개입
        </div>
        <div className="absolute top-1/2 -right-3 -translate-y-1/2 text-[10px] font-black text-red-400 uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 rotate-90 origin-center">
          자유시장·감세
        </div>

        {/* Media Comparison Benchmark Clusters */}
        {compass.mediaComparisonPoints?.map((media, mIdx) => {
          const mX = 50 + (media.economic / 2);
          const mY = 50 - (media.social / 2);

          return (
            <div
              key={mIdx}
              className="absolute w-2.5 h-2.5 rounded-full border border-slate-900 shadow-md group cursor-pointer"
              style={{
                left: `${mX}%`,
                top: `${mY}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: media.color
              }}
            >
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-[9px] font-bold text-slate-300 whitespace-nowrap pointer-events-none z-20 transition-opacity">
                {media.name}
              </div>
            </div>
          );
        })}

        {/* Active Article Coordinate Dot */}
        <div
          className="absolute w-5 h-5 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.9)] border-3 border-white transition-all duration-700 ease-out z-30 group"
          style={{
            left: `${dotX}%`,
            top: `${dotY}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-60 pointer-events-none" />
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-blue-500 px-3 py-1.5 rounded-xl text-[10px] font-black text-white whitespace-nowrap shadow-2xl z-40">
            <span>본 기사 좌표 (X:{compass.economic}, Y:{compass.social})</span>
          </div>
        </div>
      </div>

      {/* Narrative & Benchmark Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            기사 좌표 성향 해석
          </span>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {compass.analysisDescription}
          </p>
          <div className="flex items-center gap-3 pt-1 text-[11px] font-bold">
            <span className="text-blue-400">경제관: {compass.economicLabel}</span>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-300">사회관: {compass.socialLabel}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            한국 주요 언론군 벤치마크 기준점
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-slate-400">진보 언론군 (한겨레/경향)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-slate-400">보수 언론군 (조선/동아)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-400">경제 전문지군 (매경/한경)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-400">공영·통신군 (연합/KBS)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
