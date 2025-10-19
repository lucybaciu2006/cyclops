import {Request, Response} from "express";
import {IUser, User} from "../models/User";
import {UserPayment} from "../models/UserPayment";
import {stripeInstance} from "../services/StripeService";
import {CreatePurchaseOrderRequest, CreatePurchaseOrderRequestValidator} from "../models/payment/CreatePurchaseOrderRequest";
import {IPurchaseOrder, PurchaseOrder} from "../models/IPurchaseOrder";
import {ValidationError} from "../core/validators/ValidationError";
import {AuthService} from "../services/AuthService";
import {RandomUtils} from "../core/RandomUtils";
import {env} from "../config/env";
import {RecordPurchaseType} from "../models/payment/RecordPurchaseType";
import {CriticalError} from "../errors/CriticalError";

export class PaymentController {

    static async createPurchaseOrderAnonymous(req: Request, res: Response) {
        let orderRequest = req.body as CreatePurchaseOrderRequest;
        CreatePurchaseOrderRequestValidator.validate(orderRequest);
        let email = orderRequest.email;
        if (!email) {
            throw new ValidationError('Email is required');
        }
        let user: IUser | null = await User.findOne({email: email});
        if (!user) {
            user = (await AuthService.register({
                anonymous: true,
                email: email,
                name: 'Anonymous user',
                password: RandomUtils.randomString(20)
            })).user;
        }
        orderRequest.email = user.email;
        orderRequest.userId = user._id;

        const entity: Partial<IPurchaseOrder> = {
            status: 'draft',
            request: orderRequest,
        };

        // TODO create user if it doesn't exist.
        let createdPO = await PurchaseOrder.create(entity);
        res.json(createdPO);
    }

    // POST /payment-intents
    static async createPaymentIntentForPurchaseOrder(req: Request, res: Response) {
        const {id} = req.params;
        const purchaseOrder: IPurchaseOrder | null = await PurchaseOrder.findById(id);

        if (!purchaseOrder) {
            res.status(404).send();
            return;
        }
        if (purchaseOrder.stripePaymentIntentId) {
            const existing = await stripeInstance.paymentIntents.retrieve(purchaseOrder.stripePaymentIntentId);
            // TODO maybe handle expired intents here.see https://docs.stripe.com/payments/paymentintents/lifecycle#intent-statuses
            res.json({ clientSecret: existing.client_secret, paymentIntentId: existing.id });
        }

        const priceId = purchaseOrder.request.type === RecordPurchaseType.FULL_VIDEO ? env.STRIPE_BASE_PRICE_ID : env.STRIPE_HIGHLIGHTS_PRICE_ID;

        const stripePrice = await stripeInstance.prices.retrieve(priceId);
        if (!stripePrice) {
            throw new CriticalError('Stripe price not found: ' + priceId);
        }

        const pi = await stripeInstance.paymentIntents.create({
            amount: stripePrice.unit_amount!,
            currency: stripePrice.currency,
            automatic_payment_methods: { enabled: true },
            receipt_email: purchaseOrder!.request.email!,
            metadata: {
                purchaseOrder: id
            },
        // }, {
            // Helpful if client retries this endpoint
            // idempotencyKey: purchaseOrder!._id as string,
        });
        purchaseOrder.stripePaymentIntentId = pi.id;
        await purchaseOrder.save();

        res.json({ clientSecret: pi.client_secret, paymentIntentId: pi.id });
    }

    static async getPurchaseOrder(req: Request, res: Response) {
        const {id} = req.params;
        const purchaseOrder: IPurchaseOrder | null = await PurchaseOrder.findById(id);
        if (!purchaseOrder) {
            res.status(404).send();
        }
        res.json(purchaseOrder);
    }

    // POST /reserve
    static async reserve(req: Request, res: Response) {
        const { paymentIntentId, userId, locationId, startTime, durationMinutes } = req.body;
        const slots = 2;

        // Try create hold
        let reservation;
        try {
            reservation = await Reservation.create({
                locationId, userId, slots,
                stripePaymentIntentId: paymentIntentId,
                // expiresAt auto-set by schema (2 min)
            });
        } catch (e) {
            if (e?.code === 11000) { // unique index hit
                return res.status(409).json({ error: 'Slot just got booked. Pick another time.' });
            }
            throw e;
        }

        // Attach reservationId to PI (for webhook reconciliation)
        await stripeInstance.paymentIntents.update(paymentIntentId, {
            metadata: { reservationId: reservation._id.toString() }
        });

        res.json({ ok: true, reservationId: reservation._id });
    }

    public static async getPayments(req: Request, res: Response): Promise<void> {
        const principal: IUser = req.principal;
        const payments = await UserPayment.find({userId: principal.id}).sort({paidAt: -1});
        res.status(200).json(payments);
    }

}