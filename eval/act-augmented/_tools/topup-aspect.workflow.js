export const meta = {
  name: 'act-augment-topup-aspect',
  description: 'Regenerate ONE short aspect of an SC to >=5 valid human-judgment pages (construct -> adversarial verify -> self-refine repair -> score)',
  phases: [{ title: 'Construct' }, { title: 'Verify' }, { title: 'Finalize' }],
};

let A = args;
if (typeof A === 'string') { try { A = JSON.parse(A); } catch (e) {} }
const sc = A.sc, outDir = A.outDir, R = A.resource || {};
const toolDir = 'eval/act-augmented/_tools';
// aspect may be passed inline OR (robust path) just a slug; full spec is read from disk by the agent.
const aspect = A.aspect || { slug: A.aspectSlug };
if (!aspect || !aspect.slug) throw new Error('args.aspect.slug or args.aspectSlug required');
const N = Math.max(6, (aspect.suggestedScenarios || []).length);

const refBlock = `
REFERENCE DOCUMENTS for SC ${sc} ${R.title} (Level ${R.level}) — read with Read, quote verbatim:
- WCAG 2.2 Understanding: ${R.understanding || '(none)'}
- WCAG Techniques: files under wcag-techniques/<technology>/<ID>.html (failure F* techniques especially).
- EN 301 549 Annex C: ${R.enClauses} (anchor "${R.enClauseAnchor}")
- Trusted Tester: ${R.trustedTester || '(not covered by TT)'}
- Full inventory: ${outDir}/../_resources/${sc}.json
DIVERSITY SEEDS (one facet, not the backbone): ${outDir}/../_seeds/by-sc/${sc}.json + ${outDir}/../_seeds/facets.json`;

const CONSTRUCT_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['aspectSlug', 'pages'],
  properties: {
    aspectSlug: { type: 'string' },
    pages: { type: 'array', minItems: 6, items: {
      type: 'object', additionalProperties: false,
      required: ['id', 'file', 'docFile', 'scenario', 'expected', 'mechanism', 'primarySelector', 'whyAutomatedToolsMiss', 'citation'],
      properties: {
        id: { type: 'string' }, file: { type: 'string' }, docFile: { type: 'string' },
        scenario: { type: 'string' }, expected: { type: 'string', enum: ['failed', 'passed', 'inapplicable'] },
        mechanism: { type: 'string' }, primarySelector: { type: 'string' },
        whyAutomatedToolsMiss: { type: 'string' },
        citation: { type: 'object', additionalProperties: false, required: ['doc', 'quote'], properties: { doc: { type: 'string' }, quote: { type: 'string' } } },
      },
    } },
  },
};
const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['pageId', 'file', 'errorIsReal', 'expectedOutcomeCorrect', 'requiresHumanJudgment', 'browserConfirmed', 'severity', 'problems', 'recommendation'],
  properties: {
    pageId: { type: 'string' }, file: { type: 'string' },
    errorIsReal: { type: 'boolean' }, expectedOutcomeCorrect: { type: 'boolean' },
    requiresHumanJudgment: { type: 'boolean' }, browserConfirmed: { type: 'boolean' },
    cdpEvidence: { type: 'string' }, severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'none'] },
    problems: { type: 'array', items: { type: 'string' } }, recommendation: { type: 'string', enum: ['keep', 'fix', 'drop'] },
  },
};

function pageIsValid(pg, v) {
  if (!v) return false;
  const errOk = pg.expected !== 'failed' || v.errorIsReal === true;
  return v.recommendation === 'keep' && v.requiresHumanJudgment === true && v.expectedOutcomeCorrect === true && errOk;
}
function verifyThunk(pg) {
  return () => agent(
    `You are an ADVERSARIAL accessibility reviewer. Confirm or refute that ONE generated test page for WCAG SC ${sc} (${R.title}) genuinely demonstrates its documented HUMAN-JUDGMENT accessibility issue. Judge PRIMARILY by reading the code and reasoning against the WCAG/ACT/technique text.
PAGE: ${pg.file}\nDOC: ${pg.docFile}\nExpected outcome: ${pg.expected}\nSelector: ${pg.primarySelector || '(read from doc)'}
METHOD: (1) Read the .html + .md fully; reason about what the AX tree/AT user gets vs a sighted user. (2) Verify the citation quote is VERBATIM in the named reference file. (3) ASSESS AUTOMATED DETECTABILITY — if axe/WAVE/Lighthouse would catch it (e.g. a raw contrast ratio, an unrendered token, a missing attribute), set requiresHumanJudgment=false and recommend fix/drop; this corpus only wants issues needing human semantic/contextual/visual judgment. (4) Corroborate with: node ${toolDir}/inspect.js --file "${pg.file}" ${pg.primarySelector ? '--selector "' + String(pg.primarySelector).replace(/"/g, '\\"') + '"' : ''} --no-shots (raw Chromium AX tree + computed styles + tab order; no verdict). (5) Conclude. Default errorIsReal=false when uncertain. Recommend keep/fix/drop.`,
    { label: `verify:${pg.id}`, phase: 'Verify', schema: VERDICT_SCHEMA }
  ).then(v => (v ? { ...v, pageId: pg.id, file: pg.file, expected: pg.expected, docFile: pg.docFile } : null));
}

phase('Construct');
const built = await agent(
  `You are REBUILDING one UNDER-PERFORMING aspect of WCAG SC ${sc} (${R.title || ''}, Level ${R.level || ''}) so it reaches >=5 VALID human-judgment test pages. A previous run left this aspect short because some pages were auto-detectable or unverified.

ASPECT slug: ${aspect.slug}
FIRST read the FULL aspect spec from ${outDir}/result.json — find the entry in its "aspects" array whose slug === "${aspect.slug}" and use that object's title, description, scLimb, constructionStrategy, references, and suggestedScenarios as your brief. ${aspect.description ? 'Inline summary: ' + aspect.description : ''}
Why it was short: ${A.shortReason || 'some pages were catchable by automated tools or failed verification'}
${refBlock}

OVERWRITE the aspect's pages at ${outDir}/pages/${aspect.slug}/case-NN.html (NN=01..${String(N).padStart(2, '0')}) + sibling case-NN.md. Build exactly ${N} pages. HARD REQUIREMENTS:
- Each issue MUST require HUMAN semantic/contextual/visual judgment — NOT catchable by axe/WAVE/Lighthouse/validators. Avoid anything reducible to a measurable threshold, a missing/empty attribute, or an unrendered token. Escalate hardness (Evol-Instruct in-depth: add constraints, concretize, complicate) until only a human reasoning about meaning/context could catch it. State in each .md WHY automated tools miss it.
- Self-contained valid HTML5 (inline CSS/JS only, renders from file://). Each page a UNIQUE situation (vary domain, component, persona, mechanism). After writing, run \`node ${toolDir}/dupcheck.js ${outDir}/pages/${aspect.slug}\` and rewrite any pair scoring combined>=0.8.
- Each .md: scenario; attribute tuple + developer persona; element/selector; exact AT mechanism; expected outcome (failed/passed/inapplicable); why automated tools miss it; CITATION block with a VERBATIM quote from a reference file you Read.
Return the manifest.`,
  { label: `rebuild:${aspect.slug}`, phase: 'Construct', schema: CONSTRUCT_SCHEMA }
);

phase('Verify');
let verdicts = (await parallel(((built && built.pages) || []).map(pg => verifyThunk(pg)))).filter(Boolean);

// Self-refine repair on rejected pages
const byFile = {}; for (const v of verdicts) if (v && v.file) byFile[v.file] = v;
const pages = (built && built.pages) || [];
const failed = pages.filter(pg => !pageIsValid(pg, byFile[pg.file]));
if (failed.length) {
  log(`Repair: ${failed.length}/${pages.length} rejected`);
  await parallel(failed.map(pg => () => {
    const v = byFile[pg.file] || {};
    return agent(
      `REPAIR one rejected test page for SC ${sc} (${R.title}), aspect "${aspect.title}". Reviewer: rec=${v.recommendation}, requiresHumanJudgment=${v.requiresHumanJudgment}, expectedOutcomeCorrect=${v.expectedOutcomeCorrect}, errorIsReal=${v.errorIsReal}; problems=${JSON.stringify(v.problems || []).slice(0, 800)}.
FILE: ${pg.file}  DOC: ${pg.docFile}
${refBlock}
Rewrite both files so the defect is present-but-wrong and needs HUMAN judgment (NOT axe-detectable — if requiresHumanJudgment was false, change the mechanism entirely, do not just tweak), the page truly yields its documented outcome, the citation quote is VERBATIM from the named reference, it renders from file://, and it is distinct from sibling cases. Overwrite ${pg.file} and ${pg.docFile}. Report what changed.`,
      { label: `repair:${pg.id}`, phase: 'Verify' }
    );
  }));
  const re = (await parallel(failed.map(pg => verifyThunk(pg)))).filter(Boolean);
  for (const v of re) if (v && v.file) byFile[v.file] = v;
}

phase('Finalize');
const scored = pages.map(pg => {
  const v = byFile[pg.file];
  const valid = pageIsValid(pg, v);
  return { id: pg.id, file: pg.file, expected: pg.expected, status: valid ? 'valid' : (v && v.recommendation === 'drop' ? 'dropped' : 'needs-fix'),
    requiresHumanJudgment: v && v.requiresHumanJudgment, errorIsReal: v && v.errorIsReal, recommendation: v && v.recommendation, problems: (v && v.problems) || [] };
});
const validPageCount = scored.filter(p => p.status === 'valid').length;
log(`Top-up ${aspect.slug}: ${validPageCount}/${pages.length} valid`);
return { sc, aspectSlug: aspect.slug, validPageCount, pages: scored };
