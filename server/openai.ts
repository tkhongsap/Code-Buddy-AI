import OpenAI from 'openai';

// Initialize the OpenAI client
// Note: This uses the environment variable OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    console.log('Using OpenAI API key:', process.env.OPENAI_API_KEY ? 'Key is set' : 'Key is not set');
    
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