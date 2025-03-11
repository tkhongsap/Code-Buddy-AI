import { Button } from "@/components/ui/button";

interface OptimizationHeaderProps {
  toggleStreaming: () => void;
  useStreaming: boolean;
}

export default function OptimizationHeader({ toggleStreaming, useStreaming }: OptimizationHeaderProps) {
  return (
    <>
      {/* Streaming toggle */}
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
      
      {/* Header */}
      <div className="border-b bg-slate-900 p-4">
        <div className="flex items-center justify-between dropdown-menu">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-sm bg-primary flex items-center justify-center text-white mr-3 shadow-lg border border-indigo-400/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 14-4 4v-6h2" />
                <path d="M15 13v2" />
                <path d="M18 15v5" />
              </svg>
            </div>
            <div>
              <h2 className="font-mono font-semibold tracking-tight">AI Code Buddy <span className="text-xs font-normal text-slate-500">v1.0.0</span></h2>
              <div className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                <p className="text-xs text-green-400 font-mono">Online • Ready to assist</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20v-6M9 7V5c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2v2l2 3h-8l2-3Z"></path>
                <path d="M5 8v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"></path>
              </svg>
              <span className="sr-only">History</span>
            </Button>
            <Button variant="ghost" size="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}