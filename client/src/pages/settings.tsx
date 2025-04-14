import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useAuth } from "@/components/providers/AuthProvider"; // Corrected import
import { useTheme } from "@/hooks/use-theme";
import { AccentPicker } from "@/components/ui/accentPicker";
import { requestNotificationPermission, canUseNotifications } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { MoonIcon, SunIcon, MonitorIcon, CrownIcon, LogOutIcon } from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";

export default function SettingsPage() {
  const { supabase } = useSupabase(); // Get supabase client
  const { user, logout, isPremium, refreshUser } = useAuth();
  const { theme, setTheme, updateUserPreferences } = useTheme();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    isActive: boolean;
    isCancelled: boolean;
    currentPeriodEnd?: Date;
  } | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [soundNotifications, setSoundNotifications] = useState<boolean>(
    user?.profile?.preferences?.soundNotifications ?? true // Updated access
  );
  const [browserNotifications, setBrowserNotifications] = useState<boolean>(
    user?.profile?.preferences?.browserNotifications ?? true // Updated access
  );
  
  // Fetch subscription info if user is premium
  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      if (!user?.profile?.stripeSubscriptionId) return; // Updated access

      if (!supabase) throw new Error("Supabase client not available");
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("Not authenticated");
      
      try {
        setSubscriptionLoading(true);
        const response = await apiRequest(supabase, accessToken, "GET", `/api/subscription-status`);
        if (response.ok) {
          const data = await response.json();
          setSubscriptionInfo({
            isActive: data.isActive,
            isCancelled: data.isCancelled,
            currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : undefined
          });
        }
      } catch (error) {
        console.error("Error fetching subscription info:", error);
      } finally {
        setSubscriptionLoading(false);
      }
    };
    
    if (user && isPremium) {
      fetchSubscriptionInfo();
    }
  }, [user, isPremium]);

  // Save notification settings
  const saveNotificationSettings = async (type: "sound" | "browser", enabled: boolean) => {
    if (type === "sound") {
      setSoundNotifications(enabled);
    } else {
      if (enabled) {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
          toast({
            title: "Permission Denied",
            description: "Please allow notifications in your browser settings.",
            variant: "destructive",
          });
          setBrowserNotifications(false);
          return;
        }
      }
      setBrowserNotifications(enabled);
    }

    // Update user preferences in database if logged in
    if (user) {
      const preferences = type === "sound"
        ? { soundNotifications: enabled }
        : { browserNotifications: enabled };
      
      updateUserPreferences(preferences);
    }
  };
  
  // Handle cancellation of subscription
  const handleCancelSubscription = () => {
    setCancelDialogOpen(true);
  };
  
  // Perform the actual cancellation
  const performCancellation = async () => {
    try {
      if (!supabase) throw new Error("Supabase client not available");
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("Not authenticated");

      setCancelLoading(true);
      const response = await apiRequest(supabase, accessToken, 'POST', '/api/cancel-subscription');
      
      if (response.ok) {
        toast({
          title: "Subscription Canceled",
          description: "Your premium subscription has been canceled.",
        });
        
        // Reload page to update UI
        window.location.reload();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to cancel subscription");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while canceling your subscription.",
        variant: "destructive",
      });
    } finally {
      setCancelLoading(false);
      setCancelDialogOpen(false);
    }
  };

  return (
    <MainLayout>
      {/* Cancel Subscription Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your premium subscription? Your premium features will remain active until the end of your current billing period, but your subscription will not renew.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={performCancellation}
              disabled={cancelLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelLoading ? "Canceling..." : "Yes, Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how Tempo looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={theme}
                onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
              >
                <SelectTrigger id="theme" className="w-full max-w-xs">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light" className="flex items-center">
                    <div className="flex items-center">
                      <SunIcon className="mr-2 h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center">
                      <MoonIcon className="mr-2 h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center">
                      <MonitorIcon className="mr-2 h-4 w-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Accent Color</Label>
              <AccentPicker className="pt-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Choose a color that will be used for buttons and interactive elements
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Configure how you want to be notified when timers complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-notifications">Sound Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Play a sound when a timer ends
                </p>
              </div>
              <Switch
                id="sound-notifications"
                checked={soundNotifications}
                onCheckedChange={(checked) => saveNotificationSettings("sound", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="browser-notifications">Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show browser notifications when a timer ends
                </p>
              </div>
              <Switch
                id="browser-notifications"
                checked={browserNotifications}
                onCheckedChange={(checked) => saveNotificationSettings("browser", checked)}
                disabled={!("Notification" in window)}
              />
            </div>
            {!("Notification" in window) && (
              <p className="text-sm text-yellow-500">
                Browser notifications are not supported in your browser
              </p>
            )}
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Manage your account and subscription status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {user ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    {/* <p className="font-medium">{user.username}</p> */}
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={logout}
                    className="hover:bg-destructive/90"
                  >
                    <LogOutIcon className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
                <Separator />
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Subscription Status</p>
                    <div className="flex flex-col gap-1 mt-1">
                      {isPremium ? (
                        <>
                          <Badge className="bg-amber-500 w-fit">Premium Member</Badge>
                          {subscriptionLoading && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                              Loading subscription details...
                            </div>
                          )}
                          {subscriptionInfo?.isCancelled && (
                            <div className="text-sm mt-1 text-yellow-600">
                              <p className="font-medium">Your subscription is canceled</p>
                              {subscriptionInfo.currentPeriodEnd && (
                                <p>Premium access ends on {subscriptionInfo.currentPeriodEnd.toLocaleDateString()}</p>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline" className="w-fit">Free Plan</Badge>
                      )}
                    </div>
                  </div>
                  {isPremium ? (
                    subscriptionInfo?.isCancelled ? (
                      <Button asChild className="bg-amber-500 hover:bg-amber-600">
                        <Link href="/subscribe">
                          <CrownIcon className="h-4 w-4 mr-2" />
                          Resubscribe
                        </Link>
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={handleCancelSubscription} 
                        className="text-destructive border-destructive hover:bg-destructive/10"
                        disabled={cancelLoading || subscriptionLoading}
                      >
                        {cancelLoading ? "Canceling..." : "Cancel Subscription"}
                      </Button>
                    )
                  ) : (
                    <Button asChild className="bg-amber-500 hover:bg-amber-600">
                      <Link href="/subscribe">
                        <CrownIcon className="h-4 w-4 mr-2" />
                        Upgrade
                      </Link>
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="mb-4">You need to be logged in to view account settings</p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
