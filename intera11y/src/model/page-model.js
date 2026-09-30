'use strict';
// PageModel: the page as read once, before anything drives it. The element inventory (inpage.collectElements)
// joined with the browser's computed accessibility tree (CDP), plus a viewport screenshot.
const { collectElements } = require('./inpage.js');
const { axeFacts } = require('./axe.js');

const MAX_ELEMENTS = 20000;
const AX_PROPS = ['focusable', 'focused', 'editable', 'expanded', 'checked', 'selected', 'pressed', 'disabled',
  'required', 'invalid', 'hidden', 'modal', 'haspopup', 'level', 'valuenow', 'valuetext', 'readonly', 'multiselectable', 'autocomplete'];

async function computedAx(page) {
  const cdp = await page.createCDPSession();
  try {
    await cdp.send('DOM.enable').catch(() => {});
    await cdp.send('Accessibility.enable').catch(() => {});
    const snap = await cdp.send('DOMSnapshot.captureSnapshot', { computedStyles: [] });
    const strings = snap.strings;
    const idByBackend = new Map();
    for (const doc of snap.documents) {
      const n = doc.nodes;
      for (let i = 0; i < n.backendNodeId.length; i++) {
        const attrs = n.attributes[i] || [];
        for (let k = 0; k + 1 < attrs.length; k += 2) {
          if (strings[attrs[k]] === 'data-ia-id') { idByBackend.set(n.backendNodeId[i], Number(strings[attrs[k + 1]])); break; }
        }
      }
    }
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const ax = new Map();
    for (const node of nodes) {
      const id = idByBackend.get(node.backendDOMNodeId);
      if (!id) continue;
      const props = {};
      for (const p of node.properties || []) if (AX_PROPS.includes(p.name)) props[p.name] = p.value && p.value.value;
      const nameSrc = ((node.name && node.name.sources) || []).find((s) => s.value && s.value.value);
      const entry = {
        role: node.role && node.role.value,
        name: (node.name && node.name.value) || '',
        nameFrom: nameSrc ? (nameSrc.attribute || nameSrc.type) : null,
        description: (node.description && node.description.value) || '',
        ignored: !!node.ignored,
        ...props,
      };
      // a node can appear twice (e.g. a StaticText child keyed to the same element); keep the non-ignored one
      const prev = ax.get(id);
      if (!prev || (prev.ignored && !entry.ignored)) ax.set(id, entry);
    }
    return ax;
  } finally { await cdp.detach().catch(() => {}); }
}

async function buildPageModel(page) {
  const inv = await page.evaluate(collectElements, MAX_ELEMENTS);
  const ax = await computedAx(page).catch(() => new Map());
  for (const e of inv.elements) e.ax = ax.get(e.id) || null;
  const screenshot = await page.screenshot({ type: 'png', encoding: 'base64' }).catch(() => null);
  const axe = await axeFacts(page);
  const byXpath = new Map(inv.elements.map((e) => [e.xpath, e]));
  return {
    doc: inv.doc,
    truncated: inv.truncated,
    elements: inv.elements,
    byXpath,
    screenshot,
    axe,
    get(xpath) { return byXpath.get(xpath) || null; },
  };
}

// Is the element one a user can perceive at all (sighted or AT)? Shared by every criterion's applicability.
function isRendered(e) { return !!(e && e.rendered && !e.inert); }
function isPerceivableVisually(e) { return isRendered(e) && e.boxed && !e.visuallyHidden && !e.clippedOut; }
// in view now, or brought into view by scrolling a region of the page (a carousel slide, a scrolled list)
function isReachableVisually(e) { return isPerceivableVisually(e) || !!(isRendered(e) && e.boxed && !e.visuallyHidden && e.revealedByScrolling); }
function isExposedToAT(e) { return isRendered(e) && !e.ariaHiddenSelf && !e.ariaHiddenAncestor && !(e.ax && e.ax.ignored); }

module.exports = { buildPageModel, isRendered, isPerceivableVisually, isReachableVisually, isExposedToAT };
