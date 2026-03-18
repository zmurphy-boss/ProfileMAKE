// L0 — Profile Type Layer
// Loads profile type config and skill. Returns profile type context attached to session state.
const { ACTIVE_PROFILE_TYPE } = require('../config/profile_type.config');
const profileTypeSkill = require('../skills/profile_type.skill');

/**
 * Initialises the profile type context for a pipeline session.
 * @returns {{ profileType: string, promptFragment: string }}
 */
function run() {
  const profileType = profileTypeSkill.getProfileType();
  const promptFragment = profileTypeSkill.buildPrompt();

  return {
    profileType,
    promptFragment,
  };
}

module.exports = { run };
