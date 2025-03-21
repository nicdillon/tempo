import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, BarChart, Clock, Save } from "lucide-react";

// Initialize Stripe with the public key
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing required environment variable: VITE_STRIPE_PUBLIC_KEY");
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function SubscriptionForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const { refreshUser } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment",
          variant: "destructive",
        });
      } else {
        // If payment was successful, refresh user data to update premium status
        await refreshUser();
        
        toast({
          title: "Payment Successful",
          description: "You are now a premium member!",
        });
        
        // Add a small delay to allow the toast to be seen
        setTimeout(() => setLocation("/"), 1500);
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90" 
        disabled={!stripe || loading}
      >
        {loading ? "Processing..." : "Subscribe Now"}
      </Button>
    </form>
  );
}

export default function SubscribePage() {
  const [clientSecret, setClientSecret] = useState("");
  const { user, isPremium } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check user subscription status
  const [isCancelled, setIsCancelled] = useState(false);
  
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (user?.stripeSubscriptionId) {
        try {
          const response = await apiRequest("GET", `/api/subscription-status`);
          const data = await response.json();
          
          if (data.isCancelled) {
            // If subscription is cancelled, allow resubscribing
            setIsCancelled(true);
          } else if (isPremium) {
            // Only redirect and show toast if premium and not cancelled
            toast({
              title: "Already Subscribed",
              description: "You are already a premium member",
            });
            setLocation("/");
          }
        } catch (error) {
          console.error("Error checking subscription status:", error);
        }
      } else if (isPremium) {
        // Redirect home if premium with no subscription ID (legacy premium account)
        toast({
          title: "Already Subscribed",
          description: "You are already a premium member",
        });
        setLocation("/");
      }
    };
    
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user, isPremium, setLocation, toast]);

  // Create subscription when the page loads
  useEffect(() => {
    if (!user) {
      toast({
        title: "Not Logged In",
        description: "Please log in to subscribe",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    const createSubscription = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-subscription");
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Error creating subscription:", error);
        toast({
          title: "Subscription Error",
          description: "Failed to initialize subscription. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (!isPremium && user) {
      createSubscription();
    }
  }, [user, isPremium, toast, setLocation]);

  if (!user || isPremium) {
    return null; // Will redirect via useEffect
  }

  // Show loading state while waiting for clientSecret
  if (!clientSecret) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-muted-foreground">Initializing subscription...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-5 gap-6">
          {/* Subscription Form */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Upgrade to Premium</CardTitle>
                <CardDescription>
                  Enter your payment details to unlock premium features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Elements 
                  stripe={stripePromise} 
                  options={{ clientSecret, appearance: { theme: 'stripe' } }}
                >
                  <SubscriptionForm />
                </Elements>
              </CardContent>
            </Card>
          </div>

          {/* Benefits */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Premium Benefits</CardTitle>
                <CardDescription>
                  What you'll get with your subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2" />
                  <div>
                    <h3 className="font-medium">Save Timer Sessions</h3>
                    <p className="text-sm text-muted-foreground">
                      Store and retrieve your timer sessions across devices
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2" />
                  <div>
                    <h3 className="font-medium">Detailed Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      View insights about your time usage with charts and statistics
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2" />
                  <div>
                    <h3 className="font-medium">Unlimited Categories</h3>
                    <p className="text-sm text-muted-foreground">
                      Create and save as many custom timer categories as you need
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 flex flex-col items-start space-y-2 text-sm">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Data securely stored with Supabase</span>
                </div>
                <div className="flex items-center">
                  <BarChart className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>View your analytics immediately after subscribing</span>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
