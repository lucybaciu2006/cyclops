import { z } from 'zod';
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
    DEVICE_ID: z.string(),
    LOCATION_ID: z.string(),
    LOCAL_STORAGE_PATH: z.string(),
    API_KEY: z.string().min(1),
    GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
    GOOGLE_CLOUD_BUCKET: z.string(),
    CAM_INPUT_URL: z.string(),
    CAMERA_IP: z.string(),
    SERVER_WS_ADDRESS: z.string(),
    SERVER_HTTP_BASE: z.string().optional(),
    SNAPSHOT_INTERVAL_SEC: z.string().optional(),

});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;
