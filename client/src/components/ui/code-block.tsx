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
          await import('prismjs/components/prism-javascript');
          await import('prismjs/components/prism-css');
          await import('prismjs/components/prism-json');
          await import('prismjs/components/prism-bash');
          await import('prismjs/components/prism-markdown');
          
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
    <div className="my-4 rounded-md overflow-hidden border shadow-md" style={{ borderColor: 'var(--tab-border)' }}>
      <div className="flex items-center justify-between px-4 py-2 text-xs border-b" 
        style={{ 
          background: 'var(--sidebar-bg)', 
          color: 'var(--code-fg)',
          borderColor: 'var(--tab-border)'
        }}>
        <div className="flex items-center gap-2">
          <span className="flex space-x-1">
            <span className="h-3 w-3 rounded-full bg-red-500 opacity-75"></span>
            <span className="h-3 w-3 rounded-full bg-yellow-500 opacity-75"></span>
            <span className="h-3 w-3 rounded-full bg-green-500 opacity-75"></span>
          </span>
          <span className="font-semibold text-xs" style={{ color: 'var(--syntax-constant)' }}>{language}</span>
        </div>
        <button
          className="transition-colors"
          style={{ color: 'var(--line-number)' }}
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
      <pre className={`language-${language} text-sm p-4 overflow-x-auto font-mono leading-relaxed`} 
        style={{ 
          background: 'var(--editor-bg)',
          color: 'var(--code-fg)',
        }}>
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
      <div className="px-4 py-1 text-xs border-t flex justify-between" 
        style={{ 
          background: 'var(--editor-bg)',
          color: 'var(--syntax-comment)',
          borderColor: 'var(--tab-border)'
        }}>
        <span>// AI Code Buddy</span>
        <span>{new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
}
