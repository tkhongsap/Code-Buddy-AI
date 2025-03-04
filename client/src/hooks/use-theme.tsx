import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize with a simple default value first
  const [theme, setTheme] = useState<Theme>("dark");
  
  // Then use useEffect to handle browser-specific API calls
  useEffect(() => {
    try {
      // Check for user's stored preference
      const storedTheme = localStorage.getItem("theme");
      
      if (storedTheme === "light" || storedTheme === "dark") {
        setTheme(storedTheme as Theme);
        return;
      }
      
      // Check for system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme("dark");
      }
    } catch (error) {
      console.error("Error accessing localStorage or matchMedia:", error);
    }
  }, []);

  useEffect(() => {
    try {
      // Update class on document
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      
      // Store preference
      localStorage.setItem("theme", theme);
    } catch (error) {
      console.error("Error updating theme:", error);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
