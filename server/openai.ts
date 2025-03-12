import OpenAI from "openai";
import { storage } from "./storage";

// Initialize the OpenAI client
// Note: This uses the environment variable OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface OpenAIChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Interface for chat streaming data context
export interface StreamingContext {
  sessionId: number;
  userId: number;
  isNewSession: boolean;
}

/**
 * Send a message to OpenAI's chat completion API
 * @param messages Array of chat messages
 * @returns The AI's response
 */
export async function getChatCompletion(
  messages: OpenAIChatMessage[],
): Promise<string> {
  try {
    console.log(
      "Using OpenAI API key:",
      process.env.OPENAI_API_KEY ? "Key is set" : "Key is not set",
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // You can change this to gpt-4 or other models
      messages,
      temperature: 0.5,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || "No response generated.";
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error("Failed to get response from AI service");
  }
}

// New function for streaming chat completions
export async function getChatCompletionStream(
  messages: OpenAIChatMessage[],
  res: any,
  streamingContext?: StreamingContext
): Promise<void> {
  try {
    console.log(
      "Using OpenAI API key for streaming:",
      process.env.OPENAI_API_KEY ? "Key is set" : "Key is not set",
    );

    // Set up streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Create a streaming chat completion
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini", // You can change this to gpt-4 or other models
      messages,
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    });

    // Handle the stream
    let fullResponse = "";
    
    // Process each chunk
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        
        // Send the chunk to the client
        res.write(`data: ${JSON.stringify({ 
          content, 
          done: false,
          timestamp: new Date().toLocaleTimeString(),
          ...(streamingContext && { sessionId: streamingContext.sessionId, isNewSession: streamingContext.isNewSession })
        })}\n\n`);
        
        // Ensure data is sent immediately
        res.flush?.();
      }
    }
    
    // If we have context info, save the complete response to the database
    if (streamingContext) {
      try {
        await storage.createChatMessage({
          sessionId: streamingContext.sessionId,
          userId: streamingContext.userId,
          sender: "ai",
          content: fullResponse,
          contentHtml: null, // Can add HTML formatting if needed
          metadata: {
            timestamp: new Date().toISOString(),
            model: "gpt-4o-mini", // Replace with actual model used
            streaming: true
          }
        });
      } catch (dbError) {
        console.error("Error saving streamed response to database:", dbError);
        // We'll continue even if saving to DB fails
      }
    }
    
    // Send the final message indicating the stream is complete
    res.write(`data: ${JSON.stringify({ 
      content: "", 
      done: true, 
      fullResponse,
      timestamp: new Date().toLocaleTimeString(),
      ...(streamingContext && { sessionId: streamingContext.sessionId, isNewSession: streamingContext.isNewSession })
    })}\n\n`);
    
    res.end();
  } catch (error) {
    console.error("Error in streaming OpenAI API:", error);
    
    // Send error to client
    res.write(`data: ${JSON.stringify({ 
      error: "Failed to get response from AI service", 
      done: true,
      timestamp: new Date().toLocaleTimeString(),
      ...(streamingContext && { sessionId: streamingContext.sessionId, isNewSession: streamingContext.isNewSession })
    })}\n\n`);
    
    res.end();
  }
}

/**
 * Analyze user queries to identify skills and estimate skill levels
 * @param queries Array of user queries (messages)
 * @returns Object mapping skill domains to their estimated skill level
 */
export async function analyzeSkills(queries: string[]): Promise<Record<string, number>> {
  try {
    const systemPrompt = `
You are a skill assessment assistant specialized in analyzing programming queries to identify users' strengths and weaknesses. Your task is to review a list of user-provided queries, determine which skill domains are relevant to each query, and estimate the user's proficiency in those domains on a scale from 1 to 10. On this scale, 1 indicates a complete beginner level, while 10 indicates advanced or expert-level knowledge.

For each query:
- Analyze the content to determine the relevant domain(s) it addresses.
- Assign a skill level score (1-10) for each domain based on the query's complexity, terminology, and depth.
- Use these scores to indicate both strengths (higher scores) and weaknesses (lower scores) for the user.

For consistency, limit your analysis to the following predefined domains:
- JavaScript
- TypeScript
- React
- Node.js
- Python
- Database
- CSS
- HTML
- DevOps
- Docker
- Testing
- Security
- Performance
- Algorithms
- General Programming

Return your analysis in JSON format. Each key should be one of the domains from the list, and its value should be an array of the corresponding skill estimates from the user queries. For example:
{
  "JavaScript": [2, 4, 7],
  "React": [6, 7],
  "Docker": [3]
}

Your output should be clear and strictly follow the JSON format for further processing.
`;

    // Format the queries for the prompt
    const queriesPrompt = queries.map((q, i) => `${i+1}) "${q}"`).join("\n");
    
    const messages: OpenAIChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Here is the list of user queries:\n${queriesPrompt}` }
    ];

    // Get response from OpenAI
    const response = await getChatCompletion(messages);
    
    // Parse the JSON response
    try {
      // Extract JSON from the response using regex in case there's extra text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedJson = jsonMatch[0];
        const parsedData = JSON.parse(extractedJson);
        
        // Calculate average skill level for each domain
        const result: Record<string, number> = {};
        for (const [domain, scores] of Object.entries(parsedData)) {
          if (Array.isArray(scores) && scores.length > 0) {
            // Calculate average and scale to 0-100
            const average = scores.reduce((sum, score) => sum + (Number(score) || 0), 0) / scores.length;
            // Ensure the values are between 0-100 (from 1-10 scale)
            // Using a more controlled scale: 1->10, 2->20, ... 10->100
            result[domain] = Math.min(100, Math.max(0, Math.round(average * 10)));
          }
        }
        
        return result;
      }
      throw new Error("Could not extract valid JSON from response");
    } catch (parseError) {
      console.error("Error parsing skill analysis response:", parseError);
      throw new Error("Failed to parse skill analysis results");
    }
  } catch (error) {
    console.error("Error analyzing skills with OpenAI:", error);
    throw new Error("Failed to analyze skills");
  }
}

export default openai;
