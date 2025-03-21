import { AuthContext } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useContext, useEffect } from "react";

/**
 * Protected Route Component
 * 
 * This component wraps routes that require authentication.
 * It checks if the user is authenticated and redirects to the login page if not.
 * 
 * NOTE: This component must be used within an AuthProvider.
 */
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const authContext = useContext(AuthContext);
  const [, navigate] = useLocation();

  // Check if no authContext provided
  if (!authContext) {
    console.error("Protected route used outside of AuthProvider");
    // Redirect to auth page
    useEffect(() => {
      navigate("/auth");
    }, [navigate]);
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const { user, isLoading } = authContext;

  // Use useEffect for navigation to avoid React rendering issues
  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to auth page if not authenticated
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // If not authenticated and not loading, show spinner while redirecting
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // User is authenticated, render the protected component
  return <Component />;
}
