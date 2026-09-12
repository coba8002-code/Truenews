
import React from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { MediaLeaningPoint, TimelineBubble } from '../types';

const mockScatter: MediaLeaningPoint[] = [
  { name: "글로벌 포스트", x: -60, y: 30, z: 80, trustScore: 92 },
  { name: "뉴스 24", x: 10, y: 75, z: 120, trustScore: 45 },
  { name: "더 데일리", x: 80, y: 55, z: 60, trustScore: 30 },
  { name: "트루스 네트워크", x: -10, y: 15, z: 40, trustScore: 85 },
  { name: "리버티 프레스", x: 50, y: 90, z: 90, trustScore: 25 },
];

const mockTimeline: TimelineBubble[] = [
  { id: '1', time: "10:00", label: "발단 보도", gapRate: 5, importance: 40 },
  { id: '2', time: "11:30", label: "심화 기사", gapRate: 45, importance: 90 },
  { id: '3', time: "14:00", label: "전문가 논평", gapRate: 15, importance: 60 },
  { id: '4', time: "16:45", label: "속보 전파", gapRate: 85, importance: 110 },
  { id: '5', time: "19:20", label: "정리 분석", gapRate: 20, importance: 50 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as MediaLeaningPoint;
    return (
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
        <p className="text-xs font-black text-white uppercase tracking-widest mb-2 border-b border-slate-800 pb-2">{data.name}</p>
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Political: <span className={data.x < 0 ? 'text-blue-400' : 'text-red-400'}>{data.x > 0 ? '+' : ''}{data.x}</span></p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Agitation: <span className="text-orange-400">{data.y}</span></p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Credibility: <span className="text-emerald-400">{data.trustScore}%</span></p>
        </div>
      </div>
    );
  }
  return null;
};

const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="space-y-12 pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">미디어 포렌식 현황</h2>
        <p className="text-slate-500 text-base">최근 24시간 미디어 에코시스템 정밀 분석 데이터</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. 언론사 편향 산점도 */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">보도 성향 및 감정 강도 매트릭스</h3>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" /> <span className="text-[11px] text-slate-500">높은 신뢰</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" /> <span className="text-[11px] text-slate-500">주의 요망</span></div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="정치적 편향성" 
                  domain={[-100, 100]} 
                  stroke="#475569" 
                  fontSize={10}
                  tickFormatter={(v) => v === 0 ? 'Center' : v > 0 ? `R ${v}` : `L ${Math.abs(v)}`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="감정적 선동 지수" 
                  domain={[0, 100]} 
                  stroke="#475569" 
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: '선동 지수', angle: -90, position: 'insideLeft', offset: -10, style: { fill: '#475569', fontSize: 10, fontWeight: 900 } }}
                />
                <ZAxis type="number" dataKey="trustScore" range={[100, 1000]} name="신뢰도" />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Media Bias" data={mockScatter}>
                  {mockScatter.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.trustScore > 60 ? '#3b82f6' : '#ef4444'} 
                      fillOpacity={0.6}
                      stroke={entry.trustScore > 60 ? '#60a5fa' : '#f87171'}
                      strokeWidth={2}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            
            {/* Quadrant Labels */}
            <div className="absolute top-4 right-4 text-[9px] font-black uppercase text-slate-700 tracking-tighter">Right / Sensational</div>
            <div className="absolute top-4 left-4 text-[9px] font-black uppercase text-slate-700 tracking-tighter">Left / Sensational</div>
            <div className="absolute bottom-4 right-4 text-[9px] font-black uppercase text-slate-700 tracking-tighter">Right / Factual</div>
            <div className="absolute bottom-4 left-4 text-[9px] font-black uppercase text-slate-700 tracking-tighter">Left / Factual</div>
          </div>
          
          <div className="mt-6 text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center border-t border-slate-800 pt-6">
            X: 정치적 편향성 (-100:진보 ~ +100:보수) | Y: 감정적 선동 지수 | 크기: 신뢰도
          </div>
        </div>

        {/* 2. 논리 오류 히트맵 */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8">주요 보도 오염 지표 히트맵</h3>
          <div className="space-y-3">
            <div className="flex text-[10px] font-bold text-slate-600 uppercase pb-2">
              <div className="w-20">언론사명</div>
              <div className="flex-1 grid grid-cols-5 gap-1 text-center">
                {["사실오류", "논리결여", "맥락누락", "편향어휘", "과장보도"].map(h => <div key={h}>{h}</div>)}
              </div>
            </div>
            {mockScatter.map((m, i) => (
              <div key={i} className="flex items-center h-6">
                <div className="w-20 text-[11px] text-slate-400 truncate pr-2 font-medium">{m.name}</div>
                <div className="flex-1 grid grid-cols-5 gap-1 h-full">
                   {[...Array(5)].map((_, idx) => {
                     const intensity = Math.random();
                     return (
                       <div 
                        key={idx} 
                        className="rounded-sm bg-blue-500" 
                        style={{ opacity: intensity < 0.2 ? 0.05 : intensity }}
                        title={`${Math.round(intensity * 10)}건 감지됨`}
                       />
                     );
                   })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end items-center gap-2">
            <span className="text-[10px] text-slate-600">감지 빈도:</span>
            <div className="flex gap-0.5">
               {[0.1, 0.3, 0.5, 0.8, 1].map(v => <div key={v} className="w-3 h-3 bg-blue-500" style={{ opacity: v }} />)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 맥락 누락 타임라인 버블차트 */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 overflow-hidden">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-12 text-center">정보 전파 맥락 누락률 타임라인</h3>
        <div className="relative h-48 flex items-center justify-between px-10">
          <div className="absolute left-10 right-10 h-0.5 bg-slate-800" />
          {mockTimeline.map((item, i) => (
            <div key={i} className="relative flex flex-col items-center group cursor-pointer">
              <div 
                className={`rounded-full border-2 transition-all group-hover:scale-110 mb-4 flex items-center justify-center ${item.gapRate > 50 ? 'bg-orange-600/20 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-blue-600/20 border-blue-400'}`}
                style={{ width: `${item.importance/2}px`, height: `${item.importance/2}px` }}
              >
                <span className="text-xs font-bold text-white">{item.gapRate}%</span>
              </div>
              <span className="text-[11px] font-black text-slate-500 uppercase mb-1">{item.time}</span>
              <span className="text-xs font-bold text-slate-300">{item.label}</span>
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg whitespace-nowrap text-[11px] text-slate-400 z-10">
                맥락 누락률: {item.gapRate}% | 중요도 지수: {item.importance}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
