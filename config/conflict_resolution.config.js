// Rules for resolving conflicting field values across sources.
// TBC — to be finalised after Wednesday Anurag call.
module.exports = {
  CONFLICT_RULES: {
    // Strategy options: 'prefer_highest_confidence', 'prefer_primary_source', 'flag_human_review', 'merge'
    default_strategy: 'flag_human_review',
    field_overrides: {
      // Example: 'organisation_name': 'prefer_highest_confidence'
      // TBC: field-level overrides confirmed post-Wednesday call
    },
    primary_source_priority: [
      // Ordered list of source types — highest priority first
      // TBC
    ],
  },
};
