import nodemailer from 'nodemailer';

// Gmail SMTP Configuration
// To use this, you need to:
// 1. Enable 2-Step Verification on your Google Account
// 2. Generate an App Password at https://myaccount.google.com/apppasswords
// 3. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
};

// Company details for emails
const COMPANY = {
    name: 'Grow Tenders',
    email: process.env.GMAIL_USER || 'contact@growtenders.com',
    phone: '+91 XXXXX XXXXX',
    website: 'www.growtenders.com',
    address: 'Your Company Address, India',
    gstin: 'XXXXXXXXXXXXXXX',
};

// Format currency for emails
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};

// Format date for emails
const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

// Send Invoice Email
export const sendInvoiceEmail = async (invoiceData: {
    invoiceNumber: string;
    customerName: string;
    customerEmail: string;
    planName: string;
    subtotal: number;
    gstAmount: number;
    total: number;
    invoiceDate: Date;
    dueDate: Date;
    periodStart: Date;
    periodEnd: Date;
}) => {
    const transporter = createTransporter();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .header p { color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 14px; }
        .content { padding: 30px; }
        .invoice-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .invoice-number { font-size: 18px; font-weight: bold; color: #4f46e5; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .info-block h4 { margin: 0 0 10px; color: #666; font-size: 12px; text-transform: uppercase; }
        .info-block p { margin: 0; color: #333; }
        .plan-details { background: #f0f4ff; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .plan-details h3 { margin: 0 0 5px; color: #4f46e5; }
        .totals { margin-top: 20px; }
        .totals .row { display: flex; justify-content: space-between; padding: 8px 0; }
        .totals .row.total { border-top: 2px solid #4f46e5; font-size: 18px; font-weight: bold; color: #4f46e5; margin-top: 10px; padding-top: 15px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${COMPANY.name}</h1>
            <p>Tender Notification Service</p>
        </div>
        <div class="content">
            <div class="invoice-box">
                <div class="invoice-number">Invoice ${invoiceData.invoiceNumber}</div>
                <p style="margin: 5px 0 0; color: #666;">Generated on ${formatDate(invoiceData.invoiceDate)}</p>
            </div>
            
            <div class="info-grid">
                <div class="info-block">
                    <h4>Bill To</h4>
                    <p><strong>${invoiceData.customerName}</strong></p>
                    <p>${invoiceData.customerEmail}</p>
                </div>
                <div class="info-block" style="text-align: right;">
                    <h4>Payment Due</h4>
                    <p><strong>${formatDate(invoiceData.dueDate)}</strong></p>
                </div>
            </div>
            
            <div class="plan-details">
                <h3>${invoiceData.planName}</h3>
                <p>Subscription Period: ${formatDate(invoiceData.periodStart)} - ${formatDate(invoiceData.periodEnd)}</p>
            </div>
            
            <div class="totals">
                <div class="row">
                    <span>Subtotal</span>
                    <span>${formatCurrency(invoiceData.subtotal)}</span>
                </div>
                <div class="row">
                    <span>GST (18%)</span>
                    <span>${formatCurrency(invoiceData.gstAmount)}</span>
                </div>
                <div class="row total">
                    <span>Total Amount</span>
                    <span>${formatCurrency(invoiceData.total)}</span>
                </div>
            </div>
            
            <p style="text-align: center; margin-top: 30px;">
                Please make the payment by the due date to continue enjoying our services.
            </p>
        </div>
        <div class="footer">
            <p><strong>${COMPANY.name}</strong></p>
            <p>${COMPANY.address}</p>
            <p>Email: ${COMPANY.email} | Phone: ${COMPANY.phone}</p>
            <p>GSTIN: ${COMPANY.gstin}</p>
        </div>
    </div>
</body>
</html>
    `;

    const mailOptions = {
        from: `"${COMPANY.name}" <${COMPANY.email}>`,
        to: invoiceData.customerEmail,
        subject: `Invoice ${invoiceData.invoiceNumber} - ${COMPANY.name}`,
        html: htmlContent,
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log('Invoice email sent:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Failed to send invoice email:', error);
        throw error;
    }
};

// Send Subscription Confirmation Email
export const sendSubscriptionConfirmationEmail = async (data: {
    customerName: string;
    customerEmail: string;
    planName: string;
    categories: string[];
    states: string[];
    startDate: Date;
    endDate: Date;
}) => {
    const transporter = createTransporter();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .header .icon { font-size: 48px; margin-bottom: 10px; }
        .content { padding: 30px; }
        .welcome-box { background: #f0fdf4; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px; }
        .plan-badge { display: inline-block; background: #10b981; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; }
        .details-grid { margin: 20px 0; }
        .detail-item { padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
        .detail-item:last-child { border-bottom: none; }
        .tags { display: flex; flex-wrap: wrap; gap: 5px; }
        .tag { background: #e0e7ff; color: #4f46e5; padding: 4px 10px; border-radius: 12px; font-size: 12px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">✓</div>
            <h1>Subscription Confirmed!</h1>
        </div>
        <div class="content">
            <div class="welcome-box">
                <p>Welcome, <strong>${data.customerName}</strong>!</p>
                <p>Your subscription to <span class="plan-badge">${data.planName}</span> is now active.</p>
            </div>
            
            <div class="details-grid">
                <div class="detail-item">
                    <span>Subscription Period</span>
                    <span><strong>${formatDate(data.startDate)} - ${formatDate(data.endDate)}</strong></span>
                </div>
                <div class="detail-item">
                    <span>Selected Categories</span>
                    <div class="tags">
                        ${data.categories.slice(0, 5).map(c => `<span class="tag">${c}</span>`).join('')}
                        ${data.categories.length > 5 ? `<span class="tag">+${data.categories.length - 5} more</span>` : ''}
                    </div>
                </div>
                <div class="detail-item">
                    <span>Selected States</span>
                    <div class="tags">
                        ${data.states.slice(0, 5).map(s => `<span class="tag">${s}</span>`).join('')}
                        ${data.states.length > 5 ? `<span class="tag">+${data.states.length - 5} more</span>` : ''}
                    </div>
                </div>
            </div>
            
            <p style="text-align: center; color: #666;">
                You will start receiving tender alerts based on your preferences. Thank you for choosing ${COMPANY.name}!
            </p>
        </div>
        <div class="footer">
            <p><strong>${COMPANY.name}</strong></p>
            <p>Email: ${COMPANY.email} | Phone: ${COMPANY.phone}</p>
        </div>
    </div>
</body>
</html>
    `;

    const mailOptions = {
        from: `"${COMPANY.name}" <${COMPANY.email}>`,
        to: data.customerEmail,
        subject: `Welcome to ${COMPANY.name} - Subscription Confirmed!`,
        html: htmlContent,
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Failed to send confirmation email:', error);
        throw error;
    }
};

// Check if email service is configured
export const isEmailConfigured = () => {
    return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
};
