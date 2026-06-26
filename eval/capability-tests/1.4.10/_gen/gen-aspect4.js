// Generator for aspect 4: sticky-fixed-content-consumes-small-viewport
// A position:sticky/fixed header/footer/banner consumes so much of the small viewport that content
// is crowded out / not usable. The reflow target viewport is 320 CSS px wide; at 400% zoom the
// usable height is small (the runner uses 320x256). When fixed chrome eats most of 256px, the
// scrollable content region is unusable.
//
// Runner-capability mapping (HORIZONTAL-overflow probe at 320x256):
//   - Vertical viewport consumption alone produces NO horizontal scrollWidth change, so the
//     single-axis overflow probe CANNOT measure "fixed bar eats N% of the height" =>
//     runnerShould:"abstain" (needs vision / a height-budget check the LLM owns).
//   - A sticky/fixed bar that ALSO has a fixed px width wider than 320 => horizontal overflow fires
//     => runnerShould:"decide".
//   - NEGATIVE thin bars: no overflow and small height budget => the runner sees a clean page; it
//     decides no horizontal barrier (the "no crowding" judgment is still semantic, so several are
//     abstain to mirror the positive abstains).
const fs=require('fs'),path=require('path');
const DIR=path.resolve(__dirname,'../sticky-fixed-content-consumes-small-viewport');
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
const CITE_320="WCAG 2.2 SC 1.4.10 Understanding: content must be usable at a viewport equivalent to 320 CSS px (1280px @ 400% zoom); at 400% the available height is small, so fixed regions that consume most of it can crowd out content.";
const CITE_LOSS="WCAG 2.2 SC 1.4.10: 'without loss of information or functionality' — if fixed chrome leaves too little room to read or operate the content, the reflowed page is not usable.";
const CITE_EN="EN 301 549 / Trusted Tester reflow procedure: at 400% zoom (≈320 CSS px) verify that persistent toolbars/headers/footers do not obscure or crowd out content so that information or functionality is lost.";

const POS=[],NEG=[];
const FILLER=`<h1>Account settings</h1><p>Paragraph one of the main content that the user needs to read and the form below that they must operate.</p><p>Paragraph two adds more body copy so the page is taller than the viewport.</p><label>Email <input></label><button>Save</button><p>Footer note.</p>`;

// ---- POSITIVES: fixed/sticky consumes most of the 256px height => abstain ----
POS.push({mode:'abstain',dimension:'fixed-header-200px-of-256',
 style:`.hdr{position:fixed;top:0;left:0;right:0;height:200px;background:#1b3a5c;color:#fff;padding:8px;box-sizing:border-box;}main{margin-top:200px;}`,
 body:`<div class="hdr"><h2>Mega header</h2><p>This fixed header is 200px tall — out of a ~256px viewport at 400% zoom it leaves under 60px for content.</p></div><main>${FILLER}</main>`,
 rationale:'A 200px fixed header out of ~256px usable height leaves <60px for content, crowding the page so it is effectively unusable at 320px reflow. This is vertical consumption: the horizontal-overflow probe cannot measure it, so the runner must abstain and hand it to the vision/LLM lane.',
 citation:CITE_LOSS});
POS.push({mode:'abstain',dimension:'sticky-header-plus-footer-sandwich',
 style:`.hdr{position:sticky;top:0;height:110px;background:#234;color:#fff;}.ftr{position:fixed;bottom:0;left:0;right:0;height:100px;background:#234;color:#fff;}main{padding-bottom:100px;}`,
 body:`<div class="hdr">Sticky header 110px</div><main>${FILLER}</main><div class="ftr">Fixed footer 100px</div>`,
 rationale:'A 110px sticky header plus a 100px fixed footer consume ~210px of a ~256px viewport, leaving ~46px for content — a sandwich that crowds out the readable region. Vertical consumption, invisible to the horizontal probe ⇒ abstain.',
 citation:CITE_LOSS});
POS.push({mode:'abstain',dimension:'fixed-cookie-banner-tall',
 style:`.cookie{position:fixed;bottom:0;left:0;right:0;height:170px;background:#222;color:#fff;padding:10px;box-sizing:border-box;}`,
 body:`<main>${FILLER}</main><div class="cookie"><p>We use cookies. This consent banner is fixed and 170px tall, covering most of the lower viewport at 320px reflow.</p><button>Accept</button><button>Reject</button></div>`,
 rationale:'A 170px fixed cookie banner covers the majority of a ~256px viewport, obscuring content and the form below. Functionality/information is crowded out. Height-budget failure the horizontal probe cannot see ⇒ abstain.',
 citation:CITE_LOSS});
POS.push({mode:'abstain',dimension:'sticky-toolbar-stacks-to-tall',
 style:`.tb{position:sticky;top:0;background:#eee;}.tb .row{display:block;padding:14px;border-bottom:1px solid #ccc;}`,
 body:`<div class="tb"><div class="row">Formatting controls</div><div class="row">Insert controls</div><div class="row">Review controls</div></div><main>${FILLER}</main>`,
 rationale:'A sticky toolbar whose rows stack at 320px becomes ~135px tall, consuming over half the viewport and crowding the editor content. The persistent chrome leaves too little room. Vertical ⇒ abstain.',
 citation:CITE_320});
POS.push({mode:'abstain',dimension:'fixed-promo-bar-plus-nav',
 style:`.promo{position:fixed;top:0;left:0;right:0;height:60px;background:#c30;color:#fff;}.nav{position:fixed;top:60px;left:0;right:0;height:120px;background:#345;color:#fff;}main{margin-top:180px;}`,
 body:`<div class="promo">Limited-time offer banner (60px)</div><nav class="nav">Expanded navigation (120px)</nav><main>${FILLER}</main>`,
 rationale:'A stacked fixed promo (60px) and nav (120px) total 180px of fixed chrome, leaving ~76px of a 256px viewport for content. The page is crowded to near-unusable. Vertical budget failure ⇒ abstain.',
 citation:CITE_LOSS});
POS.push({mode:'abstain',dimension:'fixed-chat-widget-large',
 style:`.chat{position:fixed;bottom:0;right:0;width:260px;height:220px;background:#fff;border:2px solid #345;box-shadow:0 0 8px #0006;padding:8px;box-sizing:border-box;}`,
 body:`<main>${FILLER}</main><div class="chat"><strong>Live chat</strong><p>This fixed chat widget is 220px tall and 260px wide, covering most of the small viewport and overlapping the Save button.</p></div>`,
 rationale:'A 220px-tall fixed chat widget covers most of a 256px viewport and overlaps the form controls, blocking functionality. The horizontal probe (260px<320) sees no overflow, so it must abstain on this occlusion/crowding case.',
 citation:CITE_LOSS});
POS.push({mode:'abstain',dimension:'sticky-header-50vh',
 style:`.hdr{position:sticky;top:0;height:50vh;min-height:128px;background:#1b3a5c;color:#fff;}`,
 body:`<div class="hdr">Header sized 50vh</div><main>${FILLER}</main>`,
 rationale:'A header sized 50vh always consumes half the viewport height at any zoom; at 320px/256 that is ~128px, leaving half for content and pushing the form down. Vertical consumption ⇒ abstain.',
 citation:CITE_320});
POS.push({mode:'abstain',dimension:'fixed-footer-action-bar-tall',
 style:`.actions{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:2px solid #345;}.actions button{display:block;width:100%;padding:16px;border:0;border-bottom:1px solid #ddd;}main{padding-bottom:160px;}`,
 body:`<main>${FILLER}</main><div class="actions"><button>Add to cart</button><button>Buy now</button><button>Save for later</button></div>`,
 rationale:'A fixed bottom action bar whose three buttons stack vertically is ~160px tall, covering most of the lower viewport and the content above it at 320px. Persistent chrome crowds out content ⇒ abstain (vertical, not horizontal).',
 citation:CITE_LOSS});

// ---- POSITIVES where a fixed/sticky bar is wider than the viewport ----
// position:FIXED is out of flow and does NOT grow the document scrollWidth, so a fixed bar wider than
// 320px crosses the viewport edge (overflowSourceLocated=true) but horizontalScrollPresent stays false
// => the runner's barrier rule (which requires horizontalScrollPresent) does NOT fire => abstain.
// A position:STICKY element DOES participate in flow and grows scrollWidth => the runner can decide.
POS.push({mode:'abstain',dimension:'fixed-bar-fixed-px-width-no-doc-scroll',
 style:`.bar{position:fixed;top:0;left:0;height:48px;width:480px;background:#345;color:#fff;line-height:48px;padding-left:10px;}main{margin-top:48px;}`,
 body:`<div class="bar">Toolbar fixed at width:480px — wider than the 320px viewport, its right half off-screen</div><main>${FILLER}</main>`,
 rationale:'A fixed bar declared width:480px has its right half off the 320px viewport — its controls are unreachable, a real barrier. BUT position:fixed is out of flow and does not grow document scrollWidth, so horizontalScrollPresent stays false and the runner barrier rule (which requires it) cannot fire. The single-axis probe is blind to fixed-element horizontal overflow ⇒ abstain to the vision/LLM lane.',
 citation:CITE_320});
POS.push({mode:'decide',dimension:'sticky-header-min-width-overflows',
 style:`.hdr{position:sticky;top:0;min-width:420px;height:80px;background:#234;color:#fff;}`,
 body:`<div class="hdr">Sticky header with min-width:420px (never narrower than 420px)</div><main>${FILLER}</main>`,
 rationale:'min-width:420px on the sticky header forces the document scrollWidth to 420 at a 320px viewport — horizontal overflow with a non-exempt source. Runner decides a barrier.',
 citation:CITE_320});
POS.push({mode:'abstain',dimension:'fixed-footer-nowrap-buttons-offscreen',
 style:`.ftr{position:fixed;bottom:0;left:0;height:50px;white-space:nowrap;background:#fff;border-top:1px solid #ccc;}.ftr button{width:130px;height:40px;}`,
 body:`<main>${FILLER}</main><div class="ftr"><button>Back</button><button>Next</button><button>Cancel</button><button>Finish</button></div>`,
 rationale:'A fixed footer with four 130px nowrap buttons (~520px) pushes Cancel/Finish off the right edge — those controls are unreachable, a real barrier. BUT position:fixed does not grow document scrollWidth, so horizontalScrollPresent stays false and the runner barrier rule cannot fire. The probe is blind to fixed-element overflow ⇒ abstain.',
 citation:CITE_320});

// ---------------- NEGATIVES: thin / well-behaved sticky-fixed chrome ----------------
NEG.push({mode:'decide',dimension:'thin-sticky-bar-40px-fullwidth',
 style:`.bar{position:sticky;top:0;height:40px;background:#222;color:#fff;line-height:40px;padding-left:10px;}`,
 body:`<div class="bar">Site name</div><main>${FILLER}</main>`,
 rationale:'A 40px full-width sticky bar (no fixed px width) leaves ~216px of a 256px viewport for content and causes no horizontal overflow. Thin chrome, content remains usable — no barrier; runner decides clean (no horizontal overflow source).',
 citation:CITE_320});
NEG.push({mode:'decide',dimension:'thin-fixed-footer-44px',
 style:`.ftr{position:fixed;bottom:0;left:0;right:0;height:44px;background:#fff;border-top:1px solid #ccc;}main{padding-bottom:44px;}`,
 body:`<main>${FILLER}</main><div class="ftr">Privacy · Terms</div>`,
 rationale:'A 44px fixed footer (full width, no px width) consumes a small slice of the viewport and does not overflow horizontally. Content still has ~210px. No barrier — clean.',
 citation:CITE_320});
NEG.push({mode:'decide',dimension:'sticky-header-fluid-width-48px',
 style:`.hdr{position:sticky;top:0;height:48px;width:100%;background:#1b3a5c;color:#fff;display:flex;align-items:center;padding:0 10px;box-sizing:border-box;}`,
 body:`<div class="hdr">Logo · Menu</div><main>${FILLER}</main>`,
 rationale:'A 48px width:100% sticky header with box-sizing:border-box fits the viewport and leaves ample room. No horizontal overflow, modest height budget. Clean.',
 citation:CITE_320});
NEG.push({mode:'abstain',dimension:'cookie-banner-dismissible-thin',
 style:`.cookie{position:fixed;bottom:0;left:0;right:0;height:56px;background:#222;color:#fff;display:flex;align-items:center;gap:8px;padding:0 10px;box-sizing:border-box;}`,
 body:`<main>${FILLER}</main><div class="cookie"><span>We use cookies.</span><button>OK</button></div>`,
 rationale:'A 56px fixed cookie bar leaves ~200px for content and does not overflow horizontally — not crowding. Whether 56px is "too much" is a height-budget judgment, but it is clearly within tolerance; abstain mirrors the positive height-budget cases but the expected verdict is pass.',
 citation:CITE_320});
NEG.push({mode:'decide',dimension:'header-static-not-fixed',
 style:`.hdr{height:120px;background:#234;color:#fff;}`,
 body:`<div class="hdr">A tall but STATIC header (not sticky/fixed) — it scrolls away with the page.</div><main>${FILLER}</main>`,
 rationale:'A 120px header that is in normal flow (not position:fixed/sticky) scrolls off with the page, so it never persistently consumes the viewport. No fixed-chrome crowding and no horizontal overflow. Clean.',
 citation:CITE_320});
NEG.push({mode:'decide',dimension:'sticky-bar-no-px-width-content-fluid',
 style:`.bar{position:sticky;top:0;height:52px;background:#345;color:#fff;display:flex;align-items:center;padding:0 12px;box-sizing:border-box;}.bar a{color:#fff;margin-right:14px;}`,
 body:`<div class="bar"><a href="#a">Home</a><a href="#b">News</a></div><main>${FILLER}</main>`,
 rationale:'A 52px fluid sticky bar with two links fits the 320px width and consumes little height. No horizontal overflow, content usable. Clean.',
 citation:CITE_320});
NEG.push({mode:'abstain',dimension:'chat-bubble-small-fab',
 style:`.fab{position:fixed;bottom:12px;right:12px;width:56px;height:56px;border-radius:50%;background:#345;color:#fff;display:flex;align-items:center;justify-content:center;}`,
 body:`<main>${FILLER}</main><button class="fab" aria-label="Open chat">💬</button>`,
 rationale:'A 56x56 floating chat button occupies a corner and consumes negligible viewport; it does not crowd out content or overflow horizontally. Whether a corner FAB obscures anything is a minor occlusion judgment ⇒ abstain, but expected pass.',
 citation:CITE_320});
NEG.push({mode:'decide',dimension:'fixed-skip-link-offscreen-until-focus',
 style:`.skip{position:fixed;top:-40px;left:0;background:#000;color:#fff;padding:8px;}.skip:focus{top:0;}`,
 body:`<a class="skip" href="#main">Skip to content</a><main id="main">${FILLER}</main>`,
 rationale:'A fixed skip link is positioned off-screen (top:-40px) until focused, so it consumes no visible viewport at rest and does not overflow horizontally. Standard accessible pattern — clean.',
 citation:CITE_320});
NEG.push({mode:'decide',dimension:'sticky-thumbnail-rail-overflow-x-auto',
 style:`.rail{position:sticky;top:0;height:64px;overflow-x:auto;white-space:nowrap;background:#eee;}.rail img,.rail span{display:inline-block;width:90px;height:60px;background:#9cf;margin:2px;}`,
 body:`<div class="rail"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div><main>${FILLER}</main>`,
 rationale:'A 64px sticky thumbnail rail provides its own overflow-x:auto scroll affordance, so its inner overflow is exempt (author-provided 2-D affordance scoped to the rail) and the document does not overflow. Thin height. Clean — runner exempts the rail.',
 citation:"WCAG 2.2 SC 1.4.10: an author-provided horizontal scroll container scopes the 2-D scroll to that component without forcing the whole page into two-dimensional scrolling."});
NEG.push({mode:'abstain',dimension:'sticky-header-80px-borderline-ok',
 style:`.hdr{position:sticky;top:0;height:80px;width:100%;background:#1b3a5c;color:#fff;box-sizing:border-box;padding:8px;}`,
 body:`<div class="hdr"><strong>Brand</strong><nav>Home · About</nav></div><main>${FILLER}</main>`,
 rationale:'An 80px sticky header consumes under a third of a ~256px viewport, leaving ~176px for content, and does not overflow horizontally. Within tolerance — not crowding. Borderline height ⇒ abstain to mirror positives, expected pass.',
 citation:CITE_320});
NEG.push({mode:'decide',dimension:'fixed-bar-translucent-content-shows-through',
 style:`.bar{position:fixed;top:0;left:0;right:0;height:44px;background:rgba(20,40,60,.85);color:#fff;line-height:44px;padding-left:10px;}main{margin-top:44px;}`,
 body:`<div class="bar">Translucent header</div><main>${FILLER}</main>`,
 rationale:'A 44px fixed header with margin-top offset on main does not overlap content and does not overflow horizontally. Small height budget, content usable. Clean.',
 citation:CITE_320});

function writeAll(list,polarity,start,labels){
  list.forEach((c,i)=>{
    const n=String(start+i).padStart(2,'0');const file=`case-${n}.html`;
    const expected=polarity==='positive'?'failed':'passed';
    fs.writeFileSync(path.join(DIR,file),page(`1.4.10 sticky ${polarity} (${c.dimension})`,c.style,c.body));
    labels.push({file,expected,polarity,
      aspect:'sticky-fixed-content-consumes-small-viewport',
      dimension:c.dimension,
      runnerShould:c.mode,
      overflowAtPx: c.mode==='decide' && polarity==='positive' ? (/480/.test(c.dimension)?480:/420/.test(c.dimension)?420:520) : null,
      exception:null,
      rationale:c.rationale,citation:c.citation});
  });
}
const labels=[];
writeAll(POS,'positive',1,labels);
writeAll(NEG,'negative',POS.length+1,labels);
labels.forEach(l=>{ if(l.polarity==='negative') l.overflowAtPx=null; });
fs.writeFileSync(path.join(DIR,'labels.json'),JSON.stringify(labels,null,2));
const ab=labels.filter(l=>l.runnerShould==='abstain').length;
console.log(`aspect4: ${POS.length} pos, ${NEG.length} neg, ${labels.length} total, ${ab} abstain`);
