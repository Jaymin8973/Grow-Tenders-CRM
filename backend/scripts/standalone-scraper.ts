import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

import { INDIAN_CITY_STATE_MAP } from '../src/modules/tenders/data/indian-locations';

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

function normalizeCityKey(input: string): string {
    return String(input || '')
        .toUpperCase()
        .replace(/\s+CITY$/i, '')
        .replace(/\s+CANTT$/i, ' CANTT')
        .replace(/[^A-Z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function isKnownCity(city: string): boolean {
    const key = normalizeCityKey(city);
    if (!key) return false;
    return Boolean((INDIAN_CITY_STATE_MAP as any)[key]);
}

// Indian states list
const STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Chandigarh', 'Puducherry', 'Jammu and Kashmir', 'Ladakh',
];

// State synonyms
const STATE_SYNONYMS: Array<[RegExp, string]> = [
    [/\bnct\b|\bdelhi\b|\bnew delhi\b/, 'Delhi'],
    [/\bj\s*&\s*k\b|\bjammu\b.*\bkashmir\b|\bjammu and kashmir\b/, 'Jammu and Kashmir'],
    [/\bup\b|\butar pradesh\b/, 'Uttar Pradesh'],
    [/\buk\b|\buttrakhand\b/, 'Uttarakhand'],
    [/\bmp\b|\bmadhya pradesh\b/, 'Madhya Pradesh'],
    [/\bap\b|\bandhra pradesh\b/, 'Andhra Pradesh'],
    [/\bts\b|\btelangana\b/, 'Telangana'],
    [/\btn\b|\btamil nadu\b/, 'Tamil Nadu'],
    [/\bwb\b|\bwest bengal\b/, 'West Bengal'],
    [/\bhp\b|\bhimachal pradesh\b/, 'Himachal Pradesh'],
    [/\bpb\b|\bpunjab\b/, 'Punjab'],
    [/\bhr\b|\bharyana\b/, 'Haryana'],
    [/\bbr\b|\bbihar\b/, 'Bihar'],
    [/\bga\b|\bgoa\b/, 'Goa'],
    [/\bgj\b|\bgujarat\b/, 'Gujarat'],
    [/\bmh\b|\bmaharashtra\b/, 'Maharashtra'],
    [/\brj\b|\brajasthan\b/, 'Rajasthan'],
    [/\bor\b|\bodisha\b|\borissa\b/, 'Odisha'],
    [/\bch\b|\bchandigarh\b/, 'Chandigarh'],
    [/\bpy\b|\bpuducherry\b|\bpondicherry\b/, 'Puducherry'],
    [/\bla\b|\bladakh\b/, 'Ladakh'],
];

function extractState(department: string): string | null {
    if (!department) return null;
    const text = department.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Check for central ministries - set to "Pan India"
    const centralMinistries = [
        'ministry of defence',
        'ministry of home affairs',
        'ministry of finance',
        'ministry of external affairs',
        'ministry of coal',
        'ministry of petroleum',
        'ministry of steel',
        'ministry of power',
        'ministry of railways',
        'ministry of shipping',
        'ministry of aviation',
        'department of military affairs',
        'central police organisation',
        'nlc india limited',
    ];
    
    for (const ministry of centralMinistries) {
        if (text.includes(ministry)) {
            return 'Pan India';
        }
    }
    
    for (const state of STATES) {
        if (text.includes(state.toLowerCase())) return state;
    }
    
    for (const [re, value] of STATE_SYNONYMS) {
        if (re.test(text)) return value;
    }
    
    return null;
}

function extractCityFromCreatedBy(createdBy: string): string | null {
    if (!createdBy) return null;
    
    // Pattern: prefix-CityName (e.g., "RFO-Jamnagar")
    const match = createdBy.match(/[-–]\s*([A-Za-z]+)\s*$/);
    if (match?.[1]) {
        const city = match[1].trim();
        const nonCityWords = /^(office|division|unit|branch|dept|department|ministry)$/i;
        if (!nonCityWords.test(city) && city.length >= 3) {
            if (isKnownCity(city)) return city;
        }
    }
    
    return null;
}

async function scrapeTenders(maxPages: number = 0) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setViewport({ width: 1280, height: 800 });
    
    const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);
    
    try {
        // Visit GeM home
        log('Visiting GeM home page...');
        await page.goto('https://gem.gov.in/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));
        
        // Go to bids page
        log('Visiting bid list page...');
        await page.goto('https://bidplus.gem.gov.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector('.card', { timeout: 30000 }).catch(() => {});
        
        // Get CSRF token
        const csrfToken = await page.evaluate(() => {
            let token = null;
            const scripts = document.querySelectorAll('script');
            for (const s of scripts) {
                const match = s.innerHTML.match(/['"]?csrf_bd_gem_nk['"]?\s*:\s*['"]([a-f0-9]{32})['"]/);
                if (match) {
                    token = match[1];
                    break;
                }
            }
            return token;
        });
        
        if (!csrfToken) throw new Error('Could not extract CSRF token');
        log(`CSRF Token: ${csrfToken}`);
        
        let pageNum = 0;
        let added = 0;
        const newTenders: any[] = [];
        
        while (true) {
            pageNum++;
            if (maxPages > 0 && pageNum > maxPages) {
                log(`Reached max pages limit: ${maxPages}`);
                break;
            }
            
            log(`Scraping page ${pageNum}...`);
            
            const docs = await page.evaluate(async (pNum: number, token: string) => {
                const payloadObj: any = {
                    param: { searchBid: '', searchType: 'fullText' },
                    filter: {
                        bidStatusType: 'ongoing_bids',
                        byType: 'all',
                        highBidValue: '',
                        byEndDate: { from: '', to: '' },
                        sort: 'Bid-Start-Date-Latest'
                    }
                };
                if (pNum > 1) payloadObj.page = pNum;
                
                const payloadStr = encodeURIComponent(JSON.stringify(payloadObj));
                const formData = 'payload=' + payloadStr + '&csrf_bd_gem_nk=' + token;
                
                const r = await fetch('https://bidplus.gem.gov.in/all-bids-data', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'x-requested-with': 'XMLHttpRequest'
                    },
                    body: formData
                });
                const json = await r.json();
                return json?.response?.response?.docs || [];
            }, pageNum, csrfToken);
            
            if (!docs || docs.length === 0) {
                log('No more tenders found.');
                break;
            }
            
            log(`Found ${docs.length} tenders on page ${pageNum}`);
            
            // Get existing tender IDs
            const referenceIds = docs.map((d: any) => d.b_bid_number?.[0]).filter(Boolean);
            const existing = await prisma.tender.findMany({
                where: { referenceId: { in: referenceIds } },
                select: { referenceId: true },
            });
            const existingSet = new Set(existing.map(e => e.referenceId));
            
            for (const doc of docs) {
                const bidNo = doc.b_bid_number?.[0];
                if (!bidNo || existingSet.has(bidNo)) continue;
                
                const title = doc.bbt_title?.[0] || doc.b_category_name?.[0] || '';
                const category = doc.b_category_name?.[0] || '';
                let department = '';
                if (doc.ba_official_details_minName) department += doc.ba_official_details_minName[0] + ' ';
                if (doc.ba_official_details_deptName) department += doc.ba_official_details_deptName[0];
                department = department.trim();
                
                const createdBy = doc['b.b_created_by']?.[0] || '';
                const startDate = doc.final_start_date_sort?.[0];
                const endDate = doc.final_end_date_sort?.[0];
                const tenderId = doc.b_id?.[0];
                
                // Extract state and city
                const state = extractState(department);
                let city = extractCityFromCreatedBy(createdBy);
                if (city && !isKnownCity(city)) {
                    city = null;
                }
                
                log(`Tender ${bidNo}: department="${department}", createdBy="${createdBy}" => state=${state || 'null'}, city=${city || 'null'}`);
                
                try {
                    const newTender = await prisma.tender.create({
                        data: {
                            title,
                            description: department,
                            status: 'PUBLISHED',
                            source: 'GEM',
                            referenceId: bidNo,
                            tenderUrl: `https://bidplus.gem.gov.in/showbidDocument/${tenderId}`,
                            categoryName: category,
                            state,
                            city,
                            publishDate: startDate ? new Date(startDate) : null,
                            closingDate: endDate ? new Date(endDate) : null,
                        }
                    });
                    
                    newTenders.push(newTender);
                    added++;
                    existingSet.add(bidNo);
                } catch (err: any) {
                    log(`Failed to save tender ${bidNo}: ${err.message}`);
                }
            }
        }
        
        log(`Scraping completed. Total pages: ${pageNum}, Added: ${added}`);
        return { added, pagesScraped: pageNum, newTenders };
        
    } finally {
        await browser.close();
        await prisma.$disconnect();
    }
}

// Parse args
const args = process.argv.slice(2);
let pages = 0;
for (const arg of args) {
    if (arg.startsWith('--pages=')) {
        pages = parseInt(arg.split('=')[1], 10);
    }
}

scrapeTenders(pages).catch(err => {
    console.error('Scraping failed:', err);
    process.exit(1);
});
