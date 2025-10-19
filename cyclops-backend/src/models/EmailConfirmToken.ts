import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IEmailConfirmToken extends Document {
    userId: string;
    token: string;
    expiresAt: Date;
}

const EmailConfirmTokenSchema = new Schema<IEmailConfirmToken>({
    userId: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date()
    }
}, {
    timestamps: true
});

// Create index for token
EmailConfirmTokenSchema.index({ token: 1 }, { unique: true });

// Create index for userId
EmailConfirmTokenSchema.index({ userId: 1 });

// Create index for expiresAt
EmailConfirmTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailConfirmToken = mongoose.model<IEmailConfirmToken>('EmailConfirmToken', EmailConfirmTokenSchema, 'email_confirm_tokens');
