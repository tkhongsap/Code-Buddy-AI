import React, { forwardRef, useMemo } from 'react';

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  bgStrokeColor?: string;
  children?: React.ReactNode;
}

export const ProgressRing = forwardRef<SVGSVGElement, ProgressRingProps>(
  ({ value, size = 120, strokeWidth = 10, strokeColor = "currentColor", bgStrokeColor = "rgb(229 231 235)", children }, ref) => {
    const normalizedValue = Math.min(100, Math.max(0, value));
    
    const radius = useMemo(() => (size - strokeWidth) / 2, [size, strokeWidth]);
    const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
    const strokeDashoffset = useMemo(
      () => circumference - (normalizedValue / 100) * circumference,
      [circumference, normalizedValue]
    );

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg
          ref={ref}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={bgStrokeColor}
            fill="none"
            className="opacity-20"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={strokeColor}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-in-out"
          />
        </svg>
        
        {children && (
          <div className="absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>
    );
  }
);

ProgressRing.displayName = 'ProgressRing';
