import { Button } from "@/components/ui/button";
import Header from "../layout/Header";

interface OptimizationHeaderProps {
  toggleStreaming: () => void;
  useStreaming: boolean;
}

export default function OptimizationHeader({ toggleStreaming, useStreaming }: OptimizationHeaderProps) {
  return (
    <div className="flex flex-col">
      <Header />
      <div className="p-2 flex justify-end items-center gap-2 text-sm border-b dark:border-gray-700">
        <span className="text-gray-600 dark:text-gray-300">
          Response Mode:
        </span>
        <button
          onClick={toggleStreaming}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors 
            ${useStreaming 
              ? 'bg-cyan-600 text-white' 
              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}
        >
          {useStreaming ? 'Streaming' : 'Standard'}
        </button>
      </div>
    </div>
  );
}