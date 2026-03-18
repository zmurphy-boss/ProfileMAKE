// Article Handler — scrapes article URL and extracts main content using Puppeteer.
const puppeteer = require('puppeteer');

/**
 * Scrapes main content text from an article URL.
 * @param {string} url - Article URL
 * @returns {Promise<{ chunks: Array<{ text: string, location: string }> }>}
 */
async function extract(url) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (compatible; CommonGroundBot/1.0)');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const text = await page.evaluate(() => {
      document.querySelectorAll('script, style, noscript, nav, header, footer, aside').forEach((el) => el.remove());
      // Prefer article or main element if present
      const main = document.querySelector('article') || document.querySelector('main') || document.body;
      return main ? main.innerText.trim() : '';
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
