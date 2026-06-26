'use strict';
const fs=require('fs'),path=require('path'),puppeteer=require('puppeteer');
const { runReveal }=require('../../../scripts/v3/lib/reveal-state-runner.js');
const { runRevealChecklist }=require('../../../scripts/v3/lib/reveal-checklist.js');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT=path.resolve(__dirname,'..','C2-reveal'),ASPECT='focus-revealed-instruction';
const score=(g,e)=>g==='pass'?(e==='passed'?'ok':'FALSE-CLEAR'):g==='fail'?(e==='failed'?'ok':'FALSE-BARRIER'):'abstain';
const k=s=>s==='FALSE-CLEAR'?'fc':s==='FALSE-BARRIER'?'fb':s==='abstain'?'ab':'ok';
(async()=>{const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:1000,height:800});
 let rows=JSON.parse(fs.readFileSync(path.join(ROOT,ASPECT,'labels.json'),'utf8'));rows=Array.isArray(rows)?rows:rows.cases;
 const agg={det:{fc:0,fb:0,ab:0,ok:0},wrap:{fc:0,fb:0,ab:0,ok:0}};let newFC=0;
 for(const row of rows){const file=path.join(ROOT,ASPECT,path.basename(row.file));if(!fs.existsSync(file))continue;
  const args={aspect:ASPECT,triggerSelector:row.triggerSelector,interaction:row.interaction,revealedSelector:row.revealedSelector,expectFocusReturn:row.expectFocusReturn};
  await p.goto('file://'+file,{waitUntil:'load'}).catch(()=>{});const det=await runReveal(p,args).catch(()=>({}));const dv=det.abstain?'abstain':(det.verdict||'none');const ds=score(dv,row.expected);
  let wv=dv,ws=ds;if(dv==='abstain'){await p.goto('file://'+file,{waitUntil:'load'}).catch(()=>{});const w=await runRevealChecklist(p,args).catch(()=>({}));wv=w.abstain?'abstain':(w.verdict||'none');ws=score(wv,row.expected);}
  agg.det[k(ds)]++;agg.wrap[k(ws)]++;if(ws==='FALSE-CLEAR'&&ds!=='FALSE-CLEAR')newFC++;}
 await b.close();const f=o=>o.fc+' FC, '+o.fb+' FB, '+o.ab+' abstain, '+o.ok+' ok';
 console.log('C2 (focus-revealed-instruction) DET:  '+f(agg.det));console.log('C2 CHECKLIST(+LLM):'+f(agg.wrap)+'   NEW FALSE-CLEARS: '+newFC);
})().catch(e=>{console.error(e.stack);process.exit(1);});
