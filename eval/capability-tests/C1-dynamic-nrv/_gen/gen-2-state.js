'use strict';
const { writeCases } = require('./shared');

const C_412 = '"states, properties, and values that can be set by the user can be programmatically set; and notification of changes to these items is available to user agents, including assistive technology." — WCAG 2.2 SC 4.1.2 Name, Role, Value';
const C_PRESSED = '"ARIA: aria-pressed (state) ... Indicates the current "pressed" state of a toggle button." — for a toggle button the pressed state must be programmatically set to match the visible state (WCAG 2.2 4.1.2 / ARIA Authoring Practices toggle button)';
const C_EXPANDED = '"ARIA: aria-expanded (state) ... Indicates whether ... element is currently expanded or collapsed." — the expanded state must be programmatically set to match the disclosure\'s visible state (WCAG 2.2 4.1.2)';
const C_CHECKED = '"ARIA: aria-checked (state) ... Indicates the current "checked" state of checkboxes, radio buttons, and other widgets." — the checked state must reflect the user-set value (WCAG 2.2 4.1.2)';
const C_F68 = '"F68: Failure of Success Criterion 4.1.2 due to a user interface control not having a programmatically determinable name" — a control\'s state, like its name, must be programmatically exposed and kept current';

const cases = [];

// ---------- POSITIVES (12) ----------

// P1: toggle button: visual pressed (class .on) flips but aria-pressed never changes from false.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'aria-pressed-never-flips',
  h1: 'Bold', targetSelector: '#b', activation: 'click',
  body: `  <button id="b" type="button" aria-pressed="false" onclick="go()">Bold</button>`,
  script: `var on=false;function go(){on=!on;document.getElementById('b').classList.toggle('on',on);
  /* BUG: visual pressed state toggles via .on class but aria-pressed stays "false" forever. */}`,
  rationale: 'The button visually depresses on click (the .on class), but aria-pressed never changes from "false", so AT always reports the toggle as off even when it is visually on. The resting state is correct; only re-reading aria-pressed after activation exposes the frozen state.',
  citation: C_PRESSED
});

// P2: aria-pressed set once to true but never back: contradicts after second activation.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'aria-pressed-one-way-only',
  h1: 'Mute', targetSelector: '#m', activation: 'click',
  body: `  <button id="m" type="button" aria-pressed="false" onclick="go()">Mute</button>`,
  script: `var on=false;function go(){on=!on;var b=document.getElementById('m');b.classList.toggle('on',on);
  if(on)b.setAttribute('aria-pressed','true');
  /* BUG: aria-pressed is set true on press but never reset to false on un-press, so after the 2nd click it visually un-presses while aria-pressed stays true. */}`,
  rationale: 'aria-pressed is set true on the first activation but never reset, so after a second activation the button is visually un-pressed while aria-pressed still reports true. The contradiction emerges only after repeated activation, which the interaction-diff must drive.',
  citation: C_PRESSED
});

// P3: aria-expanded contradicts: panel opens but aria-expanded stays false.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'aria-expanded-stays-false',
  h1: 'Menu', targetSelector: '#mb', activation: 'click',
  body: `  <button id="mb" type="button" aria-expanded="false" aria-controls="mn" onclick="go()">Menu</button>
  <ul id="mn" class="panel" hidden><li>One</li><li>Two</li></ul>`,
  script: `function go(){var mn=document.getElementById('mn');mn.hidden=!mn.hidden;
  /* BUG: the menu shows/hides but aria-expanded on the button is never updated, staying "false". */}`,
  rationale: 'The menu visibly expands on click, but aria-expanded stays "false", so AT reports a collapsed menu while it is open. Resting state matches; the post-activation read of aria-expanded reveals the stale state.',
  citation: C_EXPANDED
});

// P4: aria-expanded set on the WRONG element (controls target) not the button -> button state never changes.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'aria-expanded-on-wrong-element',
  h1: 'Accordion', targetSelector: '#ah', activation: 'click',
  body: `  <button id="ah" type="button" aria-expanded="false" aria-controls="ap" onclick="go()">Section 1</button>
  <div id="ap" class="panel" hidden>Body</div>`,
  script: `function go(){var ap=document.getElementById('ap');var open=ap.hidden===false;ap.hidden=open;
  ap.setAttribute('aria-expanded',(!open).toString());
  /* BUG: aria-expanded is updated on the PANEL (#ap), not on the button that owns the state; the button's aria-expanded stays "false". */}`,
  rationale: 'The handler sets aria-expanded on the panel rather than on the controlling button, so the button (which AT users operate) keeps aria-expanded="false" despite the panel being open. Only re-reading the button after activation shows the state never updates on the owner.',
  citation: C_EXPANDED
});

// P5: role=switch with aria-checked that never flips.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'switch-aria-checked-frozen',
  h1: 'Wi-Fi', targetSelector: '#sw', activation: 'click',
  body: `  <span id="sw" role="switch" tabindex="0" aria-checked="false" onclick="go()" onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();go();}">Wi-Fi <span class="slider" style="width:48px"><span class="thumb" id="th"></span></span></span>`,
  script: `var on=false;function go(){on=!on;document.getElementById('th').style.left=on?'24px':'2px';
  /* BUG: the thumb slides to "on" but aria-checked on the switch stays "false". */}`,
  rationale: 'The switch thumb slides to the on position on activation, but aria-checked never flips from "false", so AT reports the switch off while it is visually on. The frozen state surfaces only on the post-activation re-read.',
  citation: C_CHECKED
});

// P6: role=checkbox custom; aria-checked contradicts (set to true at rest, flips to false when visually checked).
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'custom-checkbox-aria-checked-inverted',
  h1: 'Terms', targetSelector: '#ck', activation: 'click',
  body: `  <span id="ck" role="checkbox" tabindex="0" aria-checked="true" onclick="go()" onkeydown="if(event.key===' '){event.preventDefault();go();}"><span id="box" class="icon" aria-hidden="true">&#9744;</span> I agree</span>`,
  script: `var checked=false;function go(){checked=!checked;document.getElementById('box').innerHTML=checked?'&#9745;':'&#9744;';
  document.getElementById('ck').setAttribute('aria-checked',(!checked).toString());
  /* BUG: aria-checked is set to the INVERSE of the visible checkbox; visually checked => aria-checked="false". */}`,
  rationale: 'aria-checked is computed as the inverse of the visible state, so a visually checked box reports aria-checked="false" (and unchecked reports true). The contradiction is only confirmable by activating and comparing the visible box to the exposed state.',
  citation: C_CHECKED
});

// P7: aria-pressed value is a non-boolean garbage string set on click ("yes").
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'aria-pressed-invalid-token',
  h1: 'Pin', targetSelector: '#pin', activation: 'click',
  body: `  <button id="pin" type="button" aria-pressed="false" onclick="go()">Pin</button>`,
  script: `var on=false;function go(){on=!on;var b=document.getElementById('pin');b.classList.toggle('on',on);
  b.setAttribute('aria-pressed',on?'yes':'no');
  /* BUG: aria-pressed is set to invalid tokens "yes"/"no" instead of true/false, so the pressed state is not programmatically determinable (treated as not a toggle / undefined). */}`,
  rationale: 'aria-pressed is set to invalid tokens "yes"/"no" instead of the allowed true/false, so the pressed state is not programmatically determinable after activation; AT cannot map "yes" to pressed. Only re-reading the attribute post-activation reveals the invalid value.',
  citation: C_PRESSED
});

// P8: disclosure uses aria-expanded but also hides the button text from a11y tree; expanded never updates.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'aria-expanded-frozen-true',
  h1: 'Details', targetSelector: '#d', activation: 'key:Enter',
  body: `  <button id="d" type="button" aria-expanded="true" onclick="go()">Details</button>
  <div id="dp" class="panel">Body</div>`,
  script: `var open=true;function go(){open=!open;document.getElementById('dp').hidden=!open;
  /* BUG: starts aria-expanded="true" and the panel toggles, but aria-expanded never changes, so after collapsing the panel the button still reports expanded. */}`,
  rationale: 'The button starts aria-expanded="true" and toggles the panel, but the attribute never updates, so after the panel collapses the button still reports expanded. The stale state contradicts the visible collapsed panel only after activation.',
  citation: C_EXPANDED
});

// P9: tri-state confusion: a sort toggle uses aria-pressed but should use aria-sort; and aria-pressed never set.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'toggle-missing-pressed-state-entirely',
  h1: 'Grid', targetSelector: '#tg', activation: 'click',
  body: `  <button id="tg" type="button" onclick="go()"><span id="tk" class="icon" aria-hidden="true">&#9744;</span> Compact view</button>`,
  script: `var on=false;function go(){on=!on;var b=document.getElementById('tg');b.classList.toggle('on',on);
  document.getElementById('tk').innerHTML=on?'&#9745;':'&#9744;';
  /* BUG: this is a toggle (on/off) but exposes NO aria-pressed at all; the on/off state is shown ONLY via an aria-hidden checkbox glyph and a CSS highlight, never as a programmatic toggle state. The accessible name "Compact view" is unchanged, so AT cannot tell on from off. */}`,
  rationale: 'The control is a visual toggle whose on/off state is shown only by an aria-hidden checkbox glyph and a CSS highlight; it never exposes aria-pressed and its accessible name stays "Compact view", so the toggled state is not programmatically determinable after activation. The interaction shows the binary state never reaches the accessibility tree.',
  citation: C_PRESSED
});

// P10: aria-selected on a tab never updates after selection.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'aria-selected-frozen',
  h1: 'Tabs', targetSelector: '#t2', activation: 'click',
  body: `  <div role="tablist">
    <button id="t1" role="tab" aria-selected="true" onclick="sel(1)">Tab 1</button>
    <button id="t2" role="tab" aria-selected="false" onclick="sel(2)">Tab 2</button>
  </div>
  <div id="p1" role="tabpanel">Panel 1</div><div id="p2" role="tabpanel" hidden>Panel 2</div>`,
  script: `function sel(n){document.getElementById('p1').hidden=(n!==1);document.getElementById('p2').hidden=(n!==2);
  /* BUG: panels switch and the visual active tab changes via :focus, but aria-selected is never moved off Tab 1; selected state is stale. */}`,
  rationale: 'Activating Tab 2 switches the visible panel, but aria-selected stays true on Tab 1 and false on Tab 2, so AT reports the wrong selected tab. The stale selected state is only visible after activating the second tab.',
  citation: C_412
});

// P11: aria-pressed flips but on the WRONG (sibling) button due to a shared handler bug.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'aria-pressed-flips-on-wrong-control',
  h1: 'Formatting', targetSelector: '#it', activation: 'click',
  body: `  <button id="bd" type="button" aria-pressed="false">Bold</button>
  <button id="it" type="button" aria-pressed="false" onclick="go()">Italic</button>`,
  script: `function go(){var it=document.getElementById('it');it.classList.toggle('on');
  /* BUG: clicking Italic visually presses Italic but the handler updates aria-pressed on Bold instead (typo). */
  var bd=document.getElementById('bd');bd.setAttribute('aria-pressed',bd.getAttribute('aria-pressed')==='true'?'false':'true');}`,
  rationale: 'Clicking Italic visually presses Italic, but the handler flips aria-pressed on the Bold button instead, so the activated control keeps aria-pressed="false" while an unrelated control changes state. Only re-reading the activated control after the click exposes that its state never updates.',
  citation: C_PRESSED
});

// P12: aria-checked on radio role never updates when selection moves.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'custom-radio-aria-checked-stale',
  h1: 'Shipping', targetSelector: '#r2', activation: 'click',
  body: `  <div role="radiogroup" aria-label="Shipping">
    <span id="r1" role="radio" tabindex="0" aria-checked="true" onclick="sel(1)">Standard</span>
    <span id="r2" role="radio" tabindex="-1" aria-checked="false" onclick="sel(2)">Express</span>
  </div>`,
  script: `function sel(n){document.getElementById('r1').classList.toggle('on',n===1);document.getElementById('r2').classList.toggle('on',n===2);
  /* BUG: the visual selection moves to Express but aria-checked is never moved from Standard; both states are stale. */}`,
  rationale: 'Selecting Express moves the visual selection, but aria-checked stays true on Standard and false on Express, so AT reports the wrong checked radio. The stale checked state appears only after activating the second radio.',
  citation: C_CHECKED
});

// ---------- NEGATIVES (12) ----------

// N1: toggle button aria-pressed flips correctly both ways.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'aria-pressed-flips-correctly',
  h1: 'Bold', targetSelector: '#b', activation: 'click',
  body: `  <button id="b" type="button" aria-pressed="false" onclick="go()">Bold</button>`,
  script: `function go(){var b=document.getElementById('b');var p=b.getAttribute('aria-pressed')==='true';
  b.setAttribute('aria-pressed',(!p).toString());b.classList.toggle('on',!p);
  /* OK: aria-pressed flips with the visual pressed state, both directions. */}`,
  rationale: 'aria-pressed flips to "true" when the button presses and back to "false" when released, tracking the visual state in both directions; the post-activation read matches the visible toggle.',
  citation: C_PRESSED
});

// N2: native checkbox (platform exposes checked automatically).
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'native-checkbox-state-auto',
  h1: 'Terms', targetSelector: '#ck', activation: 'click',
  body: `  <label><input id="ck" type="checkbox" onchange="go()"> I agree</label>`,
  script: `function go(){/* OK: native checkbox; the platform exposes the checked state automatically and keeps it current. No custom state to go stale. */}`,
  rationale: 'A native checkbox has its checked state exposed and maintained by the platform, so it cannot go stale after activation; the exposed state always matches the visible box.',
  citation: C_CHECKED
});

// N3: disclosure aria-expanded flips on the button.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'aria-expanded-flips-on-button',
  h1: 'Menu', targetSelector: '#mb', activation: 'click',
  body: `  <button id="mb" type="button" aria-expanded="false" aria-controls="mn" onclick="go()">Menu</button>
  <ul id="mn" class="panel" hidden><li>One</li></ul>`,
  script: `function go(){var b=document.getElementById('mb'),mn=document.getElementById('mn');
  var open=mn.hidden===false;mn.hidden=open;b.setAttribute('aria-expanded',(!open).toString());
  /* OK: aria-expanded on the button flips with the menu. */}`,
  rationale: 'The button updates aria-expanded to match the menu visibility on each activation, so the exposed expanded state correctly tracks the open/closed panel after the click.',
  citation: C_EXPANDED
});

// N4: role=switch aria-checked flips correctly (space key).
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'switch-aria-checked-flips',
  h1: 'Wi-Fi', targetSelector: '#sw', activation: 'key:Space',
  body: `  <span id="sw" role="switch" tabindex="0" aria-checked="false" onclick="go()" onkeydown="if(event.key===' '){event.preventDefault();go();}">Wi-Fi <span class="slider" style="width:48px"><span class="thumb" id="th"></span></span></span>`,
  script: `function go(){var sw=document.getElementById('sw');var on=sw.getAttribute('aria-checked')==='true';
  sw.setAttribute('aria-checked',(!on).toString());document.getElementById('th').style.left=!on?'24px':'2px';
  /* OK: aria-checked flips with the thumb on Space activation. */}`,
  rationale: 'The switch flips aria-checked together with the thumb position on Space activation, so the exposed checked state matches the visible switch after each interaction.',
  citation: C_CHECKED
});

// N5: custom checkbox aria-checked matches visible box.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'custom-checkbox-aria-checked-matches',
  h1: 'Terms', targetSelector: '#ck', activation: 'key:Space',
  body: `  <span id="ck" role="checkbox" tabindex="0" aria-checked="false" onclick="go()" onkeydown="if(event.key===' '){event.preventDefault();go();}"><span id="box" class="icon" aria-hidden="true">&#9744;</span> I agree</span>`,
  script: `function go(){var ck=document.getElementById('ck');var c=ck.getAttribute('aria-checked')==='true';
  ck.setAttribute('aria-checked',(!c).toString());document.getElementById('box').innerHTML=!c?'&#9745;':'&#9744;';
  /* OK: aria-checked matches the visible box. */}`,
  rationale: 'The custom checkbox sets aria-checked to the same value as the visible box on every activation, so the exposed checked state correctly matches the visible state after the interaction.',
  citation: C_CHECKED
});

// N6: accordion aria-expanded on the correct button, Enter key.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'accordion-aria-expanded-correct',
  h1: 'Accordion', targetSelector: '#ah', activation: 'key:Enter',
  body: `  <button id="ah" type="button" aria-expanded="false" aria-controls="ap" onclick="go()">Section 1</button>
  <div id="ap" class="panel" hidden>Body</div>`,
  script: `function go(){var b=document.getElementById('ah'),ap=document.getElementById('ap');
  var open=ap.hidden===false;ap.hidden=open;b.setAttribute('aria-expanded',(!open).toString());
  /* OK: aria-expanded on the button updates with the panel. */}`,
  rationale: 'The accordion header updates its own aria-expanded to match the panel visibility on Enter activation, so the exposed state correctly reflects the expanded/collapsed panel.',
  citation: C_EXPANDED
});

// N7: valid aria-pressed true/false tokens.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'aria-pressed-valid-tokens',
  h1: 'Pin', targetSelector: '#pin', activation: 'click',
  body: `  <button id="pin" type="button" aria-pressed="false" onclick="go()">Pin</button>`,
  script: `function go(){var b=document.getElementById('pin');var p=b.getAttribute('aria-pressed')==='true';
  b.setAttribute('aria-pressed',(!p).toString());b.classList.toggle('on',!p);
  /* OK: uses valid true/false tokens. */}`,
  rationale: 'aria-pressed uses the valid true/false tokens and flips with the visual state, so the pressed state is programmatically determinable and current after activation.',
  citation: C_PRESSED
});

// N8: tabs move aria-selected correctly.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'aria-selected-moves',
  h1: 'Tabs', targetSelector: '#t2', activation: 'click',
  body: `  <div role="tablist">
    <button id="t1" role="tab" aria-selected="true" aria-controls="p1" onclick="sel(1)">Tab 1</button>
    <button id="t2" role="tab" aria-selected="false" aria-controls="p2" onclick="sel(2)">Tab 2</button>
  </div>
  <div id="p1" role="tabpanel">Panel 1</div><div id="p2" role="tabpanel" hidden>Panel 2</div>`,
  script: `function sel(n){document.getElementById('t1').setAttribute('aria-selected',(n===1).toString());
  document.getElementById('t2').setAttribute('aria-selected',(n===2).toString());
  document.getElementById('p1').hidden=(n!==1);document.getElementById('p2').hidden=(n!==2);
  /* OK: aria-selected moves to the activated tab. */}`,
  rationale: 'Activating Tab 2 moves aria-selected="true" to Tab 2 and false to Tab 1 along with the panel switch, so the exposed selected state correctly tracks the active tab after activation.',
  citation: C_412
});

// N9: toggle exposes aria-pressed (not just visual text).
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'toggle-exposes-pressed',
  h1: 'Grid', targetSelector: '#tg', activation: 'click',
  body: `  <button id="tg" type="button" aria-pressed="false" onclick="go()">Compact view</button>`,
  script: `function go(){var b=document.getElementById('tg');var p=b.getAttribute('aria-pressed')==='true';
  b.setAttribute('aria-pressed',(!p).toString());b.classList.toggle('on',!p);
  /* OK: the on/off toggle is exposed via aria-pressed. */}`,
  rationale: 'The compact-view toggle exposes its on/off state via aria-pressed and flips it on each activation, so the binary state is programmatically determinable and current after the click.',
  citation: C_PRESSED
});

// N10: custom radio moves aria-checked to selected option.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'custom-radio-aria-checked-moves',
  h1: 'Shipping', targetSelector: '#r2', activation: 'click',
  body: `  <div role="radiogroup" aria-label="Shipping">
    <span id="r1" role="radio" tabindex="0" aria-checked="true" onclick="sel(1)">Standard</span>
    <span id="r2" role="radio" tabindex="-1" aria-checked="false" onclick="sel(2)">Express</span>
  </div>`,
  script: `function sel(n){document.getElementById('r1').setAttribute('aria-checked',(n===1).toString());
  document.getElementById('r2').setAttribute('aria-checked',(n===2).toString());
  document.getElementById('r1').classList.toggle('on',n===1);document.getElementById('r2').classList.toggle('on',n===2);
  /* OK: aria-checked moves to the selected radio. */}`,
  rationale: 'Selecting Express moves aria-checked="true" to Express and false to Standard along with the visual selection, so the exposed checked state correctly reflects the chosen radio after activation.',
  citation: C_CHECKED
});

// N11: details/summary native disclosure (platform exposes expanded).
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'native-details-expanded-auto',
  h1: 'Details', targetSelector: '#sm', activation: 'click',
  body: `  <details id="dt"><summary id="sm">More info</summary><div class="panel">Body</div></details>`,
  script: `/* OK: native <details>/<summary>; the platform exposes the expanded state automatically and keeps it current. No custom state to go stale. */`,
  rationale: 'A native details/summary disclosure has its expanded state exposed and maintained by the platform, so it cannot go stale after activation; the exposed state always matches the open attribute.',
  citation: C_EXPANDED
});

// N12: aria-pressed flips on the SAME activated control (no cross-wiring).
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'aria-pressed-same-control',
  h1: 'Formatting', targetSelector: '#it', activation: 'click',
  body: `  <button id="bd" type="button" aria-pressed="false" onclick="tog(this)">Bold</button>
  <button id="it" type="button" aria-pressed="false" onclick="tog(this)">Italic</button>`,
  script: `function tog(b){var p=b.getAttribute('aria-pressed')==='true';b.setAttribute('aria-pressed',(!p).toString());b.classList.toggle('on',!p);
  /* OK: each button toggles its OWN aria-pressed via this. */}`,
  rationale: 'Each formatting button toggles its own aria-pressed via the activated element, so the activated control\'s exposed state correctly flips after the click with no cross-wiring to siblings.',
  citation: C_PRESSED
});

const r = writeCases('stale-or-contradicting-state-value', 'Dynamic state', cases);
console.log('stale-or-contradicting-state-value:', JSON.stringify(r));
