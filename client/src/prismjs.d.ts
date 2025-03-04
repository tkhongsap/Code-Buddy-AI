// Type definitions for Prism.js components

declare module 'prismjs' {
  namespace Prism {
    function highlightElement(element: HTMLElement): void;
    const languages: Record<string, any>;
  }
  
  export = Prism;
}

declare module 'prismjs/components/prism-jsx' {}
declare module 'prismjs/components/prism-typescript' {}
declare module 'prismjs/components/prism-tsx' {}