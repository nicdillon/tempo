import { useEffect, useState } from "react";
import { useAuth } from "./use-auth";
import { apiRequest } from "@/lib/queryClient";

type Theme = "light" | "dark" | "system";

export function useTheme() {
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
    if (user?.preferences) {
      setThemeState(user.preferences.theme || "system");
      setAccentColorState(user.preferences.accentColor || "#FF5252");
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

  // Apply accent color
  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty("--primary", accentColor);
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
        await apiRequest("PATCH", "/api/settings", preferences);
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
