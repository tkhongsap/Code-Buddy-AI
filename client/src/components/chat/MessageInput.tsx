import { FormEvent, KeyboardEvent, useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: (e?: FormEvent) => Promise<void>;
  isTyping: boolean;
}

export default function MessageInput({ 
  newMessage, 
  setNewMessage, 
  sendMessage, 
  isTyping 
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lastKey, setLastKey] = useState<string>('');
  
  // Auto-adjust height of textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to avoid constant growth
      textareaRef.current.style.height = 'auto';
      // Set the height to the scroll height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  // A direct approach to handle text input ourselves
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  };
  
  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setLastKey(e.key + (e.shiftKey ? '+shift' : ''));
    
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Let the default behavior happen (new line)
        return; 
      } else {
        e.preventDefault();
        if (newMessage.trim()) {
          sendMessage();
        }
      }
    }
  };

  return (
    <div className="border-t bg-card p-4">
      <form onSubmit={(e) => {
        e.preventDefault();
        sendMessage();
      }} className="flex items-start space-x-2">
        <Textarea
          ref={textareaRef}
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask a coding question... (Shift+Enter for new line)" 
          className="flex-1 min-h-[60px] resize-none py-3 whitespace-pre-wrap"
          disabled={isTyping}
          rows={1}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="h-10 w-10 self-start mt-1" 
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
  );
} 