import puppeteer from 'puppeteer';
import express from 'express';

const app = express();
app.use(express.json());

let browser = null;

const initBrowser = async () => {
    browser = await puppeteer.launch({
        headless: "new",
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
    console.log('Browser Ready');
};

app.post('/api/run', async (req, res) => {
    const { script, auth } = req.body;

    if (auth !== 'alxzy') return res.status(401).json({ error: 'Unauthorized' });
    if (!script) return res.status(400).json({ error: 'No script provided' });

    const page = await browser.newPage();
    try {
        await page.setDefaultNavigationTimeout(0);
        await page.setDefaultTimeout(0)
        const dynamicTask = new Function('browser', 'page', `
            return (async () => {
                ${script}
            })();
        `);

        const result = await dynamicTask(browser, page);
        
        await page.close();
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        if (page) await page.close();
        return res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', async () => {
    await initBrowser();
    console.log(`Server jalan di port ${PORT}`);
});
