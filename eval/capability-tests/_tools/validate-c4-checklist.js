'use strict';
const fs=require('fs'),path=require('path'),puppeteer=require('puppeteer');
const { runNonTextContrast }=require('../../../scripts/v3/lib/nontext-contrast-runner.js');
const { runNonTextContrastChecklist }=require('../../../scripts/v3/lib/nontext-contrast-checklist.js');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT=path.resolve(__dirname,'..','1.4.11');
const ASPECTS=process.argv.slice(2).length?process.argv.slice(2):['boundary-is-only-cue-context-flip','exemption-boundaries-inactive-hover-essential-symbolic','graphical-object-required-for-understanding','state-indicator-contrast-adjacent-surface'];
const D=['[data-test-target]','.btn','.button','.toggle','.switch','.chip','.cta','.control','.field','.input','.indicator','.dot','.badge','.pill','.icon-btn','.tab','button','[role=button]','[role=switch]','[role=checkbox]','[role=tab]','[role=slider]','[role=radio]','input:not([type=hidden])','select','textarea','a[href]','svg'];
const score=(got,exp)=>got==='pass'?(exp==='passed'?'ok':'FALSE-CLEAR'):got==='fail'?(exp==='failed'?'ok':'FALSE-BARRIER'):'abstain';
(async()=>{const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:1000,height:800});
 const agg={det:{fc:0,fb:0,ab:0,ok:0},wrap:{fc:0,fb:0,ab:0,ok:0}};const flips=[];
 for(const aspect of ASPECTS){const mf=path.join(ROOT,aspect,'labels.json');if(!fs.existsSync(mf))continue;let rows=JSON.parse(fs.readFileSync(mf,'utf8'));rows=Array.isArray(rows)?rows:rows.cases;
  for(const row of rows){const file=path.join(ROOT,aspect,path.basename(row.file));if(!fs.existsSync(file))continue;
   await p.goto('file://'+file,{waitUntil:'load'}).catch(()=>{});
   const tagged=await p.evaluate(o=>{for(const s of o){const e=[...document.querySelectorAll('body '+s)].filter(x=>{const r=x.getBoundingClientRect();return r.width>2&&r.height>2;});if(e.length){e[0].setAttribute('data-test-target','1');return true;}}return false;},D);
   const focusState=/focus/i.test(row.dimension||'')||/focus/i.test(aspect);
   const sel=tagged?'[data-test-target="1"]':'body';
   const det=await runNonTextContrast(p,{selector:sel,focusState}).catch(()=>({}));
   const detV=det.abstain?'abstain':(det.verdict||'none');
   const detS=score(detV==='none'?'abstain':detV,row.expected);
   let wrapV=detV,wrapS=detS,via='';
   if(detV==='fail'||detV==='abstain'){ // micro-check fires
     const w=await runNonTextContrastChecklist(p,{selector:sel,focusState}).catch(e=>({error:e.message}));
     wrapV=w.abstain?'abstain':(w.verdict||'none');wrapV=wrapV==='none'?'abstain':wrapV;wrapS=score(wrapV,row.expected);via=w.via||'';
   }
   const k=s=>s==='FALSE-CLEAR'?'fc':s==='FALSE-BARRIER'?'fb':s==='abstain'?'ab':'ok';
   agg.det[k(detS)]++;agg.wrap[k(wrapS)]++;
   if(detV!==wrapV)flips.push({aspect:aspect.slice(0,20),file:row.file,exp:row.expected,det:detV+'/'+detS,wrap:wrapV+'/'+wrapS,via});
  }}
 await b.close();
 const pct=o=>o.fc+' FC, '+o.fb+' FB, '+o.ab+' abstain, '+o.ok+' ok';
 console.log('DETERMINISTIC:  '+pct(agg.det));
 console.log('CHECKLIST(+LLM):'+pct(agg.wrap));
 console.log('\nflips (det → wrapped):');for(const f of flips)console.log('  '+f.file+' ['+f.aspect+'] exp='+f.exp+'  '+f.det+' → '+f.wrap+(f.via?' via '+f.via:''));
 fs.writeFileSync(path.join(__dirname,'c4-checklist-validation.json'),JSON.stringify({agg,flips},null,2));
})().catch(e=>{console.error(e.stack);process.exit(1);});
