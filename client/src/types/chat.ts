export type MessageSender = 'user' | 'ai';

export interface Message {
  id: number;
  sender: MessageSender;
  content: string;
  timestamp: string;
  html?: string;
}

export interface SavedResponse {
  id: number;
  content: string;
  timestamp: string;
  question: string;
}

export interface ChatSession {
  id: number;
  title?: string;
  createdAt: string;
  updatedAt?: string;
  latestMessage?: {
    content: string;
  };
} 