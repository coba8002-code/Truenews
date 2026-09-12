import React, { useState } from 'react';
import { HighlightAnnotation, IssueType } from '../types';

interface InteractiveHighlightViewerProps {
  content?: string;
  annotations?: HighlightAnnotation[];
  summary?: string;
}

export const InteractiveHighlightViewer: React.FC<InteractiveHighlightViewerProps> = ({
  content = '',
  annotations = [],
  summary = ''
}) => {
  const [selectedAnnotation, setSelectedAnnotation] = useState<HighlightAnnotation | null>(
    annotations.length > 0 ? annotations[0] : null
  );

  const issueStyleMap: Record<IssueType, { textClass: string; underlineClass: string; badgeClass: string; icon: string; label: string }> = {
    'Factual Error': {
      textClass: 'text-red-400',
      underlineClass: 'decoration-red-500 decoration-2 underline underline-offset-4 bg-red-500/10 cursor-pointer px-1 rounded hover:bg-red-500/20',
      badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40',
      icon: '🚨',
      label: '사실 관계 오류'
    },
    'Logical Fallacy': {
      textClass: 'text-orange-400',
      underlineClass: 'decoration-orange-500 decoration-2 underline underline-offset-4 bg-orange-500/10 cursor-pointer px-1 rounded hover:bg-orange-500/20',
      badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
      icon: '⚡',
      label: '논리적 비약·오류'
    },
    'Missing Context': {
      textClass: 'text-blue-400',
      underlineClass: 'decoration-blue-500 decoration-2 underline underline-offset-4 bg-blue-500/10 cursor-pointer px-1 rounded hover:bg-blue-500/20',
      badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      icon: '🔍',
      label: '배경 맥락 누락'
    },
    'Biased Wording': {
      textClass: 'text-amber-400',
      underlineClass: 'decoration-amber-500 decoration-2 underline underline-offset-4 bg-amber-500/10 cursor-pointer px-1 rounded hover:bg-amber-500/20',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      icon: '⚖️',
      label: '편향적 어휘 사용'
    },
    'Exaggeration': {
      textClass: 'text-yellow-400',
      underlineClass: 'decoration-yellow-500 decoration-2 underline underline-offset-4 bg-yellow-500/10 cursor-pointer px-1 rounded hover:bg-yellow-500/20',
      badgeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
      icon: '📢',
      label: '과장·선동적 표현'
    }
  };

  const textToRender = content || summary || '분석할 원문 내용이 제공되지 않았습니다.';
  const paragraphs = textToRender.split(/\n+/).filter(p => p.trim().length > 0);

  // Helper to highlight annotations inside a paragraph
  const renderParagraphWithHighlights = (para: string, pIdx: number) => {
    let segments: { text: string; annotation?: HighlightAnnotation }[] = [{ text: para }];

    annotations.forEach(ann => {
      const q = ann.quoted_text?.trim();
      if (!q) return;

      const newSegments: { text: string; annotation?: HighlightAnnotation }[] = [];
      segments.forEach(seg => {
        if (seg.annotation) {
          newSegments.push(seg);
          return;
        }

        const idx = seg.text.indexOf(q);
        if (idx !== -1) {
          const before = seg.text.substring(0, idx);
          const match = seg.text.substring(idx, idx + q.length);
          const after = seg.text.substring(idx + q.length);

          if (before) newSegments.push({ text: before });
          newSegments.push({ text: match, annotation: ann });
          if (after) newSegments.push({ text: after });
        } else {
          newSegments.push(seg);
        }
      });
      segments = newSegments;
    });

    return (
      <p key={pIdx} className="text-slate-300 text-base md:text-lg leading-loose mb-6 font-normal">
        {segments.map((seg, sIdx) => {
          if (!seg.annotation) {
            return <span key={sIdx}>{seg.text}</span>;
          }

          const style = issueStyleMap[seg.annotation.issue_type] || issueStyleMap['Biased Wording'];
          const isSelected = selectedAnnotation?.quoted_text === seg.annotation.quoted_text;

          return (
            <mark
              key={sIdx}
              onClick={() => setSelectedAnnotation(seg.annotation!)}
              className={`${style.underlineClass} ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950 font-bold' : ''} text-white transition-all`}
              title="클릭하여 상세 AI 포렌식 분석 보기"
            >
              {seg.text}
              <span className="text-[10px] ml-1 inline-block opacity-75">{style.icon}</span>
            </mark>
          );
        })}
      </p>
    );
  };

  return (
    <div className="space-y-6">
      {/* Guide Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-sm">💡</span>
          <span className="text-xs font-bold text-slate-300">
            문장 아래 밑줄을 클릭하면 AI 포렌식 분석 결과와 교차 검증 근거가 표시됩니다.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(issueStyleMap).map(([type, style]) => (
            <span key={type} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badgeClass}`}>
              {style.icon} {style.label}
            </span>
          ))}
        </div>
      </div>

      {/* Main Text Content */}
      <div className="p-8 bg-slate-950/40 border border-slate-800 rounded-3xl relative">
        <div className="max-w-4xl mx-auto">
          {paragraphs.map((p, idx) => renderParagraphWithHighlights(p, idx))}
        </div>
      </div>

      {/* Selected Annotation Detail Inspector Card */}
      {selectedAnnotation && (
        <div className="p-6 bg-slate-900 border-2 border-blue-500/40 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {issueStyleMap[selectedAnnotation.issue_type]?.icon || '⚠️'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">포렌식 문장 정밀 검증</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${issueStyleMap[selectedAnnotation.issue_type]?.badgeClass || 'bg-slate-800 text-slate-300'}`}>
                    {issueStyleMap[selectedAnnotation.issue_type]?.label || selectedAnnotation.issue_type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                  심각도: {selectedAnnotation.severity || 'Medium'} | 신뢰도 저하 영향: 약 -{selectedAnnotation.severity === 'High' ? '15' : '8'}점
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedAnnotation(null)}
              className="text-slate-500 hover:text-white text-xs font-bold px-2 py-1"
            >
              닫기 ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                문제의 본문 인용문 (Quoted Statement)
              </span>
              <p className="text-base font-bold text-red-300 italic bg-red-950/20 border-l-4 border-red-500 p-3 rounded-r-xl">
                "{selectedAnnotation.quoted_text}"
              </p>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                AI 포렌식 분석 이유 (Forensic Explanation)
              </span>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {selectedAnnotation.explanation}
              </p>
            </div>

            {selectedAnnotation.correction_evidence && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
                  <span>✓</span>
                  <span>객관적 사실 및 권장 보정안 (Fact Correction)</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {selectedAnnotation.correction_evidence}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
