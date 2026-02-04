import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private logoBase64: string;

  constructor() {
    // Load logo as base64
    try {
      const logoPath = path.join(__dirname, '../../assets/logo.jpg');
      const logoBuffer = fs.readFileSync(logoPath);
      this.logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
    } catch (error) {
      this.logoBase64 = '';
    }

    // Register Handlebars helpers
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    Handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
      }).format(amount);
    });

    Handlebars.registerHelper('lowercase', (str: string) => {
      return str?.toLowerCase() || '';
    });
  }

  private invoiceTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4;
      margin: 12mm;
    }
    
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      font-size: 12px; 
      color: #111827; 
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    
    .invoice-container {
      width: 100%;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 0;
      overflow: hidden;
    }
    
    /* Header Section */
    .header {
      background: #ffffff;
      color: #0f172a;
      padding: 24px 28px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .company-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .company-logo {
      width: 64px;
      height: 64px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      padding: 6px;
      object-fit: contain;
    }
    
    .company-details h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 4px;
      color: #0f172a;
    }
    
    .company-details p {
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
    }
    
    .invoice-info {
      text-align: right;
    }
    
    .invoice-title {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    
    .invoice-number {
      font-size: 14px;
      font-weight: 600;
      color: #2563eb;
      display: inline-block;
    }
    
    .invoice-meta {
      margin-top: 16px;
    }
    
    .invoice-meta-row {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 4px;
      font-size: 12px;
    }
    
    .invoice-meta-label {
      color: #64748b;
    }
    
    .invoice-meta-value {
      font-weight: 600;
      color: #0f172a;
    }
    
    /* Status Badge */
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid #e2e8f0;
    }
    
    .status-draft { background: #fef3c7; color: #92400e; }
    .status-sent { background: #dbeafe; color: #1e40af; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
    .status-cancelled { background: #f3f4f6; color: #4b5563; }

    /* Content Section */
    .content {
      padding: 24px 28px;
    }
    
    /* Bill To Section */
    .billing-section {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 24px;
      background: #ffffff;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    
    .bill-to {
      flex: 1;
    }
    
    .bill-to-title {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    
    .bill-to-name {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 4px;
    }
    
    .bill-to-details {
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
    }
    
    /* Info Cards */
    .info-cards {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }
    
    .info-card {
      background: transparent;
      border: none;
      border-radius: 0;
      padding: 0;
      text-align: right;
      min-width: 0;
    }
    
    .info-card-label {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    
    .info-card-value {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
    }

    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      border-radius: 0;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    .items-table thead {
      display: table-header-group;
    }

    .items-table tr {
      page-break-inside: avoid;
    }
    
    .items-table th {
      background: #f8fafc;
      color: #334155;
      padding: 10px 12px;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid #e2e8f0;
    }
    
    .items-table th:last-child,
    .items-table td:last-child {
      text-align: right;
    }
    
    .items-table td {
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      font-size: 12px;
    }
    
    .items-table tbody tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .items-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    .items-table .qty { text-align: right; width: 60px; }
    .items-table .price { text-align: right; width: 110px; }
    .items-table .total { text-align: right; width: 110px; font-weight: 600; }
    
    .item-description {
      font-weight: 500;
      color: #0f172a;
    }

    /* Totals Section */
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    
    .totals-table {
      width: 280px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      font-size: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .totals-row:last-child {
      border-bottom: none;
    }
    
    .totals-row.grand-total {
      background: #0f172a;
      color: white;
      font-size: 14px;
      font-weight: 700;
    }
    
    .totals-row .label {
      color: #64748b;
    }
    
    .totals-row .value {
      font-weight: 600;
      color: #0f172a;
    }
    
    .grand-total .label,
    .grand-total .value {
      color: white !important;
    }

    /* Notes Section */
    .notes {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 12px;
    }
    
    .notes-title {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 6px;
    }
    
    .notes-content {
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }
    
    /* Terms Section */
    .terms {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 12px;
    }
    
    .terms-title {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 6px;
    }
    
    .terms-content {
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }
    
    /* Payment Terms */
    .payment-terms {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 12px;
    }
    
    .payment-terms-title {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 6px;
    }
    
    .payment-terms-content {
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }

    /* Footer */
    .footer {
      background: #ffffff;
      color: #475569;
      padding: 16px 28px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer-thanks {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #0f172a;
    }
    
    .footer-tagline {
      font-size: 11px;
      color: #64748b;
    }
    
    .footer-contact {
      margin-top: 8px;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        {{#if logo}}
        <img src="{{logo}}" alt="Company Logo" class="company-logo">
        {{/if}}
        <div class="company-details">
          <h1>{{companyName}}</h1>
          {{#if companyAddress}}<p>{{companyAddress}}</p>{{/if}}
          {{#if companyPhone}}<p>Phone: {{companyPhone}}</p>{{/if}}
          {{#if companyEmail}}<p>Email: {{companyEmail}}</p>{{/if}}
        </div>
      </div>
      <div class="invoice-info">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">{{invoiceNumber}}</div>
        <div class="invoice-meta">
          <div class="invoice-meta-row">
            <span class="invoice-meta-label">Invoice Date:</span>
            <span class="invoice-meta-value">{{formatDate createdAt}}</span>
          </div>
          <div class="invoice-meta-row">
            <span class="status-badge status-{{lowercase status}}">{{status}}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="billing-section">
        <div class="bill-to">
          <div class="bill-to-title">Bill To</div>
          <div class="bill-to-name">{{customer.firstName}} {{customer.lastName}}</div>
          <div class="bill-to-details">
            {{#if customer.company}}{{customer.company}}<br>{{/if}}
            {{#if customer.email}}{{customer.email}}<br>{{/if}}
            {{#if customer.phone}}{{customer.phone}}{{/if}}
          </div>
        </div>
        <div class="info-cards">
          <div class="info-card">
            <div class="info-card-label">Invoice No.</div>
            <div class="info-card-value">{{invoiceNumber}}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">Date</div>
            <div class="info-card-value">{{formatDate createdAt}}</div>
          </div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="qty">Qty</th>
            <th class="price">Unit Price</th>
            <th class="total">Total</th>
          </tr>
        </thead>
        <tbody>
          {{#each lineItems}}
          <tr>
            <td class="item-description">{{description}}</td>
            <td class="qty">{{quantity}}</td>
            <td class="price">{{formatCurrency unitPrice}}</td>
            <td class="total">{{formatCurrency total}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-table">
          <div class="totals-row">
            <span class="label">Subtotal</span>
            <span class="value">{{formatCurrency subtotal}}</span>
          </div>
          {{#if taxRate}}
          <div class="totals-row">
            <span class="label">GST ({{taxRate}}%)</span>
            <span class="value">{{formatCurrency taxAmount}}</span>
          </div>
          {{/if}}
          {{#if discount}}
          <div class="totals-row">
            <span class="label">Discount</span>
            <span class="value">-{{formatCurrency discount}}</span>
          </div>
          {{/if}}
          <div class="totals-row grand-total">
            <span class="label">Total Amount</span>
            <span class="value">{{formatCurrency total}}</span>
          </div>
        </div>
      </div>

      {{#if paymentTerms}}
      <div class="payment-terms">
        <div class="payment-terms-title">Payment Terms</div>
        <div class="payment-terms-content">{{paymentTerms}}</div>
      </div>
      {{/if}}

      {{#if notes}}
      <div class="notes">
        <div class="notes-title">Notes</div>
        <div class="notes-content">{{notes}}</div>
      </div>
      {{/if}}

      {{#if termsConditions}}
      <div class="terms">
        <div class="terms-title">Terms & Conditions</div>
        <div class="terms-content">{{termsConditions}}</div>
      </div>
      {{/if}}
    </div>

    <div class="footer">
      <div class="footer-thanks">Thank you for your business!</div>
      <div class="footer-tagline">We appreciate your trust in {{companyName}}</div>
      {{#if companyPhone}}
      <div class="footer-contact">
        For any queries, please contact us at {{companyPhone}} | {{companyEmail}}
      </div>
      {{/if}}
    </div>
  </div>
</body>
</html>
  `;

  async generateInvoicePdf(invoice: any): Promise<Buffer> {
    // Add logo to invoice data
    const invoiceWithLogo = {
      ...invoice,
      logo: this.logoBase64,
    };

    const template = Handlebars.compile(this.invoiceTemplate);
    const html = template(invoiceWithLogo);

    try {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        }
      });
      await browser.close();
      return pdf;
    } catch (err) {
      return Buffer.from(html);
    }
  }

  getInvoiceHtml(invoice: any): string {
    const invoiceWithLogo = {
      ...invoice,
      logo: this.logoBase64,
    };
    const template = Handlebars.compile(this.invoiceTemplate);
    return template(invoiceWithLogo);
  }
}
