import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "./components/theme-provider";
import { ProtectedRoute } from "./lib/protected-route";

// Pages
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import TradeJournal from "@/pages/trade-journal";
import AnalysisPage from "@/pages/analysis";
import LeaderboardsPage from "@/pages/leaderboards";
import GamificationPage from "@/pages/gamification";
import MentorshipPage from "@/pages/mentorship";
import SubscriptionPage from "@/pages/subscription";
import ProfilePage from "@/pages/profile";
import AdminPage from "@/pages/admin";
// Layout Components  
import Header from "./components/header";

function Router() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <Header />
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/journal" component={TradeJournal} />
        <ProtectedRoute path="/analysis" component={AnalysisPage} />
        <ProtectedRoute path="/leaderboards" component={LeaderboardsPage} />
        <ProtectedRoute path="/gamification" component={GamificationPage} />
        <ProtectedRoute path="/mentorship" component={MentorshipPage} />
        <ProtectedRoute path="/subscription" component={SubscriptionPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
