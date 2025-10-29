import mongoose, { Document, Schema } from 'mongoose';

// 1) Interface (plain shape for data transfer)
export interface IRecordingSession {
    id?: string;
    userId: string;
    locationId: string;
    dayKey: string; // "YYYY-MM-DD"
    slotIndex: number; // 0..47 for 30-minute slots
    slotDuration: number; // minutes per slot (e.g., 30)
    duration: number; // number of slots
    views: number;
    status: RecordingSessionStatus;
    metadata?: any;
}

export enum RecordingSessionStatus {
    ARMED = 'ARMED',
    RECORDING = 'RECORDING',
    POST_PROCESSING = 'POST_PROCESSING',
    COMPLETED = 'COMPLETED'
}

// 2) Model + Schema (Mongoose)
export interface IRecordingSessionDoc extends Document {
    userId: string;
    locationId: string;
    dayKey: string;
    slotIndex: number;
    slotDuration: number;
    duration: number;
    views: number;
    status: RecordingSessionStatus;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

const RecordingSessionSchema = new Schema<IRecordingSessionDoc>({
    userId: { type: String, required: true, index: true },
    locationId: { type: String, required: true, index: true },
    dayKey: { type: String, required: true, index: true },
    slotIndex: { type: Number, required: true, min: 0 },
    slotDuration: { type: Number, required: true, min: 1, default: 30 },
    duration: { type: Number, required: true, min: 1 },
    views: { type: Number, required: true, default: 0 },
    status: { type: String, required: true, enum: Object.values(RecordingSessionStatus) },
    metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

// Avoid double-booking the exact same start slot for the same location/day
RecordingSessionSchema.index({ locationId: 1, dayKey: 1, slotIndex: 1 }, { unique: true });

export const RecordingSessionModel = mongoose.model<IRecordingSessionDoc>(
    'RecordingSession',
    RecordingSessionSchema
);
