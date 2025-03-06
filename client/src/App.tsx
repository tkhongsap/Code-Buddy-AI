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
import KeypressTestPage from "./KeypressTestPage";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "./hooks/use-theme";

/*
 * Provider order is important:
 * 1. ThemeProvider - Theme context
 * 2. QueryClientProvider - React Query for API requests
 * 3. Router components (Switch/Route) - Navigation structure
 * 4. AuthProvider - Auth context within the Router
 */
function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Switch>
            <Route path="/">
              <Landing />
            </Route>
            
            <Route path="/auth">
              <AuthPage />
            </Route>
            
            <Route path="/simple-chat">
              <SimpleChat />
            </Route>
            
            <Route path="/dashboard">
              <ProtectedRoute path="/dashboard" component={Dashboard} />
            </Route>
            
            <Route path="/chat">
              <ProtectedRoute path="/chat" component={ChatInterface} />
            </Route>
            
            <Route path="/learning">
              <ProtectedRoute path="/learning" component={LearningProgress} />
            </Route>
            
            <Route path="/keypress-test">
              <KeypressTestPage />
            </Route>
            
            <Route>
              <NotFound />
            </Route>
          </Switch>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
