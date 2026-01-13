import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
    type: 'lead_created' | 'lead_assigned' | 'deal_created' | 'deal_closed' | 'followup_completed' | 'customer_added' | 'note_added';
    message: string;
    entityType: 'lead' | 'deal' | 'customer' | 'followup' | 'user';
    entityId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    branchId: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
    type: {
        type: String,
        enum: ['lead_created', 'lead_assigned', 'deal_created', 'deal_closed', 'followup_completed', 'customer_added', 'note_added'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    entityType: {
        type: String,
        enum: ['lead', 'deal', 'customer', 'followup', 'user'],
        required: true
    },
    entityId: {
        type: Schema.Types.ObjectId
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    branchId: {
        type: String,
        required: true
    },
    metadata: {
        type: Schema.Types.Mixed
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

// Indexes
ActivitySchema.index({ branchId: 1, createdAt: -1 });
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ createdAt: -1 });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
