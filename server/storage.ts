import { users, categories, timerSessions, type User, type InsertUser, type Category, type InsertCategory, type TimerSession, type InsertTimerSession } from "@shared/schema";

// Storage interface with all CRUD methods needed for the application
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(userId: number, isSubscribed: boolean): Promise<User>;
  updateUserStripeInfo(userId: number, stripeInfo: { customerId: string, subscriptionId: string, markAsSubscribed?: boolean }): Promise<User>;
  updateUserPreferences(userId: number, preferences: any): Promise<User>;
  
  // Category methods
  getCategories(userId: number): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  
  // Timer session methods
  getTimerSessions(userId: number, limit?: number): Promise<TimerSession[]>;
  getTimerSessionsByCategory(userId: number, categoryId: number): Promise<TimerSession[]>;
  createTimerSession(session: InsertTimerSession): Promise<TimerSession>;
  updateTimerSession(id: number, data: Partial<TimerSession>): Promise<TimerSession>;
  getTimerSessionsAnalytics(userId: number): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private timerSessions: Map<number, TimerSession>;
  private currentUserId: number;
  private currentCategoryId: number;
  private currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.timerSessions = new Map();
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentSessionId = 1;
    
    // Add default categories
    const defaultCategories = [
      { id: this.currentCategoryId++, userId: 0, name: 'Work', color: '#FF5252', isPreset: true, createdAt: new Date() },
      { id: this.currentCategoryId++, userId: 0, name: 'Study', color: '#2196F3', isPreset: true, createdAt: new Date() },
      { id: this.currentCategoryId++, userId: 0, name: 'Exercise', color: '#4CAF50', isPreset: true, createdAt: new Date() },
      { id: this.currentCategoryId++, userId: 0, name: 'Break', color: '#FFC107', isPreset: true, createdAt: new Date() }
    ];
    
    defaultCategories.forEach(category => {
      this.categories.set(category.id, category as Category);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const preferences = {
      theme: 'system' as 'light' | 'dark' | 'system',
      accentColor: '#FF5252',
      soundNotifications: true,
      browserNotifications: true
    };
    
    const user: User = { 
      ...insertUser, 
      id, 
      isSubscribed: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date(),
      preferences
    };
    
    this.users.set(id, user);
    
    // Create default categories for the user
    const defaultCategories = Array.from(this.categories.values())
      .filter(category => category.isPreset)
      .map(category => ({
        ...category,
        id: this.currentCategoryId++,
        userId: id
      }));
      
    defaultCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
    
    return user;
  }

  async updateUserSubscription(userId: number, isSubscribed: boolean): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, isSubscribed };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(
    userId: number, 
    stripeInfo: { 
      customerId: string, 
      subscriptionId: string, 
      markAsSubscribed?: boolean 
    }
  ): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { 
      ...user, 
      stripeCustomerId: stripeInfo.customerId,
      stripeSubscriptionId: stripeInfo.subscriptionId,
      // Only mark as subscribed if explicitly requested (for completed payments)
      isSubscribed: stripeInfo.markAsSubscribed === false ? false : true
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserPreferences(userId: number, preferences: any): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { 
      ...user, 
      preferences: {
        ...user.preferences,
        ...preferences
      }
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Category methods
  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      category => category.userId === userId || category.userId === 0
    );
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const newCategory: Category = { 
      ...category, 
      id, 
      createdAt: new Date(),
      // Ensure isPreset is a boolean (not undefined)
      isPreset: category.isPreset ?? false
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    this.categories.delete(id);
  }

  // Timer session methods
  async getTimerSessions(userId: number, limit?: number): Promise<TimerSession[]> {
    const sessions = Array.from(this.timerSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    return limit ? sessions.slice(0, limit) : sessions;
  }

  async getTimerSessionsByCategory(userId: number, categoryId: number): Promise<TimerSession[]> {
    return Array.from(this.timerSessions.values())
      .filter(session => session.userId === userId && session.categoryId === categoryId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async createTimerSession(session: InsertTimerSession): Promise<TimerSession> {
    const id = this.currentSessionId++;
    const newSession: TimerSession = { 
      ...session, 
      id,
      completed: false,
      endTime: null,
      // Ensure pomodoroData is not undefined
      pomodoroData: session.pomodoroData ?? null
    };
    
    this.timerSessions.set(id, newSession);
    return newSession;
  }

  async updateTimerSession(id: number, data: Partial<TimerSession>): Promise<TimerSession> {
    const session = this.timerSessions.get(id);
    if (!session) throw new Error('Timer session not found');
    
    const updatedSession = { ...session, ...data };
    this.timerSessions.set(id, updatedSession);
    return updatedSession;
  }

  async getTimerSessionsAnalytics(userId: number): Promise<any> {
    const sessions = await this.getTimerSessions(userId);
    const categories = await this.getCategories(userId);
    
    // Total time per category
    const timeByCategory = categories.map(category => {
      const categoryTime = sessions
        .filter(session => session.categoryId === category.id)
        .reduce((total, session) => total + session.duration, 0);
      
      return {
        id: category.id,
        name: category.name,
        color: category.color,
        totalTime: categoryTime,
        percentage: 0 // Will calculate after summing all
      };
    });
    
    // Calculate percentages
    const totalTime = timeByCategory.reduce((sum, cat) => sum + cat.totalTime, 0);
    if (totalTime > 0) {
      timeByCategory.forEach(cat => {
        cat.percentage = (cat.totalTime / totalTime) * 100;
      });
    }
    
    // Time per day of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeByDayOfWeek = daysOfWeek.map(day => {
      const dayIndex = daysOfWeek.indexOf(day);
      const dayTime = sessions
        .filter(session => session.startTime.getDay() === dayIndex)
        .reduce((total, session) => total + session.duration, 0);
      
      return {
        day,
        totalTime: dayTime
      };
    });
    
    return {
      totalTime,
      timeByCategory,
      timeByDayOfWeek,
      sessionsCount: sessions.length
    };
  }
}

export const storage = new MemStorage();
