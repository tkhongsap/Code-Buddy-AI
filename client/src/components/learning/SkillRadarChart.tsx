import React, { useMemo } from 'react';
import { 
  RadarChart as RechartsRadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer, 
  Tooltip
} from 'recharts';

interface SkillRadarChartProps {
  skills: Record<string, number>;
  className?: string;
}

export default function SkillRadarChart({ skills, className }: SkillRadarChartProps) {
  // Convert skills object to the format needed by Recharts
  const data = useMemo(() => {
    return Object.entries(skills).map(([name, value]) => ({
      skill: name,
      value: value,
      fullMark: 100
    }));
  }, [skills]);

  // If no skills data, show a message
  if (!data.length) {
    return (
      <div className={`flex items-center justify-center p-8 text-center ${className}`}>
        <p className="text-muted-foreground">No skill data available. Start chatting to build your skill profile.</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-[400px] ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="skill" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar
            name="Your Skills"
            dataKey="value"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          <Tooltip 
            formatter={(value: number) => [`${value}%`, 'Skill Level']}
            labelFormatter={(label: string) => label}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}