import { MainLayout } from "@/components/layouts/MainLayout";
import { PremiumLock } from "@/components/ui/premium-lock";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { useAuth } from "@/hooks/use-auth";

export default function AnalyticsPage() {
  const { isPremium } = useAuth();

  return (
    <MainLayout>
      {isPremium ? (
        <AnalyticsDashboard />
      ) : (
        <PremiumLock 
          title="Analytics Dashboard" 
          description="Get detailed insights and visualizations about your time usage patterns. Upgrade to access your analytics dashboard."
        />
      )}
    </MainLayout>
  );
}
