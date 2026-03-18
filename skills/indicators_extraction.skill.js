// Indicators Extraction Skill — Track B Step 1.
// Extracts all indicators and results from the master context.
// Interface: buildPrompt(masterContext) + parseResponse(raw)

/**
 * Builds the indicators and results extraction prompt.
 * @param {string} masterContext - From L3
 * @returns {string}
 */
function buildPrompt(masterContext) {
  return `You are extracting indicators and results data from the source material below.

RULES:
1. Extract only what is explicitly stated in the source material.
2. Use INFO_MISSING if a field is not found — never guess, infer, or fabricate.
3. For every item, provide confidence: High (verbatim/near-verbatim), Medium (reasonable inference), Low (minimal evidence).
4. Record the [SOURCE_N] tag from the source material in the source field.
5. Set human_review_flag to true for any item with Low confidence or conflicting values.
6. Do NOT select or recommend KPIs — only extract what is explicitly stated.

SOURCE MATERIAL:
${masterContext}

Extract all indicators and results and return a JSON object with this exact structure:

{
  "indicators": [
    {
      "name": "",
      "description": "",
      "baseline": "",
      "target": "",
      "current_value": "",
      "unit": "",
      "measurement_period": "",
      "confidence": "",
      "source": "",
      "human_review_flag": false
    }
  ],
  "results": [
    {
      "description": "",
      "value": "",
      "period": "",
      "beneficiaries": "",
      "confidence": "",
      "source": "",
      "human_review_flag": false
    }
  ]
}

If no indicators are found, return an empty indicators array.
If no results are found, return an empty results array.
Return only the JSON object. No commentary before or after.`;
}

/**
 * Parses the raw LLM response into the indicators/results structure.
 * @param {string} raw
 * @returns {{ indicators: Array, results: Array }}
 */
function parseResponse(raw) {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in indicators extraction response');
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      indicators: Array.isArray(parsed.indicators) ? parsed.indicators : [],
      results: Array.isArray(parsed.results) ? parsed.results : [],
    };
  } catch (err) {
    return {
      indicators: [],
      results: [],
      parseError: err.message,
    };
  }
}

module.exports = { buildPrompt, parseResponse };
