// Criteria used by kpi_selection.skill.js Path 2 (AI-selected KPIs).
// Applied when no explicit KPIs are found in source material.
// TBC — criteria to be finalised with CommonGround and Vera.
module.exports = {
  CRITERIA: {
    mission_alignment: {
      description: 'TBC — how closely the KPI maps to the organisation\'s stated mission',
      weight: 'TBC',
    },
    professional_standards: {
      description: 'TBC — whether the KPI appears in recognised sector KPI frameworks',
      weight: 'TBC',
      frameworks: ['TBC'], // e.g. IRIS+, Social Value UK, etc.
    },
    measurability: {
      description: 'TBC — whether the KPI is quantifiable and trackable',
      weight: 'TBC',
    },
    funder_relevance: {
      description: 'TBC — whether the KPI is likely to be meaningful to grant-makers and funders',
      weight: 'TBC',
    },
    // Threshold below which a KPI goes to Uncertain list rather than Confident list
    uncertain_threshold: 'TBC',
  },
};
