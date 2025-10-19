import mongoose, { Document, Schema } from 'mongoose';

export interface IUserSubscription extends Document {
    userId: string;
    stripeSubscriptionId: string;
    propertyId: string;
    status: 'active' | 'canceled' | 'past_due';
    type: 'paid' | 'invitation';
    startedAt: number;
    endedAt?: number;
    cancelAtPeriodEnd?: boolean;
    nextBillingDate?: number;
    lastPaymentAt?: number;
    validUntil: number;
    metadata?: Record<string, any>;
}

const UserSubscriptionSchema = new Schema<IUserSubscription>({
    userId: { type: String, required: true, index: true },
    stripeSubscriptionId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true },
    status: {
        type: String,
        enum: ['active', 'canceled', 'past_due'],
        required: true,
    },
    type: {
        type: String,
        enum: ['paid', 'invitation'],
        required: true,
    },
    startedAt: { type: Number, required: true },
    endedAt: { type: Number },
    cancelAtPeriodEnd: { type: Boolean },
    nextBillingDate: { type: Number },
    lastPaymentAt: { type: Number },
    validUntil: {type: Number, required: true},
    metadata: { type: Schema.Types.Mixed }
}, {
    timestamps: true
});

// dont make user-property index, because the user may create a new subscription for the same property if the first expired.

export const UserSubscription = mongoose.model<IUserSubscription>('UserSubscription', UserSubscriptionSchema, 'user_subscriptions');
