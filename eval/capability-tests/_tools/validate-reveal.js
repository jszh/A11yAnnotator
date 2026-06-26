'use strict';
const fs=require('fs'),path=require('path'),puppeteer=require('puppeteer');
const { runReveal }=require('../../../scripts/v3/lib/reveal-state-runner.js');
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT=path.resolve(__dirname,'..','C2-reveal');
(async()=>{const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});const page=await browser.newPage();
 const tally={};const mismatches=[];
 for(const aspect of fs.readdirSync(ROOT).filter(d=>!d.startsWith('_')&&fs.statSync(path.join(ROOT,d)).isDirectory()).sort()){
  const mf=path.join(ROOT,aspect,'labels.json');if(!fs.existsSync(mf))continue;
  let rows;try{rows=JSON.parse(fs.readFileSync(mf,'utf8'));}catch(e){continue;}rows=Array.isArray(rows)?rows:(rows.cases||[]);
  const t=tally[aspect]={n:0,correct:0,decidedN:0,falseClear:0,falseBarrier:0};
  for(const row of rows){const file=path.isAbsolute(row.file)?row.file:path.join(ROOT,aspect,path.basename(row.file));if(!fs.existsSync(file))continue;t.n++;
   await page.goto('file://'+file,{waitUntil:'load'}).catch(()=>{});
   const r=await runReveal(page,{aspect,triggerSelector:row.triggerSelector,interaction:row.interaction,revealedSelector:row.revealedSelector,expectFocusReturn:row.expectFocusReturn}).catch(()=>({}));
   const got=r.abstain?'abstain':(r.verdict||'none');const decided=(got==='pass'||got==='fail');if(decided)t.decidedN++;
   if(got==='pass'&&row.expected==='failed'){t.falseClear++;mismatches.push({aspect,file:path.basename(file),kind:'FALSE-CLEAR',dim:row.dimension,reason:r.reason});}
   else if(got==='fail'&&row.expected==='passed'){t.falseBarrier++;mismatches.push({aspect,file:path.basename(file),kind:'FALSE-BARRIER',dim:row.dimension,reason:r.reason});}
   let ok;if(row.runnerShould==='abstain')ok=(got==='abstain')||(row.expected==='passed'?got==='pass':got==='fail');else if(row.expected==='passed')ok=(got==='pass'||got==='abstain');else ok=(got==='fail');
   if(ok)t.correct++;}}
 await browser.close();
 console.log('=== C2 reveal-state runner vs independent corpus ===');let N=0,C=0,FC=0,FB=0;
 for(const[a,t]of Object.entries(tally)){N+=t.n;C+=t.correct;FC+=t.falseClear;FB+=t.falseBarrier;console.log('  '+a.padEnd(42)+' acc '+t.correct+'/'+t.n+'  decided '+t.decidedN+'/'+t.n+'  '+(t.falseClear+t.falseBarrier?'⚠ FC'+t.falseClear+' FB'+t.falseBarrier:'clean'));}
 console.log('\nTOTAL: '+C+'/'+N+' ('+(100*C/(N||1)).toFixed(1)+'%) · DANGEROUS: '+FC+' false-clear, '+FB+' false-barrier');
 console.log('\nDANGEROUS ('+mismatches.length+'):');for(const m of mismatches.slice(0,30))console.log('  ',JSON.stringify(m));
 fs.writeFileSync(path.join(__dirname,'reveal-validation.json'),JSON.stringify({tally,mismatches},null,2));
})().catch(e=>{console.error(e.stack);process.exit(1);});
