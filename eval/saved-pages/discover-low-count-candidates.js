#!/usr/bin/env node
'use strict';

// Discover new low-count SC candidates across all saved pages without invoking
// the LLM or dynamic instruments. This is evaluation infrastructure only: it
// imports the server checkout's collector and applicability oracle unchanged.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '..', '..');
require('../../scripts/v3/lib/load-env.js').loadEnv(ROOT);

const { BROWSER_ARGS } = require('../../scripts/v3/lib/orchestrator.js');
const { collectActPage, normalizeCollectRoles } = require('../../scripts/v3/lib/act-page-collect.js');
const { createTabAllocator } = require('../../scripts/v3/lib/tab-allocator.js');
const { createBrowserShardPool } = require('../../scripts/v3/lib/browser-shard-pool.js');
const { sampleMemory } = require('../../scripts/v3/lib/run-telemetry.js');
const oracle = require('../../scripts/v3/lib/applicability-oracle.js');
const { assetUrlUnder } = require('../../scripts/lib/asset-paths.js');

function arg(name, def = null) {
  const exact = `--${name}`;
  const p = process.argv.find((x) => x === exact || x.startsWith(exact + '='));
  if (!p) return def;
  if (p.startsWith(exact + '=')) return p.slice(exact.length + 1);
  const next = process.argv[process.argv.indexOf(p) + 1];
  return next && !next.startsWith('--') ? next : true;
}

const RUN_NAME = String(arg('out', 'saved-elements-low-count-discovery-server'));
const OUT = path.join(ROOT, 'results', RUN_NAME);
const BASE = String(arg('base', process.env.A11Y_BASE || 'http://127.0.0.1:3001'));
const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome';
const BASELINE = path.resolve(ROOT, String(arg('baseline', 'results/saved-elements-gemini35-flash-lite-high-server/analysis.json')));
const FIRST_SELECTION = path.resolve(ROOT, String(arg('first-selection', 'results/saved-elements-inventory-server/selection.json')));
const PER_PAGE = Math.max(1, Number(arg('per-page', 500)) || 500);
const AT_RATIO = Math.max(0, Math.min(1, Number(arg('at-ratio', 0.7)) || 0.7));
const SEED = Number(arg('seed', 20260818)) || 20260818;
const PER_SC_MS = Math.max(1000, Number(arg('per-sc-ms', 300000)) || 300000);
const PAGE_CONC = Math.max(1, Number(arg('pages', 64)) || 64);
const MAX_TABS = Math.max(1, Number(arg('max-tabs', 256)) || 256);
const BROWSER_SHARDS = Math.max(1, Math.min(PAGE_CONC, MAX_TABS, Number(arg('browsers', arg('shards', 16))) || 16));
const FILE_FILTER = arg('file', null);
const LIMIT = Math.max(0, Number(arg('limit', 0)) || 0);

const safe = (s) => String(s).replace(/[^a-z0-9_.-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 100);
const hashFile = (f) => {
  try { return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex'); }
  catch { return null; }
};
const countBy = (items, key) => {
  const out = {};
  for (const x of items || []) { const k = typeof key === 'function' ? key(x) : x[key]; if (k) out[k] = (out[k] || 0) + 1; }
  return out;
};

function originalTargets() {
  const act = JSON.parse(fs.readFileSync(path.join(ROOT, 'uist-artifacts', 'act-testcases.json'), 'utf8'));
  const human = JSON.parse(fs.readFileSync(path.join(ROOT, 'eval', 'act-augmented', '_annotator', 'manifest.json'), 'utf8'));
  const actScs = [...new Set((act.cases || []).flatMap((c) => c.sc || []))].sort();
  const humanScs = [...new Set((human.scs || []).map((x) => x.sc).filter(Boolean))].sort();
  return { act: actScs, human: humanScs, union: [...new Set([...actScs, ...humanScs])].sort() };
}

function lowCountTargets() {
  const targets = originalTargets();
  const baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  const detected = Object.fromEntries(targets.union.map((sc) => [sc, Number((baseline.bySc && baseline.bySc[sc] && baseline.bySc[sc].barriers) || 0)]));
  return { ...targets, detected, low: targets.union.filter((sc) => detected[sc] < 5) };
}

function loadSpecs() {
  const samples = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'samples-saved.json'), 'utf8'));
  const pages = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'pages.json'), 'utf8'));
  const meta = new Map((Array.isArray(pages) ? pages : pages.pages || []).filter((p) => p && p.file).map((p) => [p.file, p]));
  const selection = JSON.parse(fs.readFileSync(FIRST_SELECTION, 'utf8'));
  const used = new Map((selection.pages || []).map((p) => [p.file, new Set(p.xpaths || [])]));
  let specs = Object.entries(samples).map(([key, page]) => {
    const file = key.replace(/^saved\//, '');
    return { key, file, name: page.name, noscript: !!(meta.get(file) || {}).noscript, firstRoundXpaths: [...(used.get(file) || [])] };
  }).sort((a, b) => a.file.localeCompare(b.file));
  if (FILE_FILTER) specs = specs.filter((p) => p.file === FILE_FILTER);
  if (LIMIT) specs = specs.slice(0, LIMIT);
  return specs;
}

function makeRng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function seedForPage(file) {
  const h = crypto.createHash('sha256').update(`${SEED}\0${file}`).digest();
  return h.readUInt32LE(0);
}

function groupByLandmark(items) {
  const out = {};
  for (const item of items) (out[item.landmark] = out[item.landmark] || []).push(item);
  return out;
}

function pickStratifiedTotal(groups, budget, rand) {
  const out = [];
  const pools = Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.slice()]));
  while (out.length < budget) {
    const order = Object.keys(pools).filter((k) => pools[k].length).sort(() => rand() - 0.5);
    if (!order.length) break;
    for (const key of order) {
      if (out.length >= budget) break;
      const pool = pools[key];
      out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    }
  }
  return out;
}

function stratifiedSample(candidates, budget, rand) {
  const at = candidates.filter((x) => x.atFocusable);
  const non = candidates.filter((x) => !x.atFocusable);
  let wantAt = Math.round(budget * AT_RATIO);
  let wantNon = budget - wantAt;
  const atShort = Math.max(0, wantAt - at.length);
  const nonShort = Math.max(0, wantNon - non.length);
  wantAt = Math.min(at.length, wantAt + nonShort);
  wantNon = Math.min(non.length, wantNon + atShort);
  return [
    ...pickStratifiedTotal(groupByLandmark(at), wantAt, rand),
    ...pickStratifiedTotal(groupByLandmark(non), wantNon, rand),
  ];
}

// This intentionally mirrors scripts/sample-elements.js: hidden and whole-page
// wrappers are removed; interactive/AT-focusable controls and meaningful direct
// text/image content remain; candidates carry landmark strata.
function collectSamplingCandidates() {
  const INTERACTIVE_ROLES = new Set(['button','link','checkbox','radio','switch','tab','menuitem','menuitemcheckbox','menuitemradio','option','combobox','textbox','searchbox','spinbutton','slider','listbox','treeitem','gridcell']);
  const LANDMARK_ROLES = new Set(['banner','navigation','main','contentinfo','complementary','form','search','region']);
  const TAG_TO_LANDMARK = { header:'banner',nav:'navigation',main:'main',footer:'contentinfo',aside:'complementary',form:'form',section:'region' };
  const CONTENT_TAGS = new Set(['h1','h2','h3','h4','h5','h6','p','li','dt','dd','figcaption','blockquote','cite','span','strong','em','b','i','u','code','time','small','mark','label','th','td','caption','summary','legend']);
  const xpathOf = (el) => {
    if (!el || !el.tagName) return '';
    if (el === document.documentElement) return '/html';
    if (el === document.body) return '/html/body';
    let idx = 1;
    for (let s = el.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === el.tagName) idx++;
    const html = !el.namespaceURI || el.namespaceURI === 'http://www.w3.org/1999/xhtml';
    const tag = html ? el.tagName.toLowerCase() : el.tagName;
    return xpathOf(el.parentElement) + (html ? `/${tag}[${idx}]` : `/*[local-name()='${tag}'][${idx}]`);
  };
  const hidden = (el) => {
    if (!el || el.nodeType !== 1 || el.hasAttribute('hidden')) return true;
    for (let cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
      if (cur.hasAttribute('inert') || cur.getAttribute('aria-hidden') === 'true') return true;
      const cs = getComputedStyle(cur);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return true;
    }
    const r = el.getBoundingClientRect();
    return r.width === 0 && r.height === 0;
  };
  const wholePage = (el) => {
    if (el === document.documentElement || el === document.body) return true;
    const r = el.getBoundingClientRect(), vw = innerWidth || document.documentElement.clientWidth, vh = innerHeight || document.documentElement.clientHeight;
    return r.width >= 0.9 * vw && r.height >= 0.85 * vh && el.children.length > 5;
  };
  const roleOf = (el) => {
    const explicit = el.getAttribute('role');
    if (explicit) return explicit;
    const tag = el.tagName.toLowerCase();
    if (tag === 'a' || tag === 'area') return el.hasAttribute('href') ? 'link' : null;
    if (tag === 'input') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      return ({checkbox:'checkbox',radio:'radio',button:'button',submit:'button',reset:'button',image:'button',range:'slider',search:'searchbox',number:'spinbutton',email:'textbox',password:'textbox',text:'textbox',tel:'textbox',url:'textbox'})[type] || 'textbox';
    }
    return ({button:'button',select:'combobox',textarea:'textbox',summary:'button',details:'group'})[tag] || null;
  };
  const tabFocusable = (el) => {
    const ti = el.getAttribute('tabindex');
    if (ti !== null) return parseInt(ti, 10) >= 0;
    if (el.disabled) return false;
    const tag = el.tagName.toLowerCase();
    if ((tag === 'a' || tag === 'area') && el.hasAttribute('href')) return true;
    return ['button','input','select','textarea'].includes(tag) || el.isContentEditable;
  };
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const meaningful = (el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'img' || tag === 'svg') return true;
    return CONTENT_TAGS.has(tag) ? ownText(el) : ownText(el);
  };
  const landmark = (el) => {
    for (let cur = el.parentElement; cur && cur !== document.body; cur = cur.parentElement) {
      const explicit = cur.getAttribute && cur.getAttribute('role');
      if (explicit && LANDMARK_ROLES.has(explicit)) return explicit;
      const tag = cur.tagName && cur.tagName.toLowerCase(), mapped = tag && TAG_TO_LANDMARK[tag];
      if (mapped && (tag !== 'section' || cur.getAttribute('aria-label') || cur.getAttribute('aria-labelledby'))) return mapped;
    }
    return 'default';
  };
  const out = [], nodes = document.querySelectorAll('*'), limit = Math.min(nodes.length, 25000);
  for (let i = 0; i < limit; i++) {
    const el = nodes[i];
    if (hidden(el) || wholePage(el)) continue;
    const explicit = el.getAttribute('role');
    if (explicit === 'none' || explicit === 'presentation') continue;
    const role = roleOf(el), focusable = tabFocusable(el), atFocusable = focusable || !!(role && INTERACTIVE_ROLES.has(role));
    if (!atFocusable && !meaningful(el)) continue;
    out.push({ xpath: xpathOf(el), atFocusable, landmark: landmark(el) });
  }
  return { domScanned: limit, domTruncated: nodes.length > limit, candidates: out };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(OUT, 'pages'), { recursive: true });
  const targets = lowCountTargets();
  const targetSet = new Set(targets.low);
  const specs = loadSpecs();
  const health = await fetch(BASE + '/engine/status').catch(() => null);
  if (!health || !health.ok) throw new Error(`annotator server is not reachable at ${BASE}`);

  const sourceFiles = ['scripts/sample-elements.js','scripts/v3/lib/act-page-collect.js','scripts/v3/lib/applicability-oracle.js','eval/saved-pages/discover-low-count-candidates.js'];
  const manifest = {
    schema: 'saved-elements-discovery/1', runName: RUN_NAME, startedAt: new Date().toISOString(), base: BASE,
    targets, filter: { source: 'scripts/sample-elements.js', perPage: PER_PAGE, atRatio: AT_RATIO, maxDomScanPerPage: 25000, seed: SEED, excludesFirstRound: true },
    budget: { perScMs: PER_SC_MS, scCount: targets.low.length, maximumAggregateMs: PER_SC_MS * targets.low.length },
    concurrency: { pages: PAGE_CONC, maxTabs: MAX_TABS, browserShards: BROWSER_SHARDS }, requestedPages: specs.length,
    sourceHashes: Object.fromEntries(sourceFiles.map((f) => [f, hashFile(f)])),
  };
  try { manifest.commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { manifest.commit = null; }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const tel = { phase:'launching',startedAt:Date.now(),done:0,total:specs.length,errors:[],workers:{},tabs:{},mem:{} };
  const persist = () => fs.writeFileSync(path.join(OUT, 'status.json'), JSON.stringify({ ...tel, elapsedMs:Date.now()-tel.startedAt }, null, 2));
  const launchBrowser = () => puppeteer.launch({ executablePath:CHROME, headless:'new', args:BROWSER_ARGS, protocolTimeout:300000 });
  const pool = await createBrowserShardPool({ browserCount:BROWSER_SHARDS,totalTabs:MAX_TABS,launchBrowser,createAllocator:(browser,cap)=>createTabAllocator({browser,maxTabs:cap}) });
  tel.phase = 'running'; persist();
  let sampling = false;
  const timer = setInterval(async () => {
    tel.tabs = pool.stats();
    if (!sampling) { sampling=true; try { tel.mem=await sampleMemory(process.pid); } finally { sampling=false; } }
    persist();
  }, 1000); timer.unref?.();

  const results = [], candidates = [];
  let cursor = 0;
  const worker = async (wid, index) => {
    const shard = pool.shardFor(index);
    while (true) {
      const i = cursor++;
      if (i >= specs.length) { delete tel.workers[wid]; return; }
      const spec = specs[i], started = Date.now(), pageUrl = assetUrlUnder(BASE, spec.file) + '?offline=1' + (spec.noscript?'&noscript=1':'');
      tel.workers[wid] = { index:i,file:spec.file,phase:'sample',startedAt:started };
      try {
        const lease = await shard.alloc.acquire();
        let collect, sampled;
        try {
          await lease.page.setViewport({width:1280,height:800});
          await lease.page.goto(pageUrl,{waitUntil:'domcontentloaded',timeout:30000}).catch((e)=>{if(!/timeout/i.test(String(e)))throw e;});
          await new Promise((r)=>setTimeout(r,500));
          const raw = await lease.page.evaluate(collectSamplingCandidates);
          const excluded = new Set(spec.firstRoundXpaths);
          const eligible = raw.candidates.filter((x)=>!excluded.has(x.xpath));
          const selected = stratifiedSample(eligible, Math.min(PER_PAGE, eligible.length), makeRng(seedForPage(spec.file)));
          tel.workers[wid].phase = 'collect';
          collect = normalizeCollectRoles(await collectActPage(lease.page,{url:pageUrl,xpaths:selected.map((x)=>x.xpath),elementCap:selected.length,file:spec.file,runId:`${RUN_NAME}-${safe(spec.file)}`,sourceUrl:spec.file,runAxe:false}));
          sampled = { domScanned:raw.domScanned,domTruncated:raw.domTruncated,filteredCandidates:raw.candidates.length,eligibleAfterFirstRoundExclusion:eligible.length,selected:selected.length,atSelected:selected.filter((x)=>x.atFocusable).length,nonAtSelected:selected.filter((x)=>!x.atFocusable).length,landmarks:countBy(selected,'landmark') };
        } finally { await lease.release(); }
        const obligations = oracle.deriveObligations(collect).filter((x)=>targetSet.has(x.sc));
        const recs = obligations.map((x)=>({page:spec.file,name:spec.name,noscript:spec.noscript,xpath:x.xpath,sc:x.sc,claimFamily:x.claimFamily,obligationId:x.obligationId}));
        candidates.push(...recs);
        const rec = {key:spec.key,file:spec.file,name:spec.name,noscript:spec.noscript,elapsedMs:Date.now()-started,sampling:sampled,collectedElements:(collect.elements||[]).length,candidateCount:recs.length,scCandidates:countBy(recs,'sc'),familyCandidates:countBy(recs,'claimFamily')};
        results.push(rec);
        fs.writeFileSync(path.join(OUT,'pages',safe(spec.file)+'.json'),JSON.stringify({spec,sampling:sampled,collect,candidates:recs},null,2));
      } catch (e) {
        const message=String((e&&e.stack)||e); tel.errors.push({file:spec.file,error:message.split('\n')[0]});
        results.push({key:spec.key,file:spec.file,name:spec.name,error:message,elapsedMs:Date.now()-started});
      }
      tel.done=results.length;
      fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(results,null,2));
      persist();
    }
  };

  await Promise.all(Array.from({length:Math.min(PAGE_CONC,specs.length||1)},(_,i)=>worker(`w${i+1}`,i)));
  clearInterval(timer); tel.tabs=pool.stats(); await pool.close();
  results.sort((a,b)=>a.file.localeCompare(b.file));
  candidates.sort((a,b)=>a.sc.localeCompare(b.sc)||a.page.localeCompare(b.page)||a.xpath.localeCompare(b.xpath)||a.claimFamily.localeCompare(b.claimFamily));
  fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(results,null,2));
  fs.writeFileSync(path.join(OUT,'candidates.json'),JSON.stringify(candidates,null,2));
  const summary={pages:results.length,errors:results.filter((x)=>x.error).length,filteredElements:results.reduce((n,x)=>n+((x.sampling&&x.sampling.selected)||0),0),collectedElements:results.reduce((n,x)=>n+(x.collectedElements||0),0),candidateObligations:candidates.length,bySc:countBy(candidates,'sc'),pagesBySc:Object.fromEntries(targets.low.map((sc)=>[sc,new Set(candidates.filter((x)=>x.sc===sc).map((x)=>x.page)).size])),targets:targets.low,tabs:tel.tabs,elapsedMs:Date.now()-tel.startedAt};
  fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summary,null,2));
  manifest.finishedAt=new Date().toISOString();manifest.summary=summary;
  fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(manifest,null,2));
  tel.phase='done';persist();
  console.log(JSON.stringify(summary,null,2));
}

main().catch((e)=>{console.error(e.stack||e);process.exit(1);});
