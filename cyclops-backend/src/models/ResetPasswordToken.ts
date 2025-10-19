import mongoose, { Document, Schema } from "mongoose";
import crypto from "crypto";

export interface IResetPasswordToken extends Document {
  userId: string;
  token: string;
  expiresAt: Date;
}

const ResetPasswordTokenSchema = new Schema<IResetPasswordToken>(
  {
    userId: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
  }
);

// Create index for token
ResetPasswordTokenSchema.index({ token: 1 }, { unique: true });

// Create index for userId
ResetPasswordTokenSchema.index({ userId: 1 });

// Create index for expiresAt
ResetPasswordTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ResetPasswordToken = mongoose.model<IResetPasswordToken>(
  "ResetPasswordToken",
  ResetPasswordTokenSchema,
  "reset_password_tokens"
);
