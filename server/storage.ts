import { profiles, categories, timerSessions, type UserProfile, type InsertProfile, type Category, type InsertCategory, type TimerSession, type InsertTimerSession } from "@shared/schema";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// // Initialize Supabase client for storage interactions
// const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL; // Or process.env.SUPABASE_URL
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
// console.log(supabaseUrl, supabaseServiceKey);
// if (!supabaseUrl || !supabaseServiceKey) {
//   console.error("Missing Supabase URL or Service Key in environment variables for storage.");
//   throw new Error("Supabase configuration missing for storage");
// }

// Storage interface with all CRUD methods needed for the application
export interface IStorage {
  // User methods
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  getUserProfileByEmail(email: string): Promise<UserProfile | undefined>;
  createProfile(profile: InsertProfile): Promise<UserProfile>;
  updateUserSubscription(userId: string, is_subscribed: boolean): Promise<UserProfile>;
  updateUserStripeInfo(userId: string, stripeInfo: { customerId: string, subscriptionId: string, markAsSubscribed?: boolean }): Promise<UserProfile>;
  updateUserPreferences(userId: string, preferences: any): Promise<UserProfile>;

  // Category methods
  getCategories(userId: string): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Timer session methods
  getTimerSessions(userId: string, limit?: number): Promise<TimerSession[]>;
  getTimerSessionsByCategory(userId: string, categoryId: number): Promise<TimerSession[]>;
  createTimerSession(session: InsertTimerSession): Promise<TimerSession>;
  updateTimerSession(id: number, data: Partial<TimerSession>): Promise<TimerSession>;
  getTimerSessionsAnalytics(userId: string): Promise<any>;
}

// SupabaseStorage class implementing IStorage using Supabase SDK
export class SupabaseStorage implements IStorage {
  private supabase: SupabaseClient;

  constructor() {
    // Initialize Supabase client in the constructor
    const url = process.env.VITE_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error("Supabase URL or Service Key missing in env for SupabaseStorage");
    }
    this.supabase = createClient(url, key, { db: { schema: 'public' } });
    // No in-memory data needed anymore
  }

  // --- User Profile Methods ---
  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as UserProfile | undefined;
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      throw error; // Re-throw or return undefined based on desired error handling
    }
  }

  async getUserProfileByEmail(email: string): Promise<UserProfile | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (error) throw error;
      return data as UserProfile | undefined;
    } catch (error) {
      console.error("Error in getUserProfileByEmail:", error);
      throw error;
    }
  }

  async createProfile(profile: InsertProfile): Promise<UserProfile> {
    const profileData = {
      id: profile.id,
      email: profile.email,
      is_subscribed: false,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      preferences: { theme: 'system', accentColor: '#FF5252', soundNotifications: true, browserNotifications: true },
    };
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error("Failed to create profile.");
      return data as UserProfile;
    } catch (error) {
      console.error("Error in createProfile:", error);
      throw error;
    }
  }

  async updateUserSubscription(userId: string, is_subscribed: boolean): Promise<UserProfile> {
    try {
      console.log("Updating user subscription status...");
      const { data: { user } } = await this.supabase.from('profiles').select('*').eq('id', userId).single();
      console.log("User data:", user);
      const { data, error } = await this.supabase
        .from('profiles')
        .update({ is_subscribed: is_subscribed })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error("Profile not found for subscription update.");
      return data as UserProfile;
    } catch (error) {
      console.error("Error in updateUserSubscription:", error);
      throw error;
    }
  }

  async updateUserStripeInfo(userId: string, stripeInfo: { customerId: string, subscriptionId: string, markAsSubscribed?: boolean }): Promise<UserProfile> {
    try {
      const updateData: Partial<UserProfile> = {
        stripe_customer_id: stripeInfo.customerId,
        stripe_subscription_id: stripeInfo.subscriptionId,
      };
      if (stripeInfo.markAsSubscribed === true) updateData.is_subscribed = true;
      else if (stripeInfo.markAsSubscribed === false) updateData.is_subscribed = false;

      const { data, error } = await this.supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error("Profile not found for Stripe info update.");
      return data as UserProfile;
    } catch (error) {
      console.error("Error in updateUserStripeInfo:", error);
      throw error;
    }
  }

  async updateUserPreferences(userId: string, preferences: any): Promise<UserProfile> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({ preferences: preferences })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error("Profile not found for preferences update.");
      return data as UserProfile;
    } catch (error) {
      console.error("Error in updateUserPreferences:", error);
      throw error;
    }
  }

  // --- Category Methods ---
  async getCategories(userId: string): Promise<Category[]> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${userId}, is_preset.is.true`);
      if (error) throw error;
      return data as Category[];
    } catch (error) {
      console.error("Error in getCategories:", error);
      return []; // Return empty array on error
    }
  }

  async getCategory(id: number): Promise<Category | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Category | undefined;
    } catch (error) {
      console.error("Error in getCategory:", error);
      return undefined;
    }
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      const categoryData = { ...category }; // id and createdAt are auto-generated by DB
      const { data, error } = await this.supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error("Failed to create category.");
      return data as Category;
    } catch (error) {
      console.error("Error in createCategory:", error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Error in deleteCategory:", error);
      throw error;
    }
  }

  // --- Timer Session Methods ---
  async getTimerSessions(userId: string, limit?: number): Promise<TimerSession[]> {
    try {
      let query = this.supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data as TimerSession[];
    } catch (error) {
      console.error("Error in getTimerSessions:", error);
      return [];
    }
  }

  async getTimerSessionsByCategory(userId: string, categoryId: number): Promise<TimerSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('category_id', categoryId)
        .order('start_time', { ascending: false });
      if (error) throw error;
      return data as TimerSession[];
    } catch (error) {
      console.error("Error in getTimerSessionsByCategory:", error);
      return [];
    }
  }

  async createTimerSession(session: InsertTimerSession): Promise<TimerSession> {
    try {
      const sessionData = { ...session, completed: false, end_time: null, pomodoro_data: session.pomodoro_data ?? null };
      const { data, error } = await this.supabase
        .from('timer_sessions')
        .insert(sessionData)
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error("Failed to create timer session.");
      return data as TimerSession;
    } catch (error) {
      console.error("Error in createTimerSession:", error);
      throw error;
    }
  }

  async updateTimerSession(id: number, updateData: Partial<TimerSession>): Promise<TimerSession> {
    try {
      const { user_id, ...restOfUpdateData } = updateData; // Prevent userId update
      const { data, error } = await this.supabase
        .from('timer_sessions')
        .update(restOfUpdateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error("Timer session not found for update.");
      return data as TimerSession;
    } catch (error) {
      console.error("Error in updateTimerSession:", error);
      throw error;
    }
  }

  async getTimerSessionsAnalytics(userId: string): Promise<any> {
    // Fetch sessions and categories directly from Supabase
    const sessions = await this.getTimerSessions(userId);
    const categories = await this.getCategories(userId);

    // --- Analytics calculation logic remains the same ---
    const timeByCategory = categories.map(category => {
      const categoryTime = sessions
        .filter(session => session.category_id === category.id)
        .reduce((total, session) => total + session.duration, 0);
      return { id: category.id, name: category.name, color: category.color, totalTime: categoryTime, percentage: 0 };
    });
    const totalTime = timeByCategory.reduce((sum, cat) => sum + cat.totalTime, 0);
    if (totalTime > 0) {
      timeByCategory.forEach(cat => { cat.percentage = (cat.totalTime / totalTime) * 100; });
    }
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeByDayOfWeek = daysOfWeek.map(day => {
      const dayIndex = daysOfWeek.indexOf(day);
      const dayTime = sessions
        .filter(session => {
          // Parse the timestamp string into a Date object
          const sessionDate = new Date(session.start_time);
          return sessionDate.getDay() === dayIndex;
        })
        .reduce((total, session) => total + session.duration, 0);
      return { day, totalTime: dayTime };
    });
    return { totalTime, timeByCategory, timeByDayOfWeek, sessionsCount: sessions.length };
  }
}

// Export the instance of SupabaseStorage
export const storage = new SupabaseStorage();
