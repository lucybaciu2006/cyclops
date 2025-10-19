import {RecordPurchaseType} from "./RecordPurchaseType";
import {z} from "zod";
import {ObjectValidator} from "../../core/validators/ObjectValidator";

export interface CreatePurchaseOrderRequest {
    type: RecordPurchaseType;
    email?: string;
    userId?: string;
    locationId: string;
    activationKey?: string; // temporary key for device security
    startTime: number;
    durationMinutes: number;
}


export const CreatePurchaseOrderRequestValidator = new ObjectValidator({
    type: z.enum(["FULL_VIDEO", "FULL_VIDEO_WITH_HIGHLIGHTS"]),
    email: z.string().email().optional(),
    userId: z.string().min(1).optional(),
    locationId: z.string().min(1),
    activationKey: z.string().optional(),
    startTime: z.number().int().positive(),
    durationMinutes: z.number().int().min(1),
});