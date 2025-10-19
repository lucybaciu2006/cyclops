import mongoose, { Document, Schema } from 'mongoose';
import { SportType } from './SportType';
import { RecordSessionStatus } from './RecordSessionStatus';

export interface IRecordSession extends Document {
    locationId: string;
    userId: string;
    startTime: number;          // epoch ms
    durationMinutes: number;
    sport: SportType;
    status: RecordSessionStatus;
}

const RecordSessionSchema = new Schema<IRecordSession>(
    {
        locationId: {
            type: String,
            required: true,
            trim: true,
        },
        userId: {
            type: String,
            required: true,
            trim: true,
        },
        startTime: {
            type: Number,
            required: true,
        },
        durationMinutes: {
            type: Number,
            required: true,
            min: 1,
        },
        sport: {
            type: String,
            required: true,
            enum: Object.values(SportType),
        },
        status: {
            type: String,
            required: true,
            enum: Object.values(RecordSessionStatus),
        },
    },
    {
        timestamps: true,
    }
);

export const RecordSession = mongoose.model<IRecordSession, mongoose.Model<IRecordSession>>(
    'RecordSession',
    RecordSessionSchema
);
