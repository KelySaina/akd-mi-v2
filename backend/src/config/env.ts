import { z } from 'zod';

const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
    PORT: z.coerce.number().default(4000),
    LOG_LEVEL: z.string().default('info'),

    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),

    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL: z.string().default('7d'),
    SESSION_SECRET: z.string().min(32),

    S3_ENDPOINT: z.string().url(),
    S3_PUBLIC_ENDPOINT: z.string().url(),
    S3_REGION: z.string().default('us-east-1'),
    S3_BUCKET: z.string(),
    S3_ACCESS_KEY: z.string(),
    S3_SECRET_KEY: z.string(),

    RESEND_API_KEY: z.string().optional().default(''),
    EMAIL_FROM: z.string().default('no-reply@localhost'),

    ADMIN_EMAIL: z.string().email(),
    ADMIN_PASSWORD: z.string().min(8),
    ADMIN_NAME: z.string().default('Administrator'),

    INSTANCE_SLUG: z.string(),
    INSTANCE_NAME: z.string(),
    PUBLIC_WEB_URL: z.string().url(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
    if (cached) return cached;
    const parsed = EnvSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error('❌ Invalid environment variables:');
        console.error(parsed.error.flatten().fieldErrors);
        process.exit(1);
    }
    cached = parsed.data;
    return cached;
}
