import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Supabase
  SUPABASE_URL: z.string().url().default('https://dummy-test.supabase.co'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('dummy-service-role-key-for-local-testing'),
  SUPABASE_ANON_KEY: z.string().min(1).default('dummy-anon-key-for-local-testing'),

  // Gemini AI
  GEMINI_API_KEY: z.string().default('dummy-gemini-key-for-local-testing'),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),

  // Email
  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('BookWise Local <no-reply@bookwise.local>'),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),

  // Rate Limits
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 mins
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  ASSISTANT_RATE_LIMIT_MAX: z.coerce.number().default(20),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid Server Environment Variables:', JSON.stringify(parsed.error.format(), null, 2));
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = parsed.success ? parsed.data : envSchema.parse({});

