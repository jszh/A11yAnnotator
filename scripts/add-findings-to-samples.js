#!/usr/bin/env node
// Add the REPRODUCED + PARTIAL findings (from the reproducibility audit) to the
// manual-annotation selection list (assets/samples-saved.json). For each target
// it loads the saved snapshot through the running server, runs a finder to get
// the element, computes the tool's exact xpath, and appends a sampled entry to
// that page's sampled.default group (tagged with finding ref + verdict + note).
// Idempotent: skips a target whose xpath is already present. Writes a .bak first.

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { assetUrlUnder } = require('./lib/asset-paths.js'); // centralized page-location resolution

const ROOT = path.join(__dirname, '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://127.0.0.1:3001';
const SAMPLES = path.join(ROOT, 'assets/samples-saved.json');

// find: a function BODY (string) evaluated in page context, returns an Element or null.
const T = [
  // ── cat_1 Accessible names ──
  { file: 'NFL on ESPN - Scores, Stats and Highlights.htm', ref: 'cat_1[2]', verdict: 'REPRODUCED', note: "News-card image missing alt (1.1.1/F30)", find: `return document.querySelector('img.media-wrapper_image:not([alt])')` },
  { file: 'Klaviyo_ AI Email Marketing & SMS _ B2C CRM.htm', ref: 'cat_1[3]', verdict: 'REPRODUCED', note: "'Learn more' link, aria-label repeats ambiguous text (2.4.4/F63)", find: `return [...document.querySelectorAll('a[aria-label="Learn more"]')].find(a=>/customer-agent/.test(a.href))||document.querySelector('a[aria-label="Learn more"]')` },
  { file: 'Blue Apron _ Meal Kits, Oven-Ready & Ready-to-Eat Meals - No Subscription.htm', ref: 'cat_1[4]', verdict: 'REPRODUCED', note: "'Learn more' button, no programmatic context (2.4.6/4.1.2)", find: `return [...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Learn more')` },
  { file: 'Calendly.htm', ref: 'cat_1[5]', verdict: 'REPRODUCED', note: "'Read now' button nested in <a tabindex=-1>; ambiguous name (2.4.4/F63)", find: `return document.querySelector('button[data-testid="animated-stat-card-link"]')` },
  { file: '(11) Feed _ LinkedIn.htm', ref: 'cat_1[7]', verdict: 'REPRODUCED', note: "Placeholder alt 'No alternative text description for this image' (1.1.1/F30)", find: `return document.querySelector('img[alt="No alternative text description for this image"]')` },
  { file: 'r_teenagers.htm', ref: 'cat_1[8]', verdict: 'REPRODUCED', note: "Auto-generated alt = subreddit+title, not a description (1.1.1/F30)", find: `return [...document.querySelectorAll('img')].find(i=>/^r\\/teenagers -/.test(i.getAttribute('alt')||''))` },

  // ── cat_2 Grouping / order ──
  { file: 'Vueling_ cheap flights to major European cities - Vueling.htm', ref: 'cat_2[2]', verdict: 'REPRODUCED', note: "Destination card grid: flat divs, no list/group semantics (1.3.1)", find: `return document.querySelector('.vy-best-prices')` },
  { file: 'Quizlet_ Study Tools & Learning Resources for Students and Teachers _ Quizlet.htm', ref: 'cat_2[3]', verdict: 'PARTIAL', note: "Login modal trigger; background not hidden when modal opens (1.3.2/2.4.3) — dynamic", find: `return [...document.querySelectorAll('button,a')].find(b=>/^\\s*log in\\s*$/i.test(b.textContent))` },
  { file: 'Reacher.htm', ref: 'cat_2[4]', verdict: 'REPRODUCED', note: "Nav focus order ≠ visual order; 'Log In' out of sequence (1.3.2/2.4.3/F1)", find: `return [...document.querySelectorAll('a')].find(a=>/^\\s*log in\\s*$/i.test(a.textContent))` },

  // ── cat_3 Headings / title ──
  { file: 'Amazon.com_ Keep shopping for.html', ref: 'cat_3[1]', verdict: 'REPRODUCED', note: "Generic page <title> 'Keep shopping for', no category (2.4.2) — page-level", find: `return document.querySelector('title')` },
  { file: 'Home - Google Drive.htm', ref: 'cat_3[2]', verdict: 'REPRODUCED', note: "Empty heading element, no accessible text (2.4.10)", find: `return [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].find(h=>!(h.textContent||'').trim() && !h.getAttribute('aria-label'))` },

  // ── cat_4 Keyboard ──
  { file: 'Apple Inc. (AAPL) Stock Price, News, Quote & History - Yahoo Finance.html', ref: 'cat_4[1]', verdict: 'PARTIAL', note: "Chart data points not keyboard-focusable; tooltip pointer-only (2.1.1/4.1.2) — dynamic", find: `return document.querySelector('#chrt-evt-chart-container svg, [data-testid="chart-container"], #chart-container, canvas')` },
  { file: 'Your AI Agent for Compensation _ Openroll.htm', ref: 'cat_4[3]', verdict: 'REPRODUCED', note: "'Login' is a <div>/<p>, no role/tabindex/href; keyboard-invisible (2.1.1/F42/F59)", find: `return document.querySelector('.framer-1j0lzlq')||[...document.querySelectorAll('div,p,span')].find(e=>/^\\s*Login\\s*$/i.test(e.textContent)&&e.children.length<=1)` },

  // ── cat_5 Focus / visibility ──
  { file: 'Kahoot!.htm', ref: 'cat_5[1]', verdict: 'PARTIAL', note: "Cookie banner; potential focus trap (2.1.2/2.4.3) — dynamic", find: `return document.querySelector('#onetrust-banner-sdk')` },
  { file: 'NFL on ESPN - Scores, Stats and Highlights.htm', ref: 'cat_5[2]', verdict: 'PARTIAL', note: "Global search input tabindex=-1; potential focus trap (2.1.2/2.4.3) — dynamic", find: `return document.querySelector('.global-search input')` },
  { file: 'Southern Airways Express.htm', ref: 'cat_5[3]', verdict: 'REPRODUCED', note: "Global a:focus{outline:none}; no visible focus indicator (2.4.7/F78)", find: `return [...document.querySelectorAll('a')].find(a=>/\\/routes\\//.test(a.getAttribute('href')||''))` },
  { file: "Domino's.htm", ref: 'cat_5[4]', verdict: 'PARTIAL', note: "'Join Now' rewards button; outline suppressed, weak focus indicator (2.4.7/F78)", find: `return [...document.querySelectorAll('button,a')].find(b=>/join now/i.test(b.textContent))` },

  // ── cat_6 Color / contrast ──
  { file: 'Apple Inc. (AAPL) Stock Price, News, Quote & History - Yahoo Finance.html', ref: 'cat_6[1]', verdict: 'PARTIAL', note: "Comparison chart lines distinguished by color only (1.4.1) — needs 2nd series (dynamic)", find: `return [...document.querySelectorAll('button')].find(b=>/^\\s*compare\\s*$/i.test(b.textContent))||document.querySelector('[data-testid="chart-container"]')` },

  // ── cat_7 State/status ──
  { file: 'Gymshark.htm', ref: 'cat_7[1]', verdict: 'PARTIAL', note: "Add-to-Bag success tick role=presentation; no live announce (4.1.3) — dynamic", find: `return document.querySelector('[data-testid="pdp-addToBag-submit"]')` },
  { file: 'Our Plans _ Pricing _ Cloudflare.htm', ref: 'cat_7[2]', verdict: 'REPRODUCED', note: "Plan 'tabs' are plain buttons: no role=tab/aria-selected/tablist (4.1.3)", find: `return [...document.querySelectorAll('button')].find(b=>/^\\s*Performance\\s*$/.test(b.textContent))` },
  { file: 'Corporate Business Development Manager (Product) @ Harvey.htm', ref: 'cat_7[3]', verdict: 'PARTIAL', note: "Name input: no aria-describedby/errormessage linking error banner (1.3.1) — banner post-submit", find: `return document.querySelector('[name="_systemfield_name"]')` },

  // ── cat_8 Reflow / dismissible ──  (reflow is page-level; anchor on header/nav)
  { file: 'Newegg.htm', ref: 'cat_8[1]', verdict: 'REPRODUCED', note: "No reflow at 320px (UA-sniffing), horizontal scroll (1.4.10/F110) — page-level; header anchor", find: `return document.querySelector('header, .header, #Page_Header, nav')` },
  { file: 'Temu.htm', ref: 'cat_8[2]', verdict: 'REPRODUCED', note: "No reflow at 320px, header/grid overflow (1.4.10/F110) — page-level; header anchor", find: `return document.querySelector('header, [role=banner], nav')` },
  { file: 'Yahoo Finance - Stock Market Live, Quotes, Business & Finance News.htm', ref: 'cat_8[3]', verdict: 'REPRODUCED', note: "No reflow at 320px, nav grid overflow (1.4.10/F110) — page-level; nav anchor", find: `return document.querySelector('nav, [role=navigation], header')` },
  { file: 'Temu.htm', ref: 'cat_8[4]', verdict: 'PARTIAL', note: "'Categories' mega-menu not Escape-dismissible (1.4.13/F95) — dynamic", find: `return document.querySelector('[aria-label="Categories"]')||[...document.querySelectorAll('[role=button]')].find(b=>/categor/i.test(b.getAttribute('aria-label')||b.textContent))` },
  { file: 'Vanguard S&P 500 ETF.htm', ref: 'cat_8[5]', verdict: 'PARTIAL', note: "Fund-flows tooltip not hoverable (1.4.13/F95) — dynamic", find: `return document.querySelector('#fund-flow-chart-container')` },

  // ── cat_9 Labels / instructions / errors ──
  { file: 'Corporate Business Development Manager (Product) @ Harvey.htm', ref: 'cat_9[1]', verdict: 'REPRODUCED', note: "Required fields shown by CSS '*' only; no legend (3.3.2)", find: `return [...document.querySelectorAll('label')].find(l=>/_required_/.test(l.className))` },
  { file: 'Amazon Sign-In.htm', ref: 'cat_9[3]', verdict: 'PARTIAL', note: "Email input not aria-describedby-linked to error; disable-on-invalid (3.3.1/3.3.3) — dynamic", find: `return document.querySelector('#ap_email_login')||document.querySelector('input[type=email]')` },
];

const GETXPATH = `function getXPath(e){if(!e||!e.tagName)return '';if(e===document.body)return '/html/body';if(e===document.documentElement)return '/html';var ns=e.namespaceURI;var isHtml=!ns||ns==='http://www.w3.org/1999/xhtml';const t=isHtml?e.tagName.toLowerCase():e.tagName;let idx=1,sib=e.previousElementSibling;while(sib){if(sib.tagName===e.tagName)idx++;sib=sib.previousElementSibling;}return getXPath(e.parentElement)+(isHtml?'/'+t+'['+idx+']':"/*[local-name()='"+t+"']["+idx+']');}`;

(async () => {
  const data = JSON.parse(fs.readFileSync(SAMPLES, 'utf8'));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try { const _bc = await browser.target().createCDPSession(); await _bc.send("Browser.setDownloadBehavior", { behavior: "deny" }); } catch (e) {}
  const results = [];
  // group targets by file so each page loads once
  const byFile = {};
  for (const t of T) (byFile[t.file] = byFile[t.file] || []).push(t);

  for (const file of Object.keys(byFile)) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    page.on('pageerror', () => {});
    const url = assetUrlUnder(BASE, file);
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); } catch (e) {}
    await new Promise(r => setTimeout(r, 1800));
    for (const t of byFile[file]) {
      const info = await page.evaluate((findBody, GETXPATH) => {
        eval(GETXPATH);
        let el; try { el = (new Function(findBody))(); } catch (e) { return { err: 'finder:' + e.message }; }
        if (!el || !el.tagName) return { missing: true };
        const cs = getComputedStyle(el);
        const role = el.getAttribute('role') || ({ A: 'link', BUTTON: 'button', INPUT: (el.type === 'submit' ? 'button' : 'textbox'), IMG: 'img', H1: 'heading', H2: 'heading', H3: 'heading', NAV: 'navigation', TITLE: 'document-title' }[el.tagName] || el.tagName.toLowerCase());
        const name = (el.getAttribute('aria-label') || el.getAttribute('alt') || (el.tagName === 'TITLE' ? el.textContent : (el.innerText || '')) || '').trim().slice(0, 80);
        const ti = el.tabIndex;
        const focusable = (ti >= 0) && cs.visibility !== 'hidden' && cs.display !== 'none';
        return { xpath: getXPath(el), tag: el.tagName.toLowerCase(), role, name, focusable, tabindex: ti, outer: el.outerHTML.slice(0, 140) };
      }, t.find, GETXPATH).catch(e => ({ err: 'eval:' + e.message }));

      const rec = { ...t, ...info };
      results.push(rec);
      if (!info || info.missing || info.err) continue;

      const key = 'saved/' + file;
      if (!data[key]) { console.error('NO PAGE KEY for', key); continue; }
      data[key].sampled = data[key].sampled || {};
      data[key].sampled.default = data[key].sampled.default || [];
      const list = data[key].sampled.default;
      // dedup across ALL landmark groups for this page
      const allXpaths = new Set(Object.values(data[key].sampled).flat().map(s => s.xpath));
      if (allXpaths.has(info.xpath)) { rec.dedup = 'already-present'; continue; }
      list.push({
        xpath: info.xpath, tag: info.tag, role: info.role, name: info.name,
        focusable: info.focusable, atFocusable: true, landmark: 'default',
        source: 'finding-verification', finding: t.ref, verdict: t.verdict, note: t.note,
      });
      rec.added = true;
    }
    await page.close();
  }
  await browser.close();

  // backup + write
  fs.copyFileSync(SAMPLES, SAMPLES + '.bak');
  fs.writeFileSync(SAMPLES, JSON.stringify(data, null, 1));

  // report
  const added = results.filter(r => r.added);
  const dedup = results.filter(r => r.dedup);
  const failed = results.filter(r => r.missing || r.err);
  console.log('\n=== ADDED (' + added.length + ') ===');
  for (const r of added) console.log(`  ${r.ref} [${r.verdict}]  ${r.file}\n      xpath=${r.xpath}  role=${r.role} name=${JSON.stringify((r.name||'').slice(0,40))}`);
  if (dedup.length) { console.log('\n=== ALREADY PRESENT (' + dedup.length + ') ==='); for (const r of dedup) console.log(`  ${r.ref}  ${r.file}  -> ${r.xpath}`); }
  if (failed.length) { console.log('\n=== NOT LOCATED (' + failed.length + ') ==='); for (const r of failed) console.log(`  ${r.ref}  ${r.file}  ${r.err || 'element not found in snapshot'}`); }
  console.log('\nWrote', SAMPLES, '(backup at samples-saved.json.bak)');
})().catch(e => { console.error('FATAL', e.message, e.stack); process.exit(1); });
