'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '../../../..');
const BASE = path.join(ROOT, 'scripts/v3/tests/generated/broad-scope/adaptation');
const OUT = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals');
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH
  || process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function cropTarget(page, name) {
  const el = await page.$('#target');
  if (!el) return null;
  const file = path.join(OUT, `${name}.png`);
  await el.screenshot({ path: file });
  return path.relative(ROOT, file);
}

async function open(browser, rel) {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(ROOT, rel)).href, { waitUntil: 'load' });
  return page;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = JSON.parse(fs.readFileSync(path.join(BASE, 'manifest.json'), 'utf8'));
  const byId = Object.fromEntries(manifest.cases.map((c) => [c.id, c]));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'] });
  const captures = [];
  try {
    // text spacing
    for (const id of ['ts-p1', 'ts-n1']) {
      const page = await open(browser, byId[id].file);
      captures.push({ id, state: 'before', file: await cropTarget(page, `${id}-before`) });
      await page.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}' });
      await new Promise((r) => setTimeout(r, 100));
      captures.push({ id, state: 'after-text-spacing', file: await cropTarget(page, `${id}-after-text-spacing`) });
      await page.close();
    }
    // resize text
    for (const id of ['zr-p1', 'zr-n1']) {
      const page = await open(browser, byId[id].file);
      captures.push({ id, state: 'before', file: await cropTarget(page, `${id}-before`) });
      await page.addStyleTag({ content: 'html{font-size:200%!important}body{font-size:100%!important}input,button,select,textarea{font-size:100%!important}' });
      await new Promise((r) => setTimeout(r, 120));
      captures.push({ id, state: 'after-resize-text', file: await cropTarget(page, `${id}-after-resize-text`) });
      await page.close();
    }
    // forced colors
    for (const id of ['fc-p1', 'fc-n1', 'fcn-p1', 'fcn-n1']) {
      const page = await open(browser, byId[id].file);
      captures.push({ id, state: 'before', file: await cropTarget(page, `${id}-before`) });
      const cdp = await page.createCDPSession();
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'forced-colors', value: 'active' }] });
      await new Promise((r) => setTimeout(r, 120));
      captures.push({ id, state: 'forced-colors', file: await cropTarget(page, `${id}-forced-colors`) });
      await page.close();
    }
    // reduced motion first/settled visual snapshot
    for (const id of ['rm-p1', 'rm-n1', 'rm-n5', 'rm-n8']) {
      const page = await open(browser, byId[id].file);
      captures.push({ id, state: 'before', file: await cropTarget(page, `${id}-before`) });
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await new Promise((r) => setTimeout(r, 120));
      captures.push({ id, state: 'reduced-motion', file: await cropTarget(page, `${id}-reduced-motion`) });
      if (id === 'rm-n5') {
        await page.click('#pauseMotion');
        await new Promise((r) => setTimeout(r, 120));
        captures.push({ id, state: 'after-pause-control', file: await cropTarget(page, `${id}-after-pause-control`) });
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  const out = path.join(OUT, 'manifest.json');
  fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), captures }, null, 2) + '\n');
  console.log(out);
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
