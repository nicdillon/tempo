import { pgTable, text, serial, integer, boolean, timestamp, json, uuid, jsonb } from "drizzle-orm/pg-core"; // Add jsonb and uuid import
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (renamed to 'profiles' to match Supabase convention and avoid conflict with auth.users)
// This table stores additional user information linked to the Supabase auth user.
export const profiles = pgTable("profiles", {
  // Use Supabase Auth user ID (UUID) as the primary key, linking to auth.users
  id: uuid("id").primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }), // Link to auth.users table
  email: text("email"), // Match Supabase: nullable, non-unique in this table
  // Remove password - handled by Supabase Auth
  // password: text("password").notNull(),
  is_subscribed: boolean("is_subscribed").default(false), // Match Supabase: nullable
  stripe_customer_id: text("stripe_customer_id"),
  stripe_subscription_id: text("stripe_subscription_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // Match Supabase type
  preferences: jsonb("preferences").$type<{ // Match Supabase type: jsonb
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    soundNotifications: boolean;
    browserNotifications: boolean;
  }>(),
});

// Define a placeholder for the Supabase auth.users table to establish the foreign key relationship
// Note: Drizzle doesn't manage the actual auth.users table, this is just for relationship definition.
const authUsers = pgTable("users", {
  id: uuid("id").primaryKey(),
}, (table) => {
  return {
    // Define schema for the referenced table if needed, or keep minimal
  };
});


// Timer categories - can be preset or user-defined
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  // userId should reference the profiles table's id (UUID string)
  user_id: uuid("user_id").references(() => profiles.id).notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  is_preset: boolean("is_preset").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // Match Supabase type
});

// Timer session records for analytics and history
export const timerSessions = pgTable("timer_sessions", {
  id: serial("id").primaryKey(),
  // userId should reference the profiles table's id (UUID string)
  user_id: uuid("user_id").references(() => profiles.id).notNull(),
  category_id: integer("category_id").references(() => categories.id).notNull(),
  timer_type: text("timer_type").notNull(), // countdown, stopwatch, pomodoro
  duration: integer("duration").notNull(), // seconds
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time"),
  pomodoro_data: json("pomodoro_data").$type<{
    workMinutes: number;
    breakMinutes: number;
    cycles: number;
    completedCycles: number;
  }>(),
  completed: boolean("completed").default(false).notNull(),
});

// Insert schemas
// Update insertUserSchema to reflect the 'profiles' table and include the 'id' (Supabase UUID)
export const insertProfileSchema = createInsertSchema(profiles).pick({
  id: true, // Include the Supabase User ID
  email: true, // Email is nullable, so not strictly required for insert via pick
  // Add other fields needed when creating a profile, e.g., default preferences
  // preferences: true, // If you want to set preferences on creation
});


export const insertCategorySchema = createInsertSchema(categories).pick({
  // userId should reference the profiles table's id (UUID string)
  user_id: true,
  name: true,
  color: true,
  is_preset: true,
});

export const insertTimerSessionSchema = createInsertSchema(timerSessions).pick({
  user_id: true, // This will now be the UUID string
  category_id: true,
  timer_type: true,
  duration: true,
  start_time: true,
  pomodoro_data: true,
});

// Type exports
export type InsertProfile = z.infer<typeof insertProfileSchema>; // Renamed from InsertUser
export type UserProfile = typeof profiles.$inferSelect; // Renamed from User to avoid confusion with Supabase Auth User
export type Category = typeof categories.$inferSelect;
export type TimerSession = typeof timerSessions.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertTimerSession = z.infer<typeof insertTimerSessionSchema>;

// Extended schemas for validation
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Update registerSchema to potentially include profile fields if needed during registration backend call
// Note: Client-side Supabase signup handles password/email primarily.
// This schema might be used if you have a backend endpoint that creates the profile *after* signup.
export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  // Password is handled by Supabase Auth client-side, not needed here typically
  // password: z.string().min(6, "Password must be at least 6 characters"),
  // Add any other fields needed for profile creation if using a backend endpoint
});

export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  accentColor: z.string(),
  soundNotifications: z.boolean(),
  browserNotifications: z.boolean(),
});
