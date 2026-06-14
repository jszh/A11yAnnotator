#!/usr/bin/env node
// Recompute/append finding entries for noscript-flagged pages, computing xpaths
// against the SAME noscript DOM the annotator iframe serves (offline=1&noscript=1).
// Fixes Quizlet (scripted xpath didn't resolve in noscript) and adds the two
// Harvey entries that timed out under live scripts.
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://127.0.0.1:3001/assets/saved/';
const SAMPLES = path.join(ROOT, 'assets/samples-saved.json');

const T = [
  { file: 'Quizlet_ Study Tools & Learning Resources for Students and Teachers _ Quizlet.htm', ref: 'cat_2[3]', verdict: 'PARTIAL', note: "Login modal trigger; background not hidden when modal opens (1.3.2/2.4.3) — dynamic", find: `return [...document.querySelectorAll('button,a')].find(b=>/^\\s*log in\\s*$/i.test((b.innerText||b.textContent||'').trim()))` },
  { file: 'Corporate Business Development Manager (Product) @ Harvey.htm', ref: 'cat_7[3]', verdict: 'PARTIAL', note: "Name input: no aria-describedby/errormessage linking error banner (1.3.1) — banner post-submit", find: `return document.querySelector('[name="_systemfield_name"]')` },
  { file: 'Corporate Business Development Manager (Product) @ Harvey.htm', ref: 'cat_9[1]', verdict: 'REPRODUCED', note: "Required fields shown by CSS '*' only; no legend (3.3.2)", find: `return [...document.querySelectorAll('label')].find(l=>/_required_/.test(l.className))` },
];
const GETXPATH = `function getXPath(e){if(!e||!e.tagName)return '';if(e===document.body)return '/html/body';if(e===document.documentElement)return '/html';var ns=e.namespaceURI;var isHtml=!ns||ns==='http://www.w3.org/1999/xhtml';const t=isHtml?e.tagName.toLowerCase():e.tagName;let idx=1,sib=e.previousElementSibling;while(sib){if(sib.tagName===e.tagName)idx++;sib=sib.previousElementSibling;}return getXPath(e.parentElement)+(isHtml?'/'+t+'['+idx+']':"/*[local-name()='"+t+"']["+idx+']');}`;

(async () => {
  const data = JSON.parse(fs.readFileSync(SAMPLES, 'utf8'));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 240000, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try { const _bc = await browser.target().createCDPSession(); await _bc.send("Browser.setDownloadBehavior", { behavior: "deny" }); } catch (e) {}
  const results = [];
  for (const t of T) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    page.on('pageerror', () => {});
    await page.goto(BASE + encodeURIComponent(t.file) + '?offline=1&noscript=1', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 600));
    const info = await page.evaluate((findBody, GX) => {
      eval(GX);
      let el; try { el = (new Function(findBody))(); } catch (e) { return { err: e.message }; }
      if (!el || !el.tagName) return { missing: true };
      const cs = getComputedStyle(el);
      const role = el.getAttribute('role') || ({ A: 'link', BUTTON: 'button', INPUT: 'textbox', LABEL: 'label' }[el.tagName] || el.tagName.toLowerCase());
      const name = (el.getAttribute('aria-label') || el.getAttribute('placeholder') || (el.innerText || '') || '').trim().slice(0, 80);
      const ti = el.tabIndex;
      return { xpath: getXPath(el), tag: el.tagName.toLowerCase(), role, name, focusable: ti >= 0 && cs.visibility !== 'hidden' && cs.display !== 'none' };
    }, t.find, GETXPATH).catch(e => ({ err: e.message }));
    await page.close();
    const rec = { ...t, ...info };
    results.push(rec);
    if (info.missing || info.err) continue;

    const key = 'saved/' + t.file;
    data[key].sampled = data[key].sampled || {};
    data[key].sampled.default = data[key].sampled.default || [];
    // remove any stale finding entry with same ref (e.g. bad Quizlet xpath)
    for (const lm in data[key].sampled) {
      data[key].sampled[lm] = data[key].sampled[lm].filter(s => s.finding !== t.ref);
    }
    const allXpaths = new Set(Object.values(data[key].sampled).flat().map(s => s.xpath));
    if (allXpaths.has(info.xpath)) { rec.dedup = true; continue; }
    data[key].sampled.default.push({
      xpath: info.xpath, tag: info.tag, role: info.role, name: info.name,
      focusable: info.focusable, atFocusable: true, landmark: 'default',
      source: 'finding-verification', finding: t.ref, verdict: t.verdict, note: t.note,
    });
    rec.added = true;
  }
  await browser.close();
  fs.writeFileSync(SAMPLES, JSON.stringify(data, null, 1));
  console.log(JSON.stringify(results.map(r => ({ ref: r.ref, added: !!r.added, dedup: !!r.dedup, err: r.err, missing: r.missing, xpath: r.xpath, name: r.name })), null, 1));
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
