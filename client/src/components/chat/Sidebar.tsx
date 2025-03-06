import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SavedResponse } from "@/types/chat";

interface SidebarProps {
  chatSessions: any[];
  savedResponses: SavedResponse[];
  currentSessionId: number | null;
  loadChatSession: (sessionId: number) => Promise<void>;
  createNewSession: () => void;
}

export default function Sidebar({
  chatSessions,
  savedResponses,
  currentSessionId,
  loadChatSession,
  createNewSession
}: SidebarProps) {
  return (
    <div className="hidden lg:block w-80 border-l bg-card overflow-y-auto">
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sessions">Chat History</TabsTrigger>
          <TabsTrigger value="saved">Saved Responses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sessions" className="m-0">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-semibold">Chat Sessions</h3>
            <Button 
              onClick={createNewSession}
              size="sm" 
              variant="ghost" 
              className="h-8 px-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New Chat
            </Button>
          </div>
          
          <ScrollArea className="h-[calc(100vh-157px)]">
            <div className="p-2 space-y-2">
              {chatSessions.length === 0 ? (
                <EmptyChatSessions />
              ) : (
                <div className="space-y-1">
                  {chatSessions.map((session) => (
                    <ChatSessionItem 
                      key={session.id}
                      session={session}
                      isActive={currentSessionId === session.id}
                      onClick={() => loadChatSession(session.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="saved" className="m-0">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Saved Responses</h3>
          </div>
          
          <ScrollArea className="h-[calc(100vh-157px)]">
            <div className="p-4">
              {savedResponses.length === 0 ? (
                <EmptySavedResponses />
              ) : (
                <div className="space-y-4">
                  {savedResponses.map((response) => (
                    <SavedResponseItem key={response.id} response={response} />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChatSessionItem({ 
  session, 
  isActive, 
  onClick 
}: { 
  session: any; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-2 text-left rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
        isActive 
          ? 'bg-primary/10 dark:bg-primary/20 border-l-2 border-primary' 
          : ''
      }`}
    >
      <div className="flex items-start">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-2 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <div className="overflow-hidden flex-1">
          <p className="font-medium text-sm truncate">{session.title || 'New Chat'}</p>
          <p className="text-xs text-muted-foreground truncate">
            {session.latestMessage?.content?.substring(0, 40) || 'Start chatting...'}
            {session.latestMessage?.content?.length > 40 ? '...' : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(session.updatedAt || session.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </button>
  );
}

function SavedResponseItem({ response }: { response: SavedResponse }) {
  return (
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
  );
}

function EmptyChatSessions() {
  return (
    <div className="text-center py-8">
      <div className="h-14 w-14 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="8" y1="12" x2="16" y2="12"></line>
          <line x1="8" y1="16" x2="16" y2="16"></line>
          <line x1="8" y1="8" x2="10" y2="8"></line>
        </svg>
      </div>
      <p className="text-muted-foreground text-sm px-4">
        Start a new conversation to build your chat history.
      </p>
    </div>
  );
}

function EmptySavedResponses() {
  return (
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
  );
} 