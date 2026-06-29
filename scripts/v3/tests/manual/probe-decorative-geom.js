'use strict';
// Probe for (2) why decorativeConflict did NOT fire on e88epe/5d0c52f3 (<img aria-hidden alt="W3C logo">) and (3) the
// rendered GEOMETRY of the wrongly-alt=""-ed informative images we currently exclude (e88epe w3c-logo, 0va7u6 welcome)
// vs what a size/narrowness heuristic would need to tell them apart from legit decoration. For each fixture: collect →
// dump every <img>'s {alt, role, box w×h, removedFromA11yTree, hiddenMechanism, decorativeConflict, ariaHiddenWithName,
// authorName, collected?}. If an aria-hidden image is ABSENT from collect.elements, decorativeConflict can never fire.
const path = require('path');
const puppeteer = require('puppeteer');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const PAGES = path.join(ROOT, 'eval/checker-comparison/act-subset/pages');
const AXE = path.join(ROOT, 'axe.min.js');

const CASES = [
  { rule: 'e88epe', sc: '1.1.1', id: 'e5b8fa7ab66409e7b52b335a8b6aebe11fd78635', note: 'alt="" (bare decorative)' },
  { rule: 'e88epe', sc: '1.1.1', id: '5d0c52f3b06b60f712efaa08eb6947f18494c241', note: 'aria-hidden + alt="W3C logo" (CONFLICT?)' },
  { rule: '0va7u6', sc: '1.4.5', id: 'e1d4ed7556dabfcfde47aaf4cd0861e0fdf585d9', note: 'alt="" welcome.png (image-of-text)' },
];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 4 });
  for (const c of CASES) {
    const url = 'file://' + path.join(PAGES, c.rule, c.id + '.html');
    const lease = await alloc.acquire();
    let collect;
    try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 120, file: `act:${c.id}`, runId: `dg-${c.id}`, sourceUrl: url, runAxe: true, axePath: AXE })); }
    finally { await lease.release(); }
    console.log(`\n================ ${c.rule} ${c.sc}  ${c.id.slice(0, 10)}  — ${c.note} ================`);
    const imgs = (collect.elements || []).filter((el) => el.tag === 'img' || el.isImage === true || /img|image|figure/.test(el.role || el.roleAttr || ''));
    console.log(`collected elements: ${(collect.elements || []).length}  | image-ish: ${imgs.length}`);
    for (const el of imgs) {
      const b = el.box || {};
      console.log('  IMG ' + JSON.stringify({
        tag: el.tag, alt: el.alt, role: el.role || el.roleAttr, isImage: el.isImage,
        box: b.width != null ? `${b.width}x${b.height}` : null,
        removedFromA11yTree: el.removedFromA11yTree, hiddenMechanism: el.hiddenMechanism,
        authorName: el.authorName, ariaHiddenWithName: el.ariaHiddenWithName,
        decorativeConflict: el.decorativeConflict, axName: (el.axName || el.name || '').slice(0, 20),
      }));
    }
    // also: raw DOM check — is the aria-hidden img present in the DOM at all, and what is its rendered size?
  }
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
