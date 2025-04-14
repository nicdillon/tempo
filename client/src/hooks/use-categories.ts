import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useEffect, useState } from "react";

interface Category {
  id: number;
  user_id: number;
  name: string;
  color: string;
  is_preset: boolean;
}

// Preset categories available to all users
const presetCategories: Category[] = [
  { id: -1, user_id: 0, name: "Work", color: "#FF5252", is_preset: true },
  { id: -2, user_id: 0, name: "Study", color: "#2196F3", is_preset: true },
  { id: -3, user_id: 0, name: "Exercise", color: "#4CAF50", is_preset: true },
  { id: -4, user_id: 0, name: "Break", color: "#FFC107", is_preset: true },
];

export function useCategories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const  [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    async function fetchAccessToken() {
      if (!supabase) throw new Error("Supabase client not available");
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("Not authenticated");
      setAccessToken(accessToken);
    }
    fetchAccessToken();
  }, [supabase])

  // Fetch user-specific categories from API if user is logged in
  const { data: userCategories = [], isLoading, error } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      if (!supabase || !accessToken) return []; // Return empty if not ready
      const response = await apiRequest(supabase, accessToken, "GET", "/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
    enabled: !!user && !!supabase && !!accessToken, // Only enable when user, supabase, and token are available
    initialData: [], // Start with empty, presets are added below
  });

  // Add category mutation
  const addCategoryMutation = useMutation({

    mutationFn: async (category: Omit<Category, "id" | "user_id">) => {
      const response = await apiRequest(supabase, accessToken, "POST", "/api/categories", category);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category created",
        description: "Your new category has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating category",
        description: error.message || "Failed to create category. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      await apiRequest(supabase, accessToken, "DELETE", `/api/categories/${categoryId}`);
      return categoryId;
    },
    onSuccess: (categoryId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting category",
        description: error.message || "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addCategory = (category: Omit<Category, "id" | "user_id">) => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to create categories.",
        variant: "destructive",
      });
      return;
    }
    addCategoryMutation.mutate(category);
  };

  const deleteCategory = (categoryId: number) => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to delete categories.",
        variant: "destructive",
      });
      return;
    }
    deleteCategoryMutation.mutate(categoryId);
  };

  // Combine preset and user categories
  const combinedCategories = [
    ...presetCategories,
    ...(user ? userCategories : []) // Only include user categories if logged in
  ];

  // Filter out potential duplicates if API returns presets (unlikely but safe)
  const uniqueCategories = combinedCategories.filter((category, index, self) =>
    index === self.findIndex((c) => c.name === category.name && c.is_preset === category.is_preset)
  );


  return {
    categories: uniqueCategories,
    isLoading: isLoading || addCategoryMutation.isPending || deleteCategoryMutation.isPending,
    error,
    addCategory,
    deleteCategory,
  };
}
