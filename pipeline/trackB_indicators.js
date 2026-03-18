// Track B — Indicators, Results, and KPI Extraction
// One script, two LLM calls. Entirely separate from Track A — no shared logic.
// Step 1: Extract all indicators and results (delegates to indicators_extraction.skill.js).
// Step 2: Run kpi_selection.skill — Path 1 if explicit KPIs found, Path 2 if not.
// Always runs to completion — uncertain output is flagged with human_review_flag: true, not held.

const OpenAI = require('openai');
const indicatorsSkill = require('../skills/indicators_extraction.skill');
const kpiSelectionSkill = require('../skills/kpi_selection.skill');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Runs Track B (Steps 1 and 2).
 * Always completes — uncertain fields are flagged with human_review_flag: true.
 *
 * @param {string} masterContext - From L3
 * @param {boolean} hasExplicitKPIs - From L3
 * @returns {Promise<{
 *   indicators: Object,
 *   kpis: Object,
 *   rawStep1: string,
 *   rawStep2: string,
 *   kpiPath: string
 * }>}
 */
async function run(masterContext, hasExplicitKPIs) {
  // Step 1 — Extract indicators and results
  const step1Result = await runStep1(masterContext);

  // Step 2 — KPI selection
  const step2Result = await runStep2(masterContext, hasExplicitKPIs);

  return {
    indicators: step1Result.indicators,
    kpis: step2Result.kpis,
    rawStep1: step1Result.rawResponse,
    rawStep2: step2Result.rawResponse,
    kpiPath: step2Result.kpiPath,
  };
}

/**
 * Step 1: Extract all indicators and results using indicators_extraction.skill.
 */
async function runStep1(masterContext) {
  const prompt = indicatorsSkill.buildPrompt(masterContext);

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
  });

  const rawResponse = response.choices[0].message.content;
  const indicators = indicatorsSkill.parseResponse(rawResponse);

  return { indicators, rawResponse };
}

/**
 * Step 2: KPI selection using kpi_selection.skill.
 */
async function runStep2(masterContext, hasExplicitKPIs) {
  const prompt = kpiSelectionSkill.buildPrompt(masterContext, hasExplicitKPIs);

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
  });

  const rawResponse = response.choices[0].message.content;
  const parsed = kpiSelectionSkill.parseResponse(rawResponse);

  return {
    kpis: parsed,
    rawResponse,
    kpiPath: parsed.path,
  };
}

module.exports = { run };
