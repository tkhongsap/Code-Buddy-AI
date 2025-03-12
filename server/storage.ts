import { 
  type User, 
  type InsertUser, 
  type ChatSession, 
  type InsertChatSession, 
  type ChatMessage, 
  type InsertChatMessage, 
  type ChatSessionWithPreview,
  type SkillProgress
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { dbStorage } from "./db";
import { log } from "./vite";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  // Chat history methods
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: number): Promise<ChatSession | undefined>;
  getUserChatSessions(userId: number): Promise<ChatSession[]>;
  updateChatSessionTitle(id: number, title: string): Promise<ChatSession | undefined>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: number): Promise<ChatMessage[]>;
  getChatSessionsWithPreview(userId: number, limit?: number): Promise<ChatSessionWithPreview[]>;
  // Skill progress methods
  getUserSkills(userId: number): Promise<SkillProgress[]>;
  updateUserSkill(userId: number, skillName: string, progress: number): Promise<SkillProgress>;
  sessionStore: any; // Using any for session store to avoid typing issues
}

// Memory-based storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chatSessions: Map<number, ChatSession>;
  private chatMessages: Map<number, ChatMessage>;
  private skills: Map<string, SkillProgress>; // Map with key as userId-skillName
  currentUserId: number;
  currentSessionId: number;
  currentMessageId: number;
  currentSkillId: number;
  sessionStore: any; // Using any for session store to avoid typing issues

  constructor() {
    this.users = new Map();
    this.chatSessions = new Map();
    this.chatMessages = new Map();
    this.skills = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentMessageId = 1;
    this.currentSkillId = 1;
    
    // Initialize session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions every 24h
    });
    
    // Add some seed users for demo purposes
    this.seedUsers();
  }

  private async seedUsers() {
    // Only seed if no users exist
    if (this.users.size === 0) {
      await this.createUser({
        username: "demo",
        password: "7f1e21f25619a03aae7bdbcf7903ed89e56f5375c19e6fee44322cb021df1a30.e9e6d29a2bfe2064", // "password"
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  // Chat session methods
  async createChatSession(sessionData: InsertChatSession): Promise<ChatSession> {
    const id = this.currentSessionId++;
    const now = new Date();
    const session: ChatSession = {
      ...sessionData,
      id,
      createdAt: now,
      updatedAt: now,
      metadata: sessionData.metadata || {}
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    return this.chatSessions.get(id);
  }

  async getUserChatSessions(userId: number): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values())
      .filter(session => session.userId === userId);
  }

  async updateChatSessionTitle(id: number, title: string): Promise<ChatSession | undefined> {
    const session = this.chatSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = {
      ...session,
      title,
      updatedAt: new Date()
    };
    this.chatSessions.set(id, updatedSession);
    return updatedSession;
  }

  // Chat message methods
  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentMessageId++;
    const now = new Date();
    const message: ChatMessage = {
      ...messageData,
      id,
      timestamp: now,
      contentHtml: messageData.contentHtml || null,
      metadata: messageData.metadata || {}
    };
    this.chatMessages.set(id, message);
    
    // Also update the session's updatedAt time
    const session = await this.getChatSession(messageData.sessionId);
    if (session) {
      await this.updateChatSessionTitle(session.id, session.title);
    }
    
    return message;
  }

  async getChatMessages(sessionId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getChatSessionsWithPreview(userId: number, limit: number = 10): Promise<ChatSessionWithPreview[]> {
    const sessions = await this.getUserChatSessions(userId);
    
    const result: ChatSessionWithPreview[] = [];
    for (const session of sessions) {
      const messages = await this.getChatMessages(session.id);
      const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      
      result.push({
        ...session,
        latestMessage
      });
    }
    
    // Sort by updatedAt descending and limit results
    return result
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  // Skill progress methods
  async getUserSkills(userId: number): Promise<SkillProgress[]> {
    // Filter skills by userId
    return Array.from(this.skills.values())
      .filter(skill => skill.userId === userId);
  }

  async updateUserSkill(userId: number, skillName: string, progress: number): Promise<SkillProgress> {
    const key = `${userId}-${skillName}`;
    const existingSkill = this.skills.get(key);
    const now = new Date();
    
    if (existingSkill) {
      // Update existing skill
      const updatedSkill: SkillProgress = {
        ...existingSkill,
        progress,
        lastUpdated: now
      };
      this.skills.set(key, updatedSkill);
      return updatedSkill;
    } else {
      // Create new skill
      const newSkill: SkillProgress = {
        id: this.currentSkillId++,
        userId,
        skillName,
        progress,
        lastUpdated: now
      };
      this.skills.set(key, newSkill);
      return newSkill;
    }
  }
}

// Try to determine if we should use PostgreSQL or in-memory storage
const useDatabase = !!process.env.DATABASE_URL;

// Export the appropriate storage implementation
let storage: IStorage;

if (useDatabase) {
  log("Using PostgreSQL database for storage", "storage");
  storage = dbStorage;
} else {
  log("Using in-memory storage (no database connection found)", "storage");
  storage = new MemStorage();
}

export { storage };
