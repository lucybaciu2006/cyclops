import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { NotificationSettings } from '../core/NotificationTypes';
import {UserFacebookProfile} from "./user/UserFacebookProfile";
import {UserGoogleProfile} from "./user/UserGoogleProfile";
import {ExternalUserProfile} from "./user/ExternalUserProfile";

export interface IUser extends Document<string> {
    email: string;
    password: string;
    name: string;
    isAdmin: boolean;
    isAnonymous: boolean;
    emailConfirmed: boolean;
    companyName?: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    trialSecondsLeft: number;
    notifications: NotificationSettings;
    stripeCustomerId?: string;
    defaultPaymentMethodId?: string;
    facebookProfile?: ExternalUserProfile; // for facebook login
    googleProfile?: ExternalUserProfile; // for google login
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    isAdmin: {
        type: Boolean,
        required: true,
        default: false,
    },
    isAnonymous: {
        type: Boolean,
        required: true,
        default: false,
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    companyName: {
        type: String,
        trim: true
    },
    emailConfirmed: {
        type: Boolean,
        default: false
    },
    trialSecondsLeft: {
        type: Number,
    },
    stripeCustomerId: {type: String, required: false, default: null},
    defaultPaymentMethodId: {type: String, required: false},
    notifications: {
        type: Object,
        default: {
            callNotification: false,
            billingNotification: true,
            marketingNotification: false,
            language: 'en'
        }
    },
    facebookProfile: {type: Object},
    googleProfile: {type: Object},
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, {
    timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema); 