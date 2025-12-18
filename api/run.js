import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { script, auth } = req.body;

  if (auth !== 'alxzy') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!script) {
    return res.status(400).json({ error: 'No script provided' });
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const dynamicTask = new Function('browser', 'page', `
      return (async () => {
        ${script}
      })();
    `);

    const result = await dynamicTask(browser, page);

    await browser.close();
    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    if (browser) await browser.close();
    return res.status(500).json({ success: false, error: error.message });
  }
}
