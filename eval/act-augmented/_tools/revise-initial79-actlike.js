#!/usr/bin/env node
'use strict';

/**
 * Rebuild the initial 79-case negative slice as an ACT-like specificity set.
 *
 * The original unsupported fixtures remain in the corpus. They are replaced in
 * this run list by paired PASS controls in GenA11y's three highest-FP ACT SCs.
 * New controls emphasize evidence outside the extracted target element and
 * narrow ACT-rule/full-SC judgment boundaries.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const LIST = path.join(__dirname, 'initial-79-cases.json');
const BATCH = 'initial-79-actlike-v2';
const TARGET_SC = new Set(['1.3.1', '2.4.2', '2.4.4']);
const DROP_SC = new Set(['1.4.13', '2.1.2', '4.1.3']);

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
function replaceOnce(text, before, after, label) {
  const first = text.indexOf(before);
  if (first < 0 || text.indexOf(before, first + before.length) >= 0) {
    throw new Error(`${label}: expected exactly one match`);
  }
  return text.slice(0, first) + after + text.slice(first + before.length);
}
function addPairComment(html, source, repair) {
  return replaceOnce(html, '<!DOCTYPE html>', `<!DOCTYPE html>\n<!-- PAIRED PASS for ${source}: ${repair} -->`, 'doctype');
}
function citationMd(citation) {
  if (!citation) return 'Citation inherited from the paired source record.';
  return `**Reference:** ${citation.doc}\n\n> ${citation.quote}`;
}
function pageDir(sc, aspect) {
  return path.join(ROOT, 'eval', 'act-augmented', sc, 'pages', aspect);
}
function resultPath(sc) { return path.join(ROOT, 'eval', 'act-augmented', sc, 'result.json'); }
function findAspect(result, aspect) {
  const found = result.aspectResults.find((row) => row.aspect === aspect);
  if (!found) throw new Error(`Missing aspect ${result.sc}/${aspect}`);
  return found;
}

const specs = [];
function add(spec) { specs.push(spec); }

// 1.3.1 — form relationships whose decisive evidence is outside each input.
add({ sc:'1.3.1', aspect:'form-label-and-group-relationships-by-context', id:'case-13', source:'case-02',
  title:'Survey group named by an external visible question', type:'external-reference', selector:'[role="radiogroup"][aria-labelledby="hear-question"]',
  repair:'Wrap the first radio set in a radiogroup named by the existing visible question through aria-labelledby.',
  mechanism:'Each radio keeps its own label, while the group name resolves through #hear-question outside every extracted input element.',
  transform(h){
    h=replaceOnce(h,'      <div class="q">How did you hear about us?</div>','      <div role="radiogroup" aria-labelledby="hear-question">\n      <div class="q" id="hear-question">How did you hear about us?</div>','131-13-open');
    return replaceOnce(h,'      <div class="opt"><input type="radio" id="h4" name="hear" value="podcast"><label for="h4">Podcast ad</label></div>','      <div class="opt"><input type="radio" id="h4" name="hear" value="podcast"><label for="h4">Podcast ad</label></div>\n      </div>','131-13-close');
  }});
add({ sc:'1.3.1', aspect:'form-label-and-group-relationships-by-context', id:'case-14', source:'case-02',
  title:'Survey group repaired with fieldset and legend', type:'context-extraction', selector:'fieldset:first-of-type',
  repair:'Wrap the first radio set in a fieldset and turn the existing visible question into its legend.',
  mechanism:'The group relationship is carried by the ancestor fieldset/legend, not by any individual radio snippet.',
  transform(h){
    h=replaceOnce(h,'      <div class="q">How did you hear about us?</div>','      <fieldset>\n        <legend class="q">How did you hear about us?</legend>','131-14-open');
    return replaceOnce(h,'      <div class="opt"><input type="radio" id="h4" name="hear" value="podcast"><label for="h4">Podcast ad</label></div>','        <div class="opt"><input type="radio" id="h4" name="hear" value="podcast"><label for="h4">Podcast ad</label></div>\n      </fieldset>','131-14-close');
  }});
add({ sc:'1.3.1', aspect:'form-label-and-group-relationships-by-context', id:'case-15', source:'case-04',
  title:'Two radio groups named and described through external IDREFs', type:'external-reference', selector:'.opts[role="radiogroup"]',
  repair:'Give both option containers radiogroup semantics and reference the existing question and help paragraphs.',
  mechanism:'Each group name and description resolves through external aria-labelledby and aria-describedby targets omitted from a bare radio extraction.',
  transform(h){
    h=replaceOnce(h,'        <p class="q">Will the work change the building\'s footprint?</p>\n        <p class="help">"Footprint" means the outline of the structure on the lot.</p>\n        <div class="opts">','        <p class="q" id="footprint-q">Will the work change the building\'s footprint?</p>\n        <p class="help" id="footprint-help">"Footprint" means the outline of the structure on the lot.</p>\n        <div class="opts" role="radiogroup" aria-labelledby="footprint-q" aria-describedby="footprint-help">','131-15-a');
    return replaceOnce(h,'        <p class="q">Is the property in a designated flood-hazard zone?</p>\n        <p class="help">Check the FEMA flood map if you are unsure.</p>\n        <div class="opts">','        <p class="q" id="flood-q">Is the property in a designated flood-hazard zone?</p>\n        <p class="help" id="flood-help">Check the FEMA flood map if you are unsure.</p>\n        <div class="opts" role="radiogroup" aria-labelledby="flood-q" aria-describedby="flood-help">','131-15-b');
  }});
add({ sc:'1.3.1', aspect:'form-label-and-group-relationships-by-context', id:'case-16', source:'case-04',
  title:'Two permit questions repaired with fieldset and legend', type:'context-extraction', selector:'form fieldset',
  repair:'Wrap each Yes/No set in a fieldset whose legend is the existing visible question.',
  mechanism:'The group name is supplied by ancestor structure and remains absent from the individual Yes and No input fragments.',
  transform(h){
    h=replaceOnce(h,'  .file { background: #1b3a5c;','  fieldset { border: 0; padding: 0; margin: 0; }\n  legend.q { padding: 0; }\n  .file { background: #1b3a5c;','131-16-css');
    h=replaceOnce(h,'        <p class="q">Will the work change the building\'s footprint?</p>','        <fieldset>\n        <legend class="q">Will the work change the building\'s footprint?</legend>','131-16-aopen');
    h=replaceOnce(h,'          <span class="opt"><input type="radio" id="fp_n" name="footprint" value="no"><label for="fp_n">No</label></span>\n        </div>','          <span class="opt"><input type="radio" id="fp_n" name="footprint" value="no"><label for="fp_n">No</label></span>\n        </div>\n        </fieldset>','131-16-aclose');
    h=replaceOnce(h,'        <p class="q">Is the property in a designated flood-hazard zone?</p>','        <fieldset>\n        <legend class="q">Is the property in a designated flood-hazard zone?</legend>','131-16-bopen');
    return replaceOnce(h,'          <span class="opt"><input type="radio" id="fl_n" name="flood" value="no"><label for="fl_n">No</label></span>\n        </div>','          <span class="opt"><input type="radio" id="fl_n" name="flood" value="no"><label for="fl_n">No</label></span>\n        </div>\n        </fieldset>','131-16-bclose');
  }});
add({ sc:'1.3.1', aspect:'form-label-and-group-relationships-by-context', id:'case-17', source:'case-05',
  title:'RTL date group named and described through external IDREFs', type:'external-reference', selector:'.field[role="group"]',
  repair:'Name and describe the split date group using the existing Arabic question and hint as IDREF targets.',
  mechanism:'The Arabic group name and format instruction live outside all three extracted input elements but resolve in the accessibility tree.',
  transform(h){
    h=replaceOnce(h,'      <div class="field">\n        <div class="group-q">تاريخ الميلاد</div>\n        <div class="dob">','      <div class="field" role="group" aria-labelledby="dob-question" aria-describedby="dob-hint">\n        <div class="group-q" id="dob-question">تاريخ الميلاد</div>\n        <div class="dob">','131-17-open');
    return replaceOnce(h,'        <p class="hint">مثال: ١٥ / ٠٣ / ١٩٩٠</p>','        <p class="hint" id="dob-hint">مثال: ١٥ / ٠٣ / ١٩٩٠</p>','131-17-hint');
  }});
add({ sc:'1.3.1', aspect:'form-label-and-group-relationships-by-context', id:'case-18', source:'case-05',
  title:'RTL date group repaired with fieldset and legend', type:'context-extraction', selector:'fieldset.field',
  repair:'Replace the date wrapper with a fieldset and the existing visible question with a legend.',
  mechanism:'The accessible group name is conveyed by ancestor fieldset/legend structure rather than repeated on each date input.',
  transform(h){
    h=replaceOnce(h,'  .save { background: #2e7d5b;','  fieldset.field { border: 0; padding: 0; }\n  legend.group-q { padding: 0; }\n  .save { background: #2e7d5b;','131-18-css');
    h=replaceOnce(h,'      <div class="field">\n        <div class="group-q">تاريخ الميلاد</div>\n        <div class="dob">','      <fieldset class="field">\n        <legend class="group-q">تاريخ الميلاد</legend>\n        <div class="dob">','131-18-open');
    return replaceOnce(h,'        <p class="hint">مثال: ١٥ / ٠٣ / ١٩٩٠</p>\n      </div>','        <p class="hint">مثال: ١٥ / ٠٣ / ١٩٩٠</p>\n      </fieldset>','131-18-close');
  }});
add({ sc:'1.3.1', aspect:'form-label-and-group-relationships-by-context', id:'case-19', source:'case-03',
  title:'Required relationships use visible text and a shared external instruction', type:'external-reference', selector:'input[required][aria-describedby="required-note"]',
  repair:'Make the required cue textual, add native required state, and associate the shared visible instruction with every required input.',
  mechanism:'Each required input resolves the instruction through aria-describedby outside its extracted element; visible “(required)” text makes color redundant.',
  transform(h){
    h=replaceOnce(h,'<p class="req-note">Fields shown in <strong>red</strong> are required to generate your quote.</p>','<p class="req-note" id="required-note">Fields marked <strong>(required)</strong> are required to generate your quote; red styling is additional.</p>','131-19-note');
    for (const [id,label] of [['first','Legal first name'],['last','Legal last name'],['dob','Date of birth'],['license',"Driver's license number"]]) {
      h=replaceOnce(h,`<label for="${id}" class="required">${label}</label>`,`<label for="${id}" class="required">${label} (required)</label>`,`131-19-label-${id}`);
      const re=new RegExp(`<input ([^>]*id="${id}"[^>]*)>`); if(!re.test(h))throw new Error(`131-19-input-${id}`); h=h.replace(re,'<input $1 required aria-describedby="required-note">');
    }
    return h;
  }});
add({ sc:'1.3.1', aspect:'form-label-and-group-relationships-by-context', id:'case-20', source:'case-03',
  title:'Required inputs named through their visible labels and external marker', type:'external-reference', selector:'input[required][aria-labelledby]',
  repair:'Add visible required text, native required state, and self-specific external aria-labelledby references for every required control.',
  mechanism:'The complete name is computed from label elements outside the extracted input nodes, while the shared marker is visible and programmatic.',
  transform(h){
    h=replaceOnce(h,'<p class="req-note">Fields shown in <strong>red</strong> are required to generate your quote.</p>','<p class="req-note" id="required-marker">The word <strong>required</strong> identifies every mandatory field; red styling is additional.</p>','131-20-note');
    for (const [id,label] of [['first','Legal first name'],['last','Legal last name'],['dob','Date of birth'],['license',"Driver's license number"]]) {
      h=replaceOnce(h,`<label for="${id}" class="required">${label}</label>`,`<label id="${id}-label" for="${id}" class="required">${label} (required)</label>`,`131-20-label-${id}`);
      const re=new RegExp(`<input ([^>]*id="${id}"[^>]*)>`); if(!re.test(h))throw new Error(`131-20-input-${id}`); h=h.replace(re,`<input $1 required aria-labelledby="${id}-label required-marker">`);
    }
    return h;
  }});

// 2.4.2 — descriptive but compact titles at the narrow ACT/full-SC boundary.
for (const row of [
  ['case-11','non-identifying-artifact-title-strings','case-01','Untitled Document','FY24 Q3 Revenue — Northwind','Quarterly-results title identifies the subject without repeating the full headline.'],
  ['case-12','non-identifying-artifact-title-strings','case-02','Vite + React','Engineer Onboarding — People Ops','Application title identifies the onboarding task and organizational area.'],
  ['case-13','non-identifying-artifact-title-strings','case-03','TODO: add page title','Returns & Refunds — Meadow & Pine','Policy title identifies both the topic and site.'],
  ['case-11','title-too-generic-to-distinguish-page-in-set','case-01','Online Store','750 ml Insulated Bottle — Riverstone','Product title distinguishes this item from sibling store pages.'],
  ['case-12','title-too-generic-to-distinguish-page-in-set','case-02','Checkout','Payment — Loomwell Checkout','Checkout title distinguishes the payment step from the other steps.'],
  ['case-11','title-describes-secondary-not-primary-topic','case-01','Summer Sale — 20% Off Annual Subscriptions | Cedar Falls Tribune','Cedar Falls Tribune — Local News','Homepage title identifies the news publication rather than a secondary subscription promotion.'],
  ['case-10','title-loses-meaning-out-of-context','case-01','Chapter 3','Chapter 3: Safe Scaffolding Assembly','Compact chapter title preserves the chapter number while identifying its subject in tabs and bookmarks.'],
]) add({sc:'2.4.2',aspect:row[1],id:row[0],source:row[2],title:row[4],type:'act-rule-scope-boundary',selector:'head > title',repair:`Replace only <title>${row[3]}</title> with <title>${row[4]}</title>.`,mechanism:row[5],transform(h){return replaceOnce(h,`<title>${row[3]}</title>`,`<title>${row[4]}</title>`,`242-${row[1]}-${row[0]}`)}});

// 2.4.4 — self-first accessible names completed by context outside the link.
add({sc:'2.4.4',aspect:'context-outside-programmatic-link-context-f63',id:'case-13',source:'case-01',title:'Document links named by following external descriptions',type:'external-reference',selector:'p.more > a[aria-labelledby]',repair:'Keep the generic visible link text but name each link through itself and its existing following description.',mechanism:'The accessible names resolve external IDREFs that are absent from an isolated anchor extraction.',transform(h){
  h=replaceOnce(h,'<p class="more"><a href="/agenda/fee-schedule-2025.pdf">Read the full document</a></p>','<p class="more"><a id="fee-link" href="/agenda/fee-schedule-2025.pdf" aria-labelledby="fee-link fee-description">Read the full document</a></p>','244-13-a');
  h=replaceOnce(h,'<p class="continuation">\n        &mdash; the proposed fee schedule','<p class="continuation" id="fee-description">\n        &mdash; the proposed fee schedule','244-13-b');
  h=replaceOnce(h,'<p class="more"><a href="/agenda/bus-routes-fall.pdf">Read the full document</a></p>','<p class="more"><a id="bus-link" href="/agenda/bus-routes-fall.pdf" aria-labelledby="bus-link bus-description">Read the full document</a></p>','244-13-c');
  return replaceOnce(h,'<p class="continuation">\n        &mdash; the district\'s revised route map','<p class="continuation" id="bus-description">\n        &mdash; the district\'s revised route map','244-13-d');
}});
add({sc:'2.4.4',aspect:'context-outside-programmatic-link-context-f63',id:'case-14',source:'case-02',title:'Statement links named by labels in other table rows',type:'external-reference',selector:'a.btn[aria-labelledby]',repair:'Keep “View” visible while using self-first aria-labelledby references to the existing document-label rows.',mechanism:'The document identity is outside each anchor and outside its table cell, but the IDREF produces a complete accessible name.',transform(h){
  h=replaceOnce(h,'<td class="label-cell">June 2025 Account Statement</td>','<td class="label-cell" id="statement-label">June 2025 Account Statement</td>','244-14-a');
  h=replaceOnce(h,'<a class="btn" href="/docs/stmt-2025-06.pdf">View</a>','<a class="btn" id="statement-link" href="/docs/stmt-2025-06.pdf" aria-labelledby="statement-link statement-label">View</a>','244-14-b');
  h=replaceOnce(h,'<td class="label-cell">2024 Year-End Tax Form (1099-INT)</td>','<td class="label-cell" id="tax-label">2024 Year-End Tax Form (1099-INT)</td>','244-14-c');
  return replaceOnce(h,'<a class="btn" href="/docs/1099int-2024.pdf">View</a>','<a class="btn" id="tax-link" href="/docs/1099int-2024.pdf" aria-labelledby="tax-link tax-label">View</a>','244-14-d');
}});
add({sc:'2.4.4',aspect:'generic-link-text-no-rescuing-context',id:'case-13',source:'case-01',title:'Read-more link named by an external article heading',type:'external-reference',selector:'p.more-row > a[aria-labelledby]',repair:'Keep “Read more” visible and reference the existing article heading after the link’s own ID.',mechanism:'The resulting name is “Read more Harbor Commission Approves Long-Delayed Ferry Terminal”; the heading is outside the extracted link paragraph.',transform(h){
  h=replaceOnce(h,'<h2>Harbor Commission Approves Long-Delayed Ferry Terminal</h2>','<h2 id="ferry-heading">Harbor Commission Approves Long-Delayed Ferry Terminal</h2>','244-g13-a');
  return replaceOnce(h,'<a href="/news/ferry-terminal-approved-full">Read more</a>','<a id="read-ferry" href="/news/ferry-terminal-approved-full" aria-labelledby="read-ferry ferry-heading">Read more</a>','244-g13-b');
}});
add({sc:'2.4.4',aspect:'generic-link-text-no-rescuing-context',id:'case-14',source:'case-03',title:'Details links repaired by visible list-item context',type:'context-extraction',selector:'footer li > a[aria-labelledby]',repair:'Add a visible purpose label in each list item and combine it with the unchanged “Details” link text.',mechanism:'Each complete purpose depends on its containing list item and external IDREF rather than the anchor string alone.',transform(h){
  h=replaceOnce(h,'<li><a href="/menu">Details</a></li>','<li><span id="menu-purpose">Menu:</span> <a id="menu-details" href="/menu" aria-labelledby="menu-details menu-purpose">Details</a></li>','244-g14-a');
  h=replaceOnce(h,'<li><a href="/private-events">Details</a></li>','<li><span id="events-purpose">Private events:</span> <a id="events-details" href="/private-events" aria-labelledby="events-details events-purpose">Details</a></li>','244-g14-b');
  return replaceOnce(h,'<li><a href="/gift-cards">Details</a></li>','<li><span id="gift-purpose">Gift cards:</span> <a id="gift-details" href="/gift-cards" aria-labelledby="gift-details gift-purpose">Details</a></li>','244-g14-c');
}});
add({sc:'2.4.4',aspect:'generic-link-text-no-rescuing-context',id:'case-08',source:'case-04',title:'Raw-URL link named by an external visible document title',type:'external-reference',selector:'a.rawlink[aria-labelledby]',repair:'Name the document in the surrounding sentence and combine that external text with the unchanged raw URL through aria-labelledby.',mechanism:'The visible URL remains, but its accessible name also resolves the external “Q3 2024 earnings report” text omitted from an isolated-anchor extraction.',transform(h){
  h=replaceOnce(h,'Document available at:<br>','<span id="q3-document">Q3 2024 earnings report available at:</span><br>','244-g08-a');
  return replaceOnce(h,'<a class="rawlink" href="https://example.com/products/2024/q3-report.pdf">','<a class="rawlink" id="q3-report-link" href="https://example.com/products/2024/q3-report.pdf" aria-labelledby="q3-report-link q3-document">','244-g08-b');
}});
add({sc:'2.4.4',aspect:'duplicate-name-same-context-different-purpose',id:'case-12',source:'case-01',title:'Duplicate order-form links named by external destination headings',type:'external-reference',selector:'.lead a[aria-labelledby]',repair:'Keep both visible “order form” labels and reference the matching destination section heading.',mechanism:'The links remain visually identical, while their computed names resolve to different external section headings.',transform(h){
  h=replaceOnce(h,'<a href="#cake-form">order form</a>','<a id="cake-order-link" href="#cake-form" aria-labelledby="cake-order-link cake-h">order form</a>','244-d12-a');
  return replaceOnce(h,'<a href="#bread-form">order form</a>','<a id="bread-order-link" href="#bread-form" aria-labelledby="bread-order-link bread-h">order form</a>','244-d12-b');
}});
add({sc:'2.4.4',aspect:'duplicate-name-same-context-different-purpose',id:'case-13',source:'case-03',title:'Duplicate email links named by external purpose phrases',type:'external-reference',selector:'.card a[aria-labelledby]',repair:'Keep both visible “Email us” labels and reference nearby visible purpose phrases with self-first aria-labelledby.',mechanism:'The destination-specific words are outside each anchor but become part of the computed name through IDREFs.',transform(h){
  h=replaceOnce(h,'to talk pricing, seats and a guided trial','to talk <span id="sales-purpose">pricing, seats and a guided trial</span>','244-d13-a');
  h=replaceOnce(h,'if\n        something is broken in production and you need an engineer','if\n        <span id="support-purpose">something is broken in production and you need an engineer</span>','244-d13-b');
  h=replaceOnce(h,'<a href="mailto:sales@latchkey.dev?subject=Latchkey%20enquiry">Email us</a>','<a id="sales-email" href="mailto:sales@latchkey.dev?subject=Latchkey%20enquiry" aria-labelledby="sales-email sales-purpose">Email us</a>','244-d13-c');
  return replaceOnce(h,'<a href="mailto:support@latchkey.dev?subject=Production%20issue">Email us</a>','<a id="support-email" href="mailto:support@latchkey.dev?subject=Production%20issue" aria-labelledby="support-email support-purpose">Email us</a>','244-d13-d');
}});
add({sc:'2.4.4',aspect:'preceding-heading-or-list-grouping-context-sufficiency',id:'case-13',source:'case-01',title:'Hotel quick links explicitly named by external hotel headings',type:'external-reference',selector:'.resource-bar a[aria-labelledby]',repair:'Give every short action link a self-first aria-labelledby reference to the matching existing hotel heading.',mechanism:'The heading is outside the quick-links list, but the accessible name explicitly includes the correct hotel.',transform(h){
  h=replaceOnce(h,'<h2 class="hotel-name">Royal Palm Hotel</h2>','<h2 class="hotel-name" id="royal-heading">Royal Palm Hotel</h2>','244-p13-a');
  h=replaceOnce(h,'<h2 class="hotel-name">Hotel Three Rivers</h2>','<h2 class="hotel-name" id="rivers-heading">Hotel Three Rivers</h2>','244-p13-b');
  let i=0; h=h.replace(/<a href="(\/hotels\/royal-palm\/[^\"]+)">([^<]+)<\/a>/g,(_,href,text)=>{i++;return `<a id="royal-action-${i}" href="${href}" aria-labelledby="royal-action-${i} royal-heading">${text}</a>`});
  let j=0; h=h.replace(/<a href="(\/hotels\/three-rivers\/[^\"]+)">([^<]+)<\/a>/g,(_,href,text)=>{j++;return `<a id="rivers-action-${j}" href="${href}" aria-labelledby="rivers-action-${j} rivers-heading">${text}</a>`});
  if(i!==3||j!==3)throw new Error('244-p13-links'); return h;
}});
add({sc:'2.4.4',aspect:'preceding-heading-or-list-grouping-context-sufficiency',id:'case-14',source:'case-03',title:'Invoice actions explicitly named by external invoice titles',type:'external-reference',selector:'.actions a[aria-labelledby]',repair:'Assign each invoice title an ID and combine each action’s own text with the matching title through aria-labelledby.',mechanism:'All nine names remain action-first and become unique through external invoice context omitted from isolated link snippets.',transform(h){
  const nums=['1042','1043','1051']; for(const n of nums)h=replaceOnce(h,`<p class="invoice-title">Invoice #${n}`,`<p class="invoice-title" id="invoice-${n}">Invoice #${n}`,`244-p14-title-${n}`);
  for(const n of nums)for(const action of ['edit','void','resend']){const text=action[0].toUpperCase()+action.slice(1);h=replaceOnce(h,`<a href="/billing/${n}/${action}"${action==='void'?' class="danger"':''}>${text}</a>`,`<a id="${action}-${n}" href="/billing/${n}/${action}"${action==='void'?' class="danger"':''} aria-labelledby="${action}-${n} invoice-${n}">${text}</a>`,`244-p14-${n}-${action}`)} return h;
}});

const original = readJson(LIST);
const specKeys = new Set(specs.map((spec) => `${spec.sc}::${spec.aspect}::${spec.id}`));
const retained = original.filter((row) => !DROP_SC.has(row.sc) && !specKeys.has(row.key));
if (original.length !== 79 || retained.length !== 55 || specs.length !== 24) {
  throw new Error(`Unexpected counts: original=${original.length} retained=${retained.length} specs=${specs.length}`);
}

const results = new Map();
function getResult(sc) {
  if (!results.has(sc)) results.set(sc, readJson(resultPath(sc)));
  return results.get(sc);
}

// Tag retained entries so the revised slice is queryable by design category.
for (const row of retained) {
  const result = getResult(row.sc);
  const aspect = findAspect(result, row.aspect);
  const page = aspect.built.pages.find((p) => p.id === row.id);
  if (!page) throw new Error(`Missing retained result ${row.key}`);
  page.balanceBatch = BATCH;
  page.hardNegativeType = row.sc === '2.4.2' ? 'act-rule-scope-boundary'
    : 'paired-specificity';
  page.pairedWith ||= ((page.scenario || '').match(/case-\d+/) || [])[0] || null;
  row.type = page.hardNegativeType;
  if (page.pairedWith) row.pairedWith = page.pairedWith;
}

const addedRows = [];
for (const spec of specs) {
  const result = getResult(spec.sc);
  const aspect = findAspect(result, spec.aspect);
  const sourceRecord = aspect.built.pages.find((p) => p.id === spec.source);
  if (!sourceRecord || sourceRecord.expected !== 'failed') throw new Error(`Bad source ${spec.sc}/${spec.aspect}/${spec.source}`);
  const dir = pageDir(spec.sc, spec.aspect);
  const sourceHtml = fs.readFileSync(path.join(dir, `${spec.source}.html`), 'utf8');
  const html = addPairComment(spec.transform(sourceHtml), spec.source, spec.repair);
  const htmlFile = path.join(dir, `${spec.id}.html`);
  const mdFile = path.join(dir, `${spec.id}.md`);
  fs.writeFileSync(htmlFile, html);
  const citation = sourceRecord.citation;
  fs.writeFileSync(mdFile, `# ${spec.id} — ${spec.title}\n\n## Pair and category\n\nPaired PASS for **${spec.source}**. Batch \`${BATCH}\`; category \`${spec.type}\`.\n\n## Exact repair\n\n${spec.repair}\n\n## Primary selector\n\n\`${spec.selector}\`\n\n## Accessibility mechanism\n\n${spec.mechanism}\n\n## Expected ACT-style outcome\n\n**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.\n\n## Citation\n\n${citationMd(citation)}\n`);

  const relHtml = path.relative(ROOT, htmlFile);
  const relMd = path.relative(ROOT, mdFile);
  const record = {
    id: spec.id, file: relHtml, docFile: relMd,
    scenario: `PAIRED PASS for source ${spec.source}. ${spec.title}.`, expected: 'passed',
    mechanism: spec.mechanism, primarySelector: spec.selector,
    whyAutomatedToolsMiss: 'The decisive evidence is outside a target-only element extraction or sits at a narrow ACT-rule/full-SC boundary; evaluate the rendered page, resolved IDREFs, and accessibility tree before flagging.',
    citation, balanceBatch: BATCH, hardNegativeType: spec.type, pairedWith: spec.source,
  };
  aspect.built.pages = aspect.built.pages.filter((p) => p.id !== spec.id);
  aspect.built.pages.push(record);
  addedRows.push({key:`${spec.sc}::${spec.aspect}::${spec.id}`,sc:spec.sc,aspect:spec.aspect,id:spec.id,file:relHtml,docFile:relMd,expected:'passed',type:spec.type,pairedWith:spec.source});
}

for (const [sc, result] of results) writeJson(resultPath(sc), result);
const revised = [...retained, ...addedRows].sort((a,b) => a.sc.localeCompare(b.sc,{numeric:true}) || a.aspect.localeCompare(b.aspect) || a.id.localeCompare(b.id,{numeric:true}));
if (revised.length !== 79 || new Set(revised.map((r) => r.key)).size !== 79) throw new Error('Revised list is not 79 unique cases');
writeJson(LIST, revised);

const bySc = Object.fromEntries([...new Set(revised.map((r) => r.sc))].sort().map((sc) => [sc, revised.filter((r) => r.sc === sc).length]));
const weak = revised.filter((r) => TARGET_SC.has(r.sc)).length;
console.log(JSON.stringify({batch:BATCH,n:revised.length,bySc,weakScCases:weak,weakScShare:weak/revised.length,added:addedRows.length},null,2));
