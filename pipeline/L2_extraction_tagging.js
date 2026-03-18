// L2 — Extraction & Tagging
// Dispatches each present input type to its dedicated handler.
// Wraps every chunk with source tag, confidence score, and humanReviewFlag.
// Mechanically tags chunks containing explicit KPIs with [KPI_EXPLICIT: true].
// ENFORCES: every chunk must carry source, confidence, humanReviewFlag before passing to L3.

const pdfHandler = require('../handlers/pdf.handler');
const urlHandler = require('../handlers/url.handler');
const wordHandler = require('../handlers/word.handler');
const excelHandler = require('../handlers/excel.handler');
const imageHandler = require('../handlers/image.handler');
const newsletterHandler = require('../handlers/newsletter.handler');
const linkedinHandler = require('../handlers/linkedin.handler');
const xHandler = require('../handlers/x.handler');
const facebookHandler = require('../handlers/facebook.handler');
const youtubeHandler = require('../handlers/youtube.handler');
const articleHandler = require('../handlers/article.handler');

// Keywords indicating explicit KPI presence
const KPI_KEYWORDS = ['kpi', 'key performance indicator', 'target:', 'metric:', 'indicator:'];

/**
 * Runs extraction for all present inputs and returns tagged chunks.
 *
 * @param {{ present: string[], files: Object, urls: Object }} manifest - From L1
 * @returns {Promise<{
 *   taggedChunks: Array<{
 *     text: string,
 *     source: string,
 *     confidence: string,
 *     humanReviewFlag: boolean,
 *     kpiExplicit: boolean,
 *     inputType: string
 *   }>,
 *   errors: Array<{ inputType: string, error: string }>
 * }>}
 */
async function run(manifest) {
  const { present, files, urls } = manifest;
  const taggedChunks = [];
  const errors = [];
  let sourceCounter = 1;

  for (const inputType of present) {
    try {
      let result;

      if (inputType === 'pdf') {
        const fileList = files[inputType] || [];
        for (const file of fileList) {
          result = await pdfHandler.extract(file.path);
          taggedChunks.push(...tagChunks(result.chunks, inputType, file.originalname, sourceCounter++));
        }
        continue;
      }

      if (inputType === 'word') {
        const fileList = files[inputType] || [];
        for (const file of fileList) {
          result = await wordHandler.extract(file.path);
          taggedChunks.push(...tagChunks(result.chunks, inputType, file.originalname, sourceCounter++));
        }
        continue;
      }

      if (inputType === 'excel') {
        const fileList = files[inputType] || [];
        for (const file of fileList) {
          result = await excelHandler.extract(file.path);
          taggedChunks.push(...tagChunks(result.chunks, inputType, file.originalname, sourceCounter++));
        }
        continue;
      }

      if (inputType === 'image') {
        const fileList = files[inputType] || [];
        for (const file of fileList) {
          result = await imageHandler.extract(file.path);
          taggedChunks.push(...tagChunks(result.chunks, inputType, file.originalname, sourceCounter++, 'Low', true));
        }
        continue;
      }

      if (inputType === 'newsletter') {
        const fileList = files[inputType] || [];
        for (const file of fileList) {
          result = await newsletterHandler.extract(file.path);
          taggedChunks.push(...tagChunks(result.chunks, inputType, file.originalname, sourceCounter++));
        }
        continue;
      }

      if (inputType === 'url_website') {
        result = await urlHandler.extract(urls[inputType]);
        taggedChunks.push(...tagChunks(result.chunks, inputType, urls[inputType], sourceCounter++));
        continue;
      }

      if (inputType === 'url_linkedin') {
        result = await linkedinHandler.extract(urls[inputType]);
        taggedChunks.push(...tagChunks(result.chunks, inputType, urls[inputType], sourceCounter++));
        continue;
      }

      if (inputType === 'url_x') {
        result = await xHandler.extract(urls[inputType]);
        taggedChunks.push(...tagChunks(result.chunks, inputType, urls[inputType], sourceCounter++));
        continue;
      }

      if (inputType === 'url_facebook') {
        result = await facebookHandler.extract(urls[inputType]);
        taggedChunks.push(...tagChunks(result.chunks, inputType, urls[inputType], sourceCounter++));
        continue;
      }

      if (inputType === 'url_youtube') {
        result = await youtubeHandler.extract(urls[inputType]);
        taggedChunks.push(...tagChunks(result.chunks, inputType, urls[inputType], sourceCounter++));
        continue;
      }

      if (inputType === 'url_article') {
        result = await articleHandler.extract(urls[inputType]);
        taggedChunks.push(...tagChunks(result.chunks, inputType, urls[inputType], sourceCounter++));
        continue;
      }

    } catch (err) {
      errors.push({ inputType, error: err.message });
    }
  }

  // Schema enforcement: every chunk must have source, confidence, humanReviewFlag
  for (const chunk of taggedChunks) {
    if (!chunk.source || !chunk.confidence || chunk.humanReviewFlag === undefined) {
      throw new Error(`L2 schema violation: chunk missing required fields. Chunk: ${JSON.stringify(chunk)}`);
    }
  }

  return { taggedChunks, errors };
}

/**
 * Wraps raw handler chunks with source tag, confidence, and review flag.
 * @param {Array<{text: string, location: string}>} chunks
 * @param {string} inputType
 * @param {string} sourceName
 * @param {number} sourceNum
 * @param {string} [defaultConfidence='Medium']
 * @param {boolean} [forceHumanReview=false]
 * @returns {Array}
 */
function tagChunks(chunks, inputType, sourceName, sourceNum, defaultConfidence = 'Medium', forceHumanReview = false) {
  return chunks.map((chunk) => {
    const kpiExplicit = hasExplicitKPI(chunk.text);
    const humanReviewFlag = forceHumanReview || chunk.text.includes('[IMAGE_PLACEHOLDER');
    const sourceTag = `[SOURCE_${sourceNum}: ${sourceName}, ${chunk.location}]`;

    return {
      text: chunk.text,
      source: sourceTag,
      confidence: defaultConfidence,
      humanReviewFlag,
      kpiExplicit,
      inputType,
    };
  });
}

/**
 * Checks if chunk text contains explicit KPI keywords.
 * @param {string} text
 * @returns {boolean}
 */
function hasExplicitKPI(text) {
  const lower = text.toLowerCase();
  return KPI_KEYWORDS.some((kw) => lower.includes(kw));
}

module.exports = { run };
