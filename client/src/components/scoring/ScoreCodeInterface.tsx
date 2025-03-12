import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import ScoreDisplay from './ScoreDisplay';
import CodeInput from './CodeInput';

interface ScoreResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export default function ScoreCodeInterface() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ScoreResult | null>(null);
  const { toast } = useToast();

  const scoreMutation = useMutation({
    mutationFn: async (codeToScore: string) => {
      return apiRequest<ScoreResult>({
        url: '/api/code/score',
        method: 'POST',
        body: { code: codeToScore },
      });
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to score code: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!code.trim()) {
      toast({
        title: 'Empty Code',
        description: 'Please enter some code to analyze.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await scoreMutation.mutateAsync(code);
    } catch (error) {
      // Error handling is done in the onError callback
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Score Your Code</h1>
        <p className="text-muted-foreground">
          Get quality assessments and improvement suggestions for your code
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <CodeInput
          code={code}
          setCode={setCode}
          submitCode={handleSubmit}
          isProcessing={scoreMutation.isPending}
        />

        {result && <ScoreDisplay result={result} />}
      </div>
    </div>
  );
}