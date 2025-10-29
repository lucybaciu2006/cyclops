import mongoose, { Document, Schema } from 'mongoose';
import {StoredFile} from "../StoredFile";
import {SportType} from "./SportType";

export interface ISportLocation extends Document {
    name: string;
    slug: string;
    address: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    image?: StoredFile;
    sport: SportType;
    snapshotUrl?: string;
}

const SportLocationSchema = new Schema<ISportLocation>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        trim: true
    },
    sport: {
        type: String,
        required: true,
        enum: Object.values(SportType),
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    image: {
        type: Object, // assuming StoredFile is a plain object
        required: false
    },
    snapshotUrl: {
        type: String,
        required: false,
        trim: true
    }
}, {
    timestamps: true
});

export const SportLocation = mongoose.model<ISportLocation, mongoose.Model<ISportLocation>>('SportLocation', SportLocationSchema);
