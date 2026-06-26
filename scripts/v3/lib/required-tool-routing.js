'use strict';
// C7 — route the existing CDP tools as REQUIRED evidence (not LLM-discretionary). Phase 1: several deterministic
// tools EXIST + are SC-routed but the rubric only ever sees them if the (often inert) LLM lane chooses to call them.
// This declares, per facet, the tool whose result the rubric must REQUIRE before deciding (abstain without it), so
// the deterministic evidence is provisioned regardless of LLM discretion.
const { TOOL_CATALOG } = require('./cdp-tool-catalog.js');

// facet → { sc, tool, why }. The runner/orchestrator should invoke the tool and attach its result as required evidence.
const REQUIRED_TOOL_ROUTING = Object.freeze([
  { sc: '1.4.1', tool: 'render_with_overrides', mode: 'grayscale', why: 'use-of-color: confirm a colour cue SURVIVES grayscale/CVD deterministically, not by the LLM eyeballing' },
  { sc: '1.4.5', tool: 'ocr_image_text', why: 'images-of-text: OCR the rendered text to compare against the alt/accessible name, instead of the LLM guessing' },
  { sc: '1.4.3', tool: 'compute_contrast_ratio', why: 'text contrast over a reducible flat backdrop should be COMPUTED, not eyeballed' },
  { sc: '1.4.11', tool: 'resolve_part_color', why: 'non-text contrast of a part/indicator vs its adjacent surface — the rendered used-colour, computed' },
  { sc: '2.4.4', tool: 'resolve_destination', why: 'same-named links: resolve the REAL settled destination (required + cross-origin), not the raw href' },
]);

function requiredToolFor(sc) { return REQUIRED_TOOL_ROUTING.filter((r) => r.sc === sc); }
// verify each routed tool is actually REGISTERED in the catalog (fails safe / catches drift)
function verifyRouting() {
  const names = new Set(TOOL_CATALOG.map((t) => t.name));
  return REQUIRED_TOOL_ROUTING.map((r) => ({ ...r, registered: names.has(r.tool), scRouted: TOOL_CATALOG.some((t) => t.name === r.tool && t.scs.includes(r.sc)) }));
}

module.exports = { REQUIRED_TOOL_ROUTING, requiredToolFor, verifyRouting };
