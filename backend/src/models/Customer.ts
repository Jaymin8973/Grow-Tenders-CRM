import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
    name: string;
    type: 'company' | 'individual';
    email: string;
    phone?: string;
    website?: string;
    industry: string;
    lifecycle: 'lead' | 'prospect' | 'customer' | 'churned';
    totalDeals: number;
    totalRevenue: number;
    owner: mongoose.Types.ObjectId;
    branchId: string;
    address?: string;
    notes?: string;
    createdBy: mongoose.Types.ObjectId;

    // Subscription fields (for Grow Tenders)
    subscriptionPlan?: string;  // basic, standard, premium, enterprise
    subscriptionStart?: Date;
    subscriptionEnd?: Date;
    subscriptionStatus: 'none' | 'active' | 'expired' | 'cancelled';
    autoRenewal: boolean;

    // Tender preferences
    categories: string[];  // Selected tender categories
    states: string[];      // Selected states for tenders

    // Business details
    gstin?: string;  // GST number
    contactPerson?: string;

    // Email preferences
    emailAlerts: boolean;
    alertFrequency: 'daily' | 'weekly' | 'realtime';

    createdAt: Date;
    updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['company', 'individual'],
        default: 'company'
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    industry: {
        type: String,
        required: true,
        trim: true
    },
    lifecycle: {
        type: String,
        enum: ['lead', 'prospect', 'customer', 'churned'],
        default: 'lead'
    },
    totalDeals: {
        type: Number,
        default: 0
    },
    totalRevenue: {
        type: Number,
        default: 0
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    branchId: {
        type: String,
        required: true
    },
    address: {
        type: String
    },
    notes: {
        type: String
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Subscription fields
    subscriptionPlan: {
        type: String,
        enum: ['basic', 'standard', 'premium', 'enterprise'],
    },
    subscriptionStart: Date,
    subscriptionEnd: Date,
    subscriptionStatus: {
        type: String,
        enum: ['none', 'active', 'expired', 'cancelled'],
        default: 'none'
    },
    autoRenewal: {
        type: Boolean,
        default: false
    },

    // Tender preferences
    categories: [{
        type: String
    }],
    states: [{
        type: String
    }],

    // Business details
    gstin: String,
    contactPerson: String,

    // Email preferences
    emailAlerts: {
        type: Boolean,
        default: true
    },
    alertFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'realtime'],
        default: 'daily'
    }
}, {
    timestamps: true
});

// Indexes
CustomerSchema.index({ branchId: 1, lifecycle: 1 });
CustomerSchema.index({ owner: 1 });
CustomerSchema.index({ email: 1 }, { unique: true });
CustomerSchema.index({ subscriptionStatus: 1 });
CustomerSchema.index({ subscriptionEnd: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
