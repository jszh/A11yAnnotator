'use strict';
// The single seam through which InterA11y reuses the v3 harness. Everything imported here is a self-contained
// measurement: a pure in-page function, a Puppeteer driver `(page, opts)`, or a live inspection tool
// `(page, args, ctx)`. None of the v3 obligation / disposition / scheduling machinery is used.
const path = require('path');
const V3 = path.join(__dirname, '..', '..', '..', 'scripts', 'v3', 'lib');
const req = (m) => require(path.join(V3, m));

const settle = req('settle.js');
const kbd = req('kbd-graph.js');
const tools = req('cdp-tools.js');
const adapter = req('llm-agent-adapter.js');
const order = req('order-check.js');
const colour = require(path.join(V3, '..', '..', 'lib', 'a11y-eval.js'));

module.exports = {
  // dated Gemini price table (3.7 Flash promotional rates change on 2027-01-01)
  geminiCostUsd: adapter.geminiCostUsd,
  // settling
  awaitSettle: settle.awaitSettle,
  awaitFocusSettle: settle.awaitFocusSettle,
  // keyboard detectors (BAGEL/LOTUS-derived, adversarially validated in v3)
  detectKeyboardTraps: kbd.detectKeyboardTraps,
  detectFocusRetentionTraps: kbd.detectFocusRetentionTraps,
  detectFixedSetConfinementTraps: kbd.detectFixedSetConfinementTraps,
  detectFocusRejection: kbd.detectFocusRejection,
  // colour maths (WCAG relative luminance / contrast ratio)
  parseRGB: colour.parseRGB,
  contrastRatio: colour.contrastRatioRaw,
  // tab order vs visual order, column-aware (sound on multi-column layouts and card grids)
  visualOrderDivergence: order.visualOrderDivergence,
  // live inspection tools the judge can call
  toolHandlers: {
    query_ax_node: tools.queryAxNode,
    observe_state_after_activation: tools.observeStateAfterActivation,
    interact_and_observe: tools.interactAndObserve,
    set_state_and_capture: tools.setStateAndCapture,
    measure_geometry_live: tools.measureGeometryLive,
    request_hi_res_crop: tools.requestHiResCrop,
    measure_text_contrast_over_image: tools.measureTextContrastOverImage,
    resolve_destination: tools.resolveDestination,
    compare_named_regions: tools.compareNamedRegions,
    probe_screen_reader_after_action: tools.probeScreenReaderAfterAction,
    render_with_overrides: tools.renderWithOverrides,
    compute_contrast_ratio: tools.computeContrastRatio,
    resolve_part_color: tools.resolvePartColor,
    capture_full_page: tools.captureFullPage,
    compare_iframe_content: tools.compareIframeContent,
  },
  // the tools' JSON-schema declarations (name → declaration), taken from v3 so descriptions stay in one place
  toolDeclarations() {
    const d = tools.buildCdpToolDispatch({ page: null, freshClone: null });
    return Object.fromEntries(d.declarations.map((x) => [x.name, x]));
  },
};
