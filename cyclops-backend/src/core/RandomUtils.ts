import crypto from "crypto";

export class RandomUtils {
    static randomString(length: number): string {
        return crypto.randomBytes(length).toString('hex');
    }
}