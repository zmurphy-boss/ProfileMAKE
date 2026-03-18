// KPI Selection Skill — handles both KPI selection paths.
// Path 1: Explicit KPIs found in source (tagged [KPI_EXPLICIT: true]) — extract directly.
// Path 2: No explicit KPIs — AI selects using mission + professional KPI criteria.
// Returns: { confidentKPIs: [], uncertainKPIs: [] }
const { CRITERIA } = require('../config/kpi_selection_criteria.config');

/**
 * Builds the KPI selection prompt for Track B Step 2.
 * @param {string} masterContext - The full master context string from L3
 * @param {boolean} hasExplicitKPIs - Whether [KPI_EXPLICIT: true] tags were found
 * @returns {string}
 */
function buildPrompt(masterContext, hasExplicitKPIs) {
  if (hasExplicitKPIs) {
    return buildPath1Prompt(masterContext);
  }
  return buildPath2Prompt(masterContext);
}

function buildPath1Prompt(masterContext) {
  return `You are performing KPI extraction for a social impact organisation profile.

CONTEXT:
${masterContext}

TASK (Path 1 — Explicit KPIs found):
The source material contains explicitly stated KPIs, marked with [KPI_EXPLICIT: true].
Extract all explicitly stated KPIs verbatim from the tagged sections.
Do not infer or add KPIs that are not explicitly stated.
For each KPI, provide:
- kpi_name: the KPI name or metric
- kpi_value: the stated value or target (use INFO_MISSING if not stated)
- kpi_source: the [SOURCE_N] tag it came from
- confidence: High (explicitly stated), Medium (implied), Low (unclear)
- human_review_flag: true if confidence is not High

Return a JSON object:
{
  "path": "1",
  "confidentKPIs": [{ "kpi_name": "", "kpi_value": "", "kpi_source": "", "confidence": "", "human_review_flag": false }],
  "uncertainKPIs": []
}`;
}

function buildPath2Prompt(masterContext) {
  const criteriaDesc = JSON.stringify(CRITERIA, null, 2);

  return `You are performing KPI selection for a social impact organisation profile.

CONTEXT:
${masterContext}

TASK (Path 2 — No explicit KPIs found):
No KPIs were explicitly stated in the source material.
Using the organisation's mission and the selection criteria below, identify the most appropriate KPIs.

SELECTION CRITERIA:
${criteriaDesc}

For each proposed KPI:
- kpi_name: the KPI name or metric
- rationale: why this KPI fits the mission and criteria
- confidence: High (strong mission fit + professional standard), Medium (reasonable fit), Low (speculative)
- human_review_flag: true always for Path 2 KPIs

Place KPIs with High or Medium confidence in confidentKPIs.
Place KPIs with Low confidence in uncertainKPIs.

Return a JSON object:
{
  "path": "2",
  "confidentKPIs": [{ "kpi_name": "", "rationale": "", "confidence": "", "human_review_flag": true }],
  "uncertainKPIs": [{ "kpi_name": "", "rationale": "", "confidence": "", "human_review_flag": true }]
}`;
}

/**
 * Parses the raw LLM response into the KPI result structure.
 * @param {string} raw - Raw LLM response string
 * @returns {{ path: string, confidentKPIs: Array, uncertainKPIs: Array }}
 */
function parseResponse(raw) {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in KPI selection response');
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      path: parsed.path || 'unknown',
      confidentKPIs: Array.isArray(parsed.confidentKPIs) ? parsed.confidentKPIs : [],
      uncertainKPIs: Array.isArray(parsed.uncertainKPIs) ? parsed.uncertainKPIs : [],
    };
  } catch (err) {
    return {
      path: 'parse_error',
      confidentKPIs: [],
      uncertainKPIs: [],
      parseError: err.message,
    };
  }
}

module.exports = { buildPrompt, parseResponse };
