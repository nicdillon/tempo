import { useState } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PremiumLock } from "@/components/ui/premium-lock";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeDisplay } from "@/lib/utils";
import { CalendarIcon, ClockIcon, TimerIcon, ArrowRightIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

// Sample data for demo
const sampleSessions = [
  {
    id: 1,
    timerType: "pomodoro",
    categoryId: 1,
    duration: 1500, // 25 mins in seconds
    startTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    completed: true
  },
  {
    id: 2,
    timerType: "countdown",
    categoryId: 2,
    duration: 3600, // 1 hour in seconds
    startTime: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    completed: true
  },
  {
    id: 3,
    timerType: "stopwatch",
    categoryId: 3,
    duration: 1800, // 30 mins in seconds
    startTime: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    completed: true
  },
  {
    id: 4,
    timerType: "pomodoro",
    categoryId: 1,
    duration: 900, // 15 mins in seconds
    startTime: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    completed: false
  },
  {
    id: 5,
    timerType: "countdown",
    categoryId: 3,
    duration: 2700, // 45 mins in seconds
    startTime: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    completed: true
  }
];

// Sample categories for demo
const sampleCategories = [
  { id: 1, name: "Work", color: "#F97316" },
  { id: 2, name: "Study", color: "#8B5CF6" },
  { id: 3, name: "Personal", color: "#10B981" }
];

export default function SessionsPage() {
  const { isPremium } = useAuth();
  const { categories } = useCategories();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["/api/timer-sessions"],
    enabled: isPremium
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Filter sessions by category
  const filteredSessions = categoryFilter === "all"
    ? sessions
    : sessions?.filter(session => session.categoryId.toString() === categoryFilter);

  // Get category name and color
  const getCategoryInfo = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return {
      name: category?.name || "Unknown",
      color: category?.color || "#cccccc"
    };
  };

  // Get sample category name and color
  const getSampleCategoryInfo = (categoryId: number) => {
    const category = sampleCategories.find(cat => cat.id === categoryId);
    return {
      name: category?.name || "Unknown",
      color: category?.color || "#cccccc"
    };
  };

  if (!isPremium) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="relative">
            {/* Demo Session Data */}
            <div className="space-y-6 opacity-85 blur-[1px]">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Session History</h1>
                
                <div className="flex items-center space-x-2">
                  <Select
                    value="all"
                    disabled
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Search sessions..."
                    className="max-w-sm"
                    disabled
                  />
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sampleSessions.map((session) => {
                        const category = getSampleCategoryInfo(session.categoryId);
                        return (
                          <TableRow key={session.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <TimerIcon className="h-4 w-4 mr-2" />
                                <span className="capitalize">{session.timerType}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: category.color }}
                                ></div>
                                {category.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                {formatTimeDisplay(session.duration)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                {formatDate(session.startTime)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {session.completed ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                  Completed
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                  In Progress
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="text-center p-6 max-w-md">
                <h2 className="text-2xl font-bold mb-2">Unlock Session History</h2>
                <p className="text-muted-foreground mb-6">
                  Track and review all your timer sessions over time. Upgrade to premium to access your complete session history.
                </p>
                <Button asChild className="bg-amber-500 hover:bg-amber-600">
                  <Link href="/subscribe" className="inline-flex items-center">
                    Upgrade to Premium
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Session History</h1>
          
          <div className="flex items-center space-x-2">
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Search sessions..."
              className="max-w-sm"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <SessionsTableSkeleton />
            ) : filteredSessions?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => {
                    const category = getCategoryInfo(session.categoryId);
                    return (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <TimerIcon className="h-4 w-4 mr-2" />
                            <span className="capitalize">{session.timerType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            {category.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            {formatTimeDisplay(session.duration)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            {formatDate(session.startTime)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {session.completed ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                              In Progress
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <ClockIcon className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium">No sessions found</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {categoryFilter === "all"
                    ? "Start tracking your time to record sessions"
                    : "No sessions for this category"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

function SessionsTableSkeleton() {
  return (
    <div className="w-full">
      <div className="border-b">
        <div className="flex h-10 items-center px-4">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[100px] ml-auto" />
          <Skeleton className="h-4 w-[100px] ml-4" />
          <Skeleton className="h-4 w-[100px] ml-4" />
          <Skeleton className="h-4 w-[100px] ml-4" />
        </div>
      </div>
      <div>
        {Array(5).fill(null).map((_, i) => (
          <div key={i} className="flex h-16 items-center px-4 border-b">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[120px] ml-auto" />
            <Skeleton className="h-4 w-[80px] ml-4" />
            <Skeleton className="h-4 w-[150px] ml-4" />
            <Skeleton className="h-6 w-[100px] ml-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
