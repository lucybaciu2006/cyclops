import {PurchaseOrderStatus} from "@/model/purchase-order-status.ts";
import {CreatePurchaseOrderRequest} from "@/services/PaymentService.ts";

export interface PurchaseOrder {
    _id: string;
    status: PurchaseOrderStatus;
    request: CreatePurchaseOrderRequest; // The wizard snapshot
    stripePaymentIntentId?: string;
    stripeClientSecret?: string;
    reservationId?: string;
}