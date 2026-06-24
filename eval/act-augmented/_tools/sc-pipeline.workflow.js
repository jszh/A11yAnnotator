export const meta = {
  name: 'act-augment-sc',
  description: 'For one WCAG SC: map ACT-test intent, reason about uncovered aspects (5 lenses), construct >=5 grounded test pages per aspect, adversarially CDP-verify, and judge into valid test cases',
  phases: [
    { title: 'Understand', detail: 'study each ACT rule + sample its test cases; survey corpus variety' },
    { title: 'Reason', detail: '5 independent lenses surface aspects of the SC the ACT tests miss' },
    { title: 'Synthesize', detail: 'judge merges reasonings into a deduplicated, prioritized aspect list' },
    { title: 'Construct', detail: 'per aspect, build >=5 distinct grounded test pages + docs' },
    { title: 'Verify', detail: 'per page, adversarial critique + real-browser CDP inspection' },
    { title: 'Finalize', detail: 'judge constructs the valid test-case set for the SC' },
  ],
};

// args may arrive as an object or (per runtime quirk) as a JSON string — normalize.
let A = args;
if (typeof A === 'string') { try { A = JSON.parse(A); } catch (e) { /* leave as-is */ } }
if (!A || typeof A !== 'object') throw new Error('Workflow args missing/unparseable; got type ' + typeof args);
const sc = A.sc;
const R = A.resource;
const outDir = A.outDir; // e.g. eval/act-augmented/1.1.1
const toolDir = 'eval/act-augmented/_tools';
if (!R || !R.title) throw new Error('args.resource missing. args keys=' + Object.keys(A).join(',') + ' resourceType=' + typeof R);

// ---- shared reference block handed to every doc-reading agent ----
const refBlock = `
REFERENCE DOCUMENTS for SC ${sc} ${R.title} (Level ${R.level}) — read with the Read tool, quote verbatim:
- WCAG 2.2 Understanding: ${R.understanding || '(none)'}
- WCAG Techniques (${R.techniqueCount}): see techniques[] in ${outDir}/../_resources/${sc}.json — files under wcag-techniques/<technology>/<ID>.html. Failure techniques (F*) are especially useful for constructing failing pages.
- EN 301 549 Annex C clause: ${R.enClauses} (anchor "${R.enClauseAnchor}")
- Trusted Tester v5.1.3: ${R.trustedTester || '(SC not covered by Trusted Tester — WCAG 2.1/AAA)'}
- WCAG "In Brief" + category framing: ${R.categoriesSource}
- The full machine-readable inventory for this SC (all ACT rule + test-case paths, all technique paths): ${outDir}/../_resources/${sc}.json`;

// ---- seed palette (ONE facet of diversity, NOT the backbone) handed to construction ----
const seedBlock = `
DIVERSITY SEED PALETTE — treat as ONE inspiration facet among many, NOT a checklist and NOT the primary driver. The SC text + lens reasoning + reference grounding stay primary. Use these to vary scenarios across realistic platforms/components/contexts, and DELIBERATELY also invent situations BEYOND anything listed here (novel hand-coded, framework, edge-case):
- Real-world inaccessibility patterns mined for THIS SC (website builders, CMS, frameworks, APG components, audit/lawsuit findings, ARIA anti-patterns), with grounded markup + sources: ${outDir}/../_seeds/by-sc/${sc}.json
- Cross-cutting facet palette (content domains, APG component list, ARIA anti-patterns, visual-only conveyance, content-authoring sources, dynamic-state, i18n, AT behaviors): ${outDir}/../_seeds/facets.json
Sampling guidance: for each page draw a DIFFERENT small combination (e.g. one content domain + one component/anti-pattern + one failure mechanism) so cases spread combinatorially rather than clustering. Do NOT let every page be a website-builder default — that is just one facet.`;

// deterministic sampler (no Math.random in workflows): stride across an array
function sample(arr, n) {
  if (!arr || arr.length <= n) return arr || [];
  const step = arr.length / n, out = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]);
  return out;
}

// ================= Phase 1: Understand existing ACT coverage =================
phase('Understand');

const RULE_INTENT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['ruleId', 'intent', 'scLimb', 'applicability', 'expectation', 'scenarioTypesPresent', 'syntheticNarrowness'],
  properties: {
    ruleId: { type: 'string' },
    intent: { type: 'string', description: 'what this rule actually checks, in plain language' },
    scLimb: { type: 'string', description: 'which specific limb/clause of the SC this rule exercises' },
    applicability: { type: 'string' },
    expectation: { type: 'string' },
    scenarioTypesPresent: { type: 'array', items: { type: 'string' }, description: 'distinct situations the rule\'s test cases actually cover' },
    syntheticNarrowness: { type: 'array', items: { type: 'string' }, description: 'ways the test cases are minimal/synthetic and miss real-world variety' },
  },
};

const ruleAgents = sample(R.actRules || [], 8).map((rule) => {
  const caseSample = sample((R.testCases || []).filter(c => c.ruleId === rule.id), 6)
    .map(c => `  - ${c.expected}: eval/checker-comparison/act-subset/${c.localPath}`).join('\n');
  return () => agent(
    `You are mapping the INTENT of one W3C ACT rule and its test cases for WCAG SC ${sc} (${R.title}).
ACT rule ${rule.id} "${rule.name}" (status: ${rule.status}). Extracted rule text: ${rule.extracted}
${rule.notFullyAutomatable ? 'NOTE: this rule is flagged not-fully-automatable.\n' : ''}
Read the extracted rule, then read these representative test cases (they are tiny synthetic HTML pages):
${caseSample || '  (no local test cases for this rule)'}

Determine: (1) what the rule actually checks, (2) which precise limb of SC ${sc} it exercises, (3) its applicability and expectation, (4) the distinct scenario types its test cases cover, and (5) concrete ways the test cases are synthetic/narrow and therefore MISS real-world variety of this SC. Be specific and grounded in what you read.`,
    { label: `rule:${rule.id}`, phase: 'Understand', schema: RULE_INTENT_SCHEMA }
  );
});

const CORPUS_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['scLimbsCoveredByACT', 'scLimbsAbsentFromACT', 'contentDomainsPresent', 'varietyGaps'],
  properties: {
    scLimbsCoveredByACT: { type: 'array', items: { type: 'string' } },
    scLimbsAbsentFromACT: { type: 'array', items: { type: 'string' }, description: 'parts of the SC text that NO ACT rule/test addresses at all' },
    contentDomainsPresent: { type: 'array', items: { type: 'string' }, description: 'e.g. plain text, forms, tables, media, SVG, canvas' },
    varietyGaps: { type: 'array', items: { type: 'string' } },
  },
};
const corpusAgent = () => agent(
  `You are surveying the WHOLE ACT test corpus for WCAG SC ${sc} (${R.title}, Level ${R.level}) to characterize its variety.
This SC has ${R.actRuleCount} in-scope ACT rules and ${R.testCaseCount} local test cases (by outcome: ${JSON.stringify(R.testCaseCountsByExpected)}).
${refBlock}
First READ the full SC text in the Understanding doc and the EN/Trusted-Tester procedures to learn the SC's full intent and every limb it requires. Then sample test cases across rules (paths in the _resources/${sc}.json inventory).
Report: which limbs of the SC the ACT corpus DOES cover, which limbs of the SC text are ENTIRELY ABSENT from the ACT corpus, what content domains/UI patterns appear, and the biggest variety gaps. Ground every claim in the SC text.`,
  { label: 'corpus-survey', phase: 'Understand', schema: CORPUS_SCHEMA }
);

const understand = await parallel([...ruleAgents, corpusAgent]);
const ruleIntents = understand.slice(0, ruleAgents.length).filter(Boolean);
const corpusSurvey = understand[understand.length - 1] || { scLimbsCoveredByACT: [], scLimbsAbsentFromACT: [], contentDomainsPresent: [], varietyGaps: [] };
const intentMap = { sc, title: R.title, level: R.level, ruleIntents, corpusSurvey };
log(`Understand: ${ruleIntents.length} rules mapped; ${corpusSurvey.scLimbsAbsentFromACT.length} absent limbs flagged`);

// ================= Phase 2: (docs already resolved in _resources) =================

// ================= Phase 3: 5 independent reasoning lenses =================
phase('Reason');

const LENSES = [
  { key: 'failure-techniques', focus: 'Anchor on the WCAG **Failure techniques (F*)** and **Sufficient techniques** for this SC. Each documented failure mode that the ACT tests do not exercise is a candidate uncovered aspect.' },
  { key: 'real-world-ui', focus: 'Anchor on **real-world UI/component patterns** (production websites, design systems, frameworks): the messy, composite, dynamic situations that synthetic single-element ACT pages never reproduce.' },
  { key: 'edge-and-host-language', focus: 'Anchor on **edge cases, host-language constructs, and ARIA/host combinations**: unusual but valid HTML/SVG/ARIA/shadow-DOM/CSS situations, boundary conditions, and the exact applicability edges the SC text implies.' },
  { key: 'procedural-tt-en', focus: 'Anchor on the **Trusted Tester test steps and EN 301 549 procedure**: each manual check/condition those processes require that the ACT tests do not, plus inapplicability/precondition boundaries.' },
  { key: 'content-modality', focus: 'Anchor on **content type and modality diversity**: text vs forms vs tables vs media vs graphics vs interactive widgets vs internationalized content — situations of the SC arising in content domains the ACT corpus omits.' },
];

const REASONING_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['lens', 'uncoveredAspects'],
  properties: {
    lens: { type: 'string' },
    uncoveredAspects: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['title', 'description', 'whyACTmisses', 'references', 'constructionIdeas'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string', description: 'the aspect of the SC and the specific situation(s) it covers' },
          whyACTmisses: { type: 'string', description: 'why the existing ACT rules/test cases do not exercise this' },
          references: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['doc', 'quote'], properties: { doc: { type: 'string' }, quote: { type: 'string', description: 'verbatim quote from the named reference grounding this aspect' } } } },
          constructionIdeas: { type: 'array', items: { type: 'string' }, description: '>=5 distinct concrete page situations that would test this aspect' },
        },
      },
    },
  },
};

const reasoningRaw = await parallel(LENSES.map((lens) => () => agent(
  `You are reasoning INDEPENDENTLY about what aspects of WCAG SC ${sc} (${R.title}, Level ${R.level}) the existing W3C ACT test cases FAIL to cover.

WHAT THE ACT TESTS ALREADY COVER (do NOT re-propose these):
${JSON.stringify(intentMap, null, 1).slice(0, 6000)}

YOUR LENS — ${lens.key}: ${lens.focus}
${refBlock}

CRITICAL TARGETING RULE: We are NOT interested in failures that a fully-automated checker (axe-core, WAVE, Lighthouse, HTML validators) can already detect — those are trivial and already well-represented by the synthetic ACT tests. Prioritize aspects/situations of this SC that require HUMAN semantic, contextual, or visual judgment to evaluate — the things only a person reasoning about meaning/context/intent can catch. (e.g. a title that is non-empty but not descriptive of the page; an alt that exists but misrepresents the image; a label that is present but ambiguous in context.)

TASK: Read the references for this SC, then through your lens identify the aspects/situations of SC ${sc} that the ACT corpus does NOT exercise AND that resist automated detection. For each uncovered aspect: name it, describe the situation precisely, explain why the ACT tests miss it and why automated tools cannot catch it, ground it in verbatim quotes from the references (Understanding / Techniques / EN / Trusted Tester), and list >=5 concrete and DISTINCT page situations that would test it. Favour aspects testable on a single self-contained HTML page. Be rigorous and specific; do not invent requirements the SC does not impose.`,
  { label: `lens:${lens.key}`, phase: 'Reason', schema: REASONING_SCHEMA }
)));
const reasonings = reasoningRaw.filter(Boolean);
log(`Reason: ${reasonings.length} lenses returned ${reasonings.reduce((n, r) => n + (r.uncoveredAspects || []).length, 0)} candidate aspects`);

// ================= Phase 4: Synthesize aspect list =================
phase('Synthesize');

const ASPECTS_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['aspects'],
  properties: {
    aspects: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['slug', 'title', 'description', 'scLimb', 'whyUncovered', 'priority', 'references', 'constructionStrategy', 'suggestedScenarios'],
        properties: {
          slug: { type: 'string', description: 'kebab-case, unique within this SC' },
          title: { type: 'string' },
          description: { type: 'string' },
          scLimb: { type: 'string' },
          whyUncovered: { type: 'string' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          references: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['doc', 'quote'], properties: { doc: { type: 'string' }, quote: { type: 'string' } } } },
          constructionStrategy: { type: 'string' },
          suggestedScenarios: { type: 'array', minItems: 5, items: { type: 'string' }, description: 'at least 5 DISTINCT page situations, each becomes one test page' },
        },
      },
    },
  },
};

// retry a single-agent stage on null (terminal API failure returns null, not throw)
async function withRetry(fn, n) {
  let last = null;
  for (let i = 0; i < (n || 3); i++) { last = await fn(); if (last) return last; }
  return last;
}
const synth = await withRetry(() => agent(
  `You are the SYNTHESIS judge for WCAG SC ${sc} (${R.title}). Five independent agents proposed aspects of this SC that the W3C ACT tests do not cover. Merge them into ONE deduplicated, validated, prioritized list of genuinely-uncovered aspects.

WHAT ACT ALREADY COVERS:
${JSON.stringify(intentMap, null, 1).slice(0, 5000)}

THE FIVE INDEPENDENT REASONINGS:
${JSON.stringify(reasonings, null, 1).slice(0, 18000)}
${refBlock}

RULES:
- Merge duplicates/overlaps across lenses into single coherent aspects.
- DROP anything the ACT tests already cover, anything not actually required by SC ${sc}, anything not testable on a self-contained HTML page (e.g. multi-page, media playback), AND anything a fully-automated checker (axe-core/WAVE/Lighthouse) can already reliably detect — we only want aspects that require HUMAN semantic/contextual/visual judgment.
- KEEP each aspect grounded: carry forward the strongest verbatim reference quote(s).
- Give each aspect a unique kebab-case slug and >=5 distinct suggestedScenarios (each will become one test page).
- Aim for 5-8 high-value aspects (NEVER fewer than 5) that together give BROAD coverage of the SC's uncovered space — distinct limbs/mechanisms, not variations of one idea. Do not pad with shallow duplicates; if the SC genuinely supports more than 8 strong aspects, include them. Order by priority (high first).`,
  { label: 'synthesize', phase: 'Synthesize', schema: ASPECTS_SCHEMA }
));
if (!synth || !synth.aspects || !synth.aspects.length) {
  throw new Error(`Synthesize produced no aspects for ${sc} (likely upstream agent failure / session limit). Re-run this SC.`);
}
const aspects = synth.aspects;
log(`Synthesize: ${aspects.length} uncovered aspects finalized`);

// ================= Phase 5+6: Construct pages, then adversarially verify =================
const CONSTRUCT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['aspectSlug', 'pages'],
  properties: {
    aspectSlug: { type: 'string' },
    pages: {
      type: 'array', minItems: 5,
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'file', 'docFile', 'scenario', 'expected', 'mechanism', 'primarySelector', 'whyAutomatedToolsMiss', 'citation'],
        properties: {
          id: { type: 'string' },
          file: { type: 'string', description: 'repo-relative path to the .html written' },
          docFile: { type: 'string', description: 'repo-relative path to the .md written' },
          scenario: { type: 'string' },
          expected: { type: 'string', enum: ['failed', 'passed', 'inapplicable'] },
          mechanism: { type: 'string', description: 'the precise accessibility mechanism that makes this fail/pass' },
          primarySelector: { type: 'string', description: 'CSS selector of the element the issue is on (for inspection)' },
          whyAutomatedToolsMiss: { type: 'string', description: 'why axe/WAVE/Lighthouse cannot detect this — what human judgment is required' },
          citation: { type: 'object', additionalProperties: false, required: ['doc', 'quote'], properties: { doc: { type: 'string' }, quote: { type: 'string' } } },
        },
      },
    },
  },
};

const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['pageId', 'file', 'errorIsReal', 'expectedOutcomeCorrect', 'requiresHumanJudgment', 'browserConfirmed', 'severity', 'problems', 'recommendation'],
  properties: {
    pageId: { type: 'string' },
    file: { type: 'string' },
    errorIsReal: { type: 'boolean', description: 'does the claimed accessibility issue genuinely exist on the page (judged from the code + reasoning)' },
    expectedOutcomeCorrect: { type: 'boolean', description: 'does the page truly produce the documented expected outcome (failed/passed/inapplicable)' },
    requiresHumanJudgment: { type: 'boolean', description: 'TRUE if the issue genuinely needs human semantic/contextual/visual judgment; FALSE if a fully-automated checker would catch it (which makes the case low-value here)' },
    browserConfirmed: { type: 'boolean', description: 'did the raw browser signals (Chromium AX tree, computed styles, tab order) corroborate the reasoning' },
    cdpEvidence: { type: 'string', description: 'specific code lines + raw signals that drove the verdict' },
    severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'none'] },
    problems: { type: 'array', items: { type: 'string' } },
    recommendation: { type: 'string', enum: ['keep', 'fix', 'drop'] },
  },
};

// Deterministic per-page validity (shared by the repair stage and finalize):
// valid := keep + requiresHumanJudgment + expectedOutcomeCorrect, and for a "failed"
// page also errorIsReal. A passed/inapplicable control legitimately has errorIsReal=false.
function pageIsValid(pg, v) {
  if (!v) return false;
  const errOk = pg.expected !== 'failed' || v.errorIsReal === true;
  return v.recommendation === 'keep' && v.requiresHumanJudgment === true && v.expectedOutcomeCorrect === true && errOk;
}

// Build one adversarial-verify thunk for a single page (CODE READING + REASONING first).
function verifyThunk(pg) {
  return () => agent(
    `You are an ADVERSARIAL accessibility reviewer. Scrutinize ONE generated test page for WCAG SC ${sc} (${R.title}) and confirm — or refute — that its documented accessibility issue is real. Your judgment must come PRIMARILY FROM READING THE CODE AND REASONING about it against the WCAG/ACT/technique definitions — not from any single tool.

PAGE: ${pg.file}
DOC:  ${pg.docFile}
Claimed scenario: ${pg.scenario}
Claimed expected outcome: ${pg.expected}
Claimed mechanism: ${pg.mechanism}
Element under test (selector): ${pg.primarySelector}
Claimed citation: ${pg.citation ? pg.citation.doc : '(none)'} — "${pg.citation ? pg.citation.quote : ''}"

METHOD (in this order of authority):
1. READ the .html source in full and the .md doc. Trace, by reasoning, exactly what the HTML/CSS/JS does: what the accessibility tree WILL contain, what an AT user will perceive, what the keyboard/focus behavior is. Decide from first principles whether the claimed mechanism is sound and whether the page truly yields the documented outcome (failed/passed/inapplicable) under the SC's definition. Your verdict is primarily a REASONING judgment over the source — not a tool output.
2. VERIFY THE CITATION RIGOROUSLY (highest hallucination risk): open the named reference FILE and confirm the quoted sentence appears VERBATIM (character-for-character, allowing only whitespace differences) and that it actually supports the claim. A quote that is paraphrased, stitched from non-adjacent fragments, attributed to the wrong document, or irrelevant to the mechanism is a DEFECT — set expectedOutcomeCorrect appropriately and record it in problems.
3. ASSESS AUTOMATED DETECTABILITY: this corpus only wants issues that require HUMAN judgment. Reason about whether a fully-automated checker (axe-core/WAVE/Lighthouse/validators) would already flag this. If the failure is just a missing/empty attribute or other lint-catchable defect, set requiresHumanJudgment=false and recommend fix or drop — it is too trivial to belong here.
4. CORROBORATE with raw browser signals — run:
   node ${toolDir}/inspect.js --file "${pg.file}" --selector "${(pg.primarySelector || '').replace(/"/g, '\\"')}" --no-shots
   This tool asserts NO verdict; it surfaces raw signals only — Chromium's own accessibility tree (authoritative for what AT receives as name/role/value), the tab-order, raw computed styles, lang/title. Use these to confirm what the AT actually receives vs. what a sighted user perceives. If a signal contradicts your reasoning, investigate the code; do not blindly trust either. (You may write a short puppeteer/node snippet for any signal the tool doesn't give.)
5. CONCLUDE: does the claimed issue GENUINELY exist? Is the outcome label correct? Is the page self-contained and rendering (no JS errors, no external resources)? Is it meaningfully distinct from a toy stub and from the other cases?
Be skeptical — default to errorIsReal=false / expectedOutcomeCorrect=false when reasoning and signals do not clearly agree. In cdpEvidence, cite the specific code lines and raw signals that drove your verdict. Recommend keep / fix / drop.`,
    { label: `verify:${pg.id}`, phase: 'Verify', schema: VERDICT_SCHEMA }
  ).then(v => (v ? { ...v, pageId: pg.id, file: pg.file, expected: pg.expected, docFile: pg.docFile } : null));
}

phase('Construct');
const perAspect = await pipeline(
  aspects,
  // STAGE 1: construct >=5 pages for the aspect
  (aspect) => agent(
    `You are constructing test pages for an UNCOVERED aspect of WCAG SC ${sc} (${R.title}, Level ${R.level}).

ASPECT "${aspect.title}" (slug: ${aspect.slug})
Description: ${aspect.description}
SC limb: ${aspect.scLimb}
Why uncovered by ACT: ${aspect.whyUncovered}
Construction strategy: ${aspect.constructionStrategy}
Suggested distinct scenarios (use these as a starting point, make each page genuinely different):
${(aspect.suggestedScenarios || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n')}
${refBlock}
${seedBlock}

PROCEDURE — follow these research-backed steps (Verbalized Sampling 2510.01171; AttrPrompt NeurIPS'23; Evol-Instruct/WizardLM ICLR'24; Self-Instruct ACL'23):
STEP 1 — VERBALIZED SAMPLING (anti mode-collapse): before writing anything, BRAINSTORM ~12-15 candidate scenarios for this aspect and, for each, estimate how COMMON it is in the wild (head / mid / long-tail). Then DELIBERATELY select ${Math.max(5, (aspect.suggestedScenarios || []).length)} that spread ACROSS the distribution — include head cases AND at least one or two genuinely rare long-tail variations. Do not just take the most obvious ones.
STEP 2 — ATTRIBUTE + PERSONA CONDITIONING: give every selected page a DISTINCT attribute tuple {content-domain, UI-component/pattern, host-language construct, locale/i18n, failure-mechanism} drawn variedly (no two pages share the same tuple), AND a short DEVELOPER PERSONA explaining HOW the mistake realistically arose (e.g. "junior dev pasted a Stack Overflow snippet", "designer used a Webflow interaction", "agency themed Shopify Dawn", "CMS author left demo content"). Vary the persona across pages. This realism is the point — ground combinations in the seed palette but invent beyond it.
STEP 3 — HARDNESS ESCALATION (Evol-Instruct in-depth): each page's issue MUST sit at the human-judgment boundary. If a draft would be caught by axe/WAVE/Lighthouse, apply in-depth operations — add constraints, deepen, concretize (replace generic with specific real content), increase the reasoning steps needed, complicate the markup — until ONLY a human reasoning about meaning/context/visuals could catch it. The defect must be present-but-wrong, not absent.

BUILD exactly ${Math.max(5, (aspect.suggestedScenarios || []).length)} test pages — one per selected scenario. Requirements:
- Each page is a SELF-CONTAINED, valid HTML5 document (inline CSS/JS only — NO external network resources, so it renders from file://). Use realistic, varied content and sound markup; apply real software-engineering patterns (semantic structure, realistic forms/widgets) rather than toy stubs.
- CRITICAL: the accessibility issue on each page must be one that AUTOMATED checkers (axe-core, WAVE, Lighthouse) CANNOT reliably detect — it must require human semantic/contextual/visual judgment. Do NOT build pages whose failure is a missing/empty attribute that a linter catches (e.g. empty <title>, missing alt). The markup must be technically well-formed and pass naive automated checks while still failing the SC for a human/AT user (present-but-non-descriptive, present-but-misleading, contextually-ambiguous, visually-but-not-programmatically conveyed). State in each page's doc WHY automated tools would miss it.
- DIVERSITY GATE (Self-Instruct dedup): the ${Math.max(5, (aspect.suggestedScenarios || []).length)} pages must be mutually distinct in BOTH prose and DOM structure. After writing them, run \`node ${toolDir}/dupcheck.js ${outDir}/pages/${aspect.slug}\` and if any pair reports combined >= 0.8, REWRITE the more generic page (different domain/component/persona) until the max combined score is below 0.8.
- Most pages should DEMONSTRATE the failure (expected: "failed"); include a passed/inapplicable boundary variant only where it sharpens the aspect.
- Write each page to: ${outDir}/pages/${aspect.slug}/case-NN.html  (NN = 01..)
- Write a sibling doc ${outDir}/pages/${aspect.slug}/case-NN.md per page containing: the scenario; the attribute tuple + developer persona; which element/selector carries the issue; the EXACT accessibility mechanism (what AT experiences and why it fails/passes); the expected ACT-style outcome (failed/passed/inapplicable); WHY automated tools miss it; and a CITATION block with the reference name + a VERBATIM quote (copied exactly from a file you Read — Understanding / Techniques / EN / Trusted Tester) that grounds the issue.
- Make the issue genuinely present in the DOM/CSS (so a browser + AT would really experience it) — do not fake it with comments.

Return the manifest of pages you wrote.`,
    { label: `build:${aspect.slug}`, phase: 'Construct', schema: CONSTRUCT_SCHEMA }
  ),
  // STAGE 2: adversarially verify every page — CODE READING + REASONING first (see verifyThunk).
  (built, aspect) => parallel(((built && built.pages) || []).map((pg) => verifyThunk(pg)))
    .then(verdicts => ({ aspect: aspect.slug, built, verdicts: (verdicts || []).filter(Boolean) })),
  // STAGE 3: SELF-REFINE repair loop (Self-Refine 2303.17651; N-CRITICS) — regenerate ONLY the
  // pages the adversary rejected (not valid), then re-verify just those; merge verdicts by file.
  async (vr, aspect) => {
    if (!vr) return vr;
    const byFile = {}; for (const v of (vr.verdicts || [])) if (v && v.file) byFile[v.file] = v;
    const pages = ((vr.built && vr.built.pages) || []);
    const failed = pages.filter(pg => !pageIsValid(pg, byFile[pg.file]));
    if (!failed.length) return vr;
    log(`Repair[${aspect.slug}]: regenerating ${failed.length}/${pages.length} rejected page(s)`);
    await parallel(failed.map(pg => () => {
      const v = byFile[pg.file] || {};
      return agent(
        `You are REPAIRING one generated test page that an adversarial reviewer REJECTED, for WCAG SC ${sc} (${R.title}). Fix it IN PLACE so it becomes a valid HUMAN-JUDGMENT test case, or replace its scenario entirely if the concept was unsalvageable.

FILE: ${pg.file}   DOC: ${pg.docFile}
Aspect: ${aspect.title} — ${aspect.scLimb}
Reviewer recommendation: ${v.recommendation || 'n/a'}; requiresHumanJudgment=${v.requiresHumanJudgment}; expectedOutcomeCorrect=${v.expectedOutcomeCorrect}; errorIsReal=${v.errorIsReal}
Reviewer problems: ${JSON.stringify(v.problems || []).slice(0, 1200)}
${refBlock}
${seedBlock}

Read the current file + doc, then REWRITE both so that: (1) the defect is present-but-wrong and requires HUMAN semantic/contextual/visual judgment (NOT catchable by axe/WAVE/Lighthouse — if the reviewer said requiresHumanJudgment=false, escalate hardness via Evol-Instruct in-depth operations); (2) the page truly yields its documented outcome; (3) the citation quote is VERBATIM from the named reference (re-open and copy exactly); (4) it is self-contained and renders from file://; (5) it is distinct from the aspect's other cases (run \`node ${toolDir}/dupcheck.js ${outDir}/pages/${aspect.slug}\` if unsure). Overwrite ${pg.file} and ${pg.docFile}. Briefly report what you changed.`,
        { label: `repair:${pg.id}`, phase: 'Verify' }
      );
    }));
    // re-verify the repaired pages and replace their verdicts
    const reverified = (await parallel(failed.map(pg => verifyThunk(pg)))).filter(Boolean);
    for (const v of reverified) if (v && v.file) byFile[v.file] = v;
    return { aspect: aspect.slug, built: vr.built, verdicts: pages.map(pg => byFile[pg.file]).filter(Boolean) };
  }
);

const aspectResults = (perAspect || []).filter(Boolean);
log(`Construct+Verify+Repair: ${aspectResults.length} aspects built; ${aspectResults.reduce((n, a) => n + (a.verdicts || []).length, 0)} pages verified`);

// ================= Phase 7: Finalize =================
phase('Finalize');
// DETERMINISTIC scoring (no LLM string-matching). Correlate each built page to its
// verdict by the authoritative stamped `file`, and decide validity in JS:
//  valid := recommendation==='keep' AND requiresHumanJudgment===true AND expectedOutcomeCorrect===true
//  (a "passed"/"inapplicable" control legitimately has errorIsReal=false, so errorIsReal
//   is only required when the page's expected outcome is "failed").
function scorePage(pg, v) {
  if (!v) return { id: pg.id, file: pg.file, expected: pg.expected, status: 'needs-fix', severity: 'none', reason: 'no verdict returned' };
  const status = pageIsValid(pg, v) ? 'valid' : (v.recommendation === 'drop' ? 'dropped' : 'needs-fix');
  return {
    id: pg.id, file: pg.file, expected: pg.expected, status,
    severity: v.severity, requiresHumanJudgment: v.requiresHumanJudgment,
    errorIsReal: v.errorIsReal, expectedOutcomeCorrect: v.expectedOutcomeCorrect,
    recommendation: v.recommendation, problems: v.problems || [],
  };
}
const aspectsFinalized = aspectResults.map((ar) => {
  const byFile = {};
  for (const v of (ar.verdicts || [])) if (v && v.file) byFile[v.file] = v;
  const pages = ((ar.built && ar.built.pages) || []).map((pg) => scorePage(pg, byFile[pg.file]));
  return { slug: ar.aspect, validPageCount: pages.filter(p => p.status === 'valid').length, pages };
});
const allAspectsHave5ValidPages = aspectsFinalized.length > 0 && aspectsFinalized.every(a => a.validPageCount >= 5);
log(`Finalize: ${aspectsFinalized.reduce((n, a) => n + a.validPageCount, 0)} valid pages across ${aspectsFinalized.length} aspects; allHave5=${allAspectsHave5ValidPages}`);

// A light narrative-only agent (it does NOT score — scoring is the JS above) that ALSO
// persists the SC's bookkeeping to disk, so an autonomous batch run records itself.
const finalReport = { sc, title: R.title, level: R.level, allAspectsHave5ValidPages, aspectsFinalized };
const summaryJson = JSON.stringify(finalReport);
const aspectTable = aspectsFinalized.map(a => `| ${a.slug} | ${a.validPageCount} | ${a.pages.map(p => p.status).join(', ')} |`).join('\n');
const summary = await agent(
  `You are writing the README for the WCAG SC ${sc} (${R.title}, Level ${R.level}) augmented test corpus, and persisting bookkeeping. Scoring is already done deterministically — do NOT recompute it.

UNCOVERED ASPECTS: ${JSON.stringify(aspects.map(a => ({ slug: a.slug, title: a.title, scLimb: a.scLimb })), null, 0).slice(0, 6000)}
FINAL TALLY (authoritative): ${JSON.stringify(aspectsFinalized.map(a => ({ slug: a.slug, valid: a.validPageCount, statuses: a.pages.map(p => p.status) })), null, 0).slice(0, 5000)}

DO TWO THINGS with the Write tool:
1. Write ${outDir}/summary.json with EXACTLY this JSON (verbatim, do not alter):
${summaryJson}
2. Write ${outDir}/README.md containing: an H1 "SC ${sc} ${R.title} — augmented test corpus"; 1-2 prose paragraphs on what aspects of SC ${sc} the ACT tests miss and what this corpus now covers (note any aspect still short of 5 valid human-judgment pages); then this table:

| aspect | valid pages | page statuses |
|---|---|---|
${aspectTable}

Return a one-line confirmation.`,
  { label: 'persist+summarize', phase: 'Finalize' }
);

return { sc, intentMap, aspects, aspectResults, finalReport: { ...finalReport, summary } };
