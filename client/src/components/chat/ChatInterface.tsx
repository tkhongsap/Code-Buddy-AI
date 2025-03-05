import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Header from "../layout/Header";
import { CodeBlock } from "../ui/code-block";
import { useTheme } from "@/hooks/use-theme";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { mockSavedResponses } from "@/lib/mock-data";
import { marked } from 'marked';
import * as DOMPurify from 'isomorphic-dompurify';

interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  html?: string;
}

interface SavedResponse {
  id: number;
  content: string;
  timestamp: string;
  question: string;
}

export default function ChatInterface() {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      content: 'Hi there! I\'m your AI Code Buddy. How can I help with your coding challenges today?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch saved responses
  const { data: savedResponses = [], refetch: refetchSavedResponses } = useQuery<SavedResponse[]>({
    queryKey: ["/api/saved-responses"],
    queryFn: async () => {
      // In a real implementation, this would fetch from the API
      return mockSavedResponses;
    },
  });

  // Configure Marked options with simpler approach
  useEffect(() => {
    try {
      // Set basic marked options without custom renderer
      marked.setOptions({
        breaks: true,       // Convert \n to <br>
        gfm: true,          // GitHub Flavored Markdown
      });
    } catch (error) {
      console.error('Error configuring marked options:', error);
    }
  }, []);

  // Format AI response text using marked with a simpler approach
  const formatAIResponse = (text: string): string => {
    try {
      // Using a simpler implementation that doesn't rely on custom renderer
      // which avoids TypeScript errors with the marked library typings
      let htmlContent = marked.parse(text);
      
      // Safety: sanitize HTML to prevent XSS attacks
      let sanitizedHtml: string;
      
      // Use type assertion to access DOMPurify's sanitize function
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
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string; conversationHistory: Message[] }) => {
      // Call the real API endpoint
      const response = await apiRequest("POST", "/api/chat", {
        message: messageData.message,
        conversationHistory: messageData.conversationHistory
      });
      
      const data = await response.json();
      return data.response;
    },
    onSuccess: (response, variables) => {
      setMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          sender: 'ai',
          content: response,
          timestamp: new Date().toLocaleTimeString(),
          html: formatAIResponse(response)
        }
      ]);
      setIsTyping(false);
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      setIsTyping(false);
      
      toast({
        title: "Error",
        description: "Failed to communicate with AI service. Please try again.",
        variant: "destructive",
      });

      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          sender: 'ai',
          content: "I'm sorry, I'm having trouble connecting to my AI service. Please try again in a moment.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  });

  // Save response mutation
  const saveResponseMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const message = messages.find(m => m.id === messageId);
      if (!message || message.sender !== 'ai') return;
      
      const questionMessage = messages.find(m => m.id === messageId - 1);
      
      // In a real implementation, this would send to the API
      const savedResponse: SavedResponse = {
        id: Date.now(),
        content: message.content,
        timestamp: new Date().toLocaleString(),
        question: questionMessage?.content || 'Unknown question'
      };
      
      // Mock API call
      return new Promise<SavedResponse>((resolve) => {
        setTimeout(() => resolve(savedResponse), 300);
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Response saved to your collection",
        variant: "default",
      });
      refetchSavedResponses();
    }
  });

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newMessage.trim() === '' || isTyping) return;
    
    // Add user message
    setMessages(prev => [
      ...prev, 
      {
        id: prev.length + 1,
        sender: 'user',
        content: newMessage,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    
    const userQuestion = newMessage;
    setNewMessage('');
    setIsTyping(true);
    
    // Prepare conversation history to send to the API
    // We exclude the initial greeting and the message we just added
    const conversationHistory = messages.slice(1);
    
    // Send to API
    await sendMessageMutation.mutateAsync({
      message: userQuestion,
      conversationHistory
    });
  };

  const saveResponse = (messageId: number) => {
    saveResponseMutation.mutate(messageId);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Process code blocks after rendering with improved detection and handling
  useEffect(() => {
    // Target both standard markdown code elements and our old .code-block elements for backward compatibility
    const codeElements = document.querySelectorAll('.ai-formatted-message pre code, .code-block');
    
    if (codeElements.length === 0) return;
    
    // Function to process code blocks after Prism is loaded
    const processCodeBlocks = (Prism: any) => {
      codeElements.forEach(element => {
        // Handle different types of code elements
        if (element.classList.contains('code-block')) {
          // Handle our custom code-block divs
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
          
          // Highlight the code
          try {
            Prism.highlightElement(codeEl);
          } catch (error) {
            console.warn('Error highlighting code-block:', error);
          }
        } else {
          // Handle standard <code> elements inside <pre> tags that marked.js generates
          try {
            // Try to determine language from class (e.g., "language-python")
            let language = 'javascript';
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
              preElement.classList.add('code-block-pre');
              
              // Create a header for the code block if it doesn't exist
              if (!preElement.previousElementSibling?.classList.contains('code-header')) {
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
                  navigator.clipboard.writeText(element.textContent || '');
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
                
                codeHeader.appendChild(langBadge);
                codeHeader.appendChild(copyButton);
                
                // Insert the header before the pre element
                preElement.parentNode?.insertBefore(codeHeader, preElement);
                
                // Also style the pre element
                preElement.style.backgroundColor = 'var(--editor-bg, #1e1e1e)';
                preElement.style.color = 'var(--code-fg, #d4d4d4)';
                preElement.style.margin = '0';
                preElement.style.padding = '1rem';
                preElement.style.borderRadius = '0';
                preElement.style.overflow = 'auto';
                
                // Add a footer
                const codeFooter = document.createElement('div');
                codeFooter.className = 'code-footer px-4 py-1 text-xs border-t flex justify-between';
                codeFooter.style.backgroundColor = 'var(--editor-bg, #1e1e1e)';
                codeFooter.style.color = 'var(--syntax-comment, #6A9955)';
                codeFooter.style.borderColor = 'var(--tab-border, #333333)';
                codeFooter.innerHTML = `
                  <span>// AI Code Buddy</span>
                  <span>${new Date().toLocaleDateString()}</span>
                `;
                
                // Insert footer after pre element
                preElement.parentNode?.insertBefore(codeFooter, preElement.nextSibling);
                
                // Wrap the components in a container
                const codeContainer = document.createElement('div');
                codeContainer.className = 'code-container my-4 rounded-md overflow-hidden border shadow-md';
                codeContainer.style.borderColor = 'var(--tab-border, #333333)';
                
                // Move elements into container
                preElement.parentNode?.insertBefore(codeContainer, codeHeader);
                codeContainer.appendChild(codeHeader);
                codeContainer.appendChild(preElement);
                codeContainer.appendChild(codeFooter);
              }
            }
            
            // Highlight with Prism
            Prism.highlightElement(element);
          } catch (error) {
            console.warn('Error processing code element:', error);
          }
        }
      });
    };
    
    // Load Prism and all needed language components once
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
  }, [messages]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex h-[calc(100vh-64px)]">
        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900">
          {/* Header */}
          <div className="border-b bg-slate-900 p-4">
            <div className="flex items-center justify-between dropdown-menu">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-sm bg-primary flex items-center justify-center text-white mr-3 shadow-lg border border-indigo-400/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 18h.01"></path>
                    <path d="M8 18h.01"></path>
                    <path d="M16 18h.01"></path>
                    <path d="M3 10h18"></path>
                    <path d="M3 6h18"></path>
                    <rect width="18" height="16" x="3" y="4" rx="2"></rect>
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
          
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] lg:max-w-[70%] rounded-lg p-4 ${
                      message.sender === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-card'
                    } shadow-sm relative group`}
                  >
                    {message.sender === 'ai' && message.html ? (
                      <div className="chat-message ai-formatted-message" dangerouslySetInnerHTML={{ __html: message.html }} />
                    ) : (
                      <div className="chat-message whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}
                    <div className="text-xs mt-2 opacity-70">{message.timestamp}</div>
                    
                    {/* Action buttons for messages */}
                    <div className="absolute -top-3 -right-3 flex space-x-1">
                      {/* Copy button for all messages */}
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(message.content);
                          toast({
                            title: "Copied!",
                            description: "Message copied to clipboard",
                            duration: 1500,
                          });
                        }}
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full bg-card shadow-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
                        title="Copy message"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span className="sr-only">Copy message</span>
                      </Button>
                      
                      {/* Save button for AI messages */}
                      {message.sender === 'ai' && (
                        <Button
                          onClick={() => saveResponse(message.id)}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full bg-card shadow-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
                          title="Save response"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
                          </svg>
                          <span className="sr-only">Save response</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-card rounded-lg p-4 shadow-sm flex items-center space-x-2">
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></div>
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Input area */}
          <div className="border-t bg-card p-4">
            <form onSubmit={sendMessage} className="flex items-center space-x-2">
              <Input 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask a coding question..." 
                className="flex-1 py-6"
                disabled={isTyping}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="h-10 w-10" 
                disabled={isTyping || newMessage.trim() === ''}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z"></path>
                  <path d="M22 2 11 13"></path>
                </svg>
                <span className="sr-only">Send</span>
              </Button>
            </form>
            <div className="flex justify-center mt-3">
              <div className="text-xs text-muted-foreground flex items-center space-x-4">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="m5 9 2 2c2.33-2.33 5.67-2.33 8 0l2-2c-3.33-3.33-8.67-3.33-12 0z"></path>
                    <path d="m8 12 2 2c1-1 2-1 3 0l2-2c-2-2-5-2-7 0z"></path>
                    <circle cx="12" cy="16" r="1"></circle>
                  </svg>
                  Fast response
                </span>
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M12 20v-6M9 7V5c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2v2l2 3h-8l2-3Z"></path>
                    <path d="M5 8v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"></path>
                  </svg>
                  Conversation saved
                </span>
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="m18 16 4-4-4-4"></path>
                    <path d="m6 8-4 4 4 4"></path>
                    <path d="m14.5 4-5 16"></path>
                  </svg>
                  Code highlighting
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Saved responses sidebar */}
        <div className="hidden lg:block w-80 border-l bg-card overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Saved Responses</h3>
          </div>
          
          <ScrollArea className="h-[calc(100vh-110px)]">
            <div className="p-4">
              {savedResponses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
                    </svg>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    No saved responses yet. Click the bookmark icon on any AI response to save it for future reference.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedResponses.map((response) => (
                    <Card key={response.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium mb-2 line-clamp-1">{response.question}</p>
                        <div className="text-xs text-muted-foreground mb-2">{response.timestamp}</div>
                        <div className="text-sm line-clamp-3 overflow-hidden">
                          {response.content.split('```')[0]}
                        </div>
                        <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-xs">
                          View full response
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}
