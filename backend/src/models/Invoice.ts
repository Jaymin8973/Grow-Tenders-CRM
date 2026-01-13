import mongoose, { Document, Schema } from 'mongoose';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface IInvoice extends Document {
    _id: mongoose.Types.ObjectId;
    invoiceNumber: string;
    customerId: mongoose.Types.ObjectId;
    planId: string;
    planName: string;

    // Billing details
    subtotal: number;
    gstRate: number;
    gstAmount: number;
    total: number;

    // Dates
    invoiceDate: Date;
    dueDate: Date;
    paidAt?: Date;

    // Status
    status: InvoiceStatus;

    // Period
    periodStart: Date;
    periodEnd: Date;

    // Customer snapshot (in case customer details change)
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerAddress?: string;
    customerGSTIN?: string;

    // Metadata
    notes?: string;
    branchId: string;
    createdBy: mongoose.Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
    {
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
        },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
        },
        planId: {
            type: String,
            required: true,
        },
        planName: {
            type: String,
            required: true,
        },
        subtotal: {
            type: Number,
            required: true,
        },
        gstRate: {
            type: Number,
            required: true,
            default: 18,
        },
        gstAmount: {
            type: Number,
            required: true,
        },
        total: {
            type: Number,
            required: true,
        },
        invoiceDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        paidAt: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
            default: 'draft',
        },
        periodStart: {
            type: Date,
            required: true,
        },
        periodEnd: {
            type: Date,
            required: true,
        },
        customerName: {
            type: String,
            required: true,
        },
        customerEmail: {
            type: String,
            required: true,
        },
        customerPhone: String,
        customerAddress: String,
        customerGSTIN: String,
        notes: String,
        branchId: {
            type: String,
            required: true,
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

// Auto-generate invoice number
invoiceSchema.pre('save', async function (next) {
    if (this.isNew && !this.invoiceNumber) {
        const count = await mongoose.model('Invoice').countDocuments();
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        this.invoiceNumber = `GT-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
