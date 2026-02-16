const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const Handlebars = require('handlebars');
const numberToWords = require('number-to-words');
require('dotenv').config();

// Helpers
Handlebars.registerHelper('formatDate', (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

Handlebars.registerHelper('formatCurrency', (amount) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
});

Handlebars.registerHelper('amountInWords', (amount) => {
  if (!amount) return 'Zero Only';
  const words = numberToWords.toWords(amount);
  return words.replace(/\b\w/g, l => l.toUpperCase()) + ' Only';
});

Handlebars.registerHelper('increment', (index) => {
  return index + 1;
});

const invoiceTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman:wght@400;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4;
      margin: 15mm;
    }
    
    body { 
      font-family: 'Times New Roman', serif;
      font-size: 11pt; 
      color: #000; 
      background: #ffffff;
      line-height: 1.3;
    }
    
    .container {
      width: 100%;
      margin: 0 auto;
      position: relative; /* For watermark positioning */
    }

    .watermark-container {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      height: 400px;
      opacity: 0.1; /* Reduced opacity for better readability */
      z-index: -100;
      pointer-events: none;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }

    .watermark-img {
      height: 100%;
      width: auto;
      /* Assuming logo is on the left, crop the right side (text) */
      /* Scale up slightly if needed to fill the square */
      object-fit: cover; 
      object-position: left center;
      /* Increase width virtually to push text out if it's a wide banner */
      max-width: none; 
      width: 250%; /* Heuristic: Assume text takes up ~60% of width */
    }

    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .company-name {
      font-size: 16pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .invoice-label {
      font-size: 20pt;
      font-weight: bold;
      text-transform: uppercase;
    }

    .company-details {
      margin-bottom: 20px;
      font-size: 10pt;
    }

    .invoice-details {
      text-align: right;
      font-size: 10pt;
    }

    .recipient-section {
      margin-top: 20px;
      margin-bottom: 30px;
    }

    .to-label {
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 5px;
    }

    .recipient-details {
      font-size: 10pt;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }

    th, td {
      border: 1px solid #000;
      padding: 8px;
      vertical-align: top;
    }

    th {
      font-weight: bold;
      text-align: center;
      background-color: #fff;
      text-transform: uppercase;
      font-size: 9pt;
    }

    .col-no { width: 5%; text-align: center; }
    .col-desc { width: 45%; text-align: left; }
    .col-qty { width: 10%; text-align: center; }
    .col-rate { width: 20%; text-align: right; }
    .col-amount { width: 20%; text-align: right; }

    .totals-row td {
      border: 1px solid #000;
      text-align: right;
      font-weight: bold;
    }

    .amount-words {
      margin-top: 10px;
      margin-bottom: 20px;
      font-style: italic;
    }

    .bank-details {
      margin-top: 20px;
      border: 1px solid #000;
      padding: 10px;
      width: 60%;
    }

    .bank-header {
      font-weight: bold;
      font-size: 12pt;
      margin-bottom: 8px;
      text-decoration: underline;
    }

    .bank-row {
      display: flex;
      margin-bottom: 4px;
    }

    .bank-label {
      width: 120px;
      font-weight: bold;
    }

  </style>
</head>
<body>
  <div class="container">
    {{#if logo}}
    <div class="watermark-container">
      <img src="{{logo}}" class="watermark-img" alt="Watermark">
    </div>
    {{/if}}

    <div class="header">
      <div class="company-name">GROW TENDER</div>
      <div class="invoice-label">INVOICE</div>
    </div>

    <div style="display: flex; justify-content: space-between;">
      <div class="company-details">
        <div>GSTIN: {{companyGst}}</div>
        <div style="max-width: 300px;">{{companyAddress}}</div>
        <div>State Name : {{companyState}}, Code : {{companyStateCode}}</div>
        <div>Phone {{companyPhone}}</div>
      </div>

      <div class="invoice-details">
        <div>INVOICE NO : {{invoiceNumber}}</div>
        <div>DATE: {{formatDate createdAt}}</div>
      </div>
    </div>

    <div class="recipient-section">
      <div class="to-label">TO:</div>
      <div class="recipient-details">
        <div style="font-weight: bold;">{{customer.firstName}} {{customer.lastName}}</div>
        {{#if customer.company}}<div style="font-weight: bold;">{{customer.company}}</div>{{/if}}
        {{#if customer.gstin}}<div>GSTIN: {{customer.gstin}}</div>{{/if}}
        <div style="max-width: 350px;">
          {{#if customer.address}}{{customer.address}}{{/if}}
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="col-no">Number</th>
          <th class="col-desc">DESCRIPTION</th>
          <th class="col-qty">QTY</th>
          <th class="col-rate">RATE</th>
          <th class="col-amount">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        {{#each lineItems}}
        <tr style="height: 50px;">
          <td class="col-no">{{increment @index}}</td>
          <td class="col-desc">{{description}}</td>
          <td class="col-qty">{{quantity}}</td>
          <td class="col-rate">{{formatCurrency unitPrice}}</td>
          <td class="col-amount">{{formatCurrency total}}</td>
        </tr>
        {{/each}}
        
        <tr class="totals-row">
          <td colspan="4" style="text-align: right;">Sub total</td>
          <td style="text-align: right;">{{formatCurrency subtotal}}</td>
        </tr>
        {{#if taxRate}}
        <tr class="totals-row">
          <td colspan="4" style="text-align: right;">CGST@{{halfTaxRate}}%</td>
          <td style="text-align: right;">{{formatCurrency halfTaxAmount}}</td>
        </tr>
        <tr class="totals-row">
          <td colspan="4" style="text-align: right;">SGST@{{halfTaxRate}}%</td>
          <td style="text-align: right;">{{formatCurrency halfTaxAmount}}</td>
        </tr>
        {{/if}}
        <tr class="totals-row">
          <td colspan="4" style="text-align: right;">TOTAL</td>
          <td style="text-align: right;">{{formatCurrency total}}</td>
        </tr>
      </tbody>
    </table>

    <div class="amount-words">
      Amount In Words : {{amountInWords total}}
    </div>

    <div class="bank-details">
      <div class="bank-header">Bank Details</div>
      <div class="bank-row">
        <span class="bank-label">Account number:</span>
        <span>{{bankDetails.accountNumber}}</span>
      </div>
      <div class="bank-row">
        <span class="bank-label">IFSC:</span>
        <span>{{bankDetails.ifsc}}</span>
      </div>
      <div class="bank-row">
        <span class="bank-label">SWIFT code:</span>
        <span>{{bankDetails.swift}}</span>
      </div>
      <div class="bank-row">
        <span class="bank-label">Bank name:</span>
        <span>{{bankDetails.bankName}}</span>
      </div>
      <div class="bank-row">
        <span class="bank-label">Branch:</span>
        <span>{{bankDetails.branch}}</span>
      </div>
    </div>

  </div>
</body>
</html>
`;

(async () => {
  try {
    console.log('Generating Test Invoice PDF...');

    // Sample Data
    const invoice = {
      invoiceNumber: '01/26-27',
      createdAt: new Date('2026-01-01'),
      customer: {
        firstName: 'MK',
        lastName: 'INTERIORS',
        company: 'MK INTERIORS',
        gstin: '24SMEPS3027M1ZE',
        address: 'G C-45D S/F FLAT NO. C-3, PUL PEHLADPUR, New Delhi, South East Delhi, Delhi, 110044',
        phone: '1234567890',
        email: 'test@example.com'
      },
      lineItems: [
        {
          description: 'l1 comparison With OEM',
          quantity: 1,
          unitPrice: 3672.00,
          total: 3672.00
        }
      ],
      subtotal: 3672.00,
      taxRate: 18,
      taxAmount: 660.00,
      total: 4332.00,
    };

    // Static Company Data (Matches PdfService)
    const companyGst = '24SMEPS3027M1ZE';
    const companyAddress = 'FF-108, NIRMAL SAROVAR, OPP. RADHE GOWSHALA, S.P.RING ROAD, VATVA, Ahmedabad, Ahmedabad, Gujarat, 382440';
    const companyState = 'Gujarat';
    const companyStateCode = '24';
    const companyPhone = '8866502216';

    const bankDetails = {
      accountNumber: '88665022162',
      ifsc: 'IDFB0040303',
      swift: 'IDFBINBBMUM',
      bankName: 'IDFC FIRST',
      branch: 'Maninagar Branch',
    };

    // Load Logo
    let logoBase64 = '';
    try {
      const logoPath = path.join(__dirname, 'src/assets/logo.jpg');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
        console.log('Logo loaded successfully.');
      } else {
        console.log('Logo file not found at:', logoPath);
      }
    } catch (e) {
      console.log('Error loading logo:', e.message);
    }

    const halfTaxRate = invoice.taxRate / 2;
    const halfTaxAmount = invoice.taxAmount / 2;

    const data = {
      ...invoice,
      logo: logoBase64,
      companyGst,
      companyAddress,
      companyState,
      companyStateCode,
      companyPhone,
      bankDetails,
      halfTaxRate,
      halfTaxAmount,
    };

    const template = Handlebars.compile(invoiceTemplate);
    const html = template(data);

    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
      (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : undefined);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: 'test-invoice.pdf',
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
    console.log('PDF Generated: test-invoice.pdf');

  } catch (e) {
    console.error('Error generating PDF:', e);
  }
})();
