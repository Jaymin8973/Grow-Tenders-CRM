const fs = require('fs');
const https = require('https');

// Replicate the extraction logic from gem-scraper.service.ts
async function extractCityStateFromDocument(documentUrl) {
    let city = null;
    let state = null;

    const pdfBuffer = await downloadPdfBuffer(documentUrl);
    if (pdfBuffer.length < 5 || pdfBuffer.slice(0, 4).toString() !== '%PDF') {
        console.log('Not a valid PDF');
        return { city, state };
    }

    console.log('PDF size:', pdfBuffer.length, 'bytes');

    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = new Uint8Array(pdfBuffer);
    const doc = await pdfjsLib.getDocument({ data }).promise;

    const pagesToScan = Math.min(doc.numPages, 15);
    console.log('Scanning', pagesToScan, 'of', doc.numPages, 'pages...');

    for (let i = 1; i <= pagesToScan; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();

        let prevY = null;
        let text = '';
        for (const item of content.items) {
            if (prevY !== null && Math.abs(item.transform[5] - prevY) > 5) {
                text += '\n';
            }
            text += item.str;
            prevY = item.transform[5];
        }

        if (!/consignee|address.*quantity|delivery/i.test(text)) continue;

        console.log(`Page ${i}: Found consignee/address section`);

        const cityMatch = text.match(/\*{3,}\s*([A-Z][A-Z\s]{2,40}?)\s+\d/m);
        if (cityMatch?.[1]) {
            city = cityMatch[1].trim().replace(/\s+(CITY|DISTRICT|TOWN|NAGAR|BLOCK)$/i, '');
            if (city.length < 2) city = null;
        }

        if (city) {
            console.log(`  -> Extracted city: "${city}"`);
            break;
        }
    }

    doc.destroy();

    // City-to-state mapping
    const cityStateMap = {
        'KANPUR': 'Uttar Pradesh', 'LUCKNOW': 'Uttar Pradesh', 'MUMBAI': 'Maharashtra',
        'PUNE': 'Maharashtra', 'AHMEDABAD': 'Gujarat', 'JAIPUR': 'Rajasthan',
        'CHENNAI': 'Tamil Nadu', 'KOLKATA': 'West Bengal', 'HYDERABAD': 'Telangana',
        'BENGALURU': 'Karnataka', 'DELHI': 'Delhi', 'NEW DELHI': 'Delhi',
    };
    if (city && !state) {
        state = cityStateMap[city.toUpperCase()] || null;
    }

    return { city, state };
}

function downloadPdfBuffer(url) {
    return new Promise((resolve, reject) => {
        const makeRequest = (targetUrl, redirectCount = 0) => {
            if (redirectCount > 5) return reject(new Error('Too many redirects'));
            https.get(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/pdf,*/*',
                    'Referer': 'https://bidplus.gem.gov.in/',
                },
                timeout: 30000,
            }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    makeRequest(res.headers.location, redirectCount + 1);
                    return;
                }
                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks)));
                res.on('error', reject);
            }).on('error', reject);
        };
        makeRequest(url);
    });
}

async function main() {
    console.log('=== Testing PDF extraction on GeM document ===\n');

    const result = await extractCityStateFromDocument('https://bidplus.gem.gov.in/showbidDocument/8619307');

    console.log('\n=== RESULT ===');
    console.log('City:', result.city);
    console.log('State:', result.state);
    console.log('\nTest', result.city ? 'PASSED ✓' : 'FAILED ✗');
}

main().catch(e => console.error('Error:', e.message));
