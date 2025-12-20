import puppeteer from 'puppeteer';
import express from 'express';

const app = express();
app.use(express.json({ limit: '50mb' }));

let browser = null;

const initBrowser = async () => {
    try {
        if (browser) {
            await browser.close().catch(() => {});
        }
        browser = await puppeteer.launch({
            headless: 'shell',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });
        console.log('Puppeteer Browser Started');
    } catch (e) {
        console.error('Browser Init Error:', e);
    }
};

app.post('/api/run', async (req, res) => {
    const { script, auth } = req.body;
    if (auth !== 'alxzy') return res.status(401).send('Unauthorized');
    
    let page;
    try {
        if (!browser || !browser.connected) await initBrowser();
        page = await browser.newPage();
        await page.setDefaultNavigationTimeout(0);
        
        const dynamicTask = new Function('browser', 'page', `return (async () => { ${script} })();`);
        const result = await dynamicTask(browser, page);
        
        res.json({ success: true, data: result });
    } catch (e) {
        res.json({ success: false, error: e.message });
    } finally {
        if (page) await page.close().catch(() => {});
    }
});

app.post('/api/run/stream', async (req, res) => {
    const { script, auth } = req.body;
    if (auth !== 'alxzy') return res.status(401).send('Unauthorized');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (status, data) => res.write(`data: ${JSON.stringify({ status, ...data })}\n\n`);
    
    let page;
    try {
        if (!browser || !browser.connected) await initBrowser();
        page = await browser.newPage();
        await page.setDefaultNavigationTimeout(0);

        await page.exposeFunction('sendProgress', (data) => sendEvent('progress', { data }));

        const dynamicTask = new Function('browser', 'page', `return (async () => { ${script} })();`);
        const result = await dynamicTask(browser, page);
        
        sendEvent('done', { data: result });
        res.end();
    } catch (e) {
        sendEvent('error', { message: e.message });
        res.end();
    } finally {
        if (page) await page.close().catch(() => {});
    }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);
    await initBrowser();
});
