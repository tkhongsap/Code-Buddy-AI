import { useState, useEffect, useRef } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { mockLearningData } from "@/lib/mock-data";

export default function LearningProgress() {
  const [timeRange, setTimeRange] = useState("30days");
  const progressRingRef = useRef<SVGSVGElement>(null);

  // Fetch learning progress data (using mock for now)
  const { data: learningData, isLoading } = useQuery({
    queryKey: ["/api/learning-progress", timeRange],
    queryFn: async () => {
      // In a real implementation, this would fetch from the API with the timeRange
      return mockLearningData;
    },
  });

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
      <main className="flex-grow bg-slate-50 dark:bg-slate-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Learning Progress</h1>
              <p className="text-muted-foreground mt-1">Track your skills and knowledge development</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Select 
                defaultValue={timeRange} 
                onValueChange={(value) => setTimeRange(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="alltime">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Overall Progress */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-6">Overall Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Learning completion</span>
                      <span className="text-sm text-muted-foreground">{learningData?.overallProgress.completion}%</span>
                    </div>
                    <Progress 
                      value={learningData?.overallProgress.completion} 
                      className="h-4 bg-gradient-to-r from-primary to-purple-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Courses Completed</p>
                      <p className="text-2xl font-bold text-primary">{learningData?.overallProgress.coursesCompleted}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Active Courses</p>
                      <p className="text-2xl font-bold text-green-600">{learningData?.overallProgress.activeCourses}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Practice Hours</p>
                      <p className="text-2xl font-bold text-purple-600">{learningData?.overallProgress.practiceHours}</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Streak Days</p>
                      <p className="text-2xl font-bold text-yellow-600">{learningData?.overallProgress.streakDays}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ProgressRing 
                    value={learningData?.overallProgress.completion || 0} 
                    size={240} 
                    strokeWidth={16}
                    strokeColor="rgb(59, 130, 246)"
                    ref={progressRingRef}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">{learningData?.overallProgress.completion}%</span>
                      <span className="text-sm text-muted-foreground">Overall Progress</span>
                    </div>
                  </ProgressRing>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skill Breakdown */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-6">Skill Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {learningData?.skills.map((skill, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium flex items-center">
                        <span 
                          className="inline-block w-5 h-5 mr-2 text-center" 
                          dangerouslySetInnerHTML={{ __html: skill.icon }} 
                        />
                        {skill.name}
                      </span>
                      <span className="text-sm text-muted-foreground">{skill.level}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full">
                      <div 
                        className="h-3 rounded-full" 
                        style={{ width: `${skill.progress}%`, backgroundColor: skill.color }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-muted-foreground">{skill.progress}%</span>
                      <span style={{ color: skill.color }}>{skill.monthlyGain > 0 ? `+${skill.monthlyGain}% this month` : 'No change'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Courses */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-6">Active Courses</h2>
              <div className="space-y-6">
                {learningData?.activeCourses.map((course, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex">
                        <div 
                          className={`h-12 w-12 rounded bg-${course.colorClass} flex items-center justify-center mr-4`}
                          dangerouslySetInnerHTML={{ __html: course.icon }}
                        ></div>
                        <div>
                          <h3 className="font-medium">{course.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={`bg-${course.statusColorClass} text-${course.statusTextClass}`}>
                        {course.status}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Progress: {course.progress}%</span>
                        <span className="text-sm text-muted-foreground">{course.completedLessons}/{course.totalLessons} lessons</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                    <div className="mt-4 flex justify-between">
                      <div className="text-xs text-muted-foreground">Last activity: {course.lastActivity}</div>
                      <Button variant="link" size="sm" className="text-primary h-auto p-0">Continue Course</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Learning Recommendations */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Recommended for You</h2>
                <div className="text-sm text-muted-foreground">
                  Based on your learning patterns and goals
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {learningData?.recommendations.map((recommendation, index) => (
                  <div key={index} className="border border-border rounded-lg overflow-hidden">
                    <div className="h-40 bg-slate-200 dark:bg-slate-700 relative">
                      <img 
                        src={recommendation.thumbnailUrl} 
                        alt={`${recommendation.title} thumbnail`} 
                        className="w-full h-full object-cover"
                      />
                      {recommendation.badge && (
                        <div className={`absolute top-2 right-2 bg-${recommendation.badgeColorClass} text-${recommendation.badgeTextClass} text-xs font-bold px-2 py-1 rounded`}>
                          {recommendation.badge}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium">{recommendation.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{recommendation.description}</p>
                      <div className="flex items-center mt-3">
                        <div className="text-yellow-400 flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg 
                              key={i} 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill={i < Math.floor(recommendation.rating) ? "currentColor" : "none"}
                              stroke="currentColor"
                              className="mr-0.5"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">{recommendation.rating} ({recommendation.reviewCount} reviews)</span>
                      </div>
                      <Button className="w-full mt-4">Start Course</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
