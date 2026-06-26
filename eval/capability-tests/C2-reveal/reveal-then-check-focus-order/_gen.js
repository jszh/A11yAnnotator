#!/usr/bin/env node
/* Generator: reveal-then-check-focus-order (SC 2.4.3 + Failure F85).
 * A trigger reveals content (menu/dialog/disclosure). The defect dimension is
 * focus order INTO and OUT of the revealed region:
 *   - focus not moved INTO the revealed dialog/menu on open (F85 positive)
 *   - focus not RETURNED to the trigger (or a sane place) on close (positive)
 *   - DOM order != visual/logical order inside the revealed region (positive)
 * Negatives correctly move focus in and return it, and keep DOM==visual order.
 *
 * Grounding (verbatim):
 *   SC 2.4.3 Focus Order: "If a web page can be navigated sequentially and the
 *   navigation sequences affect meaning or operation, focusable components
 *   receive focus in an order that preserves meaning and operability."
 *   F85: "Failure of Success Criterion 2.4.3 due to using dialogs or menus that
 *   are not adjacent to their trigger control in the sequential navigation order"
 */
const fs = require('fs');
const path = require('path');
const DIR = __dirname;

const HEAD = (n, pol, aspect, dim) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>2.4.3 reveal-then-check-focus-order case ${n}</title>
<style>
  body{font:16px/1.5 system-ui,sans-serif;margin:40px;max-width:640px;color:#1a1a1a}
  h1{font-size:20px}
  button,[role=button],[role=menuitem],a{font:inherit}
  button{padding:9px 16px;cursor:pointer;border:1px solid #555;background:#f4f4f4;border-radius:6px}
  .backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);display:none}
  .backdrop.open{display:block}
  [role=dialog],.dialog{position:fixed;top:18%;left:50%;transform:translateX(-50%);width:340px;background:#fff;border:1px solid #333;border-radius:8px;padding:18px;box-shadow:0 8px 30px rgba(0,0,0,.3)}
  [role=menu],.menu{list-style:none;margin:6px 0 0;padding:6px;border:1px solid #555;border-radius:8px;background:#fff;width:220px;box-shadow:0 6px 18px rgba(0,0,0,.2)}
  [role=menu] li,[role=menuitem]{padding:6px 10px;border-radius:5px;cursor:pointer}
  [role=menuitem]:focus,[role=menuitem]:hover{background:#e6eefc;outline:2px solid #2557d6}
  .disclosure{border:1px solid #bbb;padding:10px;margin-top:8px;background:#fafafa}
  :focus{outline:3px solid #2557d6;outline-offset:2px}
  .field{display:block;margin:8px 0}
  label{font-weight:600}
  input,textarea{font:inherit;padding:6px;border:1px solid #888;border-radius:5px;width:100%;box-sizing:border-box}
  [hidden]{display:none !important}
  .row{display:flex;gap:8px}
</style></head>
<body>
<!-- 2.4.3 ${pol} | ${aspect} | ${dim} -->`;
const FOOT = `\n</body></html>\n`;

// ---- POSITIVE cases (expected=failed) ----
const positives = [
{ file:'case-01.html', dim:'dialog-open-focus-not-moved-in', trigger:'#open', interaction:'click', revealed:'#dlg', expectReturn:false,
  rationale:'Clicking the trigger reveals a modal dialog, but focus is left on the trigger behind the backdrop; a keyboard/AT user is never moved into the dialog, so the next Tab continues in the obscured background page instead of the revealed region. This is the F85 INTO-region focus-order failure.',
  body:`  <h1>Account</h1>
  <button id="open" type="button" onclick="openDlg()">Edit profile</button>
  <a id="after" href="#x">Unrelated page link</a>
  <div id="bd" class="backdrop"></div>
  <div id="dlg" role="dialog" aria-modal="true" aria-labelledby="dt" hidden>
    <h2 id="dt" style="font-size:17px;margin-top:0">Edit profile</h2>
    <label class="field">Display name <input id="dn" type="text"></label>
    <div class="row"><button id="save" type="button">Save</button><button id="cancel" type="button" onclick="closeDlg()">Cancel</button></div>
  </div>
<script>
function openDlg(){document.getElementById('bd').classList.add('open');document.getElementById('dlg').hidden=false;
  /* BUG: dialog revealed but focus is NEVER moved into it; it stays on #open. */}
function closeDlg(){document.getElementById('bd').classList.remove('open');document.getElementById('dlg').hidden=true;}
</script>` },

{ file:'case-02.html', dim:'dialog-close-focus-not-returned', trigger:'#open', interaction:'click', revealed:'#dlg', expectReturn:true,
  rationale:'Focus is correctly moved into the dialog on open, but on close (Cancel) focus is dropped to document.body instead of being returned to the triggering control; the keyboard user is dumped at the top of the page, losing their place. This is the F85 OUT-of-region focus-order failure.',
  body:`  <h1>Settings</h1>
  <button id="open" type="button" onclick="openDlg()">Open settings</button>
  <div id="bd" class="backdrop"></div>
  <div id="dlg" role="dialog" aria-modal="true" aria-labelledby="dt" hidden>
    <h2 id="dt" style="font-size:17px;margin-top:0">Settings</h2>
    <label class="field">Theme <input id="th" type="text"></label>
    <button id="cancel" type="button" onclick="closeDlg()">Close</button>
  </div>
<script>
var trig=null;
function openDlg(){trig=document.activeElement;document.getElementById('bd').classList.add('open');var d=document.getElementById('dlg');d.hidden=false;document.getElementById('th').focus();}
function closeDlg(){document.getElementById('bd').classList.remove('open');document.getElementById('dlg').hidden=true;
  /* BUG: focus is NOT returned to the trigger; it falls back to body. */}
</script>` },

{ file:'case-03.html', dim:'menu-open-focus-not-moved-in', trigger:'#mbtn', interaction:'key:ArrowDown', revealed:'#menu', expectReturn:false,
  rationale:'A menu button reveals a role=menu on ArrowDown, but focus is never placed on the first menuitem; the APG menu pattern requires focus to move into the menu, and without it the next Tab leaves the menu un-entered. INTO-region focus-order failure.',
  body:`  <h1>Document</h1>
  <button id="mbtn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="menu" onkeydown="onKey(event)" onclick="toggle()">Actions ▾</button>
  <ul id="menu" role="menu" aria-labelledby="mbtn" hidden>
    <li role="menuitem" tabindex="-1">Rename</li>
    <li role="menuitem" tabindex="-1">Duplicate</li>
    <li role="menuitem" tabindex="-1">Delete</li>
  </ul>
<script>
function open(){document.getElementById('menu').hidden=false;document.getElementById('mbtn').setAttribute('aria-expanded','true');
  /* BUG: menu revealed but focus is NOT moved to the first menuitem. */}
function toggle(){var m=document.getElementById('menu');if(m.hidden)open();else{m.hidden=true;document.getElementById('mbtn').setAttribute('aria-expanded','false');}}
function onKey(e){if(e.key==='ArrowDown'){e.preventDefault();open();}}
</script>` },

{ file:'case-04.html', dim:'revealed-region-dom-order-not-visual', trigger:'#open', interaction:'click', revealed:'#dlg', expectReturn:false,
  rationale:'Focus is moved into the revealed dialog, but the DOM/tab order of its controls (Submit, then Back, then the name field) does not match the visual/logical reading order (name field, then Back, then Submit) because of positive tabindex and reversed source order, so sequential focus does not preserve meaning. SC 2.4.3 order failure within the revealed region.',
  body:`  <h1>Checkout</h1>
  <button id="open" type="button" onclick="openDlg()">Confirm order</button>
  <div id="bd" class="backdrop"></div>
  <div id="dlg" role="dialog" aria-modal="true" aria-labelledby="dt" hidden>
    <h2 id="dt" style="font-size:17px;margin-top:0">Confirm order</h2>
    <!-- visual order: name field, Back, Submit ; but tabindex forces Submit->Back->field -->
    <label class="field">Name on card <input id="nm" type="text" tabindex="3"></label>
    <div class="row"><button id="back" type="button" tabindex="2" onclick="closeDlg()">Back</button><button id="submit" type="button" tabindex="1">Submit</button></div>
  </div>
<script>
function openDlg(){document.getElementById('bd').classList.add('open');var d=document.getElementById('dlg');d.hidden=false;document.getElementById('submit').focus();
  /* BUG: positive tabindex makes focus go Submit(1)->Back(2)->name(3), reversed vs visual order. */}
function closeDlg(){document.getElementById('bd').classList.remove('open');document.getElementById('dlg').hidden=true;}
</script>` },

{ file:'case-05.html', dim:'disclosure-revealed-controls-not-in-sequence', trigger:'#disc', interaction:'click', revealed:'#panel', expectReturn:false,
  rationale:'The disclosure reveals a panel of controls, but the revealed panel is appended to the END of <body> (DOM order) while it appears visually right below the trigger; the next Tab after the trigger therefore jumps over the freshly revealed controls to unrelated footer links. F85: revealed content is not adjacent to its trigger in the navigation order.',
  body:`  <h1>Shipping</h1>
  <button id="disc" type="button" aria-expanded="false" aria-controls="panel" onclick="toggle()">Add delivery instructions ▾</button>
  <p><a id="foot" href="#x">Unrelated footer link</a></p>
  <div id="anchor"></div>
<script>
var open=false;
function toggle(){open=!open;var d=document.getElementById('disc');d.setAttribute('aria-expanded',String(open));
  var ex=document.getElementById('panel');
  if(open){if(!ex){var p=document.createElement('div');p.id='panel';p.className='disclosure';
      p.innerHTML='<label class="field">Instructions <input id="ins" type="text"></label><button id="savep" type="button">Save</button>';
      /* BUG: appended to end of <body>, AFTER #foot, so it is not adjacent to its trigger in tab order. */
      document.body.appendChild(p);}
    else ex.hidden=false;}
  else if(ex)ex.hidden=true;}
</script>` },

{ file:'case-06.html', dim:'dialog-focus-moves-to-backdrop-not-content', trigger:'#open', interaction:'click', revealed:'#dlg', expectReturn:false,
  rationale:'On open, focus is moved to the non-interactive backdrop element (tabindex=-1, programmatically focused) rather than to a control or heading inside the dialog, and the backdrop is then the only thing focused; pressing Tab from there continues into the obscured background page, not the dialog. INTO-region focus-order failure.',
  body:`  <h1>Newsletter</h1>
  <button id="open" type="button" onclick="openDlg()">Subscribe</button>
  <a id="after" href="#x">Background link</a>
  <div id="bd" class="backdrop" tabindex="-1"></div>
  <div id="dlg" role="dialog" aria-modal="true" aria-labelledby="dt" hidden>
    <h2 id="dt" style="font-size:17px;margin-top:0">Subscribe</h2>
    <label class="field">Email <input id="em" type="email"></label>
    <button id="go" type="button">Sign up</button>
    <button id="cancel" type="button" onclick="closeDlg()">Cancel</button>
  </div>
<script>
function openDlg(){var bd=document.getElementById('bd');bd.classList.add('open');document.getElementById('dlg').hidden=false;bd.focus();
  /* BUG: focus goes to the backdrop, not into the dialog; Tab leaks to the background page. */}
function closeDlg(){document.getElementById('bd').classList.remove('open');document.getElementById('dlg').hidden=true;}
</script>` },

{ file:'case-07.html', dim:'menu-close-focus-not-returned', trigger:'#mbtn', interaction:'click', revealed:'#menu', expectReturn:true,
  rationale:'The menu opens and focus correctly enters the first menuitem, but on Escape/selection the menu closes and focus is NOT returned to the menu button (it is left on the now-hidden, display:none menuitem, i.e. lost to body). APG requires focus to return to the trigger on close; OUT-of-region focus-order failure.',
  body:`  <h1>Files</h1>
  <button id="mbtn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="menu" onclick="toggle()">Sort ▾</button>
  <ul id="menu" role="menu" aria-labelledby="mbtn" hidden>
    <li id="mi1" role="menuitem" tabindex="-1" onkeydown="mk(event)">Name</li>
    <li id="mi2" role="menuitem" tabindex="-1" onkeydown="mk(event)">Date</li>
  </ul>
<script>
function open(){var m=document.getElementById('menu');m.hidden=false;document.getElementById('mbtn').setAttribute('aria-expanded','true');document.getElementById('mi1').focus();}
function close(){var m=document.getElementById('menu');m.hidden=true;document.getElementById('mbtn').setAttribute('aria-expanded','false');
  /* BUG: focus is NOT restored to #mbtn on close; it is lost to body when the menuitem hides. */}
function toggle(){var m=document.getElementById('menu');if(m.hidden)open();else close();}
function mk(e){if(e.key==='Escape')close();}
</script>` },

{ file:'case-08.html', dim:'nested-reveal-focus-stranded-after-step', trigger:'#open', interaction:'click', revealed:'#step2', expectReturn:false,
  rationale:'A two-step revealed flow: opening step 1 moves focus in correctly, but advancing to step 2 hides step 1 (display:none) WITHOUT moving focus to step 2, so focus is on a now-hidden Next button and the next Tab restarts at the top of the page rather than continuing into the revealed step-2 controls. INTO-region order failure on the second reveal.',
  body:`  <h1>Wizard</h1>
  <button id="open" type="button" onclick="openStep1()">Start</button>
  <div id="bd" class="backdrop"></div>
  <div id="step1" role="dialog" aria-modal="true" aria-labelledby="s1t" hidden>
    <h2 id="s1t" style="font-size:17px;margin-top:0">Step 1</h2>
    <label class="field">First name <input id="fn" type="text"></label>
    <button id="next" type="button" onclick="goStep2()">Next</button>
  </div>
  <div id="step2" role="dialog" aria-modal="true" aria-labelledby="s2t" hidden>
    <h2 id="s2t" style="font-size:17px;margin-top:0">Step 2</h2>
    <label class="field">Last name <input id="ln" type="text"></label>
    <button id="fin" type="button" onclick="closeAll()">Finish</button>
  </div>
<script>
function openStep1(){document.getElementById('bd').classList.add('open');var d=document.getElementById('step1');d.hidden=false;document.getElementById('fn').focus();}
function goStep2(){document.getElementById('step1').hidden=true;document.getElementById('step2').hidden=false;
  /* BUG: step 2 revealed but focus is NOT moved into it; it stays on the now-hidden Next button. */}
function closeAll(){document.getElementById('bd').classList.remove('open');document.getElementById('step1').hidden=true;document.getElementById('step2').hidden=true;}
</script>` },

{ file:'case-09.html', dim:'revealed-dialog-tab-order-reversed-flex', trigger:'#open', interaction:'click', revealed:'#dlg', expectReturn:false,
  rationale:'Focus enters the dialog, but its action buttons are laid out with CSS flex-direction:row-reverse so the visual order is Confirm then Cancel, while the DOM/tab order is Cancel then Confirm; sequential focus does not match the visual sequence, so it does not preserve meaning/operability inside the revealed region (SC 2.4.3).',
  body:`  <h1>Delete item</h1>
  <button id="open" type="button" onclick="openDlg()">Delete</button>
  <div id="bd" class="backdrop"></div>
  <div id="dlg" role="dialog" aria-modal="true" aria-labelledby="dt" hidden>
    <h2 id="dt" style="font-size:17px;margin-top:0">Delete item?</h2>
    <p>This cannot be undone.</p>
    <div class="row" style="flex-direction:row-reverse;justify-content:flex-end">
      <button id="confirm" type="button">Confirm delete</button>
      <button id="cancel" type="button" onclick="closeDlg()">Cancel</button>
    </div>
  </div>
<script>
function openDlg(){document.getElementById('bd').classList.add('open');var d=document.getElementById('dlg');d.hidden=false;document.getElementById('cancel').focus();
  /* BUG: row-reverse shows Confirm before Cancel visually, but tab order is Cancel->Confirm. */}
function closeDlg(){document.getElementById('bd').classList.remove('open');document.getElementById('dlg').hidden=true;}
</script>` },

{ file:'case-10.html', dim:'focus-triggered-reveal-focus-not-managed', trigger:'#email', interaction:'focus', revealed:'#hint', expectReturn:false,
  rationale:'Focusing the email field reveals a panel containing an interactive "Use saved email" button, but focus stays on the field and the revealed button is inserted in DOM AFTER the form submit button, so the next Tab skips the revealed action and lands on Submit. A focus-triggered reveal whose new interactive content is out of sequence (F85).',
  body:`  <h1>Sign in</h1>
  <form onsubmit="return false">
    <label class="field">Email <input id="email" type="email" onfocus="reveal()"></label>
    <button id="submit" type="submit">Continue</button>
  </form>
  <div id="sink"></div>
<script>
function reveal(){if(document.getElementById('hint'))return;var p=document.createElement('div');p.id='hint';p.className='disclosure';
  p.innerHTML='<button id="saved" type="button">Use saved email</button>';
  /* BUG: revealed interactive content appended at end of body, AFTER #submit, so Tab order skips it. */
  document.body.appendChild(p);}
</script>` },

{ file:'case-11.html', dim:'dialog-focus-moved-to-heading-with-no-tabindex', trigger:'#open', interaction:'click', revealed:'#dlg', expectReturn:false,
  rationale:'On open the code calls focus() on the dialog heading <h2> which has no tabindex and is not focusable, so focus silently stays on the trigger behind the backdrop; the call is a no-op and focus never actually enters the revealed dialog. INTO-region focus-order failure masquerading as managed.',
  body:`  <h1>Comments</h1>
  <button id="open" type="button" onclick="openDlg()">Reply</button>
  <a id="after" href="#x">Background link</a>
  <div id="bd" class="backdrop"></div>
  <div id="dlg" role="dialog" aria-modal="true" aria-labelledby="dt" hidden>
    <h2 id="dt" style="font-size:17px;margin-top:0">Reply</h2>
    <label class="field">Comment <textarea id="cm" rows="3"></textarea></label>
    <button id="post" type="button">Post</button>
    <button id="cancel" type="button" onclick="closeDlg()">Cancel</button>
  </div>
<script>
function openDlg(){document.getElementById('bd').classList.add('open');var d=document.getElementById('dlg');d.hidden=false;
  document.getElementById('dt').focus(); /* BUG: heading has no tabindex; focus() is a no-op, focus stays on #open. */}
function closeDlg(){document.getElementById('bd').classList.remove('open');document.getElementById('dlg').hidden=true;}
</script>` },

{ file:'case-12.html', dim:'menuitem-visual-order-differs-from-dom', trigger:'#mbtn', interaction:'click', revealed:'#menu', expectReturn:false,
  rationale:'The revealed menu visually orders items Cut, Copy, Paste (via CSS order on flex items), but the DOM/arrow-key order is Paste, Copy, Cut; a sighted keyboard user arrowing through the menu gets items in the reverse of the visual sequence, so the navigation order does not preserve meaning within the revealed region (SC 2.4.3).',
  body:`  <h1>Editor</h1>
  <button id="mbtn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="menu" onclick="toggle()">Edit ▾</button>
  <ul id="menu" role="menu" aria-labelledby="mbtn" style="display:flex;flex-direction:column" hidden>
    <li id="mi1" role="menuitem" tabindex="-1" style="order:3">Paste</li>
    <li id="mi2" role="menuitem" tabindex="-1" style="order:2">Copy</li>
    <li id="mi3" role="menuitem" tabindex="-1" style="order:1">Cut</li>
  </ul>
<script>
function toggle(){var m=document.getElementById('menu');if(m.hidden){m.hidden=false;document.getElementById('mbtn').setAttribute('aria-expanded','true');document.getElementById('mi1').focus();}
  else{m.hidden=true;document.getElementById('mbtn').setAttribute('aria-expanded','false');}
  /* BUG: CSS order shows Cut,Copy,Paste but DOM/arrow order is Paste,Copy,Cut. */}
</script>` },
];

// ---- NEGATIVE cases (expected=passed) ----
const negatives = [
{ file:'case-13.html', dim:'dialog-open-focus-moved-in', trigger:'#open', interaction:'click', revealed:'#dlg', expectReturn:false,
  rationale:'On open, focus is correctly moved to the first interactive control inside the revealed dialog, so sequential focus enters the revealed region; the next Tab stays within the dialog. Focus order INTO the region is preserved.',
  body:`  <h1>Account</h1>
  <button id="open" type="button" onclick="openDlg()">Edit profile</button>
  <div id="bd" class="backdrop"></div>
  <div id="dlg" role="dialog" aria-modal="true" aria-labelledby="dt" hidden>
    <h2 id="dt" style="font-size:17px;margin-top:0">Edit profile</h2>
    <label class="field">Display name <input id="dn" type="text"></label>
    <button id="save" type="button">Save</button>
    <button id="cancel" type="button" onclick="closeDlg()">Cancel</button>
  </div>
<script>
function openDlg(){document.getElementById('bd').classList.add('open');var d=document.getElementById('dlg');d.hidden=false;document.getElementById('dn').focus();}
function closeDlg(){document.getElementById('bd').classList.remove('open');document.getElementById('dlg').hidden=true;}
</script>` },

{ file:'case-14.html', dim:'dialog-close-focus-returned', trigger:'#open', interaction:'click', revealed:'#dlg', expectReturn:true,
  rationale:'Focus moves into the dialog on open, and on close the saved trigger reference is re-focused, so the keyboard user is returned to where they were. Both INTO and OUT-of-region focus order are preserved.',
  body:`  <h1>Settings</h1>
  <button id="open" type="button" onclick="openDlg()">Open settings</button>
  <div id="bd" class="backdrop"></div>
  <div id="dlg" role="dialog" aria-modal="true" aria-labelledby="dt" hidden>
    <h2 id="dt" style="font-size:17px;margin-top:0">Settings</h2>
    <label class="field">Theme <input id="th" type="text"></label>
    <button id="cancel" type="button" onclick="closeDlg()">Close</button>
  </div>
<script>
var trig=null;
function openDlg(){trig=document.getElementById('open');document.getElementById('bd').classList.add('open');var d=document.getElementById('dlg');d.hidden=false;document.getElementById('th').focus();}
function closeDlg(){document.getElementById('bd').classList.remove('open');document.getElementById('dlg').hidden=true;if(trig)trig.focus();}
</script>` },

{ file:'case-15.html', dim:'menu-open-focus-moved-to-first-item', trigger:'#mbtn', interaction:'key:ArrowDown', revealed:'#menu', expectReturn:false,
  rationale:'ArrowDown opens the menu and moves focus to the first menuitem per the APG menu pattern, so focus enters the revealed region in order. The roving tabindex keeps exactly one item focusable.',
  body:`  <h1>Document</h1>
  <button id="mbtn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="menu" onkeydown="onKey(event)" onclick="toggle()">Actions ▾</button>
  <ul id="menu" role="menu" aria-labelledby="mbtn" hidden>
    <li id="mi1" role="menuitem" tabindex="-1">Rename</li>
    <li id="mi2" role="menuitem" tabindex="-1">Duplicate</li>
    <li id="mi3" role="menuitem" tabindex="-1">Delete</li>
  </ul>
<script>
function open(){document.getElementById('menu').hidden=false;document.getElementById('mbtn').setAttribute('aria-expanded','true');document.getElementById('mi1').focus();}
function toggle(){var m=document.getElementById('menu');if(m.hidden)open();else{m.hidden=true;document.getElementById('mbtn').setAttribute('aria-expanded','false');}}
function onKey(e){if(e.key==='ArrowDown'){e.preventDefault();open();}}
</script>` },

{ file:'case-16.html', dim:'revealed-region-dom-matches-visual-order', trigger:'#open', interaction:'click', revealed:'#dlg', expectReturn:false,
  rationale:'Focus enters the dialog and the controls are in natural DOM order with no positive tabindex, so the tab order (name field, then Back, then Submit) matches the visual reading order. Order within the revealed region preserves meaning.',
  body:`  <h1>Checkout</h1>
  <button id="open" type="button" onclick="openDlg()">Confirm order</button>
  <div id="bd" class="backdrop"></div>
  <div id="dlg" role="dialog" aria-modal="true" aria-labelledby="dt" hidden>
    <h2 id="dt" style="font-size:17px;margin-top:0">Confirm order</h2>
    <label class="field">Name on card <input id="nm" type="text"></label>
    <div class="row"><button id="back" type="button" onclick="closeDlg()">Back</button><button id="submit" type="button">Submit</button></div>
  </div>
<script>
function openDlg(){document.getElementById('bd').classList.add('open');var d=document.getElementById('dlg');d.hidden=false;document.getElementById('nm').focus();}
function closeDlg(){document.getElementById('bd').classList.remove('open');document.getElementById('dlg').hidden=true;}
</script>` },

{ file:'case-17.html', dim:'disclosure-revealed-content-adjacent-in-dom', trigger:'#disc', interaction:'click', revealed:'#panel', expectReturn:false,
  rationale:'The disclosure reveals a panel that is the immediate next sibling of its trigger in the DOM (toggled via hidden), so it sits adjacent to the trigger in the sequential navigation order; the next Tab after the trigger enters the revealed controls. F85 is avoided.',
  body:`  <h1>Shipping</h1>
  <button id="disc" type="button" aria-expanded="false" aria-controls="panel" onclick="toggle()">Add delivery instructions ▾</button>
  <div id="panel" class="disclosure" hidden>
    <label class="field">Instructions <input id="ins" type="text"></label>
    <button id="savep" type="button">Save</button>
  </div>
  <p><a id="foot" href="#x">Unrelated footer link</a></p>
<script>
var open=false;
function toggle(){open=!open;document.getElementById('disc').setAttribute('aria-expanded',String(open));document.getElementById('panel').hidden=!open;}
</script>` },

{ file:'case-18.html', dim:'dialog-focus-moved-to-content-heading-tabindex', trigger:'#open', interaction:'click', revealed:'#dlg', expectReturn:false,
  rationale:'On open, focus is moved to the dialog heading which is given tabindex="-1" so it is programmatically focusable; focus genuinely enters the revealed region and the next Tab proceeds to the first control inside the dialog. INTO-region order preserved.',
  body:`  <h1>Comments</h1>
  <button id="open" type="button" onclick="openDlg()">Reply</button>
  <div id="bd" class="backdrop"></div>
  <div id="dlg" role="dialog" aria-modal="true" aria-labelledby="dt" hidden>
    <h2 id="dt" tabindex="-1" style="font-size:17px;margin-top:0">Reply</h2>
    <label class="field">Comment <textarea id="cm" rows="3"></textarea></label>
    <button id="post" type="button">Post</button>
    <button id="cancel" type="button" onclick="closeDlg()">Cancel</button>
  </div>
<script>
function openDlg(){document.getElementById('bd').classList.add('open');var d=document.getElementById('dlg');d.hidden=false;document.getElementById('dt').focus();}
function closeDlg(){document.getElementById('bd').classList.remove('open');document.getElementById('dlg').hidden=true;}
</script>` },

{ file:'case-19.html', dim:'menu-close-focus-returned-to-trigger', trigger:'#mbtn', interaction:'click', revealed:'#menu', expectReturn:true,
  rationale:'The menu opens with focus on the first item, and on Escape/close the menu button is re-focused, so focus correctly returns to the trigger out of the revealed region. APG return-focus behavior is satisfied.',
  body:`  <h1>Files</h1>
  <button id="mbtn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="menu" onclick="toggle()">Sort ▾</button>
  <ul id="menu" role="menu" aria-labelledby="mbtn" hidden>
    <li id="mi1" role="menuitem" tabindex="-1" onkeydown="mk(event)">Name</li>
    <li id="mi2" role="menuitem" tabindex="-1" onkeydown="mk(event)">Date</li>
  </ul>
<script>
function open(){document.getElementById('menu').hidden=false;document.getElementById('mbtn').setAttribute('aria-expanded','true');document.getElementById('mi1').focus();}
function close(){document.getElementById('menu').hidden=true;document.getElementById('mbtn').setAttribute('aria-expanded','false');document.getElementById('mbtn').focus();}
function toggle(){var m=document.getElementById('menu');if(m.hidden)open();else close();}
function mk(e){if(e.key==='Escape')close();}
</script>` },

{ file:'case-20.html', dim:'two-step-reveal-focus-moves-each-step', trigger:'#open', interaction:'click', revealed:'#step2', expectReturn:false,
  rationale:'Both reveal steps manage focus: opening step 1 focuses its field, and advancing to step 2 hides step 1 and moves focus into step 2 before it becomes the active region. Focus order INTO each revealed sub-region is preserved.',
  body:`  <h1>Wizard</h1>
  <button id="open" type="button" onclick="openStep1()">Start</button>
  <div id="bd" class="backdrop"></div>
  <div id="step1" role="dialog" aria-modal="true" aria-labelledby="s1t" hidden>
    <h2 id="s1t" style="font-size:17px;margin-top:0">Step 1</h2>
    <label class="field">First name <input id="fn" type="text"></label>
    <button id="next" type="button" onclick="goStep2()">Next</button>
  </div>
  <div id="step2" role="dialog" aria-modal="true" aria-labelledby="s2t" hidden>
    <h2 id="s2t" style="font-size:17px;margin-top:0">Step 2</h2>
    <label class="field">Last name <input id="ln" type="text"></label>
    <button id="fin" type="button" onclick="closeAll()">Finish</button>
  </div>
<script>
function openStep1(){document.getElementById('bd').classList.add('open');var d=document.getElementById('step1');d.hidden=false;document.getElementById('fn').focus();}
function goStep2(){document.getElementById('step1').hidden=true;var s=document.getElementById('step2');s.hidden=false;document.getElementById('ln').focus();}
function closeAll(){document.getElementById('bd').classList.remove('open');document.getElementById('step1').hidden=true;document.getElementById('step2').hidden=true;}
</script>` },

{ file:'case-21.html', dim:'dialog-action-buttons-visual-equals-tab-order', trigger:'#open', interaction:'click', revealed:'#dlg', expectReturn:false,
  rationale:'Focus enters the dialog and the action buttons use normal flex (no row-reverse, no positive tabindex), so the visual order Cancel then Confirm equals the tab order. The revealed region preserves meaning and operability.',
  body:`  <h1>Delete item</h1>
  <button id="open" type="button" onclick="openDlg()">Delete</button>
  <div id="bd" class="backdrop"></div>
  <div id="dlg" role="dialog" aria-modal="true" aria-labelledby="dt" hidden>
    <h2 id="dt" style="font-size:17px;margin-top:0">Delete item?</h2>
    <p>This cannot be undone.</p>
    <div class="row">
      <button id="cancel" type="button" onclick="closeDlg()">Cancel</button>
      <button id="confirm" type="button">Confirm delete</button>
    </div>
  </div>
<script>
function openDlg(){document.getElementById('bd').classList.add('open');var d=document.getElementById('dlg');d.hidden=false;document.getElementById('cancel').focus();}
function closeDlg(){document.getElementById('bd').classList.remove('open');document.getElementById('dlg').hidden=true;}
</script>` },

{ file:'case-22.html', dim:'focus-triggered-reveal-content-in-sequence', trigger:'#email', interaction:'focus', revealed:'#hint', expectReturn:false,
  rationale:'Focusing the email field reveals a panel inserted as the immediate next sibling of the field (between the field and Submit), so the next Tab from the field reaches the revealed "Use saved email" button before Submit. The focus-triggered reveal keeps revealed content in logical sequence.',
  body:`  <h1>Sign in</h1>
  <form onsubmit="return false">
    <label class="field">Email <input id="email" type="email" onfocus="reveal()"></label>
    <div id="slot"></div>
    <button id="submit" type="submit">Continue</button>
  </form>
<script>
function reveal(){if(document.getElementById('hint'))return;var p=document.createElement('div');p.id='hint';p.className='disclosure';
  p.innerHTML='<button id="saved" type="button">Use saved email</button>';
  document.getElementById('slot').appendChild(p); /* inserted between field and Submit -> in sequence */}
</script>` },

{ file:'case-23.html', dim:'menu-arrow-and-visual-order-match', trigger:'#mbtn', interaction:'click', revealed:'#menu', expectReturn:false,
  rationale:'The revealed menu has no CSS order overrides, so the arrow-key/DOM order (Cut, Copy, Paste) matches the visual order. Sequential navigation within the revealed region preserves meaning.',
  body:`  <h1>Editor</h1>
  <button id="mbtn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="menu" onclick="toggle()">Edit ▾</button>
  <ul id="menu" role="menu" aria-labelledby="mbtn" hidden>
    <li id="mi1" role="menuitem" tabindex="-1">Cut</li>
    <li id="mi2" role="menuitem" tabindex="-1">Copy</li>
    <li id="mi3" role="menuitem" tabindex="-1">Paste</li>
  </ul>
<script>
function toggle(){var m=document.getElementById('menu');if(m.hidden){m.hidden=false;document.getElementById('mbtn').setAttribute('aria-expanded','true');document.getElementById('mi1').focus();}
  else{m.hidden=true;document.getElementById('mbtn').setAttribute('aria-expanded','false');}}
</script>` },

{ file:'case-24.html', dim:'native-details-summary-adjacent-order', trigger:'#sum', interaction:'click', revealed:'#dcontent', expectReturn:false,
  rationale:'A native <details>/<summary> disclosure reveals content that is, by the platform, the immediate next content after the summary in the navigation order; expanding it places the revealed controls adjacent to the trigger, so focus order into the revealed region is correct with no scripting.',
  body:`  <h1>FAQ</h1>
  <details id="d">
    <summary id="sum">Billing options</summary>
    <div id="dcontent" class="disclosure">
      <label class="field">Promo code <input id="promo" type="text"></label>
      <button id="apply" type="button">Apply</button>
    </div>
  </details>
  <p><a id="foot" href="#x">Next section</a></p>` },
];

function emit(list, polarity, expected){
  return list.map(c=>{
    const html = HEAD(c.file.replace(/\D/g,''), polarity==='positive'?'POSITIVE':'NEGATIVE', 'reveal-then-check-focus-order', c.dim) + '\n' + c.body + FOOT;
    fs.writeFileSync(path.join(DIR, c.file), html, 'utf8');
    return {
      file: c.file, expected, polarity, aspect:'reveal-then-check-focus-order', sc:'2.4.3',
      dimension: c.dim, triggerSelector: c.trigger, interaction: c.interaction,
      revealedSelector: c.revealed, expectFocusReturn: c.expectReturn, runnerShould:'decide',
      rationale: c.rationale,
      citation: '"If a web page can be navigated sequentially and the navigation sequences affect meaning or operation, focusable components receive focus in an order that preserves meaning and operability." — WCAG 2.2 SC 2.4.3 Focus Order; Failure F85 "Failure of Success Criterion 2.4.3 due to using dialogs or menus that are not adjacent to their trigger control in the sequential navigation order"'
    };
  });
}

const labels = emit(positives,'positive','failed').concat(emit(negatives,'negative','passed'));
fs.writeFileSync(path.join(DIR,'labels.json'), JSON.stringify(labels, null, 2)+'\n','utf8');
console.log('reveal-then-check-focus-order: wrote', positives.length+negatives.length, 'html +', labels.length, 'labels (',positives.length,'pos /',negatives.length,'neg )');
