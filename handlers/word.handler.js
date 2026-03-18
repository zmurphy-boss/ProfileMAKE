// Word Handler — extracts text from .docx files using mammoth.
const mammoth = require('mammoth');
const path = require('path');

/**
 * Extracts text from a Word document.
 * @param {string} filePath - Absolute path to the .docx file
 * @returns {Promise<{ chunks: Array<{ text: string, location: string }> }>}
 */
async function extract(filePath) {
  const filename = path.basename(filePath);
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value.trim();

  const chunks = [];
  if (text.length > 0) {
    chunks.push({ text, location: filename });
  }

  return { chunks };
}

module.exports = { extract };
