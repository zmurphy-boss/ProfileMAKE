// Excel Handler — extracts data from .xlsx files using SheetJS.
// Preserves sheet and row references in location tags.
const XLSX = require('xlsx');
const path = require('path');

/**
 * Extracts data from an Excel file.
 * @param {string} filePath - Absolute path to the .xlsx file
 * @returns {Promise<{ chunks: Array<{ text: string, location: string }> }>}
 */
async function extract(filePath) {
  const filename = path.basename(filePath);
  const workbook = XLSX.readFile(filePath);
  const chunks = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    rows.forEach((row, rowIndex) => {
      const rowText = row
        .map((cell) => String(cell).trim())
        .filter((cell) => cell.length > 0)
        .join(' | ');

      if (rowText.length > 0) {
        chunks.push({
          text: rowText,
          location: `${filename}, sheet "${sheetName}", row ${rowIndex + 1}`,
        });
      }
    });
  }

  return { chunks };
}

module.exports = { extract };
