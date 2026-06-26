#!/usr/bin/env node
/* Generator: focus-revealed-instruction (SC 3.3.2 Labels or Instructions).
 * An instruction needed to enter valid data is REVEALED on focus of the field.
 * POSITIVE: the instruction only appears on MOUSE/HOVER (or never on keyboard
 * focus / is removed on focus), so a keyboard user reaching the field by Tab
 * never sees the instruction required to provide correct input.
 * NEGATIVE: the instruction reliably appears on keyboard focus (and/or is
 * persistently associated), so it is available when the field is reached.
 *
 * The capability drives interaction:"focus" on the field and checks whether the
 * required instruction is present/visible/announced in the focused state.
 *
 * Grounding (verbatim):
 *   SC 3.3.2: "Labels or instructions are provided when content requires user
 *   input."
 *   Understanding 3.3.2 Intent: "The intent of this success criterion is to have
 *   content authors present instructions or labels that identify the controls in
 *   a form so that users know what input data is expected."
 */
const fs = require('fs');
const path = require('path');
const DIR = __dirname;

const HEAD = (n, pol, dim) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>3.3.2 focus-revealed-instruction case ${n}</title>
<style>
  body{font:16px/1.5 system-ui,sans-serif;margin:40px;max-width:620px;color:#1a1a1a}
  h1{font-size:20px}
  .field{margin:14px 0}
  label{font-weight:600;display:block;margin-bottom:4px}
  input,textarea,select{font:inherit;padding:7px;border:1px solid #888;border-radius:5px;width:280px;box-sizing:border-box}
  .hint{font-size:14px;color:#33485e;margin-top:4px}
  .hint[hidden]{display:none}
  :focus{outline:3px solid #2557d6;outline-offset:2px}
  button{font:inherit;padding:8px 16px;border:1px solid #555;border-radius:6px;background:#f4f4f4;cursor:pointer}
</style></head>
<body>
<!-- 3.3.2 ${pol} | focus-revealed-instruction | ${dim} -->`;
const FOOT = `\n</body></html>\n`;

const positives = [
{ file:'case-01.html', dim:'instruction-hover-only-not-on-focus', trigger:'#pw', interaction:'focus', revealed:'#pwhint', focusReveals:false,
  rationale:'The password format instruction is revealed only by mouseover on the field (no focus handler), so a keyboard user who Tabs to the field never sees the rule required to enter valid data. The instruction exists but is unavailable on keyboard focus (3.3.2).',
  body:`  <h1>Create account</h1>
  <form onsubmit="return false">
    <div class="field"><label for="pw">Password</label>
      <input id="pw" type="password" onmouseover="show()" onmouseout="hide()">
      <div id="pwhint" class="hint" hidden>Must be 12+ characters with a number and a symbol.</div></div>
    <button type="submit">Create</button>
  </form>
<script>
function show(){document.getElementById('pwhint').hidden=false;}
function hide(){document.getElementById('pwhint').hidden=true;}
/* BUG: instruction only on mouseover/mouseout; keyboard focus never reveals it. */
</script>` },

{ file:'case-02.html', dim:'instruction-removed-on-focus', trigger:'#code', interaction:'focus', revealed:'#codehint', focusReveals:false,
  rationale:'The format instruction is visible at rest but a focus handler HIDES it when the field receives focus (a misguided "clean" UX), so precisely when the keyboard user is about to type, the instruction disappears. The required instruction is absent in the focused state (3.3.2).',
  body:`  <h1>Redeem</h1>
  <form onsubmit="return false">
    <div class="field"><label for="code">Promo code</label>
      <input id="code" type="text" onfocus="hide()" onblur="show()">
      <div id="codehint" class="hint">Format: ABCD-1234 (4 letters, dash, 4 digits).</div></div>
    <button type="submit">Apply</button>
  </form>
<script>
function show(){document.getElementById('codehint').hidden=false;}
function hide(){document.getElementById('codehint').hidden=true;}
/* BUG: instruction is hidden ON focus, so a keyboard user sees nothing while typing. */
</script>` },

{ file:'case-03.html', dim:'title-attr-only-instruction', trigger:'#iban', interaction:'focus', revealed:'#iban', focusReveals:false,
  rationale:'The required IBAN format is conveyed solely through the title attribute, which the UA shows on mouse hover but not on keyboard focus and which is not exposed as an accessible description in a reliable, focus-visible way here; keyboard users reaching the field by Tab get no instruction (3.3.2).',
  body:`  <h1>Bank transfer</h1>
  <form onsubmit="return false">
    <div class="field"><label for="iban">IBAN</label>
      <input id="iban" type="text" title="Enter 2 letters, 2 digits, then up to 30 alphanumerics"></div>
    <button type="submit">Send</button>
  </form>
<!-- BUG: the format instruction lives only in title=, shown on hover, not on keyboard focus. -->` },

{ file:'case-04.html', dim:'tooltip-on-icon-hover-not-field-focus', trigger:'#exp', interaction:'focus', revealed:'#exphint', focusReveals:false,
  rationale:'A help icon next to the field reveals the date-format instruction only on mouse hover of the icon; the icon is not focusable and focusing the input does not reveal it, so a keyboard user filling the field never gets the format rule (3.3.2).',
  body:`  <h1>Card details</h1>
  <form onsubmit="return false">
    <div class="field"><label for="exp">Expiry</label>
      <input id="exp" type="text">
      <span id="ic" onmouseover="show()" onmouseout="hide()" style="cursor:help;color:#2557d6">&#9432;</span>
      <div id="exphint" class="hint" hidden>Use MM/YY, e.g. 09/27.</div></div>
    <button type="submit">Save</button>
  </form>
<script>
function show(){document.getElementById('exphint').hidden=false;}
function hide(){document.getElementById('exphint').hidden=true;}
/* BUG: instruction tied to hovering a non-focusable icon; field focus never reveals it. */
</script>` },

{ file:'case-05.html', dim:'focus-handler-on-wrong-event-mousedown', trigger:'#user', interaction:'focus', revealed:'#userhint', focusReveals:false,
  rationale:'The instruction is shown on mousedown of the field rather than focus; keyboard activation (Tab to focus) never fires mousedown, so the username rules never appear for keyboard users. The instruction is mouse-gated (3.3.2).',
  body:`  <h1>Pick a username</h1>
  <form onsubmit="return false">
    <div class="field"><label for="user">Username</label>
      <input id="user" type="text" onmousedown="show()">
      <div id="userhint" class="hint" hidden>3-20 chars; letters, digits, underscores only.</div></div>
    <button type="submit">Continue</button>
  </form>
<script>
function show(){document.getElementById('userhint').hidden=false;}
/* BUG: shown on mousedown only; keyboard focus never triggers it. */
</script>` },

{ file:'case-06.html', dim:'instruction-in-hover-only-popover-css', trigger:'#phone', interaction:'focus', revealed:'#phonehint', focusReveals:false,
  rationale:'CSS reveals the phone-format instruction on :hover of the field wrapper only (no :focus / :focus-within), so the required pattern appears for mouse users but never when a keyboard user focuses the field. Hover-gated instruction (3.3.2).',
  body:`  <h1>Contact</h1>
  <form onsubmit="return false">
    <div class="field" id="wrap"><label for="phone">Phone</label>
      <input id="phone" type="tel">
      <div id="phonehint" class="hint">Include country code, e.g. +1 555 123 4567.</div></div>
    <button type="submit">Submit</button>
  </form>
<style>#phonehint{display:none}#wrap:hover #phonehint{display:block}</style>
<!-- BUG: :hover-only reveal, no :focus/:focus-within -> keyboard focus never shows it. -->` },

{ file:'case-07.html', dim:'instruction-flashes-then-hidden-on-focus', trigger:'#otp', interaction:'focus', revealed:'#otphint', focusReveals:false,
  rationale:'On focus the instruction is shown then immediately hidden by a 0ms-style toggle bug (show then hide in the same handler), so a keyboard user effectively never reads it. The instruction is not reliably present in the focused state (3.3.2).',
  body:`  <h1>Verify</h1>
  <form onsubmit="return false">
    <div class="field"><label for="otp">One-time code</label>
      <input id="otp" type="text" inputmode="numeric" onfocus="flash()">
      <div id="otphint" class="hint" hidden>Enter the 6-digit code from your authenticator app.</div></div>
    <button type="submit">Verify</button>
  </form>
<script>
function flash(){var h=document.getElementById('otphint');h.hidden=false;h.hidden=true;/* BUG: shown then hidden in same tick -> never seen on focus. */}
</script>` },

{ file:'case-08.html', dim:'instruction-only-on-hover-of-label', trigger:'#amount', interaction:'focus', revealed:'#amthint', focusReveals:false,
  rationale:'The "no decimals" instruction is revealed on mouseover of the label text, not on field focus; keyboard users Tab straight to the input and never hover the label, so they miss the required constraint (3.3.2).',
  body:`  <h1>Donate</h1>
  <form onsubmit="return false">
    <div class="field"><label for="amount" onmouseover="show()" onmouseout="hide()">Amount (USD)</label>
      <input id="amount" type="text" inputmode="numeric">
      <div id="amthint" class="hint" hidden>Whole dollars only; do not include cents or commas.</div></div>
    <button type="submit">Give</button>
  </form>
<script>
function show(){document.getElementById('amthint').hidden=false;}
function hide(){document.getElementById('amthint').hidden=true;}
/* BUG: instruction tied to hovering the label; field focus does not reveal it. */
</script>` },

{ file:'case-09.html', dim:'aria-describedby-points-to-hidden-display-none', trigger:'#dob', interaction:'focus', revealed:'#dobhint', focusReveals:false,
  rationale:'The field has aria-describedby pointing to an instruction, but that element is display:none (not just visually hidden), so it is pruned from the accessibility tree and is announced to no one; on focus, neither sighted nor AT keyboard users get the date-format instruction (3.3.2).',
  body:`  <h1>Profile</h1>
  <form onsubmit="return false">
    <div class="field"><label for="dob">Date of birth</label>
      <input id="dob" type="text" aria-describedby="dobhint">
      <div id="dobhint" class="hint" style="display:none">Use DD/MM/YYYY.</div></div>
    <button type="submit">Save</button>
  </form>
<!-- BUG: described-by target is display:none -> pruned from a11y tree; nothing on focus. -->` },

{ file:'case-10.html', dim:'instruction-shown-on-hover-removed-on-focus', trigger:'#zip', interaction:'focus', revealed:'#ziphint', focusReveals:false,
  rationale:'The instruction shows on hover but a focus handler explicitly hides it (so mouse users who then focus also lose it, and keyboard-only users never see it). At the moment of focus the required postal-format instruction is gone (3.3.2).',
  body:`  <h1>Shipping</h1>
  <form onsubmit="return false">
    <div class="field"><label for="zip">Postal code</label>
      <input id="zip" type="text" onmouseover="show()" onfocus="hide()">
      <div id="ziphint" class="hint" hidden>UK format, e.g. SW1A 1AA.</div></div>
    <button type="submit">Continue</button>
  </form>
<script>
function show(){document.getElementById('ziphint').hidden=false;}
function hide(){document.getElementById('ziphint').hidden=true;}
/* BUG: hover shows it, focus hides it -> never present in the focused state. */
</script>` },

{ file:'case-11.html', dim:'required-format-only-in-placeholder-cleared', trigger:'#sn', interaction:'focus', revealed:'#sn', focusReveals:false,
  rationale:'The only place the required serial-number format appears is the placeholder, which is visually cleared as soon as the user starts typing and is not a reliable instruction; here a focus handler also blanks the placeholder, so on focus there is no instruction at all. Placeholder-as-instruction that vanishes on focus (3.3.2).',
  body:`  <h1>Register device</h1>
  <form onsubmit="return false">
    <div class="field"><label for="sn">Serial number</label>
      <input id="sn" type="text" placeholder="e.g. SN-0000-AAAA" onfocus="this.placeholder=''"></div>
    <button type="submit">Register</button>
  </form>
<!-- BUG: the format only existed as a placeholder, blanked on focus -> no instruction when typing. -->` },

{ file:'case-12.html', dim:'instruction-injected-on-mouseenter-only', trigger:'#vat', interaction:'focus', revealed:'#vathint', focusReveals:false,
  rationale:'The VAT-number instruction element does not exist until mouseenter injects it into the DOM; keyboard focus never injects it, so the instruction is structurally absent for keyboard users at focus time (3.3.2).',
  body:`  <h1>Billing</h1>
  <form onsubmit="return false">
    <div class="field"><label for="vat">VAT number</label>
      <input id="vat" type="text" onmouseenter="inject()"></div>
    <button type="submit">Save</button>
  </form>
<script>
function inject(){if(document.getElementById('vathint'))return;var d=document.createElement('div');d.id='vathint';d.className='hint';d.textContent='Country prefix + up to 12 digits, e.g. DE123456789.';document.querySelector('.field').appendChild(d);}
/* BUG: instruction is injected only on mouseenter; focus never creates it. */
</script>` },
];

const negatives = [
{ file:'case-13.html', dim:'instruction-shown-on-focus-js', trigger:'#pw', interaction:'focus', revealed:'#pwhint', focusReveals:true,
  rationale:'A focus handler reveals the password format instruction (and blur hides it), and hover also shows it, so a keyboard user Tabbing to the field sees the required rule. The instruction is available on keyboard focus (3.3.2 met).',
  body:`  <h1>Create account</h1>
  <form onsubmit="return false">
    <div class="field"><label for="pw">Password</label>
      <input id="pw" type="password" onfocus="show()" onblur="hide()" onmouseover="show()" onmouseout="hide()" aria-describedby="pwhint">
      <div id="pwhint" class="hint" hidden>Must be 12+ characters with a number and a symbol.</div></div>
    <button type="submit">Create</button>
  </form>
<script>
function show(){document.getElementById('pwhint').hidden=false;}
function hide(){document.getElementById('pwhint').hidden=true;}
</script>` },

{ file:'case-14.html', dim:'instruction-persistently-visible', trigger:'#code', interaction:'focus', revealed:'#codehint', focusReveals:true,
  rationale:'The promo-code format instruction is always visible below the field and not gated on any interaction, so it is present at focus and at all times. Persistent instruction satisfies 3.3.2.',
  body:`  <h1>Redeem</h1>
  <form onsubmit="return false">
    <div class="field"><label for="code">Promo code</label>
      <input id="code" type="text" aria-describedby="codehint">
      <div id="codehint" class="hint">Format: ABCD-1234 (4 letters, dash, 4 digits).</div></div>
    <button type="submit">Apply</button>
  </form>` },

{ file:'case-15.html', dim:'aria-describedby-visible-target-on-focus', trigger:'#iban', interaction:'focus', revealed:'#ibanhint', focusReveals:true,
  rationale:'The IBAN format is in a visible element referenced by aria-describedby, so it is announced when the field gets focus by an AT user and seen by sighted keyboard users. Programmatically associated, focus-available instruction (3.3.2 met).',
  body:`  <h1>Bank transfer</h1>
  <form onsubmit="return false">
    <div class="field"><label for="iban">IBAN</label>
      <input id="iban" type="text" aria-describedby="ibanhint">
      <div id="ibanhint" class="hint">2 letters, 2 digits, then up to 30 alphanumerics.</div></div>
    <button type="submit">Send</button>
  </form>` },

{ file:'case-16.html', dim:'instruction-on-focus-and-icon-focusable', trigger:'#exp', interaction:'focus', revealed:'#exphint', focusReveals:true,
  rationale:'Focusing the expiry field reveals the MM/YY instruction (focus handler), and the help icon is itself a focusable button that also reveals it; keyboard users get the instruction at the field. 3.3.2 met.',
  body:`  <h1>Card details</h1>
  <form onsubmit="return false">
    <div class="field"><label for="exp">Expiry</label>
      <input id="exp" type="text" onfocus="show()" onblur="hide()" aria-describedby="exphint">
      <button type="button" onfocus="show()" onmouseover="show()" onmouseout="hide()" aria-label="Format help">&#9432;</button>
      <div id="exphint" class="hint" hidden>Use MM/YY, e.g. 09/27.</div></div>
    <button type="submit">Save</button>
  </form>
<script>
function show(){document.getElementById('exphint').hidden=false;}
function hide(){document.getElementById('exphint').hidden=true;}
</script>` },

{ file:'case-17.html', dim:'instruction-on-focusin-delegated', trigger:'#user', interaction:'focus', revealed:'#userhint', focusReveals:true,
  rationale:'A focusin handler on the form (bubbling) reveals the username rules when the field is focused by keyboard or mouse, so the instruction reliably appears on focus. 3.3.2 met.',
  body:`  <h1>Pick a username</h1>
  <form onsubmit="return false" onfocusin="show()" onfocusout="hide()">
    <div class="field"><label for="user">Username</label>
      <input id="user" type="text" aria-describedby="userhint">
      <div id="userhint" class="hint" hidden>3-20 chars; letters, digits, underscores only.</div></div>
    <button type="submit">Continue</button>
  </form>
<script>
function show(){var h=document.getElementById('userhint');if(h)h.hidden=false;}
function hide(){var h=document.getElementById('userhint');if(h)h.hidden=true;}
</script>` },

{ file:'case-18.html', dim:'css-focus-within-reveals-instruction', trigger:'#phone', interaction:'focus', revealed:'#phonehint', focusReveals:true,
  rationale:'CSS reveals the phone-format instruction on both :hover and :focus-within of the field wrapper, so keyboard focus inside the wrapper shows it just like hover. Focus-available instruction (3.3.2 met).',
  body:`  <h1>Contact</h1>
  <form onsubmit="return false">
    <div class="field" id="wrap"><label for="phone">Phone</label>
      <input id="phone" type="tel" aria-describedby="phonehint">
      <div id="phonehint" class="hint">Include country code, e.g. +1 555 123 4567.</div></div>
    <button type="submit">Submit</button>
  </form>
<style>#phonehint{display:none}#wrap:hover #phonehint,#wrap:focus-within #phonehint{display:block}</style>` },

{ file:'case-19.html', dim:'instruction-stays-on-focus-no-flash', trigger:'#otp', interaction:'focus', revealed:'#otphint', focusReveals:true,
  rationale:'On focus the instruction is shown and stays shown (no immediate hide), so the keyboard user reads the 6-digit-code rule. Reliable focus reveal (3.3.2 met).',
  body:`  <h1>Verify</h1>
  <form onsubmit="return false">
    <div class="field"><label for="otp">One-time code</label>
      <input id="otp" type="text" inputmode="numeric" onfocus="show()" onblur="hide()" aria-describedby="otphint">
      <div id="otphint" class="hint" hidden>Enter the 6-digit code from your authenticator app.</div></div>
    <button type="submit">Verify</button>
  </form>
<script>
function show(){document.getElementById('otphint').hidden=false;}
function hide(){document.getElementById('otphint').hidden=true;}
</script>` },

{ file:'case-20.html', dim:'instruction-persistent-near-label', trigger:'#amount', interaction:'focus', revealed:'#amthint', focusReveals:true,
  rationale:'The "whole dollars only" instruction is rendered persistently right under the label/field, available at focus and always; no interaction gating. 3.3.2 met.',
  body:`  <h1>Donate</h1>
  <form onsubmit="return false">
    <div class="field"><label for="amount">Amount (USD)</label>
      <div id="amthint" class="hint">Whole dollars only; do not include cents or commas.</div>
      <input id="amount" type="text" inputmode="numeric" aria-describedby="amthint"></div>
    <button type="submit">Give</button>
  </form>` },

{ file:'case-21.html', dim:'describedby-visually-hidden-but-in-a11y-tree', trigger:'#dob', interaction:'focus', revealed:'#dobhint', focusReveals:true,
  rationale:'The date-format instruction uses a visually-hidden (clip) technique, NOT display:none, so it remains in the accessibility tree and is announced via aria-describedby when the field is focused; AT keyboard users get the instruction. 3.3.2 met (a visible label also present is not required when an associated instruction is announced).',
  body:`  <h1>Profile</h1>
  <form onsubmit="return false">
    <div class="field"><label for="dob">Date of birth</label>
      <input id="dob" type="text" aria-describedby="dobhint">
      <span id="dobhint" style="position:absolute;width:1px;height:1px;clip:rect(0 0 0 0);overflow:hidden">Use DD/MM/YYYY.</span>
      <div class="hint" aria-hidden="true">DD/MM/YYYY</div></div>
    <button type="submit">Save</button>
  </form>` },

{ file:'case-22.html', dim:'instruction-shown-on-focus-and-hover-zip', trigger:'#zip', interaction:'focus', revealed:'#ziphint', focusReveals:true,
  rationale:'Both focus and hover reveal the postal-code format, and focus does not hide it; the instruction is present in the focused state for keyboard users. 3.3.2 met.',
  body:`  <h1>Shipping</h1>
  <form onsubmit="return false">
    <div class="field"><label for="zip">Postal code</label>
      <input id="zip" type="text" onmouseover="show()" onmouseout="hide()" onfocus="show()" onblur="hide()" aria-describedby="ziphint">
      <div id="ziphint" class="hint" hidden>UK format, e.g. SW1A 1AA.</div></div>
    <button type="submit">Continue</button>
  </form>
<script>
function show(){document.getElementById('ziphint').hidden=false;}
function hide(){document.getElementById('ziphint').hidden=true;}
</script>` },

{ file:'case-23.html', dim:'placeholder-plus-persistent-instruction', trigger:'#sn', interaction:'focus', revealed:'#snhint', focusReveals:true,
  rationale:'Even though a placeholder example is present and clears on typing, a persistent associated instruction also states the serial format and remains at focus, so the required information does not depend on the placeholder. 3.3.2 met.',
  body:`  <h1>Register device</h1>
  <form onsubmit="return false">
    <div class="field"><label for="sn">Serial number</label>
      <input id="sn" type="text" placeholder="e.g. SN-0000-AAAA" aria-describedby="snhint">
      <div id="snhint" class="hint">Format: SN-, four digits, dash, four letters.</div></div>
    <button type="submit">Register</button>
  </form>` },

{ file:'case-24.html', dim:'instruction-injected-on-focus-too', trigger:'#vat', interaction:'focus', revealed:'#vathint', focusReveals:true,
  rationale:'The VAT instruction is injected on focusin (as well as mouseenter), so keyboard focus creates and shows the instruction element; the required information is present in the focused state. 3.3.2 met.',
  body:`  <h1>Billing</h1>
  <form onsubmit="return false">
    <div class="field"><label for="vat">VAT number</label>
      <input id="vat" type="text" onfocus="inject()" onmouseenter="inject()"></div>
    <button type="submit">Save</button>
  </form>
<script>
function inject(){if(document.getElementById('vathint'))return;var d=document.createElement('div');d.id='vathint';d.className='hint';d.textContent='Country prefix + up to 12 digits, e.g. DE123456789.';document.querySelector('.field').appendChild(d);document.getElementById('vat').setAttribute('aria-describedby','vathint');}
</script>` },
];

function emit(list, polarity, expected){
  return list.map(c=>{
    const html = HEAD(c.file.replace(/\D/g,''), polarity==='positive'?'POSITIVE':'NEGATIVE', c.dim) + '\n' + c.body + FOOT;
    fs.writeFileSync(path.join(DIR, c.file), html, 'utf8');
    return {
      file: c.file, expected, polarity, aspect:'focus-revealed-instruction', sc:'3.3.2',
      dimension: c.dim, triggerSelector: c.trigger, interaction: c.interaction,
      revealedSelector: c.revealed, expectFocusReturn: null, focusReveals: c.focusReveals, runnerShould:'decide',
      rationale: c.rationale,
      citation: '"Labels or instructions are provided when content requires user input." — WCAG 2.2 SC 3.3.2 Labels or Instructions. Understanding 3.3.2 Intent: "The intent of this success criterion is to have content authors present instructions or labels that identify the controls in a form so that users know what input data is expected."'
    };
  });
}

const labels = emit(positives,'positive','failed').concat(emit(negatives,'negative','passed'));
fs.writeFileSync(path.join(DIR,'labels.json'), JSON.stringify(labels, null, 2)+'\n','utf8');
console.log('focus-revealed-instruction: wrote', positives.length+negatives.length, 'html +', labels.length, 'labels (',positives.length,'pos /',negatives.length,'neg )');
