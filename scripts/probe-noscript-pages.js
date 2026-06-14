#!/usr/bin/env node
// Q3 probe: for the snapshot-capture-issue pages, compare what renders with the
// page's own scripts RUNNING (offline=1) vs NEUTRALIZED (offline=1&noscript=1) —
// the mode the annotator iframe actually uses for SPA snapshots. Reports body
// text length + whether key content nodes are present, so we can decide whether
// each page needs fixing or is already usable for annotation.
const puppeteer = require('puppeteer');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://127.0.0.1:3001/assets/saved/';

const PAGES = [
  { file: 'Chicago Hotels_ 05_10 - 05_11 _ Spirit Airlines.htm', probe: `return {root:(document.querySelector('#root')||{}).childElementCount, hotelCards: document.querySelectorAll('[class*=hotel],[class*=Hotel],[class*=card],[class*=Card]').length, filterChips: document.querySelectorAll('[class*=chip],[class*=filter],[class*=Filter]').length}` },
  { file: 'Real Estate - Homes For Sale _ Zillow.htm', probe: `return {bodyHas500:/something broke|Uh oh/i.test(document.body.innerText), map: document.querySelectorAll('[class*=map],[class*=Map],canvas,[id*=map]').length, listingCards: document.querySelectorAll('[class*=property-card],[class*=list-card],article').length, drawBtn:[...document.querySelectorAll('button,a,div')].some(e=>/^\\s*draw\\s*$/i.test(e.textContent))}` },
  { file: 'justgalsbeingchicks.htm', probe: `return {redditPostImgs: document.querySelectorAll('img[src*=redd.it]').length, articles: document.querySelectorAll('article,shreddit-post').length}` },
  { file: 'Corporate Business Development Manager (Product) @ Harvey.htm', probe: `return {nameInput: !!document.querySelector('[name=_systemfield_name]'), requiredLabels: [...document.querySelectorAll('label')].filter(l=>/_required_/.test(l.className)).length}` },
];

function getXPathSrc() {
  return `function getXPath(e){if(!e||!e.tagName)return '';if(e===document.body)return '/html/body';if(e===document.documentElement)return '/html';var ns=e.namespaceURI;var isHtml=!ns||ns==='http://www.w3.org/1999/xhtml';const t=isHtml?e.tagName.toLowerCase():e.tagName;let idx=1,sib=e.previousElementSibling;while(sib){if(sib.tagName===e.tagName)idx++;sib=sib.previousElementSibling;}return getXPath(e.parentElement)+(isHtml?'/'+t+'['+idx+']':"/*[local-name()='"+t+"']["+idx+']');}`;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 240000, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try { const _bc = await browser.target().createCDPSession(); await _bc.send("Browser.setDownloadBehavior", { behavior: "deny" }); } catch (e) {}
  for (const p of PAGES) {
    const out = { file: p.file };
    for (const mode of ['offline=1', 'offline=1&noscript=1']) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      page.on('pageerror', () => {});
      const url = BASE + encodeURIComponent(p.file) + '?' + mode;
      try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); } catch (e) { out[mode] = { gotoErr: e.message }; await page.close(); continue; }
      await new Promise(r => setTimeout(r, mode.includes('noscript') ? 400 : 2500));
      try {
        const bodyLen = await page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').trim().length);
        const probe = await page.evaluate(new Function(p.probe));
        out[mode] = { bodyTextLen: bodyLen, ...probe };
      } catch (e) { out[mode] = { evalErr: e.message }; }
      await page.close();
    }
    // For Harvey, also resolve the two finding xpaths in noscript mode
    if (p.file.startsWith('Corporate')) {
      const page = await browser.newPage();
      await page.on('pageerror', () => {});
      await page.goto(BASE + encodeURIComponent(p.file) + '?offline=1&noscript=1', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 400));
      out.harveyXpaths = await page.evaluate((gx) => {
        eval(gx);
        const r = {};
        const lbl = [...document.querySelectorAll('label')].find(l => /_required_/.test(l.className));
        const inp = document.querySelector('[name=_systemfield_name]');
        if (lbl) r.cat9_1 = { xpath: getXPath(lbl), name: (lbl.innerText || '').trim().slice(0, 50) };
        if (inp) r.cat7_3 = { xpath: getXPath(inp), name: inp.getAttribute('placeholder') || '' };
        return r;
      }, getXPathSrc()).catch(e => ({ err: e.message }));
      await page.close();
    }
    console.log(JSON.stringify(out, null, 1));
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
