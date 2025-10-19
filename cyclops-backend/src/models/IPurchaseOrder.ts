// models/purchase-order.model.ts
import { Schema, model, Document } from "mongoose";
import {CreatePurchaseOrderRequest} from "./payment/CreatePurchaseOrderRequest";

// Your wizard's payload
export type RecordPurchaseType = "FULL_VIDEO" | "HIGHLIGHTS";

export type PurchaseOrderStatus =
    | "draft"       // Created from wizard, not paid yet
    | "reserved"    // Slot locked but payment not confirmed
    | "paid"        // Payment successful
    | "canceled"    // Aborted before payment
    | "expired";    // Reservation expired

export interface IPurchaseOrder extends Document {
    status: PurchaseOrderStatus;
    request: CreatePurchaseOrderRequest; // The wizard snapshot
    stripePaymentIntentId?: string;
    stripeClientSecret?: string;
    reservationId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
    {
        status: {
            type: String,
            enum: ["draft", "reserved", "paid", "canceled", "expired"],
            default: "draft",
        },
        request: {
            type: Object, // Keep entire wizard payload here
            required: true,
        },
        stripePaymentIntentId: { type: String },
        stripeClientSecret: { type: String },
        reservationId: { type: String },
    },
    { timestamps: true }
);

export const PurchaseOrder = model<IPurchaseOrder>(
    "PurchaseOrder",
    PurchaseOrderSchema
);
