'use strict';
const fs=require('fs'),path=require('path'),puppeteer=require('puppeteer');
const { runFormBinding }=require('../../../scripts/v3/lib/form-binding-runner.js');
const { runFormBindingChecklist }=require('../../../scripts/v3/lib/form-binding-checklist.js');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT=path.resolve(__dirname,'..');
const ASPECTS=[['3.3.1','error-vs-actual-constraint-match'],['3.3.1','error-indicator-name-correctness'],['3.3.1','error-summary-coherence'],['3.3.2','instruction-vs-constraint-consistency'],['3.3.3','suggestion-correctness-vs-constraint'],['3.3.3','security-exception-classification']];
const score=(got,exp)=>got==='pass'?(exp==='passed'?'ok':'FALSE-CLEAR'):got==='fail'?(exp==='failed'?'ok':'FALSE-BARRIER'):'abstain';
const k=s=>s==='FALSE-CLEAR'?'fc':s==='FALSE-BARRIER'?'fb':s==='abstain'?'ab':'ok';
(async()=>{const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:1000,height:900});
 const agg={det:{fc:0,fb:0,ab:0,ok:0},wrap:{fc:0,fb:0,ab:0,ok:0}};const flips=[];
 for(const [sc,aspect] of ASPECTS){const mf=path.join(ROOT,sc,aspect,'labels.json');if(!fs.existsSync(mf))continue;let rows=JSON.parse(fs.readFileSync(mf,'utf8'));rows=Array.isArray(rows)?rows:rows.cases;
  for(const row of rows){const file=path.join(ROOT,sc,aspect,path.basename(row.file));if(!fs.existsSync(file))continue;
   await p.goto('file://'+file,{waitUntil:'load'}).catch(()=>{});
   const args={fieldSelector:row.fieldSelector||'[data-test-field]',submitSelector:row.submitSelector||'button[type=submit],[type=submit]',invalidValue:row.invalidValue!=null?row.invalidValue:'',aspect};
   const det=await runFormBinding(p,args).catch(()=>({}));const detV=det.abstain?'abstain':(det.verdict||'none');const detS=score(detV,row.expected);
   let wrapV=detV,wrapS=detS,via='';
   if(detV==='abstain'){await p.goto('file://'+file,{waitUntil:'load'}).catch(()=>{});const w=await runFormBindingChecklist(p,args).catch(e=>({error:e.message}));wrapV=w.abstain?'abstain':(w.verdict||'none');wrapS=score(wrapV,row.expected);via=w.via||(w.checklist&&w.checklist[0]&&w.checklist[0].check)||'';}
   agg.det[k(detS)]++;agg.wrap[k(wrapS)]++;
   if(detV!==wrapV)flips.push({aspect:aspect.slice(0,22),file:row.file,exp:row.expected,wrap:wrapV+'/'+wrapS,via});
  }}
 await b.close();
 const f=o=>o.fc+' FC, '+o.fb+' FB, '+o.ab+' abstain, '+o.ok+' ok';
 console.log('C5 DETERMINISTIC:  '+f(agg.det));console.log('C5 CHECKLIST(+LLM):'+f(agg.wrap));
 const newFC=flips.filter(x=>/FALSE-CLEAR/.test(x.wrap));
 console.log('\nNEW FALSE-CLEARS (dangerous): '+newFC.length);for(const x of newFC)console.log('   '+x.file+' ['+x.aspect+'] via '+x.via);
 console.log('\nresolved abstains (sample):');for(const x of flips.filter(x=>!/FALSE-CLEAR/.test(x.wrap)).slice(0,16))console.log('  '+x.file+' ['+x.aspect+'] exp='+x.exp+' → '+x.wrap+' via '+x.via);
 fs.writeFileSync(path.join(__dirname,'c5-checklist-validation.json'),JSON.stringify({agg,flips},null,2));
})().catch(e=>{console.error(e.stack);process.exit(1);});
