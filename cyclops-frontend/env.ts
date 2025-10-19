import { z } from 'zod';

const envSchema = z.object({
    VITE_API_URL: z.string().url(),
    VITE_FACEBOOK_APP_ID: z.string(),
    VITE_GOOGLE_CLIENT_ID: z.string(),
    VITE_CONTACT_EMAIL: z.string().email(),
    VITE_STRIPE_PUBLIC_KEY: z.string()
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid frontend environment variables');
}

export const env = parsed.data;
