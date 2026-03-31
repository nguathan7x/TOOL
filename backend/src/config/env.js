import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const rawClientUrls = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(',').map((value) => value.trim()).filter(Boolean)
  : process.env.CLIENT_URL
    ? [process.env.CLIENT_URL.trim()]
    : ['http://localhost:5173'];

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URLS: z.array(z.string().url()).default(['http://localhost:5173']),
  JSON_BODY_LIMIT: z.string().default('15mb'),
  GOOGLE_CLIENT_ID: z.string().trim().optional().transform((value) => value || null),
  GOOGLE_CLIENT_SECRET: z.string().trim().optional().transform((value) => value || null),
  GOOGLE_REDIRECT_URI: z.string().trim().url().optional().transform((value) => value || 'http://localhost:5173/auth/google/callback')
});

const parsedEnv = envSchema.safeParse({
  ...process.env,
  CLIENT_URLS: rawClientUrls
});

if (!parsedEnv.success) {
  console.error('Invalid environment configuration', parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
