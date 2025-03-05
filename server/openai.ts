import OpenAI from 'openai';

// Initialize the OpenAI client
// Note: In production, you should use environment variables for your API keys
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key', // Replace with your actual API key or use environment variable
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Send a message to OpenAI's chat completion API
 * @param messages Array of chat messages
 * @returns The AI's response
 */
export async function getChatCompletion(messages: ChatMessage[]): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // You can change this to gpt-4 or other models
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || 'No response generated.';
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to get response from AI service');
  }
}

export default openai; 