async function getPage() {
  if (!browser) {
    browser = await puppeteer.launch({
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
