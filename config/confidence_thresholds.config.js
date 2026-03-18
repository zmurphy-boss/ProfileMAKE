// Confidence score thresholds for extraction quality bands.
// TBC — values to be calibrated during testing.
module.exports = {
  THRESHOLDS: {
    HIGH: 'TBC',   // e.g. 0.85 — extracted verbatim or near-verbatim from source
    MEDIUM: 'TBC', // e.g. 0.60 — inferred with reasonable evidence
    LOW: 'TBC',    // e.g. 0.00 — minimal evidence, human review required
    labels: {
      HIGH: 'High',
      MEDIUM: 'Medium',
      LOW: 'Low',
    },
  },
};
