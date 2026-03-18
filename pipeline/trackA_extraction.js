// Track A — Standard Sections Extraction
// Single LLM call. Delegates prompt building and response parsing to profile_sections.skill.js.
// Sections are read from profile_sections.config.js at runtime — never hardcoded here.
// NO KPI logic here — Track B only.

const OpenAI = require('openai');
const profileSectionsSkill = require('../skills/profile_sections.skill');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Runs Track A extraction against the master context.
 *
 * @param {string} masterContext - From L3
 * @returns {Promise<{
 *   sections: Object,
 *   rawResponse: string,
 *   usage: Object
 * }>}
 */
async function run(masterContext) {
  const prompt = profileSectionsSkill.buildPrompt(masterContext);

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
  });

  const rawResponse = response.choices[0].message.content;
  const sections = profileSectionsSkill.parseResponse(rawResponse);

  return {
    sections,
    rawResponse,
    usage: response.usage,
  };
}

module.exports = { run };
