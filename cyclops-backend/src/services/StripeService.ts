import Stripe from 'stripe';
import {env} from '../config/env';
import {StripeError} from "../errors/StripeError";
import {Translate} from "../../i18n";
import {CreateStripeCheckoutSessionOpts} from "../models/payment/CreateStripeCheckoutSessionOpts";

export const stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
});

export class StripeService {

    static constructEvent(body: any, signatureHeader: string) {
        try {
            return stripeInstance.webhooks.constructEvent(body, signatureHeader, env.STRIPE_WEBHOOK_SECRET);
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            throw new StripeError(err);
        }
    }

    static getSubscription(id: string): Promise<Stripe.Subscription> {
        return stripeInstance.subscriptions.retrieve(id);
    }

    static async getCheckoutSession(subscriptionId: string): Promise<Stripe.Checkout.Session> {
        const sessionsList = await stripeInstance.checkout.sessions.list({subscription: subscriptionId});
        return sessionsList.data[0]!;
    }

}
