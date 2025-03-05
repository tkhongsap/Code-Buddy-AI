import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);
  const { theme } = useTheme();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Normalize language name for Prism
  const normalizeLanguage = (lang: string): string => {
    // Map common language names to Prism's language identifiers
    // Only include languages that we actually load
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'py': 'python',
      'ts': 'typescript',
      'jsx': 'jsx',
      'tsx': 'tsx',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'bash': 'bash',
      'shell': 'bash',
      'sh': 'bash',
      'md': 'markdown',
      'sql': 'sql',
      'java': 'java',
    };

    return languageMap[lang.toLowerCase()] || lang.toLowerCase();
  };

  const normalizedLang = normalizeLanguage(language);

  useEffect(() => {
    if (codeRef.current) {
      const loadPrism = async () => {
        try {
          // Import Prism and required language support
          const Prism = await import('prismjs');
          
          // Import core languages
          await import('prismjs/components/prism-jsx');
          await import('prismjs/components/prism-typescript');
          await import('prismjs/components/prism-tsx');
          await import('prismjs/components/prism-javascript');
          await import('prismjs/components/prism-css');
          await import('prismjs/components/prism-json');
          await import('prismjs/components/prism-bash');
          await import('prismjs/components/prism-markdown');
          
          // Import additional languages - limiting to most common ones to avoid TypeScript errors
          try { await import('prismjs/components/prism-python'); } catch (e) { console.warn('Failed to load Python syntax', e); }
          try { await import('prismjs/components/prism-sql'); } catch (e) { console.warn('Failed to load SQL syntax', e); }
          try { await import('prismjs/components/prism-java'); } catch (e) { console.warn('Failed to load Java syntax', e); }
          
          // Highlight the code after all languages are loaded
          if (codeRef.current) {
            Prism.default.highlightElement(codeRef.current);
          }
        } catch (error) {
          console.error('Error loading Prism or languages:', error);
        }
      };
      
      loadPrism();
    }
  }, [code, normalizedLang, theme]);

  const handleCopy = () => {
    try {
      // Create a temporary textarea element to copy text
      const textArea = document.createElement("textarea");
      textArea.value = code;
      
      // Make the textarea out of viewport
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      
      // Select and copy the text
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopied(true);
        toast({
          title: "Copied!",
          description: "Code copied to clipboard",
          duration: 2000,
        });
      } else {
        throw new Error("Copy command was unsuccessful");
      }
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      
      // Fallback to the modern API if available
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code)
          .then(() => {
            setCopied(true);
            toast({
              title: "Copied!",
              description: "Code copied to clipboard",
              duration: 2000,
            });
            
            setTimeout(() => {
              setCopied(false);
            }, 2000);
          })
          .catch(() => {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to copy code",
              duration: 2000,
            });
          });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Clipboard functionality not available in your browser",
          duration: 2000,
        });
      }
    }
  };

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
          className={`transition-all px-2 py-1 rounded flex items-center gap-1 ${copied ? 'bg-green-500/10 text-green-500' : 'hover:bg-gray-500/10'}`}
          style={{ color: copied ? 'var(--green)' : 'var(--line-number)' }}
          onClick={handleCopy}
          title="Copy to clipboard"
          aria-label="Copy code"
        >
          {copied ? (
            <>
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
                <path d="M20 6L9 17l-5-5"></path>
              </svg>
              <span className="text-xs">Copied</span>
            </>
          ) : (
            <>
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
              <span className="text-xs">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className={`language-${normalizedLang} text-sm p-4 overflow-x-auto font-mono leading-relaxed`} 
        style={{ 
          background: 'var(--editor-bg)',
          color: 'var(--code-fg)',
        }}>
        <code ref={codeRef} className={`language-${normalizedLang}`}>
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
