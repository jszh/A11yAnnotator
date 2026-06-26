// Generator for aspect 2: f102-content-disappears-no-equivalent (Failure F102).
// At 320px, content that was present at desktop width DISAPPEARS / is cut off with no
// equivalent way to access it. Detecting this needs a WIDE (1280) vs 320 diff.
//
// Runner-capability mapping (single-viewport 320 probe):
//   - DISAPPEAR via display:none/visibility:hidden under a max-width media query
//       => NO overflow at 320, content simply gone. The 320-only probe CANNOT see what
//          was lost => runnerShould:"abstain" (needs the wide-vs-320 diff / LLM).
//   - CLIP via overflow:hidden|clip with a wider-than-parent child
//       => clipHidingDetected fires at 320 => runnerShould:"decide".
//   - NEGATIVE: responsive-hide WITH an accessible equivalent (hamburger menu, "show more",
//          the same data in a stacked card) => content not lost => not a failure; the wide-vs-320
//          diff shows a swap, not a loss => runnerShould:"abstain" (needs semantic equivalence check).
const fs=require('fs'),path=require('path');
const DIR=path.resolve(__dirname,'../f102-content-disappears-no-equivalent');
function page(title,style,body){return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  html,body{margin:0;padding:0;font-family:system-ui,Arial,sans-serif;}
  ${style}
</style>
</head>
<body>
${body}
</body>
</html>
`;}
const CITE_F102="WCAG 2.2 Failure F102: 'Failure of Success Criterion 1.4.10 Reflow due to content disappearing and not being available' — content available at the wider width is removed at the narrow (320px) width with no other way to obtain it.";
const CITE_320="WCAG 2.2 SC 1.4.10: content must be presented 'without loss of information or functionality' at 320 CSS px.";

const POS=[],NEG=[];

// ---- POSITIVE, DISAPPEAR via display:none, no equivalent => abstain (needs wide-vs-320 diff) ----
POS.push({mode:'abstain',dimension:'displaynone-secondary-column-no-equivalent',
 style:`@media(max-width:480px){.aside{display:none!important;}}.aside{background:#fee;padding:10px;}`,
 body:`<main><h1>Article</h1><p>Body.</p></main><aside class="aside"><h2>Related downloads</h2><ul><li><a href="/spec.pdf">Specification (PDF)</a></li><li><a href="/data.csv">Raw data (CSV)</a></li></ul></aside>`,
 rationale:'At wide width an aside offers download links; under max-width:480px it is display:none with no replacement, so at 320px those links are simply gone — F102 loss of information. No overflow at 320, so detection requires a wide-vs-320 diff the single-viewport probe lacks.',
 citation:CITE_F102});
POS.push({mode:'abstain',dimension:'displaynone-help-text-no-equivalent',
 style:`@media(max-width:520px){.help{display:none;}}.help{color:#444;font-size:14px;}`,
 body:`<form><label>Card number <input></label><p class="help">Enter the 16-digit number on the front of your card; we accept Visa and Mastercard.</p><button>Pay</button></form>`,
 rationale:'Field help text present on desktop is display:none below 520px; at 320px the user loses guidance with no equivalent (no title, no aria-describedby alternative). F102 loss of information. Invisible to a 320-only overflow probe.',
 citation:CITE_F102});
POS.push({mode:'abstain',dimension:'displaynone-table-column-data-lost',
 style:`@media(max-width:480px){.c-notes{display:none;}}td,th{border:1px solid #ccc;padding:6px;}`,
 body:`<table><caption>Orders</caption><thead><tr><th>ID</th><th>Total</th><th class="c-notes">Notes</th></tr></thead><tbody><tr><td>1</td><td>$10</td><td class="c-notes">Gift wrap requested</td></tr></tbody></table>`,
 rationale:'A whole data-table column (Notes) is display:none below 480px; the gift-wrap note is unrecoverable at 320px. Data loss, not a 2-D scroll choice. F102. The 320-only probe sees a valid narrow table, not the lost column.',
 citation:CITE_F102});
POS.push({mode:'abstain',dimension:'displaynone-primary-cta-no-equivalent',
 style:`@media(max-width:500px){.cta{display:none;}}.cta{background:#2a7;color:#fff;padding:10px 18px;border:0;}`,
 body:`<h1>Upgrade</h1><p>Pro features.</p><button class="cta">Start free trial</button>`,
 rationale:'The only call-to-action (Start free trial) is display:none under 500px, with no replacement control anywhere — functionality is lost at 320px. F102. No overflow signal.',
 citation:CITE_F102});
POS.push({mode:'abstain',dimension:'visibilityhidden-coupon-no-equivalent',
 style:`@media(max-width:480px){.coupon{visibility:hidden;}}.coupon{background:#ffd;padding:8px;}`,
 body:`<p>Cart summary.</p><div class="coupon">Use code SAVE20 for 20% off today only.</div>`,
 rationale:'A coupon code is visibility:hidden below 480px (still occupies space but is unreadable) with no equivalent disclosure; the SAVE20 code is lost at 320px. F102. No horizontal overflow.',
 citation:CITE_F102});
POS.push({mode:'abstain',dimension:'displaynone-nav-links-no-menu',
 style:`@media(max-width:600px){.mainnav{display:none;}}`,
 body:`<nav class="mainnav"><a href="/pricing">Pricing</a> · <a href="/docs">Docs</a> · <a href="/support">Support</a></nav><main><h1>Home</h1></main>`,
 rationale:'The primary nav is display:none below 600px and NO hamburger/menu replaces it — navigation links vanish at 320px with no equivalent. F102 (contrast with the negative that provides an accessible menu).',
 citation:CITE_F102});
POS.push({mode:'abstain',dimension:'displaynone-figure-caption-meaning-lost',
 style:`@media(max-width:520px){figcaption{display:none;}}img{max-width:100%;}`,
 body:`<figure><svg width="100%" height="120" viewBox="0 0 300 120" role="img" aria-label="chart"><rect width="300" height="120" fill="#9cf"/></svg><figcaption>Figure 3: revenue doubled after the Q2 launch.</figcaption></figure>`,
 rationale:'The figcaption that explains the chart is display:none below 520px; the data point (revenue doubled) is lost at 320px with no equivalent. F102 loss of information.',
 citation:CITE_F102});

// ---- POSITIVE, CLIP via overflow:hidden (clipHidingDetected) => decide ----
POS.push({mode:'decide',dimension:'overflowhidden-clips-wide-text',
 style:`.clip{overflow-x:hidden;width:100%;}.inner{width:560px;background:#eef;padding:10px;}`,
 body:`<div class="clip"><div class="inner"><p>This 560px inner block is clipped by an overflow-x:hidden parent at 320px, so the right portion of every sentence is cut off and unreadable with no scrollbar to reveal it.</p></div></div>`,
 rationale:'A 560px child inside overflow-x:hidden is clipped at 320px: scrollWidth > clientWidth on the clip wrapper with no scroll affordance — text is silently cut off (F102-style loss). clipHidingDetected fires, so the runner can DECIDE a barrier from the 320 render alone.',
 citation:CITE_F102});
POS.push({mode:'decide',dimension:'overflowhidden-clips-action-buttons',
 style:`.toolbar{overflow:hidden;width:100%;white-space:nowrap;}.toolbar button{width:130px;}`,
 body:`<div class="toolbar"><button>Save</button><button>Share</button><button>Delete</button><button>Archive</button></div>`,
 rationale:'A 100%-wide overflow:hidden bar contains ~520px of nowrap buttons; later buttons (Delete/Archive) are clipped off-screen with no scroll — functionality lost at 320px. clipHidingDetected fires; runner can decide.',
 citation:CITE_F102});
POS.push({mode:'decide',dimension:'overflowclip-cuts-form-fields',
 style:`.panel{overflow:clip;width:100%;}.formrow{display:flex;width:600px;gap:8px;}.formrow input{flex:0 0 280px;}`,
 body:`<div class="panel"><div class="formrow"><input placeholder="First name"><input placeholder="Last name"></div></div>`,
 rationale:'A 600px form row inside overflow:clip is cut at 320px — the Last name field is clipped away with no scroll. clipHidingDetected fires; the runner can decide a barrier at 320.',
 citation:CITE_F102});
POS.push({mode:'abstain',dimension:'fixedheight-overflowhidden-vertical-clip-text',
 style:`.box{height:60px;overflow:hidden;width:300px;}`,
 body:`<div class="box"><p>This container has a fixed 60px height and overflow:hidden, so the second and third paragraphs of important policy text are clipped below the fold with no way to scroll them into view.</p><p>Hidden line two.</p><p>Hidden line three.</p></div>`,
 rationale:'Important policy text is clipped by a fixed 60px-height overflow:hidden box with no scroll — F102 loss of information. BUT the box is 300px (fits 320px horizontally) and the clip is VERTICAL, so the runner clipHidingDetected check (which compares horizontal scrollWidth>clientWidth) does NOT fire. The single-axis probe is blind to this vertical clip ⇒ runner must abstain to the vision/LLM lane.',
 citation:CITE_F102});

// ---------------- NEGATIVES ----------------
// responsive-hide WITH accessible equivalent => abstain (needs equivalence judgment)
NEG.push({mode:'abstain',dimension:'nav-collapses-to-accessible-hamburger',
 style:`.menu-toggle{display:none;background:#222;color:#fff;border:0;padding:8px 12px;}@media(max-width:600px){.mainnav{display:none;}.menu-toggle{display:inline-block;}}`,
 body:`<button class="menu-toggle" aria-haspopup="true" aria-controls="m" aria-label="Open menu">&#9776; Menu</button><nav class="mainnav" id="m"><a href="/pricing">Pricing</a> · <a href="/docs">Docs</a> · <a href="/support">Support</a></nav><main><h1>Home</h1></main>`,
 rationale:'The desktop nav is display:none below 600px BUT an accessible hamburger (aria-haspopup, aria-controls, labeled) reveals the same links — content is reflowed, not lost. NOT F102. Distinguishing this from a true loss needs a semantic equivalence check, so the 320-only probe should abstain.',
 citation:CITE_320});
NEG.push({mode:'abstain',dimension:'table-to-stacked-cards-same-data',
 style:`.cards{display:none;}td,th{border:1px solid #ccc;padding:6px;}@media(max-width:480px){table{display:none;}.cards{display:block;}}`,
 body:`<table><caption>Orders</caption><tr><th>ID</th><th>Total</th></tr><tr><td>1</td><td>$10</td></tr></table><div class="cards"><div><strong>ID:</strong> 1 — <strong>Total:</strong> $10</div></div>`,
 rationale:'Below 480px the table is hidden and a stacked card view presents the SAME data (ID 1, $10). No information lost — a presentation swap, not F102. Needs equivalence judgment ⇒ abstain.',
 citation:CITE_320});
NEG.push({mode:'abstain',dimension:'progressive-disclosure-show-more',
 style:`.more{display:none;}@media(max-width:520px){.long{display:none;}.more{display:inline;}}`,
 body:`<p>Summary of the policy. <span class="long">Full legal detail continues here for several sentences.</span> <a class="more" href="/policy/full">Read full policy</a></p>`,
 rationale:'Below 520px the long inline text is hidden but a "Read full policy" link provides an equivalent path to the same content. Not a loss; equivalent provided. Abstain (equivalence check needed).',
 citation:CITE_320});
NEG.push({mode:'abstain',dimension:'decorative-only-hidden-no-loss',
 style:`@media(max-width:480px){.decor{display:none;}}.decor{height:80px;background:linear-gradient(90deg,#36c,#3c6);}`,
 body:`<div class="decor" aria-hidden="true"></div><h1>Welcome</h1><p>The hidden element is a purely decorative gradient banner (aria-hidden). Removing it at 320px loses no information.</p>`,
 rationale:'The element hidden below 480px is decorative (aria-hidden, empty gradient). No information or function is lost — not F102. Abstain because deciding "decorative vs meaningful" is semantic.',
 citation:CITE_320});
NEG.push({mode:'abstain',dimension:'duplicate-desktop-mobile-blocks',
 style:`.mobile{display:none;}@media(max-width:600px){.desktop{display:none;}.mobile{display:block;}}`,
 body:`<div class="desktop"><h2>Contact</h2><p>Call 555-0100 or email us@example.com.</p></div><div class="mobile"><h2>Contact</h2><p>Call 555-0100 or email us@example.com.</p></div>`,
 rationale:'A desktop block is hidden below 600px but a mobile block carries the identical contact info. Content preserved — not F102. Abstain (equivalence).',
 citation:CITE_320});
// clean reflow, no hiding at all => decide(pass)
NEG.push({mode:'decide',dimension:'no-hiding-fluid-everything-visible',
 style:`.col{max-width:100%;}`,
 body:`<div class="col"><h1>Report</h1><p>Nothing is hidden at any width; all content reflows fluidly and remains visible at 320px. No element is display:none under any media query.</p></div>`,
 rationale:'No content is removed at narrow widths; everything wraps and stays visible at 320px. No clipping, no display:none. Clean — the runner can decide there is no loss/overflow.',
 citation:CITE_320});
NEG.push({mode:'decide',dimension:'overflowhidden-but-child-fits',
 style:`.clip{overflow:hidden;width:100%;}.inner{max-width:100%;background:#eef;padding:8px;}`,
 body:`<div class="clip"><div class="inner"><p>This block has overflow:hidden on the wrapper but the inner content is max-width:100%, so nothing is actually clipped at 320px (scrollWidth equals clientWidth).</p></div></div>`,
 rationale:'overflow:hidden is present but the child fits (max-width:100%), so scrollWidth equals clientWidth — clipHidingDetected does NOT fire. No loss. Guards against treating every overflow:hidden as F102. Runner can decide clean.',
 citation:CITE_320});
NEG.push({mode:'decide',dimension:'content-reordered-not-removed',
 style:`@media(max-width:600px){.wrap{display:flex;flex-direction:column;}}`,
 body:`<div class="wrap"><aside><h2>Filters</h2><p>All filters remain present.</p></aside><main><h1>Results</h1><p>Both sections are visible at 320px; the layout only changes order, nothing is hidden.</p></main></div>`,
 rationale:'A media query only changes flex-direction (reorders) at narrow widths; no element is hidden or clipped. All content stays available at 320px. Clean — runner can decide no loss.',
 citation:CITE_320});
NEG.push({mode:'decide',dimension:'truncation-with-title-attr-equivalent',
 style:`.name{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}`,
 body:`<p class="name" title="Alexandra Bartholomew-Featherstonehaugh">Alexandra Bartholomew-Featherstonehaugh</p>`,
 rationale:'A single-line label is ellipsis-truncated but the full value is preserved in the title attribute (and is a 1-line label, not body content) — an equivalent exists. Not an F102 loss of information. (Width fits 320, so no clip signal; clean.)',
 citation:"WCAG 2.2 SC 1.4.10: loss is avoided when an equivalent (here the title attribute) provides the full content."});
NEG.push({mode:'abstain',dimension:'collapsed-accordion-content-reachable',
 style:`details{margin:8px 0;}`,
 body:`<details><summary>Shipping details</summary><p>Ships in 3-5 business days to all regions.</p></details><p>The accordion is collapsed by default at every width; the content is reachable by activating the disclosure, not removed.</p>`,
 rationale:'A native details/summary disclosure hides content by default but it is fully reachable by activation at any width — not removed by a width media query, not F102. Abstain because the runner must reason that collapsed≠lost.',
 citation:CITE_320});
NEG.push({mode:'abstain',dimension:'icon-label-swap-text-to-aria',
 style:`@media(max-width:520px){.txt{display:none;}}`,
 body:`<button aria-label="Search"><span aria-hidden="true">🔍</span><span class="txt"> Search</span></button>`,
 rationale:'Below 520px the visible word "Search" is hidden but the button keeps aria-label="Search" and the icon — the accessible name is preserved. Equivalent retained, not F102. Abstain (equivalence judgment).',
 citation:CITE_320});

function writeAll(list,polarity,start,labels){
  list.forEach((c,i)=>{
    const n=String(start+i).padStart(2,'0');const file=`case-${n}.html`;
    const expected=polarity==='positive'?'failed':'passed';
    fs.writeFileSync(path.join(DIR,file),page(`1.4.10 F102 ${polarity} (${c.dimension})`,c.style,c.body));
    labels.push({file,expected,polarity,
      aspect:'f102-content-disappears-no-equivalent',
      dimension:c.dimension,
      runnerShould:c.mode,
      overflowAtPx:null,
      exception:null,
      rationale:c.rationale,citation:c.citation});
  });
}
const labels=[];
writeAll(POS,'positive',1,labels);
writeAll(NEG,'negative',POS.length+1,labels);
fs.writeFileSync(path.join(DIR,'labels.json'),JSON.stringify(labels,null,2));
const ab=labels.filter(l=>l.runnerShould==='abstain').length;
console.log(`aspect2: ${POS.length} pos, ${NEG.length} neg, ${labels.length} total, ${ab} abstain`);
