import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, registerSchema } from "@shared/schema";
import { z } from "zod";

// Check for Stripe secret key
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;

// Initialize Stripe if we have the secret key
let stripe: Stripe | undefined;

if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2024-01-24" as any,
  });
} else {
  console.warn("Missing STRIPE_SECRET_KEY - payment features will not work");
}

// Add session type to Express Request
declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<session.SessionData> & {
        userId?: number;
      };
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Subscription middleware
  const requireSubscription = async (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isSubscribed) {
      return res.status(403).json({ message: "Subscription required" });
    }

    next();
  };

  // ===== Auth Routes =====
  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const newUser = await storage.createUser(validatedData);
      
      // Set session to log in the user
      req.session.userId = newUser.id;
      
      // Remove password from response
      const { password, ...userResponse } = newUser;
      
      res.status(201).json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Error registering user" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      if (user.password !== validatedData.password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Remove password from response
      const { password, ...userResponse } = user;
      
      res.json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Error logging in" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.userId = undefined;
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.userId = undefined;
      req.session.save(() => {});
      return res.status(401).json({ message: "User not found" });
    }
    
    // Remove password from response
    const { password, ...userResponse } = user;
    
    res.json(userResponse);
  });

  // ===== Categories Routes =====
  // Get categories
  app.get("/api/categories", requireAuth, async (req, res) => {
    const categories = await storage.getCategories(req.session.userId!);
    res.json(categories);
  });

  // Create category
  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const validatedData = {
        ...req.body,
        userId: req.session.userId
      };
      
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Error creating category" });
    }
  });

  // Delete category
  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await storage.getCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      if (category.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.deleteCategory(categoryId);
      res.json({ message: "Category deleted" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting category" });
    }
  });

  // ===== Timer Sessions Routes =====
  // Get timer sessions (requires subscription)
  app.get("/api/timer-sessions", requireSubscription, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const sessions = await storage.getTimerSessions(req.session.userId!, limit);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching timer sessions" });
    }
  });

  // Create timer session
  app.post("/api/timer-sessions", requireAuth, async (req, res) => {
    try {
      // Check if user is subscribed for persistent storage
      const user = await storage.getUser(req.session.userId!);
      
      if (!user?.isSubscribed) {
        return res.status(403).json({ 
          message: "Subscription required to save timer sessions",
          isSubscriptionRequired: true
        });
      }
      
      const validatedData = {
        ...req.body,
        userId: req.session.userId,
        startTime: new Date()
      };
      
      const session = await storage.createTimerSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ message: "Error creating timer session" });
    }
  });

  // Update timer session (mark as completed)
  app.patch("/api/timer-sessions/:id", requireSubscription, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.updateTimerSession(sessionId, {
        ...req.body,
        endTime: req.body.endTime ? new Date(req.body.endTime) : new Date()
      });
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Error updating timer session" });
    }
  });

  // ===== Analytics Routes =====
  // Get analytics data (requires subscription)
  app.get("/api/analytics", requireSubscription, async (req, res) => {
    try {
      const analytics = await storage.getTimerSessionsAnalytics(req.session.userId!);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Error fetching analytics" });
    }
  });

  // ===== Settings Routes =====
  // Update user preferences
  app.patch("/api/settings", requireAuth, async (req, res) => {
    try {
      const user = await storage.updateUserPreferences(req.session.userId!, req.body);
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Error updating settings" });
    }
  });

  // ===== Stripe Routes =====
  // Create subscription
  app.post("/api/create-subscription", requireAuth, async (req, res) => {
    try {
      if (!stripe || !STRIPE_PRICE_ID) {
        console.error("Stripe not configured - missing keys:", { 
          hasStripe: !!stripe, 
          hasPriceId: !!STRIPE_PRICE_ID
        });
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log("Creating subscription for user:", user.username);
      
      // If user already has a subscription, return it
      if (user.stripeSubscriptionId) {
        console.log("User already has subscription:", user.stripeSubscriptionId);
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        return res.json({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        });
      }
      
      // Create a new customer
      console.log("Creating new Stripe customer with email:", user.email);
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
      });
      
      // Create the subscription
      console.log("Creating subscription with price ID:", STRIPE_PRICE_ID);
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: STRIPE_PRICE_ID,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Update user with Stripe info
      await storage.updateUserStripeInfo(user.id, {
        customerId: customer.id,
        subscriptionId: subscription.id
      });
      
      console.log("Subscription created successfully:", subscription.id);
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Stripe subscription error:", error);
      return res.status(400).json({ 
        message: "Error creating subscription", 
        error: error.message,
        details: error.toString()
      });
    }
  });

  // Webhook for stripe events (subscription status updates)
  app.post("/api/webhook", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }
    
    const payload = req.body;
    const event = payload;
    
    try {
      // Handle the event
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.created':
          // Update user subscription status
          const subscription = event.data.object;
          
          // Find all users
          const users = await Promise.all(
            Array.from({ length: 100 }, (_, i) => i + 1)
              .map(id => storage.getUser(id))
          );
          
          // Find user with matching subscription ID
          const user = users
            .filter(Boolean)
            .find(u => u?.stripeSubscriptionId === subscription.id);
          
          if (user) {
            await storage.updateUserSubscription(
              user.id, 
              subscription.status === 'active'
            );
          }
          break;
        case 'customer.subscription.deleted':
          // Handle subscription cancellation
          const canceledSubscription = event.data.object;
          
          // Find all users
          const allUsers = await Promise.all(
            Array.from({ length: 100 }, (_, i) => i + 1)
              .map(id => storage.getUser(id))
          );
          
          // Find user with matching subscription ID
          const userToCancel = allUsers
            .filter(Boolean)
            .find(u => u?.stripeSubscriptionId === canceledSubscription.id);
          
          if (userToCancel) {
            await storage.updateUserSubscription(userToCancel.id, false);
          }
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook', error);
      res.status(400).send('Webhook Error');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
