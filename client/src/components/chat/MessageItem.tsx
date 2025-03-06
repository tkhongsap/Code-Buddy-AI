import { Button } from "@/components/ui/button";
import { Message } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";

interface MessageItemProps {
  message: Message;
  saveResponse: (messageId: number) => void;
}

export default function MessageItem({ message, saveResponse }: MessageItemProps) {
  const { toast } = useToast();
  
  const copyMessage = () => {
    navigator.clipboard.writeText(message.content);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
      duration: 1500,
    });
  };
  
  return (
    <div 
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
            onClick={copyMessage}
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
  );
}