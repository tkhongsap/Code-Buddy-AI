import { marked } from 'marked';
import * as DOMPurify from 'isomorphic-dompurify';

// Initialize marked options once
marked.setOptions({
  breaks: true,  // Convert \n to <br>
  gfm: true,     // GitHub Flavored Markdown
});

/**
 * Format text using markdown and sanitize the resulting HTML
 */
export function formatAIResponse(text: string): string {
  try {
    // Parse markdown to HTML
    let htmlContent = marked.parse(text);
    
    // Sanitize the HTML to prevent XSS attacks
    let sanitizedHtml: string;
    
    // Handle different ways DOMPurify might be exported
    const purify = DOMPurify as any;
    if (purify.sanitize) {
      sanitizedHtml = purify.sanitize(htmlContent);
    } else if (purify.default && purify.default.sanitize) {
      sanitizedHtml = purify.default.sanitize(htmlContent);
    } else {
      // Fallback if DOMPurify isn't working as expected
      console.warn('DOMPurify not available, using unsanitized HTML');
      sanitizedHtml = htmlContent as string;
    }
    
    return sanitizedHtml;
  } catch (error) {
    console.error('Error formatting markdown:', error);
    // Return a safe fallback
    return `<p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
  }
} 