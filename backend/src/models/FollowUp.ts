import mongoose, { Schema, Document } from 'mongoose';

export interface IFollowUp extends Document {
    title: string;
    type: 'call' | 'email' | 'meeting' | 'task';
    contactName: string;
    contactCompany: string;
    contactEmail?: string;
    leadId?: mongoose.Types.ObjectId;
    customerId?: mongoose.Types.ObjectId;
    dueDate: Date;
    dueTime: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'completed' | 'overdue' | 'cancelled';
    notes?: string;
    assignedTo: mongoose.Types.ObjectId;
    branchId: string;
    completedAt?: Date;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const FollowUpSchema = new Schema<IFollowUp>({
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['call', 'email', 'meeting', 'task'],
        required: true
    },
    contactName: {
        type: String,
        required: true,
        trim: true
    },
    contactCompany: {
        type: String,
        required: true,
        trim: true
    },
    contactEmail: {
        type: String,
        lowercase: true,
        trim: true
    },
    leadId: {
        type: Schema.Types.ObjectId,
        ref: 'Lead'
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer'
    },
    dueDate: {
        type: Date,
        required: true
    },
    dueTime: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'overdue', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    branchId: {
        type: String,
        required: true
    },
    completedAt: {
        type: Date
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes
FollowUpSchema.index({ branchId: 1, status: 1 });
FollowUpSchema.index({ assignedTo: 1, dueDate: 1 });
FollowUpSchema.index({ dueDate: 1, status: 1 });

export const FollowUp = mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);
