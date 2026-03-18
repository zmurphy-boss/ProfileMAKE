// PDF Handler — extracts text from PDF files using pdf2json.
// Returns chunks with page-aware location references.
const PDFParser = require('pdf2json');
const path = require('path');

/**
 * Extracts text chunks from a PDF file.
 * @param {string} filePath - Absolute path to the PDF file
 * @returns {Promise<{ chunks: Array<{ text: string, location: string }> }>}
 */
async function extract(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    const filename = path.basename(filePath);
    const chunks = [];

    pdfParser.on('pdfParser_dataError', (err) => {
      reject(new Error(`PDF parse error for ${filename}: ${err.parserError}`));
    });

    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      const pages = pdfData.Pages || [];
      pages.forEach((page, pageIndex) => {
        const pageNum = pageIndex + 1;
        const textItems = page.Texts || [];
        const pageText = textItems
          .map((t) => decodeURIComponent(t.R.map((r) => r.T).join(' ')))
          .join(' ')
          .trim();

        if (pageText.length > 0) {
          chunks.push({
            text: pageText,
            location: `${filename}, page ${pageNum}`,
          });
        }
      });

      resolve({ chunks });
    });

    pdfParser.loadPDF(filePath);
  });
}

module.exports = { extract };
