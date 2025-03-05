import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CodeBlock } from "@/components/ui/code-block";

interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export default function SimpleChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Function to send a message to the API
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString()
    };

    // Add user message to the list
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    setInputMessage('');
    
    // Set loading state
    setIsLoading(true);

    try {
      // Get the conversation history in the format the API expects
      const conversationHistory = messages.map(msg => ({
        sender: msg.sender,
        content: msg.content
      }));

      // Send the message to the API
      const response = await fetch('/api/simple-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to get response');
      }

      const data = await response.json();

      // Add AI response to the messages
      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        content: data.response,
        timestamp: data.timestamp || new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Function to format message content with code blocks
  const formatMessageContent = (content: string) => {
    // Check if the content contains code blocks (markdown style)
    if (content.includes('```')) {
      const parts = content.split(/(```(?:[\w-]+)?\n[\s\S]*?\n```)/g);
      
      return parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Extract language and code
          const match = part.match(/```([\w-]+)?\n([\s\S]*?)\n```/);
          if (match) {
            const language = match[1] || 'javascript';
            const code = match[2];
            return <CodeBlock key={index} language={language} code={code} />;
          }
        }
        
        // Regular text parts - split by double newlines for better formatting
        return part.split('\n\n').map((paragraph, pIndex) => (
          <p key={`${index}-${pIndex}`} className="mb-2">
            {paragraph}
          </p>
        ));
      });
    }
    
    // If no code blocks, just return the text with paragraph breaks
    return content.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-2">{paragraph}</p>
    ));
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-center">Simple Chat</CardTitle>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              <p>No messages yet. Start a conversation!</p>
              <p className="mt-2 text-sm">Try asking something like:</p>
              <ul className="mt-2 text-sm list-disc list-inside">
                <li>How do I create a React component?</li>
                <li>Explain async/await in JavaScript</li>
                <li>What's the difference between let and const?</li>
              </ul>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <div className="prose">
                    {formatMessageContent(message.content)}
                  </div>
                  <div className="text-xs mt-2 opacity-70">
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-4 bg-secondary text-secondary-foreground">
                <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <div className="flex w-full space-x-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="flex-grow resize-none"
              disabled={isLoading}
              rows={1}
            />
            <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}>
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}