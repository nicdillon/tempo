import { MainLayout } from "@/components/layouts/MainLayout";
import { PremiumLock } from "@/components/ui/premium-lock";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { Charts } from "@/components/analytics/Charts";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClockIcon, BarChartIcon, CalendarIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Sample data for non-premium users
const sampleData = {
  totalTime: 27000, // 7.5 hours in seconds
  sessionsCount: 15,
  timeByCategory: [
    { id: 1, name: "Work", color: "#F97316", totalTime: 14400, percentage: 0.53 },
    { id: 2, name: "Study", color: "#8B5CF6", totalTime: 7200, percentage: 0.27 },
    { id: 3, name: "Personal", color: "#10B981", totalTime: 5400, percentage: 0.20 }
  ],
  timeByDayOfWeek: [
    { day: "Mon", totalTime: 7200 },
    { day: "Tue", totalTime: 5400 },
    { day: "Wed", totalTime: 3600 },
    { day: "Thu", totalTime: 4500 },
    { day: "Fri", totalTime: 3600 },
    { day: "Sat", totalTime: 1800 },
    { day: "Sun", totalTime: 900 }
  ]
};

export default function AnalyticsPage() {
  const { user, isPremium } = useAuth();
  
  // Format time functions
  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <MainLayout>
      {/* For logged-in premium users, show actual data */}
      {user && isPremium ? (
        <AnalyticsDashboard />
      ) : (
        <div className="space-y-6">
          <div className="relative">
            {/* Demo Analytics */}
            <div className="space-y-8 opacity-85 blur-[1px]">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Time</CardTitle>
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatTotalTime(sampleData.totalTime)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tracked across all sessions
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{sampleData.sessionsCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total recorded sessions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Categories</CardTitle>
                    <BarChartIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {sampleData.timeByCategory.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Active timer categories
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <Charts data={sampleData} />
            </div>
            
            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="text-center p-6 max-w-md">
                <h2 className="text-2xl font-bold mb-2">Unlock Your Analytics</h2>
                <p className="text-muted-foreground mb-6">
                  Get detailed insights into your time usage patterns. Upgrade to premium to see your personal analytics dashboard.
                </p>
                {user ? (
                  <Button asChild className="bg-amber-500 hover:bg-amber-600">
                    <Link href="/subscribe" className="inline-flex items-center">
                      Upgrade to Premium
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <div className="flex space-x-4 justify-center">
                    <Button asChild>
                      <Link href="/login">Log In</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/register">Register</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
