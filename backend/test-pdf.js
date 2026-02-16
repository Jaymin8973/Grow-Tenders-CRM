const puppeteer = require('puppeteer');
require('dotenv').config();

(async () => {
    try {
        console.log('Launching browser...');
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
            (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : undefined);

        const browser = await puppeteer.launch({
            headless: true,
            executablePath,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        console.log('Browser launched. New page...');
        const page = await browser.newPage();
        console.log('Setting content...');
        await page.setContent('<h1>Hello World</h1>');
        console.log('Generating PDF...');
        await page.pdf({ format: 'A4' });
        console.log('PDF generated successfully.');
        await browser.close();
    } catch (error) {
        console.error('Error:', error);
    }
})();
