import { createContext, useContext, useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { createUserProfile } from '@/lib/usesProfile';

// Define the Profile type based on your public.profiles table
type Profile = {
  id: string; // UUID from auth.users
  // username: string | null;
  email: string | null;
  is_subscribed: boolean;
  created_at: string;
  stripeCustomerId?: string | null; // Added
  stripeSubscriptionId?: string | null; // Added
  preferences?: { // Added
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    soundNotifications: boolean;
    browserNotifications: boolean;
  } | null;
};

// Combine SupabaseUser and Profile for the user object
type User = SupabaseUser & { profile: Profile | null };

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isPremium: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  isPremium: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { supabase } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const isPremium = user?.profile?.is_subscribed || false;

  // Fetch current user session and profile on mount and on auth state change
  useEffect(() => {
    if (!supabase) return;

    const fetchSessionAndProfile = async () => {
      setLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error fetching session:", sessionError);
          setUser(null);
          return;
        }

        if (session?.user) {
          // Fetch profile data
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError);
            // Set user without profile if profile fetch fails
            setUser({ ...session.user, profile: null });
          } else {
            setUser({ ...session.user, profile });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in fetchSessionAndProfile:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        fetchSessionAndProfile(); // Re-fetch profile when auth state changes
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase client not available");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // User state will be updated by onAuthStateChange listener
      toast({
        title: "Login successful",
        description: `Welcome back!`, 
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase client not available");
    try {
      // Sign up the user
      const { data: signUpData, error: signUpError, } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("User registration failed.");

      // Insert profile after successful signup
      // Note: Supabase might require email confirmation before the user is fully active.
      // The profile insert might fail if RLS prevents insert before confirmation.
      // Consider handling this with triggers or allowing insert based on user ID.
      let profileError
      try {
        await createUserProfile(supabase, signUpData.user.id, signUpData.user.email!);
      } catch (error) {
        
        console.error("Error creating profile:", profileError);
        toast({
          title: "Profile creation failed",
          description: "Your account was created, but profile setup failed. Please contact support.",
          variant: "default", // Changed from "warning"
        });
      }

      // User state will be updated by onAuthStateChange listener
      toast({
        title: "Registration successful",
        description: "Please check your email to confirm your account.", // Inform about confirmation
      });
      setLocation("/"); // Or redirect to a confirmation pending page
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profileError) throw profileError;
        setUser({ ...session.user, profile });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
      setUser(null); // Clear user on error
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!supabase) throw new Error("Supabase client not available");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // User state will be updated by onAuthStateChange listener
      setUser(null); // Explicitly clear user state immediately
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/login");
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "Could not log out",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isPremium,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
