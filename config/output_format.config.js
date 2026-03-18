// Output file column layouts and section ordering.
// Corrections column is intentional and first-class — always present, never optional.
module.exports = {
  DOCUMENT_FORMAT: {
    columns: [
      { key: 'field_name', label: 'Field Name' },
      { key: 'extracted_value', label: 'Extracted Value' },
      { key: 'confidence', label: 'Confidence' },
      { key: 'source', label: 'Source' },
      { key: 'db_field', label: 'DB Field' }, // TBC — populated from db.config.js
      { key: 'corrections', label: 'Corrections' }, // First-class feature — Vera logs overrides here
    ],
    include_sections: 'all', // Read from profile_sections.config.js at runtime
  },
  SPREADSHEET_FORMAT: {
    columns: [
      { key: 'field_name', label: 'Field Name' },
      { key: 'extracted_value', label: 'Extracted Value' },
      { key: 'confidence', label: 'Confidence' },
      { key: 'source', label: 'Source' },
      { key: 'db_field', label: 'DB Field' }, // TBC
      { key: 'corrections', label: 'Corrections' }, // First-class feature — same as document
    ],
    include_sections: 'quantitative', // Indicators, Results, KPIs only
  },
  SUMMARY_FORMAT: {
    type: 'json', // json or text
    fields: [
      'session_id',
      'timestamp',
      'inputs_processed',
      'sources_used',
      'confidence_distribution',
      'flags_raised',
      'hallucinations_caught',
      'track_b_kpi_path',
      'output_files',
    ],
  },
};
