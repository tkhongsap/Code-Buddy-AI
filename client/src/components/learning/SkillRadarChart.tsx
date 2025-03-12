import React, { useMemo } from 'react';
import { 
  RadarChart as RechartsRadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts';

interface SkillRadarChartProps {
  skills: Record<string, number>;
  className?: string;
}

export default function SkillRadarChart({ skills, className }: SkillRadarChartProps) {
  // Convert skills object to the format needed by Recharts
  // Also normalize values to ensure they're in 0-100 range
  const data = useMemo(() => {
    return Object.entries(skills)
      .map(([name, value]) => ({
        skill: name,
        value: Math.min(100, Math.max(0, value)), // Ensure values are between 0-100
        fullMark: 100
      }))
      // Sort by skill name for consistent display
      .sort((a, b) => a.skill.localeCompare(b.skill));
  }, [skills]);

  // If no skills data, show a message
  if (!data.length) {
    return (
      <div className={`flex items-center justify-center p-8 text-center ${className}`}>
        <p className="text-muted-foreground">No skill data available. Start chatting to build your skill profile.</p>
      </div>
    );
  }

  // Format percentage for tooltip
  const formatSkillLevel = (value: number) => {
    // Map 0-100 to text representation
    if (value < 20) return 'Beginner';
    if (value < 40) return 'Basic';
    if (value < 60) return 'Intermediate';
    if (value < 80) return 'Advanced';
    return 'Expert';
  };

  return (
    <div className={`w-full h-[400px] ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="skill" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={5} />
          <Radar
            name="Skill Level"
            dataKey="value"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          <Tooltip 
            formatter={(value: number) => [
              `${value}% (${formatSkillLevel(value)})`, 
              'Skill Level'
            ]}
            labelFormatter={(label: string) => label}
          />
          <Legend />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}