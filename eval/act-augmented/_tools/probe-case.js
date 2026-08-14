#!/usr/bin/env node
/**
 * Small deterministic probe for adjudicating a single act-augmented case page.
 * Answers the questions the annotators' complaints actually turn on: what the
 * tab order is, what a hover/focus reveals and whether it survives Esc or a
 * pointer trip, what the live regions are, and what the page looks like.
 *
 * Usage:
 *   node eval/act-augmented/_tools/probe-case.js <page.html> [options]
 *     --tab              tab order walk (default on)
 *     --hover <sel>      hover the selector, report what appeared / Esc / persistence
 *     --click <sel>      click the selector, report DOM + live-region announcements
 *     --key <combo>      send a key to the page (e.g. Escape, Control+w, Alt+F10)
 *     --shot <file.png>  full-page screenshot after the actions
 *     --maxtab <n>       tab stops to walk (default 40)
 *     --json             print JSON only
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith('--'));
const opt = (name, dflt) => { const i = argv.indexOf('--' + name); return i > -1 ? argv[i + 1] : dflt; };
const has = (name) => argv.includes('--' + name);
if (!file) { console.error('need a page path'); process.exit(1); }

const DESCRIBE = `(el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const label = el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby')
      ? [...document.querySelectorAll('#' + el.getAttribute('aria-labelledby').split(/\\s+/).join(', #'))].map(n => n.textContent.trim()).join(' ')
      : '') || (el.labels && el.labels[0] ? el.labels[0].textContent.trim() : '');
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    cls: el.className && typeof el.className === 'string' ? el.className : null,
    role: el.getAttribute('role') || null,
    tabindex: el.getAttribute('tabindex'),
    text: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 90),
    ariaLabel: label || null,
    alt: el.getAttribute('alt'),
    title: el.getAttribute('title'),
    href: el.getAttribute('href'),
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    visible: !!(r.width && r.height) && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none',
  };
}`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const out = { file, tabOrder: [], liveRegions: [], announcements: [], hover: null, click: null, notes: [] };

  // capture live-region mutations the way a screen reader would see them
  await page.evaluateOnNewDocument(() => {
    window.__ann = [];
    const politeness = (el) => {
      let n = el;
      while (n && n.nodeType === 1) {
        const live = n.getAttribute('aria-live');
        const role = n.getAttribute('role');
        if (live) return live;
        if (role === 'alert') return 'assertive';
        if (role === 'status' || role === 'log' || role === 'progressbar') return 'polite';
        n = n.parentElement;
      }
      return null;
    };
    new MutationObserver((muts) => {
      for (const m of muts) {
        const host = m.target.nodeType === 1 ? m.target : m.target.parentElement;
        if (!host) continue;
        const p = politeness(host);
        if (!p || p === 'off') continue;
        const text = (host.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 160);
        if (text) window.__ann.push({ politeness: p, text, at: Math.round(performance.now()) });
      }
    }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true });
  });

  await page.goto('file://' + path.resolve(file), { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 400));

  out.liveRegions = await page.evaluate(() => [...document.querySelectorAll('[aria-live],[role=alert],[role=status],[role=log]')]
    .map((el) => ({
      sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''),
      ariaLive: el.getAttribute('aria-live'), role: el.getAttribute('role'),
      ariaAtomic: el.getAttribute('aria-atomic'), ariaRelevant: el.getAttribute('aria-relevant'),
      textAtLoad: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
    })));

  if (!has('hover') && !has('click') || has('tab')) {
    const max = Number(opt('maxtab', 40));
    await page.evaluate(() => { const b = document.body; b.setAttribute('tabindex', '-1'); b.focus(); });
    const seen = [];
    for (let i = 0; i < max; i++) {
      await page.keyboard.press('Tab');
      const d = await page.evaluate(`(() => { const f = ${DESCRIBE}; return f(document.activeElement); })()`);
      if (!d || d.tag === 'body') { out.notes.push(`tab walk left the page at stop ${i + 1}`); break; }
      const sig = `${d.tag}#${d.id}.${d.cls}|${d.text}`;
      if (seen.length && seen[0] === sig && i > 1) { out.notes.push(`tab order cycled after ${i} stops`); break; }
      if (i === 0) seen.push(sig);
      out.tabOrder.push({ stop: i + 1, ...d });
    }
  }

  if (has('hover')) {
    const sel = opt('hover');
    const before = await page.evaluate(() => document.body.innerHTML.length);
    const el = await page.$(sel);
    if (!el) { out.hover = { selector: sel, error: 'selector not found' }; }
    else {
      const box = await el.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await new Promise((r) => setTimeout(r, 700));
      const revealed = await page.evaluate((len) => ({
        grew: document.body.innerHTML.length !== len,
        visibleNew: [...document.querySelectorAll('[role=tooltip],.tooltip,.popover,[data-tooltip]')]
          .map((n) => { const r = n.getBoundingClientRect(); return { sel: n.className || n.getAttribute('role'), visible: !!(r.width && r.height) && getComputedStyle(n).visibility !== 'hidden' && getComputedStyle(n).opacity !== '0', text: (n.textContent || '').trim().slice(0, 100), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }; }),
      }), before);
      // can the pointer travel into the revealed content and keep it open?
      const tip = revealed.visibleNew.find((t) => t.visible && t.rect.w);
      let hoverable = null;
      if (tip) {
        await page.mouse.move(tip.rect.x + tip.rect.w / 2, tip.rect.y + tip.rect.h / 2, { steps: 10 });
        await new Promise((r) => setTimeout(r, 500));
        hoverable = await page.evaluate((t) => {
          const n = [...document.querySelectorAll('[role=tooltip],.tooltip,.popover,[data-tooltip]')]
            .find((x) => (x.textContent || '').trim().slice(0, 100) === t.text);
          if (!n) return false;
          const r = n.getBoundingClientRect();
          return !!(r.width && r.height) && getComputedStyle(n).visibility !== 'hidden' && getComputedStyle(n).opacity !== '0';
        }, tip);
      }
      await page.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 400));
      const afterEsc = await page.evaluate(() => [...document.querySelectorAll('[role=tooltip],.tooltip,.popover,[data-tooltip]')]
        .filter((n) => { const r = n.getBoundingClientRect(); return !!(r.width && r.height) && getComputedStyle(n).visibility !== 'hidden' && getComputedStyle(n).opacity !== '0'; }).length);
      out.hover = { selector: sel, ...revealed, hoverableAfterPointerTravel: hoverable, visibleTooltipsAfterEscape: afterEsc };
    }
  }

  if (has('click')) {
    const sel = opt('click');
    await page.evaluate(() => { window.__ann = []; });
    const el = await page.$(sel);
    if (!el) out.click = { selector: sel, error: 'selector not found' };
    else {
      await el.click();
      await new Promise((r) => setTimeout(r, 1200));
      out.click = {
        selector: sel,
        focusAfter: await page.evaluate(`(() => { const f = ${DESCRIBE}; return f(document.activeElement); })()`),
      };
    }
  }

  if (has('key')) {
    for (const k of opt('key').split('+').length > 1 ? [opt('key')] : [opt('key')]) {
      const parts = k.split('+');
      for (const m of parts.slice(0, -1)) await page.keyboard.down(m);
      await page.keyboard.press(parts[parts.length - 1]);
      for (const m of parts.slice(0, -1).reverse()) await page.keyboard.up(m);
    }
    await new Promise((r) => setTimeout(r, 600));
    out.afterKey = { key: opt('key'), focus: await page.evaluate(`(() => { const f = ${DESCRIBE}; return f(document.activeElement); })()`) };
  }

  out.announcements = await page.evaluate(() => window.__ann || []);

  if (has('shot')) {
    const dest = path.resolve(opt('shot'));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await page.screenshot({ path: dest, fullPage: true });
    out.screenshot = dest;
  }

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
