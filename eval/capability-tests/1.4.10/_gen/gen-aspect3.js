// Generator for aspect 3: long-unbreakable-string-overflow-c33
// A long unbreakable string (URL, code, token) overflows at 320px. C32/C33/C38 are the techniques
// for allowing breaking. Judge whether overflow is from an unbreakable string vs a real layout failure.
//
// Runner-capability mapping:
//   POSITIVE (no break technique): the string overflows -> horizontalScrollPresent + non-exempt text
//     source -> runner DECIDES a barrier. C32 not applied => F-style reflow failure.
//   NEGATIVE (C33/C38 applied: overflow-wrap:anywhere | word-break:break-word | hyphens):
//     the string wraps, no overflow -> runner DECIDES clean.
//   NEGATIVE (exception): the string is inside an author-provided overflow-x:auto|scroll container,
//     OR inside <pre>/code that genuinely needs 2-D layout -> the runner's exemption (ancestor
//     overflow-x:auto|scroll, or it is code) suppresses the barrier; whether "this code truly needs
//     2-D layout" is semantic => some marked abstain.
const fs=require('fs'),path=require('path');
const DIR=path.resolve(__dirname,'../long-unbreakable-string-overflow-c33');
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
const CITE_C32="WCAG 2.2 Technique C32: 'Using media queries and grid CSS to reflow columns'; and the reflow understanding that long strings (URLs, code) must be allowed to break — see C33.";
const CITE_C33="WCAG 2.2 Technique C33: 'Allowing for reflow with long URLs and strings of text' — use overflow-wrap/word-break/hyphens so long unbreakable strings wrap rather than forcing horizontal scrolling at 320 CSS px.";
const CITE_C38="WCAG 2.2 Technique C38: 'Using CSS width, max-width and flexbox to fit text'; with C33 the long token wraps within the viewport.";
const CITE_F102="WCAG 2.2 SC 1.4.10: a long unbreakable string that forces horizontal scrolling, with no break technique applied, is a reflow barrier (the remedy is C33).";

const POS=[],NEG=[];
const LONGURL='https://example.com/very/deep/path/segment/that/keeps/going/and/going/reference?token=abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
const LONGTOKEN='ZmFrZS1iZWFyZXItdG9rZW4tZXhhbXBsZS1hYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODk';
const LONGHASH='0xA1B2C3D4E5F6071829304152637485960718293A4B5C6D7E8F90123456789ABCDEF0123456789';
const LONGWORD='Pneumonoultramicroscopicsilicovolcanoconiosisantidisestablishmentarianismfloccinaucinihilipilification';

// ---- POSITIVES: string overflows, no break technique. NOTE: the runner's per-element source check
//      (r.right>vw+2) only catches an element whose BOX crosses the viewport edge. A long string that
//      overflows a viewport-width block grows the DOCUMENT scrollWidth (hsp=true) but the text's box
//      stays at viewport width, so overflowSourceLocated=false and the runner CANNOT decide a barrier
//      => these are runnerShould:"abstain" (the C33/LLM lane owns them). Cases whose element box itself
//      overflows (fixed-width box / inline-in-flow that pushes the parent wide) => "decide".
POS.push({mode:'abstain',dimension:'long-url-no-wrap-default',
 style:`.ref{font-family:monospace;}`,
 body:`<h2>Reference link</h2><p class="ref">${LONGURL}</p>`,
 rationale:'A long URL in a default-flow paragraph has no break opportunity; at 320px it overflows the viewport (document scrollWidth>320) and forces horizontal scroll — a real barrier with no C33 technique. BUT the text overflows a viewport-width <p> box, so no ELEMENT box crosses the edge; the horizontal-overflow probe locates no source and cannot decide. Runner must abstain to the C33/LLM lane.',
 citation:CITE_F102});
POS.push({mode:'abstain',dimension:'bearer-token-white-space-nowrap',
 style:`.tok{white-space:nowrap;font-family:monospace;}`,
 body:`<h2>Your token</h2><p class="tok">${LONGTOKEN}</p><p>Copy the token above.</p>`,
 rationale:'A base64 token with white-space:nowrap cannot wrap and overflows 320px (real barrier, no C33). The token text overflows a viewport-width <p>, so no element box crosses the edge and the probe locates no source — runner abstains to the C33/LLM lane.',
 citation:CITE_F102});
POS.push({mode:'decide',dimension:'hash-in-fixed-width-box',
 style:`.box{width:480px;font-family:monospace;background:#f6f6f6;padding:8px;}`,
 body:`<p>Transaction hash:</p><div class="box">${LONGHASH}</div>`,
 rationale:'A 0x hash in a 480px fixed-width box overflows 320px; the box itself is wider than the viewport and the string offers no wrap point. Barrier (no C33).',
 citation:CITE_F102});
POS.push({mode:'abstain',dimension:'long-word-overflow-no-wrap',
 style:`p{overflow-wrap:normal;word-break:normal;}`,
 body:`<p>${LONGWORD} is a famously long word, and with default wrapping rules it cannot break, so it pushes the paragraph past the 320px viewport edge.</p>`,
 rationale:'A very long single word with default wrapping cannot break and overflows 320px (real barrier; remedy is C33). The word overflows a viewport-width <p>, so no element box crosses the edge — the probe locates no source and cannot decide. Runner abstains to the C33/LLM lane.',
 citation:CITE_C33});
POS.push({mode:'decide',dimension:'inline-code-nowrap-token',
 style:`code{white-space:nowrap;background:#eee;padding:2px;}`,
 body:`<p>Run with the flag <code>--authorization=${LONGTOKEN}</code> to authenticate.</p>`,
 rationale:'An inline <code> token with white-space:nowrap embedded mid-sentence overflows 320px. Although it is code, it is a short inline value that could wrap (C33), not a block needing 2-D layout; overflowing inline code in running text is a barrier.',
 citation:CITE_C33});
POS.push({mode:'decide',dimension:'email-deeplink-no-break',
 style:`a{font-family:monospace;}`,
 body:`<p>Confirm via <a href="#">verylongmailbox.name.surname.department@subdomain.corporate.example-company.com</a></p>`,
 rationale:'A very long email/link string in normal flow has no break point and overflows 320px without C33. Reflow barrier the runner can detect.',
 citation:CITE_C33});
POS.push({mode:'abstain',dimension:'preformatted-data-string-no-wrap',
 style:`pre{white-space:pre;background:#f6f6f6;padding:8px;}`,
 body:`<pre>${LONGTOKEN}=${LONGHASH}</pre>`,
 rationale:'A pre block with a long key=value DATA string (not code needing layout) uses white-space:pre and overflows 320px (real barrier; should wrap per C33). The string overflows the viewport-width <pre> box without the box crossing the edge, so the probe locates no source — runner abstains to the C33/LLM lane.',
 citation:CITE_C33});
POS.push({mode:'abstain',dimension:'breadcrumb-path-nowrap',
 style:`.crumb{white-space:nowrap;font-family:monospace;}`,
 body:`<nav class="crumb">/home/users/jason/Developer/A11yAnnotator/eval/capability-tests/1.4.10/long-unbreakable-string-overflow-c33/case</nav>`,
 rationale:'A filesystem breadcrumb path with white-space:nowrap is an unbreakable string that overflows 320px (real barrier; should wrap per C33). The text overflows a viewport-width <nav> box, so no element box crosses the edge — the probe locates no source and abstains to the C33/LLM lane.',
 citation:CITE_C33});
POS.push({mode:'decide',dimension:'tel-link-spanning-token-nowrap-span-box-wide',
 style:`.acct{display:inline-block;font-family:monospace;letter-spacing:1px;white-space:nowrap;}`,
 body:`<p>Account: <span class="acct">IBANDE0000000000000000000000000000000000000000REF99887766554433221100</span></p>`,
 rationale:'A long IBAN-style account string in an inline-block span with white-space:nowrap (no break opportunities) makes the SPAN element box itself wider than the 320px viewport, so overflowSourceLocated + anyNonExempt fire and the document scrolls — the runner CAN decide a barrier. (Contrast the pure-text cases where only text, not a box, overflows.)',
 citation:CITE_C33});
POS.push({mode:'decide',dimension:'querystring-overflow-in-input-value',
 style:`input{width:520px;font-family:monospace;}`,
 body:`<label>Callback URL<br><input value="${LONGURL}"></label>`,
 rationale:'A text input fixed at width:520px holding a long URL overflows 320px. The field width (not just the string) is the overflow source; it should be width:100% (C38) so the field fits. Barrier.',
 citation:CITE_C38});
// layout amplifies the string: a fixed 120px label column + nowrap value pushes the VALUE element's
// box past the viewport, so the probe DOES locate a non-exempt source => decide.
POS.push({mode:'decide',dimension:'fixed-label-column-pushes-value-box-wide',
 style:`.row{display:flex;}.label{flex:0 0 120px;}.val{font-family:monospace;white-space:nowrap;}`,
 body:`<div class="row"><div class="label">API key</div><div class="val">${LONGTOKEN}</div></div>`,
 rationale:'A fixed 120px label column plus a white-space:nowrap value forces the .val element box itself past the 320px viewport edge (right>vw), so overflowSourceLocated + anyNonExempt fire and the document scrolls — the runner CAN decide a barrier. This contrasts with the pure-string cases where only text (not a box) overflows.',
 citation:CITE_C33});

// ---- NEGATIVES: C33/C38 applied OR legit 2-D exception => decide(clean) / abstain ----
NEG.push({mode:'decide',dimension:'overflow-wrap-anywhere-url',
 style:`.ref{overflow-wrap:anywhere;font-family:monospace;}`,
 body:`<h2>Reference link</h2><p class="ref">${LONGURL}</p>`,
 rationale:'overflow-wrap:anywhere (C33) lets the long URL break at any character, so it wraps within 320px. No overflow source — clean reflow.',
 citation:CITE_C33});
NEG.push({mode:'decide',dimension:'word-break-break-word-token',
 style:`.tok{word-break:break-word;font-family:monospace;}`,
 body:`<h2>Your token</h2><p class="tok">${LONGTOKEN}</p>`,
 rationale:'word-break:break-word (C33) breaks the base64 token across lines; it fits 320px. No horizontal overflow.',
 citation:CITE_C33});
NEG.push({mode:'decide',dimension:'word-break-break-all-hash',
 style:`.box{word-break:break-all;font-family:monospace;background:#f6f6f6;padding:8px;}`,
 body:`<p>Transaction hash:</p><div class="box">${LONGHASH}</div>`,
 rationale:'word-break:break-all (C33) forces the hash to wrap at the box edge; the box is fluid so nothing overflows 320px. Clean.',
 citation:CITE_C33});
NEG.push({mode:'decide',dimension:'hyphens-auto-long-word',
 style:`p{overflow-wrap:break-word;hyphens:auto;}`,
 body:`<p lang="en">${LONGWORD} wraps because overflow-wrap and hyphens let the browser break the long word within the 320px column.</p>`,
 rationale:'overflow-wrap:break-word + hyphens:auto (C33) allow the long word to break and wrap. No overflow at 320px.',
 citation:CITE_C33});
NEG.push({mode:'decide',dimension:'wbr-break-opportunities-url',
 style:`.ref{font-family:monospace;}`,
 body:`<p class="ref">https://example.com/very/deep/<wbr>path/<wbr>segment/<wbr>reference?<wbr>token=abcdefghijklmnopqrstuvwxyz0123456789</p>`,
 rationale:'<wbr> elements provide explicit break opportunities (C33) so the URL wraps at 320px. No overflow.',
 citation:CITE_C33});
NEG.push({mode:'decide',dimension:'fluid-readonly-url-overflow-wrap',
 style:`.field{width:100%;box-sizing:border-box;font-family:monospace;border:1px solid #999;padding:6px;overflow-wrap:anywhere;}`,
 body:`<label>Callback URL<br><div class="field">${LONGURL}</div></label>`,
 rationale:'A fluid width:100% field (C38) with overflow-wrap:anywhere (C33) keeps the long URL within 320px and wraps it — no document overflow and no clip. (Authored as a wrapping div rather than a single-line <input>, whose UA overflow:clip would internally scroll the value and is a separate concern from page reflow.) Clean negative.',
 citation:CITE_C38});
NEG.push({mode:'decide',dimension:'inline-code-wraps',
 style:`code{overflow-wrap:anywhere;background:#eee;padding:2px;}`,
 body:`<p>Run with the flag <code>--authorization=${LONGTOKEN}</code> to authenticate.</p>`,
 rationale:'Inline code with overflow-wrap:anywhere (C33) wraps within the sentence; no horizontal overflow at 320px.',
 citation:CITE_C33});
// exception negatives: author-provided scroll affordance (overflow-x:auto) => runner exempts
NEG.push({mode:'decide',dimension:'code-block-overflow-x-auto-scroll',
 style:`pre{overflow-x:auto;white-space:pre;background:#272822;color:#f8f8f2;padding:10px;}`,
 body:`<pre>function authenticate(token) { return fetch('/api', { headers: { Authorization: 'Bearer ' + token } }); } // ${LONGTOKEN}</pre>`,
 rationale:'A source-code block keeps white-space:pre (code needs its layout) but provides an author overflow-x:auto scroll affordance. The runner exempts an ancestor with overflow-x:auto (a provided 2-D affordance), so this is not counted as a barrier. Code that requires 2-D layout is within the exception.',
 citation:"WCAG 2.2 SC 1.4.10 exception: 'parts of the content which require two-dimensional layout for usage or meaning' (Understanding lists code among content that may need 2-D layout); an author-provided horizontal scroll container satisfies access."});
NEG.push({mode:'abstain',dimension:'code-needs-layout-pre-no-scroll-ambiguous',
 style:`pre{white-space:pre;background:#272822;color:#f8f8f2;padding:10px;}`,
 body:`<pre>def f(x):\n    if x &gt; 0:\n        return some_function_with_a_genuinely_long_identifier(x, configuration_option=True)</pre>`,
 rationale:'Indented source code where horizontal structure carries meaning may fall under the 2-D layout exception, but here no scroll affordance is provided and it does overflow — whether this code "requires" 2-D layout vs should be allowed to wrap is a semantic call. Abstain for the LLM to weigh the code exception.',
 citation:"WCAG 2.2 SC 1.4.10 exception for content requiring two-dimensional layout; Understanding cites code as possibly needing horizontal layout."});
NEG.push({mode:'decide',dimension:'short-token-fits-already',
 style:`.tok{font-family:monospace;}`,
 body:`<p class="tok">id: 7f3a-22b9</p>`,
 rationale:'A short token (id: 7f3a-22b9) easily fits within 320px with no special wrapping needed. No overflow — clean, not a string-overflow case.',
 citation:CITE_C33});
NEG.push({mode:'decide',dimension:'url-in-scroll-container-author-affordance',
 style:`.scroller{overflow-x:auto;white-space:nowrap;border:1px solid #ccc;padding:6px;font-family:monospace;}`,
 body:`<div class="scroller">${LONGURL}</div>`,
 rationale:'The long URL sits in an explicit overflow-x:auto scroll container (author-provided horizontal affordance scoped to that element, not the page). The runner exempts ancestors with overflow-x:auto and the document itself does not overflow. Not a page-level reflow barrier.',
 citation:"WCAG 2.2 SC 1.4.10: a scoped horizontal scroll affordance for a single unbreakable string avoids forcing the whole page into two-dimensional scrolling."});

function writeAll(list,polarity,start,labels){
  list.forEach((c,i)=>{
    const n=String(start+i).padStart(2,'0');const file=`case-${n}.html`;
    const expected=polarity==='positive'?'failed':'passed';
    fs.writeFileSync(path.join(DIR,file),page(`1.4.10 C33 ${polarity} (${c.dimension})`,c.style,c.body));
    labels.push({file,expected,polarity,
      aspect:'long-unbreakable-string-overflow-c33',
      dimension:c.dimension,
      runnerShould:c.mode,
      overflowAtPx:null,
      exception: c.exception!==undefined ? c.exception : (polarity==='negative' && /scroll|overflow-x-auto|affordance|code-needs/.test(c.dimension) ? '2d-data' : 'unbreakable-string'),
      rationale:c.rationale,citation:c.citation});
  });
}
const labels=[];
writeAll(POS,'positive',1,labels);
writeAll(NEG,'negative',POS.length+1,labels);
// refine exception field: positives are unbreakable-string; clean-wrap negatives are unbreakable-string(resolved); 2d/scroll negatives are 2d-data
labels.forEach(l=>{
  if(l.polarity==='positive') l.exception='unbreakable-string';
  else if(/scroll|affordance|code-needs|overflow-x-auto/.test(l.dimension)) l.exception='2d-data';
  else l.exception='unbreakable-string';
});
fs.writeFileSync(path.join(DIR,'labels.json'),JSON.stringify(labels,null,2));
const ab=labels.filter(l=>l.runnerShould==='abstain').length;
console.log(`aspect3: ${POS.length} pos, ${NEG.length} neg, ${labels.length} total, ${ab} abstain`);
