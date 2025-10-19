import {StripeService} from './StripeService';
import {IUserSubscription, UserSubscription} from "../models/UserSubscription";
import {CriticalError} from "../errors/CriticalError";
import Stripe from "stripe";
import {UserPayment} from "../models/UserPayment";
import {CreatePurchaseOrderRequest} from "../models/payment/CreatePurchaseOrderRequest";
import {SportLocation} from "../models/entities/SportLocation";

export class PaymentService {


    public static async handlePaymentSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
        const purchaseOrderId = pi.metadata.purchaseOrder;
        if (!purchaseOrderId) {
            throw new CriticalError('Metadata purchaseOrderId not found')
        }
        console.log('PAYMENT RECEIVED');
    }

    public static async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
        const customerId = invoice.customer as string;
        const stripeSubscriptionId = invoice.lines.data[0].id as string;
        const subscription: IUserSubscription = UserSubscription.findById(stripeSubscriptionId);

        // ✅ Mark it as 'past_due' or 'payment_failed'
        if (subscription) {
            // TODO notify
            subscription.status = 'past_due';
            await subscription.save();
        }

        await UserPayment.create({
            userId: subscription.userId,
            stripeCustomerId: customerId,
            stripeInvoiceId: invoice.id,
            stripeSubscriptionId: stripeSubscriptionId,
            subscriptionId: subscription.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'failed',
            billingReason: invoice.billing_reason,
            paidAt: invoice.created,
        });

        // You can notify the user, or flag the account for attention
        console.warn(`⚠️ Payment failed for user ${subscription.userId}, subscription ${stripeSubscriptionId}`);
    }

}
