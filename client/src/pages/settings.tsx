import { useState } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { AccentPicker } from "@/components/ui/accentPicker";
import { requestNotificationPermission, canUseNotifications } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Link } from "wouter";
import { MoonIcon, SunIcon, MonitorIcon, CrownIcon, LogOutIcon } from "lucide-react";

export default function SettingsPage() {
  const { user, logout, isPremium } = useAuth();
  const { theme, setTheme, updateUserPreferences } = useTheme();
  const { toast } = useToast();
  const [soundNotifications, setSoundNotifications] = useState<boolean>(
    user?.preferences?.soundNotifications ?? true
  );
  const [browserNotifications, setBrowserNotifications] = useState<boolean>(
    user?.preferences?.browserNotifications ?? true
  );

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

  return (
    <MainLayout>
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
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Button variant="destructive" onClick={logout}>
                    <LogOutIcon className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Subscription Status</p>
                    <div className="flex items-center mt-1">
                      {isPremium ? (
                        <Badge className="bg-amber-500">Premium Member</Badge>
                      ) : (
                        <Badge variant="outline">Free Plan</Badge>
                      )}
                    </div>
                  </div>
                  {!isPremium && (
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
                <Button asChild>
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
