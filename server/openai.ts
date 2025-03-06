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
      temperature: 0.7,
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
      max_tokens: 1000,
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

export default openai;
