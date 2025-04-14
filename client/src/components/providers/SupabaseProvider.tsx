import { createContext, useContext } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type SupabaseContextType = {
  supabase: SupabaseClient | null;
};

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
});

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing required environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY");
  }
  // In a real implementation, we would initialize Supabase with:
  const supabase = createClient(
    supabaseUrl, 
    supabaseAnonKey
  );

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => useContext(SupabaseContext);
