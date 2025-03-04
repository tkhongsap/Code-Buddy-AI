import { useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/use-theme';

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (codeRef.current) {
      const loadPrism = async () => {
        try {
          // Import Prism and language support
          const Prism = await import('prismjs');
          await import('prismjs/components/prism-jsx');
          await import('prismjs/components/prism-typescript');
          await import('prismjs/components/prism-tsx');
          
          // Highlight the code
          if (codeRef.current) {
            Prism.default.highlightElement(codeRef.current);
          }
        } catch (error) {
          console.error('Error loading Prism:', error);
        }
      };
      
      loadPrism();
    }
  }, [code, language, theme]);

  return (
    <div className="my-4 rounded-md overflow-hidden border border-slate-700 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-slate-200 border-b border-slate-700 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex space-x-1">
            <span className="h-3 w-3 rounded-full bg-red-500 opacity-75"></span>
            <span className="h-3 w-3 rounded-full bg-yellow-500 opacity-75"></span>
            <span className="h-3 w-3 rounded-full bg-green-500 opacity-75"></span>
          </span>
          <span className="font-semibold text-xs text-slate-300">{language}</span>
        </div>
        <button
          className="text-slate-400 hover:text-slate-200 transition-colors"
          onClick={() => {
            navigator.clipboard.writeText(code);
            // Show a small popup indicating copied
            const button = document.activeElement as HTMLButtonElement;
            const originalTitle = button.title;
            button.title = "Copied!";
            setTimeout(() => {
              button.title = originalTitle;
            }, 1500);
          }}
          title="Copy to clipboard"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
      <pre className={`language-${language} text-sm p-4 bg-slate-800 dark:bg-slate-900 overflow-x-auto font-mono leading-relaxed`}>
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
      <div className="px-4 py-1 text-xs text-slate-400 bg-slate-800 border-t border-slate-700 flex justify-between">
        <span>// AI Code Buddy</span>
        <span>{new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
}
