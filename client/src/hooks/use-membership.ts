import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export function useMembership() {
  const { user, isPremium } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const startSubscription = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to subscribe",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    if (isPremium) {
      toast({
        title: "Already subscribed",
        description: "You are already a premium member",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create subscription and redirect to checkout
      await apiRequest("POST", "/api/create-subscription");
      setLocation("/subscribe");
    } catch (error: any) {
      toast({
        title: "Subscription error",
        description: error.message || "Error starting subscription process",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isPremium,
    isLoading,
    startSubscription,
  };
}
