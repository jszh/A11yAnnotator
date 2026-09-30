#!/usr/bin/env node
'use strict';
// Which cases does the link-context change (content.js: a link's sentence is its context when no paragraph, list
// item or cell encloses it) affect? Loads every page of a corpus and lists the cases with a link that now gets
// sentence context, restricted to criteria that read the content probe (1.1.1, 1.4.3, 2.4.4).
//
//   node intera11y/eval/context-change-scan.js <corpus> [--out=file]   → one "id<TAB>scs" line per affected case
const fs = require('fs');
const { CORPORA } = require('./corpora.js');
const { launchBrowser, openPage } = require('../src/core/session.js');
const CONTENT_SCS = new Set(['1.1.1', '1.4.3', '2.4.4']);
const args = Object.fromEntries(process.argv.slice(3).map((a) => { const m = /^--([^=]+)=(.*)$/.exec(a); return m ? [m[1], m[2]] : [a, true]; }));

function sentenceLinks() {
  const norm = (t) => t.replace(/\s+/g, ' ');
  let n = 0;
  for (const a of document.querySelectorAll('a[href],[role="link"]')) {
    if (a.closest('p,li,td,th,dd,dt,blockquote,figcaption')) continue;
    const blk = a.closest('div,section,article,header,footer,main,aside,nav,form,figure,span,label,body');
    if (!blk) continue;
    const before = document.createRange(); before.setStart(blk, 0); before.setEndBefore(a);
    const pre = norm(before.toString()), self = norm(a.textContent || ''), post = norm(blk.textContent || '').slice(pre.length + self.length);
    const start = Math.max(pre.search(/[.!?](?=\s)[^.!?]*$/) + 1, 0);
    const endM = post.search(/[.!?](\s|$)/);
    let rest = (pre.slice(start) + self + (endM >= 0 ? post.slice(0, endM + 1) : post)).trim();
    for (const l of blk.querySelectorAll('a[href],[role="link"]')) { const lt = norm(l.textContent || '').trim(); if (lt) rest = rest.split(lt).join(' '); }
    if (rest.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length >= 2) n++;
  }
  return n;
}

(async () => {
  const cases = CORPORA[process.argv[2]]().filter((c) => c.scs.some((s) => CONTENT_SCS.has(s)));
  const browser = await launchBrowser();
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < cases.length) {
      const c = cases[i++];
      let page = null;
      try { page = await openPage(browser, c.url); const n = await page.evaluate(sentenceLinks); if (n) out.push(`${c.id}\t${c.scs.filter((s) => CONTENT_SCS.has(s)).join(',')}\t${n}`); }
      catch (e) { out.push(`ERROR\t${c.id}\t${String(e.message).slice(0, 100)}`); }
      finally { if (page) await page.close().catch(() => {}); }
    }
  }));
  await browser.close();
  if (args.out) fs.writeFileSync(args.out, out.join('\n') + '\n');
  console.log(`${process.argv[2]}: ${cases.length} cases with 1.1.1/1.4.3/2.4.4; ${out.filter((l) => !l.startsWith('ERROR')).length} affected; ${out.filter((l) => l.startsWith('ERROR')).length} errors`);
})();
