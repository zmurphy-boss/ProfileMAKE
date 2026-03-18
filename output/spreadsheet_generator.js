// Spreadsheet Generator — quantitative sections output (indicators, results, KPIs).
// Columns: Field Name | Extracted Value | Confidence | Source | DB Field (TBC) | Corrections
// Corrections column is intentional and first-class — always present, pre-labelled.
// Uses SheetJS (xlsx) for Excel output.
const XLSX = require('xlsx');
const { DB_SCHEMA } = require('../config/db.config');
const { SPREADSHEET_FORMAT } = require('../config/output_format.config');

/**
 * Generates the quantitative data spreadsheet.
 *
 * @param {{
 *   sections: Object,
 *   indicators: Object,
 *   kpis: Object,
 *   report: Object
 * }} validatedPayload
 * @param {string} outputPath - File path for the .xlsx output
 * @returns {Promise<void>}
 */
async function generate(validatedPayload, outputPath) {
  const { indicators, kpis } = validatedPayload;
  const columns = SPREADSHEET_FORMAT.columns;
  const wb = XLSX.utils.book_new();

  // Sheet 1: Indicators
  const indicatorRows = buildIndicatorRows(indicators);
  appendSheet(wb, 'Indicators', indicatorRows, columns);

  // Sheet 2: Results
  const resultRows = buildResultRows(indicators);
  appendSheet(wb, 'Results', resultRows, columns);

  // Sheet 3: KPIs — Confident
  const confidentKPIRows = buildKPIRows(kpis, 'confidentKPIs');
  appendSheet(wb, 'KPIs Confident', confidentKPIRows, columns);

  // Sheet 4: KPIs — Uncertain
  const uncertainKPIRows = buildKPIRows(kpis, 'uncertainKPIs');
  appendSheet(wb, 'KPIs Uncertain', uncertainKPIRows, columns);

  XLSX.writeFile(wb, outputPath);
}

function buildIndicatorRows(indicators) {
  if (!indicators || !Array.isArray(indicators.indicators)) return [];
  return indicators.indicators.map((ind) => ({
    field_name: ind.name || 'INFO_MISSING',
    extracted_value: [ind.description, ind.current_value, ind.target, ind.unit, ind.measurement_period]
      .filter(Boolean)
      .join(' | ') || 'INFO_MISSING',
    confidence: ind.confidence || '',
    source: ind.source || '',
    db_field: DB_SCHEMA[ind.name] || 'TBC',
    corrections: '', // Vera fills this in
  }));
}

function buildResultRows(indicators) {
  if (!indicators || !Array.isArray(indicators.results)) return [];
  return indicators.results.map((res) => ({
    field_name: res.description || 'INFO_MISSING',
    extracted_value: [res.value, res.period, res.beneficiaries].filter(Boolean).join(' | ') || 'INFO_MISSING',
    confidence: res.confidence || '',
    source: res.source || '',
    db_field: 'TBC',
    corrections: '', // Vera fills this in
  }));
}

function buildKPIRows(kpis, listKey) {
  if (!kpis || !Array.isArray(kpis[listKey])) return [];
  return kpis[listKey].map((kpi) => ({
    field_name: kpi.kpi_name || 'INFO_MISSING',
    extracted_value: kpi.kpi_value || kpi.rationale || 'INFO_MISSING',
    confidence: kpi.confidence || '',
    source: kpi.kpi_source || `KPI Path ${kpis.path || 'TBC'}`,
    db_field: 'TBC',
    corrections: '', // Vera fills this in
  }));
}

function appendSheet(wb, sheetName, rows, columns) {
  const header = columns.map((c) => c.label);
  const dataRows = rows.map((row) => columns.map((c) => row[c.key] || ''));
  const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows]);

  // Style the header row (bold — basic SheetJS styling)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[cellRef]) {
      ws[cellRef].s = { font: { bold: true }, fill: { fgColor: { rgb: '2C3E50' } } };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

module.exports = { generate };
