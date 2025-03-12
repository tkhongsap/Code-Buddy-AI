import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ScoreResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface ScoreDisplayProps {
  result: ScoreResult;
}

export default function ScoreDisplay({ result }: ScoreDisplayProps) {
  const { score, feedback, strengths, improvements } = result;
  
  // Color coding for the score
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-blue-600 dark:text-blue-400';
    if (score >= 4) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Get progress color based on score
  const getProgressColor = (score: number) => {
    if (score >= 8) return 'bg-green-600';
    if (score >= 6) return 'bg-blue-600';
    if (score >= 4) return 'bg-amber-600';
    return 'bg-red-600';
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <span>Code Quality Score</span>
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}/10</span>
          </CardTitle>
          <CardDescription>
            Overall assessment of your code quality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Quality</span>
              <span>{score * 10}%</span>
            </div>
            <Progress 
              value={score * 10} 
              className="h-2"
              style={{
                '--progress-foreground': getProgressColor(score),
              } as React.CSSProperties}
            />
          </div>
          <div className="text-sm text-muted-foreground mb-6">
            {feedback}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-600 dark:text-green-400">
              Strengths
            </CardTitle>
            <CardDescription>
              What your code does well
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-600 dark:text-amber-400">
              Areas for Improvement
            </CardTitle>
            <CardDescription>
              Suggestions to enhance your code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {improvements.map((improvement, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-amber-600 dark:text-amber-400 mr-2">↗</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}