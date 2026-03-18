// L8 — Session Audit Trail
// Writes the full pipeline run log to /sessions/{sessionId}.json.
// Logged: inputs, manifest, master context hash, Track A/B responses,
//         validator report, output file paths, timestamps.
// Corrections column entries from Vera are appended via session_audit.appendCorrection().
const crypto = require('crypto');
const sessionAudit = require('../audit/session_audit');

/**
 * Initialises the session audit record at the start of a pipeline run.
 * @param {string} sessionId
 * @param {{ profileType: string, manifest: Object }} initData
 */
function init(sessionId, initData) {
  sessionAudit.create(sessionId, {
    profile_type: initData.profileType,
    manifest: initData.manifest,
    pipeline_stage: 'started',
    started_at: new Date().toISOString(),
  });
}

/**
 * Records the master context hash (not the full content — keeps the audit file compact).
 * @param {string} sessionId
 * @param {string} masterContext
 * @param {Array} sourceIndex
 */
function recordMasterContext(sessionId, masterContext, sourceIndex) {
  const hash = crypto.createHash('sha256').update(masterContext).digest('hex');
  sessionAudit.update(sessionId, {
    master_context_hash: hash,
    master_context_length: masterContext.length,
    source_index: sourceIndex,
    pipeline_stage: 'master_context_built',
  });
}

/**
 * Records Track A results.
 * @param {string} sessionId
 * @param {{ sections: Object, rawResponse: string, usage: Object }} trackAResult
 */
function recordTrackA(sessionId, trackAResult) {
  sessionAudit.update(sessionId, {
    track_a: {
      completed_at: new Date().toISOString(),
      usage: trackAResult.usage,
      raw_response: trackAResult.rawResponse,
    },
    pipeline_stage: 'track_a_complete',
  });
}

/**
 * Records Track B results.
 * @param {string} sessionId
 * @param {{ indicators: Object, kpis: Object, kpiPath: string, rawStep1: string, rawStep2: string }} trackBResult
 */
function recordTrackB(sessionId, trackBResult) {
  sessionAudit.update(sessionId, {
    track_b: {
      completed_at: new Date().toISOString(),
      kpi_path: trackBResult.kpiPath,
      pending_review: trackBResult.pendingReview,
      raw_step1: trackBResult.rawStep1,
      raw_step2: trackBResult.rawStep2,
    },
    pipeline_stage: 'track_b_complete',
  });
}

/**
 * Records L6 validator report.
 * @param {string} sessionId
 * @param {Object} validatorReport
 */
function recordValidation(sessionId, validatorReport) {
  sessionAudit.update(sessionId, {
    validation_report: validatorReport,
    pipeline_stage: 'validation_complete',
  });
}

/**
 * Records output file paths and marks the run as complete.
 * @param {string} sessionId
 * @param {{ documentPath: string, spreadsheetPath: string, summaryPath: string }} outputPaths
 */
function recordOutputs(sessionId, outputPaths) {
  sessionAudit.update(sessionId, {
    output_files: outputPaths,
    pipeline_stage: 'complete',
    completed_at: new Date().toISOString(),
  });
}

/**
 * Appends a correction from Vera to the session audit.
 * This builds the prompt improvement dataset across runs.
 * @param {string} sessionId
 * @param {{ fieldPath: string, originalValue: string, correctedValue: string, reason?: string }} correction
 */
function recordCorrection(sessionId, correction) {
  sessionAudit.appendCorrection(sessionId, correction);
}

module.exports = {
  init,
  recordMasterContext,
  recordTrackA,
  recordTrackB,
  recordValidation,
  recordOutputs,
  recordCorrection,
};
