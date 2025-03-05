import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

export default function Header() {
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

  // Update current path for active link styling
  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  // Handle scroll for potential header styling changes
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setCurrentPath(path);
  };

  const scrollToFeatures = () => {
    if (window.location.pathname === "/") {
      document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur ${isScrolled ? 'shadow-sm' : ''}`}>
      <div className="container flex h-16 items-center justify-between py-4">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6"></path>
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>
            </svg>
          </div>
          <span className="text-xl font-bold hidden sm:inline-block">AI Code Buddy</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {!user ? (
            <>
              <Button 
                variant="ghost" 
                onClick={scrollToFeatures}
                className="text-foreground/70 hover:text-foreground hover:bg-transparent"
              >
                Features
              </Button>
              <Button 
                variant="ghost" 
                className="text-foreground/70 hover:text-foreground hover:bg-transparent"
              >
                Pricing
              </Button>
              <Button 
                variant="ghost" 
                className="text-foreground/70 hover:text-foreground hover:bg-transparent"
              >
                Docs
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/auth")} 
                className="text-primary hover:text-primary hover:bg-transparent"
              >
                Log in
              </Button>
              <Button onClick={() => navigate("/auth")}>
                Get Started
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => handleNavigation("/dashboard")}
                className={`text-foreground/70 hover:text-foreground hover:bg-transparent ${currentPath === "/dashboard" ? "text-primary font-medium" : ""}`}
              >
                Dashboard
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleNavigation("/chat")}
                className={`text-foreground/70 hover:text-foreground hover:bg-transparent ${currentPath === "/chat" ? "text-primary font-medium" : ""}`}
              >
                AI Chat
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleNavigation("/learning")}
                className={`text-foreground/70 hover:text-foreground hover:bg-transparent ${currentPath === "/learning" ? "text-primary font-medium" : ""}`}
              >
                Learning
              </Button>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                  <span className="text-sm font-medium">
                    {user.username.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="text-sm font-medium">{user.username}</div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout} 
                  className="text-muted-foreground hover:text-destructive"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </Button>
              </div>
            </>
          )}

          {/* Theme Toggle */}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg"
          >
            {theme === "dark" ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </Button>
        </nav>

        {/* Mobile Menu */}
        <div className="flex items-center md:hidden gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setTheme(theme === "system" ? "light" : theme === "light" ? "dark" : "system")}
            className="px-2"
          >
            {theme === "light" ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
              </svg>
            ) : theme === "dark" ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            )}
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 py-4">
                {!user ? (
                  <>
                    <Button 
                      variant="ghost" 
                      onClick={scrollToFeatures}
                      className="justify-start"
                    >
                      Features
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start"
                    >
                      Pricing
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start"
                    >
                      Docs
                    </Button>
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex gap-2 items-center mb-3">
                        <span className="text-sm text-muted-foreground">Theme:</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setTheme("light")}
                          className={`px-3 text-xs ${theme === "light" ? "bg-primary/10 border-primary/30 text-primary" : ""}`}
                        >
                          Light
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setTheme("dark")}
                          className={`px-3 text-xs ${theme === "dark" ? "bg-primary/10 border-primary/30 text-primary" : ""}`}
                        >
                          Dark
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setTheme("system")}
                          className={`px-3 text-xs ${theme === "system" ? "bg-primary/10 border-primary/30 text-primary" : ""}`}
                        >
                          System
                        </Button>
                      </div>
                      <Button 
                        onClick={() => navigate("/auth")} 
                        variant="outline" 
                        className="w-full"
                      >
                        Log in
                      </Button>
                      <Button 
                        onClick={() => navigate("/auth")} 
                        className="w-full"
                      >
                        Get Started
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleNavigation("/dashboard")}
                      className={`justify-start ${currentPath === "/dashboard" ? "text-primary font-medium" : ""}`}
                    >
                      Dashboard
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleNavigation("/chat")}
                      className={`justify-start ${currentPath === "/chat" ? "text-primary font-medium" : ""}`}
                    >
                      AI Chat
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleNavigation("/learning")}
                      className={`justify-start ${currentPath === "/learning" ? "text-primary font-medium" : ""}`}
                    >
                      Learning
                    </Button>
                    <div className="border-t pt-4 space-y-4">
                      <div className="flex gap-2 items-center mb-3">
                        <span className="text-sm text-muted-foreground">Theme:</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setTheme("light")}
                          className={`px-3 text-xs ${theme === "light" ? "bg-primary/10 border-primary/30 text-primary" : ""}`}
                        >
                          Light
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setTheme("dark")}
                          className={`px-3 text-xs ${theme === "dark" ? "bg-primary/10 border-primary/30 text-primary" : ""}`}
                        >
                          Dark
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setTheme("system")}
                          className={`px-3 text-xs ${theme === "system" ? "bg-primary/10 border-primary/30 text-primary" : ""}`}
                        >
                          System
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between border-t pt-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                            <span className="text-sm font-medium">
                              {user.username.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm font-medium">{user.username}</div>
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={handleLogout} 
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                          </svg>
                          Sign out
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
