import mongoose, { Document, Schema } from 'mongoose';
import { RecordPurchaseType } from './RecordPurchaseType';

export enum PaymentIntentStatus {
    Initiated = 'initiated',
    Paid = 'paid',
    Failed = 'failed',
    Expired = 'expired',
    Canceled = 'canceled',
}

export interface CreatePaymentSessionRequest {
    type: RecordPurchaseType;
    email?: string;
    userId: string;
    locationId: string;
    activationKey?: string;     // temporary key for device security
    startTime: number;          // epoch ms
    durationMinutes: number;
}

export interface IPaymentIntent extends Document {
    request: CreatePaymentSessionRequest; // the whole request as one subdocument

    status: PaymentIntentStatus;
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    clientReferenceId?: string;
    idempotencyKey?: string;

    // Optional reconciliation fields
    priceId?: string;
    amount?: number;            // minor units
    currency?: string;          // e.g. 'ron'
    taxRateId?: string;

    metadata?: Record<string, string>;
    errorCode?: string;
    errorMessage?: string;

    // Versioning for the request shape (optional)
    requestVersion?: number;

    // TTL for abandoned intents
    expiresAt?: Date;
}

const RequestSchema = new Schema<CreatePaymentSessionRequest>(
    {
        type: {
            type: String,
            required: true,
            enum: Object.values(RecordPurchaseType),
        },
        email: { type: String, trim: true },
        userId: { type: String, required: true, trim: true },
        locationId: { type: String, required: true, trim: true },
        activationKey: { type: String, trim: true },
        startTime: { type: Number, required: true },
        durationMinutes: { type: Number, required: true, min: 1 },
    },
    { _id: false }
);

const PaymentIntentSchema = new Schema<IPaymentIntent>(
    {
        request: { type: RequestSchema, required: true },

        status: {
            type: String,
            enum: Object.values(PaymentIntentStatus),
            default: PaymentIntentStatus.Initiated,
            required: true,
        },

        stripeSessionId: { type: String, trim: true, index: { unique: true, sparse: true } },
        stripePaymentIntentId: { type: String, trim: true, index: { unique: true, sparse: true } },
        clientReferenceId: { type: String, trim: true },
        idempotencyKey: { type: String, trim: true, index: true },

        priceId: { type: String, trim: true },
        amount: { type: Number },
        currency: { type: String, trim: true },
        taxRateId: { type: String, trim: true },

        metadata: { type: Map, of: String },
        errorCode: { type: String, trim: true },
        errorMessage: { type: String, trim: true },

        requestVersion: { type: Number, default: 1 },

        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 1000 * 60 * 60 * 48), // 48h
            index: { expireAfterSeconds: 0 },
        },
    },
    { timestamps: true }
);

// Handy query index without duplicating fields
PaymentIntentSchema.index({ 'request.userId': 1, status: 1, createdAt: -1 });
PaymentIntentSchema.index({ 'request.locationId': 1, createdAt: -1 });

export const PaymentIntent = mongoose.model<IPaymentIntent, mongoose.Model<IPaymentIntent>>(
    'PaymentIntent',
    PaymentIntentSchema
);
