import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

interface Category {
  id: number;
  userId: number;
  name: string;
  color: string;
  isPreset: boolean;
}

// Default categories for clients without backend connection
const defaultCategories = [
  { id: 1, userId: 0, name: "Work", color: "#FF5252", isPreset: true },
  { id: 2, userId: 0, name: "Study", color: "#2196F3", isPreset: true },
  { id: 3, userId: 0, name: "Exercise", color: "#4CAF50", isPreset: true },
  { id: 4, userId: 0, name: "Break", color: "#FFC107", isPreset: true },
];

export function useCategories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories from API if user is logged in
  const { data: categories = [], isLoading, error } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user,
    placeholderData: defaultCategories,
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (category: Omit<Category, "id" | "userId">) => {
      const response = await apiRequest("POST", "/api/categories", category);
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
      await apiRequest("DELETE", `/api/categories/${categoryId}`);
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

  const addCategory = (category: Omit<Category, "id" | "userId">) => {
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

  return {
    categories: categories || defaultCategories,
    isLoading: isLoading || addCategoryMutation.isPending || deleteCategoryMutation.isPending,
    error,
    addCategory,
    deleteCategory,
  };
}
