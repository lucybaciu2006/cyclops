import { env } from "../env";

export class ConfigFile {
    public static FACEBOOK_CLIENT_ID = env.VITE_FACEBOOK_APP_ID;
    public static GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID;
    public static STRIPE_PUBLIC_KEY = env.VITE_STRIPE_PUBLIC_KEY;
}