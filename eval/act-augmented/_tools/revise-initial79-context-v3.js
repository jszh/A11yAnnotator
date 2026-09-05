#!/usr/bin/env node
'use strict';

/**
 * Revise the 79-case negative slice so `context-extraction` has one precise
 * meaning: the rendered accessibility tree resolves an external IDREF whose
 * text is absent from GenA11y's complete per-page extraction payload.
 *
 * This script deliberately keeps the SC distribution stable. It replaces the
 * 1.1.1 lane with 14 extractor-boundary pairs and makes 10 of the 18 2.4.4
 * cases extractor-boundary pairs. The other 55 cases remain useful paired
 * specificity or ACT-rule-boundary controls, but are not called extraction
 * tests.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const LIST = path.join(__dirname, 'initial-79-cases.json');
const BATCH = 'initial-79-context-v3';

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
function resultPath(sc) { return path.join(ROOT, 'eval', 'act-augmented', sc, 'result.json'); }
function pageDir(sc, aspect) { return path.join(ROOT, 'eval', 'act-augmented', sc, 'pages', aspect); }
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
function findAspect(result, aspect) {
  const found = result.aspectResults.find((row) => row.aspect === aspect);
  if (!found) throw new Error(`Missing aspect ${result.sc}/${aspect}`);
  return found;
}
function keyOf(row) { return `${row.sc}::${row.aspect}::${row.id}`; }
function contract(sc, selector) {
  return {
    extractor: sc === '1.1.1' ? 'extract_visual_elements' : 'extract_links',
    targetSelector: selector,
    assertion: 'Every target resolves non-self aria-labelledby/aria-describedby evidence that is absent from the complete GenA11y per-page payload.',
  };
}

const results = new Map();
function getResult(sc) {
  if (!results.has(sc)) results.set(sc, readJson(resultPath(sc)));
  return results.get(sc);
}
function getPage(sc, aspect, id) {
  const page = findAspect(getResult(sc), aspect).built.pages.find((p) => p.id === id);
  if (!page) throw new Error(`Missing page record ${sc}/${aspect}/${id}`);
  return page;
}

const existingContext = [
  {sc:'1.1.1',aspect:'meaningful-image-suppressed-as-decorative',id:'case-10',source:'case-06',selector:'svg[role="img"][aria-labelledby][aria-describedby]'},
  {sc:'1.1.1',aspect:'alt-not-an-alternative-filename-placeholder',id:'case-10',source:'case-03',selector:'.team img[aria-labelledby]'},
  {sc:'1.1.1',aspect:'alt-not-an-alternative-filename-placeholder',id:'case-12',source:'case-04',selector:'.charts img[aria-labelledby]'},
  {sc:'1.1.1',aspect:'context-and-function-dependent-equivalence',id:'case-10',source:'case-04',selector:'button.iconbtn img[aria-labelledby]'},
  {sc:'1.1.1',aspect:'complex-image-long-description-incomplete',id:'case-09',source:'case-02',selector:'svg[role="img"][aria-describedby]'},

  {sc:'2.4.4',aspect:'context-outside-programmatic-link-context-f63',id:'case-11',source:'case-03',selector:'dl.media a.listen[aria-labelledby]'},
  {sc:'2.4.4',aspect:'context-outside-programmatic-link-context-f63',id:'case-12',source:'case-05',selector:'.card .action a[aria-labelledby]'},
  {sc:'2.4.4',aspect:'context-outside-programmatic-link-context-f63',id:'case-13',source:'case-01',selector:'p.more > a[aria-labelledby]'},
  {sc:'2.4.4',aspect:'generic-link-text-no-rescuing-context',id:'case-13',source:'case-01',selector:'p.more-row > a[aria-labelledby]'},
  {sc:'2.4.4',aspect:'preceding-heading-or-list-grouping-context-sufficiency',id:'case-10',source:'case-04',selector:'.listing-links a[aria-labelledby]'},
  {sc:'2.4.4',aspect:'preceding-heading-or-list-grouping-context-sufficiency',id:'case-14',source:'case-03',selector:'.actions a[aria-labelledby]'},
];

const specs = [];
function add(spec) { specs.push(spec); }

// 1.1.1: GenA11y sends visual nodes (and an image's parent anchor) but no
// arbitrary referenced text elsewhere in the page.
add({sc:'1.1.1',aspect:'alt-not-an-alternative-filename-placeholder',id:'case-13',source:'case-03',
  title:'Four staff portraits named by external staff headings',selector:'.team img[aria-labelledby]',
  repair:'Keep each generic photo placeholder while giving every portrait an aria-labelledby reference to its existing visible staff heading.',
  mechanism:'The computed portrait names are Dr. Aaron Whitfield, Dr. Lena Park, Maya Okonjo, and Sofia Reyes; none of those headings is included in GenA11y’s visual-element payload.',
  transform(h){
    const people=[['Dr. Aaron Whitfield','aaron-v3'],['Dr. Lena Park','lena-v3'],['Maya Okonjo','maya-v3'],['Sofia Reyes','sofia-v3']];
    let imageIndex=0;
    h=h.replace(/<img alt="photo"/g,()=>`<img alt="photo" aria-labelledby="${people[imageIndex++]?.[1]}"`);
    if(imageIndex!==people.length)throw new Error(`111-a13-images-${imageIndex}`);
    for (const [name,id] of people) {
      h=replaceOnce(h,`<h2>${name}</h2>`,`<h2 id="${id}">${name}</h2>`,'111-a13-heading-'+id);
    }
    return h;
  }});
add({sc:'1.1.1',aspect:'alt-not-an-alternative-filename-placeholder',id:'case-14',source:'case-05',
  title:'Tutorial screenshot named by external instructions',selector:'ol.steps figure img[aria-labelledby]',
  repair:'Keep the screenshot filename alternative but override it with the existing step heading and a visible screenshot-purpose caption.',
  mechanism:'The screenshot’s computed name identifies the Security panel, Two-factor authentication row, and Turn on button; that referenced text is outside the isolated image payload.',
  transform(h){
    h=replaceOnce(h,'<h2>Turn on two-factor authentication</h2>','<h2 id="twofactor-step-v3">Turn on two-factor authentication</h2>','111-a14-heading');
    h=replaceOnce(h,'<img alt="Screenshot 2024-03-11 at 14.22.png"','<img alt="Screenshot 2024-03-11 at 14.22.png" aria-labelledby="twofactor-step-v3 screenshot-purpose-v3"','111-a14-img');
    return replaceOnce(h,'<figcaption>The Security settings panel.</figcaption>','<figcaption id="screenshot-purpose-v3">Security settings panel showing the Two-factor authentication row and its Turn on button.</figcaption>','111-a14-caption');
  }});
add({sc:'1.1.1',aspect:'context-and-function-dependent-equivalence',id:'case-14',source:'case-01',
  title:'Linked newspaper thumbnail named by external publication text',selector:'.card:first-child a img[aria-labelledby]',
  repair:'Keep the unchanged Riverside front-page image and expose its publication name visibly outside the link, referenced by the image.',
  mechanism:'The linked image computes to “The Riverside Courier”, but GenA11y’s image and parent-anchor extractions omit the following visible publication label.',
  transform(h){
    h=replaceOnce(h,'<img alt="Front page photo of a flooded town square under grey skies"','<img alt="Front page photo of a flooded town square under grey skies" aria-labelledby="riverside-publication-v3"','111-c14-img');
    return replaceOnce(h,'<div class="meta">Local · Updated 06:10</div>','<div class="meta"><span id="riverside-publication-v3">The Riverside Courier</span> · Local · Updated 06:10</div>','111-c14-label');
  }});
add({sc:'1.1.1',aspect:'context-and-function-dependent-equivalence',id:'case-15',source:'case-05',
  title:'Flag links named by external visible language labels',selector:'.langswitch a:not([hreflang="en"]) img[aria-labelledby]',
  repair:'Keep the three flag-description alternatives and add visible language names after their links, referenced by each image.',
  mechanism:'Japanese, German, and Brazilian Portuguese become the computed link purposes, while the text nodes supplying those purposes sit outside each extracted image and anchor.',
  transform(h){
    for (const [lang,bad,id,label] of [['ja','Flag of Japan','lang-ja-v3','Japanese'],['de','Flag of Germany','lang-de-v3','German'],['pt-BR','Flag of Brazil','lang-pt-v3','Brazilian Portuguese']]) {
      h=replaceOnce(h,`<img alt="${bad}"`,`<img alt="${bad}" aria-labelledby="${id}"`,'111-c15-img-'+lang);
      const linkStart=h.indexOf(`<a href="/?lang=${lang}" hreflang="${lang}">`);
      const linkEnd=h.indexOf('</a>',linkStart);
      if(linkStart<0||linkEnd<0)throw new Error('111-c15-link-'+lang);
      h=h.slice(0,linkEnd)+`</a><span id="${id}">${label}</span>`+h.slice(linkEnd+4);
    }
    return h;
  }});
add({sc:'1.1.1',aspect:'image-of-text-alt-omits-the-text',id:'case-11',source:'case-01',
  title:'Promotion image named by a complete external transcript',selector:'img.hero[aria-labelledby]',
  repair:'Keep the generic banner alternative and add a visible, externally referenced transcript containing every word in the promotion image.',
  mechanism:'The accessible image name contains the offer, code, and deadline, but GenA11y sends only the image element and omits the transcript paragraph.',
  transform(h){
    h=replaceOnce(h,'    footer { padding:18px 24px;','    .transcript { margin:14px 24px 0; padding:12px 14px; border:1px solid var(--line); background:#faf6f0; }\n    footer { padding:18px 24px;','111-i11-css');
    h=replaceOnce(h,'alt="Summer sale promotional banner"','alt="Summer sale promotional banner" aria-labelledby="promotion-transcript-v3"','111-i11-img');
    return replaceOnce(h,'\n    <div class="body">','\n    <p class="transcript" id="promotion-transcript-v3"><strong>Summer sale — 20% off everything.</strong> Use code SAVE20 at checkout. Ends Sunday, August 31.</p>\n\n    <div class="body">','111-i11-text');
  }});
add({sc:'1.1.1',aspect:'image-of-text-alt-omits-the-text',id:'case-12',source:'case-02',
  title:'Pull-quote image named by an external blockquote',selector:'img.pullquote[aria-labelledby]',
  repair:'Keep the generic decorative-graphic alternative and add the complete quotation and attribution as visible referenced text.',
  mechanism:'The image’s computed name contains the full Gibson quotation and attribution, while the blockquote is not present in GenA11y’s visual-element extraction.',
  transform(h){
    h=replaceOnce(h,'    .pullquote { display:block; width:100%; height:auto; margin:30px 0; border-left:4px solid var(--accent); }','    .pullquote { display:block; width:100%; height:auto; margin:30px 0 10px; border-left:4px solid var(--accent); }\n    blockquote.transcript { margin:0 0 30px; padding:12px 18px; background:#f4f7f7; border-left:4px solid var(--accent); }','111-i12-css');
    h=replaceOnce(h,'alt="Decorative pull-quote graphic in the article"','alt="Decorative pull-quote graphic in the article" aria-labelledby="pullquote-transcript-v3"','111-i12-img');
    return replaceOnce(h,'\n    <p>Reading that line aloud',`\n    <blockquote class="transcript" id="pullquote-transcript-v3">“The future is already here — it’s just not very evenly distributed.” — William Gibson, 1993</blockquote>\n\n    <p>Reading that line aloud`,'111-i12-text');
  }});
add({sc:'1.1.1',aspect:'meaningful-image-suppressed-as-decorative',id:'case-14',source:'case-04',
  title:'Dosing pictogram named by complete external directions',selector:'.schedule svg[role="img"][aria-labelledby]',
  repair:'Expose the unchanged dosing graphic as an image and replace its vague caption with complete visible directions referenced by aria-labelledby.',
  mechanism:'The image’s computed name supplies every dose and both safety instructions, but the external directions are absent from the isolated SVG payload.',
  transform(h){
    h=replaceOnce(h,'<svg aria-hidden="true"','<svg role="img" aria-labelledby="schedule-directions-v3"','111-m14-svg');
    return replaceOnce(h,'<p class="takeas">Take your morning and midday doses as shown above. Do not skip doses.</p>','<p class="takeas" id="schedule-directions-v3">Dosing schedule: take 2 tablets in the morning, 1 tablet at midday, and 1 tablet at night. Take with food, do not crush, and swallow whole. Do not skip doses.</p>','111-m14-text');
  }});
add({sc:'1.1.1',aspect:'meaningful-image-suppressed-as-decorative',id:'case-15',source:'case-05',
  title:'Transit diagram named by a complete external advisory',selector:'.diagram img[aria-labelledby]',
  repair:'Keep the empty alt and add complete visible service-change text referenced by the diagram.',
  mechanism:'The computed image name identifies the B suspension, Q reroute, skipped stops, and shuttle; GenA11y’s isolated image payload contains only the IDREF, not those words.',
  transform(h){
    h=replaceOnce(h,'<img alt=""','<img alt="" aria-labelledby="service-details-v3"','111-m15-img');
    return replaceOnce(h,'<p class="blurb">Service changes are in effect this weekend. Please plan extra travel\n    time and check signage at your station. We apologise for the inconvenience.</p>','<p class="blurb" id="service-details-v3"><strong>B service is suspended from Bedford Avenue to Church Avenue.</strong> Q trains are rerouted express via the N line and skip DeKalb Avenue and Atlantic Avenue. Free shuttle buses replace B trains between Bedford Avenue and Church Avenue. Please plan extra travel time.</p>','111-m15-text');
  }});
add({sc:'1.1.1',aspect:'complex-image-long-description-incomplete',id:'case-11',source:'case-03',
  title:'Loan flowchart completed by an external branch description',selector:'figure > svg[role="img"][aria-describedby]',
  repair:'Reference a complete visible branch description from the unchanged flowchart instead of leaving the flat node list unassociated.',
  mechanism:'The accessibility tree exposes both branch decisions and outcomes through aria-describedby, while GenA11y’s SVG-only payload omits that external description.',
  transform(h){
    h=replaceOnce(h,'<svg viewBox="0 0 760 460" width="100%" role="img" aria-labelledby="flowName"','<svg viewBox="0 0 760 460" width="100%" role="img" aria-labelledby="flowName" aria-describedby="flow-description-v3"','111-x11-svg');
    const before=`    <figcaption>\n      <strong>Loan decision flowchart.</strong> The process has five stages:\n      Application received, a Credit score check (660 or above), a Debt-to-income (DTI)\n      check (40% or below), Auto-approve, Manual underwriting, and Decline. These are the\n      steps your application passes through.\n    </figcaption>`;
    const after=`    <figcaption id="flow-description-v3">\n      <strong>Loan decision flowchart.</strong> Application received leads to the credit-score check.\n      A score below 660 leads to Decline; a score of 660 or above leads to the debt-to-income check.\n      A debt-to-income ratio of 40% or below leads to Auto-approve; a higher ratio leads to Manual underwriting.\n    </figcaption>`;
    return replaceOnce(h,before,after,'111-x11-caption');
  }});

// 2.4.4: ensure decisive labels sit outside the exact table/list/parent scope
// returned by extract_links.
add({sc:'2.4.4',aspect:'duplicate-name-same-context-different-purpose',id:'case-14',source:'case-04',
  title:'Buy-now links named by remote plan names',selector:'.buyrow a.buy[aria-labelledby]',
  repair:'Give each plan name an ID and combine each Buy now link’s own text with the matching remote plan name.',
  mechanism:'Each link’s parent contains only “Buy now”; Sprout or Greenhouse resolves in the accessibility tree but is absent from the extracted link context.',
  transform(h){
    h=replaceOnce(h,'<div class="name col1 pad">Sprout</div>','<div class="name col1 pad" id="sprout-plan-v3">Sprout</div>','244-d14-name1');
    h=replaceOnce(h,'<div class="name col2 pad">Greenhouse</div>','<div class="name col2 pad" id="greenhouse-plan-v3">Greenhouse</div>','244-d14-name2');
    h=replaceOnce(h,'<a class="buy" href="#checkout-sprout">Buy now</a>','<a class="buy" id="buy-sprout-v3" href="#checkout-sprout" aria-labelledby="buy-sprout-v3 sprout-plan-v3">Buy now</a>','244-d14-link1');
    return replaceOnce(h,'<a class="buy" href="#checkout-greenhouse">Buy now</a>','<a class="buy" id="buy-greenhouse-v3" href="#checkout-greenhouse" aria-labelledby="buy-greenhouse-v3 greenhouse-plan-v3">Buy now</a>','244-d14-link2');
  }});
add({sc:'2.4.4',aspect:'preceding-heading-or-list-grouping-context-sufficiency',id:'case-15',source:'case-05',
  title:'Sensor resources named by remote variant headings',selector:'.links-block a[aria-labelledby]',
  repair:'Combine each resource link’s own text with its visually corresponding S2 variant heading.',
  mechanism:'The grid headings are outside each links-block parent, so Standard or Pro appears in the computed link name but nowhere in GenA11y’s extracted parent context.',
  transform(h){
    for (const [block,heading,prefix] of [['l-std','h-std','std'],['l-pro','h-pro','pro']]) {
      let i=0;
      const re=new RegExp(`(<div class="links-block" id="${block}">)([\\s\\S]*?)(</div>)`);
      const m=h.match(re); if(!m)throw new Error('244-p15-block-'+block);
      const body=m[2].replace(/<a href="([^"]+)">([^<]+)<\/a>/g,(_,href,text)=>{i++;return `<a id="${prefix}-resource-${i}-v3" href="${href}" aria-labelledby="${prefix}-resource-${i}-v3 ${heading}">${text}</a>`});
      if(i!==3)throw new Error('244-p15-count-'+block);
      h=h.replace(re,`${m[1]}${body}${m[3]}`);
    }
    return h;
  }});
add({sc:'2.4.4',aspect:'preceding-heading-or-list-grouping-context-sufficiency',id:'case-16',source:'case-06',
  title:'Format links explicitly named by remote definition terms',selector:'dl dd a[aria-labelledby]',
  repair:'Give each format link an ID and combine its own format text with the preceding document-name term.',
  mechanism:'GenA11y does not treat a definition list as an extraction ancestor, so the referenced Arabic document term is absent from every DD/link snippet while present in the computed name.',
  transform(h){
    const groups=[['refill','doc-refill'],['consent','doc-consent']];
    for(const [prefix,term] of groups){
      const marker=`<dt id="${term}">`;
      const start=h.indexOf(marker); if(start<0)throw new Error('244-p16-term-'+term);
      const ddStart=h.indexOf('<dd>',start),ddEnd=h.indexOf('</dd>',ddStart); if(ddStart<0||ddEnd<0)throw new Error('244-p16-dd-'+term);
      const old=h.slice(ddStart,ddEnd+5); let i=0;
      const neu=old.replace(/<a href="([^"]+)" lang="([^"]+)">([^<]+)<\/a>/g,(_,href,lang,text)=>{i++;return `<a id="${prefix}-format-${i}-v3" href="${href}" lang="${lang}" aria-labelledby="${prefix}-format-${i}-v3 ${term}">${text}</a>`});
      if(i!==3)throw new Error('244-p16-count-'+term);
      h=h.slice(0,ddStart)+neu+h.slice(ddEnd+5);
    }
    return h;
  }});
add({sc:'2.4.4',aspect:'generic-link-text-no-rescuing-context',id:'case-15',source:'case-05',
  title:'Chevron link named by a remote visible product name',selector:'.spotlight:nth-of-type(2) a.chev[aria-labelledby]',
  repair:'Add a visible Aurora product name before the isolated chevron paragraph and reference it after the link’s own ID.',
  mechanism:'The chevron’s parent contains no product words; “Aurora Bluetooth speaker details” is computed from a remote sibling that GenA11y’s parent/sibling-of-link extraction does not reach.',
  transform(h){
    h=replaceOnce(h,'  .spotlight p { margin: 0; }','  .spotlight p { margin: 0; }\n  .product-name { font-weight:700; margin-bottom:6px; }','244-g15-css');
    h=replaceOnce(h,'    <div class="spotlight">\n      <p>\n        <a class="chev" href="/products/aurora-bt-speaker">&raquo;</a>','    <div class="spotlight">\n      <div class="product-name" id="aurora-name-v3">Aurora Bluetooth speaker details</div>\n      <p>\n        <a class="chev" id="aurora-link-v3" href="/products/aurora-bt-speaker" aria-labelledby="aurora-link-v3 aurora-name-v3">&raquo;</a>','244-g15-link');
    return h;
  }});

for (const spec of specs) {
  const result = getResult(spec.sc);
  const aspect = findAspect(result, spec.aspect);
  const sourceRecord = aspect.built.pages.find((p) => p.id === spec.source);
  if (!sourceRecord || sourceRecord.expected !== 'failed') throw new Error(`Bad paired source ${keyOf(spec)} -> ${spec.source}`);
  const dir = pageDir(spec.sc, spec.aspect);
  const sourceHtml = fs.readFileSync(path.join(dir, `${spec.source}.html`), 'utf8');
  const html = addPairComment(spec.transform(sourceHtml), spec.source, spec.repair);
  const htmlFile = path.join(dir, `${spec.id}.html`);
  const mdFile = path.join(dir, `${spec.id}.md`);
  fs.writeFileSync(htmlFile, html);
  fs.writeFileSync(mdFile, `# ${spec.id} — ${spec.title}\n\n## Pair and category\n\nPaired PASS for **${spec.source}**. Batch \`${BATCH}\`; category \`context-extraction\`.\n\n## Exact repair\n\n${spec.repair}\n\n## Primary selector\n\n\`${spec.selector}\`\n\n## Accessibility mechanism\n\n${spec.mechanism}\n\n## GenA11y payload contract\n\nThe exact \`${contract(spec.sc,spec.selector).extractor}\` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description.\n\n## Expected ACT-style outcome\n\n**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.\n\n## Citation\n\n${citationMd(sourceRecord.citation)}\n`);
  const record = {
    id:spec.id,
    file:path.relative(ROOT,htmlFile),
    docFile:path.relative(ROOT,mdFile),
    scenario:`PAIRED PASS for source ${spec.source}. ${spec.title}.`,
    expected:'passed',
    mechanism:spec.mechanism,
    primarySelector:spec.selector,
    whyAutomatedToolsMiss:'GenA11y’s exact per-SC extraction omits the externally referenced text that supplies the complete accessible alternative or purpose.',
    citation:sourceRecord.citation,
    balanceBatch:BATCH,
    hardNegativeType:'context-extraction',
    pairedWith:spec.source,
    gena11yExtraction:contract(spec.sc,spec.selector),
  };
  aspect.built.pages = aspect.built.pages.filter((p) => p.id !== spec.id);
  aspect.built.pages.push(record);
}

const contextRows = [...existingContext, ...specs.map(({sc,aspect,id,source,selector})=>({sc,aspect,id,source,selector}))];
if (contextRows.length !== 24 || new Set(contextRows.map(keyOf)).size !== 24) throw new Error('Expected 24 unique context cases');
const expectedTargetCounts = new Map([
  ['1.1.1::meaningful-image-suppressed-as-decorative::case-10',1],
  ['1.1.1::alt-not-an-alternative-filename-placeholder::case-10',4],
  ['1.1.1::alt-not-an-alternative-filename-placeholder::case-12',3],
  ['1.1.1::context-and-function-dependent-equivalence::case-10',1],
  ['1.1.1::complex-image-long-description-incomplete::case-09',1],
  ['2.4.4::context-outside-programmatic-link-context-f63::case-11',3],
  ['2.4.4::context-outside-programmatic-link-context-f63::case-12',3],
  ['2.4.4::context-outside-programmatic-link-context-f63::case-13',2],
  ['2.4.4::generic-link-text-no-rescuing-context::case-13',1],
  ['2.4.4::preceding-heading-or-list-grouping-context-sufficiency::case-10',6],
  ['2.4.4::preceding-heading-or-list-grouping-context-sufficiency::case-14',9],
  ['1.1.1::alt-not-an-alternative-filename-placeholder::case-13',4],
  ['1.1.1::alt-not-an-alternative-filename-placeholder::case-14',1],
  ['1.1.1::context-and-function-dependent-equivalence::case-14',1],
  ['1.1.1::context-and-function-dependent-equivalence::case-15',3],
  ['1.1.1::image-of-text-alt-omits-the-text::case-11',1],
  ['1.1.1::image-of-text-alt-omits-the-text::case-12',1],
  ['1.1.1::meaningful-image-suppressed-as-decorative::case-14',1],
  ['1.1.1::meaningful-image-suppressed-as-decorative::case-15',1],
  ['1.1.1::complex-image-long-description-incomplete::case-11',1],
  ['2.4.4::duplicate-name-same-context-different-purpose::case-14',2],
  ['2.4.4::preceding-heading-or-list-grouping-context-sufficiency::case-15',6],
  ['2.4.4::preceding-heading-or-list-grouping-context-sufficiency::case-16',6],
  ['2.4.4::generic-link-text-no-rescuing-context::case-15',1],
]);
if(expectedTargetCounts.size!==24)throw new Error('Expected target-count contract for every context case');

// Do not let semantic ID names substitute for the referenced text that the
// extractor omits. These IDs are intentionally opaque in the rendered fixture
// and therefore in the model payload.
const opaqueIds = new Map([
  ['1.1.1::meaningful-image-suppressed-as-decorative::case-10',[['qr-code-label','cx-001'],['manual-setup','cx-002']]],
  ['1.1.1::alt-not-an-alternative-filename-placeholder::case-10',[['aaron-name','cx-003'],['lena-name','cx-004'],['maya-name','cx-005'],['sofia-name','cx-006']]],
  ['1.1.1::alt-not-an-alternative-filename-placeholder::case-12',[['revenue-chart-name','cx-007'],['users-chart-name','cx-008'],['region-chart-name','cx-009']]],
  ['1.1.1::context-and-function-dependent-equivalence::case-10',[['print-label','cx-010']]],
  ['1.1.1::complex-image-long-description-incomplete::case-09',[['chartCap','cx-011']]],
  ['2.4.4::context-outside-programmatic-link-context-f63::case-11',[['recording-q1','cx-012'],['recording-investor-day','cx-013'],['recording-q4','cx-014']]],
  ['2.4.4::context-outside-programmatic-link-context-f63::case-12',[['product-summit','cx-015'],['product-trace','cx-016'],['product-basin','cx-017']]],
  ['2.4.4::context-outside-programmatic-link-context-f63::case-13',[['fee-description','cx-018'],['bus-description','cx-019']]],
  ['2.4.4::generic-link-text-no-rescuing-context::case-13',[['ferry-heading','cx-020']]],
  ['2.4.4::preceding-heading-or-list-grouping-context-sufficiency::case-10',[['listing-maple','cx-021'],['listing-birch','cx-022']]],
  ['2.4.4::preceding-heading-or-list-grouping-context-sufficiency::case-14',[['invoice-1042','cx-023'],['invoice-1043','cx-024'],['invoice-1051','cx-025']]],
  ['1.1.1::alt-not-an-alternative-filename-placeholder::case-13',[['aaron-v3','cx-026'],['lena-v3','cx-027'],['maya-v3','cx-028'],['sofia-v3','cx-029']]],
  ['1.1.1::alt-not-an-alternative-filename-placeholder::case-14',[['twofactor-step-v3','cx-030'],['screenshot-purpose-v3','cx-031']]],
  ['1.1.1::context-and-function-dependent-equivalence::case-14',[['riverside-publication-v3','cx-032']]],
  ['1.1.1::context-and-function-dependent-equivalence::case-15',[['lang-ja-v3','cx-033'],['lang-de-v3','cx-034'],['lang-pt-v3','cx-035']]],
  ['1.1.1::image-of-text-alt-omits-the-text::case-11',[['promotion-transcript-v3','cx-036']]],
  ['1.1.1::image-of-text-alt-omits-the-text::case-12',[['pullquote-transcript-v3','cx-037']]],
  ['1.1.1::meaningful-image-suppressed-as-decorative::case-14',[['schedule-directions-v3','cx-038']]],
  ['1.1.1::meaningful-image-suppressed-as-decorative::case-15',[['service-details-v3','cx-039']]],
  ['1.1.1::complex-image-long-description-incomplete::case-11',[['flow-description-v3','cx-040']]],
  ['2.4.4::duplicate-name-same-context-different-purpose::case-14',[['sprout-plan-v3','cx-041'],['greenhouse-plan-v3','cx-042']]],
  ['2.4.4::preceding-heading-or-list-grouping-context-sufficiency::case-15',[['h-std','cx-043'],['h-pro','cx-044']]],
  ['2.4.4::preceding-heading-or-list-grouping-context-sufficiency::case-16',[['doc-refill','cx-045'],['doc-consent','cx-046']]],
  ['2.4.4::generic-link-text-no-rescuing-context::case-15',[['aurora-name-v3','cx-047']]],
]);
for(const row of contextRows){
  const mappings=opaqueIds.get(keyOf(row));
  if(!mappings)throw new Error(`Missing opaque-ID mapping for ${keyOf(row)}`);
  const page=getPage(row.sc,row.aspect,row.id);
  const file=path.join(ROOT,page.file);
  let html=fs.readFileSync(file,'utf8');
  for(const [from,to] of mappings)html=html.split(from).join(to);
  fs.writeFileSync(file,html);
  const doc=path.join(ROOT,page.docFile);
  let md=fs.readFileSync(doc,'utf8');
  for(const [from,to] of mappings)md=md.split(from).join(to);
  md=md.replaceAll('initial-79-actlike-v2',BATCH).replaceAll('gena11y-fp-50-v2',BATCH);
  md=md.replace(/(^- Category: ).*$/m,'$1Context extraction');
  md=md.replace(/(\*\*Hard-negative type:\*\* )`[^`]+`/,'$1`context-extraction`');
  md=md.replace(/(category )`[^`]+`/,'$1`context-extraction`');
  md=md.replace(/(^- Primary selector: )`[^`]+`/m,`$1\`${row.selector}\``);
  md=md.replace(/(## Primary selector\n\n)`[^`]+`/,`$1\`${row.selector}\``);
  if(!md.includes('## GenA11y payload contract')){
    md+=`\n## GenA11y payload contract\n\nThe exact \`${contract(row.sc,row.selector).extractor}\` payload omits the normalized text of every non-self IDREF used by \`${row.selector}\`, while Chromium exposes that text in the target name or description. The external IDs are intentionally opaque.\n`;
  }
  if(!md.includes(BATCH))md+=`\n**Validated batch:** \`${BATCH}\`\n`;
  fs.writeFileSync(doc,md);
}
for (const row of contextRows) {
  const page = getPage(row.sc,row.aspect,row.id);
  page.balanceBatch=BATCH;
  page.hardNegativeType='context-extraction';
  page.pairedWith=row.source;
  page.primarySelector=row.selector;
  page.whyAutomatedToolsMiss='GenA11y’s exact per-SC extraction omits the externally referenced text that supplies the complete accessible alternative or purpose.';
  page.gena11yExtraction={...contract(row.sc,row.selector),expectedTargetCount:expectedTargetCounts.get(keyOf(row))};
}

const ordinary244 = new Set([
  'context-outside-programmatic-link-context-f63::case-07',
  'context-outside-programmatic-link-context-f63::case-08',
  'descriptive-name-contradicts-on-page-destination::case-07',
  'duplicate-name-same-context-different-purpose::case-07',
  'duplicate-name-same-context-different-purpose::case-08',
  'generic-link-text-no-rescuing-context::case-07',
  'icon-link-name-present-but-wrong-or-meaningless::case-07',
  'icon-link-name-present-but-wrong-or-meaningless::case-08',
]);
const previous = readJson(LIST);
const retained = previous.filter((row) => ['1.3.1','2.4.2','3.3.1'].includes(row.sc) || (row.sc==='2.4.4' && ordinary244.has(`${row.aspect}::${row.id}`)));
if (retained.length !== 55) throw new Error(`Expected 55 retained non-context rows, got ${retained.length}`);

for (const row of retained) {
  const page=getPage(row.sc,row.aspect,row.id);
  const type=row.sc==='2.4.2'?'act-rule-scope-boundary':'paired-specificity';
  row.type=type;
  page.balanceBatch=BATCH;
  page.hardNegativeType=type;
  delete page.gena11yExtraction;
}

const added = contextRows.map((row)=>{
  const page=getPage(row.sc,row.aspect,row.id);
  return {key:keyOf(row),sc:row.sc,aspect:row.aspect,id:row.id,file:page.file,docFile:page.docFile,expected:'passed',type:'context-extraction',pairedWith:row.source};
});
const revised=[...retained,...added].sort((a,b)=>a.sc.localeCompare(b.sc,{numeric:true})||a.aspect.localeCompare(b.aspect)||a.id.localeCompare(b.id,{numeric:true}));
if(revised.length!==79||new Set(revised.map((r)=>r.key)).size!==79)throw new Error('Revised list must contain 79 unique cases');

for(const [sc,result] of results)writeJson(resultPath(sc),result);
writeJson(LIST,revised);
const bySc=Object.fromEntries([...new Set(revised.map(r=>r.sc))].sort().map(sc=>[sc,revised.filter(r=>r.sc===sc).length]));
const byType=Object.fromEntries([...new Set(revised.map(r=>r.type))].sort().map(type=>[type,revised.filter(r=>r.type===type).length]));
console.log(JSON.stringify({batch:BATCH,total:revised.length,bySc,byType,contextShare:byType['context-extraction']/revised.length,newFixtures:specs.length},null,2));
