#!/usr/bin/env node
/* Generator: focus-triggered-reveal-hover-parity (SC 1.4.13 Content on Hover or
 * Focus). Content revealed on hover/focus must be Dismissible, Hoverable, and
 * Persistent. The headline barrier this capability uniquely catches: content
 * that appears on HOVER but NOT on keyboard FOCUS (no keyboard path) — a
 * keyboard user never sees it. Other positives break dismissible / hoverable /
 * persistent. Negatives reveal on both hover and focus and meet all three.
 *
 * The capability drives interaction:"hover" then interaction:"focus" on the
 * trigger and compares whether the revealed content appears in each state.
 *
 * Grounding (verbatim):
 *   SC 1.4.13: "Where receiving and then removing pointer hover or keyboard
 *   focus triggers additional content to become visible and then hidden, the
 *   following are true:" — Dismissible: "A mechanism is available to dismiss the
 *   additional content without moving pointer hover or keyboard focus, unless
 *   the additional content communicates an input error or does not obscure or
 *   replace other content"; Hoverable: "If pointer hover can trigger the
 *   additional content, then the pointer can be moved over the additional
 *   content without the additional content disappearing"; Persistent: "The
 *   additional content remains visible until the hover or focus trigger is
 *   removed, the user dismisses it, or its information is no longer valid".
 *   Note: although 1.4.13's conditions are about hover/focus-triggered content,
 *   a hover-only tooltip with NO keyboard-focus path is the canonical barrier
 *   (the content is unreachable by keyboard), failing the spirit/keyboard
 *   accessibility of content on hover or focus.
 */
const fs = require('fs');
const path = require('path');
const DIR = __dirname;

const HEAD = (n, pol, dim) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>1.4.13 focus-triggered-reveal-hover-parity case ${n}</title>
<style>
  body{font:16px/1.5 system-ui,sans-serif;margin:40px;max-width:640px;color:#1a1a1a}
  h1{font-size:20px}
  .trigger{display:inline-block;border-bottom:1px dotted #2557d6;color:#2557d6;cursor:help}
  button.trigger{font:inherit;border:1px solid #555;background:#f4f4f4;border-radius:6px;padding:7px 12px;cursor:pointer}
  .tip{position:absolute;max-width:260px;background:#222;color:#fff;padding:8px 10px;border-radius:6px;font-size:14px;margin-top:6px;z-index:5}
  .tip[hidden]{display:none}
  :focus{outline:3px solid #2557d6;outline-offset:2px}
  .field label{font-weight:600}
  input{font:inherit;padding:6px;border:1px solid #888;border-radius:5px}
  .spacer{height:30px}
</style></head>
<body>
<!-- 1.4.13 ${pol} | focus-triggered-reveal-hover-parity | ${dim} -->`;
const FOOT = `\n</body></html>\n`;

const positives = [
{ file:'case-01.html', dim:'hover-only-no-focus-path-css', trigger:'#t', interaction:'hover', revealed:'#tip', focusReveals:false,
  rationale:'The tooltip is revealed purely by CSS :hover on a non-focusable <span>; there is no :focus rule and the trigger is not in the tab order, so a keyboard user can never trigger or read the additional content. Content available on hover but not focus is a barrier (1.4.13 keyboard parity).',
  body:`  <h1>Pricing</h1>
  <p>Your plan costs <span id="t" class="trigger">$29/mo<span id="tip" class="tip">Billed annually; taxes may apply.</span></span> after the trial.</p>
<style>#t:hover #tip{display:block}#tip{display:none}.tip{position:static;display:inline-block}</style>
<!-- BUG: reveal is :hover only on a non-focusable span; no :focus, no tabindex -> keyboard cannot reach it. -->` },

{ file:'case-02.html', dim:'hover-only-mouseover-js-no-focus', trigger:'#t', interaction:'hover', revealed:'#tip', focusReveals:false,
  rationale:'JS shows the tooltip on mouseover/mouseout only; there are no focus/blur handlers and the trigger has no tabindex, so keyboard focus never reveals the content. Hover-only with no keyboard path (1.4.13).',
  body:`  <h1>Account</h1>
  <p>Status: <span id="t" class="trigger" onmouseover="show()" onmouseout="hide()">Verified</span></p>
  <div id="tip" class="tip" hidden>Verified via email on 2026-01-10.</div>
<script>
function show(){document.getElementById('tip').hidden=false;}
function hide(){document.getElementById('tip').hidden=true;}
/* BUG: only mouseover/mouseout; no focus/blur and the span is not focusable. */
</script>` },

{ file:'case-03.html', dim:'focusable-but-only-hover-shows', trigger:'#t', interaction:'focus', revealed:'#tip', focusReveals:false,
  rationale:'The trigger is a real <button> (focusable, in tab order) but the reveal is wired only to mouseenter/mouseleave; focusing it with the keyboard does nothing, so the tooltip is still hover-only. Being focusable is not enough — focus must reveal the content (1.4.13).',
  body:`  <h1>Form</h1>
  <button id="t" class="trigger" type="button" onmouseenter="show()" onmouseleave="hide()" aria-describedby="tip">What is this?</button>
  <div id="tip" class="tip" hidden>We use this to verify your identity.</div>
<script>
function show(){document.getElementById('tip').hidden=false;}
function hide(){document.getElementById('tip').hidden=true;}
/* BUG: focusable trigger, but reveal only on mouseenter/leave; focus does NOT show the tip. */
</script>` },

{ file:'case-04.html', dim:'not-hoverable-disappears-on-gap', trigger:'#t', interaction:'hover', revealed:'#tip', focusReveals:true,
  rationale:'The tooltip shows on focus and hover, but it sits with a gap below the trigger and hides on the trigger\'s mouseleave with no buffer; moving the pointer off the trigger toward the tooltip dismisses it before it can be reached, failing the Hoverable condition.',
  body:`  <h1>Help</h1>
  <button id="t" class="trigger" type="button" onmouseenter="show()" onmouseleave="hide()" onfocus="show()" onblur="hide()" aria-describedby="tip">Shipping info</button>
  <div id="tip" class="tip" style="margin-top:30px" hidden>Ships in 3-5 business days. <a href="#x">Details</a></div>
<script>
function show(){document.getElementById('tip').hidden=false;}
function hide(){document.getElementById('tip').hidden=true;}
/* BUG: tip is offset 30px below with a gap and hides immediately on trigger mouseleave -> not Hoverable. */
</script>` },

{ file:'case-05.html', dim:'not-dismissible-no-escape', trigger:'#t', interaction:'hover', revealed:'#tip', focusReveals:true,
  rationale:'A large tooltip appears on hover/focus and OBSCURES the text below it, but there is no way to dismiss it without moving hover/focus (no Escape handler); the obscuring content cannot be cleared, failing the Dismissible condition.',
  body:`  <h1>Article</h1>
  <p><span id="t" class="trigger" tabindex="0" onmouseenter="show()" onmouseleave="hide()" onfocus="show()" onblur="hide()">key term</span> is defined as follows.</p>
  <p id="below">Important following sentence that the tooltip overlaps.</p>
  <div id="tip" class="tip" style="position:absolute;width:300px;height:60px" hidden>A long definition that overlaps and obscures the sentence below it.</div>
<script>
function show(){document.getElementById('tip').hidden=false;}
function hide(){document.getElementById('tip').hidden=true;}
/* BUG: tip obscures #below but provides NO dismiss (Escape) without moving hover/focus. */
</script>` },

{ file:'case-06.html', dim:'not-persistent-auto-timeout', trigger:'#t', interaction:'focus', revealed:'#tip', focusReveals:true,
  rationale:'The tooltip appears on focus/hover but auto-hides after 1.2s via setTimeout even though focus/hover is still on the trigger; it does not remain visible until the trigger is removed or dismissed, failing the Persistent condition.',
  body:`  <h1>Settings</h1>
  <button id="t" class="trigger" type="button" onmouseenter="show()" onfocus="show()" aria-describedby="tip">Sync status</button>
  <div id="tip" class="tip" hidden>Last synced 2 minutes ago.</div>
<script>
function show(){var tip=document.getElementById('tip');tip.hidden=false;
  setTimeout(function(){tip.hidden=true;},1200);/* BUG: auto-dismiss while still focused/hovered -> not Persistent. */}
</script>` },

{ file:'case-07.html', dim:'hover-only-title-attr-no-focus-tip', trigger:'#t', interaction:'hover', revealed:'#t', focusReveals:false,
  rationale:'Extra info is conveyed only through the native title attribute on a non-interactive <span>, which UA renders on mouse hover but not on keyboard focus; keyboard users get no tooltip. Title-only is the classic hover-only/no-focus barrier (1.4.13).',
  body:`  <h1>Map legend</h1>
  <p>The <span id="t" class="trigger" title="Restricted access between 6pm and 6am">amber zone</span> requires a permit.</p>
<!-- BUG: info lives only in title=, shown on hover by the UA, never on keyboard focus. -->` },

{ file:'case-08.html', dim:'focus-shows-but-hover-richer', trigger:'#t', interaction:'focus', revealed:'#tip', focusReveals:true,
  rationale:'On focus a minimal tooltip appears, but on hover a RICHER tooltip with an actionable link appears that is unavailable to keyboard users; the focus reveal is not equivalent to the hover reveal, so additional content is effectively hover-only for the link, a parity barrier.',
  body:`  <h1>Invoice</h1>
  <button id="t" class="trigger" type="button" onmouseenter="showFull()" onmouseleave="hide()" onfocus="showMin()" onblur="hide()" aria-describedby="tip">Due date</button>
  <div id="tip" class="tip" hidden></div>
<script>
var tip=document.getElementById('tip');
function showMin(){tip.hidden=false;tip.textContent='Due March 1.';}
function showFull(){tip.hidden=false;tip.innerHTML='Due March 1. <a href="#pay">Pay now</a> or <a href="#sched">reschedule</a>.';}
function hide(){tip.hidden=true;}
/* BUG: hover reveals actionable links not present on focus -> hover/focus content not equivalent. */
</script>` },

{ file:'case-09.html', dim:'hover-only-pointerenter-no-focus', trigger:'#t', interaction:'hover', revealed:'#tip', focusReveals:false,
  rationale:'The reveal is bound to pointerenter/pointerleave on a non-focusable element with no focus handling; keyboard focus cannot fire pointer events, so the additional content is hover-only with no keyboard path (1.4.13).',
  body:`  <h1>Dashboard</h1>
  <span id="t" class="trigger" onpointerenter="show()" onpointerleave="hide()">CPU 82%</span>
  <div id="tip" class="tip" hidden>Sustained above 80% for 5 minutes.</div>
<script>
function show(){document.getElementById('tip').hidden=false;}
function hide(){document.getElementById('tip').hidden=true;}
/* BUG: pointerenter/leave on a non-focusable span; no focus path. */
</script>` },

{ file:'case-10.html', dim:'not-hoverable-pointerleave-trigger-only', trigger:'#t', interaction:'hover', revealed:'#tip', focusReveals:true,
  rationale:'The tooltip shows on hover and focus, but it hides on the TRIGGER\'s pointerleave only, with the tooltip placed apart from the trigger; moving the pointer from the trigger into the tooltip crosses empty space and triggers pointerleave, hiding the tip before the pointer reaches it. Fails Hoverable.',
  body:`  <h1>Profile</h1>
  <button id="t" class="trigger" type="button" onpointerenter="show()" onpointerleave="hide()" onfocus="show()" onblur="hide()" aria-describedby="tip">Badge info</button>
  <div class="spacer"></div>
  <div id="tip" class="tip" style="position:static;display:inline-block" hidden>Top contributor badge earned in 2025.</div>
<script>
function show(){document.getElementById('tip').hidden=false;}
function hide(){document.getElementById('tip').hidden=true;}
/* BUG: gap between trigger and tip; pointerleave on trigger hides it before pointer can reach it. */
</script>` },

{ file:'case-11.html', dim:'hover-only-focus-handler-on-wrong-element', trigger:'#t', interaction:'focus', revealed:'#tip', focusReveals:false,
  rationale:'A focus handler exists but is attached to a non-focusable wrapper <div>, not the actual interactive trigger button, so focusing the button never fires it; only the button\'s mouseenter reveals the tip. Effectively hover-only despite a focus handler being present.',
  body:`  <h1>Search</h1>
  <div id="wrap" onfocus="show()" onblur="hide()">
    <button id="t" class="trigger" type="button" onmouseenter="show()" onmouseleave="hide()" aria-describedby="tip">Filters</button>
  </div>
  <div id="tip" class="tip" hidden>Use filters to narrow your results.</div>
<script>
function show(){document.getElementById('tip').hidden=false;}
function hide(){document.getElementById('tip').hidden=true;}
/* BUG: focus handler is on the non-focusable wrapper div, not the button; keyboard focus never reveals. */
</script>` },

{ file:'case-12.html', dim:'not-dismissible-modal-tip-obscures-input', trigger:'#t', interaction:'focus', revealed:'#tip', focusReveals:true,
  rationale:'Focusing the password field reveals a help bubble that overlaps and obscures the Submit button, and there is no dismiss mechanism that keeps focus on the field (Escape does nothing); obscuring content with no dismissal fails the Dismissible condition.',
  body:`  <h1>Reset password</h1>
  <div class="field"><label for="t">New password</label><br><input id="t" type="password" onfocus="show()"></div>
  <div id="tip" class="tip" style="position:absolute;width:280px;height:50px;margin-top:4px" hidden>Must include a number and a symbol.</div>
  <button id="submit" type="button" style="margin-top:10px">Submit</button>
<script>
function show(){document.getElementById('tip').hidden=false;}
/* BUG: help bubble obscures the Submit button and cannot be dismissed without moving focus (no Esc). */
</script>` },
];

const negatives = [
{ file:'case-13.html', dim:'hover-and-focus-css-parity', trigger:'#t', interaction:'focus', revealed:'#tip', focusReveals:true,
  rationale:'The trigger is focusable (tabindex=0) and CSS reveals the tooltip on BOTH :hover and :focus, so keyboard and pointer users get the same content. Hover/focus parity satisfied.',
  body:`  <h1>Pricing</h1>
  <p>Your plan costs <span id="t" class="trigger" tabindex="0">$29/mo<span id="tip" class="tip">Billed annually; taxes may apply.</span></span> after the trial.</p>
<style>#t:hover #tip,#t:focus #tip{display:inline-block}#tip{display:none;position:static}</style>` },

{ file:'case-14.html', dim:'hover-and-focus-js-parity', trigger:'#t', interaction:'focus', revealed:'#tip', focusReveals:true,
  rationale:'JS wires show() to both mouseover and focus, and hide() to mouseout and blur, on a focusable button; the tooltip appears identically for keyboard and mouse. Parity satisfied.',
  body:`  <h1>Account</h1>
  <button id="t" class="trigger" type="button" onmouseover="show()" onmouseout="hide()" onfocus="show()" onblur="hide()" aria-describedby="tip">Status: Verified</button>
  <div id="tip" class="tip" hidden>Verified via email on 2026-01-10.</div>
<script>
function show(){document.getElementById('tip').hidden=false;}
function hide(){document.getElementById('tip').hidden=true;}
</script>` },

{ file:'case-15.html', dim:'hoverable-buffer-keeps-tip', trigger:'#t', interaction:'hover', revealed:'#tip', focusReveals:true,
  rationale:'The tooltip is contiguous with the trigger (no gap) and hiding is debounced so moving the pointer from the trigger onto the tooltip keeps it visible; the pointer can rest on the additional content. Hoverable condition met.',
  body:`  <h1>Help</h1>
  <span id="wrap" onmouseenter="show()" onmouseleave="schedHide()">
    <button id="t" class="trigger" type="button" onfocus="show()" onblur="hide()" aria-describedby="tip">Shipping info</button>
    <span id="tip" class="tip" style="position:static;display:inline-block" hidden>Ships in 3-5 business days. <a href="#x">Details</a></span>
  </span>
<script>
var timer;
function show(){clearTimeout(timer);document.getElementById('tip').hidden=false;}
function hide(){document.getElementById('tip').hidden=true;}
function schedHide(){timer=setTimeout(hide,300);}
/* Tip is inside the same hover region with a debounce -> remains while pointer moves onto it. */
</script>` },

{ file:'case-16.html', dim:'dismissible-escape-clears', trigger:'#t', interaction:'focus', revealed:'#tip', focusReveals:true,
  rationale:'The tooltip appears on hover/focus and an Escape keydown dismisses it without moving hover or focus off the trigger; the obscuring content is dismissible. Dismissible condition met.',
  body:`  <h1>Article</h1>
  <p><span id="t" class="trigger" tabindex="0" onmouseenter="show()" onmouseleave="hide()" onfocus="show()" onblur="hide()" onkeydown="esc(event)">key term</span> is defined here.</p>
  <p id="below">Important following sentence.</p>
  <div id="tip" class="tip" style="position:absolute;width:300px" hidden>A definition that can be dismissed with Escape.</div>
<script>
function show(){document.getElementById('tip').hidden=false;}
function hide(){document.getElementById('tip').hidden=true;}
function esc(e){if(e.key==='Escape')hide();}
</script>` },

{ file:'case-17.html', dim:'persistent-stays-until-blur', trigger:'#t', interaction:'focus', revealed:'#tip', focusReveals:true,
  rationale:'The tooltip remains visible the entire time focus/hover is on the trigger and only hides on blur/mouseleave; there is no auto-timeout. Persistent condition met.',
  body:`  <h1>Settings</h1>
  <button id="t" class="trigger" type="button" onmouseenter="show()" onmouseleave="hide()" onfocus="show()" onblur="hide()" aria-describedby="tip">Sync status</button>
  <div id="tip" class="tip" hidden>Last synced 2 minutes ago.</div>
<script>
function show(){document.getElementById('tip').hidden=false;}
function hide(){document.getElementById('tip').hidden=true;}
/* No setTimeout: stays until the trigger loses hover/focus. */
</script>` },

{ file:'case-18.html', dim:'native-input-describedby-static', trigger:'#t', interaction:'focus', revealed:'#hint', focusReveals:true,
  rationale:'The instruction is a persistently visible, programmatically associated hint (aria-describedby) that is always present rather than hover/focus-triggered, so 1.4.13 conditions are not even invoked and the information is fully available to keyboard and AT users.',
  body:`  <h1>Form</h1>
  <div class="field"><label for="t">Card number</label><br>
    <input id="t" type="text" aria-describedby="hint" inputmode="numeric"></div>
  <p id="hint" style="color:#444;font-size:14px">Enter the 16 digits on the front of your card.</p>` },

{ file:'case-19.html', dim:'focus-and-hover-equivalent-rich', trigger:'#t', interaction:'focus', revealed:'#tip', focusReveals:true,
  rationale:'Both focus and hover invoke the SAME show() that renders the full rich tooltip including the actionable link, so keyboard users get the identical actionable content as mouse users. Parity for rich content satisfied.',
  body:`  <h1>Invoice</h1>
  <button id="t" class="trigger" type="button" onmouseenter="show()" onmouseleave="hide()" onfocus="show()" onblur="hide()" aria-describedby="tip">Due date</button>
  <div id="tip" class="tip" hidden></div>
<script>
var tip=document.getElementById('tip');
function show(){tip.hidden=false;tip.innerHTML='Due March 1. <a href="#pay">Pay now</a> or <a href="#sched">reschedule</a>.';}
function hide(){tip.hidden=true;}
</script>` },

{ file:'case-20.html', dim:'focusin-on-wrapper-delegated-correctly', trigger:'#t', interaction:'focus', revealed:'#tip', focusReveals:true,
  rationale:'Reveal is delegated with focusin/focusout (which bubble) on the wrapper, so focusing the inner button correctly fires the handler and shows the tip; hover also shows it. Both paths reveal the content. Parity satisfied.',
  body:`  <h1>Search</h1>
  <div id="wrap" onfocusin="show()" onfocusout="hide()" onmouseenter="show()" onmouseleave="hide()" style="display:inline-block">
    <button id="t" class="trigger" type="button" aria-describedby="tip">Filters</button>
  </div>
  <div id="tip" class="tip" hidden>Use filters to narrow your results.</div>
<script>
function show(){document.getElementById('tip').hidden=false;}
function hide(){document.getElementById('tip').hidden=true;}
/* focusin/focusout bubble, so focusing the inner button reveals the tip just like hover. */
</script>` },

{ file:'case-21.html', dim:'native-title-plus-focus-tooltip', trigger:'#t', interaction:'focus', revealed:'#tip', focusReveals:true,
  rationale:'Beyond the native title, the focusable button also shows a scripted tooltip on focus and hover, so keyboard users are not reliant on the hover-only title; the additional content has a keyboard path. Parity satisfied.',
  body:`  <h1>Map legend</h1>
  <button id="t" class="trigger" type="button" title="Restricted access between 6pm and 6am" onmouseenter="show()" onmouseleave="hide()" onfocus="show()" onblur="hide()" aria-describedby="tip">amber zone</button>
  <div id="tip" class="tip" hidden>Restricted access between 6pm and 6am.</div>
<script>
function show(){document.getElementById('tip').hidden=false;}
function hide(){document.getElementById('tip').hidden=true;}
</script>` },

{ file:'case-22.html', dim:'hoverable-and-dismissible-combined', trigger:'#t', interaction:'focus', revealed:'#tip', focusReveals:true,
  rationale:'The tooltip is reachable by both hover and focus, stays put when the pointer moves onto it (shared hover region + debounce), and can be dismissed with Escape; all three of Dismissible, Hoverable, Persistent are met.',
  body:`  <h1>Profile</h1>
  <span id="wrap" onmouseenter="show()" onmouseleave="sched()">
    <button id="t" class="trigger" type="button" onfocus="show()" onblur="hide()" onkeydown="esc(event)" aria-describedby="tip">Badge info</button>
    <span id="tip" class="tip" style="position:static;display:inline-block" hidden>Top contributor badge earned in 2025.</span>
  </span>
<script>
var timer;
function show(){clearTimeout(timer);document.getElementById('tip').hidden=false;}
function hide(){document.getElementById('tip').hidden=true;}
function sched(){timer=setTimeout(hide,300);}
function esc(e){if(e.key==='Escape')hide();}
</script>` },

{ file:'case-23.html', dim:'css-focus-within-parity', trigger:'#t', interaction:'focus', revealed:'#tip', focusReveals:true,
  rationale:'CSS reveals the tip on :hover and :focus-within of the wrapper, and the trigger is a real button, so keyboard focus inside the wrapper shows the tip identically to hover. Parity via focus-within.',
  body:`  <h1>Dashboard</h1>
  <span id="wrap" class="trigger" style="position:relative">
    <button id="t" type="button" style="font:inherit;border:1px solid #555;background:#f4f4f4;border-radius:6px;padding:6px 10px">CPU 82%</button>
    <span id="tip" class="tip">Sustained above 80% for 5 minutes.</span>
  </span>
<style>#wrap #tip{display:none;position:static}#wrap:hover #tip,#wrap:focus-within #tip{display:inline-block}</style>` },

{ file:'case-24.html', dim:'persistent-and-not-obscuring-inline', trigger:'#t', interaction:'focus', revealed:'#tip', focusReveals:true,
  rationale:'On focus and hover an inline hint appears in normal flow below the field (it does not overlap or obscure other content) and persists until blur; because it does not obscure content, the dismissible exception applies and Hoverable/Persistent are met. No barrier.',
  body:`  <h1>Sign up</h1>
  <div class="field"><label for="t">Username</label><br>
    <input id="t" type="text" onfocus="show()" onblur="hide()" onmouseenter="show()" onmouseleave="hide()" aria-describedby="tip"></div>
  <div id="tip" class="tip" style="position:static;display:block;background:#eef;color:#113;border:1px solid #99c" hidden>3-20 letters, numbers, or underscores.</div>
<script>
function show(){document.getElementById('tip').hidden=false;}
function hide(){document.getElementById('tip').hidden=true;}
/* Inline, non-obscuring, persistent, revealed on both focus and hover. */
</script>` },
];

function emit(list, polarity, expected){
  return list.map(c=>{
    const html = HEAD(c.file.replace(/\D/g,''), polarity==='positive'?'POSITIVE':'NEGATIVE', c.dim) + '\n' + c.body + FOOT;
    fs.writeFileSync(path.join(DIR, c.file), html, 'utf8');
    return {
      file: c.file, expected, polarity, aspect:'focus-triggered-reveal-hover-parity', sc:'1.4.13',
      dimension: c.dim, triggerSelector: c.trigger, interaction: c.interaction,
      revealedSelector: c.revealed, expectFocusReturn: null, focusReveals: c.focusReveals, runnerShould:'decide',
      rationale: c.rationale,
      citation: '"Where receiving and then removing pointer hover or keyboard focus triggers additional content to become visible and then hidden, the following are true:" Dismissible — "A mechanism is available to dismiss the additional content without moving pointer hover or keyboard focus..."; Hoverable — "If pointer hover can trigger the additional content, then the pointer can be moved over the additional content without the additional content disappearing"; Persistent — "The additional content remains visible until the hover or focus trigger is removed, the user dismisses it, or its information is no longer valid". — WCAG 2.2 SC 1.4.13 Content on Hover or Focus'
    };
  });
}

const labels = emit(positives,'positive','failed').concat(emit(negatives,'negative','passed'));
fs.writeFileSync(path.join(DIR,'labels.json'), JSON.stringify(labels, null, 2)+'\n','utf8');
console.log('focus-triggered-reveal-hover-parity: wrote', positives.length+negatives.length, 'html +', labels.length, 'labels (',positives.length,'pos /',negatives.length,'neg )');
