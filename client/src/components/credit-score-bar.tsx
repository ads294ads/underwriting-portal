import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

export interface CreditScoreBarProps {
  score: number;
  maxScore?: number;
  barColor?: string;
}

export default function CreditScoreBar({ score, maxScore = 100, barColor = '#4F46E5' }: CreditScoreBarProps) {
  const pointerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [statusInfo, setStatusInfo] = useState<{
    label: string;
    color: string;
    icon: JSX.Element;
  }>({
    label: 'Evaluating',
    color: 'text-gray-500',
    icon: <AlertCircle className="h-4 w-4" />,
  });

  // Convert component score to 100-point scale for consistent grading 
  const normalizedScore = (score / maxScore) * 100;

  useEffect(() => {
    // Default message if score is 0 or undefined
    if (!score || score <= 0) {
      setStatusInfo({
        label: 'Insufficient Data',
        color: 'text-gray-500',
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }

    // Set status based on score percentage
    if (normalizedScore >= 75) {
      setStatusInfo({
        label: 'Excellent',
        color: 'text-green-600',
        icon: <CheckCircle className="h-4 w-4" />,
      });
    } else if (normalizedScore >= 60) {
      setStatusInfo({
        label: 'Good',
        color: 'text-blue-600',
        icon: <CheckCircle className="h-4 w-4" />,
      });
    } else if (normalizedScore >= 50) {
      setStatusInfo({
        label: 'Concerning',
        color: 'text-amber-600',
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    } else {
      setStatusInfo({
        label: 'Needs Improvement',
        color: 'text-red-600',
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    }

    if (pointerRef.current && labelRef.current) {
      // Calculate position based on score as percentage of maxScore
      const percentage = Math.min(Math.max(score, 0), maxScore) / maxScore;
      const containerWidth = pointerRef.current.parentElement?.offsetWidth || 0;
      const pointerWidth = pointerRef.current.offsetWidth || 0;
      
      // Position the pointer with some edge-case handling
      let leftPosition = (containerWidth * percentage) - (pointerWidth / 2);
      // Prevent overflow on extremes
      leftPosition = Math.max(0, Math.min(leftPosition, containerWidth - pointerWidth));
      pointerRef.current.style.left = `${leftPosition}px`;
      
      // Update label with both score and grade
      if (labelRef.current) {
        let grade = 'C-';
        if (normalizedScore >= 90) grade = 'A+';
        else if (normalizedScore >= 85) grade = 'A';
        else if (normalizedScore >= 80) grade = 'A-';
        else if (normalizedScore >= 75) grade = 'B+';
        else if (normalizedScore >= 65) grade = 'B';
        else if (normalizedScore >= 60) grade = 'B-';
        else if (normalizedScore >= 50) grade = 'C+';
        else if (normalizedScore >= 40) grade = 'C';
        
        labelRef.current.textContent = `${score.toFixed(1)}/${maxScore} (${grade})`;
      }
    }
  }, [score, maxScore, normalizedScore]);

  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span className="text-xs font-semibold">Grade Bands</span>
        <span className="text-xs font-medium text-gray-700" ref={labelRef}></span>
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
        <div 
          ref={pointerRef} 
          className="absolute -top-1 left-0 transition-all duration-300 flex flex-col items-center"
        >
          <div 
            className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]" 
            style={{ borderTopColor: barColor }}
          ></div>
          {score > 0 && (
            <div className="absolute top-4 transform -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm border text-xs flex items-center gap-1.5">
              <span className={statusInfo.color}>{statusInfo.icon}</span>
              <span className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
          )}
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
