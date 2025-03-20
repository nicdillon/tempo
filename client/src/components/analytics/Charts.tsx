import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryData {
  id: number;
  name: string;
  color: string;
  totalTime: number;
  percentage: number;
}

interface DayData {
  day: string;
  totalTime: number;
}

interface AnalyticsData {
  totalTime: number;
  timeByCategory: CategoryData[];
  timeByDayOfWeek: DayData[];
  sessionsCount: number;
}

interface ChartsProps {
  data: AnalyticsData;
}

export function Charts({ data }: ChartsProps) {
  // Format minutes for display
  const formatMinutes = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Category Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Time by Category</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.timeByCategory.filter(cat => cat.totalTime > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="totalTime"
                nameKey="name"
                label={({ name, percent }) => 
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {data.timeByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatMinutes(value)}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Day of Week Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Time by Day of Week</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.timeByDayOfWeek}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis tickFormatter={(value) => formatMinutes(value)} />
              <Tooltip formatter={(value: number) => formatMinutes(value)} />
              <Bar 
                dataKey="totalTime" 
                name="Total Time" 
                fill="var(--primary)" 
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
