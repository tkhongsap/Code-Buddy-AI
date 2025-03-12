import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, BarChart2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import SkillRadarChart from "./SkillRadarChart";
import SkillList from "./SkillList";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LearningProgressData {
  overallProgress: {
    completion: number;
    coursesCompleted: number;
    activeCourses: number;
    practiceHours: number;
    streakDays: number;
  };
  skills?: {
    name: string;
    progress: number;
    level: string;
    lastUpdated: string;
  }[];
}

interface SkillRadarData {
  skillData: Record<string, number>;
  lastUpdated: string | null;
  message?: string;
}

export default function LearningProgress() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("summary");

  // Fetch learning progress data
  const { 
    data: learningData, 
    isLoading: isLearningDataLoading,
    error: learningDataError
  } = useQuery<LearningProgressData>({
    queryKey: ['/api/learning-progress'],
    refetchOnWindowFocus: false,
  });

  // Fetch skill radar data
  const { 
    data: skillRadarData,
    isLoading: isSkillRadarLoading,
    error: skillRadarError
  } = useQuery<SkillRadarData>({
    queryKey: ['/api/skills/radar'],
    refetchOnWindowFocus: false,
  });

  // Mutation to analyze skills
  const analyzeSkillsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/skills/analyze');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Skills analyzed successfully",
        description: "Your skill radar chart has been updated based on your chat history.",
      });
      // Refetch both queries to update the UI
      void queryClient.invalidateQueries({ queryKey: ['/api/learning-progress'] });
      void queryClient.invalidateQueries({ queryKey: ['/api/skills/radar'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to analyze skills",
        description: error.message || "There was an error analyzing your skills. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Determine if we're loading or have an error
  const isLoading = isLearningDataLoading || isSkillRadarLoading;
  const hasError = !!learningDataError || !!skillRadarError;

  // Default data if loading or error
  const learningProgress = learningData?.overallProgress || {
    completion: 0,
    coursesCompleted: 0,
    activeCourses: 0,
    practiceHours: 0,
    streakDays: 0
  };

  const hasSkillData = skillRadarData && Object.keys(skillRadarData.skillData).length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-slate-50 dark:bg-slate-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Learning Progress</h1>
              <p className="text-muted-foreground mt-1">Track your skills and knowledge development</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                onClick={() => analyzeSkillsMutation.mutate()}
                disabled={analyzeSkillsMutation.isPending}
                className="flex items-center"
              >
                {analyzeSkillsMutation.isPending && (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!analyzeSkillsMutation.isPending && (
                  <BarChart2 className="mr-2 h-4 w-4" />
                )}
                Analyze Skills
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {hasError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                There was a problem loading your learning data. Please try refreshing the page.
              </AlertDescription>
            </Alert>
          )}

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="skills">Skills Radar</TabsTrigger>
            </TabsList>

            {/* Summary Tab Content */}
            <TabsContent value="summary">
              {/* Overall Progress */}
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold mb-6">Overall Progress</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Learning completion</span>
                          <span className="text-sm text-muted-foreground">{learningProgress.completion}%</span>
                        </div>
                        <Progress 
                          value={learningProgress.completion} 
                          className="h-4 bg-gradient-to-r from-primary to-purple-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Courses Completed</p>
                          <p className="text-2xl font-bold text-primary">{learningProgress.coursesCompleted}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Active Courses</p>
                          <p className="text-2xl font-bold text-green-600">{learningProgress.activeCourses}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Practice Hours</p>
                          <p className="text-2xl font-bold text-purple-600">{learningProgress.practiceHours}</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Streak Days</p>
                          <p className="text-2xl font-bold text-yellow-600">{learningProgress.streakDays}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <ProgressRing 
                        value={learningProgress.completion} 
                        size={240} 
                        strokeWidth={16}
                        strokeColor="rgb(59, 130, 246)"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold">{learningProgress.completion}%</span>
                          <span className="text-sm text-muted-foreground">Overall Progress</span>
                        </div>
                      </ProgressRing>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Skills</CardTitle>
                  <CardDescription>
                    Based on your recent chats, here are your strongest skills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="py-6 text-center">
                      <p className="text-muted-foreground">Loading your skills data...</p>
                    </div>
                  ) : hasSkillData && learningData?.skills ? (
                    <SkillList 
                      skills={learningData.skills}
                      className="mt-2"
                    />
                  ) : (
                    <div className="py-6 text-center">
                      <p className="text-muted-foreground mb-4">
                        No skill data available yet. Start chatting with the AI to build your skill profile.
                      </p>
                      <Button 
                        onClick={() => navigate("/chat")}
                        variant="outline"
                      >
                        Go to Chat
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skills Radar Tab Content */}
            <TabsContent value="skills">
              <Card>
                <CardHeader>
                  <CardTitle>Skills Radar</CardTitle>
                  <CardDescription>
                    Visual representation of your skill proficiency across different domains
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {isLoading ? (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground">Loading your skills radar data...</p>
                    </div>
                  ) : hasSkillData ? (
                    <>
                      <SkillRadarChart 
                        skills={skillRadarData?.skillData || {}} 
                        className="mt-2 mb-6"
                      />
                      <Separator />
                      <div className="mt-4 text-xs text-muted-foreground text-right">
                        Last updated: {skillRadarData?.lastUpdated ? 
                          new Date(skillRadarData.lastUpdated).toLocaleString() : 
                          'Unknown'}
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground mb-4">
                        {skillRadarData?.message || 
                         "No skill data available yet. Chat with the AI to build your skill profile, then analyze your skills."}
                      </p>
                      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                        <Button 
                          onClick={() => navigate("/chat")}
                          variant="outline"
                        >
                          Go to Chat
                        </Button>
                        <Button
                          onClick={() => analyzeSkillsMutation.mutate()}
                          disabled={analyzeSkillsMutation.isPending}
                        >
                          {analyzeSkillsMutation.isPending && (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Analyze Skills
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
