// Summary Generator — pipeline run summary.
// Contents: session ID, inputs processed, sources used, confidence distribution,
//           flags raised, hallucinations caught, Track B KPI path, output files.
const fs = require('fs');

/**
 * Generates the pipeline run summary JSON file.
 *
 * @param {{
 *   validated: boolean,
 *   sections: Object,
 *   indicators: Object,
 *   kpis: Object,
 *   report: Object
 * }} validatedPayload
 * @param {string} sessionId
 * @param {{ profileType: string, kpiPath: string, manifest: Object }} sessionMeta
 * @param {string} outputPath
 * @returns {Promise<void>}
 */
async function generate(validatedPayload, sessionId, sessionMeta, outputPath) {
  const { report, kpis } = validatedPayload;
  const { profileType, kpiPath, manifest } = sessionMeta;

  const confidenceDist = buildConfidenceDistribution(validatedPayload.sections);
  const flagsRaised = countFlags(validatedPayload.sections);

  const summary = {
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    profile_type: profileType,
    inputs_processed: manifest ? manifest.present : [],
    sources_used: manifest ? manifest.present.length : 0,
    confidence_distribution: confidenceDist,
    flags_raised: flagsRaised,
    hallucinations_caught: report.hallucinations,
    hallucinated_fields: report.hallucinatedFields,
    track_b_kpi_path: kpiPath || (kpis && kpis.path) || 'unknown',
    total_fields: report.totalFields,
    verified_fields: report.verified,
    output_files: {
      document: outputPath.replace('_summary.json', '_profile.html'),
      spreadsheet: outputPath.replace('_summary.json', '_data.xlsx'),
      summary: outputPath,
    },
  };

  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), 'utf8');
}

function buildConfidenceDistribution(sections) {
  const dist = { High: 0, Medium: 0, Low: 0, INFO_MISSING: 0 };
  walkFields(sections, (field) => {
    if (field.value === 'INFO_MISSING' || !field.value) {
      dist.INFO_MISSING++;
    } else if (field.confidence === 'High') {
      dist.High++;
    } else if (field.confidence === 'Medium') {
      dist.Medium++;
    } else {
      dist.Low++;
    }
  });
  return dist;
}

function countFlags(sections) {
  let count = 0;
  walkFields(sections, (field) => {
    if (field.human_review_flag) count++;
  });
  return count;
}

function walkFields(obj, callback) {
  if (!obj || typeof obj !== 'object') return;
  for (const val of Object.values(obj)) {
    if (typeof val === 'object' && val !== null && 'value' in val) {
      callback(val);
    } else if (typeof val === 'object') {
      walkFields(val, callback);
    }
  }
}

module.exports = { generate };
