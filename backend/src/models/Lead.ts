import mongoose, { Document, Schema } from 'mongoose';

export type LeadType = 'hot' | 'warm' | 'cold';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export interface ILead extends Document {
    _id: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    source: string;
    leadType: LeadType;
    status: LeadStatus;
    score?: number;
    expectedValue?: number;
    notes?: string;

    // Assignment fields
    assignedTo?: mongoose.Types.ObjectId;    // Employee ID
    assignedBy?: mongoose.Types.ObjectId;    // Manager ID who assigned
    assignedAt?: Date;
    teamId?: mongoose.Types.ObjectId;

    // Branch info
    branchId?: string;

    // Activity tracking
    lastContactedAt?: Date;
    nextFollowUpAt?: Date;

    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        company: {
            type: String,
            trim: true,
        },
        source: {
            type: String,
            enum: ['website', 'linkedin', 'referral', 'cold_call', 'event', 'ads', 'other'],
            default: 'other',
        },
        leadType: {
            type: String,
            enum: ['hot', 'warm', 'cold'],
            default: 'cold',
            required: true,
        },
        status: {
            type: String,
            enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
            default: 'new',
        },
        score: {
            type: Number,
            min: 0,
            max: 100,
            default: 50,
        },
        expectedValue: {
            type: Number,
            default: 0,
        },
        notes: {
            type: String,
        },

        // Assignment
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        assignedAt: {
            type: Date,
        },
        teamId: {
            type: Schema.Types.ObjectId,
            ref: 'Team',
        },
        branchId: {
            type: String,
        },

        // Activity
        lastContactedAt: {
            type: Date,
        },
        nextFollowUpAt: {
            type: Date,
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ teamId: 1 });
leadSchema.index({ leadType: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ branchId: 1 });
leadSchema.index({ email: 1 });

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
