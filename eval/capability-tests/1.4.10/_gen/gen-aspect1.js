// Generator for aspect 1: non-excepted-horizontal-overflow-at-320px
// Self-contained static HTML, inline CSS. Runner sets viewport 320x256 and checks
// document/element horizontal overflow (scrollWidth > clientWidth + 2) AND locates a
// non-exempt overflow source. Exempt = MAP/SVG/role=table|grid|treegrid, TABLE with th/caption,
// or any ancestor with overflow-x:auto|scroll.
const fs = require('fs');
const path = require('path');
const DIR = path.resolve(__dirname, '../non-excepted-horizontal-overflow-at-320px');

function page(title, bodyStyle, body, headExtra='') {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  html,body{margin:0;padding:0;font-family:system-ui,Arial,sans-serif;}
  ${bodyStyle}
</style>${headExtra}
</head>
<body>
${body}
</body>
</html>
`;
}

const POS = []; // {style, body, dimension, overflowAtPx, rationale, citation, head?}
const NEG = [];

const CITE_320 = "WCAG 2.2 SC 1.4.10 Understanding: 'Content can be presented without loss of information or functionality, and without requiring scrolling in two dimensions for: Vertical scrolling content at a width equivalent to 320 CSS pixels.' The 320px target is '1280px wide at 400% zoom'.";
const CITE_EXC = "WCAG 2.2 SC 1.4.10: 'Except for parts of the content which require two-dimensional layout for usage or meaning.' Understanding 1.4.10 lists data tables, complex images (maps, diagrams), toolbars, and interfaces with editable content that needs context as the exception.";
const CITE_TT = "Trusted Tester 5.1 Reflow (1.4.10): set the browser to 1280px wide at 400% zoom (≈320 CSS px); content that requires horizontal scrolling to read or operate, and is not within the 2-D exception, fails.";

// ---------------- POSITIVES (real reflow barrier, expected=failed, decide) ----------------
POS.push({
  dimension:'fixed-width-text-block-px',
  overflowAtPx:600,
  style:`.card{width:600px;background:#eef;padding:16px;}`,
  body:`<h1>Account</h1><div class="card"><p>This article column is laid out at a hard 600px width. At a 320 CSS px viewport it runs off the right edge and the reader must scroll horizontally to read each line of body text.</p></div>`,
  rationale:'A 600px fixed-width text container forces document scrollWidth to 600 at a 320px viewport; the overflow source is a paragraph of body text (not exempt), so reading requires horizontal scrolling. Real 1.4.10 barrier.',
  citation:CITE_320,
});
POS.push({
  dimension:'min-width-container',
  overflowAtPx:520,
  style:`.wrap{min-width:520px;background:#efe;padding:12px;}`,
  body:`<div class="wrap"><h2>Newsletter</h2><p>The content wrapper declares min-width:520px so it can never shrink below 520px. At 320px the page scrolls sideways to reveal the right half of every line.</p></div>`,
  rationale:'min-width:520px prevents reflow; the wrapper (containing prose) overflows the 320px viewport. Non-exempt text content requires two-dimensional scrolling.',
  citation:CITE_320,
});
POS.push({
  dimension:'two-column-grid-fixed-cols',
  overflowAtPx:680,
  style:`.grid{display:grid;grid-template-columns:340px 340px;gap:0;}.col{padding:10px;background:#fafafa;}`,
  body:`<div class="grid"><div class="col"><h3>Left</h3><p>A two-column layout with fixed 340px+340px tracks never collapses to one column. At 320px the second column sits entirely off-screen and the first column is also partly clipped.</p></div><div class="col"><h3>Right</h3><p>Right-hand article text is only reachable by scrolling the page horizontally.</p></div></div>`,
  rationale:'grid-template-columns:340px 340px is a non-responsive multi-column layout (~680px). It never reflows to a single column; reaching the right column needs horizontal scroll. Not a data table / toolbar exception.',
  citation:CITE_320,
});
POS.push({
  dimension:'flex-nowrap-row-of-cards',
  overflowAtPx:900,
  style:`.row{display:flex;flex-wrap:nowrap;}.tile{flex:0 0 300px;height:120px;background:#dde;margin-right:6px;}`,
  body:`<h1>Dashboard</h1><div class="row"><div class="tile">Tile 1</div><div class="tile">Tile 2</div><div class="tile">Tile 3</div></div>`,
  rationale:'flex-wrap:nowrap with three flex:0 0 300px tiles produces a ~900px row that cannot wrap. The card row is general page content, not a kept-one-row toolbar, so horizontal scroll to see later tiles is a barrier.',
  citation:CITE_320,
});
POS.push({
  dimension:'absolute-positioned-offscreen-control',
  overflowAtPx:480,
  style:`.stage{position:relative;height:200px;}.cta{position:absolute;left:300px;top:80px;width:160px;background:#2a7;color:#fff;padding:10px;}`,
  body:`<div class="stage"><p>Main copy.</p><a class="cta" href="#buy">Buy now</a></div>`,
  rationale:'An absolutely positioned primary control sits at left:300px width:160px (right edge ~460px), off the 320px viewport. The Buy button can only be reached by scrolling horizontally — operability barrier.',
  citation:CITE_320,
});
POS.push({
  dimension:'wide-fixed-px-prose-panel',
  overflowAtPx:700,
  style:`.note{width:700px;background:#f6f6f6;padding:8px;}`,
  body:`<h2>Release notes</h2><div class="note">This is ordinary release-note prose laid out in a hard 700px-wide panel, so the panel BOX itself extends well past the 320px viewport edge and the reader must scroll horizontally to read each line.</div>`,
  rationale:'A 700px fixed-width prose panel: the element BOX (not just text) crosses the 320px viewport edge, so overflowSourceLocated + anyNonExempt fire and the document scrolls. Readable text (not code/data needing layout) forced into horizontal scroll — a barrier the runner can decide.',
  citation:CITE_320,
});
POS.push({
  dimension:'image-fixed-px-width-decorative-banner',
  overflowAtPx:640,
  style:`.banner{width:640px;height:90px;background:linear-gradient(90deg,#36c,#3c6);color:#fff;display:flex;align-items:center;padding-left:12px;}`,
  body:`<div class="banner">Spring sale — up to 40% off everything</div><p>Body text below.</p>`,
  rationale:'A 640px fixed-width promotional banner (a layout block, not a complex image/diagram requiring 2-D layout) overflows the 320px viewport, forcing horizontal scroll of page chrome.',
  citation:CITE_320,
});
POS.push({
  dimension:'table-layout-no-th-no-caption',
  overflowAtPx:560,
  style:`table.layout{width:560px;}td{border:1px solid #ccc;padding:8px;}`,
  body:`<table class="layout" role="presentation"><tr><td>Brand logo</td><td>Tagline goes here and the layout cells force a fixed 560px table width.</td></tr></table>`,
  rationale:'A layout TABLE (role=presentation, no th/caption) at width:560px is NOT a data table and is not covered by the 2-D data-table exception; it overflows 320px. The runner does not apply the th/caption exemption here, so it is a counted barrier.',
  citation:CITE_EXC,
});
POS.push({
  dimension:'horizontal-scroll-nav-bar-links',
  overflowAtPx:760,
  style:`nav.tabs{white-space:nowrap;}nav.tabs a{display:inline-block;width:120px;text-align:center;padding:10px 0;background:#eee;}`,
  body:`<nav class="tabs"><a href="#a">Overview</a><a href="#b">Pricing</a><a href="#c">Features</a><a href="#d">Support</a><a href="#e">Contact</a><a href="#f">Blog</a></nav><p>Page body.</p>`,
  rationale:'A primary navigation of six 120px inline-block links (~760px) with white-space:nowrap does not wrap or collapse. Navigation links are operable content that must reflow; this is not a toolbar that must remain one row, so horizontal scroll to reach later nav items is a barrier.',
  citation:CITE_320,
});
POS.push({
  dimension:'negative-margin-pulls-content-right',
  overflowAtPx:500,
  style:`.pull{margin-left:200px;width:300px;background:#fee;padding:10px;}`,
  body:`<div class="pull"><p>This block is pushed 200px to the right and is 300px wide, so its right edge lands near 500px and overflows a 320px viewport.</p></div>`,
  rationale:'margin-left:200px on a 300px text block puts content past the 320px viewport edge (right ~500px). Reading the block requires horizontal scroll. Barrier.',
  citation:CITE_320,
});
POS.push({
  dimension:'viewport-width-fixed-vw-units-misused',
  overflowAtPx:null,
  style:`.hero{width:150vw;height:140px;background:#933;color:#fff;padding:10px;box-sizing:border-box;}`,
  body:`<div class="hero"><h2>Welcome</h2><p>This hero uses width:150vw, so it is always 1.5x the viewport and always overflows horizontally regardless of width.</p></div>`,
  rationale:'width:150vw makes the hero 480px at a 320px viewport — always wider than the viewport. Text content overflows; horizontal scroll required. Barrier (overflowAtPx scales with viewport).',
  citation:CITE_320,
});
POS.push({
  dimension:'long-list-of-inline-chips-nowrap',
  overflowAtPx:840,
  style:`.tags{white-space:nowrap;}.chip{display:inline-block;background:#e7e7ff;border-radius:12px;padding:6px 12px;margin:2px;}`,
  body:`<h3>Filter results</h3><div class="tags"><span class="chip">News</span><span class="chip">Sports</span><span class="chip">Weather</span><span class="chip">Finance</span><span class="chip">Travel</span><span class="chip">Health</span></div>`,
  rationale:'A row of filter chips with white-space:nowrap cannot wrap and overflows ~840px. Chips are interactive filter content (not a fixed toolbar), so horizontal scroll to reach later filters is a barrier.',
  citation:CITE_320,
});

// ---------------- NEGATIVES (reflows cleanly, expected=passed, decide) ----------------
NEG.push({
  dimension:'max-width-100pct-prose',
  style:`.card{max-width:100%;background:#eef;padding:16px;box-sizing:border-box;}`,
  body:`<h1>Account</h1><div class="card"><p>This article column uses max-width:100% and box-sizing:border-box, so it shrinks to the viewport and the prose wraps. No horizontal scroll at 320px.</p></div>`,
  rationale:'max-width:100% lets the text container shrink to 320px; prose wraps; document scrollWidth equals clientWidth. No overflow source — clean reflow.',
  citation:CITE_320,
});
NEG.push({
  dimension:'responsive-grid-autofit',
  style:`.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;}.col{padding:10px;background:#fafafa;}`,
  body:`<div class="grid"><div class="col"><h3>Left</h3><p>auto-fit minmax collapses to one column when the viewport is narrow.</p></div><div class="col"><h3>Right</h3><p>Reflows under 320px to a single column with no horizontal scroll.</p></div></div>`,
  rationale:'grid auto-fit minmax(140px,1fr) collapses to one column at 320px; both columns stack vertically. No horizontal overflow.',
  citation:CITE_320,
});
NEG.push({
  dimension:'flex-wrap-cards',
  style:`.row{display:flex;flex-wrap:wrap;gap:6px;}.tile{flex:1 1 140px;height:120px;background:#dde;}`,
  body:`<h1>Dashboard</h1><div class="row"><div class="tile">Tile 1</div><div class="tile">Tile 2</div><div class="tile">Tile 3</div></div>`,
  rationale:'flex-wrap:wrap with flex:1 1 140px lets tiles wrap onto multiple rows at 320px. No horizontal scroll.',
  citation:CITE_320,
});
NEG.push({
  dimension:'fluid-image-maxwidth',
  style:`img{max-width:100%;height:auto;display:block;}`,
  body:`<h2>Gallery</h2><svg width="900" height="200" viewBox="0 0 900 200" style="max-width:100%;height:auto" role="img" aria-label="placeholder"><rect width="900" height="200" fill="#9cf"/></svg><p>Caption.</p>`,
  rationale:'An intrinsically 900px graphic is constrained with max-width:100%/height:auto and scales down to 320px. No overflow.',
  citation:CITE_320,
});
NEG.push({
  dimension:'percent-width-two-up-then-stack',
  style:`@media(max-width:480px){.col{width:100%!important;}}.col{width:50%;float:left;box-sizing:border-box;padding:8px;}`,
  body:`<div class="col"><p>Two columns at desktop.</p></div><div class="col"><p>Stack to full width under 480px via a media query, so at 320px there is one column and no sideways scroll.</p></div><div style="clear:both"></div>`,
  rationale:'A max-width:480px media query forces both 50% columns to 100% width and stacks them at 320px. Clean reflow, no overflow.',
  citation:CITE_320,
});
NEG.push({
  dimension:'wrapping-nav-flexwrap',
  style:`nav.tabs{display:flex;flex-wrap:wrap;}nav.tabs a{padding:10px 14px;background:#eee;}`,
  body:`<nav class="tabs"><a href="#a">Overview</a><a href="#b">Pricing</a><a href="#c">Features</a><a href="#d">Support</a><a href="#e">Contact</a><a href="#f">Blog</a></nav><p>Page body.</p>`,
  rationale:'Navigation links in a flex-wrap container wrap onto multiple lines at 320px. No horizontal overflow.',
  citation:CITE_320,
});
NEG.push({
  dimension:'normal-flow-prose-only',
  style:`p{margin:0 0 12px;}`,
  body:`<h1>Privacy policy</h1><p>This page is ordinary block-flow prose with no fixed widths. Paragraphs wrap to the viewport at any width including 320px, so there is no two-dimensional scrolling.</p><p>Second paragraph also wraps.</p>`,
  rationale:'Plain block-flow text with no fixed widths wraps to the viewport. scrollWidth equals clientWidth at 320px.',
  citation:CITE_320,
});
NEG.push({
  dimension:'overflow-wrap-long-word',
  style:`p{overflow-wrap:anywhere;}`,
  body:`<p>A normally long descriptive sentence followed by averylongunbrokenwordthatwouldotherwiseoverflowbutoverflowwrapanywhereletsitbreak across lines so nothing overflows.</p>`,
  rationale:'overflow-wrap:anywhere breaks the long token so the paragraph wraps within 320px. No overflow.',
  citation:"WCAG 2.2 Technique C38/C33 (Using media queries / em units; allowing line breaks). overflow-wrap:anywhere lets long strings wrap so content reflows.",
});
NEG.push({
  dimension:'sticky-thin-bar-no-overflow',
  style:`.bar{position:sticky;top:0;height:40px;background:#222;color:#fff;display:flex;align-items:center;padding-left:10px;}`,
  body:`<div class="bar">Site name</div><p>A thin 40px sticky header is full-width (no fixed px width) and does not cause horizontal overflow. The body prose wraps normally at 320px.</p>`,
  rationale:'A full-width sticky bar with no fixed pixel width does not overflow horizontally; the page reflows cleanly. No 1.4.10 barrier.',
  citation:CITE_320,
});
NEG.push({
  dimension:'vertical-growth-only',
  style:`.box{background:#efe;padding:12px;}`,
  body:`<div class="box"><p>This page only grows taller as content is added. Vertical scrolling is permitted by 1.4.10; there is never horizontal overflow at 320px.</p><p>More content makes the page taller, not wider.</p></div>`,
  rationale:'Page grows only vertically; vertical scroll is explicitly allowed by 1.4.10. No horizontal overflow source.',
  citation:"WCAG 2.2 SC 1.4.10 Understanding: vertical scrolling content is permitted; only scrolling in two dimensions is disallowed.",
});
NEG.push({
  dimension:'em-based-widths',
  style:`.col{max-width:30em;margin:0 auto;}`,
  body:`<div class="col"><h2>Readable measure</h2><p>Using a max-width in em units keeps the measure comfortable on wide screens but still collapses to the viewport at 320px. No horizontal scroll.</p></div>`,
  rationale:'max-width:30em with em units (C38) shrinks with the viewport; at 320px the column is viewport-bound and prose wraps. No overflow.',
  citation:"WCAG 2.2 Technique C38: Using em units for text container sizes so layout adapts. No horizontal scroll at 320px.",
});
NEG.push({
  dimension:'box-sizing-borderbox-padding',
  style:`.pad{width:100%;padding:20px;box-sizing:border-box;background:#fff7e6;}`,
  body:`<div class="pad"><p>width:100% combined with box-sizing:border-box keeps padding inside the 320px viewport, so this padded block does not push past the right edge.</p></div>`,
  rationale:'box-sizing:border-box makes width:100% include the 20px padding, so the block stays within 320px. No overflow (guards against the classic padding-overflow false positive).',
  citation:CITE_320,
});

function writeAll(list, polarity, startIdx, labels) {
  list.forEach((c, i) => {
    const n = String(startIdx + i).padStart(2,'0');
    const file = `case-${n}.html`;
    const expected = polarity==='positive' ? 'failed' : 'passed';
    const title = `1.4.10 ${polarity} (${c.dimension})`;
    fs.writeFileSync(path.join(DIR,file), page(title, c.style, c.body, c.head||''));
    labels.push({
      file, expected, polarity,
      aspect:'non-excepted-horizontal-overflow-at-320px',
      dimension:c.dimension,
      runnerShould:'decide',
      overflowAtPx: c.overflowAtPx===undefined ? (polarity==='positive'?null:null) : c.overflowAtPx,
      exception:null,
      rationale:c.rationale,
      citation:c.citation,
    });
  });
}

const labels = [];
writeAll(POS,'positive',1,labels);
writeAll(NEG,'negative',POS.length+1,labels);
// negatives have overflowAtPx null
labels.forEach(l=>{ if(l.polarity==='negative') l.overflowAtPx=null; });
fs.writeFileSync(path.join(DIR,'labels.json'), JSON.stringify(labels,null,2));
console.log(`aspect1: ${POS.length} pos, ${NEG.length} neg, ${labels.length} total`);
