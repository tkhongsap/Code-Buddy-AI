import { useEffect, useRef } from "react";
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
  const { user } = useAuth();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  // Fetch dashboard data (using mock for now)
  const { data: dashboardData, isLoading } = useQuery<typeof mockDashboardData>({
    queryKey: ["/api/dashboard"],
    queryFn: async () => {
      // In a real implementation, this would fetch from the API
      return mockDashboardData;
    },
  });

  useEffect(() => {
    if (!chartRef.current || !dashboardData) return;

    // Only create chart if it doesn't exist yet
    if (!chartInstanceRef.current) {
      import('chart.js').then((Chart) => {
        const ctx = chartRef.current?.getContext('2d');
        if (!ctx) return;

        // Clear any existing charts
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }

        const isDark = document.documentElement.classList.contains('dark');
        
        chartInstanceRef.current = new Chart.Chart(ctx, {
          type: 'line',
          data: {
            labels: dashboardData.weeklyActivity.labels,
            datasets: [{
              label: 'AI Queries',
              data: dashboardData.weeklyActivity.data,
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      });
    }

    return () => {
      // Clean up chart instance on unmount
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [dashboardData]);

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
      <main className="flex-grow bg-slate-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <div className="flex items-center mb-2">
                <div className="h-6 w-1 bg-primary mr-2"></div>
                <h1 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight">DEVELOPER CONSOLE</h1>
              </div>
              <p className="text-muted-foreground mt-1 pl-3 border-l border-slate-700 text-sm font-mono">// track your progress and coding activity</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button 
                onClick={() => navigate("/chat")} 
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span className="font-mono text-sm">$ start_new_chat</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Queries */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-primary flex items-center justify-center mr-4">
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
                  <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center mr-4">
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

            {/* Active Courses */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Active Courses</p>
                    <h3 className="text-2xl font-bold">{dashboardData?.stats.activeCourses}</h3>
                  </div>
                </div>
                <div className="mt-4 text-sm text-green-600 dark:text-green-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>1 new this month</span>
                </div>
              </CardContent>
            </Card>

            {/* Skill Progress */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Avg. Skill Progress</p>
                    <h3 className="text-2xl font-bold">{dashboardData?.stats.skillProgress}%</h3>
                  </div>
                </div>
                <div className="mt-4 text-sm text-green-600 dark:text-green-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                    <polyline points="16 7 22 7 22 13"></polyline>
                  </svg>
                  <span>5% from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Chart & Recent Queries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Activity Chart */}
            <Card className="lg:col-span-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Weekly Activity</h2>
                  <Select defaultValue="thisWeek">
                    <SelectTrigger className="w-40 bg-transparent border-none text-sm text-muted-foreground focus:ring-0">
                      <SelectValue placeholder="This Week" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thisWeek">This Week</SelectItem>
                      <SelectItem value="lastWeek">Last Week</SelectItem>
                      <SelectItem value="lastMonth">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-64">
                  <canvas ref={chartRef} id="activity-chart"></canvas>
                </div>
              </CardContent>
            </Card>

            {/* Recent Queries */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Recent Queries</h2>
                  <Button variant="link" size="sm" className="text-primary">View All</Button>
                </div>
                <div className="space-y-4">
                  {dashboardData?.recentQueries.map((query, index) => (
                    <div key={index} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <p className="font-medium mb-1">{query.query}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {query.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{query.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Learning Progress */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Learning Progress</h2>
                <Button variant="link" size="sm" className="text-primary" onClick={() => navigate("/learning")}>
                  View Detailed Report
                </Button>
              </div>
              <div className="space-y-6">
                {dashboardData?.learningProgress.map((skill, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{skill.skill}</span>
                      <span className="text-sm text-muted-foreground">{skill.progress}%</span>
                    </div>
                    <Progress value={skill.progress} className="h-2.5" style={{
                      "--progress-foreground": skill.color
                    } as React.CSSProperties} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommended Learning */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Recommended Next Steps</h2>
                <Button variant="outline" size="sm" className="text-sm px-3 py-1 bg-primary/10 text-primary border-0">
                  Refresh
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Recommendation 1 */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="h-8 w-8 rounded bg-blue-100 dark:bg-blue-900/30 text-primary flex items-center justify-center mr-3">
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
                    <div className="h-8 w-8 rounded bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mr-3">
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
