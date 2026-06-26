'use strict';
// Focused single-question LLM micro-checks via the SAME Claude Code SDK transport the harness uses. Each check asks the
// model ONE narrow question a deterministic runner cannot resolve, and answers in a uniform contract:
//   { result: 'clear' | 'barrier' | 'uncertain', reason, confidence }   (from the perspective "is there a WCAG barrier?")
// A runner wrapper recomposes: a deterministic FAIL + 'clear' ⇒ pass; an ABSTAIN + 'barrier' ⇒ fail / + 'clear' ⇒ pass;
// 'uncertain' ⇒ keep the deterministic disposition / route up. Every prompt is framed CONSERVATIVE — answer 'clear'
// ONLY when confidently no-barrier; default to 'barrier'/'uncertain' when unsure — so adding a check cannot manufacture
// a false-CLEAR (the unrecoverable error). Image-bearing checks attach a crop; text-only checks pass facts.
const { makeClaudeSdkTransport, toAnthropicContent } = require('./llm-agent-adapter.js');

let _transport = null;
function transport() { if (!_transport) _transport = makeClaudeSdkTransport({ model: process.env.V3_MICRO_MODEL || 'claude-sonnet-4-6', effort: process.env.V3_MICRO_EFFORT || 'medium' }); return _transport; }

async function callClaude(messages, { maxTokens = 320 } = {}) {
  const request = { model: process.env.V3_MICRO_MODEL || 'claude-sonnet-4-6', max_tokens: maxTokens, messages: [{ role: 'user', content: toAnthropicContent(messages) }] };
  let res; try { res = await transport()(request); } catch (e) { return { error: String(e.message || e) }; }
  const text = res && Array.isArray(res.content) ? res.content.filter((c) => c && c.type === 'text').map((c) => c.text).join('\n') : null;
  if (!text) return { error: 'no-response' };
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return { ok: true, json: JSON.parse(m[0]) }; } catch (e) { /* fall through */ } }
  return { ok: true, text };
}

// shared message builder + the uniform answer contract.
const ANSWER = 'Answer STRICT JSON only: {"result": "clear" | "barrier" | "uncertain", "reason": "<one short clause>", "confidence": "low|medium|high"}. Answer "clear" ONLY if you are confident there is NO barrier; if unsure, answer "uncertain" or "barrier".';
function msgs(lines, imageB64) { const out = [{ type: 'text', text: lines.filter(Boolean).join('\n') + '\n' + ANSWER }]; if (imageB64) out.push({ type: 'image', mediaType: 'image/png', data: imageB64 }); return out; }
function norm(j) { if (!j) return 'uncertain'; const r = String(j.result || '').toLowerCase(); return r === 'clear' || r === 'barrier' || r === 'uncertain' ? r : 'uncertain'; }

// ============================ the checks ============================
const CHECKS = {
  // ---------- C4 (1.4.11) ----------
  'essential-presentation': { build: (e) => msgs([
    'WCAG 1.4.11: a visual element measured ' + (e.ratio != null ? e.ratio + ':1' : 'low') + ' contrast against its surroundings — BELOW the 3:1 floor.',
    'Is it EXEMPT? Exempt ("clear") ONLY if the specific presentation is ESSENTIAL — a logo/brand mark as it must appear; a screenshot/diagram/sample whose exact colours convey real-world appearance; an INACTIVE/disabled control; or PURELY DECORATIVE (conveys no information, removing it loses nothing).',
    'NOT exempt ("barrier") if it is a normal author-styled UI component, icon, indicator, or chart part whose low contrast merely makes it hard to perceive.',
    'IMPORTANT: a faint appearance the author merely CALLS "brand"/"essential" is NOT essential. Essential means the EXACT appearance is genuinely required (a real corporate logo, a screenshot of real software, a colour sample). A normal styled control or divider is never essential just because it looks subtle. WHEN IN DOUBT, answer "barrier".',
    'Element role: ' + (e.role || 'unknown') + '. Nearby text/label: "' + (e.label || '') + '". Judge primarily from the image.',
  ], e.imageB64), parse: norm },

  // STRUCTURED RUBRIC (won its bake-off, 10/10 / 0 FC on a fresh synthetic set; the loose prompt over-cleared). Three
  // explicit checks instead of one fuzzy "decorative?" judgment.
  'decorative-or-component': { build: (e) => msgs([
    'WCAG 1.4.11 covers only UI COMPONENTS (operable controls) and information-bearing GRAPHICS. A purely decorative separator / spacer / flourish is OUT of scope.',
    'Answer each about the highlighted ' + (e.label ? '"' + e.label + '" ' : '') + 'element:',
    '- operable: is it (or does it contain) a control a user clicks / types / toggles (button / field / toggle / tab / link / icon-control)?',
    '- informative_graphic: is it a chart / diagram / icon whose form conveys information needed to understand the content?',
    '- decorative_only: is it purely a line / spacer / dot / flourish that conveys NO information and is NOT operable?',
    'Element role: ' + (e.role || 'unknown') + '. Nearby text: "' + (e.label || '') + '".',
    'Answer STRICT JSON only: {"operable":bool,"informative_graphic":bool,"decorative_only":bool,"result":"clear"|"barrier","confidence":"low|medium|high"}. result is "clear" (out of scope) iff decorative_only is true AND operable is false AND informative_graphic is false; otherwise "barrier".',
  ], e.imageB64), parse: norm },

  'graphical-object-distinguishable': { build: (e) => msgs([
    'WCAG 1.4.11 (graphical objects): the parts of a graphic REQUIRED to understand it must be distinguishable (≥3:1 against adjacent colours).',
    'Look at this chart/icon/diagram. Are the MEANING-BEARING parts (segments, lines, the icon silhouette) clearly distinguishable from each other and the background?',
    'Answer "clear" only if every part needed to understand it is clearly distinguishable. Answer "barrier" if any required part is too low-contrast to perceive. "uncertain" if you cannot tell which parts are required.',
    'Context/label: "' + (e.label || '') + '".',
  ], e.imageB64), parse: norm },

  'state-indicator-perceivable': { build: (e) => msgs([
    'WCAG 1.4.11: a toggle/checkbox/radio/switch conveys state via an internal cue (the knob, tick, dot, or fill) against its track/box.',
    'Look at the control. Is the STATE cue perceivable — i.e. does the knob/tick/dot/fill have ≥3:1 contrast against its immediate track/box so a user can tell the state?',
    'Answer "clear" if the state cue is clearly perceivable; "barrier" if the cue is too faint against its track to distinguish the state.',
    'Role: ' + (e.role || 'unknown') + '. Label: "' + (e.label || '') + '".',
  ], e.imageB64), parse: norm },

  // ---------- C6 (1.4.10) ----------
  'meaningful-indentation': { build: (e) => msgs([
    'WCAG 1.4.10 reflow at 320px: horizontal indentation that conveys MEANING (code structure, poetry/verse shape, a tree/outline hierarchy, term↔definition pairing) must not be lost; gratuitous/aesthetic indentation may collapse harmlessly.',
    'The indentation here COLLAPSES at 320px. Does that collapse LOSE meaning?',
    'Answer "barrier" if the indentation is meaningful (collapsing it destroys structure a reader relies on). Answer "clear" if it is purely decorative/gratuitous (collapsing loses nothing).',
    'Content kind/sample: ' + (e.label || '(see image)') + '.',
  ], e.imageB64), parse: norm },

  'equivalent-content-on-reflow': { build: (e) => msgs([
    'WCAG 1.4.10: content may be re-arranged at 320px as long as the SAME information and functionality remain available.',
    'At 320px, some content that was present at desktop width is no longer directly visible. Is there an accessible EQUIVALENT at 320px — e.g. the nav collapsed into a working hamburger/disclosure, a table re-rendered as stacked cards with the same data, or a show-more control?',
    'Answer "clear" only if an equivalent that preserves the same information AND functionality is present and operable. Answer "barrier" if the content/functionality is simply lost (clipped, display:none with no alternative).',
    'What is missing: ' + (e.label || '(see image)') + '.',
  ], e.imageB64), parse: norm },

  'author-scroll-affordance': { build: (e) => msgs([
    'WCAG 1.4.10 EXCEPTS content that requires a two-dimensional layout for usage or meaning (data tables, code blocks, maps, diagrams, toolbars).',
    'This element overflows horizontally at 320px inside its own scroll container. Is that a LEGITIMATE 2-D-exception affordance (a wide data table / preformatted code / map the author intentionally made scrollable), or normal flowing content that should have wrapped?',
    'Answer "clear" only if the content genuinely needs 2-D (data table / code / map / diagram) and the scroll is an intentional affordance for it. Answer "barrier" if it is ordinary text/content that is being forced to scroll.',
    'Element: ' + (e.label || '(see image)') + '.',
  ], e.imageB64), parse: norm },

  // ---------- C5 (3.3.1/2/3) — text-only (no crop) ----------
  'error-describes-constraint': { build: (e) => msgs([
    'WCAG 3.3.1 (error identification): an error message must describe WHAT is wrong in text.',
    'The field actually requires: ' + (e.constraint || '(unknown constraint)') + '.',
    'The error message shown is: "' + (e.errorText || '') + '".',
    'Does the error message correctly + specifically describe the actual problem? Answer "clear" if it correctly identifies the real constraint violation; "barrier" if it is generic-to-the-point-of-useless, wrong, or describes a different constraint.',
  ]), parse: norm },

  'suggestion-correct': { build: (e) => msgs([
    'WCAG 3.3.3 (error suggestion): when a fix is known, the suggestion must be CORRECT for the constraint.',
    'The field requires: ' + (e.constraint || '(unknown)') + '. The suggestion offered is: "' + (e.suggestion || '') + '".',
    'Is the suggestion correct and actionable for THIS constraint? Answer "clear" if correct; "barrier" if it is wrong, misleading, or would not satisfy the constraint.',
  ]), parse: norm },

  'security-field-exempt': { build: (e) => msgs([
    'WCAG 3.3.3 EXCEPTS error suggestion where it would jeopardize the security or purpose of the content (e.g. revealing exactly why a password/CVV/answer is wrong).',
    'Field: ' + (e.fieldName || '') + ' (type=' + (e.fieldType || '') + '). Constraint: ' + (e.constraint || '') + '.',
    'Is withholding a specific suggestion JUSTIFIED by the security/purpose exception here? Answer "clear" (exempt — withholding is justified) ONLY for genuine security/auth fields (password, current-password, security answer, one-time code, CVV). Answer "barrier" for ordinary fields (email, phone, date, postcode) where a suggestion is owed.',
  ]), parse: norm },

  'instruction-matches-constraint': { build: (e) => msgs([
    'WCAG 3.3.2: a field instruction must be consistent with the field\'s ACTUAL constraint.',
    'Actual constraint: ' + (e.constraint || '(unknown)') + '. Instruction shown: "' + (e.instruction || '') + '".',
    'Does the instruction correctly describe how to satisfy the real constraint? Answer "clear" if consistent + helpful; "barrier" if it contradicts the constraint or would mislead the user.',
  ]), parse: norm },

  'error-names-right-field': { build: (e) => msgs([
    'WCAG 3.3.1: the error must identify the field that is actually in error.',
    'The field genuinely in error is: ' + (e.errorField || '(unknown)') + '. The error indicator names/points to: ' + (e.namedField || '(unknown)') + '.',
    'Does the error correctly identify the field that is wrong? Answer "clear" if it names the right field; "barrier" if it points to the wrong field or is ambiguous between fields.',
  ]), parse: norm },

  'error-summary-coherent': { build: (e) => msgs([
    'WCAG 3.3.1: an error summary should coherently list the actual errors so a user can act on them.',
    'Errors actually present: ' + (e.actualErrors || '(unknown)') + '. Summary shown: "' + (e.summary || '') + '".',
    'Does the summary coherently + completely reflect the real errors? Answer "clear" if it does; "barrier" if it omits errors, lists phantom errors, or is incoherent.',
  ]), parse: norm },

  // ---------- C1 (1.4.1 / 4.1.2) ----------
  // 1.4.1 use of colour — PER-CUE BOOLEAN RUBRIC (won two synthetic prompt bake-offs: lowest false-clears with ZERO
  // false-barriers, beating free-form describe-then-decide and counterfactual framings). Forcing an explicit per-cue
  // check AGAINST THE SIBLINGS — does the element have this cue that the others LACK? — grounds the verdict and removes
  // both the "invent a cue" bias and the "count a coloured fill as a cue" error. Judged on the COLOUR crop (grayscale
  // was measured WORSE — it preserves luminance, so a colour-only element still reads as a different shade).
  'use-of-color-adequacy': { build: (e) => { const out = [{ type: 'text', text: [
    'WCAG 1.4.1 (use of colour). Compare the highlighted ' + (e.label ? '"' + e.label + '" ' : '') + 'element to the OTHER similar items / surrounding text. For each cue below, does the element HAVE it AND the others LACK it?',
    '- underline_distinct: an underline the others lack',
    '- border_distinct: an outline/border the others lack (a filled BACKGROUND does NOT count)',
    '- weight_distinct: visibly bolder / heavier than the others',
    '- icon_distinct: an icon / symbol / marker the others lack',
    '- shape_distinct: a genuinely different SHAPE/geometry that would remain visible without colour (NOT a shape made only by a coloured fill)',
    '- label_distinct: an added text word/label the others lack (e.g. "required", "selected", a tick)',
    'If ALL SIX are false, colour is the only distinguisher.',
    'Answer STRICT JSON only: {"underline_distinct":bool,"border_distinct":bool,"weight_distinct":bool,"icon_distinct":bool,"shape_distinct":bool,"label_distinct":bool,"result":"clear"|"barrier","confidence":"low|medium|high"}. result is "barrier" iff all six are false; otherwise "clear".',
  ].join('\n') }]; if (e.imageB64) out.push({ type: 'image', mediaType: 'image/png', data: e.imageB64 }); return out; }, parse: norm },

  // 1.4.1 STATE-change variant (used when the element VISIBLY changes between rest and the driven state — toggle, hover,
  // selected). Both-state crop + a STRUCTURE-focused question (did anything move/appear, or only colour?). Won round 8:
  // routed (state→this, static→the rubric above) scored 12/12, 0 FC / 0 FB on the unified synthetic set.
  'use-of-color-state': { build: (e) => { const out = [{ type: 'text', text: [
    'Two images show the SAME UI element before and after it becomes active/selected/hovered. Focus on STRUCTURE, not colour.',
    'Did anything MOVE (a toggle knob, an indicator repositioning) OR did an underline, border, icon, or text APPEAR? Or did ONLY the fill/text COLOUR change while everything stayed in the same place?',
    'WCAG 1.4.1 needs a non-colour cue for the change. Answer STRICT JSON only: {"moved_or_appeared":true|false,"result":"clear"|"barrier","confidence":"low|medium|high"}. result is "barrier" iff moved_or_appeared is false.',
  ].join('\n') }]; if (e.restImg) { out.push({ type: 'text', text: 'STATE 1 (before):' }, { type: 'image', mediaType: 'image/png', data: e.restImg }); } if (e.inImg) { out.push({ type: 'text', text: 'STATE 2 (after):' }, { type: 'image', mediaType: 'image/png', data: e.inImg }); } return out; }, parse: norm },

  'state-value-correct': { build: (e) => msgs([
    'WCAG 4.1.2: after a control is operated, its programmatic state/value must CORRECTLY reflect the new visible state.',
    'Visible state after activation: ' + (e.visibleState || '(see image)') + '. Programmatically exposed state/value: ' + (e.exposedState || '(unknown)') + '.',
    'Does the exposed state/value correctly match the visible state? Answer "clear" if it correctly reflects it; "barrier" if it is stale, contradictory, inverted, or non-conforming.',
  ], e.imageB64), parse: norm },

  // ---------- C2 (3.3.2 / 1.4.13 / 2.4.3) ----------
  'instruction-adequate': { build: (e) => msgs([
    'WCAG 3.3.2: an instruction revealed on focus must actually help the user provide the input (label/format/requirement).',
    'The instruction revealed on focus is: "' + (e.instruction || '') + '" for field: ' + (e.fieldName || '') + '.',
    'Is it an adequate, relevant instruction? Answer "clear" if it meaningfully helps; "barrier" if it is empty, irrelevant, or unhelpful.',
  ]), parse: norm },

  'reveal-dismissible-persistent': { build: (e) => msgs([
    'WCAG 1.4.13 (content on hover or focus): additional content shown must be DISMISSIBLE (Esc without moving pointer/focus), HOVERABLE (pointer can move onto it without it vanishing), and PERSISTENT (stays until dismissed/invalid).',
    'Facts observed: dismissible(Esc)=' + (e.dismissible == null ? 'unknown' : e.dismissible) + ', hoverable=' + (e.hoverable == null ? 'unknown' : e.hoverable) + ', persistent=' + (e.persistent == null ? 'unknown' : e.persistent) + '.',
    'Does the revealed content meet ALL THREE? Answer "clear" only if all three hold; "barrier" if any fails; "uncertain" if a property is unknown.',
  ], e.imageB64), parse: norm },

  'internal-focus-order': { build: (e) => msgs([
    'WCAG 2.4.3: within a revealed region, the focus (Tab) order must follow a meaningful sequence matching the visual/logical reading order.',
    'Observed DOM/tab order of the revealed items: ' + (e.tabOrder || '(see image)') + '. Visual order: ' + (e.visualOrder || '(see image)') + '.',
    'Does the focus order match the visual/logical order? Answer "clear" if it does; "barrier" if Tab jumps in an order that conflicts with the visible layout.',
  ], e.imageB64), parse: norm },

  // ---------- C8 (4.1.2 / 1.1.1) ----------
  'iframe-describes-content': { build: (e) => msgs([
    'WCAG 4.1.2 (H64): an <iframe> title must DESCRIBE the frame\'s content/purpose.',
    'iframe title: "' + (e.title || '') + '". The frame\'s actual content (summary): ' + (e.contentSummary || '(unknown)') + '.',
    'Does the title accurately describe the content? Answer "clear" if it does; "barrier" if it is generic, wrong, or unrelated to the content.',
  ]), parse: norm },

  'glyph-informative': { build: (e) => msgs([
    'WCAG 1.1.1: a glyph/symbol that conveys INFORMATION needs a text alternative; a purely DECORATIVE glyph does not.',
    'A symbol is rendered via ' + (e.via || 'a pseudo-element / icon font') + ' with no text alternative. Symbol/context: ' + (e.label || '(see image)') + '.',
    'Does this glyph convey information the user needs (e.g. a star rating, a required-field marker, a status icon, a meaningful arrow)? Answer "barrier" if it is informative-with-no-alt; "clear" if it is genuinely decorative (a bullet, a flourish).',
  ], e.imageB64), parse: norm },

  'long-desc-complete': { build: (e) => msgs([
    'WCAG 1.1.1: a complex image (chart/diagram/data graphic) needs a long description that conveys the same information.',
    'A long-description source EXISTS for this complex image. Source text/summary: ' + (e.descText || '(see facts)') + '.',
    'Is the description COMPLETE enough to convey the image\'s information (trends, values, relationships)? Answer "clear" if reasonably complete; "barrier" if it is a stub/caption that omits the substantive content.',
  ], e.imageB64), parse: norm },
};

async function resolveCheck(checkId, evidence) {
  const c = CHECKS[checkId]; if (!c) return { result: 'uncertain', error: 'no-such-check:' + checkId };
  const r = await callClaude(c.build(evidence));
  if (r.error) return { result: 'uncertain', error: r.error };
  return { result: c.parse(r.json), raw: r.json || r.text };
}

// ESCALATE gate for the abstain path: a check may turn an abstain into a fail ONLY on a 'barrier' that is not
// low-confidence. Gating can only make the checker MORE conservative (fewer escalations) — it can never introduce a
// false-CLEAR — so it is always safe to apply; it trades a few caught barriers for fewer false-barriers.
function escalates(r) { return !!(r && r.result === 'barrier' && (!r.raw || r.raw.confidence !== 'low')); }
// CLEAR gate for the fail path (exemptions): only flip a fail→pass on a 'clear' that is HIGH-confidence — the
// conservative bar for the one direction that can produce a false-clear.
function clears(r) { return !!(r && r.result === 'clear' && r.raw && r.raw.confidence === 'high'); }

// PRECISION-HARDENED escalation: to keep the FALSE-BARRIER count low (many elements per page ⇒ even a small rate is a
// big absolute count), an abstain only escalates to a fail when (1) the focused check says 'barrier' at HIGH
// confidence AND (2) a SKEPTICAL second pass — same evidence, opposing "assume acceptable unless clearly a barrier"
// prior — also confirms it. The two decorrelated passes reject borderline barriers (→ stay abstain). Strictly
// false-clear-safe: more gating can only REDUCE escalations, never clear a real barrier. Returns { escalate, ... }.
async function resolveEscalation(checkId, evidence) {
  const c = CHECKS[checkId]; if (!c) return { escalate: false, result: 'uncertain', error: 'no-such-check:' + checkId };
  const first = await callClaude(c.build(evidence));
  if (first.error) return { escalate: false, result: 'uncertain', error: first.error };
  const r1 = c.parse(first.json);
  if (!(r1 === 'barrier' && first.json && first.json.confidence === 'high')) return { escalate: false, result: r1, raw: first.json };
  // skeptical confirm — prepend an opposing prior to the SAME evidence-bearing messages.
  const skMsgs = c.build(evidence).map((m, i) => (i === 0 && m.type === 'text') ? { ...m, text: 'Adopt a SKEPTICAL prior: assume this is ACCEPTABLE / not a barrier unless it is CLEARLY and unambiguously one. ' + m.text } : m);
  const second = await callClaude(skMsgs);
  const r2 = c.parse(second.json);
  const escalate = r2 === 'barrier';
  return { escalate, result: r1, raw: first.json, skeptic: second.json, confirmed: escalate };
}

// FALSE-BARRIER REDUCER (the intended use): a deterministic FAIL is reviewed by a focused check — "is this flagged
// barrier actually EXEMPT / acceptable?" — and CLEARED to a pass on the check's BEST JUDGMENT (a 'clear' that is not
// low-confidence). The goal is to PREVENT false positives, so we trust a reasonably-confident judgment rather than
// demanding near-certainty (high-only cleared almost nothing). The remaining false-CLEAR guard is the prompt: each
// check defaults to 'barrier'/'uncertain' when genuinely unsure. Touches only fails ⇒ can only LOWER false-barriers.
// Returns { clear, ... }.
async function resolveClear(checkId, evidence) {
  const c = CHECKS[checkId]; if (!c) return { clear: false, result: 'uncertain', error: 'no-such-check:' + checkId };
  const r = await callClaude(c.build(evidence));
  if (r.error) return { clear: false, result: 'uncertain', error: r.error };
  const result = c.parse(r.json);
  return { clear: result === 'clear' && (!r.json || r.json.confidence !== 'low'), result, raw: r.json };
}

module.exports = { resolveCheck, resolveEscalation, resolveClear, callClaude, CHECKS, escalates, clears };
