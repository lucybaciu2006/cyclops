import { z } from 'zod';
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
    DEVICE_ID: z.string(),
    LOCATION_ID: z.string(),
    SERVER_HOST: z.string(),
    LOCAL_STORAGE_PATH: z.string(),
    API_KEY: z.string().min(1),
    GOOGLE_APPLICATION_CREDENTIALS: z.string(),

});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;
