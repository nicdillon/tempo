import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
// Use renamed types/schemas from shared/schema
import { insertProfileSchema, loginSchema, registerSchema, UserProfile, InsertProfile, InsertCategory, InsertTimerSession } from "@shared/schema";
import { z } from "zod";
import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from "url";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
// Check for Stripe secret key
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;

// Initialize Stripe if we have the secret key
let stripe: Stripe | undefined;

if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
} else {
  console.warn("Missing STRIPE_SECRET_KEY - payment features will not work");
}

// Add user property to Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email?: string;[key: string]: any }; // Supabase user from JWT
      // localUserId?: number; // No longer needed
    }
  }
}

// Initialize Supabase client for backend use
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use Service Role Key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Key in environment variables.");
  process.exit(1); // Exit if keys are missing
}

const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

export async function registerRoutes(app: Express): Promise<Server> {

  // JWT Verification Middleware
  const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized: Missing or invalid token" });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify JWT using Supabase Admin client
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        console.error("JWT Verification Error:", error?.message);
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }

      // Attach Supabase user information to the request object
      req.user = { id: user.id, email: user.email, ...user.user_metadata };

      // Optional: Check if profile exists for this user - useful for ensuring sync
      const profile = await storage.getUserProfile(user.id); // Use renamed storage method
      if (!profile) {
        // This could happen if the user exists in Supabase Auth but not in your profiles table
        console.error(`Profile not found for Supabase user ID: ${user.id}`);
        // Depending on flow, you might auto-create profile here or deny access
        // For now, let's deny access if profile doesn't exist after JWT verification
        return res.status(401).json({ message: "User profile not found" });
      }

      next();
    } catch (err) {
      console.error("Unexpected error during JWT verification:", err);
      return res.status(500).json({ message: "Internal server error during authentication" });
    }
  };

  // Subscription middleware (updated to use req.user.id - the Supabase UUID)
  const requireSubscription = async (req: Request, res: Response, next: NextFunction) => {
    // Check for user attached by verifyJWT
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized - User not verified" });
    }

    // Fetch profile from storage using the Supabase UUID
    const profile = await storage.getUserProfile(req.user.id); // Use renamed method
    if (!profile) {
      console.error(`Profile with ID ${req.user.id} not found in storage.`);
      return res.status(401).json({ message: "User profile not found" });
    }

    if (!profile.is_subscribed) {
      return res.status(403).json({ message: "Subscription required" });
    }

    next();
  };


  // ===== Auth Routes (Updated - No longer rely on express-session) =====
  // Register Endpoint - Needs Rework
  // This endpoint should ideally be called *after* client-side Supabase signup
  // to create the corresponding profile in the 'profiles' table.
  // It needs the Supabase User ID from the client.
  app.post("/api/auth/register", async (req, res) => {
    // TEMPORARY: This endpoint as-is doesn't fit the Supabase Auth flow well.
    // It attempts to create a local user based on email/password, but auth happens client-side.
    // A better approach is a dedicated profile creation endpoint called after client signup.
    // For now, let's assume it receives necessary data (including Supabase ID if flow was adjusted).
    try {
      // Assuming registerSchema is updated or a different schema is used for profile creation
      // We expect id (Supabase UUID) and email in the body for profile creation
      const profileSchema = z.object({
        id: z.string().uuid(),
        email: z.string().email(),
      });
      const validatedData = profileSchema.parse(req.body); // Use profileSchema

      // Check if profile already exists for this ID or email
      const existingProfileById = await storage.getUserProfile(validatedData.id);
      const existingProfileByEmail = await storage.getUserProfileByEmail(validatedData.email);

      if (existingProfileById || existingProfileByEmail) {
        console.warn(`Profile creation attempt for existing user: ${validatedData.email}`);
        return res.status(200).json(existingProfileById || existingProfileByEmail);
      }

      // Create profile in your database using data including the Supabase ID
      // Email is now nullable in the profiles table and not part of InsertProfile type
      const newProfileData: InsertProfile = {
        id: validatedData.id,
        email: validatedData.email, // Remove email - it's not in InsertProfile type anymore
      };
      // The createProfile function in storage might need adjustment if it expects email
      const newProfile = await storage.createProfile(newProfileData); // Pass email separately if needed by storage function

      res.status(201).json(newProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error processing profile creation:", error);
      return res.status(500).json({ message: "Error processing profile creation" });
    }
  });

  // Login Endpoint - Likely Redundant for JWT Flow
  // Client handles Supabase login and gets JWT. This endpoint might only be for checking credentials.
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Check if profile exists for the email
      const profile = await storage.getUserProfileByEmail(validatedData.email); // Use renamed method
      if (!profile) {
        // Password check is handled by Supabase client-side login.
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.json(profile); // Return profile data
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error during login check:", error);
      return res.status(500).json({ message: "Error during login check" });
    }
  });

  // Logout Endpoint - Client handles Supabase logout
  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logout endpoint called (client handles actual Supabase logout)" });
  });

  // Get current user profile (Uses JWT verification middleware)
  app.get("/api/auth/me", verifyJWT, async (req, res) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Fetch profile from storage using Supabase UUID from JWT
    let profile = await storage.getUserProfile(req.user.id); // Use renamed method and Supabase ID
    if (!profile) {
      console.error(`Profile with ID ${req.user.id} not found in storage.`);
      return res.status(401).json({ message: "User profile not found" });
    }

    // Check subscription status (optional sync)
    if (stripe && profile.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
        if (subscription.status === 'active' && !subscription.cancel_at_period_end && !profile.is_subscribed) {
          console.log("Found active subscription but profile not marked as premium. Updating status...");
          profile = await storage.updateUserSubscription(profile.id, true); // Use profile.id (UUID)
        }
        if (subscription.cancel_at_period_end && profile.is_subscribed) {
          console.log("Subscription is canceled but profile still marked as premium. Removing premium status...");
          profile = await storage.updateUserSubscription(profile.id, false); // Use profile.id (UUID)
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
      }
    }

    res.json(profile);
  });

  // ===== Categories Routes (Updated to use verifyJWT) =====
  app.get("/api/categories", verifyJWT, async (req, res) => {
    const user_id = req.user!.id; // Supabase UUID
    const categories = await storage.getCategories(user_id);
    res.json(categories);
  });

  app.post("/api/categories", verifyJWT, async (req, res) => {
    try {
      const user_id = req.user!.id; // Supabase UUID
      // Validate req.body against a Zod schema for category creation if needed
      const validatedData: InsertCategory = {
        ...req.body,
        user_id: user_id // Ensure userId is the Supabase UUID
      };
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Error creating category" });
    }
  });

  app.delete("/api/categories/:id", verifyJWT, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id); // Local category ID
      const userId = req.user!.id; // Supabase UUID

      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Verify ownership using Supabase ID
      if (category.user_id !== userId) { // Compare with Supabase ID
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deleteCategory(categoryId); // Delete using local category ID
      res.json({ message: "Category deleted" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Error deleting category" });
    }
  });

  // ===== Timer Sessions Routes (Updated to use verifyJWT and requireSubscription) =====
  app.get("/api/timer-sessions", verifyJWT, requireSubscription, async (req, res) => {
    try {
      const userId = req.user!.id; // Supabase UUID
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const sessions = await storage.getTimerSessions(userId, limit);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching timer sessions:", error);
      res.status(500).json({ message: "Error fetching timer sessions" });
    }
  });

  app.post("/api/timer-sessions", verifyJWT, async (req, res) => {
    try {
      const userId = req.user!.id; // Supabase UUID

      // Check if profile is subscribed
      const profile = await storage.getUserProfile(userId);
      if (!profile?.is_subscribed) {
        return res.status(403).json({
          message: "Subscription required to save timer sessions",
          isSubscriptionRequired: true
        });
      }

      // Validate req.body if needed
      const validatedData: InsertTimerSession = {
        ...req.body,
        user_id: userId, // Ensure userId is the Supabase UUID
        start_time: new Date() // Set startTime on the server
      };

      const session = await storage.createTimerSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating timer session:", error);
      res.status(500).json({ message: "Error creating timer session" });
    }
  });

  app.patch("/api/timer-sessions/:id", verifyJWT, requireSubscription, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id); // Local session ID
      const userId = req.user!.id; // Supabase user ID

      // Fetch the session first to verify ownership
      const existingSessions = await storage.getTimerSessions(userId); // Use Supabase ID
      const existingSession = existingSessions.find(s => s.id === sessionId);

      if (!existingSession) {
        return res.status(404).json({ message: "Timer session not found or access denied" });
      }
      // Ownership confirmed (since getTimerSessions already filtered by userId)

      // Proceed with update
      const updatedSession = await storage.updateTimerSession(sessionId, { // Use local session ID
        ...req.body,
        end_time: req.body.endTime ? new Date(req.body.endTime) : new Date()
      });

      res.json(updatedSession);
    } catch (error) {
      console.error("Error updating timer session:", error);
      res.status(500).json({ message: "Error updating timer session" });
    }
  });

  // ===== Analytics Routes (Updated to use verifyJWT and requireSubscription) =====
  app.get("/api/analytics", verifyJWT, requireSubscription, async (req, res) => {
    try {
      const userId = req.user!.id; // Supabase user ID
      const analytics = await storage.getTimerSessionsAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Error fetching analytics" });
    }
  });

  // ===== Settings Routes (Updated to use verifyJWT) =====
  app.patch("/api/settings", verifyJWT, async (req, res) => {
    try {
      const userId = req.user!.id; // Supabase user ID
      // Validate req.body against userPreferencesSchema if needed
      const profile = await storage.updateUserPreferences(userId, req.body);
      res.json(profile); // Return updated profile
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Error updating settings" });
    }
  });

  // ===== Stripe Routes (Updated to use verifyJWT) =====
  app.post("/api/create-payment-intent", verifyJWT, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      const { amount } = req.body;
      if (!amount || typeof amount !== 'number') {
        return res.status(400).json({ message: "Invalid amount" });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      return res.status(400).json({ message: "Error creating payment intent", error: error.message });
    }
  });

  app.post("/api/cancel-subscription", verifyJWT, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      const userId = req.user!.id; // Supabase user ID
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      if (!profile.stripe_subscription_id) {
        return res.status(400).json({ message: "No active subscription found" });
      }
      await stripe.subscriptions.update(profile.stripe_subscription_id, { cancel_at_period_end: true });
      res.json({ message: "Subscription canceled successfully" });
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      return res.status(400).json({ message: "Error canceling subscription", error: error.message });
    }
  });

  app.get("/api/subscription-status", verifyJWT, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      const userId = req.user!.id; // Supabase user ID
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      if (!profile.stripe_subscription_id) {
        return res.json({ isActive: false, isCancelled: false, message: "No subscription found" });
      }
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
      return res.json({
        isActive: subscription.status === 'active',
        isCancelled: subscription.cancel_at_period_end,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        status: subscription.status
      });
    } catch (error: any) {
      console.error("Error checking subscription status:", error);
      return res.status(400).json({ message: "Error checking subscription status", error: error.message });
    }
  });

  app.post("/api/create-subscription", verifyJWT, async (req, res) => {
    try {
      if (!stripe || !STRIPE_PRICE_ID) {
        console.error("Stripe not configured - missing keys:", { hasStripe: !!stripe, hasPriceId: !!STRIPE_PRICE_ID });
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      const userId = req.user!.id; // Supabase user ID
      const profile = await storage.getUserProfile(userId);

      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      if (profile.stripe_subscription_id) {
        const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id, { 
          expand: ['latest_invoice.payment_intent'] 
        }) as Stripe.Subscription 
          & { latest_invoice: Stripe.Invoice 
          & { payment_intent: Stripe.PaymentIntent } };
        console.log("Subscription...:", subscription)
        if (subscription.status === 'active' && !profile.is_subscribed) {
          await storage.updateUserSubscription(profile.id, true);
          return res.json({ subscriptionId: subscription.id, clientSecret: subscription.latest_invoice?.payment_intent?.client_secret, premiumActivated: true, message: "Your subscription is active! Premium features are now enabled." });
        }
        return res.json({ subscriptionId: subscription.id, clientSecret: subscription.latest_invoice?.payment_intent?.client_secret });
      }

      if (!profile.email)
        throw Error("Email is required to create a subscription");

      const customer = await stripe.customers.create({ email: profile.email });
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: STRIPE_PRICE_ID }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      }) as Stripe.Subscription & { latest_invoice: Stripe.Invoice & { payment_intent: Stripe.PaymentIntent } };

      await storage.updateUserStripeInfo(profile.id, {
        customerId: customer.id,
        subscriptionId: subscription.id,
        markAsSubscribed: true
      });

      res.json({ subscriptionId: subscription.id, clientSecret: subscription.latest_invoice?.payment_intent?.client_secret });
    } catch (error: any) {
      console.error("Stripe subscription error:", error);
      return res.status(400).json({ message: "Error creating subscription", error: error.message, details: error.toString() });
    }
  });

  // Webhook for stripe events (subscription status updates)
  app.post("/api/webhook", async (req, res) => {
    if (!stripe) { return res.status(500).json({ message: "Stripe is not configured" }); }
    const payload = req.body;
    const event = payload;
    try {
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          // Find profile by stripe customer ID
          const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('stripe_customer_id', subscription.customer).single();
          if (profile) {
            await storage.updateUserSubscription(profile.id, subscription.status === 'active');
          } else {
            console.warn(`Webhook received for unknown customer: ${subscription.customer}`);
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const canceledSubscription = event.data.object as Stripe.Subscription;
          // Find profile by stripe customer ID
          const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('stripe_customer_id', canceledSubscription.customer).single();
          if (profile) {
            await storage.updateUserSubscription(profile.id, false);
          } else {
            console.warn(`Webhook received for unknown customer: ${canceledSubscription.customer}`);
          }
          break;
        }
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
