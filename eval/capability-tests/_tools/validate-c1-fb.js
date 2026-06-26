'use strict';
const fs=require('fs'),path=require('path'),puppeteer=require('puppeteer');
const { runStateColor, runDynamicNRV }=require('../../../scripts/v3/lib/interaction-capture.js');
const { runInteractionChecklist }=require('../../../scripts/v3/lib/interaction-checklist.js');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SC={'C1-state-color':[['inline-link-color-state','1.4.1'],['ui-status-color-state','1.4.1'],['state-dependent-text-contrast','1.4.3'],['state-indicator-contrast','1.4.11']],'C1-dynamic-nrv':[['stale-name-after-activation'],['value-not-settable-or-change-not-notified'],['dynamic-named-component-text-alt-stale'],['stale-or-contradicting-state-value']]};
const score=(g,e)=>g==='pass'?(e==='passed'?'ok':'FALSE-CLEAR'):g==='fail'?(e==='failed'?'ok':'FALSE-BARRIER'):'abstain';
const k=s=>s==='FALSE-CLEAR'?'fc':s==='FALSE-BARRIER'?'fb':s==='abstain'?'ab':'ok';
(async()=>{const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:1000,height:800});
 const agg={det:{fc:0,fb:0,ab:0,ok:0},wrap:{fc:0,fb:0,ab:0,ok:0}};const cleared=[],newfc=[];
 for(const [grp,aspects] of Object.entries(SC)){const dyn=grp==='C1-dynamic-nrv';
  for(const [aspect,sc] of aspects){const dir=path.resolve(__dirname,'..',grp,aspect);const mf=path.join(dir,'labels.json');if(!fs.existsSync(mf))continue;let rows=JSON.parse(fs.readFileSync(mf,'utf8'));rows=Array.isArray(rows)?rows:rows.cases;
   for(const row of rows){const file=path.join(dir,path.basename(row.file));if(!fs.existsSync(file))continue;
    await p.goto('file://'+file,{waitUntil:'load'}).catch(()=>{});
    const det=dyn?await runDynamicNRV(p,{targetSelector:row.targetSelector||'#t',activation:row.activation||'click'}).catch(()=>({})):await runStateColor(p,{targetSelector:row.targetSelector||'#t',state:row.state||'hover',sc}).catch(()=>({}));
    const dv=det.abstain?'abstain':(det.verdict||'none');const ds=score(dv,row.expected);
    let wv=dv,ws=ds;
    if(dv==='fail'){await p.goto('file://'+file,{waitUntil:'load'}).catch(()=>{});const w=await runInteractionChecklist(p,dyn?{mode:'dynamic-nrv',targetSelector:row.targetSelector||'#t',activation:row.activation||'click'}:{mode:'state-color',targetSelector:row.targetSelector||'#t',state:row.state||'hover',sc}).catch(()=>({}));wv=w.abstain?'abstain':(w.verdict||'none');ws=score(wv,row.expected);
     if(dv==='fail'&&wv==='pass'){if(row.expected==='passed')cleared.push(aspect.slice(0,16)+'/'+row.file+' ['+row.dimension+']');else newfc.push(aspect.slice(0,16)+'/'+row.file+' ['+row.dimension+']');}}
    agg.det[k(ds)]++;agg.wrap[k(ws)]++;}}}
 await b.close();const f=o=>o.fc+' FC, '+o.fb+' FB, '+o.ab+' abstain, '+o.ok+' ok';
 console.log('C1 DET:  '+f(agg.det));console.log('C1 WRAP: '+f(agg.wrap));
 console.log('\nFALSE-BARRIERS CLEARED ('+cleared.length+'):');for(const c of cleared)console.log('  ✓ '+c);
 console.log('NEW FALSE-CLEARS ('+newfc.length+'):');for(const c of newfc)console.log('  ✗ '+c);
})().catch(e=>{console.error(e.stack);process.exit(1);});
