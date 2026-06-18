'use strict';
// PROBE (CLAUDE.md discipline, Tier-0 #1): for each of the 3 NOVERDICT SVG fixtures, prove the namespace bug
// and its fix end-to-end — (a) the PLAIN document.evaluate(...,9,...) returns null on the SVG subject, (b) the
// nsXPath-rewritten path resolves a real node with a real rect, (c) captureVision (now nsXPath-aware) yields a
// non-empty crop keyed by the ORIGINAL collector xpath. Screenshots one crop to disk to eyeball.
const fs = require('path');
const path = require('path');
const puppeteer = require('puppeteer');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const { captureVision } = require('../../lib/vision-capture.js');
const { nsXPath } = require('../../lib/xpath-ns.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const SUB = path.join(ROOT, 'eval/checker-comparison/act-subset/pages');
const OUT = path.join(__dirname, 'out-svg-probe');
const FIX = [
  { rule: 'qt1vmo', tc: '2f7d82593e287df64b7459695e355a840254255c', sc: '1.1.1' },
  { rule: '5effbb', tc: 'e6a7c924092d2351c3a5b4361ccde7917ad23c66', sc: '2.4.4' },
  { rule: 'fd3a94', tc: '7ebe961dbb4fb0e259fc3bc98a8f048170b063af', sc: '2.4.4' },
];

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  let allPass = true;
  for (const f of FIX) {
    const url = 'file://' + path.join(SUB, f.rule, f.tc + '.html');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: 'load' });
    const collect = normalizeCollectRoles(await collectActPage(page, { url, elementCap: 80, file: 'p', runId: 'p', sourceUrl: url }));
    // SVG-related subjects: xpath mentions svg, OR an <a>/role=img nested under svg
    const svgXps = collect.elements.map((e) => e.xpath).filter((xp) => /svg/i.test(xp));
    console.log(`\n=== ${f.rule} (${f.sc}) — ${svgXps.length} svg-related subject(s) ===`);
    for (const xp of svgXps) {
      const res = await page.evaluate((raw, rew) => {
        const plain = document.evaluate(raw, document, null, 9, null).singleNodeValue;
        const fixed = document.evaluate(rew, document, null, 9, null).singleNodeValue;
        const rectOf = (el) => { if (!el || !el.getBoundingClientRect) return null; const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
        return { plainNull: plain === null, fixedTag: fixed ? (fixed.tagName || fixed.nodeName) : null, fixedRect: rectOf(fixed) };
      }, xp, nsXPath(xp));
      // does captureVision now produce a crop for the ORIGINAL xpath key?
      const vis = await captureVision(page, [xp], { states: ['element-crop', 'surrounding-region'] });
      const crop = vis[xp] && vis[xp]['element-crop'];
      const ok = res.plainNull && res.fixedTag && crop && crop.length > 100;
      allPass = allPass && ok;
      console.log(`  ${ok ? 'PASS' : 'FAIL'} ${xp}`);
      console.log(`       plain→null:${res.plainNull}  fixed→<${res.fixedTag}> rect:${JSON.stringify(res.fixedRect)}  crop:${crop ? crop.length + 'b' : 'NONE'}`);
      if (crop && !require('fs').existsSync(path.join(OUT, `${f.rule}.png`))) {
        require('fs').writeFileSync(path.join(OUT, `${f.rule}.png`), Buffer.from(crop, 'base64'));
        console.log(`       wrote crop → ${path.join(OUT, f.rule + '.png')}`);
      }
    }
    await page.close();
  }
  await browser.close();
  console.log(`\n${allPass ? 'ALL PASS — SVG subjects now resolve + crop' : 'SOME FAILED'}`);
  process.exit(allPass ? 0 : 1);
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
