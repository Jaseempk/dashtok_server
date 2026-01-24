import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/config/env';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  parseResponse: (text: string) => T
): Promise<T> {
  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  return parseResponse(text);
}
