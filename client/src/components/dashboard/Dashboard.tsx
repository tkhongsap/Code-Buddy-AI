import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressRing } from "@/components/ui/progress-ring";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { useAuth } from "@/hooks/use-auth";
import { mockDashboardData } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);
  // State to track expanded query cards
  const [expandedQueries, setExpandedQueries] = useState<number[]>([]);

  // Define a more specific type for our dashboard data
  interface DashboardData {
    stats: {
      totalQueries: number;
      savedSolutions: number;
    };
    weeklyActivity: {
      labels: string[];
      data: number[];
    };
    recentQueries: {
      id: number;
      query: string;
      fullContent?: string;
      timestamp: string;
      tags: string[];
      sessionId: number;
    }[];
  }

  // Function to toggle expanded state of a query card
  const toggleQueryExpansion = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to chat when clicking to expand
    setExpandedQueries(prev => 
      prev.includes(id) 
        ? prev.filter(queryId => queryId !== id) 
        : [...prev, id]
    );
  };

  // Helper function to truncate text for preview
  const truncateText = (text: string, maxLength: number = 75) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Fetch dashboard data from the API
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          console.error('Dashboard API error:', response.status, response.statusText);
          throw new Error(`Dashboard API error: ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        throw err;
      }
    }
  });

  // Add debug logging
  useEffect(() => {
    if (dashboardData) {
      console.log('Dashboard data loaded:', dashboardData);
    }
    if (error) {
      console.error('Dashboard query error:', error);
    }
  }, [dashboardData, error]);

  // No chart to initialize since we removed the Weekly Activity chart
  useEffect(() => {
    // Any initialization code can go here if needed
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-slate-50 dark:bg-slate-900 py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[80vh]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow dark:bg-slate-900 bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <div className="flex items-center mb-2">
                <div className="h-6 w-1 bg-primary mr-2"></div>
                <h1 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight dark:text-white text-slate-800">DEVELOPER CONSOLE</h1>
              </div>
              <p className="text-muted-foreground mt-1 pl-3 border-l dark:border-slate-700 border-slate-300 text-sm font-mono">// track your progress and coding activity</p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              <Button 
                onClick={() => navigate("/chat")} 
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span className="font-mono text-sm">$ start_new_chat</span>
              </Button>
              
              <Button 
                onClick={() => {
                  logoutMutation.mutate();
                  navigate("/");
                }}
                variant="outline"
                className="flex items-center gap-2 border-red-400 hover:bg-red-50 text-red-600 dark:hover:bg-red-950/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span className="font-mono text-sm">Logout</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {/* Total Queries */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      <path d="M13 8.2a2 2 0 1 0-3 1.8L8 14l4-1 .1 0a2 2 0 1 0 1-4.8"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Total Queries</p>
                    <h3 className="text-2xl font-bold">{dashboardData?.stats.totalQueries}</h3>
                  </div>
                </div>
                <div className="mt-4 text-sm text-green-600 dark:text-green-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                    <polyline points="16 7 22 7 22 13"></polyline>
                  </svg>
                  <span>12% from last week</span>
                </div>
              </CardContent>
            </Card>

            {/* Saved Solutions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Saved Solutions</p>
                    <h3 className="text-2xl font-bold">{dashboardData?.stats.savedSolutions}</h3>
                  </div>
                </div>
                <div className="mt-4 text-sm text-green-600 dark:text-green-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                    <polyline points="16 7 22 7 22 13"></polyline>
                  </svg>
                  <span>8% from last week</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Queries Card */}
          <div className="mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Recent Queries</h2>
                  <Button variant="link" size="sm" className="text-primary" onClick={() => navigate("/chat")}>View All</Button>
                </div>
                
                <div className="space-y-4">
                  {dashboardData?.recentQueries.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">No recent queries found</p>
                      <Button 
                        onClick={() => navigate("/chat")} 
                        className="bg-primary/90 hover:bg-primary text-white"
                      >
                        Start a new chat
                      </Button>
                    </div>
                  ) : (
                    dashboardData?.recentQueries.map((query) => (
                      <div key={query.id} className="border border-border rounded-lg overflow-hidden">
                        {/* Query Card Header - Always visible */}
                        <div 
                          className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          onClick={(e) => toggleQueryExpansion(query.id, e)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              {/* Expand/Collapse Icon */}
                              <div className="text-primary transition-transform duration-200" 
                                style={{ transform: expandedQueries.includes(query.id) ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                              </div>
                              <h3 className="font-medium text-base">{truncateText(query.query)}</h3>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">{query.timestamp}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            {query.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          {!expandedQueries.includes(query.id) && (
                            <div className="flex justify-between items-center px-4 pb-3 text-xs text-muted-foreground">
                              <span>Click to expand</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/chat?sessionId=${query.sessionId}`);
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                Continue Chat
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Expandable Query Content */}
                        {expandedQueries.includes(query.id) && (
                          <div className="px-4 pb-4 pt-0 animate-slideDown border-t border-border">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md mb-3">
                              {query.fullContent || 
                                <div className="text-muted-foreground text-sm italic">
                                  This is where the full conversation would appear. 
                                  In a real implementation, this would show the complete chat history.
                                </div>
                              }
                            </div>
                            
                            {/* Continue Chat Button */}
                            <div className="flex justify-end">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/chat?sessionId=${query.sessionId}`);
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                Continue Chat
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommended Learning */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Recommended Next Steps</h2>
                <Button variant="outline" size="sm" className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-0">
                  Refresh
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Recommendation 1 */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="h-8 w-8 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                      </svg>
                    </div>
                    <h3 className="font-medium">React Advanced Patterns</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Complete this course to master advanced React techniques like custom hooks and render props.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">25% completed</span>
                    <Button variant="link" size="sm" className="text-primary p-0">Continue</Button>
                  </div>
                </div>

                {/* Recommendation 2 */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="h-8 w-8 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m18 16 4-4-4-4"></path>
                        <path d="m6 8-4 4 4 4"></path>
                        <path d="m14.5 4-5 16"></path>
                      </svg>
                    </div>
                    <h3 className="font-medium">TypeScript Generics</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Practice with advanced TypeScript generics to improve your type safety in complex applications.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">New recommendation</span>
                    <Button variant="link" size="sm" className="text-primary p-0">Start</Button>
                  </div>
                </div>

                {/* Recommendation 3 */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="h-8 w-8 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
                      </svg>
                    </div>
                    <h3 className="font-medium">SQL Query Optimization</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Based on your recent queries, this topic will help you improve database performance.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Recommended for you</span>
                    <Button variant="link" size="sm" className="text-primary p-0">Explore</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
