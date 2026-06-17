// Harness 3.3 — C1: IBM Equal Access (accessibility-checker) as the one live external checker. It is the
// ONLY engine wired beyond axe, and ONLY on its surviving grounds after the scored ACT pilot:
//   • DECIDED wins  — 1.4.12 Text Spacing (J=1.0; axe does not decide it) and 2.5.3 Label in Name.
//   • TRIAGE priors — 1.4.1 Use of Color and 1.3.3 Sensory Characteristics: the meaning SCs no tool
//     decides, attached to the LLM/human review queue as targeted suspicion, NEVER pass/fail.
// Explicitly OUT of scope: 1.3.1 / 1.3.5 (axe owns these cleanly — C0) and 2.4.6 (IBM adds only noise).
//
// NON-AUTHORITATIVE: every IBM finding is a checker cross-signal (source:'checker'), never an obligation
// disposition — it cannot clear or barrier a CLAIM (HARNESS-3.3-IMPLEMENTATION.md §2).
//
// INERT BY DEFAULT: this module never auto-runs. The live path lazy-requires `accessibility-checker`
// (which fetches its rulepack from a CDN at runtime); if the package is absent it returns
// `checkerUnavailable` rather than silently producing nothing — network availability must not quietly
// change results. The pure `normalizeIbmFindings` is the tested core; activating the live lane needs the
// package installed AND the V3_CHECKER opt-in, exactly like the LLM lane needs V3_LLM + a key.
'use strict';

// IBM `value` = [category, level]: category ∈ {VIOLATION,RECOMMENDATION,INFORMATION},
// level ∈ {PASS,FAIL,POTENTIAL,MANUAL}. A DECIDED violation is ONLY VIOLATION+FAIL; POTENTIAL/MANUAL/
// RECOMMENDATION are review-only (needs-human-review / best practice), never a hard finding.
const IBM_HARD_SCS = Object.freeze(new Set(['1.4.12', '2.5.3'])); // IBM decides these (FAIL → hard; else review)
const IBM_PRIOR_SCS = Object.freeze(new Set(['1.4.1', '1.3.3'])); // meaning-SC triage priors (always review)
const isHardFail = (v) => Array.isArray(v) && v[0] === 'VIOLATION' && v[1] === 'FAIL';

// Normalize IBM `report.results` to checker findings, filtered to the C1 scope. `rule2sc` maps an IBM
// ruleId to its WCAG SC(s) (built from checker.getRulesets()). A rule outside the scope, or a PASS, is
// dropped. One finding per (rule, in-scope SC, element). Structured only — no page-content prose, so the
// strict v3 scanner cannot trip. Each finding is shaped for build-v3's checkerFindings normalization.
function normalizeIbmFindings(items, rule2sc = {}) {
  const findings = [];
  const seen = new Set();
  for (const it of (Array.isArray(items) ? items : [])) {
    if (!it || typeof it !== 'object') continue;
    const v = it.value;
    if (!Array.isArray(v) || v[1] === 'PASS') continue; // drop passes (and malformed values)
    const ruleId = String(it.ruleId || 'ibm-rule');
    const scs = [...new Set(rule2sc[it.ruleId] || [])];
    const xpath = (it.path && (it.path.dom || it.path.aria)) || null;
    for (const sc of scs) {
      const hard = isHardFail(v) && IBM_HARD_SCS.has(sc);
      const prior = IBM_PRIOR_SCS.has(sc);
      const softHard = IBM_HARD_SCS.has(sc) && !isHardFail(v); // a POTENTIAL/MANUAL on a decided SC ⇒ review
      if (!hard && !prior && !softHard) continue;             // outside the C1 scope (e.g. 1.3.1/2.4.6) → drop
      const key = `${ruleId}::${sc}::${xpath || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        source: 'checker', detector: `ibm:${ruleId}`, ruleId, sc,
        impact: v[0] != null ? String(v[0]) : '',
        kind: hard ? 'violation' : 'review',
        xpath, review: !hard, // hard = a decided 1.4.12/2.5.3 FAIL; everything else is a review prior
      });
    }
  }
  return findings;
}

// Build the ruleId→SC map from an IBM ruleset (checker.getRulesets()). Each checkpoint carries an SC
// number (e.g. "1.4.12") and a list of rule ids. Pure over a rulesets array so it is testable offline.
function buildRule2Sc(rulesets) {
  const rule2sc = {};
  const sets = Array.isArray(rulesets) ? rulesets : [];
  const rs = sets.find((r) => r && /IBM_Accessibility/i.test(r.id || '')) || sets[0];
  for (const cp of (rs && rs.checkpoints) || []) {
    const m = String((cp && cp.num) || '').match(/^\d\.\d+\.\d+/);
    if (!m) continue;
    for (const ru of (cp.rules || [])) if (ru && ru.id) (rule2sc[ru.id] = rule2sc[ru.id] || []).push(m[0]);
  }
  return rule2sc;
}

// Live lane (INERT unless the package is installed AND opt-in). Lazy-requires accessibility-checker, runs
// it against an already-loaded page, and returns identity-stamped checker findings. On a missing package
// or a run error, returns `{ checkerUnavailable: true, reason }` so the run RECORDS that IBM did not
// contribute, rather than silently emitting nothing (network/availability must not change results
// invisibly). The engine + ruleset version are recorded as the pin (a content hash / CDN vendoring is the
// production hardening step documented in the plan).
async function runIbm(page, opts = {}) {
  let checker;
  try { checker = require('accessibility-checker'); }
  catch (e) { return { checkerUnavailable: true, reason: 'accessibility-checker not installed (npm i accessibility-checker)' }; }
  try {
    let engineVersion = null; try { engineVersion = require('accessibility-checker/package.json').version; } catch (e) {}
    const rule2sc = buildRule2Sc(await checker.getRulesets().catch(() => []));
    const res = await checker.getCompliance(page, opts.label || 'v3');
    const items = (res && res.report && res.report.results) || [];
    return { ran: true, engine: 'ibm', engineVersion, findings: normalizeIbmFindings(items, rule2sc) };
  } catch (e) { return { checkerUnavailable: true, reason: `IBM run failed: ${e.message}` }; }
}

// URL entry point (fresh browser), mirroring runInstrumentsForUrl. Returns the identity-stamped result.
async function runIbmForUrl(url, opts = {}) {
  let checker;
  try { checker = require('accessibility-checker'); }
  catch (e) { return { checkerUnavailable: true, reason: 'accessibility-checker not installed' }; }
  const puppeteer = require('puppeteer');
  const CHROME = opts.executablePath || process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
    || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: opts.gotoTimeoutMs || 30000 }).catch(() => {});
    const r = await runIbm(page, opts);
    return r;
  } finally { await browser.close(); }
}

module.exports = { normalizeIbmFindings, buildRule2Sc, runIbm, runIbmForUrl, IBM_HARD_SCS, IBM_PRIOR_SCS };
