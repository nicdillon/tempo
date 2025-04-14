// Defines the structure for analytics data returned by the API

export interface TimeByCategory {
  id: number;
  name: string;
  color: string;
  totalTime: number; // Total duration in seconds for this category
  percentage: number; // Percentage of total time for this category
}

export interface TimeByDayOfWeek {
  day: string; // e.g., 'Monday', 'Tuesday'
  totalTime: number; // Total duration in seconds for this day
}

export class AnalyticsData {
  totalTime: number; // Total duration in seconds across all sessions
  timeByCategory: TimeByCategory[];
  timeByDayOfWeek: TimeByDayOfWeek[];
  sessionsCount: number; // Total number of sessions recorded

  constructor(data: {
    totalTime: number;
    timeByCategory: TimeByCategory[];
    timeByDayOfWeek: TimeByDayOfWeek[];
    sessionsCount: number;
  }) {
    this.totalTime = data.totalTime;
    this.timeByCategory = data.timeByCategory;
    this.timeByDayOfWeek = data.timeByDayOfWeek;
    this.sessionsCount = data.sessionsCount;
  }

  // Optional: Add methods here for data manipulation or formatting if needed
  // e.g., formatTotalTime()
}
