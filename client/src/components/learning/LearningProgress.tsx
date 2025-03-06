import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { useLocation } from "wouter";

export default function LearningProgress() {
  const [, navigate] = useLocation();

  // Using hardcoded data instead of depending on mockLearningData
  const learningProgress = {
    completion: 42,
    coursesCompleted: 3,
    activeCourses: 2,
    practiceHours: 24,
    streakDays: 5
  };

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

          {/* Skills Coming Soon */}
          <Card className="mb-8">
            <CardContent className="pt-6 text-center py-12">
              <h2 className="text-lg font-semibold mb-4">Skills Tracking Coming Soon</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                We're working on a comprehensive skills tracking system to help you monitor your progress in specific coding areas.
              </p>
              <Button 
                onClick={() => navigate("/dashboard")}
                className="mx-auto"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
