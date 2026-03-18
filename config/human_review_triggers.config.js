// Conditions that force a human review flag on a field.
// TBC — triggers to be refined during testing with Vera.
module.exports = {
  TRIGGERS: [
    // Each trigger is an object: { condition: string, description: string }
    { condition: 'confidence_low', description: 'TBC — confidence below LOW threshold' },
    { condition: 'conflict_unresolved', description: 'TBC — conflicting values across sources with no resolution rule' },
    { condition: 'hallucination_flagged', description: 'Field failed anti-hallucination cross-check in L6' },
    { condition: 'kpi_uncertain', description: 'KPI placed in Uncertain KPIs list by Track B Path 2' },
    { condition: 'TBC', description: 'TBC — additional triggers confirmed post-Wednesday call' },
  ],
};
