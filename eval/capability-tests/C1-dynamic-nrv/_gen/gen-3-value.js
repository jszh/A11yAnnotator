'use strict';
const { writeCases } = require('./shared');

const C_412_VAL = '"states, properties, and values that can be set by the user can be programmatically set; and notification of changes to these items is available to user agents, including assistive technology." — WCAG 2.2 SC 4.1.2 Name, Role, Value';
const C_SLIDER = '"ARIA: aria-valuenow (property) ... Defines the current value for a range widget." — for role=slider/spinbutton the current value must be programmatically set and updated (WCAG 2.2 4.1.2)';
const C_F79 = '"F79: Failure of Success Criterion 4.1.2 due to the focus state of a user interface component not being programmatically determinable or no notification of change of focus state available" — by analogy, a change of value with no programmatic notification fails 4.1.2';
const C_KBD_SET = '"states, properties, and values that can be set by the user can be programmatically set" — a value the user can change visually must be settable via the keyboard/AT and exposed (WCAG 2.2 4.1.2)';

const cases = [];

// ---------- POSITIVES (12) ----------

// P1: custom slider, ArrowRight moves thumb visually but aria-valuenow frozen.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'aria-valuenow-frozen-on-arrow-key',
  h1: 'Volume', targetSelector: '#sl', activation: 'key:ArrowRight',
  body: `  <div id="sl" role="slider" tabindex="0" aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"
    class="slider" onkeydown="key(event)"><span class="thumb" id="th" style="left:120px"></span></div>
  <span class="val" id="v">50</span>`,
  script: `var val=50;function key(e){if(e.key==='ArrowRight'){e.preventDefault();val=Math.min(100,val+10);}
  else if(e.key==='ArrowLeft'){e.preventDefault();val=Math.max(0,val-10);}else return;
  document.getElementById('th').style.left=(val*2.2+2)+'px';document.getElementById('v').textContent=val;
  /* BUG: the thumb and the visible number move, but aria-valuenow on the slider is never updated, staying "50". */}`,
  rationale: 'ArrowRight moves the thumb and the visible value, but aria-valuenow stays "50", so AT always reports 50 regardless of the real value. The resting value is correct; only re-reading aria-valuenow after the arrow key exposes the frozen value.',
  citation: C_SLIDER
});

// P2: custom spinbutton, +/- buttons change visible value but aria-valuenow frozen.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'spinbutton-valuenow-frozen',
  h1: 'Quantity', targetSelector: '#inc', activation: 'click',
  body: `  <span class="stepper">
    <button id="dec" type="button" aria-label="Decrease quantity" onclick="step(-1)">&minus;</button>
    <span id="sb" role="spinbutton" tabindex="0" aria-label="Quantity" aria-valuemin="1" aria-valuemax="9" aria-valuenow="1"><span id="q">1</span></span>
    <button id="inc" type="button" aria-label="Increase quantity" onclick="step(1)">+</button>
  </span>`,
  script: `var q=1;function step(d){q=Math.max(1,Math.min(9,q+d));document.getElementById('q').textContent=q;
  /* BUG: the visible quantity changes but the spinbutton's aria-valuenow stays "1". */}`,
  rationale: 'The increment button changes the visible quantity, but the spinbutton aria-valuenow stays "1", so AT always reports 1. The frozen value is only observable by activating the stepper and re-reading aria-valuenow.',
  citation: C_SLIDER
});

// P3: slider only operable by mouse drag; ArrowRight does nothing (value not settable by keyboard).
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'value-not-settable-by-keyboard',
  h1: 'Brightness', targetSelector: '#sl', activation: 'key:ArrowRight',
  body: `  <div id="sl" role="slider" tabindex="0" aria-label="Brightness" aria-valuemin="0" aria-valuemax="100" aria-valuenow="30"
    class="slider" onmousedown="drag()"><span class="thumb" id="th" style="left:68px"></span></div>
  <span class="val" id="v">30</span>`,
  script: `var val=30;function drag(){val=Math.min(100,val+10);document.getElementById('th').style.left=(val*2.2+2)+'px';
  document.getElementById('v').textContent=val;document.getElementById('sl').setAttribute('aria-valuenow',val);}
  /* BUG: there is NO keydown handler, so ArrowRight cannot change the value at all; the value is settable only by mouse. */`,
  rationale: 'The slider has only a mousedown handler and no key handler, so ArrowRight cannot change the value; a keyboard/AT user cannot set the value the success criterion requires to be settable. The interaction (ArrowRight) produces no change, proving the value is not keyboard-settable.',
  citation: C_KBD_SET
});

// P4: combobox; selecting an option updates the visible field but no aria-activedescendant / value notification.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'combobox-change-not-notified',
  h1: 'Country', targetSelector: '#opt2', activation: 'click',
  body: `  <div class="row"><span id="cb" role="combobox" aria-expanded="true" aria-controls="lb" aria-label="Country" tabindex="0"><span id="cv">Choose...</span></span></div>
  <ul id="lb" role="listbox">
    <li id="opt1" role="option" onclick="pick('France')">France</li>
    <li id="opt2" role="option" onclick="pick('Germany')">Germany</li>
  </ul>`,
  script: `function pick(name){document.getElementById('cv').textContent=name;
  /* BUG: the visible combobox text changes to the chosen country, but the selected option is never marked aria-selected and no aria-activedescendant or value update reaches the combobox; the change is not notified to AT. */}`,
  rationale: 'Picking an option updates the visible combobox text, but no aria-selected is set on the option and no aria-activedescendant/value notification is exposed, so the value change is not notified to AT. The missing notification is only confirmable by activating an option and inspecting the exposed selection.',
  citation: C_412_VAL
});

// P5: slider updates aria-valuenow but with a WRONG (stale by one step) value.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'aria-valuenow-off-by-one-step',
  h1: 'Zoom', targetSelector: '#sl', activation: 'key:ArrowRight',
  body: `  <div id="sl" role="slider" tabindex="0" aria-label="Zoom" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40"
    class="slider" onkeydown="key(event)"><span class="thumb" id="th" style="left:90px"></span></div>
  <span class="val" id="v">40</span>`,
  script: `var val=40;function key(e){if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();
  val=e.key==='ArrowRight'?Math.min(100,val+10):Math.max(0,val-10);
  document.getElementById('th').style.left=(val*2.2+2)+'px';document.getElementById('v').textContent=val;
  /* BUG: aria-valuenow is updated to the PREVIOUS value (set before the increment), so it lags one step behind the visible value. */
  document.getElementById('sl').setAttribute('aria-valuenow',e.key==='ArrowRight'?val-10:val+10);}`,
  rationale: 'aria-valuenow is updated to the pre-increment value, so it lags the visible value by one step after every arrow keypress; AT reports a value that no longer matches the thumb. The off-by-one staleness is only detectable by comparing the exposed value to the visible value after activation.',
  citation: C_SLIDER
});

// P6: spinbutton aria-valuenow updates but aria-valuetext is stale (contradicts).
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'aria-valuetext-stale',
  h1: 'Temperature', targetSelector: '#inc', activation: 'click',
  body: `  <span class="stepper">
    <span id="sb" role="spinbutton" tabindex="0" aria-label="Temperature" aria-valuemin="60" aria-valuemax="80" aria-valuenow="68" aria-valuetext="68 degrees"><span id="q">68&deg;</span></span>
    <button id="inc" type="button" aria-label="Increase temperature" onclick="step(1)">+</button>
  </span>`,
  script: `var q=68;function step(d){q=Math.max(60,Math.min(80,q+d));document.getElementById('q').textContent=q+'\\u00b0';
  document.getElementById('sb').setAttribute('aria-valuenow',q);
  /* BUG: aria-valuenow updates but aria-valuetext stays "68 degrees"; when valuetext is present AT announces it instead of valuenow, so the announced value is stale. */}`,
  rationale: 'aria-valuenow updates, but the stale aria-valuetext "68 degrees" (which AT announces in preference to valuenow) is never updated, so the announced value stays 68 while the real value rises. The contradiction is only observable after activation by comparing valuetext to the visible value.',
  citation: C_SLIDER
});

// P7: slider value clamps but max is wrong so value never reaches reported range; change not notified at top.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'valuenow-not-updated-at-bounds',
  h1: 'Progress', targetSelector: '#sl', activation: 'key:ArrowRight',
  body: `  <div id="sl" role="slider" tabindex="0" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="90"
    class="slider" onkeydown="key(event)"><span class="thumb" id="th" style="left:200px"></span></div>
  <span class="val" id="v">90</span>`,
  script: `var val=90;function key(e){if(e.key!=='ArrowRight')return;e.preventDefault();val=Math.min(100,val+5);
  document.getElementById('th').style.left=(val*2.2+2)+'px';document.getElementById('v').textContent=val;
  /* BUG: near the top bound the visible value rises 90->95->100 but aria-valuenow is never refreshed and stays "90"; the value change is not notified. */}`,
  rationale: 'Near the upper bound the visible value rises on each arrow press, but aria-valuenow stays frozen at "90" and is never refreshed, so the value change is not notified to AT. The frozen value is observable on the first arrow press by comparing aria-valuenow to the visible value.',
  citation: C_412_VAL
});

// P8: custom range as two buttons; value text changes but no role=slider/spinbutton so no value is exposed at all.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'no-range-role-value-not-exposed',
  h1: 'Font size', targetSelector: '#bigger', activation: 'click',
  body: `  <button id="smaller" type="button" aria-label="Smaller" onclick="step(-1)">A-</button>
  <span id="fs">16px</span>
  <button id="bigger" type="button" aria-label="Bigger" onclick="step(1)">A+</button>`,
  script: `var px=16;function step(d){px=Math.max(10,Math.min(28,px+2));document.getElementById('fs').textContent=px+'px';
  /* BUG: the current size is shown only in a plain <span> with no role=slider/spinbutton and no aria-valuenow, so the current value is never programmatically exposed as a value the user is setting. */}`,
  rationale: 'The font-size control changes a plain text span with no slider/spinbutton role and no aria-valuenow, so the value the user is setting is never exposed programmatically. The interaction shows the current value never reaches the accessibility tree as a value.',
  citation: C_412_VAL
});

// P9: slider keyboard sets value but ArrowRight DECREASES it (inverted) and valuenow follows the inversion -> contradicts visible.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'valuenow-contradicts-visible-direction',
  h1: 'Speed', targetSelector: '#sl', activation: 'key:ArrowRight',
  body: `  <div id="sl" role="slider" tabindex="0" aria-label="Speed" aria-valuemin="0" aria-valuemax="10" aria-valuenow="5"
    class="slider" onkeydown="key(event)"><span class="thumb" id="th" style="left:120px"></span></div>
  <span class="val" id="v">5</span>`,
  script: `var val=5;function key(e){if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();
  /* visible thumb moves RIGHT for ArrowRight... */
  var vis=e.key==='ArrowRight'?Math.min(10,val+1):Math.max(0,val-1);
  document.getElementById('th').style.left=(vis*22+2)+'px';document.getElementById('v').textContent=vis;
  /* BUG: ...but aria-valuenow is updated in the OPPOSITE direction, so the exposed value contradicts the visible thumb. */
  val=e.key==='ArrowRight'?Math.max(0,val-1):Math.min(10,val+1);
  document.getElementById('sl').setAttribute('aria-valuenow',val);}`,
  rationale: 'ArrowRight moves the visible thumb up but aria-valuenow is decremented, so the exposed value contradicts the visible thumb direction after activation. The inverted value is only detectable by comparing the exposed aria-valuenow with the visible value after the arrow key.',
  citation: C_SLIDER
});

// P10: combobox text input where typing filters but the chosen value is set only in a hidden input, never on the combobox (no value notification).
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'combobox-value-only-in-hidden-input',
  h1: 'Tag', targetSelector: '#opt1', activation: 'click',
  body: `  <span id="cb" role="combobox" aria-expanded="true" aria-controls="lb" aria-label="Tag" tabindex="0"><span id="cv">none</span></span>
  <input id="hidden" type="hidden" value="">
  <ul id="lb" role="listbox"><li id="opt1" role="option" onclick="pick('urgent')">urgent</li></ul>`,
  script: `function pick(v){document.getElementById('hidden').value=v;document.getElementById('cv').textContent=v;
  /* BUG: the chosen value is written to a hidden input and the visible span, but the combobox exposes no aria-selected option and no updated accessible value, so AT is not notified of the value change. */}`,
  rationale: 'The chosen value is stored in a hidden input and shown visibly, but the combobox never marks the option aria-selected and exposes no updated value, so the change is not notified to AT. Only activating an option and inspecting the combobox reveals the missing notification.',
  citation: C_412_VAL
});

// P11: spinbutton where ArrowUp/Down change value but only mouse wheel updates aria-valuenow; keyboard change not notified.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'keyboard-change-not-notified',
  h1: 'Floor', targetSelector: '#sb', activation: 'key:ArrowRight',
  body: `  <span id="sb" role="spinbutton" tabindex="0" aria-label="Floor" aria-valuemin="0" aria-valuemax="20" aria-valuenow="3" onkeydown="key(event)"><span id="q">3</span></span>`,
  script: `var v=3;function key(e){if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();v=Math.min(20,v+1);}
  else if(e.key==='ArrowLeft'||e.key==='ArrowDown'){e.preventDefault();v=Math.max(0,v-1);}else return;
  document.getElementById('q').textContent=v;
  /* BUG: the keyboard handler changes the visible value but never calls setAttribute('aria-valuenow'); only a separate wheel handler (not present) would. So a keyboard value change is not notified. */}`,
  rationale: 'The keyboard handler updates the visible spinbutton value but never updates aria-valuenow, so a value change made via the keyboard is not notified to AT. The gap is only visible by pressing an arrow key and re-reading aria-valuenow.',
  citation: C_412_VAL
});

// P12: progressbar-like slider that is actually adjustable; value updates the text node but aria-valuenow set as a non-numeric string.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'aria-valuenow-non-numeric',
  h1: 'Rating', targetSelector: '#sl', activation: 'key:ArrowRight',
  body: `  <div id="sl" role="slider" tabindex="0" aria-label="Rating" aria-valuemin="1" aria-valuemax="5" aria-valuenow="3"
    class="slider" style="width:120px" onkeydown="key(event)"><span class="thumb" id="th" style="left:58px"></span></div>
  <span class="val" id="v">3 stars</span>`,
  script: `var val=3;function key(e){if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();
  val=e.key==='ArrowRight'?Math.min(5,val+1):Math.max(1,val-1);
  document.getElementById('th').style.left=((val-1)*28+2)+'px';document.getElementById('v').textContent=val+' stars';
  /* BUG: aria-valuenow is set to a non-numeric string like "3 stars", which is invalid for aria-valuenow (must be a number); the numeric value is not programmatically determinable. */
  document.getElementById('sl').setAttribute('aria-valuenow',val+' stars');}`,
  rationale: 'aria-valuenow is set to a non-numeric string ("3 stars"), which is invalid for the property (it must be a number), so the numeric value is not programmatically determinable after activation. The invalid value is only observable by re-reading aria-valuenow after the arrow key.',
  citation: C_SLIDER
});

// ---------- NEGATIVES (12) ----------

// N1: custom slider aria-valuenow updates on ArrowRight.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'aria-valuenow-updates-on-arrow',
  h1: 'Volume', targetSelector: '#sl', activation: 'key:ArrowRight',
  body: `  <div id="sl" role="slider" tabindex="0" aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"
    class="slider" onkeydown="key(event)"><span class="thumb" id="th" style="left:112px"></span></div>
  <span class="val" id="v">50</span>`,
  script: `var val=50;function key(e){if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();
  val=e.key==='ArrowRight'?Math.min(100,val+10):Math.max(0,val-10);
  document.getElementById('th').style.left=(val*2.2+2)+'px';document.getElementById('v').textContent=val;
  document.getElementById('sl').setAttribute('aria-valuenow',val);
  /* OK: aria-valuenow updates with the thumb. */}`,
  rationale: 'ArrowRight moves the thumb and updates aria-valuenow to the same value, so the exposed value tracks the visible value after each keypress; the post-activation read matches.',
  citation: C_SLIDER
});

// N2: spinbutton aria-valuenow updates on +.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'spinbutton-valuenow-updates',
  h1: 'Quantity', targetSelector: '#inc', activation: 'click',
  body: `  <span class="stepper">
    <span id="sb" role="spinbutton" tabindex="0" aria-label="Quantity" aria-valuemin="1" aria-valuemax="9" aria-valuenow="1"><span id="q">1</span></span>
    <button id="inc" type="button" aria-label="Increase quantity" onclick="step(1)">+</button>
  </span>`,
  script: `var q=1;function step(d){q=Math.max(1,Math.min(9,q+d));document.getElementById('q').textContent=q;
  document.getElementById('sb').setAttribute('aria-valuenow',q);
  /* OK: aria-valuenow updates with the visible quantity. */}`,
  rationale: 'The increment button updates both the visible quantity and aria-valuenow, so the exposed value matches the visible value after activation.',
  citation: C_SLIDER
});

// N3: native <input type=range> (platform exposes & sets value via keyboard).
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'native-range-input',
  h1: 'Brightness', targetSelector: '#r', activation: 'key:ArrowRight',
  body: `  <label for="r">Brightness</label>
  <input id="r" type="range" min="0" max="100" value="30" oninput="document.getElementById('v').textContent=this.value">
  <span class="val" id="v">30</span>`,
  script: `/* OK: native range input; the platform exposes the value and lets the keyboard set it (ArrowRight), with change notification handled automatically. */`,
  rationale: 'A native range input has its value exposed and keyboard-settable by the platform with automatic change notification, so ArrowRight correctly changes and notifies the value; nothing can go stale.',
  citation: C_KBD_SET
});

// N4: combobox with aria-selected + value update + notification.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'combobox-change-notified',
  h1: 'Country', targetSelector: '#opt2', activation: 'click',
  body: `  <span id="cb" role="combobox" aria-expanded="true" aria-controls="lb" aria-label="Country" tabindex="0"><span id="cv">Choose...</span></span>
  <ul id="lb" role="listbox">
    <li id="opt1" role="option" aria-selected="false" onclick="pick(this,'France')">France</li>
    <li id="opt2" role="option" aria-selected="false" onclick="pick(this,'Germany')">Germany</li>
  </ul>`,
  script: `function pick(el,name){document.getElementById('cv').textContent=name;
  document.querySelectorAll('#lb [role=option]').forEach(function(o){o.setAttribute('aria-selected',o===el?'true':'false');});
  document.getElementById('cb').setAttribute('aria-activedescendant',el.id);
  /* OK: the chosen option is marked aria-selected, the combobox text updates, and aria-activedescendant points at the selection. */}`,
  rationale: 'Selecting an option updates the visible text, marks the option aria-selected, and sets aria-activedescendant on the combobox, so the value change is notified and exposed to AT after activation.',
  citation: C_412_VAL
});

// N5: slider valuenow exactly matches visible (no lag).
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'valuenow-matches-visible',
  h1: 'Zoom', targetSelector: '#sl', activation: 'key:ArrowRight',
  body: `  <div id="sl" role="slider" tabindex="0" aria-label="Zoom" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40"
    class="slider" onkeydown="key(event)"><span class="thumb" id="th" style="left:90px"></span></div>
  <span class="val" id="v">40</span>`,
  script: `var val=40;function key(e){if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();
  val=e.key==='ArrowRight'?Math.min(100,val+10):Math.max(0,val-10);
  document.getElementById('th').style.left=(val*2.2+2)+'px';document.getElementById('v').textContent=val;
  document.getElementById('sl').setAttribute('aria-valuenow',val);
  /* OK: valuenow equals the visible value exactly. */}`,
  rationale: 'aria-valuenow is set to the exact post-increment value with no lag, so the exposed value matches the visible value after each arrow keypress.',
  citation: C_SLIDER
});

// N6: spinbutton with aria-valuetext kept in sync.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'aria-valuetext-in-sync',
  h1: 'Temperature', targetSelector: '#inc', activation: 'click',
  body: `  <span class="stepper">
    <span id="sb" role="spinbutton" tabindex="0" aria-label="Temperature" aria-valuemin="60" aria-valuemax="80" aria-valuenow="68" aria-valuetext="68 degrees"><span id="q">68&deg;</span></span>
    <button id="inc" type="button" aria-label="Increase temperature" onclick="step(1)">+</button>
  </span>`,
  script: `var q=68;function step(d){q=Math.max(60,Math.min(80,q+d));document.getElementById('q').textContent=q+'\\u00b0';
  var sb=document.getElementById('sb');sb.setAttribute('aria-valuenow',q);sb.setAttribute('aria-valuetext',q+' degrees');
  /* OK: both aria-valuenow and aria-valuetext update together. */}`,
  rationale: 'Both aria-valuenow and aria-valuetext update together on activation, so the announced value ("70 degrees") matches the visible value after the interaction.',
  citation: C_SLIDER
});

// N7: slider notifies value at every step including bounds.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'valuenow-updates-through-bounds',
  h1: 'Progress', targetSelector: '#sl', activation: 'key:ArrowRight',
  body: `  <div id="sl" role="slider" tabindex="0" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="90"
    class="slider" onkeydown="key(event)"><span class="thumb" id="th" style="left:200px"></span></div>
  <span class="val" id="v">90</span>`,
  script: `var val=90;function key(e){if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();
  val=e.key==='ArrowRight'?Math.min(100,val+5):Math.max(0,val-5);
  document.getElementById('th').style.left=(val*2.2+2)+'px';document.getElementById('v').textContent=val;
  document.getElementById('sl').setAttribute('aria-valuenow',val);
  /* OK: valuenow updates on every press, including up to 100. */}`,
  rationale: 'aria-valuenow updates on every arrow press, including increases up to the maximum, so the exposed value stays current through the upper bound after activation.',
  citation: C_412_VAL
});

// N8: font-size control exposed as a spinbutton with aria-valuenow.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'range-role-value-exposed',
  h1: 'Font size', targetSelector: '#bigger', activation: 'click',
  body: `  <button id="smaller" type="button" aria-label="Smaller" onclick="step(-2)">A-</button>
  <span id="sb" role="spinbutton" aria-label="Font size" aria-valuemin="10" aria-valuemax="28" aria-valuenow="16" aria-valuetext="16px">16px</span>
  <button id="bigger" type="button" aria-label="Bigger" onclick="step(2)">A+</button>`,
  script: `var px=16;function step(d){px=Math.max(10,Math.min(28,px+d));var sb=document.getElementById('sb');
  sb.textContent=px+'px';sb.setAttribute('aria-valuenow',px);sb.setAttribute('aria-valuetext',px+'px');
  /* OK: the current size is exposed via a spinbutton with aria-valuenow/valuetext that update. */}`,
  rationale: 'The font-size control is exposed as a spinbutton whose aria-valuenow and aria-valuetext update on activation, so the value the user is setting is programmatically determinable and current.',
  citation: C_412_VAL
});

// N9: slider direction correct, valuenow matches direction.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'valuenow-direction-correct',
  h1: 'Speed', targetSelector: '#sl', activation: 'key:ArrowRight',
  body: `  <div id="sl" role="slider" tabindex="0" aria-label="Speed" aria-valuemin="0" aria-valuemax="10" aria-valuenow="5"
    class="slider" onkeydown="key(event)"><span class="thumb" id="th" style="left:112px"></span></div>
  <span class="val" id="v">5</span>`,
  script: `var val=5;function key(e){if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();
  val=e.key==='ArrowRight'?Math.min(10,val+1):Math.max(0,val-1);
  document.getElementById('th').style.left=(val*22+2)+'px';document.getElementById('v').textContent=val;
  document.getElementById('sl').setAttribute('aria-valuenow',val);
  /* OK: ArrowRight increases both the visible value and aria-valuenow. */}`,
  rationale: 'ArrowRight increases both the visible thumb and aria-valuenow in the same direction, so the exposed value agrees with the visible value after activation.',
  citation: C_SLIDER
});

// N10: combobox value exposed on the combobox, not only a hidden input.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'combobox-value-exposed',
  h1: 'Tag', targetSelector: '#opt1', activation: 'click',
  body: `  <span id="cb" role="combobox" aria-expanded="true" aria-controls="lb" aria-label="Tag" tabindex="0"><span id="cv">none</span></span>
  <ul id="lb" role="listbox"><li id="opt1" role="option" aria-selected="false" onclick="pick(this,'urgent')">urgent</li></ul>`,
  script: `function pick(el,v){document.getElementById('cv').textContent=v;el.setAttribute('aria-selected','true');
  document.getElementById('cb').setAttribute('aria-activedescendant',el.id);
  /* OK: the chosen option is marked aria-selected and exposed via aria-activedescendant on the combobox. */}`,
  rationale: 'The chosen value updates the visible combobox text, marks the option aria-selected, and is referenced by aria-activedescendant, so the value change is exposed and notified to AT after activation.',
  citation: C_412_VAL
});

// N11: spinbutton keyboard change updates aria-valuenow.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'keyboard-change-notified',
  h1: 'Floor', targetSelector: '#sb', activation: 'key:ArrowRight',
  body: `  <span id="sb" role="spinbutton" tabindex="0" aria-label="Floor" aria-valuemin="0" aria-valuemax="20" aria-valuenow="3" onkeydown="key(event)"><span id="q">3</span></span>`,
  script: `var v=3;function key(e){if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();v=Math.min(20,v+1);}
  else if(e.key==='ArrowLeft'||e.key==='ArrowDown'){e.preventDefault();v=Math.max(0,v-1);}else return;
  document.getElementById('q').textContent=v;document.getElementById('sb').setAttribute('aria-valuenow',v);
  /* OK: keyboard change updates aria-valuenow. */}`,
  rationale: 'The keyboard handler updates both the visible value and aria-valuenow, so a value change made via the keyboard is notified to AT; the post-activation read matches.',
  citation: C_412_VAL
});

// N12: star rating exposed numerically via aria-valuenow + aria-valuetext.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'aria-valuenow-numeric-valuetext',
  h1: 'Rating', targetSelector: '#sl', activation: 'key:ArrowRight',
  body: `  <div id="sl" role="slider" tabindex="0" aria-label="Rating" aria-valuemin="1" aria-valuemax="5" aria-valuenow="3" aria-valuetext="3 stars"
    class="slider" style="width:120px" onkeydown="key(event)"><span class="thumb" id="th" style="left:58px"></span></div>
  <span class="val" id="v">3 stars</span>`,
  script: `var val=3;function key(e){if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();
  val=e.key==='ArrowRight'?Math.min(5,val+1):Math.max(1,val-1);
  document.getElementById('th').style.left=((val-1)*28+2)+'px';document.getElementById('v').textContent=val+' stars';
  var sl=document.getElementById('sl');sl.setAttribute('aria-valuenow',val);sl.setAttribute('aria-valuetext',val+' stars');
  /* OK: aria-valuenow is the NUMBER and aria-valuetext gives the "N stars" wording. */}`,
  rationale: 'aria-valuenow is set to the numeric rating and aria-valuetext provides the "N stars" wording, both updating on activation, so the value is programmatically determinable and the announcement is current.',
  citation: C_SLIDER
});

const r = writeCases('value-not-settable-or-change-not-notified', 'Dynamic value', cases);
console.log('value-not-settable-or-change-not-notified:', JSON.stringify(r));
