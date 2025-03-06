import { Message } from "@/types/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import MessageItem from "./MessageItem";
import { MutableRefObject } from "react";

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  messagesEndRef: MutableRefObject<HTMLDivElement | null>;
  saveResponse: (messageId: number) => void;
}

export default function MessageList({ 
  messages, 
  isTyping, 
  messagesEndRef, 
  saveResponse 
}: MessageListProps) {
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <MessageItem 
            key={message.id}
            message={message}
            saveResponse={saveResponse}
          />
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
  );
} 