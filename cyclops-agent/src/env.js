"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    DEVICE_ID: zod_1.z.string(),
    LOCATION_ID: zod_1.z.string(),
    SERVER_HOST: zod_1.z.string(),
    API_KEY: zod_1.z.string().min(1),
    GOOGLE_APPLICATION_CREDENTIALS: zod_1.z.string(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;
