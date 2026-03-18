require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const L0 = require('./pipeline/L0_profile_type');
const L1 = require('./pipeline/L1_input_validation');
const L2 = require('./pipeline/L2_extraction_tagging');
const L3 = require('./pipeline/L3_master_context');
const trackA = require('./pipeline/trackA_extraction');
const trackB = require('./pipeline/trackB_indicators');
const L6 = require('./pipeline/L6_anti_hallucination');
const L7 = require('./pipeline/L7_output_generator');
const L8 = require('./pipeline/L8_audit_trail');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer config — files saved to UPLOAD_DIR, keyed by field name
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safe);
  },
});
const upload = multer({ storage });
const uploadFields = [
  { name: 'pdf', maxCount: 10 },
  { name: 'word', maxCount: 10 },
  { name: 'excel', maxCount: 10 },
  { name: 'image', maxCount: 20 },
  { name: 'newsletter', maxCount: 10 },
];

// Serve frontend
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());

// POST /api/run — full pipeline L0→L8
app.post('/api/run', upload.fields(uploadFields), async (req, res) => {
  const sessionId = uuidv4();

  try {
    // L0 — profile type
    const l0 = L0.run();
    console.log(`[${sessionId}] L0: profile type = ${l0.profileType}`);

    // L1 — input validation and manifest
    const submission = {
      files: req.files || {},
      urls: {
        url_website:  req.body.url_website  || '',
        url_linkedin: req.body.url_linkedin || '',
        url_x:        req.body.url_x        || '',
        url_facebook: req.body.url_facebook || '',
        url_youtube:  req.body.url_youtube  || '',
        url_article:  req.body.url_article  || '',
      },
    };
    const manifest = L1.run(submission);
    console.log(`[${sessionId}] L1: present = ${manifest.present.join(', ')}`);

    if (manifest.errors.length > 0 && manifest.present.length === 0) {
      return res.status(400).json({ error: manifest.errors.join('; ') });
    }

    // Init audit trail
    L8.init(sessionId, { profileType: l0.profileType, manifest });

    // L2 — extraction and tagging
    const { taggedChunks, errors: l2Errors } = await L2.run(manifest);
    console.log(`[${sessionId}] L2: ${taggedChunks.length} chunks tagged`);
    if (l2Errors.length > 0) console.warn(`[${sessionId}] L2 errors:`, l2Errors);

    // L3 — master context
    const { masterContext, sourceIndex, hasExplicitKPIs } = L3.run(taggedChunks);
    console.log(`[${sessionId}] L3: master context built (${masterContext.length} chars)`);
    L8.recordMasterContext(sessionId, masterContext, sourceIndex);

    // Track A + Track B — run in parallel
    console.log(`[${sessionId}] Running Track A and Track B...`);
    const [trackAResult, trackBResult] = await Promise.all([
      trackA.run(masterContext),
      trackB.run(masterContext, hasExplicitKPIs),
    ]);

    L8.recordTrackA(sessionId, trackAResult);
    L8.recordTrackB(sessionId, trackBResult);

    console.log(`[${sessionId}] Track A complete. Track B KPI path: ${trackBResult.kpiPath}`);

    // L6 — anti-hallucination validator
    const validated = L6.run({
      sections: trackAResult.sections,
      indicators: trackBResult.indicators,
      kpis: trackBResult.kpis,
    }, masterContext);
    console.log(`[${sessionId}] L6: ${validated.report.hallucinations} hallucinations caught`);
    L8.recordValidation(sessionId, validated.report);

    // L7 — output generator
    const outputs = await L7.run(validated, sessionId, {
      profileType: l0.profileType,
      kpiPath: trackBResult.kpiPath,
      manifest,
    });
    console.log(`[${sessionId}] L7: outputs generated`);
    L8.recordOutputs(sessionId, outputs);

    return res.json({ sessionId, outputs, validationReport: validated.report });

  } catch (err) {
    console.error(`[${sessionId}] Pipeline error:`, err);
    return res.status(500).json({ error: err.message, sessionId });
  }
});

// POST /api/correction — append a correction from Vera
app.post('/api/correction', express.json(), (req, res) => {
  const { sessionId, fieldPath, originalValue, correctedValue, reason } = req.body;
  if (!sessionId || !fieldPath) return res.status(400).json({ error: 'sessionId and fieldPath required' });

  try {
    L8.recordCorrection(sessionId, { fieldPath, originalValue, correctedValue, reason });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/download — serve output files
app.get('/api/download', (req, res) => {
  const filePath = req.query.file;
  if (!filePath) return res.status(400).json({ error: 'file param required' });

  const absPath = path.resolve(filePath);
  const outputDir = path.resolve(process.env.OUTPUT_DIR || './outputs');

  // Security: only serve files from the outputs directory
  if (!absPath.startsWith(outputDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!fs.existsSync(absPath)) return res.status(404).json({ error: 'File not found' });
  res.download(absPath);
});

app.listen(PORT, () => {
  console.log(`CommonGround Profile Builder running at http://localhost:${PORT}`);
});
