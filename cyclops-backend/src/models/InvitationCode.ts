import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';
import {number} from "zod";

export interface IInvitationCode extends Document {
    code: string;
    duration: number;
    used: boolean;
    userId?: string;
    propertyId?: string;

}

const InvitationCodeSchema = new Schema<IInvitationCode>({
    code: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true
    },
    used: {
        type: Boolean,
        required: true,
        default: false
    },
    userId: {
        type: String,
        required: false
    },
    propertyId: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

// Create index for token
InvitationCodeSchema.index({ code: 1 }, { unique: true });

export const InvitationCode = mongoose.model<IInvitationCode>('ActivationCode', InvitationCodeSchema, 'activation_codes');
