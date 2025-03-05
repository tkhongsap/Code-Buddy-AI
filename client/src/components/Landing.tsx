import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import Header from "./layout/Header";
import Footer from "./layout/Footer";

export default function Landing() {
  const [, navigate] = useLocation();

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-slate-900 dark:to-slate-800">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Accelerate Your Coding with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                  AI-Powered Assistance
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-10">
                Get real-time coding support, track your learning progress, and become a better developer with AI Code Buddy.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  onClick={() => navigate("/auth")} 
                  size="lg" 
                  className="px-8 py-3"
                >
                  Get Started Free
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8 py-3 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Watch Demo
                </Button>
              </div>
            </div>

            <div className="mt-16 max-w-5xl mx-auto p-2 md:p-8 bg-card rounded-xl shadow-xl">
              <div className="rounded-lg overflow-hidden border border-border">
                <img 
                  src="https://images.unsplash.com/photo-1586672806791-3a67d24186c0?q=80&w=2070&auto=format&fit=crop" 
                  alt="Asian developers using AI Code Buddy" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">A Smarter Way to Code</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our AI-powered platform enhances your development experience with real-time support and continuous learning.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-card p-8 rounded-xl shadow-md hover:shadow-lg transition">
                <div className="h-14 w-14 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-primary flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 8V4H8"></path>
                    <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                    <path d="M2 14h2"></path>
                    <path d="M20 14h2"></path>
                    <path d="M15 13v2"></path>
                    <path d="M9 13v2"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">AI-Powered Assistance</h3>
                <p className="text-muted-foreground">
                  Get real-time answers to your coding questions with our advanced AI that understands context and provides accurate solutions.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-card p-8 rounded-xl shadow-md hover:shadow-lg transition">
                <div className="h-14 w-14 rounded-lg bg-green-100 dark:bg-green-900/30 text-secondary flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18"></path>
                    <path d="m19 9-5 5-4-4-3 3"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Learning Progress Tracking</h3>
                <p className="text-muted-foreground">
                  Monitor your skill development over time with detailed analytics and personalized learning recommendations.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-card p-8 rounded-xl shadow-md hover:shadow-lg transition">
                <div className="h-14 w-14 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Knowledge Base</h3>
                <p className="text-muted-foreground">
                  Save and organize important solutions for quick reference later, building your personalized programming knowledge library.
                </p>
              </div>
            </div>

            <div className="mt-20">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-6">Accelerate Your Development Workflow</h3>
                  <p className="text-muted-foreground mb-6">
                    Get unstuck faster with contextual code suggestions and explanations that adapt to your skill level and project requirements.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-secondary flex items-center justify-center flex-shrink-0 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span>Debug complex issues with expert assistance</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-secondary flex items-center justify-center flex-shrink-0 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span>Learn best practices as you code</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-secondary flex items-center justify-center flex-shrink-0 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span>Reduce development time with smart suggestions</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl overflow-hidden shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1596496181871-9681eacf9764?q=80&w=2069&auto=format&fit=crop" 
                    alt="Asian developer using AI Code Buddy" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>

            <div className="mt-20">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 rounded-xl overflow-hidden shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1580894732444-8ecded7900cd?q=80&w=2070&auto=format&fit=crop" 
                    alt="Asian developer tracking learning progress" 
                    className="w-full h-auto"
                  />
                </div>
                <div className="order-1 md:order-2">
                  <h3 className="text-2xl md:text-3xl font-bold mb-6">Track Your Learning Journey</h3>
                  <p className="text-muted-foreground mb-6">
                    Monitor your progress with detailed analytics that show your growth in different programming areas and skills.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-secondary flex items-center justify-center flex-shrink-0 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span>Visualize your skill improvements over time</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-secondary flex items-center justify-center flex-shrink-0 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span>Get personalized learning recommendations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 text-secondary flex items-center justify-center flex-shrink-0 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span>Identify knowledge gaps and focus areas</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-slate-50 dark:bg-slate-900 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by Developers</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                See what others are saying about how AI Code Buddy has transformed their development experience.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-card p-8 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="text-yellow-400 flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">
                  "AI Code Buddy has been a game-changer for my development workflow. I've saved countless hours debugging and learning new frameworks."
                </p>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mr-4">
                    <img 
                      src="https://randomuser.me/api/portraits/women/79.jpg" 
                      alt="Mei L." 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold">Mei L.</h4>
                    <p className="text-sm text-muted-foreground">Senior Frontend Developer</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-card p-8 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="text-yellow-400 flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">
                  "As someone learning to code, this tool has accelerated my progress dramatically. The learning tracking feature helps me focus on areas where I need improvement."
                </p>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mr-4">
                    <img 
                      src="https://randomuser.me/api/portraits/men/56.jpg" 
                      alt="Jin T." 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold">Jin T.</h4>
                    <p className="text-sm text-muted-foreground">CS Student</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-card p-8 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="text-yellow-400 flex">
                    {[...Array(4)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    ))}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeWidth="1" stroke="currentColor" fill="none" strokeDasharray="43" strokeDashoffset="23"></polygon>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" clipPath="inset(0 50% 0 0)"></polygon>
                    </svg>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">
                  "Our team's productivity increased by 30% after integrating AI Code Buddy into our workflow. The ability to quickly get answers without context switching is invaluable."
                </p>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mr-4">
                    <img 
                      src="https://randomuser.me/api/portraits/women/68.jpg" 
                      alt="Jennifer L." 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold">Jennifer L.</h4>
                    <p className="text-sm text-muted-foreground">Tech Lead</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your coding experience?</h2>
            <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
              Join thousands of developers who are coding smarter, not harder. Get started today with our free tier.
            </p>
            <Button 
              onClick={() => navigate("/auth")} 
              variant="secondary" 
              size="lg"
              className="px-8 py-3 text-primary hover:bg-blue-50"
            >
              Start Coding Smarter
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
