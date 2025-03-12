import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Header from "../layout/Header";
import { useTheme } from "@/hooks/use-theme";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { marked } from 'marked';
import * as DOMPurify from 'isomorphic-dompurify';
import 'prismjs/themes/prism-okaidia.css'; // Dark theme with vibrant colors
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import ChatHeader from "./ChatHeader";

interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  html?: string;
}

export default function ChatInterface() {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now(), // Use timestamp for uniqueness
      sender: 'ai',
      content: 'Hi there! I\'m your AI Code Buddy. How can I help with your coding challenges today?',
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
        description: "Failed to communicate with AI service. Please try again.",
        variant: "destructive",
      });

      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(), // Use timestamp for uniqueness
          sender: 'ai',
          content: "I'm sorry, I'm having trouble connecting to my AI service. Please try again in a moment.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  });

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
        conversationHistory: conversationHistory
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
                // Using a safer approach that won't modify user messages
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
                // Using the same safer approach
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
        description: "Failed to communicate with AI service. Please try again.",
        variant: "destructive",
      });
      
      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(), // Use timestamp for uniqueness
          sender: 'ai',
          content: "I'm sorry, I'm having trouble connecting to my AI service. Please try again in a moment.",
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

  // Save response function for MessageList component
  const saveResponse = (messageId: number) => {
    toast({
      title: "Feature Notice",
      description: "Saving responses is coming soon!",
      variant: "default",
    });
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

  // Process code blocks after rendering with our unified code formatter
  useEffect(() => {
    // Import dynamically to avoid issues with SSR
    import('@/lib/code-formatter').then(({ enhanceCodeBlocks }) => {
      // Small delay to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        enhanceCodeBlocks('.ai-formatted-message');
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }).catch(error => {
      console.error('Error loading code formatter:', error);
    });
  }, [messages, streamingResponse]); // Run when messages or streaming content changes

  // Toggle streaming mode
  const toggleStreaming = () => {
    setUseStreaming(!useStreaming);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Use the ChatHeader component */}
      <ChatHeader toggleStreaming={toggleStreaming} useStreaming={useStreaming} />
      
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-4">
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