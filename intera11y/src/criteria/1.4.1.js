'use strict';
// 1.4.1 Use of Color — colour is not the only visual means of conveying information, indicating an action,
// prompting a response, or distinguishing a visual element.
const { errorCandidates, errorTexts, formImages } = require('./forms-common.js');
const S = require('../screen/select.js');
const { toolsOf } = require('../judge/rubric.js');

// state differences that are not colour (width/height/font-size are excluded: peers differ in size because
// their labels differ)
const NON_COLOUR = ['font-weight', 'font-style', 'text-decoration-line', 'text-decoration-style', 'border-top-width', 'border-bottom-width', 'border-left-width', 'border-right-width', 'border-top-style', 'border-bottom-style', 'outline-style', 'outline-width', 'box-shadow', 'transform', 'background-image', 'list-style-type', 'content'];

function nonColourCues(d) {
  const cues = [];
  for (const part of [d, d.before, d.after].filter(Boolean)) for (const [p, v] of Object.entries(part.other || {})) if (NON_COLOUR.includes(p)) cues.push(`${part === d ? '' : part === d.before ? '::before ' : '::after '}${p}: ${v.on} (on) vs ${v.off} (off)`);
  if (d.iconDiffers) cues.push('an icon/image present on one state only');
  return cues;
}

module.exports = {
  sc: '1.4.1', title: 'Use of Color',
  probes: ['styles', 'forms'],
  tools: toolsOf('1.4.1'),
  // screening sweep: the element kinds it reads (its test rules are the criterion's rules)
  screen: { select: S.any(S.links, S.formish, S.images, S.stateful, S.interactive) },

  identify(model, { styles, forms }) {
    const out = [];
    for (const l of styles.links || []) out.push({ xpath: l.xpath, kind: 'link-in-text', l });
    for (const p of styles.peers || []) out.push({ xpath: p.on, kind: 'state-among-peers', p });
    for (const g of styles.graphics || []) out.push({ xpath: g.xpath, kind: 'graphic', g });
    // a form field whose error is shown only by a change of colour: no text tied to that field (a page-level
    // message does not say which field)
    for (const c of errorCandidates(forms && forms.forms)) {
      if (c.kind !== 'flagged-field') continue;
      if (errorTexts(c).some((t) => /aria-describedby|aria-errormessage|browser validation|label changed/.test(t.via))) continue;
      out.push({ xpath: c.xpath, kind: 'error-shown-by-colour', fc: c });
    }
    return out;
  },

  assess(c) {
    if (c.kind === 'link-in-text') {
      const l = c.l;
      if (l.cuesAtRest.length) return { status: 'PASS', rule: 'link-has-non-colour-cue', reason: `The link is distinguished from the surrounding text by more than colour: ${l.cuesAtRest.join('; ')}.` };
      // the link has the text's own colour: colour conveys nothing here, so this criterion does not apply
      if (l.contrastWithText !== null && l.contrastWithText < 1.1 && l.linkColour === l.textColour) return { status: 'NOT_APPLICABLE', rule: 'no-colour-difference', reason: `The link is drawn in the same colour as the surrounding text (${l.linkColour}); colour is not used to distinguish it.` };
      if (l.contrastWithText !== null && l.contrastWithText >= 1.1 && l.contrastWithText < 3) return { status: 'FAIL', rule: 'link-colour-only', reason: `The link differs from the surrounding text only by colour (${l.linkColour} vs ${l.textColour}, contrast ${l.contrastWithText}:1 < 3:1) and has no underline or other non-colour cue (F73).` };
      if (l.contrastWithText !== null && l.cuesOnHover?.length && l.cuesOnFocus?.length) return { status: 'PASS', rule: 'link-contrast-and-state-cue', reason: `The link colour contrasts ${l.contrastWithText}:1 with the surrounding text and a non-colour cue appears on hover (${l.cuesOnHover.join('; ')}) and focus (G183).` };
      return { status: 'OPEN', rule: 'link-cue-to-judge' };
    }
    if (c.kind === 'state-among-peers') {
      if (c.p.how === 'label-colour-group' && c.p.requiredMarkedInText) return { status: 'PASS', rule: 'marked-in-text', reason: 'The differently coloured labels also carry a text marker (an asterisk or the word "required").' };
      const cues = nonColourCues(c.p.diff);
      if (cues.length) return { status: 'PASS', rule: 'state-has-non-colour-cue', reason: `The "on" item differs from its peers by more than colour: ${cues.join('; ')}.` };
      if (!Object.keys(c.p.diff.colour).length) return { status: 'NOT_APPLICABLE', rule: 'no-visual-state-difference', reason: 'The "on" item and its peer render identically; colour is not what distinguishes them (whether the state is shown at all is not a colour question).' };
      // an item marked among its peers: a difference in lightness of at least 3:1 survives without hue (Understanding
      // 1.4.1: colour is hue; G183's 3:1 relative-luminance threshold), so the item is still told apart. Not for
      // labels coloured to mean "required" — there the question is what the colour means, not whether it differs (F81).
      const strong = c.p.how === 'label-colour-group' ? [] : Object.entries(c.p.colourRatios || {}).filter(([, r]) => r >= 3);
      if (strong.length) return { status: 'PASS', rule: 'lightness-difference', reason: `The "on" item differs from its peer in lightness by ${strong.map(([p, r]) => `${r}:1 (${p})`).join(', ')} — at least 3:1, so the difference is visible without hue.` };
      return { status: 'OPEN', rule: 'state-by-colour-only' };
    }
    return { status: 'OPEN', rule: c.kind };
  },

  evidence(c) {
    if (c.kind === 'link-in-text') {
      const l = c.l;
      return { facts: { linkText: l.text, linkColour: l.linkColour, surroundingTextColour: l.textColour, contrastLinkVsText: l.contrastWithText, nonColourCuesAtRest: l.cuesAtRest, onHover: l.cuesOnHover, onFocus: l.cuesOnFocus } };
    }
    if (c.kind === 'state-among-peers') {
      const p = c.p;
      return {
        facts: { onItem: p.on, peerInOffState: p.off, statedBy: p.how === 'label-colour-group' ? `${p.groupSize} form label(s) coloured differently from the other ${p.baseSize} (compared with "${p.optionalLabel}"); their field is required: ${p.fieldRequired}; invalid: ${p.fieldInvalid}; marked in text: ${p.requiredMarkedInText}` : p.how, peers: p.peers, label: p.text, colourDifferences: p.diff.colour, contrastBetweenDifferingColours: p.colourRatios, nonColourDifferences: nonColourCues(p.diff), pseudoElementDifferences: { before: p.diff.before, after: p.diff.after } },
        images: p.image ? [{ label: 'the "on" item and an "off" peer', data: p.image }] : [],
      };
    }
    if (c.kind === 'graphic') return { facts: { graphic: c.g.tag, label: c.g.label, size: c.g.box }, images: c.g.image ? [{ label: 'the graphic', data: c.g.image }] : [] };
    return { facts: { field: c.xpath, note: 'the page flagged this field as in error and no text describes the error', submissions: (c.fc.form.scenarios || []).map((s) => ({ mode: s.mode, fieldsFlagged: s.fieldsFlagged })) }, images: formImages(c.fc) };
  },
};
