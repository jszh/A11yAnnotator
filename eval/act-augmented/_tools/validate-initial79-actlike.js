#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '../../..');
function arg(name, fallback) {
  const token=process.argv.find((value)=>value===`--${name}`||value.startsWith(`--${name}=`));
  if(!token)return fallback;
  if(token.includes('='))return token.slice(token.indexOf('=')+1);
  const next=process.argv[process.argv.indexOf(token)+1];
  return next&&!next.startsWith('--')?next:fallback;
}
const listArg=arg('case-list',path.join(__dirname,'initial-79-cases.json'));
const listPath=path.isAbsolute(listArg)?listArg:path.join(ROOT,listArg);
const list = JSON.parse(fs.readFileSync(listPath, 'utf8'));
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function resultRecord(row) {
  const result = JSON.parse(fs.readFileSync(path.join(ROOT, `eval/act-augmented/${row.sc}/result.json`), 'utf8'));
  return result.aspectResults.find((a) => a.aspect === row.aspect).built.pages.find((p) => p.id === row.id);
}

(async () => {
  const browser = await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const errors = [];
  let checked = 0;
  for (const row of list) {
    const rec = resultRecord(row);
    const page = await browser.newPage();
    const runtime = [];
    page.on('pageerror', (e) => runtime.push(String(e.message || e)));
    await page.goto(`file://${path.join(ROOT,row.file)}`, {waitUntil:'load'});
    const audit = await page.evaluate((selector) => {
      const nodes = [...document.querySelectorAll(selector)];
      const duplicateIds = [...document.querySelectorAll('[id]')].map((e)=>e.id).filter((id,i,a)=>a.indexOf(id)!==i);
      const broken=[];
      for(const el of document.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls],[aria-errormessage],[aria-owns]')){
        for(const attr of ['aria-labelledby','aria-describedby','aria-controls','aria-errormessage','aria-owns']){
          for(const id of (el.getAttribute(attr)||'').trim().split(/\s+/).filter(Boolean)) if(!document.getElementById(id)) broken.push(`${attr}:${id}`);
        }
      }
      return {count:nodes.length,duplicateIds:[...new Set(duplicateIds)],broken:[...new Set(broken)],title:document.title};
    }, rec.primarySelector);
    if (!audit.count) errors.push(`${row.key}: selector matched 0 (${rec.primarySelector})`);
    if (audit.duplicateIds.length) errors.push(`${row.key}: duplicate IDs ${audit.duplicateIds.join(',')}`);
    if (audit.broken.length) errors.push(`${row.key}: broken IDREFs ${audit.broken.join(',')}`);
    if (!audit.title.trim()) errors.push(`${row.key}: empty title`);
    if (runtime.length) errors.push(`${row.key}: page errors ${runtime.join(' | ')}`);

    // Stronger assertions for the 24 rebuilt ACT-like controls.
    if (rec.balanceBatch === 'initial-79-actlike-v2' && ['external-reference','context-extraction'].includes(rec.hardNegativeType)) {
      const targetChecks = await page.evaluate((selector) => [...document.querySelectorAll(selector)].map((el) => ({
        tag:el.tagName, text:(el.textContent||'').trim(), labelledby:el.getAttribute('aria-labelledby'), describedby:el.getAttribute('aria-describedby'),
        role:el.getAttribute('role'), required:el.matches(':required'),
      })), rec.primarySelector);
      if (!targetChecks.length) errors.push(`${row.key}: rebuilt context target absent`);
      const client = await page.createCDPSession();
      const {root} = await client.send('DOM.getDocument', {depth:0});
      const {nodeIds} = await client.send('DOM.querySelectorAll', {nodeId:root.nodeId, selector:rec.primarySelector});
      const axNames=[];
      for(const nodeId of nodeIds){
        const tree=await client.send('Accessibility.getPartialAXTree',{nodeId,fetchRelatives:false});
        axNames.push(tree.nodes?.[0]?.name?.value || '');
      }
      await client.detach();
      if (axNames.some((name)=>!String(name).trim())) errors.push(`${row.key}: empty computed AX name ${JSON.stringify(axNames)}`);
      if (row.sc === '2.4.4') {
        const visible = targetChecks.map((x)=>x.text.replace(/\s+/g,' ').trim().toLowerCase());
        if (axNames.some((name,i)=>String(name).replace(/\s+/g,' ').trim().toLowerCase() === visible[i])) {
          errors.push(`${row.key}: AX name did not acquire external purpose ${JSON.stringify(axNames)}`);
        }
      }
    }
    if (row.sc === '2.4.4' && rec.hardNegativeType === 'external-reference') {
      const names = await page.evaluate((selector) => [...document.querySelectorAll(selector)].map((el) => {
        const ids=(el.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean);
        return ids.map((id)=>document.getElementById(id)?.textContent.trim()||'').join(' ').trim();
      }), rec.primarySelector);
      if (names.some((name) => name.split(/\s+/).length < 2)) errors.push(`${row.key}: incomplete IDREF-computed name ${JSON.stringify(names)}`);
    }
    await page.close(); checked++;
  }
  await browser.close();
  console.log(JSON.stringify({checked,errors:errors.length,details:errors},null,2));
  if (errors.length) process.exit(1);
})().catch((e)=>{console.error(e.stack||e);process.exit(1)});
