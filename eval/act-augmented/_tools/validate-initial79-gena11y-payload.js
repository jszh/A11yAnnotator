#!/usr/bin/env node
'use strict';

/**
 * Payload-level validator for the initial 79-case context-extraction stratum.
 *
 * The extraction routines below intentionally mirror:
 *   eval/gena11y/extract_elements.py::extract_visual_elements
 *   eval/gena11y/extract_elements.py::extract_links
 *
 * This validator checks the complete per-page payload, not merely the selected
 * target snippet. A fixture passes only when:
 *   1. every selected target is in the relevant GenA11y extraction lane;
 *   2. every selected target references non-self visible IDREF evidence;
 *   3. that evidence is absent from the complete extracted page payload; and
 *   4. Chromium exposes the evidence in the target's AX name or description.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '../../..');
function arg(name, fallback) {
  const token=process.argv.find((value)=>value===`--${name}`||value.startsWith(`--${name}=`));
  if(!token)return fallback;
  if(token.includes('='))return token.slice(token.indexOf('=')+1);
  const next=process.argv[process.argv.indexOf(token)+1];
  return next&&!next.startsWith('--')?next:fallback;
}
const LIST_ARG = arg('case-list', path.join(__dirname, 'initial-79-cases.json'));
const LIST = path.isAbsolute(LIST_ARG) ? LIST_ARG : path.join(ROOT, LIST_ARG);
const BATCH = arg('batch', 'initial-79-context-v3');
const EXPECTED_TOTAL = Number(arg('expected-total', 79));
const EXPECTED_CONTEXT = Number(arg('expected-context', 24));
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function recordFor(row) {
  const result=readJson(path.join(ROOT,`eval/act-augmented/${row.sc}/result.json`));
  return result.aspectResults.find((a)=>a.aspect===row.aspect)?.built?.pages?.find((p)=>p.id===row.id);
}
function sourceRecordFor(row,id) {
  const result=readJson(path.join(ROOT,`eval/act-augmented/${row.sc}/result.json`));
  return result.aspectResults.find((a)=>a.aspect===row.aspect)?.built?.pages?.find((p)=>p.id===id);
}
function norm(value) {
  return String(value||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
function hasPhrase(haystack,needle) {
  const h=` ${norm(haystack)} `, n=norm(needle);
  return n && h.includes(` ${n} `);
}
function extractorSlice(source,start,end) {
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  if(a<0||b<0)throw new Error(`Cannot locate extractor slice ${start}`);
  return source.slice(a,b);
}
function sha(value) { return crypto.createHash('sha256').update(value).digest('hex'); }

(async()=>{
  const list=readJson(LIST);
  const rows=list.filter((row)=>row.type==='context-extraction');
  const errors=[];
  const details=[];
  const extractorSource=fs.readFileSync(path.join(ROOT,'eval/gena11y/extract_elements.py'),'utf8');
  const expectedExtractorHashes={
    visual:'5bd5b7de1ae0504a4a39189c8dee644ad7f95dfa9eb9c0a5003e8e227f9f4dc5',
    links:'cf0851c76a4263f2849289a0211bd6030e150dab8279e14c12fe13d9f411e942',
    parent:'58b911c6eaa9d2a1e94b18379d8555036519f0c782814ae635d30f43d208d294',
  };
  const actualExtractorHashes={
    visual:sha(extractorSlice(extractorSource,'def extract_visual_elements','def extract_img_urls')),
    links:sha(extractorSlice(extractorSource,'def extract_links','def _tag_without_children')),
    parent:sha(extractorSlice(extractorSource,'def _tag_without_children','def extract_contrast_elements')),
  };
  for(const key of Object.keys(expectedExtractorHashes))if(actualExtractorHashes[key]!==expectedExtractorHashes[key])errors.push(`GenA11y ${key} extractor changed; update the payload mirror before validating fixtures`);
  if(list.length!==EXPECTED_TOTAL)errors.push(`list has ${list.length}, expected ${EXPECTED_TOTAL}`);
  if(rows.length!==EXPECTED_CONTEXT)errors.push(`context-extraction has ${rows.length}, expected ${EXPECTED_CONTEXT}`);

  const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  for(const row of rows){
    const rec=recordFor(row);
    if(!rec){errors.push(`${row.key}: missing result record`);continue;}
    if(row.expected!=='passed'||rec.expected!=='passed')errors.push(`${row.key}: context case is not expected=passed`);
    if(!row.pairedWith||rec.pairedWith!==row.pairedWith)errors.push(`${row.key}: pairedWith mismatch`);
    if(sourceRecordFor(row,row.pairedWith)?.expected!=='failed')errors.push(`${row.key}: paired source is not expected=failed`);
    if(!fs.existsSync(path.join(ROOT,row.file))||!fs.existsSync(path.join(ROOT,row.docFile)))errors.push(`${row.key}: missing HTML or Markdown file`);
    const md=fs.readFileSync(path.join(ROOT,row.docFile),'utf8');
    if(!md.includes(BATCH)||!md.includes(row.pairedWith))errors.push(`${row.key}: Markdown batch/source metadata stale`);
    if(rec.balanceBatch!==BATCH)errors.push(`${row.key}: batch ${rec.balanceBatch}`);
    if(rec.hardNegativeType!=='context-extraction')errors.push(`${row.key}: record type ${rec.hardNegativeType}`);
    if(!rec.gena11yExtraction)errors.push(`${row.key}: missing payload contract`);
    if(rec.gena11yExtraction?.targetSelector!==rec.primarySelector)errors.push(`${row.key}: contract selector drift`);
    if(!Number.isInteger(rec.gena11yExtraction?.expectedTargetCount)||rec.gena11yExtraction.expectedTargetCount<1)errors.push(`${row.key}: missing expected target count`);
    const page=await browser.newPage();
    const runtime=[];page.on('pageerror',(e)=>runtime.push(String(e.message||e)));
    await page.goto(`file://${path.resolve(ROOT,row.file)}`,{waitUntil:'load'});
    if(runtime.length)errors.push(`${row.key}: page errors ${runtime.join(' | ')}`);

    const audit=await page.evaluate(({sc,selector})=>{
      const clean=(v)=>String(v||'').replace(/\s+/g,' ').trim();
      const openingWithText=(el)=>{
        const attrs=[...el.attributes].map((a)=>`${a.name}="${a.value}"`).join(' ');
        return `<${el.tagName.toLowerCase()} ${attrs}>${el.innerText||''}</${el.tagName.toLowerCase()}>`;
      };
      const links=[...document.querySelectorAll('a,[role="link"]')];
      const linkSnippet=(link)=>{
        const ancestors=[];
        for(let p=link.parentElement;p;p=p.parentElement)if(p.matches('table,ul,ol'))ancestors.unshift(p);
        if(ancestors.length)return ancestors[0].outerHTML;
        const parent=link.parentElement;
        if(!parent||parent===document.body)return link.outerHTML;
        return `${openingWithText(parent)}${link.previousElementSibling?.outerHTML||''}${link.outerHTML}${link.nextElementSibling?.outerHTML||''}</${parent.tagName.toLowerCase()}>`;
      };
      const htmlToText=(html)=>{
        const t=document.createElement('template');t.innerHTML=html;
        const semantic=[];
        for(const el of t.content.querySelectorAll('*'))for(const attr of ['alt','aria-label','title','value']){
          const value=el.getAttribute(attr);if(value)semantic.push(value);
        }
        return clean(`${t.content.textContent||''} ${semantic.join(' ')}`);
      };
      let extracted=[];
      let extractorTargets=[];
      if(sc==='1.1.1'){
        const selectors=['img','svg','canvas','input[type="image"]','[role="img"]','audio','video','object','map area'];
        for(const q of selectors)for(const el of document.querySelectorAll(q))extracted.push(el.outerHTML);
        for(const img of document.querySelectorAll('a img'))extracted.push(img.parentElement.outerHTML);
        extractorTargets=[...new Set(selectors.flatMap((q)=>[...document.querySelectorAll(q)]))];
      }else{
        extracted=links.map(linkSnippet);
        extractorTargets=links;
      }
      const payloadText=htmlToText(extracted.join('\n'));
      const selected=[...document.querySelectorAll(selector)];
      const targets=selected.map((el)=>{
        const refs=[];
        for(const attr of ['aria-labelledby','aria-describedby'])for(const id of (el.getAttribute(attr)||'').split(/\s+/).filter(Boolean)){
          const ref=document.getElementById(id);
          if(ref&&ref!==el&&!el.contains(ref)){
            const style=getComputedStyle(ref),box=ref.getBoundingClientRect();
            refs.push({attr,id,text:clean(ref.textContent),visible:style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0&&box.width>0&&box.height>0});
          }
        }
        return {
          inExtractor:extractorTargets.includes(el),
          tag:el.tagName,
          visibleText:clean(el.innerText||el.textContent),
          refs,
        };
      });
      return {selectedCount:selected.length,payloadText,targets};
    },{sc:row.sc,selector:rec.primarySelector});

    if(!audit.selectedCount)errors.push(`${row.key}: selector matched 0`);
    if(audit.selectedCount!==rec.gena11yExtraction?.expectedTargetCount)errors.push(`${row.key}: selector matched ${audit.selectedCount}, expected ${rec.gena11yExtraction?.expectedTargetCount}`);
    const client=await page.createCDPSession();
    const {root}=await client.send('DOM.getDocument',{depth:0});
    const {nodeIds}=await client.send('DOM.querySelectorAll',{nodeId:root.nodeId,selector:rec.primarySelector});
    const ax=[];
    for(const nodeId of nodeIds){
      const tree=await client.send('Accessibility.getPartialAXTree',{nodeId,fetchRelatives:false});
      const node=tree.nodes?.[0]||{};
      ax.push({name:String(node.name?.value||''),description:String(node.description?.value||'')});
    }
    await client.detach();

    for(let i=0;i<audit.targets.length;i++){
      const target=audit.targets[i], exposed=`${ax[i]?.name||''} ${ax[i]?.description||''}`;
      if(!target.inExtractor)errors.push(`${row.key}[${i}]: target is not selected by ${rec.gena11yExtraction?.extractor}`);
      if(!target.refs.length)errors.push(`${row.key}[${i}]: no non-self labelledby/describedby evidence`);
      for(const ref of target.refs){
        if(!/^cx-\d{3}$/.test(ref.id))errors.push(`${row.key}[${i}]: semantic external ID #${ref.id}`);
        if(!ref.text)errors.push(`${row.key}[${i}]: #${ref.id} has no text`);
        if(!ref.visible)errors.push(`${row.key}[${i}]: #${ref.id} is not visibly rendered`);
        if(hasPhrase(audit.payloadText,ref.text))errors.push(`${row.key}[${i}]: #${ref.id} text leaked into complete payload`);
        if(!hasPhrase(exposed,ref.text))errors.push(`${row.key}[${i}]: #${ref.id} absent from AX name/description ${JSON.stringify(ax[i])}`);
      }
    }
    details.push({key:row.key,targets:audit.targets.length,externalRefs:audit.targets.reduce((n,t)=>n+t.refs.length,0),payloadChars:audit.payloadText.length});
    await page.close();
  }
  await browser.close();
  const bySc=Object.fromEntries([...new Set(rows.map(r=>r.sc))].sort().map(sc=>[sc,rows.filter(r=>r.sc===sc).length]));
  console.log(JSON.stringify({batch:BATCH,total:list.length,contextCases:rows.length,contextShare:rows.length/list.length,bySc,extractorHashes:actualExtractorHashes,errors:errors.length,details,failures:errors},null,2));
  if(errors.length)process.exit(1);
})().catch((e)=>{console.error(e.stack||e);process.exit(1)});
