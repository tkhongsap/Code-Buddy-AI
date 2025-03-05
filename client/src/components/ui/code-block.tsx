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
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // Clean up any pending timeouts when component unmounts
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, [code, normalizedLang, theme]);

  const copyToClipboard = () => {
    // Multiple methods to ensure cross-browser compatibility
    
    // Method 1: Using clipboard API directly (modern browsers)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code)
        .then(() => {
          setCopied(true);
          showCopySuccess();
        })
        .catch(e => {
          console.error("Clipboard API failed:", e);
          fallbackCopyMethod();
        });
    } else {
      // Method 2: Fallback for browsers without clipboard API
      fallbackCopyMethod();
    }
  };

  const fallbackCopyMethod = () => {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement("textarea");
      
      // Set its content and style
      textArea.value = code;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      textArea.style.opacity = "0";
      
      document.body.appendChild(textArea);
      
      // Select and copy the text
      textArea.select();
      textArea.setSelectionRange(0, code.length); // For mobile devices
      
      const successful = document.execCommand("copy");
      
      // Clean up
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopied(true);
        showCopySuccess();
      } else {
        showCopyError("Copy operation failed");
      }
    } catch (err) {
      console.error("Fallback copy method failed:", err);
      showCopyError("Unable to copy code");
    }
  };

  const showCopySuccess = () => {
    toast({
      title: "Copied!",
      description: "Code copied to clipboard successfully",
      duration: 2000,
    });
    
    // Set timeout to reset copied state
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const showCopyError = (message: string) => {
    toast({
      variant: "destructive",
      title: "Copy failed",
      description: message,
      duration: 3000,
    });
    
    setCopied(false);
  };

  return (
    <div className="my-4 rounded-md overflow-hidden border shadow-md relative" 
         style={{ borderColor: 'var(--tab-border)' }}>
      
      {/* Header bar with language name */}
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
        
        {/* Copy button - more prominent */}
        <button
          className={`transition-all px-2 py-1 rounded-md flex items-center gap-1 ${
            copied 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-700/60 text-gray-100 hover:bg-gray-600'
          }`}
          onClick={copyToClipboard}
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
              <span className="text-xs font-medium">Copied!</span>
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
              <span className="text-xs font-medium">Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* Code content */}
      <div className="relative group">
        <pre className={`language-${normalizedLang} text-sm p-4 overflow-x-auto font-mono leading-relaxed`} 
          style={{ 
            background: 'var(--editor-bg)',
            color: 'var(--code-fg)',
          }}>
          <code ref={codeRef} className={`language-${normalizedLang}`}>
            {code}
          </code>
        </pre>
        
        {/* Floating copy button that appears on hover for quick access */}
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 bg-gray-700/80 hover:bg-gray-600 rounded-md p-2 text-white shadow-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity focus:opacity-100"
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          title="Copy code"
          aria-label="Copy code to clipboard"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
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
      
      {/* Footer */}
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
