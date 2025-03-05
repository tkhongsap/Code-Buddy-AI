import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { getChatCompletion, getChatCompletionStream, type ChatMessage } from "./openai";
import { insertChatSessionSchema, insertChatMessageSchema } from "@shared/schema";

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
        skillProgress: 72,
      },
      weeklyActivity: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        data: [5, 8, 12, 7, 15, 9, 3],
      },
      recentQueries: [
        {
          id: 1,
          query: "How to implement a React useEffect hook with cleanup",
          timestamp: "2h ago",
          tags: ["React", "Hooks"],
        },
        {
          id: 2,
          query: "Best practices for TypeScript interfaces vs types",
          timestamp: "5h ago",
          tags: ["TypeScript"],
        },
        {
          id: 3,
          query: "Optimizing PostgreSQL query performance",
          timestamp: "1d ago",
          tags: ["SQL", "Database"],
        },
        {
          id: 4,
          query: "CSS Grid vs Flexbox for responsive layouts",
          timestamp: "2d ago",
          tags: ["CSS", "Layout"],
        },
      ],
      learningProgress: [
        { id: 1, skill: "React", progress: 85, color: "#61DAFB" },
        { id: 2, skill: "TypeScript", progress: 72, color: "#3178C6" },
        { id: 3, skill: "Node.js", progress: 64, color: "#339933" },
        { id: 4, skill: "PostgreSQL", progress: 58, color: "#336791" },
      ],
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
        streakDays: 12,
      },
      // More mock learning data would be here
    };

    res.json(mockLearningData);
  });

  // Simple chat endpoint (no authentication required)
  app.post("/api/simple-chat", async (req, res) => {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      // Convert the conversation history to the format expected by OpenAI
      const messages: ChatMessage[] = [
        // System message to set the AI's behavior
        {
          role: "system",
          content:
            "You are AI Code Buddy, a helpful coding assistant. Provide clear, concise answers to programming questions. Include code examples when appropriate, and explain concepts in a way that's easy to understand. You specialize in software development, web technologies, databases, and DevOps.",
        },
        // Add conversation history
        ...conversationHistory.map((msg: any) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        // Add the current message
        {
          role: "user",
          content: message,
        },
      ];

      console.log("Sending to OpenAI API:", JSON.stringify(messages));

      // Get response from OpenAI
      const response = await getChatCompletion(messages);
      console.log("Received from OpenAI API:", response);

      // Return the response
      res.json({
        response,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error("Error in simple chat endpoint:", error);
      res.status(500).json({
        error: "Failed to get response from AI service",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  });

  // AI chat endpoint
  app.post("/api/chat", async (req, res) => {
    // Temporarily disable authentication check for testing
    // if (!req.isAuthenticated()) return res.sendStatus(401);

    const { message, conversationHistory = [], stream = false, sessionId = null } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      // Get user ID (if authenticated)
      const userId = req.isAuthenticated() ? (req.user as any).id : 1; // Default to demo user if not authenticated
      
      // Determine or create a chat session
      let chatSessionId = sessionId;
      let isNewSession = false;
      
      if (!chatSessionId) {
        // Create a new chat session with the first message as title
        const firstMessagePreview = message.length > 30 
          ? message.substring(0, 30) + "..." 
          : message;
          
        const newSession = await storage.createChatSession({
          userId,
          title: firstMessagePreview,
          metadata: {
            createdAt: new Date().toISOString(),
            source: "web"
          }
        });
        
        chatSessionId = newSession.id;
        isNewSession = true;
      }
      
      // Save the user message to the chat session
      const userChatMessage = await storage.createChatMessage({
        sessionId: chatSessionId,
        userId,
        sender: "user",
        content: message,
        contentHtml: null,
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
      
      // Convert the conversation history to the format expected by OpenAI
      const messages: ChatMessage[] = [
        // System message to set the AI's behavior
        {
          role: "system",
          content:
            "You are AI Code Buddy, a highly intelligent and adaptive coding assistant. Your primary goal is to provide clear, concise, and context-aware responses to programming questions. Always detect the user's preferred language and respond in that language. When providing answers: - Include well-structured code examples when appropriate. - Offer step-by-step explanations for complex concepts. - Adapt your explanations based on the user's skill level. - If a user asks for best practices, security concerns, or performance optimizations, provide industry-standard guidance. - If the user provides incomplete or ambiguous questions, ask clarifying questions before responding. You specialize in: - Software development (frontend, backend, full-stack) - Web technologies (HTML, CSS, JavaScript, React, Node.js) - Databases (SQL, PostgreSQL, MongoDB) - DevOps (Docker, Kubernetes, CI/CD) Ensure that responses are engaging and educational, using language that matches the user's expertise level. If a user seems beginner-level, simplify explanations; if they are advanced, be more technical. Above all, be helpful, friendly, and precise in your responses.",
        },
        // Add conversation history
        ...conversationHistory.map((msg: any) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        // Add the current message
        {
          role: "user",
          content: message,
        },
      ];

      // If stream is true, use streaming response, otherwise use regular response
      if (stream) {
        // Handle streaming response (we'll save AI response after streaming completes)
        const streamingData = { sessionId: chatSessionId, userId, isNewSession };
        await getChatCompletionStream(messages, res, streamingData);
        // The response is handled directly in the getChatCompletionStream function
      } else {
        // Regular non-streaming response
        const response = await getChatCompletion(messages);
        
        // Save the AI response to the chat session
        const aiChatMessage = await storage.createChatMessage({
          sessionId: chatSessionId,
          userId,
          sender: "ai",
          content: response,
          contentHtml: null, // Can add HTML formatting if needed
          metadata: {
            timestamp: new Date().toISOString(),
            model: "gpt-3.5-turbo" // Replace with actual model used
          }
        });
        
        res.json({
          response,
          timestamp: new Date().toLocaleTimeString(),
          sessionId: chatSessionId,
          isNewSession
        });
      }
    } catch (error) {
      // This catch block only applies to the non-streaming case
      // Streaming errors are handled inside getChatCompletionStream
      console.error("Error in chat endpoint:", error);
      res.status(500).json({
        error: "Failed to get response from AI service",
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  });
  
  // Dedicated streaming chat endpoint (for clearer separation of concerns)
  app.post("/api/chat/stream", async (req, res) => {
    // Temporarily disable authentication check for testing
    // if (!req.isAuthenticated()) return res.sendStatus(401);

    const { message, conversationHistory = [], sessionId = null } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      // Get user ID (if authenticated)
      const userId = req.isAuthenticated() ? (req.user as any).id : 1; // Default to demo user if not authenticated
      
      // Determine or create a chat session
      let chatSessionId = sessionId;
      let isNewSession = false;
      
      if (!chatSessionId) {
        // Create a new chat session with the first message as title
        const firstMessagePreview = message.length > 30 
          ? message.substring(0, 30) + "..." 
          : message;
          
        const newSession = await storage.createChatSession({
          userId,
          title: firstMessagePreview,
          metadata: {
            createdAt: new Date().toISOString(),
            source: "web"
          }
        });
        
        chatSessionId = newSession.id;
        isNewSession = true;
      }
      
      // Save the user message to the chat session
      const userChatMessage = await storage.createChatMessage({
        sessionId: chatSessionId,
        userId,
        sender: "user",
        content: message,
        contentHtml: null,
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
      
      // Convert the conversation history to the format expected by OpenAI
      const messages: ChatMessage[] = [
        // System message to set the AI's behavior
        {
          role: "system",
          content:
            "You are AI Code Buddy, a highly intelligent and adaptive coding assistant. Your primary goal is to provide clear, concise, and context-aware responses to programming questions. Always detect the user's preferred language and respond in that language. When providing answers: - Include well-structured code examples when appropriate. - Offer step-by-step explanations for complex concepts. - Adapt your explanations based on the user's skill level. - If a user asks for best practices, security concerns, or performance optimizations, provide industry-standard guidance. - If the user provides incomplete or ambiguous questions, ask clarifying questions before responding. You specialize in: - Software development (frontend, backend, full-stack) - Web technologies (HTML, CSS, JavaScript, React, Node.js) - Databases (SQL, PostgreSQL, MongoDB) - DevOps (Docker, Kubernetes, CI/CD) Ensure that responses are engaging and educational, using language that matches the user's expertise level. If a user seems beginner-level, simplify explanations; if they are advanced, be more technical. Above all, be helpful, friendly, and precise in your responses.",
        },
        // Add conversation history
        ...conversationHistory.map((msg: any) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        // Add the current message
        {
          role: "user",
          content: message,
        },
      ];

      // Process as a streaming response with context for database storage
      const streamingContext = { 
        sessionId: chatSessionId, 
        userId, 
        isNewSession 
      };
      
      await getChatCompletionStream(messages, res, streamingContext);
      
    } catch (error) {
      console.error("Error in streaming chat endpoint:", error);
      // Error handling should happen inside getChatCompletionStream
      // This is just a fallback in case the function throws instead of handling internally
      res.status(500).json({
        error: "Failed to get response from AI service",
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  });

  // Save AI response endpoint
  app.post("/api/save-response", (req, res) => {
    // Also temporarily disable authentication for this endpoint
    // if (!req.isAuthenticated()) return res.sendStatus(401);

    const { content, question } = req.body;

    if (!content || !question) {
      return res
        .status(400)
        .json({ error: "Content and question are required" });
    }

    // In a real app, save to database
    // For now, just return success

    res.json({
      success: true,
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
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
        timestamp: "2023-05-10 14:32",
        question: "How to implement a React useEffect hook with cleanup",
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
        timestamp: "2023-05-08 09:17",
        question:
          "What are the differences between TypeScript interfaces and types?",
      },
    ];

    res.json(mockSavedResponses);
  });
  
  // Chat History API endpoints
  
  // Get user's chat sessions
  app.get("/api/chat-sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = (req.user as any).id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const sessions = await storage.getChatSessionsWithPreview(userId, limit);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ error: "Failed to fetch chat sessions" });
    }
  });
  
  // Get a specific chat session with all messages
  app.get("/api/chat-sessions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const sessionId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
      const session = await storage.getChatSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Chat session not found" });
      }
      
      // Check if the session belongs to the current user
      if (session.userId !== userId) {
        return res.status(403).json({ error: "You don't have access to this chat session" });
      }
      
      const messages = await storage.getChatMessages(sessionId);
      
      res.json({
        ...session,
        messages
      });
    } catch (error) {
      console.error("Error fetching chat session:", error);
      res.status(500).json({ error: "Failed to fetch chat session" });
    }
  });
  
  // Create a new chat session
  app.post("/api/chat-sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = (req.user as any).id;
      const { title, metadata } = req.body;
      
      const parsedData = insertChatSessionSchema.safeParse({
        userId,
        title: title || "New Chat",
        metadata: metadata || {}
      });
      
      if (!parsedData.success) {
        return res.status(400).json({ error: "Invalid chat session data" });
      }
      
      const session = await storage.createChatSession(parsedData.data);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ error: "Failed to create chat session" });
    }
  });
  
  // Update a chat session title
  app.patch("/api/chat-sessions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const sessionId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }
      
      const session = await storage.getChatSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Chat session not found" });
      }
      
      // Check if the session belongs to the current user
      if (session.userId !== userId) {
        return res.status(403).json({ error: "You don't have access to this chat session" });
      }
      
      const updatedSession = await storage.updateChatSessionTitle(sessionId, title);
      res.json(updatedSession);
    } catch (error) {
      console.error("Error updating chat session:", error);
      res.status(500).json({ error: "Failed to update chat session" });
    }
  });
  
  // Add a message to a chat session
  app.post("/api/chat-sessions/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const sessionId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const { content, sender, contentHtml, metadata } = req.body;
      
      if (!content || !sender) {
        return res.status(400).json({ error: "Content and sender are required" });
      }
      
      const session = await storage.getChatSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Chat session not found" });
      }
      
      // Check if the session belongs to the current user
      if (session.userId !== userId) {
        return res.status(403).json({ error: "You don't have access to this chat session" });
      }
      
      const parsedData = insertChatMessageSchema.safeParse({
        sessionId,
        userId,
        sender,
        content,
        contentHtml: contentHtml || null,
        metadata: metadata || {}
      });
      
      if (!parsedData.success) {
        return res.status(400).json({ error: "Invalid chat message data" });
      }
      
      const message = await storage.createChatMessage(parsedData.data);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error adding message to chat session:", error);
      res.status(500).json({ error: "Failed to add message to chat session" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
