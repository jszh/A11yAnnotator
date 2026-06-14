#!/usr/bin/env node
// Add the full-pass (page_findings.json) REPRODUCED + PARTIAL findings to the
// manual-annotation selection list. Validates each agent-returned xpath resolves
// in the page's actual serving mode (noscript auto-detected); for elements inside
// shadow DOM / empty containers, a `find` fallback computes a usable xpath.
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://127.0.0.1:3001/assets/saved/';
const SAMPLES = path.join(ROOT, 'assets/samples-saved.json');

function noscriptFlagged(file) {
  try { const pj = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/pages.json'), 'utf8')); const l = Array.isArray(pj) ? pj : pj.pages; return !!(l || []).find(p => p.file === file && p.noscript); } catch (e) { return false; }
}
const GX = `function gx(e){if(!e||!e.tagName)return '';if(e===document.body)return '/html/body';if(e===document.documentElement)return '/html';var ns=e.namespaceURI,h=!ns||ns==='http://www.w3.org/1999/xhtml',t=h?e.tagName.toLowerCase():e.tagName,i=1,s=e.previousElementSibling;while(s){if(s.tagName===e.tagName)i++;s=s.previousElementSibling;}return gx(e.parentElement)+(h?'/'+t+'['+i+']':"/*[local-name()='"+t+"']["+i+']');}`;

const ITEMS = [
  { file: 'GrazeMate.htm', ref: 'cat_6:grazemate-focus', verdict: 'REPRODUCED', el: 'Global interactive elements', note: "Global :focus{outline:none!important}; no visible focus indicator + unnamed image links (2.4.7/F78)", xpath: '/html/body/header[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div[1]/div[1]/a[1]' },
  { file: 'Rubric - Domain-Specific Data Infrastructure for AI.htm', ref: 'cat_3:rubric-eyebrow', verdict: 'REPRODUCED', el: 'Section eyebrow badge', note: "'Our Research Pillars' is a styled div, not a heading; absent from SR outline (1.3.1)", xpath: '/html/body/div[1]/div[2]/main[1]/section[3]/div[1]/div[1]/div[1]' },
  { file: 'ix.htm', ref: 'cat_3:ix-outline', verdict: 'REPRODUCED', el: 'Document outline', note: "No <h1>; outline starts at h2 (1.3.1/2.4.6)", xpath: '/html/body/div[1]/main[1]/div[1]/section[1]/div[1]/h2[1]' },
  { file: 'Home - Artera.htm', ref: 'cat_4:artera-social', verdict: 'REPRODUCED', el: 'Social media icon links', note: "Social icon links have no accessible name (4.1.2/F89)", xpath: '/html/body/footer[1]/div[3]/div[1]/nav[1]/a[1]' },
  { file: 'Innovate, Disrupt, Field - MORSE Corp (Mission Oriented Rapid Solution Engineering).htm', ref: 'cat_4:morse-social', verdict: 'REPRODUCED', el: 'Footer LinkedIn link', note: "Link name is whitespace-only (alt=' ') (4.1.2/F89)", xpath: '/html/body/div[3]/div[1]/div[1]/ul[1]/li[1]/a[1]' },
  { file: 'Investment Banking & Finance Community _ Financial Modeling Courses _ Wall Street Oasis.htm', ref: 'cat_4:wso-search', verdict: 'REPRODUCED', el: 'Global search input', note: "Search input named by placeholder only; no combobox ARIA (4.1.2/F68)", xpath: '/html/body/div[2]/div[1]/header[1]/div[1]/div[3]/div[2]/form[1]/div[1]/div[1]/div[1]/input[1]' },
  { file: 'boohooman-new-season.htm', ref: 'cat_4:boohoo-filter', verdict: 'REPRODUCED', el: 'Filter sidebar accordion', note: "Accordion is a div tabindex=-1, not keyboard-operable; stateless filter buttons (2.1.1/F59)", xpath: '/html/body/div[3]/div[2]/div[4]/div[1]/div[1]/div[1]/div[2]/div[1]/div[1]/div[2]/div[1]/div[1]/div[2]/div[1]/div[1]' },
  { file: 'Reddit.htm', ref: 'cat_4:reddit-search', verdict: 'REPRODUCED', el: 'Global search (web component)', note: "Search input in shadow DOM; label not associated, placeholder-only name (4.1.2/F68)", xpath: null, find: `return document.querySelector('faceplate-search-input, reddit-search-large')` },
  { file: 'o11 - The AI Agent Inside Every App.htm', ref: 'cat_4:o11-excel', verdict: 'REPRODUCED', el: 'Excel download button', note: "Empty accessible name; nested <a> in <button> (4.1.2/F111)", xpath: '/html/body/div[1]/div[1]/main[1]/div[1]/section[1]/div[1]/div[1]/div[2]/section[1]/div[1]/div[1]/div[2]/div[1]/div[1]/button[2]' },
  { file: 'Opendoor.htm', ref: 'cat_4:opendoor-menu', verdict: 'REPRODUCED', el: 'Nav mega-menu trigger', note: "Trigger missing aria-haspopup; dropdown pointer-only (2.1.1/4.1.2)", xpath: '/html/body/div[1]/span[1]/span[1]/span[1]/div[1]/div[1]/div[1]/div[2]/ul[1]/li[1]/a[1]' },
  { file: 'Reebok® Official Site.htm', ref: 'cat_5:reebok-cart', verdict: 'REPRODUCED', el: 'Side cart overlay', note: "Hidden side-cart leaks focus: focusable descendants, no inert/aria-modal (2.4.3/F85)", xpath: '/html/body/div[10]/div[1]/nav[2]' },
  { file: 'Rotten Tomatoes.htm', ref: 'cat_5:rt-carousel', verdict: 'REPRODUCED', el: 'Off-screen carousel tile', note: "Off-screen carousel tiles keyboard-focusable, no aria-hidden/inert (2.4.3/2.4.7)", xpath: '/html/body/div[3]/main[1]/div[1]/div[1]/section[2]/div[1]/section[1]/tiles-carousel-responsive-deprecated[1]/media-info-tile[8]' },
  { file: 'Doomersion — Learn languages by doomscrolling.htm', ref: 'cat_7:doomersion-video', verdict: 'REPRODUCED', el: 'Autoplay background video', note: "Autoplay loop video, no pause control, no captions, no reduced-motion (2.2.2/1.4.2)", xpath: '/html/body/main[1]/div[1]/div[2]/video[1]' },
  { file: 'Amazon.com. Spend less. Smile more..html', ref: 'cat_8:amazon-reflow', verdict: 'REPRODUCED', el: 'Global desktop layout', note: "No reflow at 320px: scrollW 1000 vs 320 (1.4.10/F110)", xpath: '/html/body/div[1]/nav[1]' },
  { file: 'Nordstrom.htm', ref: 'cat_8:nordstrom-reflow', verdict: 'REPRODUCED', el: 'Header/nav/grid layout', note: "No reflow at 320px: scrollW 733 vs 320 (1.4.10/F110)", xpath: '/html/body/div[1]/div[3]/section[1]/section[1]/div[1]/div[2]/nav[1]' },
  { file: 'BBC Home.htm', ref: 'cat_8:bbc-reflow', verdict: 'REPRODUCED', el: 'News grid + top nav', note: "No reflow at 320px: scrollW 1425 vs 320 (1.4.10/F110)", xpath: '/html/body/div[2]/div[1]/header[1]' },
  // PARTIAL (static precondition present; dynamic behavior not exercisable)
  { file: 'Seriously, what is Quora_ - Quora.htm', ref: 'cat_2:quora-modal', verdict: 'PARTIAL', el: 'Sign-up modal trigger', note: "Signup modal: no role=dialog/aria-modal, background not hidden — dynamic (1.3.2/4.1.2)", xpath: null, find: `return [...document.querySelectorAll('button,a')].find(b=>/^\\s*sign\\s*in\\s*$/i.test((b.innerText||'').trim()))` },
  { file: "Macy's - Shop Fashion Clothing & Accessories - Official Site - Macys.com.html", ref: 'cat_4:macys-menu', verdict: 'PARTIAL', el: 'Nav mega-menu', note: "Mega-menu trigger missing aria-haspopup; Shift+Tab wrap trap — dynamic (2.1.1/2.1.2)", xpath: '/html/body/div[1]/div[1]/header[1]/nav[1]/ul[1]/li[2]/button[1]' },
  { file: 'Newegg.htm', ref: 'cat_5:newegg-search', verdict: 'PARTIAL', el: 'Global search input', note: "Global search input; focus trap is dynamic (2.1.2)", xpath: '/html/body/div[45]/header[1]/div[1]/div[1]/div[1]/div[3]/form[1]/div[1]/div[1]/input[1]' },
  { file: 'Fed10.htm', ref: 'cat_5:fed10-map', verdict: 'PARTIAL', el: 'Mock dashboard / map', note: "56 SVG paths tabindex=0 with no accessible name; focus tarpit — dynamic (2.1.1/2.4.3)", xpath: null, find: `return document.querySelector('svg path[tabindex="0"]') && document.querySelector('svg path[tabindex="0"]').closest('svg')` },
  { file: 'Notion Pricing Plans.htm', ref: 'cat_5:notion-toggle', verdict: 'PARTIAL', el: 'Billing interval toggle', note: "Billing toggle radios have no focus indicator; change not announced — dynamic (2.4.7/4.1.3)", xpath: '/html/body/div[1]/div[1]/div[1]/main[1]/section[2]/header[1]/div[1]/fieldset[1]' },
  { file: 'Men’s Dark beige Jacket with Collar _ H&M US.htm', ref: 'cat_7:hm-toast', verdict: 'PARTIAL', el: 'Mini-cart add toast', note: "Add-to-bag confirmation not announced; no dedicated live region — dynamic (4.1.3)", xpath: '/html/body/div[1]/main[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[1]/div[6]/button[1]' },
];

(async () => {
  const data = JSON.parse(fs.readFileSync(SAMPLES, 'utf8'));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 240000, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try { const _bc = await browser.target().createCDPSession(); await _bc.send("Browser.setDownloadBehavior", { behavior: "deny" }); } catch (e) {}
  const byFile = {}; for (const it of ITEMS) (byFile[it.file] = byFile[it.file] || []).push(it);
  const results = [];
  for (const file of Object.keys(byFile)) {
    const ns = noscriptFlagged(file);
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 }); page.on('pageerror', () => {});
    await page.goto(BASE + encodeURIComponent(file) + '?offline=1' + (ns ? '&noscript=1' : ''), { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    await new Promise(r => setTimeout(r, ns ? 600 : 1500));
    for (const it of byFile[file]) {
      const info = await page.evaluate((it, GX) => {
        eval(GX);
        let el = null;
        if (it.xpath) { try { el = document.evaluate(it.xpath, document, null, 9, null).singleNodeValue; } catch (e) {} }
        let usedFind = false;
        if (!el && it.find) { try { el = (new Function(it.find))(); usedFind = true; } catch (e) {} }
        if (!el || !el.tagName) return { resolved: false };
        const role = el.getAttribute('role') || ({ A: 'link', BUTTON: 'button', INPUT: 'textbox', VIDEO: 'video', NAV: 'navigation', FIELDSET: 'group', H2: 'heading' }[el.tagName] || el.tagName.toLowerCase());
        const name = (el.getAttribute('aria-label') || el.getAttribute('alt') || (el.innerText || '') || '').trim().slice(0, 70);
        return { resolved: true, xpath: usedFind ? gx(el) : it.xpath, tag: el.tagName.toLowerCase(), role, name, focusable: el.tabIndex >= 0, usedFind };
      }, it, GX).catch(e => ({ resolved: false, err: e.message }));
      const rec = { ...it, ...info, ns }; results.push(rec);
      if (!info.resolved) continue;
      const key = 'saved/' + file;
      if (!data[key]) { rec.noKey = true; continue; }
      data[key].sampled = data[key].sampled || {}; data[key].sampled.default = data[key].sampled.default || [];
      const allX = new Set(Object.values(data[key].sampled).flat().map(s => s.xpath));
      if (allX.has(info.xpath)) { rec.dedup = true;
        // tag the pre-existing entry with provenance
        for (const lm in data[key].sampled) for (const s of data[key].sampled[lm]) if (s.xpath === info.xpath) Object.assign(s, { source: 'finding-verification', finding: it.ref, verdict: it.verdict, note: it.note });
        continue; }
      data[key].sampled.default.push({ xpath: info.xpath, tag: info.tag, role: info.role, name: info.name, focusable: info.focusable, atFocusable: true, landmark: 'default', source: 'finding-verification', finding: it.ref, verdict: it.verdict, note: it.note });
      rec.added = true;
    }
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(SAMPLES, JSON.stringify(data, null, 1));
  const added = results.filter(r => r.added), dedup = results.filter(r => r.dedup), failed = results.filter(r => !r.resolved);
  console.log('ADDED', added.length, '| DEDUP/tagged', dedup.length, '| UNRESOLVED', failed.length);
  for (const r of added) console.log('  +', r.ref, '['+r.verdict+']', r.usedFind ? '(via find)' : '', '->', r.xpath, '| role', r.role, '| name', JSON.stringify((r.name||'').slice(0,30)));
  for (const r of dedup) console.log('  =', r.ref, 'already present, tagged ->', r.xpath);
  for (const r of failed) console.log('  !', r.ref, 'UNRESOLVED', r.err || '(xpath did not resolve & no find)');
  let n = 0; for (const k in data) for (const lm in (data[k].sampled || {})) for (const s of data[k].sampled[lm]) if (s.source === 'finding-verification') n++;
  console.log('TOTAL finding-verification entries now:', n);
})().catch(e => { console.error('FATAL', e.message, e.stack); process.exit(1); });
