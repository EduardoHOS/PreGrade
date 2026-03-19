import { createHash } from 'crypto';
import OpenAI from 'openai';
import { GradingRequest, GradingResponse } from './types';

const TIMEOUT_MS = 40_000;

function getProviderConfig() {
  const provider = (process.env.AI_PROVIDER || 'groq').toLowerCase();

  if (provider === 'openai') {
    return {
      baseURL: undefined,
      apiKey: process.env.OPENAI_API_KEY!,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    };
  }

  // Default: Groq (OpenAI-compatible)
  return {
    baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY!,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  };
}

export async function callGradingModel(req: GradingRequest): Promise<GradingResponse> {
  const config = getProviderConfig();

  if (!config.apiKey) {
    throw new Error(`Missing API key for provider "${process.env.AI_PROVIDER || 'groq'}". Check your .env file.`);
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    ...(config.baseURL && { baseURL: config.baseURL }),
  });

  const temperature = parseFloat(process.env.AI_TEMPERATURE || '0.2');
  const promptVersion = process.env.AI_PROMPT_VERSION || '1.0.0';
  const promptHash = createHash('sha256')
    .update(req.systemPrompt + req.prompt)
    .digest('hex');

  const start = Date.now();

  const response = await client.chat.completions.create(
    {
      model: config.model,
      messages: [
        { role: 'system', content: req.systemPrompt },
        { role: 'user', content: req.prompt },
      ],
      max_tokens: req.maxTokens ?? 4096,
      temperature,
      response_format: { type: 'json_object' },
    },
    { signal: AbortSignal.timeout(TIMEOUT_MS) },
  );

  const processingMs = Date.now() - start;

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('AI provider returned empty response');
  }

  return {
    content,
    modelUsed: config.model,
    promptVersion,
    tokensInput: response.usage?.prompt_tokens ?? 0,
    tokensOutput: response.usage?.completion_tokens ?? 0,
    processingMs,
    promptHash,
  };
}
