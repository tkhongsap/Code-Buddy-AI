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

  // Configure Marked options
  useEffect(() => {
    try {
      // Create a custom renderer to handle code blocks
      const renderer = new marked.Renderer();
      
      // Override the code block rendering to use our code-block format
      // Using the correct type signature from marked
      renderer.code = function(text, lang, escaped) {
        const language = lang || 'javascript';
        return `<div class="code-block" data-language="${language}">${text}</div>`;
      };
      
      // Override other renderer methods for better styling
      renderer.paragraph = function(text) {
        return `<p class="mb-4">${text}</p>`;
      };
      
      renderer.list = function(body, ordered) {
        const type = ordered ? 'ol' : 'ul';
        return `<${type} class="mb-4 pl-6">${body}</${type}>`;
      };
      
      renderer.listitem = function(text) {
        return `<li class="mb-1">${text}</li>`;
      };
      
      // Set marked options with our custom renderer
      marked.setOptions({
        renderer: renderer,
        breaks: true,       // Convert \n to <br>
        gfm: true,          // GitHub Flavored Markdown
        headerIds: true,    // Add ids to headers for linking
        pedantic: false,    // Don't be too strict with the original markdown spec
        mangle: false,      // Don't mangle email addresses
      });
    } catch (error) {
      console.error('Error configuring marked options:', error);
    }
  }, []);

  // Format AI response text using marked
  const formatAIResponse = (text: string): string => {
    try {
      // First pass the text through marked for markdown conversion
      const htmlContent = marked.parse(text);
      
      // Sanitize HTML to prevent XSS
      // DOMPurify doesn't have .default in its type definitions but it might in the runtime
      // So we need to check both ways
      const purify = (DOMPurify as any).default || DOMPurify;
      const sanitizedHtml = purify.sanitize(htmlContent);
      
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

  // Process code blocks after rendering with improved loading of Prism languages
  useEffect(() => {
    const codeBlocks = document.querySelectorAll('.code-block');
    
    if (codeBlocks.length === 0) return;
    
    // Function to process code blocks after Prism is loaded
    const processCodeBlocks = (Prism: any) => {
      codeBlocks.forEach(block => {
        const language = block.getAttribute('data-language') || 'javascript';
        const code = block.textContent || '';
        
        // Skip if already processed
        if (block.querySelector('pre')) return;
        
        // Clear the block
        while (block.firstChild) {
          block.removeChild(block.firstChild);
        }
        
        // Create new pre and code elements
        const pre = document.createElement('pre');
        pre.className = `language-${language}`;
        const codeEl = document.createElement('code');
        codeEl.className = `language-${language}`;
        codeEl.textContent = code;
        
        pre.appendChild(codeEl);
        block.appendChild(pre);
        
        // Highlight the code
        try {
          Prism.highlightElement(codeEl);
        } catch (error) {
          console.warn('Error highlighting code:', error);
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
                    
                    {/* Save button for AI messages */}
                    {message.sender === 'ai' && (
                      <Button
                        onClick={() => saveResponse(message.id)}
                        size="icon"
                        variant="ghost"
                        className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-card shadow-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
                        </svg>
                        <span className="sr-only">Save response</span>
                      </Button>
                    )}
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
