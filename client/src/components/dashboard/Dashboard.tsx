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
import { marked } from "marked";
import DOMPurify from "dompurify";

// Add Message interface to match the one in ChatInterface.tsx
interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  html?: string;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);
  // State to track expanded query cards
  const [expandedQueries, setExpandedQueries] = useState<number[]>([]);
  // State to track if a response has been copied
  const [copiedResponse, setCopiedResponse] = useState<number | null>(null);

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
      query: string; // User's question
      aiResponse?: string; // AI's response
      fullContent?: string; // Full conversation content
      timestamp: string; // Timestamp of the query
      responseTimestamp?: string; // Timestamp of the response
      tags: string[];
      sessionId: number;
      conversation?: Message[]; // Full conversation thread between user and AI
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

  // Function to collapse all query cards
  const collapseAll = () => {
    setExpandedQueries([]);
  };

  // Function to copy response to clipboard
  const copyToClipboard = (text: string, id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedResponse(id);
        setTimeout(() => setCopiedResponse(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  // Helper function to truncate text for preview
  const truncateText = (text: string, maxLength: number = 75) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Function to format AI responses similar to ChatInterface
  const formatAIResponse = (text: string): string => {
    try {
      // Using a simpler implementation that doesn't rely on custom renderer
      let htmlContent = marked.parse(text);
      
      // Safety: sanitize HTML to prevent XSS attacks
      let sanitizedHtml: string;
      
      // Use type assertion to access DOMPurify's sanitize function
      const purify = DOMPurify as any;
      if (purify.sanitize) {
        sanitizedHtml = purify.sanitize(htmlContent);
      } else if (purify.default && purify.default.sanitize) {
        sanitizedHtml = purify.default.sanitize(htmlContent);
      } else {
        // Fallback if DOMPurify isn't working as expected
        console.warn('DOMPurify not available, using unsanitized HTML');
        sanitizedHtml = htmlContent as string;
      }
      
      return sanitizedHtml;
    } catch (error) {
      console.error('Error formatting markdown:', error);
      // Return a safe fallback
      return `<p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
    }
  };

  // Interface for developer tips
  interface DeveloperTip {
    id: number;
    title: string;
    description: string;
    iconType: string;
    actionType: string;
    isNew: boolean;
  }

  interface DeveloperTipsData {
    tips: DeveloperTip[];
    error?: string;
  }

  // Fetch dashboard data from the API
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useQuery<DashboardData>({
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
  
  // Fetch developer tips from the API
  const { data: developerTipsData, isLoading: isTipsLoading, error: tipsError, refetch: refetchTips } = useQuery<DeveloperTipsData>({
    queryKey: ["/api/developer-tips"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/developer-tips');
        if (!response.ok) {
          console.error('Developer tips API error:', response.status, response.statusText);
          throw new Error(`Developer tips API error: ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        console.error('Developer tips fetch error:', err);
        throw err;
      }
    }
  });

  // Add debug logging
  useEffect(() => {
    if (dashboardData) {
      console.log('Dashboard data loaded:', dashboardData);
    }
    if (dashboardError) {
      console.error('Dashboard query error:', dashboardError);
    }
  }, [dashboardData, dashboardError]);

  // No chart to initialize since we removed the Weekly Activity chart
  useEffect(() => {
    // Any initialization code can go here if needed
  }, []);

  // Process code blocks after rendering
  useEffect(() => {
    if (!dashboardData) return;

    // Function to load Prism and process code blocks
    const loadPrismAndProcessCodeBlocks = async () => {
      try {
        // Target code elements in expanded AI responses
        const codeElements = document.querySelectorAll('.dashboard-ai-response pre code, .code-block');
        
        if (codeElements.length === 0) return;
        
        const Prism = await import('prismjs');
        
        // Load commonly used languages in parallel
        await Promise.all([
          import('prismjs/components/prism-javascript'),
          import('prismjs/components/prism-jsx'),
          import('prismjs/components/prism-typescript'),
          import('prismjs/components/prism-tsx'),
          import('prismjs/components/prism-css'),
          import('prismjs/components/prism-python'),
          import('prismjs/components/prism-java'),
          import('prismjs/components/prism-json'),
          import('prismjs/components/prism-bash'),
        ]);
        
        // Process code blocks
        codeElements.forEach(element => {
          try {
            // Try to determine language from class (e.g., "language-python")
            let language = 'text';
            element.classList.forEach(className => {
              if (className.startsWith('language-')) {
                language = className.replace('language-', '');
              }
            });
            
            // Set language class if not already present
            if (!element.classList.contains(`language-${language}`)) {
              element.className = `language-${language}`;
            }
            
            // Highlight with Prism
            if (element instanceof HTMLElement) {
              Prism.default.highlightElement(element);
            }
            
            // Style the parent pre element
            const preElement = element.parentElement;
            if (preElement && preElement.tagName === 'PRE') {
              preElement.classList.add('code-block-pre');
              preElement.style.backgroundColor = 'var(--editor-bg, #1e1e1e)';
              preElement.style.color = 'var(--code-fg, #d4d4d4)';
              preElement.style.margin = '0';
              preElement.style.padding = '1rem';
              preElement.style.borderRadius = '4px';
              preElement.style.overflow = 'auto';
            }
          } catch (error) {
            console.warn('Error processing code element:', error);
          }
        });
      } catch (error) {
        console.error('Error loading Prism or languages:', error);
      }
    };
    
    // Only run when there are expanded queries
    if (expandedQueries.length > 0) {
      loadPrismAndProcessCodeBlocks();
    }
  }, [dashboardData, expandedQueries]);

  // Debug logging for developer tips
  useEffect(() => {
    if (developerTipsData) {
      console.log('Developer tips data loaded:', developerTipsData);
    }
    if (tipsError) {
      console.error('Developer tips query error:', tipsError);
    }
  }, [developerTipsData, tipsError]);

  if (isDashboardLoading) {
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
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={collapseAll}
                      className="text-xs h-8"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <polyline points="4 14 10 14 10 20"></polyline>
                        <polyline points="20 10 14 10 14 4"></polyline>
                        <line x1="14" y1="10" x2="21" y2="3"></line>
                        <line x1="3" y1="21" x2="10" y2="14"></line>
                      </svg>
                      Collapse All
                    </Button>
                    <Button variant="link" size="sm" className="text-primary" onClick={() => navigate("/chat")}>View All</Button>
                  </div>
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
                              <div className="flex items-center gap-1">
                                {/* User Icon */}
                                <div className="text-slate-500 dark:text-slate-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                  </svg>
                                </div>
                                <h3 className="font-medium text-base">
                                  <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Query:</span> 
                                  {truncateText(query.query)}
                                </h3>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">{query.timestamp}</span>
                          </div>
                          
                          {/* Preview of AI Response (collapsed state) */}
                          {!expandedQueries.includes(query.id) && query.aiResponse && (
                            <div className="pl-7 ml-1 border-l-2 border-dashed border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-1 mt-1 mb-1">
                                {/* AI Icon */}
                                <div className="text-primary">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <path d="M12 8v8"></path>
                                    <path d="M8 12h8"></path>
                                  </svg>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  <span className="text-xs text-primary mr-1">AI:</span> 
                                  {/* Strip markdown and code blocks for preview */}
                                  {truncateText(
                                    query.aiResponse
                                      .replace(/```[\s\S]*?```/g, '[Code Block]') // Replace code blocks
                                      .replace(/\*\*(.*?)\*\*/g, '$1')           // Remove bold syntax
                                      .replace(/\*(.*?)\*/g, '$1')               // Remove italic syntax
                                      .replace(/\[(.*?)\]\(.*?\)/g, '$1')        // Replace links with just the text
                                      .replace(/#{1,6}\s?(.*?)$/gm, '$1')        // Remove headers
                                      .trim(), 
                                    100
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            {query.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          {!expandedQueries.includes(query.id) && (
                            <div className="flex justify-between items-center px-4 pb-1 pt-2 text-xs text-muted-foreground">
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
                            {query.conversation ? (
                              // Display full conversation if available
                              <div className="space-y-3 mt-3">
                                {query.conversation.map((message, index) => (
                                  <div key={message.id} className="mb-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className={`p-1 rounded-full ${
                                        message.sender === 'user' 
                                          ? 'bg-slate-100 dark:bg-slate-700' 
                                          : 'bg-primary/10 dark:bg-primary/20 text-primary'
                                      }`}>
                                        {message.sender === 'user' ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                          </svg>
                                        ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <path d="M12 8v8"></path>
                                            <path d="M8 12h8"></path>
                                          </svg>
                                        )}
                                      </div>
                                      <span className={`font-medium ${message.sender === 'ai' ? 'text-primary' : ''}`}>
                                        {message.sender === 'user' ? 'User' : 'AI'}
                                      </span>
                                      <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                                    </div>
                                    <div className="pl-8">
                                      <div className={`p-3 rounded-md ${
                                        message.sender === 'user' 
                                          ? 'bg-slate-50 dark:bg-slate-800/50' 
                                          : 'bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 text-slate-700 dark:text-slate-200'
                                      }`}>
                                        {message.sender === 'ai' && message.html ? (
                                          <div className="dashboard-ai-response" dangerouslySetInnerHTML={{ __html: message.html || formatAIResponse(message.content) }} />
                                        ) : (
                                          <div className="whitespace-pre-wrap">{message.content}</div>
                                        )}
                                        
                                        {/* Copy button for AI responses */}
                                        {message.sender === 'ai' && (
                                          <div className="relative flex justify-end mt-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0"
                                              onClick={(e) => copyToClipboard(message.content, message.id, e)}
                                            >
                                              {copiedResponse === message.id ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                  <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                              ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                </svg>
                                              )}
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              // Fallback to the original single query-response display if conversation is not available
                              <>
                                {/* User Query */}
                                <div className="mb-3 mt-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-700">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                      </svg>
                                    </div>
                                    <span className="font-medium">User Query</span>
                                    <span className="text-xs text-muted-foreground">{query.timestamp}</span>
                                  </div>
                                  <div className="pl-8">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                                      {query.query}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* AI Response */}
                                <div className="mb-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="p-1 rounded-full bg-primary/10 dark:bg-primary/20 text-primary">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <path d="M12 8v8"></path>
                                        <path d="M8 12h8"></path>
                                      </svg>
                                    </div>
                                    <span className="font-medium text-primary">AI Response</span>
                                    <span className="text-xs text-muted-foreground">{query.responseTimestamp || query.timestamp}</span>
                                  </div>
                                  <div className="pl-8 relative">
                                    <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-md border border-primary/10 dark:border-primary/20 text-slate-700 dark:text-slate-200">
                                      {query.aiResponse ? (
                                        <div 
                                          className="dashboard-ai-response" 
                                          dangerouslySetInnerHTML={{ __html: formatAIResponse(query.aiResponse) }}
                                        />
                                      ) : (
                                        <div className="text-muted-foreground text-sm italic">
                                          AI response not available.
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Copy button */}
                                    {query.aiResponse && (
                                      <div className="absolute top-2 right-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={(e) => copyToClipboard(query.aiResponse || "", query.id, e)}
                                        >
                                          {copiedResponse === query.id ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                          ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                            </svg>
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                            
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

          {/* Personalized Developer Tips */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Personalized Developer Tips</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-0"
                  onClick={() => refetchTips()}
                  disabled={isTipsLoading}
                >
                  {isTipsLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M21 2v6h-6"></path>
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                        <path d="M3 22v-6h6"></path>
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                      </svg>
                      Refresh
                    </>
                  )}
                </Button>
              </div>
              
              {isTipsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : tipsError ? (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>Failed to generate personalized developer tips</p>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    We're currently unable to analyze your chat history to create personalized recommendations.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => refetchTips()}
                    className="bg-primary/10 hover:bg-primary/20 border-primary/20"
                  >
                    Try Again
                  </Button>
                </div>
              ) : developerTipsData?.message ? (
                <div className="text-center py-8">
                  <div className="text-amber-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <p>{developerTipsData.message}</p>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Continue using the AI Code Buddy to build up your chat history so we can provide personalized recommendations.
                  </p>
                  <Button 
                    onClick={() => navigate("/chat")} 
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Start a new chat
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {developerTipsData?.tips && developerTipsData.tips.length > 0 ? (
                    developerTipsData.tips.map((tip) => (
                    <div key={tip.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        {/* Dynamic icon based on tip type */}
                        <div className={`h-8 w-8 rounded flex items-center justify-center mr-3
                          ${tip.iconType === 'code' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                           tip.iconType === 'book-open' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' :
                           tip.iconType === 'database' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
                           tip.iconType === 'server' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                           tip.iconType === 'layout' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' :
                           tip.iconType === 'git-branch' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600' :
                           tip.iconType === 'terminal' ? 'bg-slate-100 dark:bg-slate-900/30 text-slate-600' :
                           tip.iconType === 'shield' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                           tip.iconType === 'zap' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' :
                           tip.iconType === 'cpu' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600' :
                           'bg-gray-100 dark:bg-gray-900/30 text-gray-600'}`
                        }>
                          {/* Render the appropriate icon based on type */}
                          {tip.iconType === 'code' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m18 16 4-4-4-4"></path>
                              <path d="m6 8-4 4 4 4"></path>
                              <path d="m14.5 4-5 16"></path>
                            </svg>
                          )}
                          {tip.iconType === 'book-open' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                            </svg>
                          )}
                          {tip.iconType === 'database' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                              <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
                            </svg>
                          )}
                          {tip.iconType === 'server' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                              <line x1="6" y1="6" x2="6.01" y2="6"></line>
                              <line x1="6" y1="18" x2="6.01" y2="18"></line>
                            </svg>
                          )}
                          {tip.iconType === 'layout' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="3" y1="9" x2="21" y2="9"></line>
                              <line x1="9" y1="21" x2="9" y2="9"></line>
                            </svg>
                          )}
                          {tip.iconType === 'git-branch' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="6" y1="3" x2="6" y2="15"></line>
                              <circle cx="18" cy="6" r="3"></circle>
                              <circle cx="6" cy="18" r="3"></circle>
                              <path d="M18 9a9 9 0 0 1-9 9"></path>
                            </svg>
                          )}
                          {tip.iconType === 'terminal' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="4 17 10 11 4 5"></polyline>
                              <line x1="12" y1="19" x2="20" y2="19"></line>
                            </svg>
                          )}
                          {tip.iconType === 'shield' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                          )}
                          {tip.iconType === 'zap' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>
                          )}
                          {tip.iconType === 'cpu' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                              <rect x="9" y="9" width="6" height="6"></rect>
                              <line x1="9" y1="1" x2="9" y2="4"></line>
                              <line x1="15" y1="1" x2="15" y2="4"></line>
                              <line x1="9" y1="20" x2="9" y2="23"></line>
                              <line x1="15" y1="20" x2="15" y2="23"></line>
                              <line x1="20" y1="9" x2="23" y2="9"></line>
                              <line x1="20" y1="14" x2="23" y2="14"></line>
                              <line x1="1" y1="9" x2="4" y2="9"></line>
                              <line x1="1" y1="14" x2="4" y2="14"></line>
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center">
                          <h3 className="font-medium">{tip.title}</h3>
                          {tip.isNew && (
                            <span className="ml-2 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-sm">New</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {tip.description}
                      </p>
                      <div className="flex justify-end items-center">
                        <Button variant="link" size="sm" className="text-primary p-0">{tip.actionType}</Button>
                      </div>
                    </div>
                  ))) : (
                    <div className="col-span-3 text-center py-8">
                      <div className="text-amber-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <p>No tips available</p>
                      </div>
                      <p className="text-muted-foreground">
                        Unable to generate personalized developer tips at this time.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
