#!/usr/bin/env node
/**
 * build-manifest.js — assemble the annotation manifest for the act-augmented
 * dataset annotator.
 *
 * Reads every eval/act-augmented/<sc>/result.json, flattens it into a compact
 * per-SC / per-aspect / per-page structure the browser tool can consume, and
 * merges the hand-authored CS-undergrad "plain English" sentences from
 * ./plain-english/<sc>.json (one sentence per aspect slug).
 *
 * Trusted-Tester methodology text is NOT embedded here (refs/ is un-tracked and
 * must not be published); the manifest only records the relative path to the
 * per-SC markdown so the browser fetches it live from the local server.
 *
 *   node eval/act-augmented/_annotator/build-manifest.js
 *   -> writes eval/act-augmented/_annotator/manifest.json
 */
const fs = require('fs');
const path = require('path');

const ANNOTATOR_DIR = __dirname;                                  // .../_annotator
const AUG_DIR = path.resolve(ANNOTATOR_DIR, '..');                // .../act-augmented
const REPO_ROOT = path.resolve(AUG_DIR, '..', '..');              // repo root
const PE_DIR = path.join(ANNOTATOR_DIR, 'plain-english');
const TT_DIR = path.join(REPO_ROOT, 'refs', 'trusted-tester');

// SCs known to have NO Trusted-Tester baseline (WCAG 2.1 / AAA). Shown with an
// EN 301 549 pointer instead. (Per refs/trusted-tester/README.md.)
const NO_TT = {
  '1.4.10': 'Reflow — WCAG 2.1 AA, post-dates Section 508 / WCAG 2.0; no Trusted Tester test.',
  '1.4.11': 'Non-text Contrast — WCAG 2.1 AA; no Trusted Tester test.',
  '1.4.13': 'Content on Hover or Focus — WCAG 2.1 AA; no Trusted Tester test.',
  '2.4.10': 'Section Headings — WCAG 2.0 AAA, out of Section 508 A/AA scope; no Trusted Tester test.',
  '4.1.3': 'Status Messages — WCAG 2.1 AA; no Trusted Tester test.',
};

// SC -> WCAG "Understanding" doc (served from /wcag-understanding/). Shown as the
// methodology for SCs that have no Trusted Tester baseline.
const UNDERSTANDING = {
  '1.1.1': 'non-text-content', '1.3.1': 'info-and-relationships', '1.3.2': 'meaningful-sequence',
  '1.4.1': 'use-of-color', '1.4.3': 'contrast-minimum', '1.4.5': 'images-of-text',
  '1.4.10': 'reflow', '1.4.11': 'non-text-contrast', '1.4.13': 'content-on-hover-or-focus',
  '2.1.1': 'keyboard', '2.1.2': 'no-keyboard-trap', '2.4.2': 'page-titled', '2.4.3': 'focus-order',
  '2.4.4': 'link-purpose-in-context', '2.4.6': 'headings-and-labels', '2.4.7': 'focus-visible',
  '2.4.10': 'section-headings', '3.3.1': 'error-identification', '3.3.2': 'labels-or-instructions',
  '3.3.3': 'error-suggestion', '4.1.2': 'name-role-value', '4.1.3': 'status-messages',
};
function understandingFor(sc) {
  const slug = UNDERSTANDING[sc];
  return slug ? `wcag-understanding/${slug}.html` : null;
}

function firstSentence(s) {
  if (!s) return '';
  const m = String(s).match(/^.*?[.!?](?=\s|$)/);
  return (m ? m[0] : String(s)).trim();
}

// Map each SC to its Trusted Tester markdown path (root-relative URL), if any.
function ttFileFor(sc) {
  let names = [];
  try { names = fs.readdirSync(TT_DIR); } catch { return null; }
  // trailing dash disambiguates e.g. sc-1.4.1- from sc-1.4.10-
  const hit = names.find((n) => n.startsWith(`sc-${sc}-`) && n.endsWith('.md'));
  return hit ? `refs/trusted-tester/${hit}` : null;
}

function loadPlainEnglish(sc) {
  const p = path.join(PE_DIR, `${sc}.json`);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

// Every "## Test X.Y" heading in a TT markdown file -> ['7.A','7.B',...]
function scanTestIds(absPath) {
  try {
    const txt = fs.readFileSync(absPath, 'utf8');
    const ids = []; const re = /^##\s+Test\s+([0-9]+\.[A-Z])\b/gm; let m;
    while ((m = re.exec(txt))) ids.push(m[1]);
    return [...new Set(ids)];
  } catch { return []; }
}

// Hand/agent-authored aspect -> TT test map for multi-test SCs.
function loadTtMap(sc) {
  const p = path.join(ANNOTATOR_DIR, 'tt-map', `${sc}.json`);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

// Corrected highlight selectors (keyed "<aspect>/<caseId>") for cases whose
// original primarySelector matched nothing / a non-element. See selector-overrides/.
function loadSelectorOverrides(sc) {
  const p = path.join(ANNOTATOR_DIR, 'selector-overrides', `${sc}.json`);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

// Corrected mechanism/scenario text from the HTML-vs-mechanism drift audit
// (only for "stale-desc" cases — page is fine, prose drifted). See description-overrides/.
function loadDescriptionOverrides(sc) {
  const p = path.join(ANNOTATOR_DIR, 'description-overrides', `${sc}.json`);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

function build() {
  const scDirs = fs.readdirSync(AUG_DIR)
    .filter((d) => /^\d+\.\d+\.\d+$/.test(d))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const scs = [];
  let totalAspects = 0;
  let totalPages = 0;
  let missingPlain = [];
  let missingTtMap = [];
  let overrideCount = 0;
  let descOverrideCount = 0;

  for (const sc of scDirs) {
    const rjPath = path.join(AUG_DIR, sc, 'result.json');
    if (!fs.existsSync(rjPath)) continue;
    const r = JSON.parse(fs.readFileSync(rjPath, 'utf8'));
    const plain = loadPlainEnglish(sc);

    // Per-SC Trusted Tester wiring: which "## Test X.Y" section to show per aspect.
    // Single-test SCs auto-map; multi-test SCs read the hand/agent map in tt-map/.
    const ttFileRel = NO_TT[sc] ? null : ttFileFor(sc);
    const ttAllTests = ttFileRel ? scanTestIds(path.join(REPO_ROOT, ttFileRel)) : [];
    const ttMap = loadTtMap(sc);
    const selOverrides = loadSelectorOverrides(sc);
    const descOverrides = loadDescriptionOverrides(sc);

    // index aspect descriptors by slug
    const aspectMeta = {};
    for (const a of r.aspects || []) aspectMeta[a.slug] = a;

    const aspects = [];
    for (const ar of r.aspectResults || []) {
      const slug = ar.aspect || (ar.built && ar.built.aspectSlug);
      const meta = aspectMeta[slug] || {};
      const builtPages = (ar.built && ar.built.pages) || [];
      const pages = builtPages.map((p) => {
        const ov = selOverrides[`${slug}/${p.id}`];
        if (ov) overrideCount += 1;
        // drift audit: replace stale mechanism/scenario prose with the corrected text
        const dov = descOverrides[`${slug}/${p.id}`];
        if (dov) descOverrideCount += 1;
        return {
          id: p.id,
          url: '/' + String(p.file || '').replace(/^\/+/, ''),
          scenario: (dov && dov.scenario) || p.scenario || '',
          expected: p.expected || '',
          mechanism: (dov && dov.mechanism) || p.mechanism || '',
          descCorrected: !!dov,
          primarySelector: p.primarySelector || '',
          // corrected highlight target (falls back to primarySelector in the UI)
          highlightSelector: ov ? ov.selector : '',
          selectorNote: ov ? (ov.note || '') : '',
          appearsOnInteraction: ov ? !!ov.appearsOnInteraction : false,
          whyAutomatedToolsMiss: p.whyAutomatedToolsMiss || '',
          citation: p.citation || null,
        };
      });
      if (!pages.length) continue;
      totalPages += pages.length;
      totalAspects += 1;

      const plainSentence = plain[slug] || firstSentence(meta.description);
      if (!plain[slug]) missingPlain.push(`${sc}/${slug}`);

      // Resolve the Trusted Tester test(s) for this aspect.
      let ttTests = []; let ttWhy = '';
      if (ttFileRel) {
        if (ttAllTests.length === 1) { ttTests = ttAllTests.slice(); ttWhy = 'Sole TT test for this SC.'; }
        else if (ttMap[slug]) { ttTests = ttMap[slug].tests || []; ttWhy = ttMap[slug].why || ''; }
        else missingTtMap.push(`${sc}/${slug}`);
      }

      aspects.push({
        slug,
        title: meta.title || slug,
        plain: plainSentence,
        description: meta.description || '',
        scLimb: meta.scLimb || '',
        priority: meta.priority || '',
        whyUncovered: meta.whyUncovered || '',
        references: meta.references || [],
        ttTests,
        ttWhy,
        pages,
      });
    }
    if (!aspects.length) continue;

    scs.push({
      sc,
      title: (r.intentMap && r.intentMap.title) || sc,
      level: (r.intentMap && r.intentMap.level) || '',
      methodology: {
        ttFile: ttFileRel,
        ttAllTests,
        enNote: NO_TT[sc] || null,
        enRef: 'refs/en_301549v040100ev.pdf',
        understandingDoc: understandingFor(sc),
      },
      aspects,
    });
  }

  const manifest = {
    schema: 'act-augmented-annotator/1',
    generatedAt: null, // stamped by caller env, kept null for deterministic builds
    counts: { scs: scs.length, aspects: totalAspects, pages: totalPages },
    scs,
  };

  const outPath = path.join(ANNOTATOR_DIR, 'manifest.json');
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${path.relative(REPO_ROOT, outPath)}`);
  console.log(`  SCs: ${scs.length}  aspects: ${totalAspects}  pages: ${totalPages}  selector-overrides: ${overrideCount}  desc-overrides: ${descOverrideCount}`);
  if (missingPlain.length) {
    console.log(`  WARNING: ${missingPlain.length} aspects missing a plain-English sentence (fell back to description):`);
    console.log('    ' + missingPlain.join(', '));
  } else {
    console.log('  All aspects have a plain-English sentence.');
  }
  if (missingTtMap.length) {
    console.log(`  NOTE: ${missingTtMap.length} multi-test-SC aspects have no tt-map entry (will show the full SC process):`);
    console.log('    ' + missingTtMap.join(', '));
  } else {
    console.log('  All multi-test-SC aspects have a Trusted Tester test mapping.');
  }
}

build();
