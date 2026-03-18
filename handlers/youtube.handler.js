// YouTube Handler — scrapes channel About section and video descriptions using Puppeteer.
const puppeteer = require('puppeteer');

/**
 * Scrapes text from a public YouTube channel page.
 * @param {string} url - YouTube channel URL
 * @returns {Promise<{ chunks: Array<{ text: string, location: string }> }>}
 */
async function extract(url) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (compatible; CommonGroundBot/1.0)');

    // Navigate to the About tab if a channel URL is given
    const aboutUrl = url.replace(/\/?$/, '/about');
    await page.goto(aboutUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3000));

    const text = await page.evaluate(() => {
      document.querySelectorAll('script, style, noscript').forEach((el) => el.remove());
      return document.body ? document.body.innerText.trim() : '';
    });

    const chunks = [];
    if (text.length > 0) {
      chunks.push({ text, location: `${url} (About)` });
    }

    return { chunks };
  } finally {
    await browser.close();
  }
}

module.exports = { extract };
