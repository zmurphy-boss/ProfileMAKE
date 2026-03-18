// L3 — Master Context Builder
// Compiles all tagged chunks into one master context document with a numbered source index.
// The masterContext string is the ONLY input passed to any LLM call.

/**
 * Builds the master context document from L2 tagged chunks.
 *
 * @param {Array<{
 *   text: string,
 *   source: string,
 *   confidence: string,
 *   humanReviewFlag: boolean,
 *   kpiExplicit: boolean,
 *   inputType: string
 * }>} taggedChunks
 * @returns {{
 *   masterContext: string,
 *   sourceIndex: Array<{ num: number, source: string, inputType: string }>,
 *   hasExplicitKPIs: boolean
 * }}
 */
function run(taggedChunks) {
  // Build source index from unique source tags
  const sourceMap = new Map();
  for (const chunk of taggedChunks) {
    if (!sourceMap.has(chunk.source)) {
      sourceMap.set(chunk.source, { source: chunk.source, inputType: chunk.inputType });
    }
  }

  const sourceIndex = Array.from(sourceMap.entries()).map(([, val], i) => ({
    num: i + 1,
    source: val.source,
    inputType: val.inputType,
  }));

  // Build source index header
  const sourceIndexHeader = [
    '=== SOURCE INDEX ===',
    ...sourceIndex.map((s) => `${s.source} [type: ${s.inputType}]`),
    '=== END SOURCE INDEX ===',
    '',
  ].join('\n');

  // Build content body — each chunk prefixed with its source tag and KPI flag if applicable
  const contentBody = taggedChunks
    .map((chunk) => {
      const kpiTag = chunk.kpiExplicit ? ' [KPI_EXPLICIT: true]' : '';
      return `${chunk.source}${kpiTag}\n${chunk.text}`;
    })
    .join('\n\n---\n\n');

  const masterContext = `${sourceIndexHeader}\n${contentBody}`;

  const hasExplicitKPIs = taggedChunks.some((c) => c.kpiExplicit);

  return {
    masterContext,
    sourceIndex,
    hasExplicitKPIs,
  };
}

module.exports = { run };
