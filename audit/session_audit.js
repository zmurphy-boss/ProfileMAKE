// Session Audit — writes and updates session audit records.
// Corrections column entries from Vera are appended here — this is the prompt improvement dataset.
const fs = require('fs');
const path = require('path');

/**
 * Creates a new session audit record.
 * @param {string} sessionId
 * @param {Object} initialData
 * @returns {void}
 */
function create(sessionId, initialData) {
  const sessionDir = process.env.SESSION_DIR || './sessions';
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }
  const record = {
    session_id: sessionId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    corrections: [], // Vera's overrides — prompt improvement dataset
    ...initialData,
  };
  write(sessionId, record);
}

/**
 * Updates an existing session audit record by merging new data.
 * @param {string} sessionId
 * @param {Object} updateData
 * @returns {void}
 */
function update(sessionId, updateData) {
  const existing = read(sessionId) || {};
  const record = {
    ...existing,
    ...updateData,
    updated_at: new Date().toISOString(),
  };
  write(sessionId, record);
}

/**
 * Appends a correction entry to the session audit.
 * This is the primary mechanism for building the prompt improvement dataset.
 * @param {string} sessionId
 * @param {{ fieldPath: string, originalValue: string, correctedValue: string, reason?: string }} correction
 * @returns {void}
 */
function appendCorrection(sessionId, correction) {
  const existing = read(sessionId);
  if (!existing) throw new Error(`Session ${sessionId} not found`);

  const corrections = existing.corrections || [];
  corrections.push({
    ...correction,
    corrected_at: new Date().toISOString(),
  });

  update(sessionId, { corrections });
}

/**
 * Reads the session audit record.
 * @param {string} sessionId
 * @returns {Object|null}
 */
function read(sessionId) {
  const filePath = getSessionPath(sessionId);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function write(sessionId, record) {
  fs.writeFileSync(getSessionPath(sessionId), JSON.stringify(record, null, 2), 'utf8');
}

function getSessionPath(sessionId) {
  const sessionDir = process.env.SESSION_DIR || './sessions';
  return path.join(sessionDir, `${sessionId}.json`);
}

module.exports = { create, update, read, appendCorrection };
