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
      import('prismjs').then(Prism => {
        // Import language support
        import('prismjs/components/prism-jsx').then(() => {
          import('prismjs/components/prism-typescript').then(() => {
            import('prismjs/components/prism-tsx').then(() => {
              // Highlight the code
              if (codeRef.current) {
                Prism.highlightElement(codeRef.current);
              }
            });
          });
        });
      });
    }
  }, [code, language, theme]);

  return (
    <div className="my-4 rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-200 dark:bg-gray-900 text-xs">
        <span>{language}</span>
        <button
          className="text-gray-400 hover:text-gray-200 transition-colors"
          onClick={() => {
            navigator.clipboard.writeText(code);
          }}
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
      <pre className={`language-${language} text-sm p-4 bg-gray-800 dark:bg-gray-900 overflow-x-auto`}>
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
}
