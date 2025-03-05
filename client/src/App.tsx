import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Landing from "./components/Landing";
import AuthPage from "./components/auth/AuthPage";
import Dashboard from "./components/dashboard/Dashboard";
import ChatInterface from "./components/chat/ChatInterface";
import SimpleChat from "./components/SimpleChat";
import LearningProgress from "./components/learning/LearningProgress";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "./hooks/use-theme";

// The Routes component is now defined inside the App component
// This ensures all context providers are available to routes
function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {/* Routes defined inside providers to ensure contexts are available */}
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/auth" component={AuthPage} />
            <Route path="/simple-chat" component={SimpleChat} />
            <ProtectedRoute path="/dashboard" component={Dashboard} />
            <ProtectedRoute path="/chat" component={ChatInterface} />
            <ProtectedRoute path="/learning" component={LearningProgress} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
