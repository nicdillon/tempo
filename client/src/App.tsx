import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { TimerProvider } from "@/components/providers/TimerProvider";
import { GlobalTimerDisplay } from "@/components/timer/GlobalTimerDisplay";
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <AuthProvider>
          <TimerProvider>
            <Router />
            <GlobalTimerDisplay />
            <Toaster />
          </TimerProvider>
        </AuthProvider>
      </SupabaseProvider>
    </QueryClientProvider>
  );
}

export default App;
