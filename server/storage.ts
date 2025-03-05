import { users, type User, type InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

// Storage interface with required methods
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  sessionStore: session.SessionStore;
}

// Memory-based storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    
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

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

// Export a singleton instance of the storage
export const storage = new MemStorage();
