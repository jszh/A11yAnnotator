#!/usr/bin/env node
// Shared verification harness for checking findings.js issues against the saved
// snapshots. Read-only. Loads a saved page in headless Chrome (same snapshot the
// annotator serves), then runs any combination of:
//   --axe [rule1,rule2,...]   run axe-core; optional comma rule filter
//   --eval "<js>"             eval a function BODY in page context; JSON result
//   --shot <out.png>          full-page screenshot to /tmp (or --sel clip)
//   --sel "<css>"            element screenshot (clip to first match) + info
//   --xpath "<xpath>"        resolve xpath -> outerHTML + box + role/name/styles
//
// Usage (MUST run from the project dir so node_modules resolves):
//   node scripts/verify-finding.js --file "NFL on ESPN ... .htm" --axe image-alt
//   node scripts/verify-finding.js --file "sweetgreen_Menu.htm" --sel ".badge" --shot sg.png
//   node scripts/verify-finding.js --file "X.htm" --eval "return document.title"
//
// Pages are served by the already-running annotator server on :3001 so the
// network damper / console guard / yahoo mocks apply exactly as in the tool.

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { assetUrlUnder } = require('./lib/asset-paths.js'); // centralized page-location resolution

const ROOT = path.join(__dirname, '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://127.0.0.1:3001';
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const has = (n) => args.includes('--' + n);

const FILE = opt('file');
if (!FILE) { console.error('need --file "<saved file name>"'); process.exit(2); }
const WAIT = opt('wait', 'domcontentloaded');      // or 'load' / 'networkidle2'
const SETTLE = parseInt(opt('settle', '1200'), 10); // extra ms after load for SPA hydration
const VIEWPORT = opt('viewport', '1280x900');       // WxH; or e.g. 320x900 for reflow checks
const ZOOM = parseFloat(opt('zoom', '1'));          // deviceScaleFactor-independent CSS zoom

// Serve through the annotator's offline pipeline. SPA snapshots flagged
// "noscript" in pages.json blank their SSR DOM when their own JS runs offline —
// auto-detect the flag so we verify the DOM the annotator actually shows.
// Override with --noscript (force) or --scripts (force scripts on).
function isNoscriptFlagged(file) {
  try {
    const pj = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/pages.json'), 'utf8'));
    const list = Array.isArray(pj) ? pj : pj.pages;
    return !!(list || []).find(p => p.file === file && p.noscript);
  } catch (e) { return false; }
}
const NOSCRIPT = has('noscript') ? true : has('scripts') ? false : isNoscriptFlagged(FILE);

function contrast(rgb1, rgb2) {
  const L = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const a = L(rgb1), b = L(rgb2); const hi = Math.max(a, b), lo = Math.min(a, b);
  return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
}

(async () => {
  const [vw, vh] = VIEWPORT.split('x').map(Number);
  const out = { file: FILE, viewport: VIEWPORT, noscript: NOSCRIPT };
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  // Deny downloads — saved pages' auth/SDK iframes (Reebok /authorize, MS
  // silentauth/bscframe) otherwise drop 0-byte files into ~/Downloads.
  try { const _bc = await browser.target().createCDPSession(); await _bc.send('Browser.setDownloadBehavior', { behavior: 'deny' }); } catch (e) {}
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1 });
    page.on('pageerror', () => {});
    // --forced-colors / --reduced-motion: emulate the CSS media features (Windows
    // High Contrast, reduced motion). forced-colors must go through raw CDP —
    // puppeteer's emulateMediaFeatures rejects it as "Unsupported"; DevTools'
    // own rendering panel uses Emulation.setEmulatedMedia, which accepts it.
    if (has('forced-colors') || has('reduced-motion')) {
      const features = [];
      if (has('forced-colors')) features.push({ name: 'forced-colors', value: 'active' });
      if (has('reduced-motion')) features.push({ name: 'prefers-reduced-motion', value: 'reduce' });
      try { const cdp = await page.createCDPSession(); await cdp.send('Emulation.setEmulatedMedia', { features }); out.emulatedMedia = features; }
      catch (e) { out.emulatedMediaError = e.message; }
    }
    const url = assetUrlUnder(BASE, FILE) + '?offline=1' + (NOSCRIPT ? '&noscript=1' : '');
    await page.goto(url, { waitUntil: WAIT, timeout: 45000 }).catch(e => { out.gotoError = e.message; });
    if (ZOOM !== 1) await page.evaluate(z => { document.body.style.zoom = z; }, ZOOM);
    if (SETTLE) await new Promise(r => setTimeout(r, SETTLE));

    if (has('grep')) {
      const re = new RegExp(opt('grep'), 'gi');
      out.grep = await page.evaluate((src) => {
        const r = new RegExp(src, 'gi');
        const html = document.documentElement.outerHTML;
        const m = html.match(r) || [];
        return { count: m.length, samples: [...new Set(m)].slice(0, 5) };
      }, opt('grep'));
    }

    if (has('xpath')) {
      const xp = opt('xpath');
      out.xpath = await page.evaluate((xp) => {
        const r = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (!r) return null;
        const cs = getComputedStyle(r); const b = r.getBoundingClientRect();
        return {
          tag: r.tagName, outerHTML: r.outerHTML.slice(0, 600),
          role: r.getAttribute('role'), ariaLabel: r.getAttribute('aria-label'),
          ariaLabelledby: r.getAttribute('aria-labelledby'), alt: r.getAttribute('alt'),
          text: (r.innerText || '').slice(0, 200), tabindex: r.getAttribute('tabindex'),
          box: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) },
          color: cs.color, background: cs.backgroundColor, outline: cs.outlineStyle + ' ' + cs.outlineWidth,
        };
      }, xp);
    }

    if (has('sel')) {
      const sel = opt('sel');
      out.sel = await page.evaluate((sel) => {
        const els = [...document.querySelectorAll(sel)];
        return { count: els.length, first: els[0] ? { outerHTML: els[0].outerHTML.slice(0, 500), color: getComputedStyle(els[0]).color, background: getComputedStyle(els[0]).backgroundColor } : null };
      }, sel);
    }

    if (has('eval')) {
      try { out.eval = await page.evaluate(new Function(opt('eval'))); }
      catch (e) { out.evalError = e.message; }
    }

    if (has('contrast')) { // --contrast "r,g,b|r,g,b"
      const [a, b] = opt('contrast').split('|').map(s => s.split(',').map(Number));
      out.contrast = contrast(a, b);
    }

    // --pixel-contrast (with --xpath/--sel): sample the REAL composited pixels of
    // the element from a screenshot. getComputedStyle returns only the element's
    // own background, and axe-core reports "incomplete" for background images,
    // gradients, and overlapping/semitransparent layers — this handles all of
    // those because it reads the final rendered pixels. Returns a palette + an
    // estimated text/background pair, and bounds the ratio across background
    // variation (the worst spot a button-over-image actually hits). Always also
    // saves the crop to /tmp so it can be confirmed by eye.
    if (has('pixel-contrast')) {
      let handle = null;
      if (has('xpath')) handle = (await page.evaluateHandle((xp) => document.evaluate(xp, document, null, 9, null).singleNodeValue, opt('xpath'))).asElement();
      else if (has('sel')) handle = await page.$(opt('sel'));
      if (handle) { await handle.scrollIntoView().catch(() => {}); await new Promise(r => setTimeout(r, 200)); }
      const b64 = handle ? await handle.screenshot({ encoding: 'base64' }).catch(() => null) : await page.screenshot({ encoding: 'base64' });
      if (!b64) { out.pixelContrast = { error: 'element not found / not screenshottable' }; }
      else {
        const _s = opt('shot') || 'pixelcrop.png';
        const cropPath = path.isAbsolute(_s) ? _s : '/tmp/' + _s;
        fs.writeFileSync(cropPath, Buffer.from(b64, 'base64'));
        out.pixelContrast = await page.evaluate(async (b64) => {
          const img = new Image(); img.src = 'data:image/png;base64,' + b64;
          try { await img.decode(); } catch (e) { return { error: 'decode failed' }; }
          const w = img.naturalWidth, h = img.naturalHeight;
          const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, w, h).data;
          const buckets = new Map();
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 128) continue;               // skip transparent
            const key = ((data[i] & 0xF0) << 16) | ((data[i + 1] & 0xF0) << 8) | (data[i + 2] & 0xF0);
            buckets.set(key, (buckets.get(key) || 0) + 1);
          }
          const total = [...buckets.values()].reduce((a, b) => a + b, 0) || 1;
          const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
          const cr = (c1, c2) => { const a = lum(c1), b = lum(c2), hi = Math.max(a, b), lo = Math.min(a, b); return +((hi + 0.05) / (lo + 0.05)).toFixed(2); };
          const palette = [...buckets.entries()]
            .map(([k, n]) => ({ rgb: [(k >> 16) & 0xFF, (k >> 8) & 0xFF, k & 0xFF], pct: +(100 * n / total).toFixed(1) }))
            .sort((a, b) => b.pct - a.pct).slice(0, 8);
          const bg = palette[0].rgb;                         // most frequent = background
          const prominent = palette.filter(p => p.pct >= 2);
          // text = the prominent color farthest in luminance from the background
          let text = null, best = -1;
          for (const p of prominent) { const d = Math.abs(lum(p.rgb) - lum(bg)); if (d > best) { best = d; text = p.rgb; } }
          // worst-case bound: text vs every OTHER prominent cluster (the varying
          // background a button-over-image actually overlaps) — exclude the text
          // cluster itself so it can't contrast against itself.
          const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
          const bgCands = prominent.filter(p => text && !same(p.rgb, text));
          const worst = (text && bgCands.length) ? Math.min(...bgCands.map(p => cr(text, p.rgb))) : null;
          return {
            size: { w, h }, palette,
            estimatedText: text, estimatedBg: bg,
            contrastTextVsBg: text ? cr(text, bg) : null,
            worstOverBackground: worst,                        // min over all background clusters
          };
        }, b64);
        out.pixelContrast.crop = cropPath;
      }
    }

    if (has('axe')) {
      await page.addScriptTag({ path: path.join(ROOT, 'axe.min.js') });
      const ruleArg = opt('axe');
      const filter = ruleArg && !ruleArg.startsWith('--') ? ruleArg.split(',') : null;
      const res = await page.evaluate(async (filter) => {
        const cfg = { resultTypes: ['violations'] };
        if (filter) cfg.runOnly = { type: 'rule', values: filter };
        const r = await axe.run(document, cfg);
        return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 3).map(n => ({ target: n.target, html: (n.html || '').slice(0, 200) })) }));
      }, filter);
      out.axe = res;
    }

    if (has('shot')) {
      const _so = opt('shot');
      const outPath = path.isAbsolute(_so) ? _so : '/tmp/' + _so;
      if (has('sel') || has('xpath')) {
        const handle = has('sel')
          ? await page.$(opt('sel'))
          : (await page.evaluateHandle((xp) => document.evaluate(xp, document, null, 9, null).singleNodeValue, opt('xpath'))).asElement();
        if (handle) { await handle.scrollIntoView().catch(() => {}); await new Promise(r => setTimeout(r, 200)); await handle.screenshot({ path: outPath }).catch(async () => { await page.screenshot({ path: outPath }); }); }
        else await page.screenshot({ path: outPath });
      } else {
        await page.screenshot({ path: outPath, fullPage: has('fullpage') });
      }
      out.shot = outPath;
    }
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify(out, null, 1));
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
