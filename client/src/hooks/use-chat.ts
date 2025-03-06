import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Message, SavedResponse } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';
import { mockSavedResponses } from "@/lib/mock-data";
import { formatAIResponse } from '@/lib/markdown';

export function useChat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now() + 300, // Add offset to ensure uniqueness
      sender: 'ai',
      content: 'Hi there! I\'m your AI Code Buddy. How can I help with your coding challenges today?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const [streamingResponse, setStreamingResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // Active chat session state
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  // Fetch chat sessions
  const { data: chatSessions = [], refetch: refetchChatSessions } = useQuery<any[]>({
    queryKey: ["/api/chat-sessions"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/chat-sessions");
        return await response.json();
      } catch (error) {
        console.error("Error fetching chat sessions:", error);
        return [];
      }
    },
    // Disable for now until authentication is enabled
    enabled: false
  });
  
  // Fetch saved responses
  const { data: savedResponses = [], refetch: refetchSavedResponses } = useQuery<SavedResponse[]>({
    queryKey: ["/api/saved-responses"],
    queryFn: async () => {
      // In a real implementation, this would fetch from the API
      return mockSavedResponses;
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string; conversationHistory: Message[] }) => {
      // Call the real API endpoint
      const response = await apiRequest("POST", "/api/chat", {
        message: messageData.message,
        conversationHistory: messageData.conversationHistory,
        sessionId: currentSessionId
      });
      
      const data = await response.json();
      
      // If this created a new session, update our session ID
      if (data.sessionId && currentSessionId === null) {
        setCurrentSessionId(data.sessionId);
        // Refresh sessions list
        refetchChatSessions();
      }
      
      return data.response;
    },
    onSuccess: (response) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 150, // Add offset to ensure uniqueness
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
          id: Date.now() + 200, // Add offset to ensure uniqueness
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
      
      // Find the most recent user message before this AI message
      const userMessages = messages.filter(m => m.sender === 'user');
      const questionMessage = userMessages.length > 0 ? 
        userMessages[userMessages.length - 1] : 
        undefined;
      
      // In a real implementation, this would send to the API
      const savedResponse: SavedResponse = {
        id: Date.now() + 400, // Add offset to ensure uniqueness
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

  // Handle streaming response
  const handleStreamedResponse = async (userQuestion: string, conversationHistory: Message[]) => {
    try {
      // Clean up any existing EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // Create a placeholder message for the streaming response
      // Use a timestamp with a small delay to ensure it's different from the user message ID
      const newMessageId = Date.now() + 100;
      
      // Add this placeholder message for AI response
      setMessages(prev => [
        ...prev,
        {
          id: newMessageId,
          sender: 'ai',
          content: '',
          timestamp: new Date().toLocaleTimeString(),
          html: ''
        }
      ]);
      
      // Reset streaming response
      setStreamingResponse('');
      
      // Prepare the request
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userQuestion,
          conversationHistory,
          sessionId: currentSessionId
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get the response as a stream
      const reader = response.body!.getReader();
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
                updateStreamingMessage(newMessageId, completeResponse);
              } else if (jsonData.done && jsonData.fullResponse) {
                // Final response received
                completeResponse = jsonData.fullResponse;
                setStreamingResponse(completeResponse);
                
                // Update message with complete response
                updateStreamingMessage(newMessageId, completeResponse);
                setIsTyping(false);
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
          id: Date.now() + 200, // Add offset to ensure uniqueness
          sender: 'ai',
          content: "I'm sorry, I'm having trouble connecting to my AI service. Please try again in a moment.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  };

  // Helper function to update streaming message
  const updateStreamingMessage = (messageId: number, content: string) => {
    setMessages(prev => {
      const aiMessageIndex = prev.findIndex(msg => msg.id === messageId);
      
      if (aiMessageIndex !== -1) {
        const updatedMessages = [...prev];
        updatedMessages[aiMessageIndex] = {
          ...updatedMessages[aiMessageIndex],
          content: content,
          html: formatAIResponse(content)
        };
        return updatedMessages;
      }
      
      return prev;
    });
  };

  // Send a message
  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newMessage.trim() === '' || isTyping) return;
    
    const userQuestion = newMessage;
    setNewMessage('');
    setIsTyping(true);
    
    // Get current messages for conversation history
    const conversationHistory = messages;
    
    // Add user message with a unique timestamp-based ID
    const userMessageId = Date.now();
    await new Promise<void>(resolve => {
      setMessages(prev => {
        const updatedMessages = [
          ...prev, 
          {
            id: userMessageId,
            sender: 'user' as const,
            content: userQuestion,
            timestamp: new Date().toLocaleTimeString()
          }
        ];
        
        setTimeout(resolve, 0);
        return updatedMessages;
      });
    });
    
    // Use appropriate API based on streaming setting
    if (useStreaming) {
      await handleStreamedResponse(userQuestion, conversationHistory);
    } else {
      await sendMessageMutation.mutateAsync({
        message: userQuestion,
        conversationHistory
      });
    }
  };

  // Save a response
  const saveResponse = (messageId: number) => {
    saveResponseMutation.mutate(messageId);
  };
  
  // Load chat session
  const loadChatSession = async (sessionId: number) => {
    try {
      setCurrentSessionId(sessionId);
      
      // Fetch messages for this session
      const response = await apiRequest("GET", `/api/chat-sessions/${sessionId}/messages`);
      const messagesData = await response.json();
      
      // Convert backend messages to UI format with unique IDs
      const formattedMessages: Message[] = messagesData.map((msg: any, index: number) => ({
        id: Date.now() + index * 10, // Use timestamp + index*10 for uniqueness
        sender: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()).toLocaleTimeString(),
        html: msg.role === 'assistant' ? formatAIResponse(msg.content) : undefined
      }));
      
      // Add default welcome message if empty
      if (formattedMessages.length === 0) {
        formattedMessages.push({
          id: Date.now() + 300, // Add offset to ensure uniqueness
          sender: 'ai',
          content: 'Hi there! I\'m your AI Code Buddy. How can I help with your coding challenges today?',
          timestamp: new Date().toLocaleTimeString()
        });
      }
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading chat session:", error);
      toast({
        title: "Error",
        description: "Failed to load chat session. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Create new chat session
  const createNewSession = () => {
    setCurrentSessionId(null);
    setMessages([{
      id: Date.now() + 300, // Add offset to ensure uniqueness
      sender: 'ai',
      content: 'Hi there! I\'m your AI Code Buddy. How can I help with your coding challenges today?',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  // Clean up any active connections when component unmounts
  const cleanup = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  return {
    messages,
    newMessage,
    setNewMessage,
    isTyping,
    useStreaming,
    setUseStreaming,
    messagesEndRef,
    chatSessions,
    savedResponses,
    currentSessionId,
    sendMessage,
    saveResponse,
    loadChatSession,
    createNewSession,
    cleanup
  };
} 