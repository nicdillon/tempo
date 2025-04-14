import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Charts } from "@/components/analytics/Charts";
import { ClockIcon, BarChartIcon, CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient"; // Import queryClient if needed for invalidation, etc.
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { AnalyticsData, TimeByCategory, TimeByDayOfWeek } from "@/models/AnalyticsData"; // Import the class and interfaces


export function AnalyticsDashboard() {
  const { supabase } = useSupabase();

  const fetchAnalytics = async (): Promise<AnalyticsData> => {
    if (!supabase) throw new Error("Supabase client not available");
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) throw new Error("Not authenticated");

    const response = await apiRequest(supabase, accessToken, "GET", `/api/analytics`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to fetch analytics" }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const rawData = await response.json();
    // Validate or transform rawData if necessary before constructing
    return new AnalyticsData(rawData); // Instantiate the class
  };

  const { data, isLoading, error } = useQuery<AnalyticsData, Error>({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    enabled: !!supabase, // Only run query when supabase client is available
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
  });

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Error loading analytics: {error.message}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p>No analytics data available.</p>
      </div>
    );
  }

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
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTotalTime(data.totalTime)} {/* Use data from useQuery */}
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
            <div className="text-2xl font-bold">{data.sessionsCount}</div> {/* Use data from useQuery */}
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
              {data.timeByCategory.filter((c: TimeByCategory) => c.totalTime > 0).length} {/* Use data from useQuery and type */}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active timer categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Pass the typed data */}
      <Charts data={data} />
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[80px] mb-1" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent className="h-[300px]">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
