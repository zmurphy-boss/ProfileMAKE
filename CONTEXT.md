I am building the CommonGround AI Profile Builder for Vera. CommonGround (CG) is a platform that connects social impact organisations with funders and grant-makers. Here is the full context:
Where we are:
We have completed the Stage 1.5 architecture (Draft 4 — final). We are about to begin building. A Wednesday dev call with Anurag will confirm the CG database schema, full profile section list, and field constraints — after which db.config.js and profile_sections.config.js can be populated.
The architecture — Stage 1.5 Hybrid:
The pipeline has 8 layers and two parallel extraction tracks:

L0 — Profile Type Layer. Loads profile_type.config.js and profile_type.skill. Set to Funder for Stage 1.5.
L1 — Input Validation Gate. Checks which inputs Vera has submitted (PDFs, Word, Excel, images, newsletters, and named URL fields for Website, LinkedIn, X, Facebook, YouTube, articles). Builds a manifest. Skips absent input types entirely.
L2 — Extraction & Tagging. Each input routed to its dedicated handler. All content tagged [SOURCE_N: filename, location] before any LLM sees it. KPI pre-tagging happens here — explicit KPIs in source material tagged [KPI_EXPLICIT: true] mechanically.
L3 — Master Context Builder. All tagged chunks compiled into one master context document with a source index. This is the only input to all LLM calls.
Track A — Single LLM call. Extracts all standard sections simultaneously: Basic Information, Mission, Focus Areas, Objectives, Impact Stories, People, Multimedia, Newsletters. Anti-hallucination enforced at prompt level — INFO_MISSING if not found, never guess. Confidence scoring (High/Medium/Low). Conflict resolution via config rules or human flag.
Track B — One script, two LLM calls. Handles Indicators, Results, and KPIs as one unified data structure. Step 1 extracts all indicators. Step 2 runs KPI Selection Skill — Path 1 if explicit KPIs found in source, Path 2 if not (AI selects using mission + professional KPI criteria, produces Confident KPIs list and Uncertain KPIs list). Step 3 is a human review gate.
L6 — Anti-Hallucination Validator. Cross-checks every field against master context. Second line of defence after prompts.
L7 — Output Generator. Three outputs: narrative document (text sections + corrections column + DB schema TBC placeholders), structured spreadsheet (quantitative sections + same columns), pipeline run summary.
L8 — Session Audit Trail. Full run logged. Corrections column is a first-class feature — Vera logs every override, building a prompt improvement dataset across 12 profiles.

Config and Skill files:
profile_sections.config.js, profile_type.config.js, profile_type.skill, input_types.config.js, conflict_resolution.config.js, confidence_thresholds.config.js, human_review_triggers.config.js, kpi_selection.skill, kpi_selection_criteria.config.js, output_format.config.js, db.config.js
Existing codebase: None — this is a greenfield project. Do not reference or import anything from a previous codebase.
Tech stack:

Node.js + Express — backend server
Plain HTML/CSS/JS — frontend (no frameworks)
OpenAI API — LLM calls (GPT-4)
pdf2json — PDF extraction
mammoth — Word document extraction
SheetJS — Excel extraction
Puppeteer — URL and social media scraping
sharp or multer — image handling and file uploads
dotenv — environment variables