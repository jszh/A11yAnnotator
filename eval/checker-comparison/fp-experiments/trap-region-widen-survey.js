#!/usr/bin/env node
'use strict';
// What would WIDENING `TRAP_REGION_SEL` actually change, per candidate term, on the real corpora?
//
// Written because a `grep -l` estimate of the selector's gaps was wrong by roughly an order of magnitude.
// Counting PAGES THAT CONTAIN A STRING answers a different question from ELEMENTS THE SELECTOR FAILS TO
// MATCH, and the two diverge exactly where it matters: authors pile redundant signals onto one element, so
// every `role="alertdialog"` in this corpus also carries `aria-modal` or a dialog-ish class and is already
// matched. Per element, against the live DOM, is the only form of this count that means anything.
//
// Two numbers are reported per candidate term, and the SECOND is the one that decides:
//   newCandidateRegions - containers `detectKeyboardTraps` would newly enumerate. Cheap to be wrong about:
//                         the detector only REPORTS a region when Tab, Shift+Tab, Esc and a close control
//                         ALL fail to escape.
//   newFocusRisk        - focusables that would newly gain `focusRisk` in act-page-collect, i.e. NEW 2.1.2
//                         OBLIGATIONS. Expensive to be wrong about: an obligation the deterministic lane
//                         cannot settle becomes an autoPartial, and autoPartials are LLM-lane surface —
//                         where 47 of the 49 false positives in the 585-case run lived.
//
// Usage: node eval/checker-comparison/fp-experiments/trap-region-widen-survey.js
const fs=require('fs'), path=require('path'), puppeteer=require('puppeteer');
const kg=require('./scripts/v3/lib/kbd-graph.js');
const CHROME=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CUR=kg.TRAP_REGION_SEL;
const ADD=['[role=alertdialog]','[popover]','[role=application]','[role=menubar]','[role=tree]','[role=treegrid]','[role=radiogroup]','[class*=drawer i]','[class*=offcanvas i]','[class*=flyout i]','[class*=sheet i]'];

function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
  if(e.isDirectory())walk(p,out); else if(e.name.endsWith('.html'))out.push(p);} return out;}
const roots=['eval/act-augmented','eval/checker-comparison/act-subset'].filter(fs.existsSync);
const files=roots.flatMap(r=>walk(r));

(async()=>{
const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--allow-file-access-from-files']});
const tot={}; for(const a of ADD) tot[a]={pagesWithNewRegion:0, newCandidateRegions:0, newFocusRiskEls:0, pages:[]};
let scanned=0;
for(const f of files){
  const page=await b.newPage();
  try{
    await page.goto('file://'+path.resolve(f),{waitUntil:'domcontentloaded',timeout:8000});
    const r=await page.evaluate((cur,add,focSel)=>{
      const vis=x=>x.offsetParent!==null||getComputedStyle(x).position==='fixed';
      const focus=[...document.querySelectorAll(focSel)].filter(vis);
      const out={};
      for(const sel of add){
        let cand=0, risk=0;
        let els=[]; try{els=[...document.querySelectorAll(sel)];}catch(e){continue;}
        for(const el of els){
          if(el.matches(cur)) continue;                 // already covered
          const inside=[...el.querySelectorAll(focSel)].filter(vis);
          if(inside.length>=2) cand++;                  // becomes a detector candidate
        }
        for(const f2 of focus){
          if(f2.closest(cur)) continue;                 // already has focusRisk via the current list
          if(f2.hasAttribute('onblur')||f2.hasAttribute('onfocus')||f2.hasAttribute('onfocusout')) continue;
          try{ if(f2.closest(sel)) risk++; }catch(e){}  // would NEWLY gain focusRisk => a new obligation
        }
        if(cand||risk) out[sel]={cand,risk};
      }
      return out;
    },CUR,ADD,kg.FOCUSABLE_SEL);
    scanned++;
    for(const [sel,v] of Object.entries(r)){
      tot[sel].newCandidateRegions+=v.cand; tot[sel].newFocusRiskEls+=v.risk;
      if(v.cand||v.risk){tot[sel].pagesWithNewRegion++; tot[sel].pages.push(f);}
    }
  }catch(e){}
  await page.close();
}
await b.close();
console.log('pages scanned:',scanned,'of',files.length,'\n');
console.log('addition'.padEnd(22)+'pages'.padStart(7)+'newCandidateRegions'.padStart(22)+'newFocusRisk(obligations)'.padStart(26));
for(const a of ADD){const t=tot[a]; if(!t.pagesWithNewRegion) {console.log(a.padEnd(22)+'—'.padStart(7)); continue;}
  console.log(a.padEnd(22)+String(t.pagesWithNewRegion).padStart(7)+String(t.newCandidateRegions).padStart(22)+String(t.newFocusRiskEls).padStart(26));}
fs.writeFileSync('/tmp/widen-survey.json',JSON.stringify(tot,null,1));
console.log('\naffected pages by SC (for the additions that do anything):');
const bySc={};
for(const a of ADD) for(const p of tot[a].pages){const m=p.match(/act-augmented\/([\d.]+)\//); const k=m?m[1]:'act-subset'; bySc[k]=bySc[k]||new Set(); bySc[k].add(p);}
for(const [k,v] of Object.entries(bySc)) console.log('  SC '+k+': '+v.size+' pages');
})();
