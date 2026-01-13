import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionPlan extends Document {
    _id: mongoose.Types.ObjectId;
    planId: string;  // basic, standard, premium, enterprise
    name: string;
    price: number;
    duration: number;  // months
    maxCategories: number;  // -1 for unlimited
    maxStates: number;      // -1 for unlimited
    features: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
    {
        planId: {
            type: String,
            required: true,
            unique: true,
            enum: ['basic', 'standard', 'premium', 'enterprise'],
        },
        name: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
            default: 1,
        },
        maxCategories: {
            type: Number,
            required: true,
        },
        maxStates: {
            type: Number,
            required: true,
        },
        features: [{
            type: String,
        }],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);
