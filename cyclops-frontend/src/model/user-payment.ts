export interface UserPayment {
    userId: string;
    propertyId: string;
    propertyName: string;
    subscriptionId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripeInvoiceId: string;
    stripeInvoiceNumber: string;
    invoiceUrl: string;
    amount: number;                        // Amount in cents
    currency: string;                      // e.g., "usd"
    status: 'paid' | 'refunded' | 'failed';
    billingReason: string;                 // e.g., 'subscription_cycle'
    paidAt: number;                        // UNIX timestamp
}