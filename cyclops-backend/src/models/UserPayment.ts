import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPayment extends Document {
    userId: string;
    propertyId: string;
    propertyName: string;
    subscriptionId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripeInvoiceId: string;
    stripeInvoiceNumber: string;
    internalInvoiceId: string;
    invoiceUrl?: string;
    amount: number;                        // Amount in cents
    currency: string;                      // e.g., "usd"
    status: 'paid' | 'refunded' | 'failed';
    billingReason: string;                 // e.g., 'subscription_cycle'
    paidAt: number;                        // UNIX timestamp
}

const UserPaymentSchema = new Schema<IUserPayment>({
    userId: { type: String, required: true, index: true },
    propertyId: { type: String, required: true, index: true },
    propertyName: { type: String, required: true, index: true },
    subscriptionId: { type: String, required: true, index: true },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true },
    stripeInvoiceId: { type: String, required: true, unique: true },
    stripeInvoiceNumber: { type: String, required: true, unique: true },
    internalInvoiceId: { type: String, required: true, unique: true },
    invoiceUrl: { type: String, required: false, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, enum: ['paid', 'refunded'], required: true },
    billingReason: { type: String, required: true },
    paidAt: { type: Number, required: true },
}, {
    timestamps: true
});

UserPaymentSchema.index({ paidAt: -1 });

export const UserPayment = mongoose.model<IUserPayment>('UserPayment', UserPaymentSchema, 'user_payments');
