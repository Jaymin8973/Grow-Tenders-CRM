import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';

@Injectable()
export class PdfService {
    private invoiceTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #333; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company-info { }
    .company-name { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 8px; }
    .company-details { color: #666; line-height: 1.6; }
    .invoice-info { text-align: right; }
    .invoice-title { font-size: 32px; font-weight: bold; color: #2563eb; margin-bottom: 8px; }
    .invoice-number { font-size: 14px; color: #666; }
    .invoice-meta { margin-top: 12px; }
    .invoice-meta-row { display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 4px; }
    .invoice-meta-label { color: #666; }
    .invoice-meta-value { font-weight: 500; }
    .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .address-block { }
    .address-title { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 8px; }
    .address-content { line-height: 1.6; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th { background: #f8fafc; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
    .items-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .items-table .qty { text-align: center; width: 80px; }
    .items-table .price { text-align: right; width: 120px; }
    .items-table .total { text-align: right; width: 120px; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
    .totals-table { width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .totals-row.grand-total { border-top: 2px solid #333; border-bottom: none; font-size: 16px; font-weight: bold; padding-top: 12px; }
    .notes { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .notes-title { font-weight: 600; margin-bottom: 8px; }
    .notes-content { color: #666; line-height: 1.6; }
    .footer { position: fixed; bottom: 40px; left: 40px; right: 40px; text-align: center; color: #999; font-size: 10px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .status-draft { background: #fef3c7; color: #92400e; }
    .status-sent { background: #dbeafe; color: #1e40af; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <div class="company-name">{{companyName}}</div>
      <div class="company-details">
        {{#if companyAddress}}{{companyAddress}}<br>{{/if}}
        {{#if companyPhone}}Phone: {{companyPhone}}<br>{{/if}}
        {{#if companyEmail}}Email: {{companyEmail}}{{/if}}
      </div>
    </div>
    <div class="invoice-info">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">{{invoiceNumber}}</div>
      <div class="invoice-meta">
        <div class="invoice-meta-row">
          <span class="invoice-meta-label">Date:</span>
          <span class="invoice-meta-value">{{formatDate createdAt}}</span>
        </div>
        {{#if dueDate}}
        <div class="invoice-meta-row">
          <span class="invoice-meta-label">Due Date:</span>
          <span class="invoice-meta-value">{{formatDate dueDate}}</span>
        </div>
        {{/if}}
        <div class="invoice-meta-row">
          <span class="status-badge status-{{lowercase status}}">{{status}}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="addresses">
    <div class="address-block">
      <div class="address-title">Bill To</div>
      <div class="address-content">
        <strong>{{customer.firstName}} {{customer.lastName}}</strong><br>
        {{#if customer.company}}{{customer.company}}<br>{{/if}}
        {{#if customer.email}}{{customer.email}}<br>{{/if}}
        {{#if customer.phone}}{{customer.phone}}{{/if}}
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
        <td>{{description}}</td>
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
        <span>Subtotal</span>
        <span>{{formatCurrency subtotal}}</span>
      </div>
      {{#if taxRate}}
      <div class="totals-row">
        <span>Tax ({{taxRate}}%)</span>
        <span>{{formatCurrency taxAmount}}</span>
      </div>
      {{/if}}
      {{#if discount}}
      <div class="totals-row">
        <span>Discount</span>
        <span>-{{formatCurrency discount}}</span>
      </div>
      {{/if}}
      <div class="totals-row grand-total">
        <span>Total</span>
        <span>{{formatCurrency total}}</span>
      </div>
    </div>
  </div>

  {{#if paymentTerms}}
  <div class="notes">
    <div class="notes-title">Payment Terms</div>
    <div class="notes-content">{{paymentTerms}}</div>
  </div>
  {{/if}}

  {{#if notes}}
  <div class="notes">
    <div class="notes-title">Notes</div>
    <div class="notes-content">{{notes}}</div>
  </div>
  {{/if}}

  {{#if termsConditions}}
  <div class="notes">
    <div class="notes-title">Terms & Conditions</div>
    <div class="notes-content">{{termsConditions}}</div>
  </div>
  {{/if}}

  <div class="footer">
    Thank you for your business!
  </div>
</body>
</html>
  `;

    constructor() {
        // Register Handlebars helpers
        Handlebars.registerHelper('formatDate', (date: Date) => {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        });

        Handlebars.registerHelper('formatCurrency', (amount: number) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(amount);
        });

        Handlebars.registerHelper('lowercase', (str: string) => {
            return str.toLowerCase();
        });
    }

    async generateInvoicePdf(invoice: any): Promise<Buffer> {
        const template = Handlebars.compile(this.invoiceTemplate);
        const html = template(invoice);

        // For production, use Puppeteer - for now return HTML as buffer
        // This is a simplified version - in production you'd use:
        // const browser = await puppeteer.launch();
        // const page = await browser.newPage();
        // await page.setContent(html);
        // const pdf = await page.pdf({ format: 'A4' });
        // await browser.close();
        // return pdf;

        return Buffer.from(html);
    }

    getInvoiceHtml(invoice: any): string {
        const template = Handlebars.compile(this.invoiceTemplate);
        return template(invoice);
    }
}
