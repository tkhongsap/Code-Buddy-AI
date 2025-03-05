import OpenAI from "openai";

// Initialize the OpenAI client
// Note: This uses the environment variable OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Send a message to OpenAI's chat completion API
 * @param messages Array of chat messages
 * @returns The AI's response
 */
export async function getChatCompletion(
  messages: ChatMessage[],
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
  messages: ChatMessage[],
  res: any
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
          timestamp: new Date().toLocaleTimeString()
        })}\n\n`);
        
        // Ensure data is sent immediately
        res.flush?.();
      }
    }
    
    // Send the final message indicating the stream is complete
    res.write(`data: ${JSON.stringify({ 
      content: "", 
      done: true, 
      fullResponse,
      timestamp: new Date().toLocaleTimeString()
    })}\n\n`);
    
    res.end();
  } catch (error) {
    console.error("Error in streaming OpenAI API:", error);
    
    // Send error to client
    res.write(`data: ${JSON.stringify({ 
      error: "Failed to get response from AI service", 
      done: true,
      timestamp: new Date().toLocaleTimeString() 
    })}\n\n`);
    
    res.end();
  }
}

export default openai;
