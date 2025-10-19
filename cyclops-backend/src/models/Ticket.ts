import mongoose, { Document, Schema } from 'mongoose';

export interface ITicket extends Document {
    email: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general';
    assignedTo?: string;
    resolvedAt?: Date;
}

const TicketSchema = new Schema<ITicket>({
    email: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open',
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
        required: true
    },
    category: {
        type: String,
        enum: ['technical', 'billing', 'feature_request', 'bug_report', 'general'],
        default: 'general',
        required: true
    },
    assignedTo: {
        type: String,
        ref: 'User',
        required: false
    },
    resolvedAt: {
        type: Date,
        required: false
    }
}, {
    timestamps: true
});

TicketSchema.index({ userId: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ category: 1 });

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema); 