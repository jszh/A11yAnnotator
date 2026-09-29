'use strict';
// 1.1.1 Non-text Content — non-text content presented to the user has a text alternative that serves the
// equivalent purpose; decorative content is implemented so assistive technology can ignore it.
const S = require('../screen/select.js');
const { toolsOf } = require('../judge/rubric.js');

const EMBEDS_RESOURCE = /^<(object|embed)\b[^>]*\s(data|src)\s*=\s*["']?[^"'\s>]/i;
function presented(e) {
  if (!e) return true;
  const area = e.rect ? e.rect.w * e.rect.h : 0;
  if (e.boxed && area > 9) return true;
  return area === 0 && EMBEDS_RESOURCE.test(e.openTag || '');
}

const FILENAME = /\.(png|jpe?g|gif|svg|webp|avif|bmp|ico)(\?|$)|^(img|image|photo|picture|graphic|icon|logo|banner|spacer)[\s_-]?\d*$/i;

module.exports = {
  sc: '1.1.1', title: 'Non-text Content',
  probes: ['content'],
  tools: toolsOf('1.1.1'),
  // screening sweep: the element kinds it reads (its test rules are the criterion's rules)
  screen: { select: S.images },

  // content presented to users: it occupies more than a 3×3 px box (smaller is a tracking pixel). An embedded object
  // that references a resource yet has no box has not rendered that resource here, so its size says nothing about
  // what the author presents (ACT 8fc3b6): size does not exclude it.
  applies: (e) => presented(e),
  applicability: 'The element occupies at most a 3×3 px box: it is not presented to users (a tracking pixel or utility object).',

  identify(model, { content }) {
    const out = (content.images || []).map((im) => ({ xpath: im.xpath, kind: im.kind, im, el: model.get(im.xpath) }));
    for (const l of content.lookalikes || []) out.push({ xpath: l.xpath, kind: 'lookalike-glyphs', l });
    return out;
  },

  assess(c) {
    if (c.kind === 'lookalike-glyphs') return { status: 'OPEN', rule: 'lookalike-glyphs' };
    const im = c.im, e = c.el || {}, ax = e.ax || {};
    const hidden = im.ariaHidden || im.presentational || ax.ignored || im.alt === '';
    if (im.box && im.box.w * im.box.h <= 9 && !(c.el && presented(c.el))) return { status: 'NOT_APPLICABLE', rule: 'tracking-pixel', reason: 'A 1–3 px image is not presented to users.' };
    if (im.tag === 'canvas' && im.blankCanvas === true) return { status: 'NOT_APPLICABLE', rule: 'blank-canvas', reason: 'The canvas has no painted pixel: it presents no content.' };
    if (im.kind === 'media') return { status: 'OPEN', rule: 'media-identification' };
    if (hidden) return { status: 'OPEN', rule: 'marked-decorative' };                       // is it really decorative? (e88epe)
    const name = String(ax.name || '').trim();
    // an <object> may render fallback content carrying its own alternative — judged, not decided here
    const needsName = im.kind === 'image-button' || im.tag === 'img' || im.role === 'img' || (im.tag === 'svg' && im.role === 'img') || (im.tag === 'area' && !String(im.alt || '').trim());
    if (needsName && !name && !(im.inControl && im.inControl.text)) {
      return { status: 'FAIL', rule: 'no-text-alternative', reason: `This ${im.kind === 'image-button' ? 'image button' : im.tag} is exposed to assistive technology with no text alternative (no alt, aria-label or title), so its content or function is not available as text (ACT ${im.kind === 'image-button' ? '59796f' : im.tag === 'svg' ? '7d6734' : im.tag === 'object' ? '8fc3b6' : '23a2a8'}).` };
    }
    if (name && FILENAME.test(name)) return { status: 'FAIL', rule: 'filename-or-placeholder', reason: `The text alternative "${name}" is a file name or placeholder, not an alternative (F30).` };
    return { status: 'OPEN', rule: 'alternative-to-judge' };
  },

  evidence(c) {
    if (c.kind === 'lookalike-glyphs') return { facts: { word: c.l.word, codepoints: c.l.codepoints, note: 'letters from different scripts mixed in one word render like a real word but are read out as other characters' } };
    const im = c.im, e = c.el || {}, ax = e.ax || {};
    return {
      facts: {
        kind: im.kind, tag: im.tag, altAttribute: im.alt, role: im.role, computedName: ax.name, nameFrom: ax.nameFrom, ignoredByAssistiveTech: ax.ignored || im.ariaHidden || im.presentational || undefined,
        source: im.src, title: im.title || undefined, svgTitle: im.svgTitle || undefined, caption: im.caption || undefined,
        insideControl: im.inControl || undefined, textAround: im.nearbyText, size: im.box ? `${im.box.w}×${im.box.h}` : undefined,
      },
      images: im.image ? [{ label: 'the image as rendered', data: im.image }] : [],
    };
  },
};
