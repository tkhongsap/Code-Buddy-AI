import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Header from "../layout/Header";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ScoreDisplay from "./ScoreDisplay";
import CodeInput from "./CodeInput";

interface ScoreResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export default function ScoreCodeInterface() {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Send code for scoring mutation
  const scoreCodeMutation = useMutation({
    mutationFn: async (codeData: { code: string }) => {
      // Call the API endpoint
      const response = await apiRequest("POST", "/api/code/score", {
        code: codeData.code
      });
      
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setScoreResult(data);
      setIsProcessing(false);
      
      // Scroll to results
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    },
    onError: (error) => {
      console.error("Error scoring code:", error);
      setIsProcessing(false);
      
      toast({
        title: "Error",
        description: "Failed to score code. Please try again.",
        variant: "destructive",
      });
    }
  });

  const submitCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.trim() === '' || isProcessing) return;
    
    setIsProcessing(true);
    setScoreResult(null);
    
    await scoreCodeMutation.mutateAsync({
      code: code
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="border-b bg-slate-900 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-sm bg-primary flex items-center justify-center text-white mr-3 shadow-lg border border-indigo-400/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div>
              <h2 className="font-mono font-semibold tracking-tight">Score Your Code <span className="text-xs font-normal text-slate-500">v1.0.0</span></h2>
              <div className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                <p className="text-xs text-blue-400 font-mono">Analyzer • Ready for assessment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-4">
        <Card className="flex-1 flex flex-col shadow-md border-primary/10">
          <div className="p-4 flex flex-col space-y-4">
            <h3 className="text-lg font-semibold mb-2">Paste Your Code</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your code or query below and get an instant quality assessment on a scale of 0-10.
            </p>
            
            <CodeInput 
              code={code} 
              setCode={setCode} 
              submitCode={submitCode}
              isProcessing={isProcessing} 
            />
            
            {isProcessing && (
              <div className="flex justify-center my-8">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full animate-pulse bg-primary"></div>
                  <div className="w-4 h-4 rounded-full animate-pulse bg-primary" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-4 h-4 rounded-full animate-pulse bg-primary" style={{ animationDelay: "0.4s" }}></div>
                  <span className="text-sm text-muted-foreground ml-2">Analyzing your code...</span>
                </div>
              </div>
            )}
            
            {scoreResult && (
              <div ref={resultsRef}>
                <Separator className="my-6" />
                <ScoreDisplay result={scoreResult} />
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}