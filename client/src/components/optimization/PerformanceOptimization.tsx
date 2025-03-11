import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import OptimizationHeader from "./OptimizationHeader";
import { useTheme } from "@/hooks/use-theme";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { marked } from 'marked';
import * as DOMPurify from 'isomorphic-dompurify';
import 'prismjs/themes/prism-okaidia.css'; // Dark theme with vibrant colors
import MessageInput from "../chat/MessageInput";
import MessageList from "../chat/MessageList";


interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  html?: string;
}

export default function PerformanceOptimization() {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now(), // Use timestamp for uniqueness
      sender: 'ai',
      content: 'Hi there! I\'m your Performance & Security Optimizer. Paste your code, and I\'ll analyze it for performance improvements and security vulnerabilities.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true); // Toggle for streaming responses
  const [streamingResponse, setStreamingResponse] = useState(""); // Current streaming response
  const [isStreaming, setIsStreaming] = useState(false); // Track if we're currently streaming
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null); // Reference to the EventSource
  
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
      // Call the existing chat API endpoint but pass a flag to identify performance optimization
      const response = await apiRequest("POST", "/api/chat", {
        message: messageData.message,
        conversationHistory: messageData.conversationHistory,
        isOptimizationRequest: true
      });
      
      const data = await response.json();
      return data.response;
    },
    onSuccess: (response, variables) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(), // Use timestamp for uniqueness
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
        description: "Failed to communicate with optimization service. Please try again.",
        variant: "destructive",
      });

      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(), // Use timestamp for uniqueness
          sender: 'ai',
          content: "I'm sorry, I'm having trouble connecting to the optimization service. Please try again in a moment.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  });

  // Save response function
  const saveResponse = (messageId: number) => {
    toast({
      title: "Feature Notice",
      description: "Saving optimization responses is coming soon!",
      variant: "default",
    });
  };

  // Clean up any existing EventSource
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Handle streaming response
  const handleStreamedResponse = async (userQuestion: string, conversationHistory: Message[]) => {
    try {
      // Clean up any existing EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // First get the current state of messages to avoid race conditions
      const currentMessages = [...messages];
      
      // Create a placeholder message for the streaming response
      // Use a more reliable way to generate a unique ID that won't conflict with user message
      const newMessageId = Date.now(); // Use timestamp for uniqueness
      
      // Set streaming flag to true
      setIsStreaming(true);
      
      // Add this placeholder message for AI response
      setMessages(prev => [
        ...prev,
        {
          id: newMessageId,
          sender: 'ai' as const,
          content: '',
          timestamp: new Date().toLocaleTimeString(),
          html: ''
        }
      ]);
      
      // Reset streaming response
      setStreamingResponse('');
      
      // Create POST request body - explicitly filtering out the message we just added
      // and only sending prior messages as conversation history
      const requestBody = JSON.stringify({
        message: userQuestion,
        conversationHistory: conversationHistory,
        isOptimizationRequest: true
      });
      
      // Use EventSource for streaming response
      // For browsers that don't support native EventSource with POST
      // we handle it manually with fetch and event parsing
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
      
      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body reader could not be created');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      let completeResponse = '';
      
      // Process the stream chunk by chunk
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process any complete events in the buffer
        let eventStart = 0;
        let eventEnd = buffer.indexOf('\n\n', eventStart);
        
        while (eventEnd > -1) {
          const eventData = buffer.substring(eventStart, eventEnd);
          if (eventData.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(eventData.slice(6)); // Remove 'data: ' prefix
              
              if (jsonData.error) {
                throw new Error(jsonData.error);
              }
              
              if (!jsonData.done) {
                // Update streaming response with new content
                completeResponse += jsonData.content;
                setStreamingResponse(completeResponse);
                
                // Update message in real-time
                setMessages(prev => {
                  // Find the AI message with our specific ID
                  const aiMessageIndex = prev.findIndex(msg => msg.id === newMessageId);
                  
                  // If the AI message is found, update only that message
                  if (aiMessageIndex !== -1) {
                    const updatedMessages = [...prev];
                    updatedMessages[aiMessageIndex] = {
                      ...updatedMessages[aiMessageIndex],
                      content: completeResponse,
                      html: formatAIResponse(completeResponse)
                    };
                    return updatedMessages;
                  }
                  
                  // If AI message not found (unlikely), don't modify anything
                  return prev;
                });
              } else if (jsonData.done && jsonData.fullResponse) {
                // Final response received
                completeResponse = jsonData.fullResponse;
                setStreamingResponse(completeResponse);
                
                // Update message with complete response
                setMessages(prev => {
                  // Find the AI message with our specific ID
                  const aiMessageIndex = prev.findIndex(msg => msg.id === newMessageId);
                  
                  // If the AI message is found, update only that message
                  if (aiMessageIndex !== -1) {
                    const updatedMessages = [...prev];
                    updatedMessages[aiMessageIndex] = {
                      ...updatedMessages[aiMessageIndex],
                      content: completeResponse,
                      html: formatAIResponse(completeResponse)
                    };
                    return updatedMessages;
                  }
                  
                  // If AI message not found (unlikely), don't modify anything
                  return prev;
                });
                
                setIsTyping(false);
                setIsStreaming(false); // Streaming is complete
              }
            } catch (error) {
              console.error('Error parsing streamed response:', error);
            }
          }
          
          // Move to next event
          eventStart = eventEnd + 2;
          eventEnd = buffer.indexOf('\n\n', eventStart);
        }
        
        // Keep any unprocessed partial event in the buffer
        buffer = buffer.substring(eventStart);
      }
      
    } catch (error) {
      console.error('Error with streaming response:', error);
      setIsTyping(false);
      
      toast({
        title: "Error",
        description: "Failed to communicate with optimization service. Please try again.",
        variant: "destructive",
      });
      
      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(), // Use timestamp for uniqueness
          sender: 'ai',
          content: "I'm sorry, I'm having trouble connecting to the optimization service. Please try again in a moment.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newMessage.trim() === '' || isTyping) return;
    
    const userQuestion = newMessage;
    setNewMessage('');
    setIsTyping(true);
    
    // Get current messages for conversation history
    // before adding the new user message
    const conversationHistory = messages.slice(1);
    
    // Add user message with a unique timestamp-based ID
    // Using a promise to ensure the state update completes
    await new Promise<void>(resolve => {
      setMessages(prev => {
        const updatedMessages = [
          ...prev, 
          {
            id: Date.now(), // Use timestamp for uniqueness
            sender: 'user' as const, // Use a const assertion to ensure correct type
            content: userQuestion,
            timestamp: new Date().toLocaleTimeString()
          }
        ];
        
        // Resolve once the state update is processed
        setTimeout(resolve, 0);
        
        return updatedMessages;
      });
    });
    
    // If streaming is enabled, use streaming API
    if (useStreaming) {
      await handleStreamedResponse(userQuestion, conversationHistory);
    } else {
      // Otherwise use regular API
      await sendMessageMutation.mutateAsync({
        message: userQuestion,
        conversationHistory
      });
    }
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100); // Small delay to ensure DOM is updated
    
    return () => clearTimeout(timeoutId);
  }, [messages, isTyping]);

  // Process code blocks with direct implementation for better reliability
  useEffect(() => {
    // Target specifically code blocks in AI messages
    const codeElements = document.querySelectorAll('.ai-formatted-message pre code');
    
    if (codeElements.length === 0) return;
    
    // Function to process code blocks after Prism is loaded
    const processCodeBlocks = (Prism: any) => {
      codeElements.forEach((element) => {
        const codeElement = element as HTMLElement;
        const preElement = codeElement.parentElement as HTMLElement;
        
        // Skip if already processed
        if (preElement.getAttribute('data-processed') === 'true') {
          return;
        }
        
        // Mark as processed
        preElement.setAttribute('data-processed', 'true');
        
        try {
          // Get the code and language
          const code = codeElement.textContent || '';
          let language = 'text'; // Default
          
          // Try to determine language from class (e.g., "language-python")
          codeElement.classList.forEach(className => {
            if (className.startsWith('language-')) {
              language = className.replace('language-', '');
            }
          });
          
          // Create a wrapper for our enhanced code block
          const containerDiv = document.createElement('div');
          containerDiv.className = 'code-container my-4 rounded-md overflow-hidden border shadow-md';
          containerDiv.style.borderColor = 'var(--tab-border, #333333)';
          
          // Create header with language info and copy button
          const headerDiv = document.createElement('div');
          headerDiv.className = 'flex items-center justify-between px-4 py-2 text-xs border-b';
          headerDiv.style.backgroundColor = 'var(--sidebar-bg, #1e1e1e)';
          headerDiv.style.color = 'var(--code-fg, #d4d4d4)';
          headerDiv.style.borderColor = 'var(--tab-border, #333333)';
          
          // Left side with language info
          const langDiv = document.createElement('div');
          langDiv.className = 'flex items-center gap-2';
          langDiv.innerHTML = `
            <span class="flex space-x-1">
              <span class="h-3 w-3 rounded-full bg-red-500 opacity-75"></span>
              <span class="h-3 w-3 rounded-full bg-yellow-500 opacity-75"></span>
              <span class="h-3 w-3 rounded-full bg-green-500 opacity-75"></span>
            </span>
            <span class="font-semibold text-xs" style="color: var(--syntax-constant, #569CD6);">${language}</span>
          `;
          
          // Copy button
          const copyButton = document.createElement('button');
          copyButton.className = 'transition-all px-2 py-1 rounded-md flex items-center gap-1 bg-gray-700/60 text-gray-100 hover:bg-gray-600';
          copyButton.style.color = 'var(--gray-200, #e5e7eb)';
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
            copyButton.style.backgroundColor = 'var(--green-600, #16a34a)';
            copyButton.style.color = 'var(--white, #ffffff)';
            setTimeout(() => {
              copyButton.innerHTML = originalInnerHTML;
              copyButton.style.backgroundColor = 'var(--gray-700-60, rgba(55, 65, 81, 0.6))';
              copyButton.style.color = 'var(--gray-200, #e5e7eb)';
            }, 1500);
          });
          
          // Add elements to header
          headerDiv.appendChild(langDiv);
          headerDiv.appendChild(copyButton);
          
          // Style the pre element
          preElement.style.backgroundColor = 'var(--editor-bg, #1e1e1e)';
          preElement.style.color = 'var(--code-fg, #d4d4d4)';
          preElement.style.margin = '0';
          preElement.style.padding = '1rem';
          preElement.style.borderRadius = '0';
          preElement.style.overflow = 'auto';
          
          // Create footer
          const footerDiv = document.createElement('div');
          footerDiv.className = 'px-4 py-1 text-xs border-t flex justify-between';
          footerDiv.style.backgroundColor = 'var(--editor-bg, #1e1e1e)';
          footerDiv.style.color = 'var(--syntax-comment, #6A9955)';
          footerDiv.style.borderColor = 'var(--tab-border, #333333)';
          footerDiv.innerHTML = `
            <span>// Performance Optimizer</span>
            <span>${new Date().toLocaleDateString()}</span>
          `;
          
          // Get the parent of the pre element
          const parentElement = preElement.parentElement;
          if (parentElement) {
            // Create our container structure
            containerDiv.appendChild(headerDiv);
            
            // Clone the pre to avoid DOM manipulation issues
            const preClone = preElement.cloneNode(true) as HTMLElement;
            containerDiv.appendChild(preClone);
            containerDiv.appendChild(footerDiv);
            
            // Replace the original pre with our enhanced container
            parentElement.replaceChild(containerDiv, preElement);
            
            // Highlight the code
            const newCodeElement = preClone.querySelector('code');
            if (newCodeElement) {
              try {
                Prism.highlightElement(newCodeElement);
              } catch (error) {
                console.warn('Error highlighting code element:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error enhancing code block:', error);
        }
      });
    };
    
    // Load Prism and all needed language components
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
        
        // Process code blocks
        processCodeBlocks(Prism.default);
      } catch (error) {
        console.error('Error loading Prism or languages:', error);
      }
    };
    
    // Run with a slight delay to ensure DOM is fully updated
    const timeoutId = setTimeout(() => {
      loadPrism();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);
  
  // Toggle streaming mode
  const toggleStreaming = () => {
    setUseStreaming(!useStreaming);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <OptimizationHeader toggleStreaming={toggleStreaming} useStreaming={useStreaming} />
      
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-4">
        <div className="flex items-center mb-4">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-white mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 14-4 4v-6h2" />
              <path d="M15 13v2" />
              <path d="M18 15v5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Performance & Security Optimizer</h1>
        </div>
        
        <Card className="flex-1 flex flex-col shadow-md border-primary/10">
          <MessageList 
            messages={messages} 
            isTyping={isTyping} 
            messagesEndRef={messagesEndRef}
            saveResponse={saveResponse}
          />
          
          <Separator />
          
          <div className="p-4">
            <MessageInput 
              newMessage={newMessage} 
              setNewMessage={setNewMessage} 
              sendMessage={sendMessage}
              isTyping={isTyping} 
            />
          </div>
        </Card>
      </main>
    </div>
  );
}