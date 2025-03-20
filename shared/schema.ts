import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table with authentication and subscription information
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  isSubscribed: boolean("is_subscribed").default(false).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  preferences: json("preferences").$type<{
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    soundNotifications: boolean;
    browserNotifications: boolean;
  }>(),
});

// Timer categories - can be preset or user-defined
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  isPreset: boolean("is_preset").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Timer session records for analytics and history
export const timerSessions = pgTable("timer_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  timerType: text("timer_type").notNull(), // countdown, stopwatch, pomodoro
  duration: integer("duration").notNull(), // seconds
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  pomodoroData: json("pomodoro_data").$type<{
    workMinutes: number;
    breakMinutes: number;
    cycles: number;
    completedCycles: number;
  }>(),
  completed: boolean("completed").default(false).notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  userId: true,
  name: true,
  color: true,
  isPreset: true,
});

export const insertTimerSessionSchema = createInsertSchema(timerSessions).pick({
  userId: true,
  categoryId: true,
  timerType: true,
  duration: true,
  startTime: true,
  pomodoroData: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type TimerSession = typeof timerSessions.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertTimerSession = z.infer<typeof insertTimerSessionSchema>;

// Extended schemas for validation
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email address"),
});

export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  accentColor: z.string(),
  soundNotifications: z.boolean(),
  browserNotifications: z.boolean(),
});
