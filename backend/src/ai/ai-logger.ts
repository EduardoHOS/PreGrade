import pino from 'pino';

export const aiLogger = pino({
  name: 'pregrade-ai',
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'apiKey', 'GROQ_API_KEY', 'OPENAI_API_KEY',
      'prompt', 'systemPrompt', 'userPrompt',
      'submission.content', 'strippedText',
    ],
    censor: '[REDACTED]',
  },
  serializers: { err: pino.stdSerializers.err },
  ...(process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test' && {
    transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss.l' } },
  }),
});

export type { Logger } from 'pino';
