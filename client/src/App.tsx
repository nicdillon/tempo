import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { TimerProvider, TimerContext } from "@/components/providers/TimerProvider";
import { TimerMinimal } from "@/components/timer/TimerMinimal";
import HomePage from "@/pages/index";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import AnalyticsPage from "@/pages/analytics";
import SessionsPage from "@/pages/sessions";
import SettingsPage from "@/pages/settings";
import SubscribePage from "@/pages/subscribe";
import CheckoutPage from "@/pages/checkout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/sessions" component={SessionsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/subscribe" component={SubscribePage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Component to render minimized timer
function MinimizedTimerDisplay() {
  try {
    // Using useContext directly to handle errors gracefully
    const context = React.useContext(TimerContext);
    if (context && context.minimizedTimer && context.isRunning) {
      return <TimerMinimal />;
    }
  } catch (error) {
    console.error("Error rendering minimized timer:", error);
  }
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <AuthProvider>
          <TimerProvider>
            <Router />
            <MinimizedTimerDisplay />
            <Toaster />
          </TimerProvider>
        </AuthProvider>
      </SupabaseProvider>
    </QueryClientProvider>
  );
}

export default App;
