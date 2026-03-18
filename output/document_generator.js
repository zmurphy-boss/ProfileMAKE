// Document Generator — narrative text sections output.
// Columns: Field Name | Extracted Value | Confidence | Source | DB Field (TBC) | Corrections
// Corrections column is intentional and first-class — always present, pre-labelled.
// Section order read from profile_sections.config.js at runtime.
// Uses docx library for Word output. Falls back to HTML file if unavailable.
const { PROFILE_SECTIONS } = require('../config/profile_sections.config');
const { DB_SCHEMA } = require('../config/db.config');
const { DOCUMENT_FORMAT } = require('../config/output_format.config');
const fs = require('fs');
const path = require('path');

/**
 * Generates the narrative profile document.
 *
 * @param {{
 *   sections: Object,
 *   indicators: Object,
 *   kpis: Object,
 *   report: Object
 * }} validatedPayload
 * @param {string} outputPath - File path for the output document
 * @returns {Promise<void>}
 */
async function generate(validatedPayload, outputPath) {
  const { sections } = validatedPayload;
  const columns = DOCUMENT_FORMAT.columns;

  const rows = [];

  // Walk sections and flatten all leaf fields into rows
  flattenSections(sections, rows, columns);

  // Write as HTML document (docx generation requires docx library — placeholder for Stage 1.5)
  const html = buildHTMLDocument(rows, columns, outputPath);
  const htmlPath = outputPath.replace('.docx', '.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  // Also write a simple text version
  const textPath = outputPath.replace('.docx', '.txt');
  fs.writeFileSync(textPath, buildTextDocument(rows, columns), 'utf8');
}

function flattenSections(obj, rows, columns, sectionName = '') {
  if (!obj || typeof obj !== 'object') return;

  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'object' && val !== null && 'value' in val) {
      const dbField = DB_SCHEMA[key] || 'TBC';
      rows.push({
        field_name: formatFieldName(sectionName ? `${sectionName} > ${key}` : key),
        extracted_value: val.value || 'INFO_MISSING',
        confidence: val.confidence || '',
        source: val.source || '',
        db_field: dbField,
        corrections: '', // Vera fills this in
        human_review_flag: val.human_review_flag || false,
        hallucination: val.hallucination || false,
      });
    } else if (typeof val === 'object' && val !== null) {
      flattenSections(val, rows, columns, sectionName ? `${sectionName} > ${key}` : key);
    }
  }
}

function formatFieldName(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildHTMLDocument(rows, columns, outputPath) {
  const sessionId = path.basename(outputPath, '.docx');
  const rowsHTML = rows.map((row) => {
    const flagStyle = row.human_review_flag ? ' style="background:#fff3cd"' : '';
    const hallStyle = row.hallucination ? ' style="background:#f8d7da"' : flagStyle;
    return `<tr${hallStyle}>
      <td>${escapeHTML(row.field_name)}</td>
      <td>${escapeHTML(row.extracted_value)}</td>
      <td>${escapeHTML(row.confidence)}</td>
      <td>${escapeHTML(row.source)}</td>
      <td>${escapeHTML(row.db_field)}</td>
      <td class="corrections">${escapeHTML(row.corrections)}</td>
    </tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CommonGround Profile — ${sessionId}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; padding: 24px; }
  h1 { font-size: 18px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 8px 10px; vertical-align: top; }
  th { background: #2c3e50; color: white; }
  .corrections { background: #f0f8ff; }
  tr:hover { background: #f9f9f9; }
</style>
</head>
<body>
<h1>CommonGround Profile Document</h1>
<p>Session: ${sessionId} | Generated: ${new Date().toISOString()}</p>
<p><strong>Legend:</strong> Yellow = Human review required | Red = Hallucination flagged | Blue = Corrections column</p>
<table>
  <thead>
    <tr>
      ${columns.map((c) => `<th>${escapeHTML(c.label)}</th>`).join('')}
    </tr>
  </thead>
  <tbody>
    ${rowsHTML}
  </tbody>
</table>
</body>
</html>`;
}

function buildTextDocument(rows, columns) {
  const header = columns.map((c) => c.label).join(' | ');
  const separator = '-'.repeat(header.length);
  const lines = rows.map((row) =>
    columns.map((c) => String(row[c.key] || '')).join(' | ')
  );
  return [header, separator, ...lines].join('\n');
}

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { generate };
