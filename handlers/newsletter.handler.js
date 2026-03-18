// Newsletter Handler — routes to pdf.handler or word.handler based on file extension.
const path = require('path');
const pdfHandler = require('./pdf.handler');
const wordHandler = require('./word.handler');

/**
 * Extracts text from a newsletter file (PDF or Word).
 * @param {string} filePath - Absolute path to the newsletter file
 * @returns {Promise<{ chunks: Array<{ text: string, location: string }> }>}
 */
async function extract(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    return pdfHandler.extract(filePath);
  }

  if (ext === '.docx' || ext === '.doc') {
    return wordHandler.extract(filePath);
  }

  throw new Error(`Unsupported newsletter file type: ${ext}. Expected .pdf or .docx`);
}

module.exports = { extract };
