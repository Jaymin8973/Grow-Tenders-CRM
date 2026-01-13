import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    managerId: mongoose.Types.ObjectId;
    branchId: string;
    branchName?: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        managerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        branchId: {
            type: String,
            required: true,
        },
        branchName: {
            type: String,
        },
        description: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster lookups
teamSchema.index({ managerId: 1 });
teamSchema.index({ branchId: 1 });

export const Team = mongoose.model<ITeam>('Team', teamSchema);
