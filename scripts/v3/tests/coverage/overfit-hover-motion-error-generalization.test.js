// Generalization + adversarial guards for the round-3 overfit-audit findings:
//   #2  — SC 1.4.13: hover-content detection was keyed to a fixed tooltip-LIBRARY selector list (collector
//         candidate gate required an ARIA/popover association; runner docSig counted only curated selectors;
//         no focus path at all despite the SC being "hover OR focus").
//   #9  — SC 2.2.2: the 5-second gate was applied to AUTO-UPDATING content (which carries no 5s grace), and
//         the collector had NO signal for a discrete timer-driven text ticker (autoMotion = keyframes/marquee/
//         autoplay only; autoUpdatingContent = carousel-library data-ride markers only) — a silent miss.
//   #16 — SC 3.3.1: the OK_TEXT English success-keyword gate made the identification verdict depend on the
//         message's LANGUAGE ('Gracias, formulario enviado' credited via bare form.contains; 'Thanks,
//         submitted' excluded) — SC 3.3.1 is language-agnostic.
// Every fixture here is SYNTHETIC (data: URL) and is NOT a member of the ACT/DHS corpora — the point is to
// prove the CONDITIONS match the RULE, not the example pages the fixes were derived from. Each fix is paired
// with an OVER-FIRE guard (the variant that must NOT trip it) and a RECALL case (the variant that must).
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { CHROME } = require('../../lib/run-experiments.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const { RUNNERS } = require('../../lib/exp-runners.js');
const { directionFor } = require('../../lib/proposer.js');
const oracle = require('../../lib/applicability-oracle.js');
const cov = require('../../lib/coverage-registry.js');
const adj = require('../../lib/llm-adjudicator.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — overfit-hover-motion-error-generalization suite SKIPPED');

let browser;
before(async () => { if (chromeOK) browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] }); });
after(async () => { if (browser) await browser.close(); });

const dataUrl = (html) => 'data:text/html,' + encodeURIComponent('<!doctype html><html lang="en"><body>' + html + '</body></html>');

async function collectHtml(html, opts = {}) {
  const page = await browser.newPage();
  try {
    const url = dataUrl(html);
    return normalizeCollectRoles(await collectActPage(page, { url, elementCap: 80, file: 't', runId: 't', sourceUrl: url, runAxe: false, ...opts }));
  } finally { await page.close(); }
}

async function runOn(html, experimentId, targetXpath) {
  const page = await browser.newPage();
  try {
    await page.goto(dataUrl(html), { waitUntil: 'load' });
    return await RUNNERS[experimentId](page, { candidateId: 'c1', targetXpath, environment: 'test' });
  } finally { await page.close(); }
}
const byId = (c, id) => (c.elements || []).find((e) => (e.htmlSnippet || '').includes(`id="${id}"`));

// ═══════════════════════════ #2 — 1.4.13 collector candidate gate ═══════════════════════════

test('#2 RECALL (candidate gate): a pure CSS :hover reveal with a NON-listed class and NO ARIA association is a hover-content candidate', { skip: !chromeOK, concurrency: false }, async () => {
  const c = await collectHtml(
    `<style>.card .flyout{display:none} .card:hover .flyout{display:block}</style>` +
    `<div class="card" id="host">Pricing<div class="flyout" id="fly">Detailed pricing tooltip text</div></div>`,
    { autoUpdateWindowMs: 0 });
  const host = byId(c, 'host');
  assert.ok(host, 'the trigger element was collected');
  assert.equal(host.hasHoverContent, true, 'a CSS-reveal trigger (no popovertarget, no aria→tooltip, class not in any curated list) must be a 1.4.13 candidate');
});

test('#2 RECALL (candidate gate): an inline onmouseover JS-toggled reveal with NO ARIA association is a candidate; a :focus sibling reveal too', { skip: !chromeOK, concurrency: false }, async () => {
  const c = await collectHtml(
    `<style>.tip2{display:none} .help:focus ~ .tip2{display:block}</style>` +
    `<button id="jsbtn" onmouseover="document.getElementById('x1').style.display='block'">More info</button>` +
    `<div id="x1" style="display:none">Extra revealed text</div>` +
    `<button class="help" id="fbtn">?</button><div class="tip2">Keyboard help text</div>`,
    { autoUpdateWindowMs: 0 });
  assert.equal(byId(c, 'jsbtn').hasHoverContent, true, 'an inline hover handler attribute is candidacy — no tooltip-library markup needed');
  assert.equal(byId(c, 'fbtn').hasHoverContent, true, 'a :focus-reveal trigger is candidacy — 1.4.13 is hover OR focus');
});

test('#2 OVER-FIRE guard (candidate gate): a tail-less :hover style tweak and a native title= do NOT mint candidates', { skip: !chromeOK, concurrency: false }, async () => {
  const c = await collectHtml(
    `<style>a:hover{opacity:.8;text-decoration:underline} button:hover{background:#eee}</style>` +
    `<a href="/docs" id="lnk">Docs</a><button id="sv" title="Save your work">Save</button>`,
    { autoUpdateWindowMs: 0 });
  assert.equal(byId(c, 'lnk').hasHoverContent, false, 'a :hover rule with no revealed TARGET (style tweak on the trigger itself) must not flood every link');
  assert.equal(byId(c, 'sv').hasHoverContent, false, 'native title= alone stays exempt (UA-controlled tooltip, out of 1.4.13 scope)');
});

// ═══════════════════════════ #2 — 1.4.13 runner (generalized docSig + focus path) ═══════════════════════════

// A conforming popup: NON-listed class ("popover" as a CLASS is not the [popover] attribute the old curated
// selector matched), no ARIA association, Escape-dismissible, survives pointer travel (no mouseleave hide),
// persists, and obscures nothing. The tri-probe must SEE the content (contentAppeared) and find NO failing
// property — the over-fire guard for the whole-document visibility-delta rewrite.
const CONFORMING_POPUP = `
<button id="trig">Terms</button>
<p id="content" style="margin-top:140px">Reference paragraph safely below and clear of the popup region.</p>
<div id="pop" class="popover" style="display:none;position:absolute;left:280px;top:6px;background:#333;color:#fff;padding:6px">Full terms summary text</div>
<script>
var trig=document.getElementById('trig'),pop=document.getElementById('pop');
trig.addEventListener('mouseenter',function(){pop.style.display='block';});
document.addEventListener('keydown',function(e){if(e.key==='Escape')pop.style.display='none';});
</script>`;

test('#2 OVER-FIRE guard (runner): a genuinely conforming class="popover" hover popup is SEEN but yields NO barrier (anyPropertyFails=false)', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runOn(CONFORMING_POPUP, 'hover-content-tri', '/html/body/button');
  assert.equal(r.outcome.contentAppeared, true, 'the generalized visibility-delta signature must see a non-listed-class popup at all');
  assert.equal(r.outcome.anyPropertyFails, false, 'dismissible+hoverable+persistent all hold — a conforming popup must not become a barrier');
  assert.equal(directionFor('hover-content-tri', r.outcome), null, 'no BARRIER_OBSERVED for the conforming popup (barrier-only lane ⇒ null = not reproduced)');
});

// The RECALL twin: byte-similar markup, NOT Escape-dismissible, disappears on pointer-leave, and OBSCURES
// real content (so the Dismissible exemption cannot apply) — with (a) a non-listed class AND no ARIA
// association (exercises the candidate-gate + docSig generalization together).
const BARRIER_POPUP_HOVER = `
<button id="trig">Terms</button>
<p id="under" style="position:absolute;left:220px;top:10px;margin:0">Important page content that the popup covers.</p>
<div id="pop" class="card-flyout" style="display:none;position:absolute;left:220px;top:10px;background:#000;color:#fff;padding:6px">Cannot be dismissed and covers the content beneath</div>
<script>
var trig=document.getElementById('trig'),pop=document.getElementById('pop');
trig.addEventListener('mouseenter',function(){pop.style.display='block';});
trig.addEventListener('mouseleave',function(){pop.style.display='none';});
</script>`;

test('#2 RECALL (runner, hover): the same popup non-dismissible + vanishing on pointer travel IS a barrier — with a non-listed class and NO ARIA', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runOn(BARRIER_POPUP_HOVER, 'hover-content-tri', '/html/body/button');
  assert.equal(r.outcome.contentAppeared, true, 'the old curated docSig scored 0 here (class-flyout, no role=tooltip) — the FN this fix removes');
  assert.equal(r.outcome.hoverable, false, 'content vanishes when the pointer travels toward it — Hoverable fails');
  assert.equal(r.outcome.dismissible, false, 'no Escape mechanism and the content obscures other content — Dismissible fails');
  assert.equal(r.outcome.anyPropertyFails, true);
  assert.equal(directionFor('hover-content-tri', r.outcome), 'BARRIER_OBSERVED');
  assert.equal(r.measurement.revealMode, 'hover');
});

// (b) the FOCUS-triggered variant — exercises the new focus path (SC 1.4.13 is hover OR focus; the runner
// previously probed only mouse hover). Class-less reveal, hides on blur, no Escape handler, obscures content.
const BARRIER_POPUP_FOCUS = `
<button id="trig">Help</button>
<p id="under" style="position:absolute;left:220px;top:10px;margin:0">Important page content that the help panel covers.</p>
<div id="pop" style="display:none;position:absolute;left:220px;top:10px;background:#000;color:#fff;padding:6px">Focus-revealed help panel with no dismiss affordance</div>
<script>
var trig=document.getElementById('trig'),pop=document.getElementById('pop');
trig.addEventListener('focus',function(){pop.style.display='block';});
trig.addEventListener('blur',function(){pop.style.display='none';});
</script>`;

test('#2 RECALL (runner, focus): a focus-only reveal (class-less div, hides on blur, no Escape) IS a barrier via the new focus path', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runOn(BARRIER_POPUP_FOCUS, 'hover-content-tri', '/html/body/button');
  assert.equal(r.outcome.contentAppeared, true, 'hover reveals nothing here — only the new focus probe can see this content');
  assert.equal(r.measurement.revealMode, 'focus');
  assert.equal(r.outcome.hoverable, true, 'Hoverable is vacuously satisfied for focus-only content (pointer hover cannot trigger it)');
  assert.equal(r.outcome.dismissible, false, 'no Escape mechanism and the content obscures other content — Dismissible fails');
  assert.equal(r.outcome.anyPropertyFails, true);
  assert.equal(directionFor('hover-content-tri', r.outcome), 'BARRIER_OBSERVED');
});

// Sanity over the existing 1.4.13 corpus shapes is exercised separately (see the runner suite fixtures
// fx-v3-c9-*.html, which keep passing with the generalized signature) — plus the collector sanity run in
// this change's engineering notes over eval/act-augmented/1.4.13/pages.

// ═══════════════════════════ #9 — 2.2.2 auto-updating text: routing units (no Chrome) ═══════════════════════════

test('#9 routing: autoUpdatingText NOT in a live region owes motion-control (2.2.2)', () => {
  const fams = oracle.familiesFor({ xpath: '/t', autoUpdatingText: true, liveRegion: false });
  assert.ok(fams.includes('motion-control'));
  assert.ok(cov.expectedFamilies({ xpath: '/t', autoUpdatingText: true, liveRegion: false }).has('motion-control'), 'coverage-registry re-declares the branch (Rule 16)');
});

test('#9 routing EXCLUSION: autoUpdatingText inside a live region follows the existing 4.1.3 lane, NOT motion-control (no double-mint)', () => {
  const fams = oracle.familiesFor({ xpath: '/t', autoUpdatingText: true, liveRegion: true });
  assert.ok(!fams.includes('motion-control'), 'liveRegion:true routes to status-message instead — same guard as the carousel lane');
  assert.ok(fams.includes('status-message'));
  assert.ok(!cov.expectedFamilies({ xpath: '/t', autoUpdatingText: true, liveRegion: true }).has('motion-control'));
});

test('#9 routing dedupe: an element that is BOTH autoMotion and autoUpdatingText mints motion-control exactly once', () => {
  const fams = oracle.familiesFor({ xpath: '/t', autoMotion: true, autoUpdatingText: true, liveRegion: false });
  assert.equal(fams.filter((f) => f === 'motion-control').length, 1);
});

test('#9 routing NO-OVER-FIRE: a plain element (no auto-update signal) owes no motion-control', () => {
  assert.ok(!oracle.familiesFor({ xpath: '/t', autoUpdatingText: false, liveRegion: false }).includes('motion-control'));
});

test('#9 precompute: the motion-control rubric is told WHICH 2.2.2 clause applies (auto-updating has NO 5s grace)', () => {
  const upd = adj.precomputeSignals({ autoUpdatingText: true }, 'timing-and-motion', '2.2.2').motionMechanism;
  assert.equal(upd.autoUpdatingText, true);
  assert.match(upd.uncertainReason, /5.second/i, 'the reason must state the 5-second condition explicitly');
  assert.match(upd.uncertainReason, /NOT clear auto-updating|can NOT clear auto-updating/i, '"auto-stops within 5s" must not clear the auto-updating clause');
  const mov = adj.precomputeSignals({ autoMotion: true }, 'timing-and-motion', '2.2.2').motionMechanism;
  assert.equal(mov.autoMotion, true);
  assert.match(mov.uncertainReason, /moving\/blinking\/scrolling/i);
  assert.equal(adj.precomputeSignals({ autoUpdatingText: true }, 'name-role-state', '4.1.2').motionMechanism, undefined, 'the signal is skill-scoped to timing-and-motion');
});

// ═══════════════════════════ #9 — 2.2.2 auto-updating text: collector signal (real DOM) ═══════════════════════════

const PARALLEL = `<article id="art"><h1>Market news</h1><p>A long static paragraph of parallel content that stays put and gives the reader plenty of surrounding text to interact with while the ticker updates on its own schedule.</p></article>`;

test('#9 RECALL (collector): a setInterval text ticker alongside an article emits autoUpdatingText:true and mints a motion-control (2.2.2) obligation', { skip: !chromeOK, concurrency: false }, async () => {
  // 3000ms period — the audit finding's MOTIVATING case verbatim ("rewrites every 3s forever"). The
  // adversarial review caught this test's first version using a 600ms ticker fitted to the then-2400ms
  // detection window; the default window is now 6500ms precisely so this real-world period qualifies
  // (two swaps land at ~3s and ~6s inside the window).
  const c = await collectHtml(
    PARALLEL +
    `<div id="tick">Price 100</div>` +
    `<script>var i=0;setInterval(function(){document.getElementById('tick').textContent='Price '+(++i);},3000);</script>`);
  const tick = byId(c, 'tick');
  assert.ok(tick, 'the ticker element was collected');
  assert.equal(tick.autoUpdatingText, true, 'recurring timer-driven text swaps on a visible in-parallel element — the previously silent 2.2.2 miss');
  const obs = oracle.deriveObligations(c).filter((o) => o.xpath === tick.xpath && o.claimFamily === 'motion-control');
  assert.ok(obs.length >= 1, 'the routing mints a motion-control subject for the ticker');
  assert.equal(obs[0].sc, '2.2.2');
});

test('#9 NO-OVER-FIRE (a): the same ticker WITH a working Pause button still emits the SIGNAL (the rubric owns the pause judgment, not the collector)', { skip: !chromeOK, concurrency: false }, async () => {
  const c = await collectHtml(
    PARALLEL +
    `<div id="tick">Price 100</div><button id="pause">Pause updates</button>` +
    `<script>var i=0,h=setInterval(function(){document.getElementById('tick').textContent='Price '+(++i);},600);document.getElementById('pause').addEventListener('click',function(){clearInterval(h);});</script>`);
  assert.equal(byId(c, 'tick').autoUpdatingText, true, 'signal semantics only: the mechanical fact (it auto-updates) is true; pause adequacy is the rubric’s judgment');
});

test('#9 NO-OVER-FIRE (b): a static page with a ONE-SHOT text change and a one-shot 2s CSS animation stays autoUpdatingText:false everywhere', { skip: !chromeOK, concurrency: false }, async () => {
  const c = await collectHtml(
    `<style>@keyframes slidein{from{margin-left:100px}to{margin-left:0}} .banner{animation:slidein 2s 1}</style>` +
    PARALLEL +
    `<div class="banner" id="ban">Welcome banner</div>` +
    `<script>setTimeout(function(){document.getElementById('ban').textContent='Welcome banner updated';},400);</script>`);
  for (const el of c.elements) assert.notEqual(el.autoUpdatingText, true, 'a one-shot update (<2 recurring swaps) must not qualify: ' + el.xpath);
  assert.notEqual(byId(c, 'ban').autoMotion, true, 'a finite sub-5s animation stays out of autoMotion too (no cross-firing)');
});

test('#9 NO-OVER-FIRE (c): a ticker INSIDE an aria-live region follows the existing liveRegion/4.1.3 routing — not double-minted into motion-control', { skip: !chromeOK, concurrency: false }, async () => {
  const c = await collectHtml(
    PARALLEL +
    `<div aria-live="polite" id="status"><span id="inner">Waiting</span></div>` +
    `<script>var j=0;setInterval(function(){document.getElementById('inner').textContent='Update '+(++j);},600);</script>`);
  for (const el of c.elements) assert.notEqual(el.autoUpdatingText, true, 'live-region-owned updates are excluded from the new signal: ' + el.xpath);
  const status = byId(c, 'status');
  assert.equal(status.liveRegion, true);
  const fams = oracle.deriveObligations(c).filter((o) => o.xpath === status.xpath).map((o) => o.claimFamily);
  assert.ok(fams.includes('status-message'), 'the existing 4.1.3 status-message lane still owns it');
  assert.ok(!fams.includes('motion-control'), 'no motion-control double-mint on the live region');
});

// ═══════════════════════════ #16 — 3.3.1 language-agnostic error identification ═══════════════════════════

// FALSE-CLEAR guard: after an invalid required-field submit, an in-form surface shows NON-English SUCCESS text
// with NO error-association markup. The old code credited it as identification via bare form.contains(n)
// (customIdentifies=true) because only the ENGLISH OK_TEXT list could exclude a success surface. The probe now
// ABSTAINS: customIdentifies=false (never credited), the sample rides measurement.unassociatedSurface for the
// LLM lane, and errorNotIdentified stays false (a deterministic BARRIER here would false-positive the
// structurally IDENTICAL genuine-error case below — no markup distinguishes them, only meaning, which is the
// LLM's judgment; this is the spec's "or the probe abstains" branch).
const SUCCESS_FORM = (msg) => `
<form id="f" novalidate>
  <label for="t">Correo</label>
  <input type="email" id="t" name="email" required>
  <div id="m"></div>
  <button type="submit">Enviar</button>
</form>
<script>
document.getElementById('f').addEventListener('submit', function(e){ e.preventDefault(); document.getElementById('m').textContent='${msg}'; });
</script>`;

test('#16 FALSE-CLEAR guard: a non-English success toast in a plain in-form div is NOT credited as identification (probe abstains)', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runOn(SUCCESS_FORM('Gracias, formulario enviado'), 'form-error-probe', "//*[@id='t']");
  assert.equal(r.valid, true);
  assert.equal(r.measurement.customIdentifies, false, 'was TRUE via bare form.contains(n) — the false clear this fix removes');
  assert.match(String(r.measurement.unassociatedSurface), /Gracias/, 'the abstain surfaces the sample so the LLM lane judges its MEANING');
  assert.equal(r.outcome.errorNotIdentified, false, 'abstain, not barrier: identical markup can carry a genuine plain-text error (see the recall case) — meaning is not deterministically judgeable');
  assert.equal(directionFor('form-error-probe', r.outcome), null, 'neither credited nor barriered ⇒ PARTIAL (LLM lane)');
});

test('#16 language symmetry: the ENGLISH success toast now behaves IDENTICALLY (no keyword list left in the decision, and it cannot masquerade as identification)', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runOn(SUCCESS_FORM('Thanks, your form was submitted'), 'form-error-probe', "//*[@id='t']");
  assert.equal(r.measurement.customIdentifies, false, '"Thanks, submitted" must NOT masquerade as identification once OK_TEXT is retired');
  assert.match(String(r.measurement.unassociatedSurface), /Thanks/);
  assert.equal(r.outcome.errorNotIdentified, false, 'same abstain as the Spanish twin — the verdict no longer depends on the message language');
});

test('#16 RECALL: a genuine NON-English error in an aria-errormessage-referenced span is STILL credited', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runOn(`
<form id="f2" novalidate>
  <label for="t">Nombre</label>
  <input id="t" name="nombre" required aria-errormessage="err" aria-describedby="err" aria-invalid="false">
  <span id="err" hidden></span>
  <button type="submit">Enviar</button>
</form>
<script>
document.getElementById('f2').addEventListener('submit', function(e){ e.preventDefault(); var s=document.getElementById('err'); s.hidden=false; s.textContent='Error: el campo es obligatorio'; });
</script>`, 'form-error-probe', "//*[@id='t']");
  assert.equal(r.valid, true);
  assert.equal(r.measurement.customIdentifies, true, 'a field-referenced surfaced message is markup-associated identification — language plays no part');
  assert.equal(r.outcome.errorNotIdentified, false);
});

test('#16 barrier retention: NO surface at all after invalid submit is still a deterministic barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runOn(`
<form id="f3" novalidate>
  <label for="t">Correo</label>
  <input type="email" id="t" name="email" required>
  <button type="submit">Enviar</button>
</form>
<script>document.getElementById('f3').addEventListener('submit', function(e){ e.preventDefault(); });</script>`,
  'form-error-probe', "//*[@id='t']");
  assert.equal(r.valid, true);
  assert.equal(r.outcome.errorNotIdentified, true, 'nothing surfaced anywhere — the true 3.3.1 barrier is unaffected by the abstain channel');
  assert.equal(directionFor('form-error-probe', r.outcome), 'BARRIER_OBSERVED');
});
