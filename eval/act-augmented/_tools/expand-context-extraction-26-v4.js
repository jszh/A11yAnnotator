#!/usr/bin/env node
'use strict';

/**
 * Add 26 paired PASS fixtures whose decisive accessible name/description text
 * is visible in the rendered page and AX tree but absent from GenA11y's exact
 * per-SC extraction payload. The existing 79-case list is not modified.
 *
 * Outputs:
 *   context-extraction-26-v4-cases.json  (the new evaluation slice)
 *   initial-105-cases.json               (the original 79 + the new 26)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const ORIGINAL_LIST = path.join(__dirname, 'initial-79-cases.json');
const NEW_LIST = path.join(__dirname, 'context-extraction-26-v4-cases.json');
const AGGREGATE_LIST = path.join(__dirname, 'initial-105-cases.json');
const BATCH = 'context-extraction-26-v4';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const resultPath = (sc) => path.join(ROOT, 'eval', 'act-augmented', sc, 'result.json');
const pageDir = (sc, aspect) => path.join(ROOT, 'eval', 'act-augmented', sc, 'pages', aspect);
const keyOf = (row) => `${row.sc}::${row.aspect}::${row.id}`;

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

function contract(sc, selector, expectedTargetCount) {
  return {
    extractor: sc === '1.1.1' ? 'extract_visual_elements' : 'extract_links',
    targetSelector: selector,
    expectedTargetCount,
    assertion: 'Every target resolves non-self aria-labelledby/aria-describedby evidence that is absent from the complete GenA11y per-page payload.',
  };
}

const resultDocs = new Map();
function resultFor(sc) {
  if (!resultDocs.has(sc)) resultDocs.set(sc, readJson(resultPath(sc)));
  return resultDocs.get(sc);
}
function aspectFor(sc, aspect) {
  const found = resultFor(sc).aspectResults.find((row) => row.aspect === aspect);
  if (!found) throw new Error(`Missing aspect ${sc}/${aspect}`);
  return found;
}

const specs = [];
const add = (spec) => specs.push(spec);

// -------------------------------------------------------------------------
// 1.1.1: image/visual extraction omits arbitrary referenced page text.
// -------------------------------------------------------------------------

add({sc:'1.1.1',aspect:'alt-not-an-alternative-filename-placeholder',id:'case-15',source:'case-01',count:1,
  title:'News photograph named by its external visible caption',selector:'article figure img[aria-labelledby="cx-048"]',
  repair:'Keep the photograph and replace the filename alternative through an aria-labelledby reference to its expanded visible caption.',
  mechanism:'Chromium names the photograph from the visible protest caption, while GenA11y extracts only the image markup and opaque IDREF.',
  transform(h){
    h=replaceOnce(h,'<img alt="DSC_0481.JPG"','<img alt="DSC_0481.JPG" aria-labelledby="cx-048"','111-15-image');
    return replaceOnce(h,'<figcaption>\n        Demonstrators fill the plaza outside City Hall on Tuesday afternoon.','<figcaption id="cx-048">\n        Demonstrators fill the plaza outside City Hall on Tuesday afternoon, carrying FAIR FARES and NO HIKE signs.','111-15-caption');
  }});

add({sc:'1.1.1',aspect:'alt-not-an-alternative-filename-placeholder',id:'case-16',source:'case-02',count:4,
  title:'Product thumbnails named by external product headings',selector:'a.thumb img[aria-labelledby]',
  repair:'Keep every CMS slug alt while overriding it with the corresponding visible product heading through aria-labelledby.',
  mechanism:'Each thumbnail receives the full item, colour, and size name from a sibling card heading omitted from the image and parent-anchor extraction.',
  transform(h){
    const rows=[
      ['prod-9921-thumb-2','cx-049','/p/9921','Stormline hooded rain jacket — sun yellow'],
      ['prod-9930-thumb-1','cx-050','/p/9930','Cairn mid hiking boot — forest green'],
      ['prod-9944-thumb-1','cx-051','/p/9944','Summit insulated bottle — glacier blue, 22oz'],
      ['prod-9951-thumb-3','cx-052','/p/9951','Daybreak 28L daypack — ember orange'],
    ];
    for(const [alt,id,href,name] of rows){
      h=replaceOnce(h,`<img alt="${alt}"`,`<img alt="${alt}" aria-labelledby="${id}"`,'111-16-image-'+id);
      h=replaceOnce(h,`<h3><a href="${href}">`,`<h3 id="${id}"><a href="${href}">`,'111-16-heading-'+id);
      if(!h.includes(name))throw new Error(`111-16-name-${name}`);
    }
    return h;
  }});

add({sc:'1.1.1',aspect:'alt-not-an-alternative-filename-placeholder',id:'case-17',source:'case-06',count:1,
  title:'Recipe photograph named by its external Spanish caption',selector:'article figure img[aria-labelledby="cx-053"]',
  repair:'Keep the WhatsApp filename alt while overriding it with the visible Spanish dish caption.',
  mechanism:'The computed name identifies the finished red pozole and garnishes; the isolated image payload contains only an opaque reference.',
  transform(h){
    h=replaceOnce(h,'<img alt="Img 20231104 Wa0006"','<img alt="Img 20231104 Wa0006" aria-labelledby="cx-053"','111-17-image');
    return replaceOnce(h,'<figcaption>El pozole rojo, listo para servir con sus guarniciones.</figcaption>','<figcaption id="cx-053">Tazón de pozole rojo con pollo deshebrado, rábanos, limón y orégano, listo para servir.</figcaption>','111-17-caption');
  }});

add({sc:'1.1.1',aspect:'context-and-function-dependent-equivalence',id:'case-17',source:'case-03',count:5,
  title:'Image-map areas named by an external room directory',selector:'map[name="wingmap"] area[aria-labelledby]',
  repair:'Keep the floor-plan hotspots and add a visible room directory whose entries label each area by destination.',
  mechanism:'Every area computes to a room and service name from the external directory, but each extracted area contains only its opaque IDREF.',
  transform(h){
    const rows=[
      ['/wing/room-101-radiology','cx-056','Radiology, Room 101'],
      ['/wing/room-104-phlebotomy','cx-057','Phlebotomy, Room 104'],
      ['/wing/room-108-cardiology','cx-058','Cardiology, Room 108'],
      ['/wing/room-110-pharmacy','cx-059','Pharmacy, Room 110'],
      ['/wing/room-115-lab','cx-060','Pathology Lab, Room 115'],
    ];
    for(const [href,id] of rows)h=replaceOnce(h,`href="${href}"`,`href="${href}" aria-labelledby="${id}"`,'111-17-area-'+id);
    const directory=`\n    <section class="room-directory" aria-labelledby="room-directory-heading">\n      <h2 id="room-directory-heading">Room directory</h2>\n      <ul>${rows.map(([,id,label])=>`<li id="${id}">${label} — directions, hours, and check-in information</li>`).join('')}</ul>\n    </section>\n`;
    return replaceOnce(h,'\n    <p class="legend">',directory+'\n    <p class="legend">','111-17-directory');
  }});

add({sc:'1.1.1',aspect:'context-and-function-dependent-equivalence',id:'case-18',source:'case-06',count:2,
  title:'Order-action icons named by visible sibling labels',selector:'button.ctl svg[aria-labelledby^="cx-"]',
  repair:'Keep both action graphics, replace their internal shape titles with visible purpose labels, and reference those siblings from each SVG and button.',
  mechanism:'Cancel order and Track driver are exposed in the AX names but omitted from each isolated SVG payload.',
  transform(h){
    h=replaceOnce(h,'<button type="button" class="ctl" data-action="cancel-order">','<button type="button" class="ctl" data-action="cancel-order" aria-labelledby="cx-061">','111-18-cancel-button');
    h=replaceOnce(h,'<svg viewBox="0 0 48 48" role="img" aria-labelledby="stoptitle">\n            <title id="stoptitle">Red octagon</title>','<svg viewBox="0 0 48 48" role="img" aria-labelledby="cx-061">','111-18-cancel-svg');
    h=replaceOnce(h,'<span class="txt" aria-hidden="true">Cancel</span>','<span class="txt" id="cx-061">Cancel order</span>','111-18-cancel-label');
    h=replaceOnce(h,'<button type="button" class="ctl" data-action="track">','<button type="button" class="ctl" data-action="track" aria-labelledby="cx-062">','111-18-track-button');
    h=replaceOnce(h,'<svg viewBox="0 0 48 48" role="img" aria-labelledby="tracktitle">\n            <title id="tracktitle">Track driver</title>','<svg viewBox="0 0 48 48" role="img" aria-labelledby="cx-062">','111-18-track-svg');
    return replaceOnce(h,'<span class="txt" aria-hidden="true">Track</span>','<span class="txt" id="cx-062">Track driver</span>','111-18-track-label');
  }});

add({sc:'1.1.1',aspect:'complex-image-long-description-incomplete',id:'case-12',source:'case-01',count:1,
  title:'Venue map described by complete external spatial directions',selector:'figure > svg[role="img"][aria-describedby="cx-063"]',
  repair:'Keep the venue map and replace its incomplete caption with a complete visible spatial description referenced by aria-describedby.',
  mechanism:'The AX description exposes venue positions, streets, river, rail line, and travel relationships; the SVG payload omits the external prose.',
  transform(h){
    h=replaceOnce(h,'aria-labelledby="mapTitle mapDesc"','aria-labelledby="mapTitle mapDesc" aria-describedby="cx-063"','111-12-svg');
    const start=h.indexOf('    <figcaption>'),end=h.indexOf('    </figcaption>',start);
    if(start<0||end<0)throw new Error('111-12-caption');
    const cap=`    <figcaption id="cx-063">\n      <strong>Map and directions.</strong> Frostvale Station is at City Centre where Granite Avenue crosses the North Rail Line. Glacier Ice Arena is northwest beside Birch Street and north of the river. Pine Ridge Bowl is far northeast beyond Summit Boulevard. Hearthstone Gymnasium is west of City Centre beside the river. Aurora Skating Oval is southeast across the river, and Riverside Curling Hall is southwest across the river. Shuttle buses leave Frostvale Station for all five venues every fifteen minutes.\n`;
    return h.slice(0,start)+cap+h.slice(end);
  }});

add({sc:'1.1.1',aspect:'complex-image-long-description-incomplete',id:'case-13',source:'case-04',count:1,
  title:'Metro map described by external line and interchange details',selector:'img#metroMap[aria-describedby="cx-064"]',
  repair:'Keep the network map while completing its visible description with every interchange relationship.',
  mechanism:'The AX description exposes all four line pairs and interchange stations, while the image payload contains only the opaque IDREF.',
  transform(h){
    h=h.split('metroDesc').join('cx-064');
    return replaceOnce(h,'Trains run every four to six minutes during peak hours.</p>','Interchanges are Central for Red and Green, Kingsway for Red and Blue, Riverbank for Green and Yellow, and Eastfield for Blue and Yellow. Trains run every four to six minutes during peak hours.</p>','111-13-description');
  }});

add({sc:'1.1.1',aspect:'complex-image-long-description-incomplete',id:'case-14',source:'case-05',count:1,
  title:'Clinical scatter plot described by external findings',selector:'figure > svg[role="img"][aria-describedby="cx-065"]',
  repair:'Keep the plot and extend its caption with the correlation and outlier-cluster findings, referenced by aria-describedby.',
  mechanism:'Chromium exposes the positive correlation and seven-participant slow-metaboliser cluster; GenA11y’s SVG payload omits the caption.',
  transform(h){
    h=replaceOnce(h,'aria-labelledby="scatName"','aria-labelledby="scatName" aria-describedby="cx-065"','111-14-svg');
    h=replaceOnce(h,'    <figcaption>','    <figcaption id="cx-065">','111-14-caption-id');
    return replaceOnce(h,'Each marker is one participant.','Each marker is one participant. Clearance time rises strongly as exposure increases. Seven participants form a distinct high-exposure, slow-clearance cluster in the upper-right, the subgroup that drives the Section 5 dosing caution.','111-14-caption-text');
  }});

add({sc:'1.1.1',aspect:'complex-image-long-description-incomplete',id:'case-15',source:'case-07',count:1,
  title:'Organisation chart described by external reporting relationships',selector:'figure > svg[role="img"][aria-describedby="cx-066"]',
  repair:'Keep the org chart and complete its caption with every reporting relationship, referenced by aria-describedby.',
  mechanism:'The AX description supplies the hierarchy while the isolated SVG payload contains only the chart title and opaque IDREF.',
  transform(h){
    h=replaceOnce(h,'aria-labelledby="orgName"','aria-labelledby="orgName" aria-describedby="cx-066"','111-15-svg');
    h=replaceOnce(h,'    <figcaption>','    <figcaption id="cx-066">','111-15-caption-id');
    return replaceOnce(h,'      <span class="rtl" lang="ar"> القائمة الكاملة لأعضاء قسم الهندسة.</span>','      Tomás Rivera and Aiko Tanaka report to Nadia Haddad. Priya Nair and Marek Kowalski report to Tomás Rivera. Sofia Russo and Omar Farouk report to Aiko Tanaka.\n      <span class="rtl" lang="ar"> القائمة الكاملة لأعضاء قسم الهندسة.</span>','111-15-caption-text');
  }});

add({sc:'1.1.1',aspect:'complex-image-long-description-incomplete',id:'case-16',source:'case-04',count:1,
  title:'Metro map described by an external structured interchange guide',selector:'img#metroMap[aria-describedby="cx-054"]',
  repair:'Keep the raster network map and replace its incomplete prose with a complete visible structured interchange guide.',
  mechanism:'The AX description exposes line termini and all four interchange pairs from a remote guide, while the extracted raster-image markup contains only the opaque IDREF.',
  transform(h){
    h=replaceOnce(h,'aria-describedby="metroDesc"','aria-describedby="cx-054"','111-16-image');
    const start=h.indexOf('  <div class="desc" id="metroDesc">'),end=h.indexOf('  </div>',start);
    if(start<0||end<0)throw new Error('111-16-description');
    const guide=`  <div class="desc" id="cx-054">\n    <h2>Network and interchange guide</h2>\n    <p>Red runs Westgate–Harbourside; Blue runs Northvale–Old Mill; Green runs Meadow–Quayford; Yellow is the southern riverside loop.</p>\n    <ul>\n      <li>Central: change between Red and Green.</li>\n      <li>Kingsway: change between Red and Blue.</li>\n      <li>Riverbank: change between Green and Yellow.</li>\n      <li>Eastfield: change between Blue and Yellow.</li>\n    </ul>\n    <p>Peak trains run every four to six minutes.</p>\n`;
    return h.slice(0,start)+guide+h.slice(end);
  }});

// -------------------------------------------------------------------------
// 2.4.4: link extraction omits referenced text outside its table/list/parent
// serialization boundary.
// -------------------------------------------------------------------------

add({sc:'2.4.4',aspect:'generic-link-text-no-rescuing-context',id:'case-16',source:'case-01',count:1,
  title:'Read-more link named by the external story heading',selector:'p.more-row > a[aria-labelledby]',
  repair:'Keep the visible Read more text and combine it with the existing article heading through aria-labelledby.',
  mechanism:'The computed purpose is Read more — Harbor Commission Approves Long-Delayed Ferry Terminal; the heading is outside the extracted link parent.',
  transform(h){
    h=replaceOnce(h,'<h2>Harbor Commission Approves Long-Delayed Ferry Terminal</h2>','<h2 id="cx-067">Harbor Commission Approves Long-Delayed Ferry Terminal</h2>','244-16-heading');
    return replaceOnce(h,'<a href="/news/ferry-terminal-approved-full">Read more</a>','<a id="cx-link-067" href="/news/ferry-terminal-approved-full" aria-labelledby="cx-link-067 cx-067">Read more</a>','244-16-link');
  }});

add({sc:'2.4.4',aspect:'generic-link-text-no-rescuing-context',id:'case-17',source:'case-03',count:3,
  title:'Restaurant detail links named by an external purpose key',selector:'.col:last-child ul a[aria-labelledby]',
  repair:'Keep all three Details labels and add a visible purpose key outside the list, referenced by each link.',
  mechanism:'Menu, private-events, and gift-card purposes resolve in AX names but the outermost-list extraction omits the purpose key.',
  transform(h){
    h=replaceOnce(h,'        <ul>\n          <li><a href="/menu">Details</a></li>','        <p class="purpose-key">Details for <span id="cx-068">the dinner menu</span>, <span id="cx-069">private events</span>, and <span id="cx-070">gift cards</span>.</p>\n        <ul>\n          <li><a id="cx-link-068" href="/menu" aria-labelledby="cx-link-068 cx-068">Details</a></li>','244-17-first');
    h=replaceOnce(h,'<li><a href="/private-events">Details</a></li>','<li><a id="cx-link-069" href="/private-events" aria-labelledby="cx-link-069 cx-069">Details</a></li>','244-17-second');
    return replaceOnce(h,'<li><a href="/gift-cards">Details</a></li>','<li><a id="cx-link-070" href="/gift-cards" aria-labelledby="cx-link-070 cx-070">Details</a></li>','244-17-third');
  }});

add({sc:'2.4.4',aspect:'generic-link-text-no-rescuing-context',id:'case-18',source:'case-04',count:1,
  title:'Raw URL named by an external filing title',selector:'a.rawlink[aria-labelledby]',
  repair:'Keep the visible raw URL and add a visible filing title outside its paragraph, referenced after the link’s own text.',
  mechanism:'The computed name identifies the Northwind Q3 2024 report PDF; the filing title is absent from the extracted parent snippet.',
  transform(h){
    h=replaceOnce(h,'    <div class="filing">','    <h3 id="cx-071">Northwind Industries Q3 2024 report (PDF)</h3>\n    <div class="filing">','244-18-title');
    return replaceOnce(h,'<a class="rawlink" href="https://example.com/products/2024/q3-report.pdf">','<a class="rawlink" id="cx-link-071" href="https://example.com/products/2024/q3-report.pdf" aria-labelledby="cx-link-071 cx-071">','244-18-link');
  }});

add({sc:'2.4.4',aspect:'generic-link-text-no-rescuing-context',id:'case-19',source:'case-05',count:1,
  title:'Chevron link named by an external product heading',selector:'.spotlight:nth-of-type(2) a.chev[aria-labelledby]',
  repair:'Keep the chevron and add a visible Aurora product heading outside its link paragraph, referenced by the link.',
  mechanism:'The computed purpose is Aurora Bluetooth speaker details, but the link-parent extraction contains only the chevron and opaque IDREF.',
  transform(h){
    h=replaceOnce(h,'    <div class="spotlight">\n      <p>\n        <a class="chev" href="/products/aurora-bt-speaker">','    <div class="spotlight">\n      <h3 id="cx-072">Aurora Bluetooth speaker details</h3>\n      <p>\n        <a class="chev" href="/products/aurora-bt-speaker" aria-labelledby="cx-072">','244-19-link');
    return h;
  }});

add({sc:'2.4.4',aspect:'context-outside-programmatic-link-context-f63',id:'case-15',source:'case-01',count:2,
  title:'Document links named by their external continuation text',selector:'p.more > a[aria-labelledby]',
  repair:'Keep both link labels and make each following continuation paragraph its programmatic purpose context.',
  mechanism:'Each computed name includes the specific fee-schedule or bus-route document text that GenA11y omits from the link parent.',
  transform(h){
    h=replaceOnce(h,'<a href="/agenda/fee-schedule-2025.pdf">Read the full document</a>','<a id="cx-link-073" href="/agenda/fee-schedule-2025.pdf" aria-labelledby="cx-link-073 cx-073">Read the full document</a>','244-15-link1');
    h=replaceOnce(h,'<p class="continuation">\n        &mdash; the proposed fee schedule','<p class="continuation" id="cx-073">\n        &mdash; the proposed fee schedule','244-15-ref1');
    h=replaceOnce(h,'<a href="/agenda/bus-routes-fall.pdf">Read the full document</a>','<a id="cx-link-074" href="/agenda/bus-routes-fall.pdf" aria-labelledby="cx-link-074 cx-074">Read the full document</a>','244-15-link2');
    return replaceOnce(h,'<p class="continuation">\n        &mdash; the district\'s revised route map','<p class="continuation" id="cx-074">\n        &mdash; the district\'s revised route map','244-15-ref2');
  }});

add({sc:'2.4.4',aspect:'context-outside-programmatic-link-context-f63',id:'case-16',source:'case-02',count:2,
  title:'Email document buttons named by an external ready-document summary',selector:'td.cta-cell > a[aria-labelledby]',
  repair:'Keep the two View buttons and add a visible document summary outside the layout table, referenced by each button.',
  mechanism:'The AX names distinguish the statement and tax form, while the table extraction omits the external summary IDs.',
  transform(h){
    h=replaceOnce(h,'  <div class="email-body">','  <div class="email-body">\n    <div class="document-key" style="width:544px;margin:0 auto 10px;background:#fff;padding:12px 28px;font:14px Arial,sans-serif">Ready documents: <span id="cx-075">Open the June 2025 account statement document</span>; <span id="cx-076">Open the 2024 year-end tax form 1099-INT document</span>.</div>','244-16-key');
    h=replaceOnce(h,'<a class="btn" href="/docs/stmt-2025-06.pdf">View</a>','<a class="btn" id="cx-link-075" href="/docs/stmt-2025-06.pdf" aria-labelledby="cx-link-075 cx-075">View</a>','244-16-link1');
    return replaceOnce(h,'<a class="btn" href="/docs/1099int-2024.pdf">View</a>','<a class="btn" id="cx-link-076" href="/docs/1099int-2024.pdf" aria-labelledby="cx-link-076 cx-076">View</a>','244-16-link2');
  }});

add({sc:'2.4.4',aspect:'context-outside-programmatic-link-context-f63',id:'case-17',source:'case-03',count:3,
  title:'Replay links described by external definition terms',selector:'dl.media a.listen[aria-describedby]',
  repair:'Keep the visible Listen labels and associate each with its existing definition term through aria-describedby.',
  mechanism:'The AX descriptions identify each recording, while GenA11y serializes only the DD parent and omits its DT.',
  transform(h){
    const rows=[['Q1 FY2025 earnings call','cx-077','/webcast/q1-fy25'],['2025 Investor Day keynote','cx-078','/webcast/investor-day-25'],['Q4 FY2024 earnings call','cx-079','/webcast/q4-fy24']];
    for(const [name,id,href] of rows){
      h=replaceOnce(h,`<dt>${name} `,`<dt id="${id}">${name} `,'244-17-dt-'+id);
      h=replaceOnce(h,`<a class="listen" href="${href}">`,`<a class="listen" href="${href}" aria-describedby="${id}">`,'244-17-link-'+id);
    }
    return h;
  }});

add({sc:'2.4.4',aspect:'context-outside-programmatic-link-context-f63',id:'case-18',source:'case-05',count:3,
  title:'Product-card links named by remote product details',selector:'.card .action a[aria-labelledby]',
  repair:'Keep each View label and combine it with the existing product name and description outside its action container.',
  mechanism:'Product identity and distinguishing features appear in AX names but not in GenA11y’s action-parent snippets.',
  transform(h){
    const rows=[
      ['/p/summit-22','cx-080','cx-081','Summit 22L Hiking Pack','Ventilated back panel, 22-liter capacity, hydration sleeve.'],
      ['/p/trace-14','cx-082','cx-083','Trace 14L Trail Runner Vest','Minimalist running vest with soft flask pockets.'],
      ['/p/basin-30','cx-084','cx-085','Basin 30L Overnight Pack','Roll-top closure, padded hip belt, rain cover included.'],
    ];
    for(const [href,nameId,descId,name,desc] of rows){
      h=replaceOnce(h,`<p class="name">${name}</p>`,`<p class="name" id="${nameId}">${name}</p>`,'244-18-name-'+nameId);
      h=replaceOnce(h,`<p class="blurb">${desc}</p>`,`<p class="blurb" id="${descId}">${desc}</p>`,'244-18-desc-'+descId);
      const linkId=`cx-link-${nameId.slice(3)}`;
      h=replaceOnce(h,`<a href="${href}">View</a>`,`<a id="${linkId}" href="${href}" aria-labelledby="${linkId} ${nameId}" aria-describedby="${descId}">View</a>`,'244-18-link-'+nameId);
    }
    return h;
  }});

add({sc:'2.4.4',aspect:'icon-link-name-present-but-wrong-or-meaningless',id:'case-09',source:'case-01',count:3,
  title:'Workspace icon links named by an external visible tool key',selector:'.tools a.iconlink[aria-labelledby]',
  repair:'Keep the icon toolbar and add a visible workspace-tool key outside it, referenced by all three links.',
  mechanism:'Search workspace, Settings, and Inbox resolve in AX names but are absent from the toolbar-parent extraction.',
  transform(h){
    h=replaceOnce(h,'    <h1>Sales pipeline</h1>','    <h1>Sales pipeline</h1>\n    <p class="tool-key">Workspace tools: <span id="cx-086">Search workspace</span>, <span id="cx-087">Settings</span>, <span id="cx-088">Inbox</span>.</p>','244-09-key');
    h=replaceOnce(h,'href="/search" aria-label="img_2031"','href="/search" aria-labelledby="cx-086"','244-09-search');
    h=replaceOnce(h,'href="/settings" aria-label="settings.svg"','href="/settings" aria-labelledby="cx-087"','244-09-settings');
    return replaceOnce(h,'href="/inbox" aria-label="link"','href="/inbox" aria-labelledby="cx-088"','244-09-inbox');
  }});

add({sc:'2.4.4',aspect:'icon-link-name-present-but-wrong-or-meaningless',id:'case-10',source:'case-02',count:1,
  title:'Back-arrow link named by the external article-navigation link',selector:'.artnav > a.iconnav[aria-labelledby]',
  repair:'Keep the back-arrow link and reference the existing fully named Transit stories link at the end of the article.',
  mechanism:'The top icon link computes to Back to all Transit stories, but its extracted artnav parent omits the remote pager link.',
  transform(h){
    h=replaceOnce(h,'<div class="artnav">\n      <a class="iconnav" href="/transit/index">','<div class="artnav">\n      <a class="iconnav" href="/transit/index" aria-labelledby="cx-089">','244-10-top');
    return replaceOnce(h,'<a class="iconnav" href="/transit/index">Back to all Transit stories</a>','<a class="iconnav" id="cx-089" href="/transit/index">Back to all Transit stories</a>','244-10-bottom');
  }});

add({sc:'2.4.4',aspect:'icon-link-name-present-but-wrong-or-meaningless',id:'case-11',source:'case-03',count:4,
  title:'Social icon links named by an external visible network key',selector:'nav.social a[aria-labelledby]',
  repair:'Keep the four social icons and add visible network names outside the navigation, referenced by each link.',
  mechanism:'Each AX name identifies its network, while the social-nav extraction contains only opaque references and SVGs.',
  transform(h){
    const rows=[['https://facebook.com/riverbendfood','cx-090','Facebook'],['https://x.com/riverbendfood','cx-091','X'],['https://instagram.com/riverbendfood','cx-092','Instagram'],['https://youtube.com/@riverbendfood','cx-093','YouTube']];
    for(const [href,id] of rows)h=replaceOnce(h,`href="${href}" aria-label="social media"`,`href="${href}" aria-labelledby="${id}"`,'244-11-link-'+id);
    const key=`<p class="social-key">Follow Riverbend Food Network on ${rows.map(([,id,name])=>`<span id="${id}">${name}</span>`).join(', ')}.</p>`;
    return replaceOnce(h,'\n      <nav class="social"',`\n      ${key}\n\n      <nav class="social"`,'244-11-key');
  }});

add({sc:'2.4.4',aspect:'icon-link-name-present-but-wrong-or-meaningless',id:'case-12',source:'case-04',count:6,
  title:'API-key icon actions named by an external visible action key',selector:'table a.iconbtn[aria-labelledby]',
  repair:'Keep the six row-action icons and add a visible action key outside the table, referenced by each link.',
  mechanism:'Every AX name identifies edit/revoke plus the key label; the outermost-table payload omits the action-key text.',
  transform(h){
    const rows=[
      ['/keys/k_8842/edit','cx-094','Edit Production server API key'],['/keys/k_8842/revoke','cx-095','Revoke Production server API key'],
      ['/keys/k_4410/edit','cx-096','Edit CI pipeline API key'],['/keys/k_4410/revoke','cx-097','Revoke CI pipeline API key'],
      ['/keys/k_1208/edit','cx-098','Edit Legacy import API key'],['/keys/k_1208/revoke','cx-099','Revoke Legacy import API key'],
    ];
    h=replaceOnce(h,'    <table>','    <p class="action-key">Available actions: '+rows.map(([,id,label])=>`<span id="${id}">${label}</span>`).join('; ')+'.</p>\n\n    <table>','244-12-key');
    for(const [href,id] of rows)h=replaceOnce(h,`href="${href}" aria-label=`, `href="${href}" aria-labelledby="${id}" data-replaced-label=`, '244-12-link-'+id);
    return h;
  }});

add({sc:'2.4.4',aspect:'icon-link-name-present-but-wrong-or-meaningless',id:'case-13',source:'case-05',count:1,
  title:'Arabic PDF icon link named by an external download instruction',selector:'a.pdf-link[aria-labelledby]',
  repair:'Keep the recipe icon and add a visible Arabic PDF-download instruction outside its header, referenced by the link.',
  mechanism:'The computed name identifies downloading the chicken-kabsa recipe PDF; the header-parent extraction omits that external instruction.',
  transform(h){
    h=replaceOnce(h,'<a class="pdf-link" href="/recipes/kabsa.pdf" aria-label="كبسة الدجاج بالخطوات">','<a class="pdf-link" href="/recipes/kabsa.pdf" aria-labelledby="cx-100">','244-13-link');
    return replaceOnce(h,'      <div class="body">','      <p id="cx-100">تحميل وصفة كبسة الدجاج بالخطوات بصيغة PDF</p>\n\n      <div class="body">','244-13-label');
  }});

add({sc:'2.4.4',aspect:'duplicate-name-same-context-different-purpose',id:'case-15',source:'case-01',count:2,
  title:'Bakery order-form links named by remote form headings',selector:'p.lead > a[aria-labelledby]',
  repair:'Keep both order form labels and combine each with its destination form heading.',
  mechanism:'The AX names distinguish celebration-cake and weekly-bread forms; the link-parent extraction omits the remote destination headings.',
  transform(h){
    h=replaceOnce(h,'<a href="#cake-form">order form</a>','<a id="cx-link-101" href="#cake-form" aria-labelledby="cx-link-101 cake-h">order form</a>','244-15-cake');
    return replaceOnce(h,'<a href="#bread-form">order form</a>','<a id="cx-link-102" href="#bread-form" aria-labelledby="cx-link-102 bread-h">order form</a>','244-15-bread');
  }, opaque:[['cake-h','cx-101'],['bread-h','cx-102']]} );

add({sc:'2.4.4',aspect:'duplicate-name-same-context-different-purpose',id:'case-16',source:'case-03',count:2,
  title:'Email links named by an external visible contact directory',selector:'.card p:first-child a[aria-labelledby]',
  repair:'Keep both Email us labels and add a visible contact directory outside their paragraph, referenced by each link.',
  mechanism:'Sales enquiries and production support resolve in AX names, while GenA11y’s paragraph extraction omits the remote directory.',
  transform(h){
    h=replaceOnce(h,'    <div class="card">','    <p class="contact-key">Contact directory: <span id="cx-103">Sales enquiries</span>; <span id="cx-104">Production support</span>.</p>\n\n    <div class="card">','244-16-key');
    h=replaceOnce(h,'<a href="mailto:sales@latchkey.dev?subject=Latchkey%20enquiry">Email us</a>','<a id="cx-link-103" href="mailto:sales@latchkey.dev?subject=Latchkey%20enquiry" aria-labelledby="cx-link-103 cx-103">Email us</a>','244-16-sales');
    return replaceOnce(h,'<a href="mailto:support@latchkey.dev?subject=Production%20issue">Email us</a>','<a id="cx-link-104" href="mailto:support@latchkey.dev?subject=Production%20issue" aria-labelledby="cx-link-104 cx-104">Email us</a>','244-16-support');
  }});

add({sc:'2.4.4',aspect:'duplicate-name-same-context-different-purpose',id:'case-17',source:'case-05',count:2,
  title:'Spanish call links named by external telephone context',selector:'p.acciones a.tel-link[aria-labelledby]',
  repair:'Keep both Llámanos labels and combine them with the visible phone numbers from the preceding service paragraphs.',
  mechanism:'The AX names distinguish the health-centre and emergency numbers, but those referenced numbers sit outside the extracted actions paragraph.',
  transform(h){
    h=replaceOnce(h,'<span class="numero">954 11 22 33</span>','<span class="numero" id="cx-105">Centro de salud 954 11 22 33</span>','244-17-number1');
    h=replaceOnce(h,'<span class="numero">112</span>','<span class="numero" id="cx-106">Urgencias vitales 112</span>','244-17-number2');
    h=replaceOnce(h,'<a class="tel-link" href="tel:+34954112233">Llámanos</a>','<a class="tel-link" id="cx-link-105" href="tel:+34954112233" aria-labelledby="cx-link-105 cx-105">Llámanos</a>','244-17-link1');
    return replaceOnce(h,'<a class="tel-link" href="tel:112">Llámanos</a>','<a class="tel-link" id="cx-link-106" href="tel:112" aria-labelledby="cx-link-106 cx-106">Llámanos</a>','244-17-link2');
  }});

if (specs.length !== 26) throw new Error(`Expected 26 specs, got ${specs.length}`);
if (specs.filter((s) => s.sc === '1.1.1').length !== 10 || specs.filter((s) => s.sc === '2.4.4').length !== 16) {
  throw new Error('Expected 10 image and 16 link fixtures');
}

// Remove only stale records/files created by this generator's own batch. This
// keeps reruns idempotent when a draft fixture is replaced during validation.
const desiredKeys=new Set(specs.map(keyOf));
for(const sc of ['1.1.1','2.4.4']){
  const doc=resultFor(sc);
  for(const aspect of doc.aspectResults){
    const keep=[];
    for(const page of aspect.built?.pages||[]){
      const key=`${sc}::${aspect.aspect}::${page.id}`;
      if(page.balanceBatch===BATCH&&!desiredKeys.has(key)){
        for(const rel of [page.file,page.docFile])if(rel&&fs.existsSync(path.join(ROOT,rel)))fs.unlinkSync(path.join(ROOT,rel));
      }else keep.push(page);
    }
    if(aspect.built)aspect.built.pages=keep;
  }
}

const newRows = [];
for (const spec of specs) {
  const aspect = aspectFor(spec.sc, spec.aspect);
  const sourceRecord = aspect.built.pages.find((page) => page.id === spec.source);
  if (!sourceRecord || sourceRecord.expected !== 'failed') throw new Error(`Bad source ${keyOf(spec)} -> ${spec.source}`);
  const dir = pageDir(spec.sc, spec.aspect);
  const sourceHtml = fs.readFileSync(path.join(dir, `${spec.source}.html`), 'utf8');
  let html = spec.transform(sourceHtml);
  for (const [from,to] of spec.opaque || []) html = html.split(from).join(to);
  html = addPairComment(html, spec.source, spec.repair);
  const htmlFile = path.join(dir, `${spec.id}.html`);
  const mdFile = path.join(dir, `${spec.id}.md`);
  fs.writeFileSync(htmlFile, html);
  fs.writeFileSync(mdFile, `# ${spec.id} — ${spec.title}\n\n## Pair and category\n\nPaired PASS for **${spec.source}**. Batch \`${BATCH}\`; category \`context-extraction\`.\n\n## Exact repair\n\n${spec.repair}\n\n## Primary selector\n\n\`${spec.selector}\`\n\n## Accessibility mechanism\n\n${spec.mechanism}\n\n## GenA11y payload contract\n\nThe exact \`${contract(spec.sc,spec.selector,spec.count).extractor}\` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.\n\n## Expected ACT-style outcome\n\n**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.\n\n## Citation\n\n${citationMd(sourceRecord.citation)}\n`);

  const record = {
    id: spec.id,
    file: path.relative(ROOT, htmlFile),
    docFile: path.relative(ROOT, mdFile),
    scenario: `PAIRED PASS for source ${spec.source}. ${spec.title}.`,
    expected: 'passed',
    mechanism: spec.mechanism,
    primarySelector: spec.selector,
    whyAutomatedToolsMiss: 'GenA11y’s exact per-SC extraction omits the externally referenced text that supplies the complete accessible alternative or purpose.',
    citation: sourceRecord.citation,
    balanceBatch: BATCH,
    hardNegativeType: 'context-extraction',
    pairedWith: spec.source,
    gena11yExtraction: contract(spec.sc, spec.selector, spec.count),
  };
  aspect.built.pages = aspect.built.pages.filter((page) => page.id !== spec.id);
  aspect.built.pages.push(record);
  newRows.push({
    key: keyOf(spec), sc: spec.sc, aspect: spec.aspect, id: spec.id,
    file: record.file, docFile: record.docFile, expected: 'passed',
    type: 'context-extraction', pairedWith: spec.source,
  });
}

for (const [sc, doc] of resultDocs) writeJson(resultPath(sc), doc);

newRows.sort((a,b) => a.sc.localeCompare(b.sc,{numeric:true}) || a.aspect.localeCompare(b.aspect) || a.id.localeCompare(b.id,{numeric:true}));
writeJson(NEW_LIST, newRows);

const original = readJson(ORIGINAL_LIST);
const aggregate = [...original, ...newRows].sort((a,b) => a.sc.localeCompare(b.sc,{numeric:true}) || a.aspect.localeCompare(b.aspect) || a.id.localeCompare(b.id,{numeric:true}));
if (aggregate.length !== 105 || new Set(aggregate.map((row) => row.key)).size !== 105) throw new Error('Aggregate must contain 105 unique cases');
if (aggregate.filter((row) => row.type === 'context-extraction').length !== 50) throw new Error('Aggregate must contain 50 context-extraction cases');
writeJson(AGGREGATE_LIST, aggregate);

console.log(JSON.stringify({
  batch: BATCH,
  newCases: newRows.length,
  newBySc: Object.fromEntries(['1.1.1','2.4.4'].map((sc)=>[sc,newRows.filter((row)=>row.sc===sc).length])),
  aggregateCases: aggregate.length,
  aggregateContextCases: aggregate.filter((row)=>row.type==='context-extraction').length,
}, null, 2));
