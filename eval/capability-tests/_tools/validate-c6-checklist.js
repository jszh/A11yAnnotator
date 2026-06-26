'use strict';
const fs=require('fs'),path=require('path'),puppeteer=require('puppeteer');
const { runReflow }=require('../../../scripts/v3/lib/reflow-runner.js');
const { runReflowChecklist }=require('../../../scripts/v3/lib/reflow-checklist.js');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT=path.resolve(__dirname,'..','1.4.10');const ASPECTS=['meaningful-indentation-vs-gratuitous-g224','f102-content-disappears-no-equivalent','long-unbreakable-string-overflow-c33'];
const score=(g,e)=>g==='pass'?(e==='passed'?'ok':'FALSE-CLEAR'):g==='fail'?(e==='failed'?'ok':'FALSE-BARRIER'):'abstain';
const k=s=>s==='FALSE-CLEAR'?'fc':s==='FALSE-BARRIER'?'fb':s==='abstain'?'ab':'ok';
(async()=>{const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});const p=await b.newPage();
 const agg={det:{fc:0,fb:0,ab:0,ok:0},wrap:{fc:0,fb:0,ab:0,ok:0}};let newFC=0;const flips=[];
 for(const aspect of ASPECTS){let rows=JSON.parse(fs.readFileSync(path.join(ROOT,aspect,'labels.json'),'utf8'));rows=Array.isArray(rows)?rows:rows.cases;
  for(const row of rows){const file=path.join(ROOT,aspect,path.basename(row.file));if(!fs.existsSync(file))continue;const url='file://'+file;
   await p.setViewport({width:1280,height:800});const det=await runReflow(p,{url}).catch(()=>({}));const dv=det.abstain?'abstain':(det.verdict||'none');const ds=score(dv,row.expected);
   let wv=dv,ws=ds,via='';
   if(dv==='abstain'||(dv==='fail'&&(det.kind==='f102-disappearance'||/unbreakable/.test(det.culprit||'')))){await p.setViewport({width:1280,height:800});const w=await runReflowChecklist(p,{url}).catch(()=>({}));wv=w.abstain?'abstain':(w.verdict||'none');ws=score(wv,row.expected);via=w.via||'';}
   agg.det[k(ds)]++;agg.wrap[k(ws)]++;if(ws==='FALSE-CLEAR'&&ds!=='FALSE-CLEAR'){newFC++;flips.push('FC '+row.file+' ['+aspect.slice(0,18)+'] via '+via);}
   if(dv!==wv)flips.push(row.file+' ['+aspect.slice(0,18)+'] exp='+row.expected+' '+dv+'→'+wv+'/'+ws+(via?' via '+via:''));}}
 await b.close();const f=o=>o.fc+' FC, '+o.fb+' FB, '+o.ab+' abstain, '+o.ok+' ok';
 console.log('C6 DET:  '+f(agg.det));console.log('C6 CHECKLIST(+LLM):'+f(agg.wrap)+'   NEW FALSE-CLEARS: '+newFC);
 console.log('flips:');for(const x of flips.slice(0,16))console.log('  '+x);
})().catch(e=>{console.error(e.stack);process.exit(1);});
