// Verification harness: loads each case at 320x256 in headless Chrome and runs the EXACT
// measureReflow() logic ported from scripts/v3/lib/exp-runners.js, then compares the predicted
// runner outcome against the labels. Confirms runner + label assertions agree.
const fs=require('fs'),path=require('path');
const puppeteer=require('puppeteer');
const ROOT=path.resolve(__dirname,'..');
const MINE=['non-excepted-horizontal-overflow-at-320px','f102-content-disappears-no-equivalent','long-unbreakable-string-overflow-c33','sticky-fixed-content-consumes-small-viewport'];

// ---- ported verbatim from exp-runners.js measureReflow() ----
function measureReflow(){
  const se=document.scrollingElement||document.documentElement;
  const SLOP=2;
  const horizontalScrollPresent=se.scrollWidth>se.clientWidth+SLOP;
  const vw=window.innerWidth;
  let dataTableExemptionApplied=false;
  const isExempt=(el)=>{
    for(let p=el;p;p=p.parentElement){
      const tag=p.tagName,role=p.getAttribute&&p.getAttribute('role');
      if(tag==='MAP'||tag==='SVG'||(role&&/^(table|grid|treegrid)$/.test(role)))return true;
      if(tag==='TABLE'&&(p.querySelector('th, caption')||/^(table|grid|treegrid)$/.test(role||''))){dataTableExemptionApplied=true;return true;}
      const ov=getComputedStyle(p).overflowX;
      if(ov==='auto'||ov==='scroll')return true;
    }
    return false;
  };
  let overflowSourceLocated=false,anyNonExempt=false,clipHidingDetected=false;
  const all=document.body?document.body.querySelectorAll('*'):[];
  for(const el of all){
    const cs=getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden')continue;
    const r=el.getBoundingClientRect();
    if(r.width<1||r.height<1)continue;
    if(r.right>vw+SLOP&&r.left<vw){overflowSourceLocated=true;if(!isExempt(el))anyNonExempt=true;}
    if((cs.overflowX==='hidden'||cs.overflowX==='clip')&&el.scrollWidth>el.clientWidth+SLOP)clipHidingDetected=true;
  }
  return {horizontalScrollPresent,overflowSourceLocated,clipHidingDetected,dataTableExemptionApplied,
    allOverflowExemptOr2D:overflowSourceLocated&&!anyNonExempt,
    overflowBarrierObserved:horizontalScrollPresent&&overflowSourceLocated&&anyNonExempt,
    scrollWidth:se.scrollWidth,clientWidth:se.clientWidth};
}

(async()=>{
  const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
  const rows=[];
  for(const d of MINE){
    const labels=JSON.parse(fs.readFileSync(path.join(ROOT,d,'labels.json')));
    for(const l of labels){
      const page=await browser.newPage();
      await page.setViewport({width:320,height:256,deviceScaleFactor:1});
      await page.goto('file://'+path.join(ROOT,d,l.file),{waitUntil:'networkidle0'});
      const m=await page.evaluate(measureReflow);
      await page.close();
      // The runner publishes a BARRIER when overflowBarrierObserved OR clipHidingDetected (clip lane).
      // It can otherwise only DEFER/abstain. So "runner can decide a barrier" =
      //   overflowBarrierObserved || clipHidingDetected.
      const runnerBarrier=m.overflowBarrierObserved||m.clipHidingDetected;
      rows.push({aspect:d,file:l.file,polarity:l.polarity,expected:l.expected,runnerShould:l.runnerShould,
        hsp:m.horizontalScrollPresent,src:m.overflowSourceLocated,nonExemptBarrier:m.overflowBarrierObserved,
        clip:m.clipHidingDetected,exemptApplied:m.dataTableExemptionApplied,allExempt:m.allOverflowExemptOr2D,
        sw:m.scrollWidth,cw:m.clientWidth,runnerBarrier});
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname,'verify-out.json'),JSON.stringify(rows,null,2));

  // ---- consistency checks against labels ----
  // For runnerShould:"decide" + positive => we expect the runner to actually see a barrier
  //   (overflowBarrierObserved or clip).
  // For runnerShould:"decide" + negative => runner must NOT see a barrier (clean).
  // For runnerShould:"abstain" => the single-axis probe should NOT be able to decide a barrier
  //   (no overflowBarrier and no clip) — i.e. it genuinely needs the LLM/wide-vs-320/vision lane.
  let problems=[];
  for(const r of rows){
    if(r.runnerShould==='decide'&&r.polarity==='positive'&&!r.runnerBarrier)
      problems.push(`DECIDE-POS but runner sees NO barrier: ${r.aspect}/${r.file} (hsp=${r.hsp} src=${r.src} nonExempt=${r.nonExemptBarrier} clip=${r.clip} sw=${r.sw})`);
    if(r.runnerShould==='decide'&&r.polarity==='negative'&&r.runnerBarrier)
      problems.push(`DECIDE-NEG but runner SEES a barrier: ${r.aspect}/${r.file} (hsp=${r.hsp} src=${r.src} nonExempt=${r.nonExemptBarrier} clip=${r.clip} sw=${r.sw})`);
    if(r.runnerShould==='abstain'&&r.runnerBarrier)
      problems.push(`ABSTAIN but runner SEES a barrier (so it could decide): ${r.aspect}/${r.file} (nonExempt=${r.nonExemptBarrier} clip=${r.clip} sw=${r.sw})`);
  }
  console.log(`\nRan ${rows.length} cases.`);
  if(problems.length){console.log(`\n${problems.length} MISMATCHES:`);problems.forEach(p=>console.log('  '+p));}
  else console.log('All runner measurements consistent with labels.');
})().catch(e=>{console.error(e);process.exit(1)});
