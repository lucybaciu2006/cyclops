import {RecordPurchaseType} from "./RecordPurchaseType";

export interface CreateStripeCheckoutSessionOpts {
    locale: string;
    successUrl: string;
    cancelUrl: string;
    email: string;
    purchaseType: RecordPurchaseType;
}