import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface CodeInputProps {
  code: string;
  setCode: (code: string) => void;
  submitCode: (e?: React.FormEvent) => Promise<void>;
  isProcessing: boolean;
}

export default function CodeInput({ 
  code, 
  setCode, 
  submitCode, 
  isProcessing 
}: CodeInputProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Paste Your Code</CardTitle>
        <CardDescription>
          Our AI will analyze your code and provide quality feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submitCode} className="space-y-4">
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code or type a coding question here..."
            className="min-h-[300px] font-mono text-sm resize-y"
            disabled={isProcessing}
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isProcessing || !code.trim()} 
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Score My Code'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}