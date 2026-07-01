'use strict';
// Per-guideline CDP tool catalog for the LLM-judge prompt (the fix for the FN×LLM finding: tools were OFFERED
// on every call but NEVER invoked because nothing in the prompt told the model it HAD them or WHEN to use them).
//
// When the orchestrator built a live CDP tool server (tools enabled), the adjudicator injects ONLY the tools
// RELEVANT to the subject's SC (the guideline being checked) — each with a compact param + when-to-use line —
// plus a directive to CALL a tool when the supplied crops/signals can't settle the barrier, rather than guess
// or abstain. Selection is SC-primary (every subject carries an SC; precise) with a narrow secondary skill net.
//
// Source of truth for tool NAMES + behavior is cdp-tools.js (buildCdpToolServer). This is the prompt-facing
// CURATION layer, kept in sync by name — a name here that cdp-tools.js does not register simply never resolves
// (the SDK ignores an unknown tool), so drift fails safe (the model is told about a tool it cannot call), but
// the regression test cross-checks the two lists so drift is caught.

const TOOL_CATALOG = Object.freeze([
  Object.freeze({ name: 'query_ax_node', params: 'targetXpath | x,y',
    when: 'confirm a node\'s COMPUTED role / accessible-name provenance (nameFrom) / aria-labelledby-describedby IDREF resolution / required states / aria-hidden — when the deterministic signal is ambiguous or the visual role may not match the computed one. For a node IN A TABLE CELL it also returns cellHeaders (the cell\'s associated column/row HEADER text, headerSource, danglingHeaderIds): the programmatic header CONTEXT — for 1.3.1 to check the cell\'s header wiring, and for 2.4.4 to read a link-in-a-cell\'s row/column header as its enclosing context',
    scs: ['4.1.2', '4.1.3', '1.3.1', '2.4.4', '2.4.6', '2.1.1'], skills: ['name-role-state', 'dynamic-announcement'] }),
  Object.freeze({ name: 'observe_state_after_activation', params: 'targetXpath',
    when: 'activate ONE control and see the OBJECTIVE before/after delta — each newly-visible text, whether it landed in a PRE-EXISTING live region (a region created WITH its message is not a reliable announcement), and whether focus moved. Also for 3.3.1: submit/activate and observe whether an error MESSAGE actually appears in text (do not assume from the resting form). Also for 2.1.2: activate a help control inside a keyboard trap to REVEAL a buried escape advisory ("Press Ctrl+M to Exit")',
    scs: ['4.1.3', '3.3.1', '2.1.2'], skills: ['dynamic-announcement', 'keyboard-operability'] }),
  Object.freeze({ name: 'probe_screen_reader_after_action', params: 'triggerXpath',
    when: 'read the VERBATIM screen-reader announcement queue after activating a control — the only direct datum for whether a status update is actually announced (4.1.3) or an error identified (3.3.1)',
    scs: ['4.1.3', '3.3.1'], skills: ['dynamic-announcement'] }),
  Object.freeze({ name: 'interact_and_observe', params: 'actions:[{op:type|click|press|focus|clear|hover|move|drag, xpath?, toXpath?, text?, key?, holdMs?}] (≤16)',
    when: 'drive a SHORT primitive SEQUENCE on a fresh clone (navigation/submit BLOCKED) and read one before/after delta + per-step revealedNow/activeAfter. 2.1.2 keyboard trap — verify a documented escape: [{op:focus,xpath:trapped},{op:press,key:"Ctrl+M"}] then read step.activeAfter (OUTSIDE the trap ⇒ working escape). 1.4.13 F95 hoverability — [{op:hover,xpath:trigger},{op:move,xpath:tooltip}] then compare step.revealedNow (tooltip present after hover but GONE after the travel ⇒ a gap = not hoverable); dismissible — [{op:hover,xpath:trigger},{op:press,key:"Escape"}] ⇒ revealedNow emptied. 2.1.1 hover-only reveal + drag (op:drag, xpath→toXpath) + keystroke-timing (press holdMs). 3.3.1/3.3.3 form errors (clear+type-invalid+submit ⇒ invalidFields). Verify, do not trust the JS source',
    scs: ['2.1.2', '2.1.1', '3.3.1', '3.3.3', '1.4.13'], skills: ['keyboard-operability', 'forms-instructions-errors', 'color-and-visual-text'] }),
  Object.freeze({ name: 'set_state_and_capture', params: 'targetXpath, state(focus|hover|checked|open|expanded|placeholder-shown)',
    when: 'drive an element into an interaction state and get before/after screenshots + the computed-style delta + stateReached — for a state-specific indicator you cannot see in the resting crop (focus ring, hover-revealed content, checked/open styling)',
    scs: ['1.4.11', '1.4.1', '1.4.3', '2.4.7', '1.4.13', '2.4.11'], skills: ['focus-visibility', 'focus-management'] }),
  Object.freeze({ name: 'measure_geometry_live', params: 'targetXpath, otherXpath?, viewportWidth?',
    when: 'get the box / horizontal overflow + culprit / what OCCLUDES the target / overlap+gap between two boxes — for target-size, reflow (pass viewportWidth), dismissible-overlap, and focus-obscured',
    scs: ['2.5.8', '2.5.5', '1.4.10', '1.4.13', '2.4.11'], skills: ['reflow-and-pointer-affordances'] }),
  Object.freeze({ name: 'request_hi_res_crop', params: 'targetXpath, scale?(2-4)',
    when: 'a small wordmark / chart label / glyph is UNREADABLE in the 1x crop — re-raster the element at higher device scale before deciding (an unreadable crop is never a basis to invent or deny text)',
    scs: ['1.1.1', '1.4.5'], skills: [] }),
  Object.freeze({ name: 'ocr_image_text', params: 'targetXpath | x,y,width,height',
    when: 'OCR text baked into an image you must read to compare against the alt / accessible name or to decide images-of-text; pair with request_hi_res_crop first if the crop is low-res or truncated (empty OCR on a low-res crop is NOT "no text")',
    scs: ['1.4.5', '1.1.1'], skills: [] }),
  Object.freeze({ name: 'compare_named_regions', params: 'targetXpath, regions[{name,x,y,w,h}]',
    when: 'for an image/chart, whether two named regions are perceptibly DISTINCT in colour (ΔE2000) — a colour-encoded distinction the alt omits (1.1.1 F13)',
    scs: ['1.1.1'], skills: [] }),
  Object.freeze({ name: 'render_with_overrides', params: 'transform(grayscale|protanopia|deuteranopia|tritanopia|forced-colors|no-author-css), targetXpath?',
    when: 'check whether a load-bearing colour cue SURVIVES grayscale/CVD (use-of-color) or forced-colors / no-author-css',
    scs: ['1.4.1'], skills: [] }),
  Object.freeze({ name: 'compute_contrast_ratio', params: 'nodeAXpath, nodeBXpath, threshold?',
    when: 'the WCAG contrast ratio for TWO FLAT used-colours you choose — the TEXT node vs its solid background for 1.4.3 (compute it, do NOT eyeball the crop), or an in-text link colour vs surrounding text for 1.4.1 (G183). It reads RENDERED used-colours, so it is sound where the collector cannot be. REFUSES translucent/gradient/photo backdrops — for those use measure_text_contrast_over_image',
    scs: ['1.4.3', '1.4.1', '1.4.11'], skills: [] }),
  Object.freeze({ name: 'measure_text_contrast_over_image', params: 'targetXpath, threshold?',
    when: 'text sits over a background IMAGE or GRADIENT (no single flat backdrop colour, so compute_contrast_ratio refuses): get the PER-PIXEL worst-case contrast UNDER the glyphs — worstCaseRatio/fractionBelowThreshold/worstCasePasses. WCAG requires ALL text meet the threshold, so a low-contrast region fails even when most of the text passes; the deterministic answer to "least contrast per letter over an image" (1.4.3)',
    scs: ['1.4.3'], skills: [] }),
  Object.freeze({ name: 'resolve_part_color', params: 'x, y',
    when: 'the CSS used-colour AND the rendered pixel of a NON-TEXT part (border/indicator/SVG fill) or the backdrop pixel directly under glyphs — when CSS and rendered pixel may diverge, or no single flat colour is sound (gradient/opacity)',
    scs: ['1.4.11', '1.4.1', '1.4.3'], skills: [] }),
  Object.freeze({ name: 'resolve_destination', params: 'linkXpath | linkXpaths[] (the SET of same-named links)',
    when: 'follow a SAME-ORIGIN link to its SETTLED destination (after redirects) and get a per-field byte-equality grid — for 2.4.4 when same-named links may resolve to DIFFERENT places. Raw hrefs are NOT reliable (a redirect/SPA route can diverge); this resolves the REAL destination',
    scs: ['2.4.4'], skills: [] }),
  Object.freeze({ name: 'compare_iframe_content', params: 'iframeXpath | iframeXpaths[] (the SET of same-named iframes)',
    when: 'for 4.1.2 (ACT 4b1c6c) when two or more iframes share an accessible name with DIFFERENT srcs — read each one\'s RENDERED same-origin content (title/h1/text) + a per-field equality grid, so you judge whether they serve an EQUIVALENT purpose from CONTENT, not from the raw src string (page-one.html vs page-two.html look interchangeable but render different content)',
    scs: ['4.1.2'], skills: [] }), // SC-4.1.2-only (no skill key) so it does not leak onto every name-role-state SC
  // NEW (full-page capture, cdp-tools.js capture_full_page): the one gap the FN run surfaced — no below-fold view.
  Object.freeze({ name: 'capture_full_page', params: 'targetXpath? (else whole document)',
    when: 'a FULL-PAGE screenshot beyond the viewport / below the fold — to confirm an OFF-VIEWPORT heading or element exists and WHERE it sits relative to content (does an h1 actually introduce the prose, or sit over the nav/TOC?), for section-headings / reading-order / page structure',
    scs: ['2.4.10', '2.4.6', '1.3.1', '2.4.2', '2.4.3', '1.3.2'], skills: ['page-structure', 'grouping-and-reading-order'] }),
]);

// The tools relevant to ONE subject (SC-primary; skill is a secondary, deliberately-narrow net).
function toolsForSubject(sc, skill) {
  return TOOL_CATALOG.filter((t) => (sc && t.scs.includes(sc)) || (skill && t.skills.length && t.skills.includes(skill)));
}

// The prompt block (returns null when no tool applies, so non-tool SCs add nothing).
function renderToolGuidance(tools) {
  if (!Array.isArray(tools) || !tools.length) return null;
  return [
    '--- LIVE INSPECTION TOOLS (callable NOW, before you answer) ---',
    'You have the live page open. If the supplied crops + deterministic signals are INSUFFICIENT to confirm OR rule out the barrier — you cannot read small/blurry text, cannot confirm a computed role or name, cannot see a link\'s real destination, cannot tell whether an off-viewport element exists or where it sits, cannot judge a state-specific (focus/hover/checked) indicator — CALL the relevant tool below and gather that evidence BEFORE deciding. Do NOT guess from an unreadable crop, and do NOT settle for PARTIAL when a tool could resolve it. Each tool returns RAW facts/pixels, never a verdict — the judgment stays yours; honour "absence ≠ pass". Skip the tools when the evidence you already have settles the case.',
    ...tools.map((t) => `- ${t.name}(${t.params}) — ${t.when}.`),
  ].join('\n');
}

module.exports = { TOOL_CATALOG, toolsForSubject, renderToolGuidance };
