import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat queries model
export const chatQueries = pgTable("chat_queries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  query: text("query").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// AI responses model
export const aiResponses = pgTable("ai_responses", {
  id: serial("id").primaryKey(),
  queryId: integer("query_id").references(() => chatQueries.id).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isSaved: boolean("is_saved").default(false).notNull(),
});

// Chat sessions model - stores a group of related messages
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(), // Auto-generated title based on first message
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Optional metadata like device info, IP, etc.
  metadata: json("metadata"),
});

// Chat messages model - stores individual messages in a session
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatSessions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sender: text("sender").notNull(), // 'user' or 'ai'
  content: text("content").notNull(),
  contentHtml: text("content_html"), // Formatted HTML content for AI responses
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: json("metadata"), // Optional metadata like tokens used, model version, etc.
});

// Skill progress model
export const skillProgress = pgTable("skill_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  skillName: text("skill_name").notNull(),
  progress: integer("progress").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Course progress model
export const courseProgress = pgTable("course_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseTitle: text("course_title").notNull(),
  progress: integer("progress").notNull(),
  completedLessons: integer("completed_lessons").notNull(),
  totalLessons: integer("total_lessons").notNull(),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
});

// Schema validation for user registration/insertion
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Schema validation for chat query
export const insertChatQuerySchema = createInsertSchema(chatQueries).pick({
  userId: true,
  query: true,
});

// Schema validation for AI response
export const insertAiResponseSchema = createInsertSchema(aiResponses).pick({
  queryId: true,
  content: true,
  isSaved: true,
});

// Schema validation for chat session
export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  userId: true,
  title: true,
  metadata: true,
});

// Schema validation for chat message
export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  userId: true,
  sender: true,
  content: true,
  contentHtml: true,
  metadata: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ChatQuery = typeof chatQueries.$inferSelect;
export type AiResponse = typeof aiResponses.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type SkillProgress = typeof skillProgress.$inferSelect;
export type CourseProgress = typeof courseProgress.$inferSelect;

// Chat session with preview message (used in listings)
export type ChatSessionWithPreview = ChatSession & {
  latestMessage: ChatMessage | null;
};
