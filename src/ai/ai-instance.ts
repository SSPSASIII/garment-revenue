import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import dotenv from 'dotenv';

dotenv.config();

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY, // This line loads the API key
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
