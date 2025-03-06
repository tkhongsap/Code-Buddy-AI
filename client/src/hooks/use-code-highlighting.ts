import { useEffect } from 'react';

export function useCodeHighlighting(dependencies: any[] = []) {
  useEffect(() => {
    // Process code blocks after rendering with improved detection and handling
    const codeElements = document.querySelectorAll('.ai-formatted-message pre code, .code-block');
    
    if (codeElements.length === 0) return;
    
    // Load Prism and process code blocks
    const loadPrism = async () => {
      try {
        const Prism = await import('prismjs');
        
        // Load commonly used languages in parallel
        await Promise.all([
          import('prismjs/components/prism-javascript'),
          import('prismjs/components/prism-jsx'),
          import('prismjs/components/prism-typescript'),
          import('prismjs/components/prism-tsx'),
          import('prismjs/components/prism-css'),
          import('prismjs/components/prism-python'),
          import('prismjs/components/prism-java'),
          import('prismjs/components/prism-csharp'),
          import('prismjs/components/prism-json'),
          import('prismjs/components/prism-bash'),
          import('prismjs/components/prism-markdown'),
          import('prismjs/components/prism-sql'),
          import('prismjs/components/prism-php'),
          import('prismjs/components/prism-ruby'),
        ]);
        
        // Process all code blocks
        processCodeBlocks(Prism.default);
      } catch (error) {
        console.error('Error loading Prism or languages:', error);
      }
    };
    
    loadPrism();
    
    // Function to process code blocks
    function processCodeBlocks(Prism: any) {
      codeElements.forEach(element => {
        // Handle different types of code elements
        if (element.classList.contains('code-block')) {
          processCodeBlockElement(element as HTMLElement, Prism);
        } else {
          // Handle standard <code> elements inside <pre> tags that marked.js generates
          processStandardCodeElement(element as HTMLElement, Prism);
        }
      });
    }
    
    // Process custom code-block elements
    function processCodeBlockElement(element: HTMLElement, Prism: any) {
      const language = element.getAttribute('data-language') || 'javascript';
      const code = element.textContent || '';
      
      // Skip if already processed
      if (element.querySelector('pre')) return;
      
      // Clear the block
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      
      // Create new pre and code elements
      const pre = document.createElement('pre');
      pre.className = `language-${language}`;
      const codeEl = document.createElement('code');
      codeEl.className = `language-${language}`;
      codeEl.textContent = code;
      
      pre.appendChild(codeEl);
      element.appendChild(pre);
      
      // Add copy button
      addCopyButton(element, code);
      
      // Highlight the code
      try {
        Prism.highlightElement(codeEl);
      } catch (error) {
        console.warn('Error highlighting code-block:', error);
      }
    }
    
    // Process standard code elements
    function processStandardCodeElement(element: HTMLElement, Prism: any) {
      try {
        // Try to determine language from class (e.g., "language-python")
        let language = 'text'; // Default to 'text'
        element.classList.forEach(className => {
          if (className.startsWith('language-')) {
            language = className.replace('language-', '');
          }
        });
        
        // Set language class if not already present
        if (!element.classList.contains(`language-${language}`)) {
          element.className = `language-${language}`;
        }
        
        // Style the parent pre element for better appearance
        const preElement = element.parentElement;
        if (preElement && preElement.tagName === 'PRE') {
          enhancePreElement(preElement, language, element.textContent || '');
        }
        
        // Highlight with Prism
        Prism.highlightElement(element);
      } catch (error) {
        console.warn('Error processing code element:', error);
      }
    }
    
    // Enhance pre element with header, styling, and copy button
    function enhancePreElement(preElement: HTMLElement, language: string, code: string) {
      preElement.classList.add('code-block-pre');
      
      // Create a header for the code block if it doesn't exist
      if (!preElement.previousElementSibling?.classList.contains('code-header')) {
        const codeHeader = createCodeHeader(language, code);
        
        // Insert the header before the pre element
        preElement.parentNode?.insertBefore(codeHeader, preElement);
        
        // Style the pre element
        stylePreElement(preElement);
        
        // Add a footer
        const codeFooter = createCodeFooter();
        
        // Insert footer after pre element
        preElement.parentNode?.insertBefore(codeFooter, preElement.nextSibling);
        
        // Wrap the components in a container
        wrapInCodeContainer(codeHeader, preElement, codeFooter);
      }
    }
    
    // Create code block header
    function createCodeHeader(language: string, code: string) {
      const codeHeader = document.createElement('div');
      codeHeader.className = 'code-header flex items-center justify-between px-4 py-2 text-xs border-b';
      codeHeader.style.backgroundColor = 'var(--sidebar-bg, #1e1e1e)';
      codeHeader.style.color = 'var(--code-fg, #d4d4d4)';
      codeHeader.style.borderColor = 'var(--tab-border, #333333)';
      
      // Language badge
      const langBadge = document.createElement('div');
      langBadge.className = 'flex items-center gap-2';
      langBadge.innerHTML = `
        <span class="flex space-x-1">
          <span class="h-3 w-3 rounded-full bg-red-500 opacity-75"></span>
          <span class="h-3 w-3 rounded-full bg-yellow-500 opacity-75"></span>
          <span class="h-3 w-3 rounded-full bg-green-500 opacity-75"></span>
        </span>
        <span class="font-semibold text-xs" style="color: var(--syntax-constant, #569CD6);">${language}</span>
      `;
      
      // Copy button
      const copyButton = createCopyButton(code);
      
      codeHeader.appendChild(langBadge);
      codeHeader.appendChild(copyButton);
      
      return codeHeader;
    }
    
    // Create code footer
    function createCodeFooter() {
      const codeFooter = document.createElement('div');
      codeFooter.className = 'code-footer px-4 py-1 text-xs border-t flex justify-between';
      codeFooter.style.backgroundColor = 'var(--editor-bg, #1e1e1e)';
      codeFooter.style.color = 'var(--syntax-comment, #6A9955)';
      codeFooter.style.borderColor = 'var(--tab-border, #333333)';
      codeFooter.innerHTML = `
        <span>// AI Code Buddy</span>
        <span>${new Date().toLocaleDateString()}</span>
      `;
      
      return codeFooter;
    }
    
    // Style pre element
    function stylePreElement(preElement: HTMLElement) {
      preElement.style.backgroundColor = 'var(--editor-bg, #1e1e1e)';
      preElement.style.color = 'var(--code-fg, #d4d4d4)';
      preElement.style.margin = '0';
      preElement.style.padding = '1rem';
      preElement.style.borderRadius = '0';
      preElement.style.overflow = 'auto';
    }
    
    // Wrap elements in container
    function wrapInCodeContainer(header: HTMLElement, pre: HTMLElement, footer: HTMLElement) {
      const codeContainer = document.createElement('div');
      codeContainer.className = 'code-container my-4 rounded-md overflow-hidden border shadow-md';
      codeContainer.style.borderColor = 'var(--tab-border, #333333)';
      
      // Move elements into container
      pre.parentNode?.insertBefore(codeContainer, header);
      codeContainer.appendChild(header);
      codeContainer.appendChild(pre);
      codeContainer.appendChild(footer);
    }
    
    // Create copy button
    function createCopyButton(code: string) {
      const copyButton = document.createElement('button');
      copyButton.className = 'transition-colors hover:text-white flex items-center gap-1';
      copyButton.style.color = 'var(--line-number, #858585)';
      copyButton.title = 'Copy to clipboard';
      copyButton.innerHTML = `
        <span class="text-xs">Copy</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      `;
      
      // Add copy functionality
      copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(code);
        const originalInnerHTML = copyButton.innerHTML;
        copyButton.innerHTML = `
          <span class="text-xs">Copied!</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
        `;
        copyButton.style.color = 'var(--green-500, #4ade80)';
        setTimeout(() => {
          copyButton.innerHTML = originalInnerHTML;
          copyButton.style.color = 'var(--line-number, #858585)';
        }, 1500);
      });
      
      return copyButton;
    }
    
    // Add copy button to element
    function addCopyButton(element: HTMLElement, code: string) {
      // Add copy button container
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'copy-button-container';
      buttonContainer.setAttribute('style', 'position: absolute; top: 0.5rem; right: 0.5rem;');
      
      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-button transition-colors hover:text-white flex items-center gap-1 bg-slate-700 px-2 py-1 rounded-md';
      copyButton.setAttribute('style', 'color: var(--line-number, #858585);');
      copyButton.title = 'Copy to clipboard';
      copyButton.innerHTML = `
        <span class="text-xs">Copy</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      `;
      
      // Add copy functionality
      copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(code);
        const originalInnerHTML = copyButton.innerHTML;
        copyButton.innerHTML = `
          <span class="text-xs">Copied!</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
        `;
        copyButton.setAttribute('style', 'color: var(--green-500, #4ade80);');
        setTimeout(() => {
          copyButton.innerHTML = originalInnerHTML;
          copyButton.setAttribute('style', 'color: var(--line-number, #858585);');
        }, 1500);
      });
      
      buttonContainer.appendChild(copyButton);
      element.setAttribute('style', 'position: relative;');
      element.appendChild(buttonContainer);
    }
    
  }, [...dependencies]);
} 