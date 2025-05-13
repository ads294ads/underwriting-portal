import { useEffect, useRef } from 'react';

export interface CreditScoreBarProps {
  score: number;
  maxScore?: number;
  barColor?: string;
}

export default function CreditScoreBar({ score, maxScore = 100, barColor = '#4F46E5' }: CreditScoreBarProps) {
  const pointerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (pointerRef.current && labelRef.current) {
      // Calculate position based on score as percentage of maxScore
      const percentage = Math.min(Math.max(score, 0), maxScore) / maxScore;
      const containerWidth = pointerRef.current.parentElement?.offsetWidth || 0;
      const pointerWidth = pointerRef.current.offsetWidth || 0;
      
      // Position the pointer
      const leftPosition = (containerWidth * percentage) - (pointerWidth / 2);
      pointerRef.current.style.left = `${leftPosition}px`;
      
      // Update label
      if (labelRef.current) {
        let grade = 'C-';
        if (score >= 90) grade = 'A+';
        else if (score >= 85) grade = 'A';
        else if (score >= 80) grade = 'A-';
        else if (score >= 75) grade = 'B+';
        else if (score >= 65) grade = 'B';
        else if (score >= 60) grade = 'B-';
        else if (score >= 50) grade = 'C+';
        else if (score >= 40) grade = 'C';
        
        labelRef.current.textContent = `${score}/100 (${grade})`;
      }
    }
  }, [score]);

  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span className="text-xs font-semibold">Grade Bands</span>
        <span className="text-xs text-gray-400" ref={labelRef}></span>
      </div>
      <div className="flex w-full gap-1 items-center">
        <div className="score-bar-segment flex-1 bg-green-400 h-2 rounded-l-full"></div>
        <div className="score-bar-segment flex-1 bg-green-300 h-2"></div>
        <div className="score-bar-segment flex-1 bg-green-200 h-2"></div>
        <div className="score-bar-segment flex-1 bg-yellow-300 h-2"></div>
        <div className="score-bar-segment flex-1 bg-yellow-400 h-2"></div>
        <div className="score-bar-segment flex-1 bg-yellow-500 h-2"></div>
        <div className="score-bar-segment flex-1 bg-red-300 h-2"></div>
        <div className="score-bar-segment flex-1 bg-red-400 h-2"></div>
        <div className="score-bar-segment flex-1 bg-red-500 h-2 rounded-r-full"></div>
      </div>
      {/* Score Pointer */}
      <div className="relative w-full h-6">
        <div ref={pointerRef} className="absolute -top-1 left-0 transition-all duration-300">
          <span className="fa fa-caret-down text-blue-700 text-2xl"></span>
        </div>
      </div>
      {/* Legend */}
      <div className="flex justify-between text-xs font-semibold text-gray-600 mt-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <span>A+</span><span>A</span><span>A-</span><span>B+</span>
        <span>B</span><span>B-</span><span>C+</span><span>C</span><span>C-</span>
      </div>
    </div>
  );
}
