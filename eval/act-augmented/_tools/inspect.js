#!/usr/bin/env node
// Raw-signal CDP/Puppeteer inspector for ACT-augmentation test pages.
//
// DESIGN NOTE (read before trusting output): this tool asserts NO pass/fail verdict
// of its own. It is deliberately thin, and it deliberately does NOT run axe/WAVE/
// Lighthouse — this corpus targets issues that automated checkers CANNOT detect, so
// an automated checker is the wrong oracle here. It surfaces only raw browser truth
// so the reviewing agent can REASON over what an AT user actually receives:
//   * Chromium's own accessibility tree (Accessibility.getFullAXTree via Puppeteer)
//     — this is exactly what assistive technology consumes; authoritative for name/role/value.
//   * raw window.getComputedStyle values and getBoundingClientRect — browser truth,
//     reported verbatim with NO derived ratio/threshold judgment.
//   * tab/focus order with raw focus-style values; document lang/title; JS errors.
// Any conclusion (does the issue exist? is the outcome right? does it need human
// judgment?) must be made by the agent from the page source + these raw signals +
// the WCAG/ACT/technique text — NOT by this script. Not a validated checker.
//
// Usage:
//   node inspect.js --file path/to/case.html [--selector "CSS"] [--shotdir DIR]
//                   [--maxtab 25] [--no-shots]
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return (v === undefined || v.startsWith('--')) ? true : v;
}

const REPO = path.join(__dirname, '..', '..', '..');
const file = arg('file');
if (!file) { console.error('need --file'); process.exit(2); }
const abs = path.resolve(file);
const selector = arg('selector', null);
const maxtab = parseInt(arg('maxtab', '25'), 10);
const noShots = !!arg('no-shots', false);
const shotdir = arg('shotdir', path.join(path.dirname(abs), '_shots', path.basename(abs, '.html')));
if (!noShots) fs.mkdirSync(shotdir, { recursive: true });

(async () => {
  const out = {
    file: path.relative(REPO, abs),
    _disclaimer: 'RAW BROWSER SIGNALS ONLY (Chromium AX tree + getComputedStyle + tab order). No automated checker is run on purpose. This tool asserts no verdict; reason over the page source + these signals + the WCAG/ACT text yourself.',
    ok: true, screenshots: {}, notes: [],
  };
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errs.push('console:' + m.text()); });
    await page.goto('file://' + abs, { waitUntil: 'networkidle0', timeout: 20000 });
    out.jsErrors = errs;
    out.title = await page.title();
    out.lang = await page.evaluate(() => document.documentElement.getAttribute('lang'));

    if (!noShots) {
      const p = path.join(shotdir, 'default.png');
      await page.screenshot({ path: p, fullPage: true });
      out.screenshots.default = path.relative(REPO, p);
    }

    // ---- Chromium accessibility tree (authoritative for name/role) ----
    try { out.axTree = await page.accessibility.snapshot({ interestingOnly: false }); }
    catch (e) { out.axTree = { error: String(e) }; }

    // ---- Tab-order walk: raw focused-element facts (no judgment on visibility) ----
    const tab = [];
    try {
      await page.evaluate(() => { document.body && document.body.focus(); });
      for (let i = 0; i < maxtab; i++) {
        await page.keyboard.press('Tab');
        const info = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const cs = getComputedStyle(el);
          return {
            tag: el.tagName.toLowerCase(), role: el.getAttribute('role') || null,
            id: el.id || null, name: (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().slice(0, 50),
            // raw style values that bear on focus visibility — reported, not judged
            outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor,
            boxShadow: cs.boxShadow, border: cs.border,
          };
        });
        tab.push(info === null ? { stop: i, focused: 'body/none' } : { stop: i, ...info });
      }
    } catch (e) { out.notes.push('tabwalk error ' + e); }
    out.tabOrder = tab;

    // ---- Selector deep-dive: RAW computed style + AX name/role; NO derived ratio ----
    if (selector) {
      try {
        const sel = await page.evaluate((s) => {
          const el = document.querySelector(s);
          if (!el) return { error: 'selector not found' };
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          // first ancestor with a non-transparent background (reported raw for the agent to reason about)
          let bg = null, node = el;
          while (node) { const c = getComputedStyle(node).backgroundColor; if (c && !/rgba?\(0, 0, 0, 0\)|transparent/.test(c)) { bg = c; break; } node = node.parentElement; }
          const attrs = {}; for (const a of el.attributes) attrs[a.name] = a.value;
          return {
            tag: el.tagName.toLowerCase(), attrs,
            computed: {
              color: cs.color, backgroundColor: cs.backgroundColor, effectiveAncestorBg: bg,
              fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontStyle: cs.fontStyle,
              display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
              position: cs.position, outline: cs.outline, boxShadow: cs.boxShadow,
            },
            box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
            text: (el.textContent || '').trim().slice(0, 120),
            innerHTML: el.innerHTML.slice(0, 300),
          };
        }, selector);
        if (!sel.error) {
          try {
            const node = await page.$(selector);
            const snap = await page.accessibility.snapshot({ interestingOnly: false, root: node });
            sel.ax = snap ? { role: snap.role, name: snap.name, value: snap.value, disabled: snap.disabled, hidden: snap.hidden } : null;
          } catch (_) {}
        }
        out.selector = { query: selector, ...sel };
      } catch (e) { out.selector = { error: String(e) }; }
    }

    await browser.close();
  } catch (e) {
    out.ok = false; out.error = String(e);
    if (browser) try { await browser.close(); } catch (_) {}
  }
  process.stdout.write(JSON.stringify(out, null, 2));
})();
