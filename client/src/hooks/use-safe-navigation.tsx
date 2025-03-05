import { useCallback } from 'react';
import { useLocation } from 'wouter';

/**
 * A custom hook for safe navigation in React
 * This prevents navigation during render which can cause React errors
 */
export function useSafeNavigation() {
  const [, navigate] = useLocation();
  
  // Return a memoized version of the navigate function wrapped in a callback
  // This is safe to use in event handlers, useEffect, etc.
  const safeNavigate = useCallback((path: string) => {
    // Use a timeout of 0 to ensure the navigation happens in the next tick
    // after the current render cycle completes
    setTimeout(() => {
      navigate(path);
    }, 0);
  }, [navigate]);
  
  return safeNavigate;
}