import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  const [rows, setRows] = useState(10);

  // Adjust textarea height based on content
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    
    // Count number of lines
    const lineCount = e.target.value.split('\n').length;
    // Set minimum of 10 rows, max of 20
    setRows(Math.max(10, Math.min(20, lineCount)));
  };

  return (
    <form onSubmit={submitCode} className="space-y-4">
      <div className="relative">
        <Textarea
          value={code}
          onChange={handleInput}
          placeholder="Paste your code here or enter a coding question..."
          className="resize-none font-mono text-sm h-auto min-h-[200px] p-4"
          rows={rows}
          disabled={isProcessing}
        />
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={code.trim() === '' || isProcessing}
          className="px-6"
        >
          {isProcessing ? (
            <div className="flex items-center">
              <span className="mr-2">Processing</span>
              <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            </div>
          ) : (
            "Score Code"
          )}
        </Button>
      </div>
    </form>
  );
}