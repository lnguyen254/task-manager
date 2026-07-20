import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.url().default('http://localhost:3001'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parses and validates process.env at boot so the API fails fast with a
 * readable error on missing/malformed config, instead of surfacing as an
 * obscure runtime error the first time the bad value is used (e.g. a JWT
 * library rejecting an undefined secret deep in a request handler).
 */
export function validateEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    console.error('Invalid environment configuration:');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}
