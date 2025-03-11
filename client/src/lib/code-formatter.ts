import Prism from 'prismjs';

// Import Prism languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';

// Import Prism theme
import 'prismjs/themes/prism-okaidia.css';

/**
 * Enhances code blocks in the given container element.
 * This should be called after the markdown content is rendered.
 * 
 * @param containerSelector CSS selector for the container element
 */
export function enhanceCodeBlocks(containerSelector: string) {
  // Find all code blocks within the container
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  const codeBlocks = container.querySelectorAll('pre code');
  if (codeBlocks.length === 0) return;
  
  codeBlocks.forEach(codeElement => {
    const preElement = codeElement.parentElement;
    if (!preElement || preElement.hasAttribute('data-enhanced')) return;
    
    // Mark as processed to avoid duplicate processing
    preElement.setAttribute('data-enhanced', 'true');
    
    // Get the code and determine language
    const code = codeElement.textContent || '';
    let language = 'text';
    
    codeElement.classList.forEach(className => {
      if (className.startsWith('language-')) {
        language = className.replace('language-', '');
      }
    });
    
    // Create the container
    const codeContainer = document.createElement('div');
    codeContainer.className = 'code-container my-4 overflow-hidden border rounded-md shadow-md';
    codeContainer.style.borderColor = '#333';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-4 py-2 text-xs border-b';
    header.style.backgroundColor = '#1e1e1e';
    header.style.color = '#d4d4d4';
    header.style.borderColor = '#333';
    
    // Language indicator
    const langIndicator = document.createElement('div');
    langIndicator.className = 'flex items-center gap-2';
    langIndicator.innerHTML = `
      <span class="flex space-x-1">
        <span class="h-3 w-3 rounded-full bg-red-500 opacity-75"></span>
        <span class="h-3 w-3 rounded-full bg-yellow-500 opacity-75"></span>
        <span class="h-3 w-3 rounded-full bg-green-500 opacity-75"></span>
      </span>
      <span class="font-semibold text-xs" style="color:#569CD6;">${language}</span>
    `;
    
    // Copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'transition-all px-2 py-1 rounded-md flex items-center gap-1 bg-gray-700/60 text-gray-100 hover:bg-gray-600';
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
      const originalHTML = copyButton.innerHTML;
      copyButton.innerHTML = `
        <span class="text-xs">Copied!</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5"></path>
        </svg>
      `;
      copyButton.style.backgroundColor = '#16a34a';
      
      setTimeout(() => {
        copyButton.innerHTML = originalHTML;
        copyButton.style.backgroundColor = '';
      }, 1500);
    });
    
    // Add elements to header
    header.appendChild(langIndicator);
    header.appendChild(copyButton);
    
    // Style the pre element
    preElement.style.margin = '0';
    preElement.style.padding = '1rem';
    preElement.style.backgroundColor = '#1e1e1e';
    preElement.style.borderRadius = '0';
    preElement.style.overflow = 'auto';
    
    // Create footer
    const footer = document.createElement('div');
    footer.className = 'px-4 py-1 text-xs border-t flex justify-between';
    footer.style.backgroundColor = '#1e1e1e';
    footer.style.color = '#6A9955';
    footer.style.borderColor = '#333';
    footer.innerHTML = `
      <span>// AI Code Buddy</span>
      <span>${new Date().toLocaleDateString()}</span>
    `;
    
    // Assemble all parts
    codeContainer.appendChild(header);
    
    // Clone the pre element to avoid DOM manipulation issues
    const preClone = preElement.cloneNode(true) as HTMLElement;
    codeContainer.appendChild(preClone);
    codeContainer.appendChild(footer);
    
    // Replace original pre with enhanced container
    preElement.parentNode?.replaceChild(codeContainer, preElement);
    
    // Apply syntax highlighting
    try {
      const newCodeElement = preClone.querySelector('code');
      if (newCodeElement) {
        Prism.highlightElement(newCodeElement);
      }
    } catch (error) {
      console.error('Error highlighting code:', error);
    }
  });
}