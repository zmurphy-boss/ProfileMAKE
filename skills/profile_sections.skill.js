// Profile Sections Skill — Track A extraction prompt builder.
// Reads PROFILE_SECTIONS from profile_sections.config.js at runtime.
// HARD CONSTRAINT: section list must never be hardcoded — always read from config.
// Interface: buildPrompt(masterContext) + parseResponse(raw)
const { PROFILE_SECTIONS } = require('../config/profile_sections.config');
const profileTypeSkill = require('./profile_type.skill');

// Fallback sections used only if config is TBC — replaced once Wednesday call populates config.
// These match the Stage 1.5 Hybrid architecture spec.
const STAGE_15_FALLBACK_SECTIONS = [
  'basic_information',
  'mission',
  'focus_areas',
  'objectives',
  'impact_stories',
  'people',
  'multimedia',
  'newsletters',
];

// Field definitions per section — drives the JSON schema in the prompt.
// When PROFILE_SECTIONS is populated from config, sections not listed here
// will receive a generic { value, confidence, source, human_review_flag } schema.
const SECTION_FIELDS = {
  basic_information: [
    'organisation_name',
    'website',
    'country',
    'founding_year',
    'organisation_type',
    'registration_number',
  ],
  mission: ['mission_statement', 'vision_statement'],
  focus_areas: ['primary_focus', 'secondary_focus', 'sdgs'],
  objectives: ['strategic_objectives', 'current_programmes'],
  impact_stories: ['stories'],
  people: ['leadership', 'team_size', 'volunteers'],
  multimedia: ['videos', 'images_described'],
  newsletters: ['newsletter_content', 'publication_frequency'],
};

/**
 * Builds the Track A extraction prompt dynamically from PROFILE_SECTIONS config.
 * @param {string} masterContext - From L3
 * @returns {string}
 */
function buildPrompt(masterContext) {
  const profileTypeFragment = profileTypeSkill.buildPrompt();
  const sections = getActiveSections();
  const jsonSchema = buildJSONSchema(sections);

  return `${profileTypeFragment}

You are extracting structured profile information from the source material below.

RULES — YOU MUST FOLLOW THESE EXACTLY:
1. Only extract information that is explicitly present in the source material.
2. If a field is not found, output INFO_MISSING — never guess, infer, or fabricate.
3. For every field, provide a confidence score: High (verbatim or near-verbatim), Medium (reasonable inference from explicit text), Low (minimal evidence).
4. Set human_review_flag to true for any field with Low confidence or conflicting values.
5. For conflicts between sources, note both values and set human_review_flag to true.
6. Do NOT extract any KPI, indicator, or results data — that is handled separately.

SOURCE MATERIAL:
${masterContext}

Extract the following sections and return a single JSON object with this exact structure:

${jsonSchema}

Return only the JSON object. No commentary before or after.`;
}

/**
 * Parses the raw LLM response into the sections structure.
 * @param {string} raw
 * @returns {Object}
 */
function parseResponse(raw) {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in Track A response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    return {
      parse_error: err.message,
      raw_response: raw,
    };
  }
}

/**
 * Returns the active section list.
 * Uses PROFILE_SECTIONS from config if populated; falls back to Stage 1.5 defaults.
 * @returns {string[]}
 */
function getActiveSections() {
  const configured = PROFILE_SECTIONS.filter((s) => s !== 'TBC');
  return configured.length > 0 ? configured : STAGE_15_FALLBACK_SECTIONS;
}

/**
 * Builds the JSON schema string for the prompt from the section list.
 * @param {string[]} sections
 * @returns {string}
 */
function buildJSONSchema(sections) {
  const obj = {};
  for (const section of sections) {
    const fields = SECTION_FIELDS[section];
    if (fields) {
      obj[section] = {};
      for (const field of fields) {
        obj[section][field] = {
          value: '',
          confidence: '',
          source: '',
          human_review_flag: false,
        };
      }
    } else {
      // Generic schema for sections not pre-defined (populated after Wednesday call)
      obj[section] = {
        value: '',
        confidence: '',
        source: '',
        human_review_flag: false,
      };
    }
  }
  return JSON.stringify(obj, null, 2);
}

module.exports = { buildPrompt, parseResponse, getActiveSections };
