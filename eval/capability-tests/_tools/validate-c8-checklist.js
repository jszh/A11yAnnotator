'use strict';
const fs=require('fs'),path=require('path'),puppeteer=require('puppeteer');
const { runSmallSignal }=require('../../../scripts/v3/lib/small-signals.js');
const { runSmallSignalChecklist }=require('../../../scripts/v3/lib/small-signals-checklist.js');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT=path.resolve(__dirname,'..','C8-signals');
const ASPECTS=['iframe-name-vs-content','glyph-substitution','long-description-presence'];
const score=(g,e)=>g==='pass'?(e==='passed'?'ok':'FALSE-CLEAR'):g==='fail'?(e==='failed'?'ok':'FALSE-BARRIER'):'abstain';
const k=s=>s==='FALSE-CLEAR'?'fc':s==='FALSE-BARRIER'?'fb':s==='abstain'?'ab':'ok';
(async()=>{const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:1000,height:800});
 const agg={det:{fc:0,fb:0,ab:0,ok:0},wrap:{fc:0,fb:0,ab:0,ok:0}};const flips=[];
 for(const aspect of ASPECTS){const mf=path.join(ROOT,aspect,'labels.json');if(!fs.existsSync(mf))continue;let rows=JSON.parse(fs.readFileSync(mf,'utf8'));rows=Array.isArray(rows)?rows:rows.cases;
  for(const row of rows){const file=path.join(ROOT,aspect,path.basename(row.file));if(!fs.existsSync(file))continue;
   await p.goto('file://'+file,{waitUntil:'load'}).catch(()=>{});
   const det=await runSmallSignal(p,{aspect,targetSelector:row.targetSelector}).catch(()=>({}));const detV=det.abstain?'abstain':(det.verdict||'none');const detS=score(detV,row.expected);
   let wrapV=detV,wrapS=detS,via='';
   if(detV==='abstain'){const w=await runSmallSignalChecklist(p,{aspect,targetSelector:row.targetSelector}).catch(e=>({error:e.message}));wrapV=w.abstain?'abstain':(w.verdict||'none');wrapS=score(wrapV,row.expected);via=w.via||'';}
   agg.det[k(detS)]++;agg.wrap[k(wrapS)]++;
   if(detV!==wrapV)flips.push({aspect:aspect.slice(0,16),file:row.file,exp:row.expected,wrap:wrapV+'/'+wrapS,via});
  }}
 await b.close();
 const f=o=>o.fc+' FC, '+o.fb+' FB, '+o.ab+' abstain, '+o.ok+' ok';
 console.log('C8 DETERMINISTIC:  '+f(agg.det));console.log('C8 CHECKLIST(+LLM):'+f(agg.wrap));
 const newFC=flips.filter(x=>/FALSE-CLEAR/.test(x.wrap));console.log('\nNEW FALSE-CLEARS: '+newFC.length);for(const x of newFC)console.log('   '+x.file+' ['+x.aspect+'] via '+x.via);
 console.log('escalations (sample):');for(const x of flips.filter(x=>/fail/.test(x.wrap)).slice(0,12))console.log('  '+x.file+' ['+x.aspect+'] exp='+x.exp+' → '+x.wrap);
 fs.writeFileSync(path.join(__dirname,'c8-checklist-validation.json'),JSON.stringify({agg,flips},null,2));
})().catch(e=>{console.error(e.stack);process.exit(1);});
