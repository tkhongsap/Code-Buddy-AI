import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import session from "express-session";
import pgSession from "connect-pg-simple";
import { 
  users, 
  chatSessions, 
  chatMessages,
  type User, 
  type InsertUser, 
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type ChatSessionWithPreview
} from "@shared/schema";
import { eq } from 'drizzle-orm';

// Create the PostgreSQL client
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
console.log("Connecting to PostgreSQL with connection string:", connectionString ? "Connection string exists" : "No connection string");

let client;
let db;

try {
  client = postgres(connectionString);
  db = drizzle(client);
  console.log("PostgreSQL connection initialized successfully");
} catch (err) {
  console.error("Failed to initialize PostgreSQL connection:", err);
  // We'll handle the error gracefully by falling back to in-memory storage
}

// Database storage implementation for PostgreSQL
export class DbStorage {
  sessionStore: any;

  constructor() {
    // Initialize session store
    const PgStore = pgSession(session);
    this.sessionStore = new PgStore({
      conString: connectionString,
      createTableIfMissing: true,
      tableName: 'session',
      pruneSessionInterval: 60 * 15, // 15 minutes
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Chat session methods
  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const result = await db.insert(chatSessions).values(session).returning();
    return result[0];
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    const result = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserChatSessions(userId: number): Promise<ChatSession[]> {
    return await db.select().from(chatSessions).where(eq(chatSessions.userId, userId));
  }

  async updateChatSessionTitle(id: number, title: string): Promise<ChatSession | undefined> {
    const result = await db.update(chatSessions)
      .set({ title, updatedAt: new Date() })
      .where(eq(chatSessions.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  // Chat message methods
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  async getChatMessages(sessionId: number): Promise<ChatMessage[]> {
    return await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.timestamp);
  }

  // Get multiple chat sessions with their latest message
  async getChatSessionsWithPreview(userId: number, limit: number = 10): Promise<ChatSessionWithPreview[]> {
    // This would require a more complex query with a join
    // For simplicity, we'll get sessions and messages separately and join them in memory
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
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }
}

// Export a singleton instance of the storage
export const dbStorage = new DbStorage();