'use strict';
const fs=require('fs'),path=require('path'),puppeteer=require('puppeteer');
const { runStateColor }=require('../../../scripts/v3/lib/interaction-capture.js');
const { runInteractionChecklist }=require('../../../scripts/v3/lib/interaction-checklist.js');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT=path.resolve(__dirname,'..','C1-state-color');const ASPECTS=['inline-link-color-state','ui-status-color-state'];
const score=(g,e)=>g==='pass'?(e==='passed'?'ok':'FALSE-CLEAR'):g==='fail'?(e==='failed'?'ok':'FALSE-BARRIER'):'abstain';
const k=s=>s==='FALSE-CLEAR'?'fc':s==='FALSE-BARRIER'?'fb':s==='abstain'?'ab':'ok';
(async()=>{const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:1000,height:800});
 const agg={det:{fc:0,fb:0,ab:0,ok:0},wrap:{fc:0,fb:0,ab:0,ok:0}};let newFC=0,caught=0;
 for(const aspect of ASPECTS){let rows=JSON.parse(fs.readFileSync(path.join(ROOT,aspect,'labels.json'),'utf8'));rows=Array.isArray(rows)?rows:rows.cases;
  for(const row of rows){const file=path.join(ROOT,aspect,path.basename(row.file));if(!fs.existsSync(file))continue;
   await p.goto('file://'+file,{waitUntil:'load'}).catch(()=>{});
   const a={targetSelector:row.targetSelector||'#t',state:row.state||'hover',sc:row.sc||'1.4.1'};
   const det=await runStateColor(p,a).catch(()=>({}));const dv=det.abstain?'abstain':(det.verdict||'none');const ds=score(dv,row.expected);
   let wv=dv,ws=ds;if(dv==='abstain'){await p.goto('file://'+file,{waitUntil:'load'}).catch(()=>{});const w=await runInteractionChecklist(p,{mode:'state-color',...a}).catch(()=>({}));wv=w.abstain?'abstain':(w.verdict||'none');ws=score(wv,row.expected);if(wv==='fail'&&row.expected==='failed')caught++;}
   agg.det[k(ds)]++;agg.wrap[k(ws)]++;if(ws==='FALSE-CLEAR'&&ds!=='FALSE-CLEAR')newFC++;}}
 await b.close();const f=o=>o.fc+' FC, '+o.fb+' FB, '+o.ab+' abstain, '+o.ok+' ok';
 console.log('C1 (use-of-color 1.4.1) DET:  '+f(agg.det));console.log('C1 CHECKLIST(+LLM):'+f(agg.wrap)+'   NEW FALSE-CLEARS: '+newFC+', barriers caught: '+caught);
})().catch(e=>{console.error(e.stack);process.exit(1);});
