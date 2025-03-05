# OpenAI Integration for AI Code Buddy

This document explains how to set up and use the OpenAI integration for the AI Code Buddy application.

## Setup Instructions

1. **Get an OpenAI API Key**
   - Sign up at [OpenAI's website](https://platform.openai.com/signup)
   - Navigate to [API Keys](https://platform.openai.com/api-keys) section
   - Create a new secret key

2. **Add Your API Key**
   - Open the `.env` file in the root directory
   - Add your API key: `OPENAI_API_KEY=your-api-key-here`

3. **Install Dependencies**
   - Make sure you've installed the required packages:
   ```
   npm install
   ```

4. **Start the Application**
   - Run the application in development mode:
   ```
   npm run dev
   ```

## Features

The chat integration provides:

- Real-time communication with OpenAI's models
- Conversation history tracking
- Code highlighting for code blocks in responses
- Ability to save useful responses

## Customization

You can customize the OpenAI integration by modifying:

- **Model**: Change the AI model in `server/openai.ts` (default is gpt-3.5-turbo)
- **System Prompt**: Modify the AI's behavior instructions in `server/routes.ts`
- **Temperature**: Adjust the creativity level in `server/openai.ts`

## Security Notes

- Never commit your API key to version control
- The included `.env` file is in `.gitignore` by default
- Consider using a key rotation policy for production environments

## Troubleshooting

If you encounter issues:

1. Check that your API key is correct and has sufficient credits
2. Verify network connectivity to OpenAI's API
3. Check server logs for detailed error messages
4. Make sure you're using a supported OpenAI model

For further assistance, refer to [OpenAI's API documentation](https://platform.openai.com/docs/api-reference). 