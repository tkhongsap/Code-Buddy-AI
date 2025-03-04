import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API endpoints for the AI Code Buddy application
  
  // Dashboard data endpoint
  app.get("/api/dashboard", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // In a real application, this would fetch personalized dashboard data
    // For now, we'll return mock data
    const mockData = {
      stats: {
        totalQueries: 156,
        savedSolutions: 47,
        activeCourses: 3,
        skillProgress: 72
      },
      weeklyActivity: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: [5, 8, 12, 7, 15, 9, 3]
      },
      recentQueries: [
        { id: 1, query: 'How to implement a React useEffect hook with cleanup', timestamp: '2h ago', tags: ['React', 'Hooks'] },
        { id: 2, query: 'Best practices for TypeScript interfaces vs types', timestamp: '5h ago', tags: ['TypeScript'] },
        { id: 3, query: 'Optimizing PostgreSQL query performance', timestamp: '1d ago', tags: ['SQL', 'Database'] },
        { id: 4, query: 'CSS Grid vs Flexbox for responsive layouts', timestamp: '2d ago', tags: ['CSS', 'Layout'] }
      ],
      learningProgress: [
        { id: 1, skill: 'React', progress: 85, color: '#61DAFB' },
        { id: 2, skill: 'TypeScript', progress: 72, color: '#3178C6' },
        { id: 3, skill: 'Node.js', progress: 64, color: '#339933' },
        { id: 4, skill: 'PostgreSQL', progress: 58, color: '#336791' }
      ]
    };
    
    res.json(mockData);
  });

  // Learning progress endpoint
  app.get("/api/learning-progress", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // In a real application, this would fetch personalized learning data
    // For now, we'll return mock data
    const mockLearningData = {
      overallProgress: {
        completion: 72,
        coursesCompleted: 7,
        activeCourses: 3,
        practiceHours: 48,
        streakDays: 12
      },
      // More mock learning data would be here
    };
    
    res.json(mockLearningData);
  });

  // AI chat endpoint
  app.post("/api/chat", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    // In a real application, this would connect to an AI service
    // For now, we'll return pre-defined responses based on keywords
    let response = '';
    
    if (message.toLowerCase().includes('react') && message.toLowerCase().includes('hook')) {
      response = `Here's how you can implement a React useEffect hook with cleanup:

\`\`\`jsx
useEffect(() => {
  // Your effect code here
  const subscription = someAPI.subscribe();

  // Return a cleanup function
  return () => {
    subscription.unsubscribe();
  };
}, [dependency1, dependency2]);
\`\`\`

The cleanup function runs before the component unmounts or before the effect runs again due to dependency changes.`;
    } 
    else if (message.toLowerCase().includes('typescript') && (message.toLowerCase().includes('interface') || message.toLowerCase().includes('type'))) {
      response = `In TypeScript, both interfaces and types can be used to define object shapes, but they have some differences:

\`\`\`typescript
// Interface
interface User {
  id: number;
  name: string;
  role?: string; // Optional property
}

// Type alias
type User = {
  id: number;
  name: string;
  role?: string;
};
\`\`\`

Key differences:
- Interfaces can be extended with the extends keyword
- Types can use union and intersection operators
- Interfaces can be merged when declared multiple times
- Types can be used for primitives, unions, and tuples`;
    } 
    else {
      response = `I understand you're asking about "${message}". Let me provide some guidance.

This is a common topic in development. The best approach would typically involve:

1. Understanding the core concepts first
2. Following established patterns and best practices
3. Testing thoroughly
4. Optimizing for performance

Would you like me to provide specific code examples or explain any particular aspect in more detail?`;
    }
    
    // Save the chat message to history in a real app
    
    res.json({ 
      response,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  // Save AI response endpoint
  app.post("/api/save-response", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { content, question } = req.body;
    
    if (!content || !question) {
      return res.status(400).json({ error: "Content and question are required" });
    }
    
    // In a real app, save to database
    // For now, just return success
    
    res.json({ 
      success: true,
      id: Date.now(),
      timestamp: new Date().toLocaleString() 
    });
  });

  // Get saved responses endpoint
  app.get("/api/saved-responses", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // In a real app, fetch from database
    // For now, return mock data
    
    const mockSavedResponses = [
      {
        id: 1,
        content: `Here's how you can implement a React useEffect hook with cleanup:

\`\`\`jsx
useEffect(() => {
  // Your effect code here
  const subscription = someAPI.subscribe();

  // Return a cleanup function
  return () => {
    subscription.unsubscribe();
  };
}, [dependency1, dependency2]);
\`\`\`

The cleanup function runs before the component unmounts or before the effect runs again due to dependency changes.`,
        timestamp: '2023-05-10 14:32',
        question: 'How to implement a React useEffect hook with cleanup'
      },
      {
        id: 2,
        content: `In TypeScript, both interfaces and types can be used to define object shapes, but they have some differences:

\`\`\`typescript
// Interface
interface User {
  id: number;
  name: string;
  role?: string; // Optional property
}

// Type alias
type User = {
  id: number;
  name: string;
  role?: string;
};
\`\`\`

Key differences:
- Interfaces can be extended with the extends keyword
- Types can use union and intersection operators
- Interfaces can be merged when declared multiple times
- Types can be used for primitives, unions, and tuples`,
        timestamp: '2023-05-08 09:17',
        question: 'What are the differences between TypeScript interfaces and types?'
      }
    ];
    
    res.json(mockSavedResponses);
  });

  const httpServer = createServer(app);

  return httpServer;
}
