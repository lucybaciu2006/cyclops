import {Request, Response} from "express";
import Stripe from "stripe";
import {StripeService} from "../services/StripeService";
import {PaymentService} from "../services/PaymentService";

export class StripeWebhooksController {

    public static async handleWebhook(req: Request, res: Response): Promise<void> {
        const sig = req.headers['stripe-signature'] as string;

        let event: Stripe.Event;

        try {
            event = StripeService.constructEvent(req.body, sig);
        } catch (err: any) {
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }
        console.log('received webhook event', event.type);
            switch (event.type) {
                case 'payment_intent.succeeded': {
                    const pi = event.data.object as Stripe.PaymentIntent;
                    await PaymentService.handlePaymentSucceeded(pi);
                }

                case 'invoice.payment_failed': {
                    console.log('invoice.payment_failed received');
                    const invoice = event.data.object as Stripe.Invoice;
                    await PaymentService.handlePaymentFailed(invoice);
                    break;
                }

                case 'customer.subscription.deleted': {
                    const subscription = event.data.object as Stripe.Subscription;
                    const customerId = subscription.customer as string;

                    // TODO: Mark subscription as canceled in your DB
                    console.log(`🚫 Subscription ${subscription.id} canceled`);

                    break;
                }

                default:
                    break;
            }

            res.status(200).send('Webhook received');
    }

}