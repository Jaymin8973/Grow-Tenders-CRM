import mongoose, { Schema, Document } from 'mongoose';

export interface IDeal extends Document {
    title: string;
    company: string;
    value: number;
    probability: number;
    stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
    expectedCloseDate: Date;
    owner: mongoose.Types.ObjectId;
    leadId?: mongoose.Types.ObjectId;
    branchId: string;
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const DealSchema = new Schema<IDeal>({
    title: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        required: true,
        trim: true
    },
    value: {
        type: Number,
        required: true,
        default: 0
    },
    probability: {
        type: Number,
        default: 20,
        min: 0,
        max: 100
    },
    stage: {
        type: String,
        enum: ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
        default: 'prospecting'
    },
    expectedCloseDate: {
        type: Date,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    leadId: {
        type: Schema.Types.ObjectId,
        ref: 'Lead'
    },
    branchId: {
        type: String,
        required: true
    },
    notes: {
        type: String
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
DealSchema.index({ branchId: 1, stage: 1 });
DealSchema.index({ owner: 1 });
DealSchema.index({ createdAt: -1 });

export const Deal = mongoose.model<IDeal>('Deal', DealSchema);
