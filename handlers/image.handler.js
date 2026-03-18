// Image Handler — pre-processes images using sharp.
// OCR is a placeholder in Stage 1.5 — returns a stub chunk with the image filename.
// TODO: Integrate tesseract.js or Vision API for OCR in a later stage.
const sharp = require('sharp');
const path = require('path');

/**
 * Pre-processes an image and returns a placeholder chunk.
 * @param {string} filePath - Absolute path to the image file
 * @returns {Promise<{ chunks: Array<{ text: string, location: string }> }>}
 */
async function extract(filePath) {
  const filename = path.basename(filePath);

  // Validate the image is readable by sharp
  const metadata = await sharp(filePath).metadata();
  const desc = `Image file: ${filename} (${metadata.width}x${metadata.height} ${metadata.format})`;

  // OCR placeholder — in Stage 1.5 no text is extracted from images
  const chunks = [
    {
      text: `[IMAGE_PLACEHOLDER: ${desc}. OCR not implemented in Stage 1.5 — manual review required.]`,
      location: filename,
    },
  ];

  return { chunks };
}

module.exports = { extract };
