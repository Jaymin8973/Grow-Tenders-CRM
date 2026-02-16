
const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log('Launching browser...');
        // Try launching without args first, standard windows launch
        const browser = await puppeteer.launch();
        console.log('Browser launched successfully');
        const page = await browser.newPage();
        await page.setContent('<h1>Test PDF</h1>');
        await page.pdf({ path: 'test.pdf', format: 'A4' });
        await browser.close();
        console.log('PDF generated successfully!');
    } catch (e) {
        console.error('Error launching puppeteer:', e);
    }
})();
