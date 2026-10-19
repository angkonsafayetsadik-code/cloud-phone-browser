const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let browser = null;
let page = null;

async function getPage() {
  if (!browser) {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
  }

  if (!page) {
    page = await browser.newPage();
    await page.setViewport({
      width: 320,
      height: 480,
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
    );
  }

  return page;
}

async function captureScreenshot(p) {
  const screenshotBuffer = await p.screenshot({
    type: 'jpeg',
    quality: 60,
    fullPage: false
  });
  return screenshotBuffer.toString('base64');
}

app.post('/api/navigate', async (req, res) => {
  let { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  try {
    const p = await getPage();
    await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const screenshot = await captureScreenshot(p);
    const title = await p.title();
    const currentUrl = p.url();

    res.json({ success: true, screenshot, title, url: currentUrl });
  } catch (error) {
    console.error('Navigation error:', error.message);
    res.status(500).json({ error: 'Failed to load page: ' + error.message });
  }
});

app.post('/api/click', async (req, res) => {
  const { x, y } = req.body;

  if (typeof x !== 'number' || typeof y !== 'number') {
    return res.status(400).json({ error: 'Valid X and Y coordinates are required' });
  }

  try {
    const p = await getPage();
    await p.mouse.click(x, y);
    await new Promise(resolve => setTimeout(resolve, 800));

    const screenshot = await captureScreenshot(p);
    const title = await p.title();
    const currentUrl = p.url();

    res.json({ success: true, screenshot, title, url: currentUrl });
  } catch (error) {
    console.error('Click error:', error.message);
    res.status(500).json({ error: 'Click action failed: ' + error.message });
  }
});

app.post('/api/scroll', async (req, res) => {
  const { direction } = req.body;

  try {
    const p = await getPage();
    const scrollAmount = direction === 'down' ? 200 : -200;

    await p.evaluate((amount) => {
      window.scrollBy(0, amount);
    }, scrollAmount);

    const screenshot = await captureScreenshot(p);
    res.json({ success: true, screenshot });
  } catch (error) {
    console.error('Scroll error:', error.message);
    res.status(500).json({ error: 'Scroll failed: ' + error.message });
  }
});

process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Cloud Feature-Phone Browser Proxy running on http://localhost:${PORT}`);
});
