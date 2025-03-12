import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import {
  getChatCompletion,
  getChatCompletionStream,
  type OpenAIChatMessage,
} from "./openai";
import { z } from "zod";
import {
  insertChatSessionSchema,
  insertChatMessageSchema,
  type ChatMessage,
} from "@shared/schema";

// Helper function to determine skill level based on progress score
function getSkillLevel(progress: number): string {
  if (progress >= 80) return "Advanced";
  if (progress >= 50) return "Intermediate";
  return "Beginner";
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API endpoints for the AI Code Buddy application

  // Developer tips endpoint
  app.get("/api/developer-tips", async (req, res) => {
    // Check both Passport and custom session authentication
    const isAuthenticated =
      req.isAuthenticated() || (req.session && (req.session as any).userId);
    if (!isAuthenticated) return res.sendStatus(401);

    try {
      // Get userId from either Passport or custom session
      const userId = req.isAuthenticated()
        ? (req.user as any).id
        : (req.session as any).userId;

      console.log(
        `Developer tips request - Auth method: ${req.isAuthenticated() ? "Passport" : "Custom session"}, User ID: ${userId}`,
      );

      // Get the user's sessions
      const sessions = await storage.getUserChatSessions(userId);

      // Collect the 30 most recent messages across all sessions
      let allMessages: any[] = [];

      for (const session of sessions) {
        const messages = await storage.getChatMessages(session.id);
        allMessages = [
          ...allMessages,
          ...messages.map((msg) => ({
            ...msg,
            sessionTitle: session.title,
          })),
        ];
      }

      // Sort messages by timestamp (most recent first) and take the top 30
      allMessages.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      const recentMessages = allMessages.slice(0, 30);

      if (recentMessages.length === 0) {
        // If no messages, return a specific message about needing chat history
        return res.json({
          message: "Insufficient chat history to generate personalized tips",
          tips: [],
        });
      }

      // Prepare the messages for the OpenAI prompt
      const conversationHistory = recentMessages
        .map((msg) => {
          return `${msg.sender.toUpperCase()}: ${msg.content.substring(0, 1000)}${msg.content.length > 1000 ? "..." : ""}`;
        })
        .join("\n\n");

      // Create the system prompt for OpenAI
      const messages: OpenAIChatMessage[] = [
        {
          role: "system",
          content: `You are an expert coding assistant analyzing a user's conversation history to provide personalized developer tips. Based on the conversation history, generate 3 personalized tips for the developer. Each tip should relate to technologies, questions, or challenges mentioned in their chat history.

For each tip, provide:
1. A concise title (5-7 words maximum)
2. A brief description (15-20 words) outlining the value and relevance
3. An appropriate icon type from this list: "code", "book-open", "database", "server", "layout", "git-branch", "terminal", "shield", "zap", "cpu"
4. An action type from this list: "Continue", "Start", "Explore"
5. Whether this is a new recommendation (true/false)

Format your response as a JSON object with a 'tips' array containing 3 tip objects. Each tip should have: id, title, description, iconType, actionType, and isNew fields.

The tips should be valuable, specific to the technologies discussed, and help the developer advance their skills.`,
        },
        {
          role: "user",
          content: `Here's my recent conversation history. Please analyze it and generate 3 personalized developer tips for me:\n\n${conversationHistory}`,
        },
      ];

      // Get response from OpenAI
      try {
        const response = await getChatCompletion(messages);
        console.log("Developer tips response:", response);

        // Process and parse the JSON response
        try {
          console.log("Raw OpenAI response:", response);

          // Clean up the response - remove markdown code blocks if present
          let cleanedResponse = response
            .replace(/```json\s+/g, "")
            .replace(/```\s*$/g, "");
          cleanedResponse = cleanedResponse.trim();

          console.log("Cleaned response:", cleanedResponse);

          // Try to parse the response as JSON
          const tipsData = JSON.parse(cleanedResponse);

          // Verify the response format
          if (tipsData && tipsData.tips && Array.isArray(tipsData.tips)) {
            console.log("Valid tips data parsed from OpenAI response");
            return res.json(tipsData);
          } else {
            console.log(
              "Response has incorrect format, using structured fallback",
            );
            // If format is incorrect, transform to expected format
            const fallbackTips = {
              tips: [
                {
                  id: 1,
                  title: "Improve Your Code Understanding",
                  description:
                    "Based on your questions, reviewing fundamentals could help solve recurring issues.",
                  iconType: "book-open",
                  actionType: "Explore",
                  isNew: true,
                },
                {
                  id: 2,
                  title: "Try Advanced Debugging Techniques",
                  description:
                    "Use tracing and structured logging to identify the problems you've been discussing.",
                  iconType: "terminal",
                  actionType: "Start",
                  isNew: false,
                },
                {
                  id: 3,
                  title: "Refactor Your Application",
                  description:
                    "Apply clean code principles to address the complexity issues in your codebase.",
                  iconType: "git-branch",
                  actionType: "Continue",
                  isNew: false,
                },
              ],
            };
            return res.json(fallbackTips);
          }
        } catch (parseError) {
          console.error("Error parsing OpenAI response as JSON:", parseError);

          // Try to extract JSON from the response using regex
          try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const extractedJson = jsonMatch[0];
              console.log("Attempting to parse extracted JSON:", extractedJson);
              const extractedData = JSON.parse(extractedJson);

              if (
                extractedData &&
                extractedData.tips &&
                Array.isArray(extractedData.tips)
              ) {
                console.log(
                  "Successfully extracted and parsed JSON from response",
                );
                return res.json(extractedData);
              }
            }
          } catch (extractError) {
            console.error("Error extracting JSON from response:", extractError);
          }

          // Return error instead of fallback tips
          console.log("Error parsing LLM response, returning error");
          return res.status(500).json({
            error:
              "Failed to generate developer tips - Invalid response format",
            tips: [],
          });
        }
      } catch (aiError) {
        console.error("Error getting developer tips from OpenAI:", aiError);
        return res.status(500).json({
          error: "Failed to generate developer tips",
          tips: [],
        });
      }
    } catch (error) {
      console.error("Error fetching developer tips:", error);
      res.status(500).json({
        error: "Failed to fetch developer tips",
        tips: [],
      });
    }
  });

  // Dashboard data endpoint
  app.get("/api/dashboard", async (req, res) => {
    // Check both Passport and custom session authentication
    const isAuthenticated =
      req.isAuthenticated() || (req.session && (req.session as any).userId);
    if (!isAuthenticated) return res.sendStatus(401);

    try {
      // Get userId from either Passport or custom session
      const userId = req.isAuthenticated()
        ? (req.user as any).id
        : (req.session as any).userId;

      console.log(
        `Dashboard request - Auth method: ${req.isAuthenticated() ? "Passport" : "Custom session"}, User ID: ${userId}`,
      );

      // Get the user's sessions
      const sessions = await storage.getUserChatSessions(userId);
      let totalQueriesCount = 0;
      let savedSolutionsCount = 0;
      // Define a type for the recent queries data
      interface RecentQueryData {
        id: number;
        query: string;
        fullContent: string;
        timestamp: string;
        tags: string[];
        sessionId: number;
        conversation?: {
          id: number;
          sender: "user" | "ai";
          content: string;
          timestamp: string;
        }[];
      }

      let recentQueriesData: RecentQueryData[] = [];

      // Get recent sessions with previews
      const recentSessionsWithPreview =
        await storage.getChatSessionsWithPreview(userId, 10);

      // For each session, get the messages and count them
      for (const session of sessions) {
        const messages = await storage.getChatMessages(session.id);

        // Only count user messages, not AI responses
        const userMessages = messages.filter((msg) => msg.sender === "user");
        totalQueriesCount += userMessages.length;

        // Count AI responses that are saved (we don't have a proper flag for this yet, so this is a placeholder)
        // In a real implementation, we'd check if the responses were actually saved by the user
        const aiMessages = messages.filter((msg) => msg.sender === "ai");
        // For this demo, let's assume 20% of AI responses are saved
        savedSolutionsCount += Math.round(aiMessages.length * 0.2);
      }

      // Get the 3 most recent sessions for the Recent Queries card
      const recentSessions = recentSessionsWithPreview.slice(0, 3);

      // For each recent session, get the first user message to display as the query
      for (const session of recentSessions) {
        const messages = await storage.getChatMessages(session.id);

        // Find the first user message in this session
        const firstUserMessage = messages.find((msg) => msg.sender === "user");

        if (firstUserMessage) {
          // Extract a timestamp to display
          const messageDate = new Date(firstUserMessage.timestamp);
          const now = new Date();
          const diffInMs = now.getTime() - messageDate.getTime();
          const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
          const diffInDays = Math.floor(diffInHours / 24);

          let timeAgo: string;
          if (diffInHours < 1) {
            timeAgo = "Just now";
          } else if (diffInHours < 24) {
            timeAgo = `${diffInHours}h ago`;
          } else {
            timeAgo = `${diffInDays}d ago`;
          }

          // Generate some tags based on the content of the message
          // In a real app, these would be actual tags stored with the message or generated by AI
          const generateTags = (content: string): string[] => {
            const tags: string[] = [];
            if (content.toLowerCase().includes("react")) tags.push("React");
            if (
              content.toLowerCase().includes("typescript") ||
              content.toLowerCase().includes("ts")
            )
              tags.push("TypeScript");
            if (
              content.toLowerCase().includes("sql") ||
              content.toLowerCase().includes("database")
            )
              tags.push("Database");
            if (
              content.toLowerCase().includes("css") ||
              content.toLowerCase().includes("style")
            )
              tags.push("CSS");
            if (
              content.toLowerCase().includes("javascript") ||
              content.toLowerCase().includes("js")
            )
              tags.push("JavaScript");
            if (tags.length === 0) tags.push("Programming");
            return tags;
          };

          // Create formatted conversation array for frontend display
          const formattedConversation = messages.map((msg) => ({
            id: msg.id,
            sender: msg.sender as "user" | "ai",
            content: msg.content,
            timestamp: new Date(msg.timestamp).toISOString(),
            html: msg.contentHtml || undefined,
          }));

          // Create a combined full content string with all messages
          const fullContentString = messages
            .map((msg) => `${msg.sender.toUpperCase()}: ${msg.content}`)
            .join("\n\n");

          recentQueriesData.push({
            id: session.id,
            query:
              firstUserMessage.content.length > 50
                ? firstUserMessage.content.substring(0, 50) + "..."
                : firstUserMessage.content,
            fullContent: fullContentString,
            timestamp: timeAgo,
            tags: generateTags(firstUserMessage.content),
            sessionId: session.id,
            conversation: formattedConversation,
          });
        }
      }

      console.log(
        `Found ${totalQueriesCount} total queries and ${savedSolutionsCount} saved solutions for user ${userId}`,
      );

      // Generate weekly activity data based on actual user chat messages
      const weeklyActivityData = [0, 0, 0, 0, 0, 0, 0]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
      const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      // Get current date and compute the date for the start of the week (Sunday)
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek); // Go back to Sunday
      startOfWeek.setHours(0, 0, 0, 0); // Start of the day

      // For each session, analyze the message timestamps
      for (const session of sessions) {
        const messages = await storage.getChatMessages(session.id);

        for (const message of messages) {
          const messageDate = new Date(message.timestamp);

          // Only count messages from current week
          if (messageDate >= startOfWeek) {
            const messageDayOfWeek = messageDate.getDay();
            weeklyActivityData[messageDayOfWeek]++;
          }
        }
      }

      // Reorder the data to start with Monday for display
      const mondayBasedData = [
        ...weeklyActivityData.slice(1),
        weeklyActivityData[0],
      ];
      const mondayBasedLabels = [...labels.slice(1), labels[0]];

      const dashboardData = {
        stats: {
          totalQueries: totalQueriesCount,
          savedSolutions: savedSolutionsCount,
        },
        weeklyActivity: {
          labels: mondayBasedLabels,
          data: mondayBasedData,
        },
        recentQueries: recentQueriesData,
      };

      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Learning progress endpoint
  app.get("/api/learning-progress", async (req, res) => {
    // Check both Passport and custom session authentication
    const isAuthenticated =
      req.isAuthenticated() || (req.session && (req.session as any).userId);
    if (!isAuthenticated) return res.sendStatus(401);

    try {
      // Get userId from either Passport or custom session
      const userId = req.isAuthenticated()
        ? (req.user as any).id
        : (req.session as any).userId;

      // Get existing skill data for the user
      const userSkills = await storage.getUserSkills(userId);
      
      // Helper function to normalize progress value to 0-100
      const normalizeProgress = (value: number): number => {
        return Math.min(100, Math.max(0, value));
      };
      
      // Calculate overall completion based on skill progress
      let completion = 0;
      if (userSkills.length > 0) {
        // Normalize each skill progress value before calculating the average
        const normalizedSkills = userSkills.map(skill => ({
          ...skill,
          progress: normalizeProgress(skill.progress)
        }));
        
        const totalProgress = normalizedSkills.reduce((sum, skill) => sum + skill.progress, 0);
        completion = Math.round(totalProgress / normalizedSkills.length);
      } else {
        // Default value if no skills exist yet
        completion = 45;
      }

      // Get real user activity data for course progress
      // Get all user's chat sessions
      const sessions = await storage.getUserChatSessions(userId);
      
      // Calculate active sessions (used in last 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const activeSessions = sessions.filter(session => 
        new Date(session.updatedAt || session.createdAt) >= sevenDaysAgo
      );
      
      // Calculate completed sessions (those with more than 5 messages)
      let completedSessions = 0;
      let totalMessages = 0;
      let dailyActivityMap = new Map<string, boolean>();
      
      // Process all sessions to get metrics
      for (const session of sessions) {
        const messages = await storage.getChatMessages(session.id);
        
        // Count total messages
        totalMessages += messages.length;
        
        // Count completed sessions
        if (messages.length >= 5) {
          completedSessions++;
        }
        
        // Track daily activity for streak calculation
        messages.forEach(msg => {
          const date = new Date(msg.timestamp);
          const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          dailyActivityMap.set(dateStr, true);
        });
      }
      
      // Calculate learning hours (estimate 5 minutes per message)
      const practiceHours = Math.round((totalMessages * 5) / 60);
      
      // Calculate streak days (consecutive days with activity)
      const activityDays = Array.from(dailyActivityMap.keys()).sort();
      let currentStreak = 0;
      if (activityDays.length > 0) {
        currentStreak = 1; // Start with 1 if there's any activity
        // Count additional days in streak
        for (let i = 1; i < activityDays.length; i++) {
          const prevDate = new Date(activityDays[i-1]);
          const currDate = new Date(activityDays[i]);
          const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
          if (diffDays === 1) {
            currentStreak++;
          } else {
            currentStreak = 1; // Reset streak if not consecutive
          }
        }
      }
      
      const learningData = {
        overallProgress: {
          completion: completion,
          coursesCompleted: completedSessions, // Based on sessions with 5+ messages
          activeCourses: activeSessions.length, // Based on sessions used in last 7 days
          practiceHours: Math.max(1, practiceHours), // Minimum 1 hour if user has any activity
          streakDays: Math.max(1, currentStreak), // Minimum 1 day streak if user has any activity
        },
        skills: userSkills.map(skill => ({
          name: skill.skillName,
          progress: normalizeProgress(skill.progress),
          level: getSkillLevel(normalizeProgress(skill.progress)),
          lastUpdated: skill.lastUpdated
        }))
      };

      res.json(learningData);
    } catch (error) {
      console.error("Error fetching learning progress data:", error);
      res.status(500).json({ error: "Failed to fetch learning progress data" });
    }
  });
  
  // Skill radar chart endpoint
  app.get("/api/skills/radar", async (req, res) => {
    // Check both Passport and custom session authentication
    const isAuthenticated =
      req.isAuthenticated() || (req.session && (req.session as any).userId);
    if (!isAuthenticated) return res.sendStatus(401);

    try {
      // Get userId from either Passport or custom session
      const userId = req.isAuthenticated()
        ? (req.user as any).id
        : (req.session as any).userId;
      
      // Get existing skill data for the user
      const userSkills = await storage.getUserSkills(userId);
      
      if (userSkills.length === 0) {
        return res.json({
          message: "No skill data available. Please analyze your skills first.",
          skillData: {}
        });
      }
      
      // Helper function to normalize progress value to 0-100
      const normalizeProgress = (value: number): number => {
        return Math.min(100, Math.max(0, value));
      };
      
      // Format data for radar chart
      const skillData: Record<string, number> = {};
      userSkills.forEach(skill => {
        skillData[skill.skillName] = normalizeProgress(skill.progress);
      });
      
      res.json({
        skillData,
        lastUpdated: userSkills.length > 0 ? 
          userSkills.reduce((latest, skill) => 
            new Date(skill.lastUpdated) > new Date(latest.lastUpdated) ? skill : latest
          ).lastUpdated : null
      });
    } catch (error) {
      console.error("Error fetching skill radar data:", error);
      res.status(500).json({ error: "Failed to fetch skill radar data", skillData: {} });
    }
  });

  // Skills assessment endpoint
  app.post("/api/skills/analyze", async (req, res) => {
    // Check both Passport and custom session authentication
    const isAuthenticated =
      req.isAuthenticated() || (req.session && (req.session as any).userId);
    if (!isAuthenticated) return res.sendStatus(401);

    try {
      // Get userId from either Passport or custom session
      const userId = req.isAuthenticated()
        ? (req.user as any).id
        : (req.session as any).userId;
      
      // Get user chat sessions
      const sessions = await storage.getUserChatSessions(userId);
      
      if (sessions.length === 0) {
        return res.status(400).json({ 
          error: "Not enough chat history to perform skill analysis", 
          skillsData: {} 
        });
      }
      
      // Collect user queries (messages) from all sessions
      let userQueries: string[] = [];
      
      for (const session of sessions) {
        const messages = await storage.getChatMessages(session.id);
        
        // Only use user messages, not AI responses
        const userMessages = messages
          .filter(msg => msg.sender === "user")
          .map(msg => msg.content);
          
        userQueries = [...userQueries, ...userMessages];
      }
      
      // Limit to the last 45 queries as mentioned in specs
      const recentQueries = userQueries.slice(-45);
      
      if (recentQueries.length === 0) {
        return res.status(400).json({ 
          error: "No user messages found to perform skill analysis", 
          skillsData: {} 
        });
      }
      
      // Use OpenAI to analyze skills
      const { analyzeSkills } = await import("./openai");
      const skillsData = await analyzeSkills(recentQueries);
      
      // Store skill progress in the database
      for (const [skill, score] of Object.entries(skillsData)) {
        await storage.updateUserSkill(userId, skill, score);
      }
      
      res.json({ 
        success: true, 
        message: "Skill analysis completed successfully", 
        skillsData,
        queriesAnalyzed: recentQueries.length
      });
    } catch (error) {
      console.error("Error analyzing skills:", error);
      res.status(500).json({ 
        error: "Failed to analyze skills", 
        skillsData: {} 
      });
    }
  });

  // Simple chat endpoint (no authentication required)
  app.post("/api/simple-chat", async (req, res) => {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      // Convert the conversation history to the format expected by OpenAI
      const messages: OpenAIChatMessage[] = [
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

    const {
      message,
      conversationHistory = [],
      stream = false,
      sessionId = null,
      isOptimizationRequest = false,
    } = req.body;

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
        const firstMessagePreview =
          message.length > 30 ? message.substring(0, 30) + "..." : message;

        const newSession = await storage.createChatSession({
          userId,
          title: firstMessagePreview,
          metadata: {
            createdAt: new Date().toISOString(),
            source: "web",
            isOptimization: isOptimizationRequest,
          },
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
          timestamp: new Date().toISOString(),
        },
      });

      // Convert the conversation history to the format expected by OpenAI
      const messages: OpenAIChatMessage[] = [
        // System message to set the AI's behavior based on request type
        {
          role: "system",
          content: isOptimizationRequest
            ? "You are a Performance & Security Optimizer specialized in analyzing code for improvements. Your primary focus is on optimizing code for performance, security, and robust error handling. When analyzing user-provided code:\n\n1. Identify performance bottlenecks and suggest more efficient algorithms or approaches.\n2. Highlight security vulnerabilities and recommend safer coding practices.\n3. Provide specific enhancements to improve error handling and code resilience.\n4. Include commentary on time complexity, memory usage, and security implications.\n5. When relevant, suggest architectural changes that could yield significant improvements.\n\nYour output should be structured as follows:\n\n1. **Summary of Findings**  \n   - Provide a brief overview of the key issues detected and potential improvements.\n\n2. **Optimized Code Snippet**  \n   - Present a fully revised, self-contained version of the user's code that incorporates the recommended changes.\n\n3. **Explanation of Changes**  \n   - Clearly explain what was changed and why these changes improve performance, security, or error handling.\n   - Reference any relevant best practices or patterns that guided your recommendations.\n\nBe specific and concrete in your suggestions. Always explain the reasoning behind your recommendations so the developer understands not just what to change, but why these changes enhance performance, security, or error handling."
            : "You are AI Code Buddy, a highly intelligent and adaptive coding assistant. Your primary goal is to provide clear, concise, and context-aware responses to programming questions. Always detect the user's preferred language and respond in that language. When providing answers: - Include well-structured code examples when appropriate. - Offer step-by-step explanations for complex concepts. - Adapt your explanations based on the user's skill level. - If a user asks for best practices, security concerns, or performance optimizations, provide industry-standard guidance. - If the user provides incomplete or ambiguous questions, ask clarifying questions before responding. You specialize in: - Software development (frontend, backend, full-stack) - Web technologies (HTML, CSS, JavaScript, React, Node.js) - Databases (SQL, PostgreSQL, MongoDB) - DevOps (Docker, Kubernetes, CI/CD) Ensure that responses are engaging and educational, using language that matches the user's expertise level. If a user seems beginner-level, simplify explanations; if they are advanced, be more technical. Above all, be helpful, friendly, and precise in your responses.",
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
        const streamingData = {
          sessionId: chatSessionId,
          userId,
          isNewSession,
        };
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
            model: "gpt-4o-mini", // Replace with actual model used
          },
        });

        res.json({
          response,
          timestamp: new Date().toLocaleTimeString(),
          sessionId: chatSessionId,
          isNewSession,
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

    const {
      message,
      conversationHistory = [],
      sessionId = null,
      isOptimizationRequest = false,
      isScoreRequest = false,
    } = req.body;

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
        const firstMessagePreview =
          message.length > 30 ? message.substring(0, 30) + "..." : message;

        const newSession = await storage.createChatSession({
          userId,
          title: firstMessagePreview,
          metadata: {
            createdAt: new Date().toISOString(),
            source: "web",
            isOptimization: isOptimizationRequest,
          },
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
          timestamp: new Date().toISOString(),
        },
      });

      // Convert the conversation history to the format expected by OpenAI
      const messages: OpenAIChatMessage[] = [
        // System message to set the AI's behavior based on request type
        {
          role: "system",
          content: isOptimizationRequest
            ? "You are a Performance & Security Optimizer specialized in analyzing code for improvements. Your primary focus is on optimizing code for performance, security, and robust error handling. When analyzing user-provided code:\n\n1. Identify performance bottlenecks and suggest more efficient algorithms or approaches.\n2. Highlight security vulnerabilities and recommend safer coding practices.\n3. Provide specific enhancements to improve error handling and code resilience.\n4. Include commentary on time complexity, memory usage, and security implications.\n5. When relevant, suggest architectural changes that could yield significant improvements.\n\nYour output should be structured as follows:\n\n1. **Summary of Findings**  \n   - Provide a brief overview of the key issues detected and potential improvements.\n\n2. **Optimized Code Snippet**  \n   - Present a fully revised, self-contained version of the user's code that incorporates the recommended changes.\n\n3. **Explanation of Changes**  \n   - Clearly explain what was changed and why these changes improve performance, security, or error handling.\n   - Reference any relevant best practices or patterns that guided your recommendations.\n\nBe specific and concrete in your suggestions. Always explain the reasoning behind your recommendations so the developer understands not just what to change, but why these changes enhance performance, security, or error handling."
            : "You are AI Code Buddy, a highly intelligent and adaptive coding assistant. Your primary goal is to provide clear, concise, and context-aware responses to programming questions. Always detect the user's preferred language and respond in that language. When providing answers: - Include well-structured code examples when appropriate. - Offer step-by-step explanations for complex concepts. - Adapt your explanations based on the user's skill level. - If a user asks for best practices, security concerns, or performance optimizations, provide industry-standard guidance. - If the user provides incomplete or ambiguous questions, ask clarifying questions before responding. You specialize in: - Software development (frontend, backend, full-stack) - Web technologies (HTML, CSS, JavaScript, React, Node.js) - Databases (SQL, PostgreSQL, MongoDB) - DevOps (Docker, Kubernetes, CI/CD) Ensure that responses are engaging and educational, using language that matches the user's expertise level. If a user seems beginner-level, simplify explanations; if they are advanced, be more technical. Above all, be helpful, friendly, and precise in your responses.",
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
        isNewSession,
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
  app.get("/api/saved-responses", async (req, res) => {
    // Check both Passport and custom session authentication
    const isAuthenticated =
      req.isAuthenticated() || (req.session && (req.session as any).userId);
    if (!isAuthenticated) return res.sendStatus(401);

    try {
      // Get userId from either Passport or custom session
      const userId = req.isAuthenticated()
        ? (req.user as any).id
        : (req.session as any).userId;

      // In a production environment, we would have a saved_responses table
      // For now, we'll find AI responses by scanning through chat messages

      // First get all user's chat sessions
      const sessions = await storage.getUserChatSessions(userId);

      // Array to hold saved responses (we'll consider all AI responses as "saved" for demo purposes)
      const savedResponses: Array<{
        id: number;
        content: string;
        timestamp: string;
        question: string;
      }> = [];

      // For each session, get AI responses and matching user queries
      for (const session of sessions) {
        const messages = await storage.getChatMessages(session.id);

        // Group messages into user-AI pairs
        let currentUserQuery: {
          id: number;
          content: string;
          sender: string;
          timestamp: Date;
        } | null = null;

        for (let i = 0; i < messages.length; i++) {
          const message = messages[i];

          if (message.sender === "user") {
            currentUserQuery = message;
          } else if (message.sender === "ai" && currentUserQuery) {
            // For each AI response that follows a user query, create a saved response object
            savedResponses.push({
              id: message.id,
              content: message.content,
              timestamp: new Date(message.timestamp).toLocaleString(),
              question: currentUserQuery.content,
            });

            // Reset currentUserQuery to ensure we pair queries with their direct responses
            currentUserQuery = null;
          }
        }
      }

      // Sort by most recent first and limit to most recent 10
      savedResponses.sort((a, b) => {
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
      const limitedResponses = savedResponses.slice(0, 10);

      res.json(limitedResponses);
    } catch (error) {
      console.error("Error fetching saved responses:", error);
      res.status(500).json({ error: "Failed to fetch saved responses" });
    }
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
        return res
          .status(403)
          .json({ error: "You don't have access to this chat session" });
      }

      const messages = await storage.getChatMessages(sessionId);

      res.json({
        ...session,
        messages,
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
        metadata: metadata || {},
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
        return res
          .status(403)
          .json({ error: "You don't have access to this chat session" });
      }

      const updatedSession = await storage.updateChatSessionTitle(
        sessionId,
        title,
      );
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
        return res
          .status(400)
          .json({ error: "Content and sender are required" });
      }

      const session = await storage.getChatSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Chat session not found" });
      }

      // Check if the session belongs to the current user
      if (session.userId !== userId) {
        return res
          .status(403)
          .json({ error: "You don't have access to this chat session" });
      }

      const parsedData = insertChatMessageSchema.safeParse({
        sessionId,
        userId,
        sender,
        content,
        contentHtml: contentHtml || null,
        metadata: metadata || {},
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

  // Code scoring endpoint - basic version for non-streaming responses
  app.post("/api/code/score", async (req, res) => {
    // Check both Passport and custom session authentication
    const isAuthenticated =
      req.isAuthenticated() || (req.session && (req.session as any).userId);
    if (!isAuthenticated) return res.sendStatus(401);

    try {
      // Validate request body
      const codeSchema = z.object({
        code: z.string().min(1, "Code is required"),
      });

      const parseResult = codeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const { code } = parseResult.data;

      // Create a prompt for OpenAI
      const messages: OpenAIChatMessage[] = [
        {
          role: "system",
          content: `You are a senior software engineer tasked with performing a detailed code review of changes made to files. Please evaluate the technical quality of the changes across the following dimensions (each scored from 1-10):

1. Correctness and Functionality
2. Code Quality and Maintainability
3. Performance Impact and Efficiency
4. Security and Vulnerability Assessment
5. Code Consistency and Style
6. Scalability and Extensibility
7. Error Handling and Robustness

For each dimension, provide:
• Score: X/10
• Explanation: A brief summary of your findings.
• Improvement Suggestion(s): Concrete recommendations to address any issues.

If applicable (for example, when changes involve application logic), include a short code recommendation or snippet that can directly improve the code.

Finally, provide an Overall Score (X.XX/10) and a concise list of key improvement items.

Your output should be formatted as text or markdown in a clear, organized report. For example:

---
**Code Review Report**  
**Review Details:**

1. **Correctness and Functionality**  
   Score: 8/10  
   Explanation: The changes improve functionality and fix several bugs, but some edge cases may not be handled.  
   Improvement Suggestion: Review error handling for edge conditions to ensure robustness.

2. **Code Quality and Maintainability**  
   Score: 7/10  
   Explanation: The code is mostly well-organized, though some sections lack adequate comments.  
   Improvement Suggestion: Add comments and refactor repetitive code blocks for clarity.

3. **Performance Impact and Efficiency**  
   Score: 8/10  
   Explanation: The modifications are efficient; however, some operations could be optimized with better algorithms.  
   Improvement Suggestion: Consider refactoring loops and using more efficient data structures.

4. **Security and Vulnerability Assessment**  
   Score: 9/10  
   Explanation: The code handles sensitive data appropriately, but input validation could be improved.  
   Improvement Suggestion: Implement stricter input validation and sanitize external data.

5. **Code Consistency and Style**  
   Score: 8/10  
   Explanation: The code follows most style guidelines, though minor inconsistencies in formatting were noted.  
   Improvement Suggestion: Use a linter to enforce uniform style across the codebase.

6. **Scalability and Extensibility**  
   Score: 7/10  
   Explanation: The architecture is generally scalable, but certain hardcoded values may limit flexibility.  
   Improvement Suggestion: Replace hardcoded parameters with configurable settings.

7. **Error Handling and Robustness**  
   Score: 8/10  
   Explanation: Error handling is improved but can be enhanced with more contextual logging.  
   Improvement Suggestion: Expand error messages and consider using a centralized error handling mechanism.

**Overall Score: 7.71/10**  
**Key Improvement Items:**  
- Enhance error handling for edge cases.  
- Add more descriptive comments and refactor repetitive code.  
- Improve input validation and sanitize data more rigorously.  
- Replace hardcoded parameters with configurable options.
---

Ensure your report is comprehensive yet concise, providing developers with actionable insights and specific recommendations for improvement.`,
        },
        {
          role: "user",
          content: `Please evaluate this code and provide a quality score:\n\n${code}`,
        },
      ];

      // Get response from OpenAI
      try {
        const response = await getChatCompletion(messages);

        // Return the response directly as markdown/text rather than trying to parse JSON
        res.json({
          report: response,
          timestamp: new Date().toISOString(),
        });
      } catch (aiError) {
        console.error("Error getting code score from OpenAI:", aiError);
        res.status(500).json({
          error: "Failed to generate code score",
          report: "Unable to process your code for scoring at this time.",
        });
      }
    } catch (error) {
      console.error("Error processing code scoring:", error);
      res.status(500).json({
        error: "Failed to process code for scoring",
        report: "An error occurred while analyzing your code.",
      });
    }
  });

  // Code scoring streaming endpoint
  app.post("/api/code/score/stream", async (req, res) => {
    // Check both Passport and custom session authentication
    const isAuthenticated =
      req.isAuthenticated() || (req.session && (req.session as any).userId);
    if (!isAuthenticated) return res.sendStatus(401);

    try {
      // Validate request body
      const codeSchema = z.object({
        code: z.string().min(1, "Code is required"),
      });

      const parseResult = codeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const { code } = parseResult.data;

      // Get user ID (if authenticated)
      const userId = req.isAuthenticated()
        ? (req.user as any).id
        : (req.session as any).userId || 1;

      // Create a prompt for OpenAI
      const messages: OpenAIChatMessage[] = [
        {
          role: "system",
          content: `You are a senior software engineer tasked with performing a detailed code review of changes made to files. Please evaluate the technical quality of the changes across the following dimensions (each scored from 1-10):

1. Correctness and Functionality
2. Code Quality and Maintainability
3. Performance Impact and Efficiency
4. Security and Vulnerability Assessment
5. Code Consistency and Style
6. Scalability and Extensibility
7. Error Handling and Robustness

For each dimension, provide:
• Score: X/10
• Explanation: A brief summary of your findings.
• Improvement Suggestion(s): Concrete recommendations to address any issues.

If applicable (for example, when changes involve application logic), include a short code recommendation or snippet that can directly improve the code.

Finally, provide an Overall Score (X.XX/10) and a concise list of key improvement items.

Your output should be formatted as text or markdown in a clear, organized report. For example:

---
**Code Review Report**  
**Review Details:**

1. **Correctness and Functionality**  
   Score: 8/10  
   Explanation: The changes improve functionality and fix several bugs, but some edge cases may not be handled.  
   Improvement Suggestion: Review error handling for edge conditions to ensure robustness.

2. **Code Quality and Maintainability**  
   Score: 7/10  
   Explanation: The code is mostly well-organized, though some sections lack adequate comments.  
   Improvement Suggestion: Add comments and refactor repetitive code blocks for clarity.

3. **Performance Impact and Efficiency**  
   Score: 8/10  
   Explanation: The modifications are efficient; however, some operations could be optimized with better algorithms.  
   Improvement Suggestion: Consider refactoring loops and using more efficient data structures.

4. **Security and Vulnerability Assessment**  
   Score: 9/10  
   Explanation: The code handles sensitive data appropriately, but input validation could be improved.  
   Improvement Suggestion: Implement stricter input validation and sanitize external data.

5. **Code Consistency and Style**  
   Score: 8/10  
   Explanation: The code follows most style guidelines, though minor inconsistencies in formatting were noted.  
   Improvement Suggestion: Use a linter to enforce uniform style across the codebase.

6. **Scalability and Extensibility**  
   Score: 7/10  
   Explanation: The architecture is generally scalable, but certain hardcoded values may limit flexibility.  
   Improvement Suggestion: Replace hardcoded parameters with configurable settings.

7. **Error Handling and Robustness**  
   Score: 8/10  
   Explanation: Error handling is improved but can be enhanced with more contextual logging.  
   Improvement Suggestion: Expand error messages and consider using a centralized error handling mechanism.

**Overall Score: 7.71/10**  
**Key Improvement Items:**  
- Enhance error handling for edge cases.  
- Add more descriptive comments and refactor repetitive code.  
- Improve input validation and sanitize data more rigorously.  
- Replace hardcoded parameters with configurable options.
---

Ensure your report is comprehensive yet concise, providing developers with actionable insights and specific recommendations for improvement.`,
        },
        {
          role: "user",
          content: `Please evaluate this code and provide a quality score:\n\n${code}`,
        },
      ];

      // Process as a streaming response
      await getChatCompletionStream(messages, res);
    } catch (error) {
      console.error("Error processing code scoring stream:", error);
      res.status(500).json({
        error: "Failed to process code for scoring",
        done: true,
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
