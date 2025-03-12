import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  // Get the appropriate color based on score
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-blue-500";
    if (score >= 4) return "text-yellow-500";
    return "text-red-500";
  };

  // Get the appropriate background color for the score ring
  const getScoreRingColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-blue-500";
    if (score >= 4) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Get percentage for the score ring gradient
  const getScorePercentage = (score: number) => {
    return (score / 10) * 100;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Assessment Results</h3>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-none flex flex-col items-center">
          {/* Score Circle */}
          <div className="relative w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="8" 
                opacity="0.1" 
                className="text-muted-foreground" 
              />
              
              {/* Score circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="8" 
                strokeLinecap="round" 
                strokeDasharray="283" 
                strokeDashoffset={283 - (283 * getScorePercentage(result.score) / 100)}
                className={getScoreColor(result.score)} 
                transform="rotate(-90 50 50)" 
              />
              
              {/* Score text */}
              <text 
                x="50" 
                y="50" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                fontSize="24" 
                fontWeight="bold" 
                className={getScoreColor(result.score)}
              >
                {result.score}/10
              </text>
            </svg>
          </div>
          
          <div className="text-center mt-2">
            <p className="text-sm text-muted-foreground">Code Quality Score</p>
          </div>
        </div>
        
        <div className="flex-1 space-y-4">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Feedback</h4>
              <p className="text-sm">{result.feedback}</p>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-1">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Strengths
                </h4>
                <ul className="list-disc ml-5 text-sm space-y-1">
                  {result.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500 mr-1">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Areas to Improve
                </h4>
                <ul className="list-disc ml-5 text-sm space-y-1">
                  {result.improvements.map((improvement, index) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}