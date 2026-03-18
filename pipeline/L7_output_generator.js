// L7 — Output Generator
// Delegates to three output generators.
// GUARD: will not run unless the payload has validated: true from L6.
const documentGenerator = require('../output/document_generator');
const spreadsheetGenerator = require('../output/spreadsheet_generator');
const summaryGenerator = require('../output/summary_generator');
const path = require('path');
const fs = require('fs');

/**
 * Generates all three output files from the validated L6 payload.
 *
 * @param {{
 *   validated: boolean,
 *   sections: Object,
 *   indicators: Object,
 *   kpis: Object,
 *   report: Object
 * }} validatedPayload - Must have validated: true
 * @param {string} sessionId
 * @param {Object} sessionMeta - { profileType, kpiPath, manifest }
 * @returns {Promise<{ documentPath: string, spreadsheetPath: string, summaryPath: string }>}
 */
async function run(validatedPayload, sessionId, sessionMeta) {
  // Guard — L6 must have validated the payload
  if (!validatedPayload || validatedPayload.validated !== true) {
    throw new Error('L7 blocked: payload has not been validated by L6. Anti-hallucination check is mandatory.');
  }

  const outputDir = process.env.OUTPUT_DIR || './outputs';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const docPath = path.join(outputDir, `${sessionId}_profile.docx`);
  const sheetPath = path.join(outputDir, `${sessionId}_data.xlsx`);
  const summaryPath = path.join(outputDir, `${sessionId}_summary.json`);

  await documentGenerator.generate(validatedPayload, docPath);
  await spreadsheetGenerator.generate(validatedPayload, sheetPath);
  await summaryGenerator.generate(validatedPayload, sessionId, sessionMeta, summaryPath);

  return {
    documentPath: docPath,
    spreadsheetPath: sheetPath,
    summaryPath,
  };
}

module.exports = { run };
