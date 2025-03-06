import { useState, useEffect, useContext } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/hooks/use-auth";
import Header from "../layout/Header";
import { CodeBlock } from "@/components/ui/code-block";

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const authContext = useContext(AuthContext);
  
  // Fallback if AuthContext is null
  const user = authContext?.user || null;
  const loginMutation = authContext?.loginMutation || { mutateAsync: async () => {}, isPending: false, mutate: () => {} };
  const registerMutation = authContext?.registerMutation || { mutateAsync: async () => {}, isPending: false };
  
  const [loginData, setLoginData] = useState({ username: "demo", password: "1234" });
  const [registerData, setRegisterData] = useState({ username: "", password: "", confirmPassword: "" });
  const [activeTab, setActiveTab] = useState<string>("login");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.username || !loginData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await loginMutation.mutateAsync(loginData);
      navigate("/dashboard");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerData.username || !registerData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await registerMutation.mutateAsync({
        username: registerData.username,
        password: registerData.password,
      });
      navigate("/dashboard");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col md:flex-row items-stretch" style={{ background: 'var(--editor-bg)' }}>
        {/* Auth form column */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold font-mono mb-2" style={{ color: 'var(--code-fg)' }}>AI Code Buddy</h1>
              <p className="text-sm font-mono" style={{ color: 'var(--syntax-comment)' }}>// Developer-centric coding assistance</p>
            </div>
            
            <Card className="shadow-xl border-gray-800" style={{ background: 'var(--panel-bg)', color: 'var(--code-fg)' }}>
              <CardContent className="pt-6">
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6" style={{ background: 'var(--sidebar-bg)' }}>
                    <TabsTrigger value="login" style={{ 
                      backgroundColor: activeTab === 'login' ? 'var(--active-tab)' : 'var(--inactive-tab)'
                     }}>Sign In</TabsTrigger>
                    <TabsTrigger value="register" style={{ 
                      backgroundColor: activeTab === 'register' ? 'var(--active-tab)' : 'var(--inactive-tab)'
                     }}>Register</TabsTrigger>
                  </TabsList>
                
                  <TabsContent value="login">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold">Welcome Back</h2>
                      <p className="text-muted-foreground mt-2">Sign in to your account to continue</p>
                    </div>
                    
                    <form onSubmit={handleLogin}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-username">Username</Label>
                          <Input 
                            id="login-username"
                            type="text" 
                            placeholder="johndoe" 
                            value={loginData.username}
                            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="login-password">Password</Label>
                            <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
                          </div>
                          <Input 
                            id="login-password"
                            type="password" 
                            placeholder="••••••••" 
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Signing in..." : "Sign In"}
                        </Button>
                        
                        <Button 
                          type="button"
                          variant="outline" 
                          className="w-full mt-2" 
                          onClick={() => {
                            // Use our demo user credentials
                            loginMutation.mutate({ username: "demo", password: "1234" });
                          }}
                          disabled={loginMutation.isPending}
                        >
                          Demo Login
                        </Button>
                      </div>
                    </form>
                    
                    <div className="mt-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 grid grid-cols-3 gap-3">
                        <Button variant="outline" size="icon" className="h-10">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                            <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                          </svg>
                        </Button>
                        <Button variant="outline" size="icon" className="h-10">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                            <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"></path>
                          </svg>
                        </Button>
                        <Button variant="outline" size="icon" className="h-10">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                            <path fill="currentColor" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold">Create an Account</h2>
                      <p className="text-muted-foreground mt-2">Sign up to get started with AI Code Buddy</p>
                    </div>
                    
                    <form onSubmit={handleRegister}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-username">Username</Label>
                          <Input 
                            id="register-username"
                            type="text" 
                            placeholder="johndoe" 
                            value={registerData.username}
                            onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="register-password">Password</Label>
                          <Input 
                            id="register-password"
                            type="password" 
                            placeholder="••••••••" 
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="register-confirm-password">Confirm Password</Label>
                          <Input 
                            id="register-confirm-password"
                            type="password" 
                            placeholder="••••••••" 
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Creating account..." : "Create Account"}
                        </Button>
                      </div>
                    </form>
                    
                    <div className="mt-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 grid grid-cols-3 gap-3">
                        <Button variant="outline" size="icon" className="h-10">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                            <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                          </svg>
                        </Button>
                        <Button variant="outline" size="icon" className="h-10">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                            <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"></path>
                          </svg>
                        </Button>
                        <Button variant="outline" size="icon" className="h-10">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                            <path fill="currentColor" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Hero/Info column */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center border-l border-gray-800" style={{ background: 'var(--sidebar-bg)' }}>
          <div className="p-12 max-w-lg">
            <div className="mb-8">
              <div className="inline-block px-3 py-1 text-xs font-mono rounded mb-3" 
                style={{ background: 'var(--selection-bg)', color: 'var(--syntax-variable)' }}>
                v1.0.0-beta • Developer Edition
              </div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--code-fg)' }}>Enhance Your Coding Experience</h2>
              <p className="mb-6" style={{ color: 'var(--syntax-comment)' }}>
                AI Code Buddy provides real-time assistance for developers to tackle complex coding challenges, debug issues, and learn new technologies.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 text-primary flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 11 12 14 22 4"></polyline>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--syntax-class)' }}>Intelligent Code Assistance</h3>
                    <p className="text-sm" style={{ color: 'var(--syntax-comment)' }}>Get contextual coding help with syntax highlighting</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 flex-shrink-0" style={{ color: 'var(--syntax-keyword)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 11 12 14 22 4"></polyline>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--syntax-class)' }}>Learning Progress Tracking</h3>
                    <p className="text-sm" style={{ color: 'var(--syntax-comment)' }}>Track your skill development and learning progress</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 flex-shrink-0" style={{ color: 'var(--syntax-keyword)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 11 12 14 22 4"></polyline>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--syntax-class)' }}>Interactive Chat Interface</h3>
                    <p className="text-sm" style={{ color: 'var(--syntax-comment)' }}>Natural language programming assistance and debugging</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border rounded-md overflow-hidden" style={{ borderColor: 'var(--tab-border)' }}>
              <div className="px-4 py-2 text-xs font-mono flex items-center justify-between border-b" 
                style={{ 
                  background: 'var(--sidebar-bg)', 
                  color: 'var(--line-number)',
                  borderColor: 'var(--tab-border)'
                }}>
                <span>Example.tsx</span>
                <span>TypeScript</span>
              </div>
              <CodeBlock
                language="typescript"
                code={`// Example of AI-assisted code
import React from 'react';

interface FeatureProps {
  title: string;
  description: string;
}

export function Feature({ title, description }: FeatureProps) {
  return (
    <div className="feature-card">
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
    </div>
  );
}`}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}