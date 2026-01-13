import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type Role = 'super_admin' | 'manager' | 'employee';
export type UserStatus = 'active' | 'inactive' | 'invited';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    branchId?: string;
    branchName?: string;
    teamId?: mongoose.Types.ObjectId;
    status: UserStatus;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
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
        role: {
            type: String,
            enum: ['super_admin', 'manager', 'employee'],
            default: 'employee',
        },
        branchId: {
            type: String,
        },
        branchName: {
            type: String,
        },
        teamId: {
            type: Schema.Types.ObjectId,
            ref: 'Team',
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'invited'],
            default: 'active',
        },
        lastLogin: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
