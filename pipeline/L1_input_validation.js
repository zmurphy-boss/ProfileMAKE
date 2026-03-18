// L1 — Input Validation Gate
// Checks which inputs Vera has submitted. Builds a manifest.
// Absent input types are skipped — never error on them.
const { INPUT_TYPES, URL_FIELDS, FILE_FIELDS } = require('../config/input_types.config');

/**
 * Validates a submission and builds the input manifest.
 *
 * @param {Object} submission
 * @param {Object} submission.files - Keyed by input type (e.g. { pdf: [{ path, originalname }] })
 * @param {Object} submission.urls  - Keyed by URL field name (e.g. { url_linkedin: 'https://...' })
 * @returns {{
 *   present: string[],
 *   absent: string[],
 *   files: Object,
 *   urls: Object,
 *   errors: string[]
 * }}
 */
function run(submission) {
  const { files = {}, urls = {} } = submission;
  const present = [];
  const absent = [];
  const validatedFiles = {};
  const validatedUrls = {};
  const errors = [];

  // Check file-based input types
  for (const type of FILE_FIELDS) {
    const submitted = files[type];
    if (submitted && Array.isArray(submitted) && submitted.length > 0) {
      present.push(type);
      validatedFiles[type] = submitted;
    } else {
      absent.push(type);
    }
  }

  // Check URL-based input types
  for (const field of URL_FIELDS) {
    const url = urls[field];
    if (url && typeof url === 'string' && url.trim().length > 0) {
      const trimmed = url.trim();
      if (isValidUrl(trimmed)) {
        present.push(field);
        validatedUrls[field] = trimmed;
      } else {
        errors.push(`Invalid URL for field "${field}": ${url}`);
        absent.push(field);
      }
    } else {
      absent.push(field);
    }
  }

  if (present.length === 0) {
    errors.push('No valid inputs submitted. At least one input is required.');
  }

  return {
    present,
    absent,
    files: validatedFiles,
    urls: validatedUrls,
    errors,
  };
}

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = { run };
