import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize with a simple default value first
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  
  // Handle system theme changes
  useEffect(() => {
    try {
      // Get initial system theme
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setSystemTheme(isDarkMode ? "dark" : "light");
      
      // Listen for theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? "dark" : "light");
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (error) {
      console.error("Error setting up system theme detection:", error);
    }
  }, []);
  
  // Load saved theme preference
  useEffect(() => {
    try {
      // Check for user's stored preference
      const storedTheme = localStorage.getItem("theme") as Theme;
      
      if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
        setThemeState(storedTheme);
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, []);
  
  // Resolve and apply the theme
  useEffect(() => {
    try {
      // Determine the actual theme to apply
      const newResolvedTheme = theme === "system" ? systemTheme : theme;
      setResolvedTheme(newResolvedTheme);
      
      // Update class on document
      if (newResolvedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      
      // Store preference
      localStorage.setItem("theme", theme);
    } catch (error) {
      console.error("Error updating theme:", error);
    }
  }, [theme, systemTheme]);
  
  // Custom setter function that handles validation
  const setTheme = (newTheme: Theme) => {
    if (newTheme === "light" || newTheme === "dark" || newTheme === "system") {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
}
