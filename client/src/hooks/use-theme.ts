import { useEffect, useState } from "react";
import { useAuth } from "./use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useSupabase } from '../components/providers/SupabaseProvider';

type Theme = "light" | "dark" | "system";

export function useTheme() {
  const { supabase } = useSupabase(); // Get supabase client
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get theme from localStorage or default to system
    return (localStorage.getItem("theme") as Theme) || "system";
  });
  
  const [accentColor, setAccentColorState] = useState<string>(() => {
    // Get accent color from localStorage or default to primary red
    return localStorage.getItem("accentColor") || "#FF5252";
  });

  // Initialize theme from user preferences if available
  useEffect(() => {
    if (user?.profile?.preferences) {
      setThemeState(user.profile.preferences.theme || "system");
      setAccentColorState(user.profile.preferences.accentColor || "#FF5252");
    }
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove both classes first
    root.classList.remove("light", "dark");
    
    // Apply appropriate theme
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    // Store in localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Apply accent color - convert hex to HSL
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const formattedHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
      
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };
    
    // Convert RGB to HSL
    const rgbToHsl = (r: number, g: number, b: number) => {
      r /= 255;
      g /= 255;
      b /= 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        
        h /= 6;
      }
      
      // Return HSL values in the format expected by CSS
      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      };
    };
    
    // Convert hex to HSL
    const rgb = hexToRgb(accentColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // Set HSL values as CSS variables
    root.style.setProperty("--primary", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    
    // Store the hex color in localStorage
    localStorage.setItem("accentColor", accentColor);
  }, [accentColor]);

  // Update user preferences in the database if logged in
  const updateUserPreferences = async (
    preferences: Partial<{
      theme: Theme;
      accentColor: string;
      soundNotifications: boolean;
      browserNotifications: boolean;
    }>
  ) => {
    if (user) {
      try {
        if (!supabase) throw new Error("Supabase client not available");
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) throw new Error("Not authenticated");

        await apiRequest(supabase, accessToken, "PATCH", "/api/settings", preferences);
      } catch (error) {
        console.error("Failed to update user preferences:", error);
      }
    }
  };

  // Set theme with persistence
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    updateUserPreferences({ theme: newTheme });
  };

  // Set accent color with persistence
  const setAccentColor = (newColor: string) => {
    setAccentColorState(newColor);
    updateUserPreferences({ accentColor: newColor });
  };

  return {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    updateUserPreferences,
  };
}
