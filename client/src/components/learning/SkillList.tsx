import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Skill {
  name: string;
  progress: number;
  level: string;
  lastUpdated: string;
}

interface SkillListProps {
  skills: Skill[];
  className?: string;
}

export default function SkillList({ skills, className }: SkillListProps) {
  // If no skills, show message
  if (!skills.length) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <p className="text-muted-foreground">No skills have been analyzed yet. Start chatting to build your skill profile.</p>
      </div>
    );
  }

  // Helper function to get normalized progress (0-100)
  const getNormalizedProgress = (progress: number): number => {
    return Math.min(100, Math.max(0, progress));
  };

  // Helper function to get skill level based on progress
  const getSkillLevel = (progress: number): string => {
    const normalized = getNormalizedProgress(progress);
    if (normalized < 20) return 'Beginner';
    if (normalized < 40) return 'Basic';
    if (normalized < 60) return 'Intermediate';
    if (normalized < 80) return 'Advanced';
    return 'Expert';
  };

  // Helper function to get badge color based on skill level
  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'Expert':
        return 'default';
      case 'Advanced':
        return 'secondary';
      case 'Intermediate':
        return 'outline';
      case 'Basic':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Sort skills by progress (highest first)
  const sortedSkills = [...skills]
    .map(skill => ({
      ...skill,
      // Ensure progress is normalized
      progress: getNormalizedProgress(skill.progress),
      // Calculate level based on progress value
      level: getSkillLevel(skill.progress)
    }))
    .sort((a, b) => b.progress - a.progress);

  return (
    <div className={`space-y-6 ${className}`}>
      {sortedSkills.map((skill, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{skill.name}</span>
              <Badge variant={getBadgeVariant(skill.level)}>{skill.level}</Badge>
            </div>
            <span className="text-sm text-muted-foreground">{skill.progress}%</span>
          </div>
          <Progress 
            value={skill.progress} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date(skill.lastUpdated).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}