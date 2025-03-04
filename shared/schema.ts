import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ChatQuery = typeof chatQueries.$inferSelect;
export type AiResponse = typeof aiResponses.$inferSelect;
export type SkillProgress = typeof skillProgress.$inferSelect;
export type CourseProgress = typeof courseProgress.$inferSelect;
