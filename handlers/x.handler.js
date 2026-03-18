// X (Twitter) Handler — scrapes public X profile page using Puppeteer.
const puppeteer = require('puppeteer');

/**
 * Scrapes visible text from a public X profile page.
 * @param {string} url - X profile URL
 * @returns {Promise<{ chunks: Array<{ text: string, location: string }> }>}
 */
async function extract(url) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (compatible; CommonGroundBot/1.0)');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait briefly for dynamic content
    await new Promise((r) => setTimeout(r, 3000));

    const text = await page.evaluate(() => {
      document.querySelectorAll('script, style, noscript').forEach((el) => el.remove());
      return document.body ? document.body.innerText.trim() : '';
    });

    const chunks = [];
    if (text.length > 0) {
      chunks.push({ text, location: url });
    }

    return { chunks };
  } finally {
    await browser.close();
  }
}

module.exports = { extract };
