import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const key = env.match(/GOOGLE_GENERATIVE_AI_API_KEY="([^"]+)"/)?.[1];
console.log('Key prefix:', key?.slice(0, 12) + '...');
console.log('Key length:', key?.length);

const google = createGoogleGenerativeAI({ apiKey: key });

try {
  const { text } = await generateText({
    model: google('gemini-3.8-flash'),
    prompt: 'Say hello in 5 words.',
    maxTokens: 50,
  });
  console.log('SUCCESS:', text);
} catch (e) {
  console.error('ERROR:', e.message);
  console.error('CAUSE:', e.cause?.message ?? e.cause);
}
