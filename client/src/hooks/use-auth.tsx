import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Mock user for testing purposes
  const mockDemoUser: SelectUser = {
    id: 1,
    username: "demo",
    password: "hashed-password",
    createdAt: new Date()
  };
  
  // Uncomment to auto-login for testing purposes
  /*
  useEffect(() => {
    queryClient.setQueryData(["/api/user"], mockDemoUser);
  }, []);
  */
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Create a dedicated demo login mutation
  const demoLoginMutation = useMutation({
    mutationFn: async () => {
      console.log("Attempting demo login");
      const res = await apiRequest("POST", "/api/demo-login");
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      console.log("Demo login successful");
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      console.error("Demo login error:", error);
      toast({
        title: "Demo login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Regular login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Special case for demo user
      if (credentials.username === "demo" && credentials.password === "1234") {
        console.log("Redirecting to demo login");
        return demoLoginMutation.mutateAsync();
      }
      
      // Regular login flow
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
