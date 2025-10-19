// src/services/payment.service.ts
import { axiosInstance } from "@/lib/axios.config";
import {PurchaseOrder} from "@/model/purchase-order.ts";
import { RecordPurchaseType } from "@/model/record-purchase-type";

export type CreatePurchaseOrderRequest = {
    type: RecordPurchaseType;
    email?: string;
    userId?: string;
    locationId: string;
    activationKey?: string;
    startTime: number;          // epoch ms
    durationMinutes: number;
};

export type CreatePaymentIntentResponse = {
    clientSecret: string;
    paymentIntentId: string;
};

export type ReserveRequest = {
    paymentIntentId: string;
    userId: string;
    locationId: string;
    startTime: number;
    durationMinutes: number;
};

export type ReserveResponse = {
    ok: boolean;
    reservationId: string;
};

export type CancelResponse = {
    ok: boolean;
    canceled: boolean;
};


export class PaymentService {

    static async getPurchaseOrder(id: string): Promise<PurchaseOrder> {
        const {data} = await axiosInstance.get<PurchaseOrder>(`/public/purchase-order/${id}`);
        return data;
    }

    static async createPurchaseOrderAnonymously(request: CreatePurchaseOrderRequest): Promise<PurchaseOrder> {
        const {data} = await axiosInstance.post<PurchaseOrder>('/public/purchase-order', request);
        return data;
    }

    /** Step 1: Create (or reuse) a PaymentIntent for the order. */
    static async createPaymentIntent(poId: string): Promise<CreatePaymentIntentResponse> {
        const { data } = await axiosInstance.post<CreatePaymentIntentResponse>(`/public/purchase-order/${poId}/payment-intent`);
        return data;
    }

    /** Step 2: Short reservation/hold when user clicks Pay. */
    static async reserve(body: ReserveRequest): Promise<ReserveResponse> {
        const { data } = await axiosInstance.post<ReserveResponse>(`/reserve`, body);
        return data;
    }

    /** Optional: Cancel PI + release hold if user backs out. */
    static async cancel(paymentIntentId: string): Promise<CancelResponse> {
        const { data } = await axiosInstance.post<CancelResponse>(`/cancel`, { paymentIntentId });
        return data;
    }
}
