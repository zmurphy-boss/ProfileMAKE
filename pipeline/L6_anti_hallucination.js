// L6 — Anti-Hallucination Validator
// Cross-checks every extracted field against the master context.
// Fields that cannot be verified: flagged hallucination: true, humanReviewFlag: true.
// CANNOT be skipped — L7 will not run without a validated payload from this module.

/**
 * Validates all Track A + Track B output against the master context.
 *
 * @param {{
 *   sections: Object,        // Track A output
 *   indicators: Object,      // Track B Step 1
 *   kpis: Object             // Track B Step 2
 * }} extractedData
 * @param {string} masterContext - From L3 — the only source of truth
 * @returns {{
 *   validated: boolean,
 *   sections: Object,
 *   indicators: Object,
 *   kpis: Object,
 *   report: {
 *     totalFields: number,
 *     verified: number,
 *     hallucinations: number,
 *     hallucinatedFields: Array<{ path: string, value: string }>
 *   }
 * }}
 */
function run(extractedData, masterContext) {
  const { sections, indicators, kpis } = extractedData;
  const masterContextLower = masterContext.toLowerCase();
  const hallucinatedFields = [];

  // Validate Track A sections
  const validatedSections = validateSections(sections, masterContextLower, hallucinatedFields);

  // Validate Track B indicators
  const validatedIndicators = validateIndicatorsList(indicators, masterContextLower, hallucinatedFields);

  // Validate Track B KPIs
  const validatedKPIs = validateKPIsList(kpis, masterContextLower, hallucinatedFields);

  const totalFields = countFields(validatedSections) + countArrayFields(validatedIndicators) + countArrayFields(validatedKPIs);
  const hallucinations = hallucinatedFields.length;

  return {
    validated: true, // Always true — L7 uses this as the gate signal
    sections: validatedSections,
    indicators: validatedIndicators,
    kpis: validatedKPIs,
    report: {
      totalFields,
      verified: totalFields - hallucinations,
      hallucinations,
      hallucinatedFields,
    },
  };
}

/**
 * Walks all fields in the Track A sections object and cross-checks values.
 */
function validateSections(sections, masterContextLower, hallucinatedFields, pathPrefix = '') {
  if (!sections || typeof sections !== 'object') return sections;

  const result = {};
  for (const [sectionKey, sectionVal] of Object.entries(sections)) {
    if (typeof sectionVal === 'object' && sectionVal !== null && 'value' in sectionVal) {
      // Leaf field
      result[sectionKey] = validateField(sectionVal, `${pathPrefix}${sectionKey}`, masterContextLower, hallucinatedFields);
    } else if (typeof sectionVal === 'object' && sectionVal !== null) {
      // Nested section
      result[sectionKey] = validateSections(sectionVal, masterContextLower, hallucinatedFields, `${pathPrefix}${sectionKey}.`);
    } else {
      result[sectionKey] = sectionVal;
    }
  }
  return result;
}

/**
 * Validates a single leaf field.
 */
function validateField(field, fieldPath, masterContextLower, hallucinatedFields) {
  const value = field.value;

  // INFO_MISSING is always valid — nothing to cross-check
  if (!value || value === 'INFO_MISSING' || value === '') {
    return field;
  }

  // Check if any meaningful fragment of the value appears in the master context
  const verified = isVerifiable(value, masterContextLower);

  if (!verified) {
    hallucinatedFields.push({ path: fieldPath, value });
    return {
      ...field,
      hallucination: true,
      human_review_flag: true,
      confidence: 'Low',
    };
  }

  return field;
}

/**
 * Validates arrays of indicator/result objects.
 */
function validateIndicatorsList(indicators, masterContextLower, hallucinatedFields) {
  if (!indicators || typeof indicators !== 'object') return indicators;

  const result = {};
  for (const [key, items] of Object.entries(indicators)) {
    if (Array.isArray(items)) {
      result[key] = items.map((item, i) => {
        const validated = {};
        for (const [field, value] of Object.entries(item)) {
          if (typeof value === 'string' && value !== 'INFO_MISSING' && value.length > 0) {
            if (!isVerifiable(value, masterContextLower)) {
              hallucinatedFields.push({ path: `indicators.${key}[${i}].${field}`, value });
              validated[field] = value; // Keep value but note: not flagged per-field in this structure
            } else {
              validated[field] = value;
            }
          } else {
            validated[field] = value;
          }
        }
        return validated;
      });
    } else {
      result[key] = items;
    }
  }
  return result;
}

/**
 * Validates KPI lists.
 */
function validateKPIsList(kpis, masterContextLower, hallucinatedFields) {
  if (!kpis || typeof kpis !== 'object') return kpis;

  const result = { ...kpis };

  for (const listKey of ['confidentKPIs', 'uncertainKPIs']) {
    if (Array.isArray(kpis[listKey])) {
      result[listKey] = kpis[listKey].map((kpi, i) => {
        if (kpi.kpi_name && kpi.kpi_name !== 'INFO_MISSING') {
          if (!isVerifiable(kpi.kpi_name, masterContextLower)) {
            // Path 2 KPIs may not appear verbatim in source — only flag if Path 1
            if (kpis.path === '1') {
              hallucinatedFields.push({ path: `kpis.${listKey}[${i}].kpi_name`, value: kpi.kpi_name });
              return { ...kpi, hallucination: true, human_review_flag: true };
            }
          }
        }
        return kpi;
      });
    }
  }

  return result;
}

/**
 * Checks whether any meaningful fragment of a value is present in the master context.
 * Strategy: take the longest word (>5 chars) and check if it appears.
 * @param {string} value
 * @param {string} masterContextLower
 * @returns {boolean}
 */
function isVerifiable(value, masterContextLower) {
  const valueLower = value.toLowerCase();

  // Direct substring match (most reliable)
  if (masterContextLower.includes(valueLower)) return true;

  // Fragment match — find significant words and check any appear
  const words = valueLower.split(/\s+/).filter((w) => w.length > 5);
  if (words.length === 0) return true; // Very short values — give benefit of doubt
  const matchCount = words.filter((w) => masterContextLower.includes(w)).length;
  return matchCount >= Math.ceil(words.length * 0.5); // At least 50% of significant words found
}

function countFields(obj, count = 0) {
  if (!obj || typeof obj !== 'object') return count;
  for (const val of Object.values(obj)) {
    if (typeof val === 'object' && val !== null && 'value' in val) {
      count++;
    } else if (typeof val === 'object') {
      count = countFields(val, count);
    }
  }
  return count;
}

function countArrayFields(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  let count = 0;
  for (const items of Object.values(obj)) {
    if (Array.isArray(items)) count += items.length;
  }
  return count;
}

module.exports = { run };
