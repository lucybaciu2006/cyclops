import { z } from 'zod';
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']),
    APP_BASE_DOMAIN: z.string(),
    PORT: z
        .string()
        .optional()
        .transform((val) => (val !== undefined ? Number(val) : undefined))
        .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
            message: 'PORT must be a positive number if provided',
        }),
    MONGO_URI: z.string().min(1),
    ZOHO_MAIL: z.string(),
    ZOHO_PASSWORD: z.string(),
    ADMIN_EMAILS: z.string(),
    FRONTEND_URL: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    MOCK_EMAILS: z.enum(['true', 'false']).transform((val) => val === 'true'),
    GOOGLE_CLOUD_BUCKET_NAME: z.string(),
    GOOGLE_APPLICATION_CREDENTIALS: z.string(),
    STRIPE_BASE_PRICE_ID: z.string(),
    STRIPE_HIGHLIGHTS_PRICE_ID: z.string(),
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
    STRIPE_RO_TAX_RATE: z.string(),
    OBLIO_EMAIL: z.string(),
    OBLIO_SECRET: z.string(),
    OBLIO_CUI: z.string(),
    OBLIO_INVOICE_SERIES: z.string()

});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;
