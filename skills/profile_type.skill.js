// Profile Type Skill — sets profile type context for all LLM calls.
// Reads ACTIVE_PROFILE_TYPE from profile_type.config.js at runtime.
const { ACTIVE_PROFILE_TYPE } = require('../config/profile_type.config');

/**
 * Builds the profile type prompt fragment to prepend to all LLM prompts.
 * @returns {string}
 */
function buildPrompt() {
  return `You are extracting information for a ${ACTIVE_PROFILE_TYPE} profile on the CommonGround platform. CommonGround connects social impact organisations with funders and grant-makers. All extraction must be relevant to a ${ACTIVE_PROFILE_TYPE} profile context.`;
}

/**
 * Returns the active profile type string.
 * @returns {string}
 */
function getProfileType() {
  return ACTIVE_PROFILE_TYPE;
}

module.exports = { buildPrompt, getProfileType };
