'use strict';
const { writeCases } = require('./shared');

// Citations (verbatim) reused across cases.
const C_412_NAME = '"For all user interface components ... the name and role can be programmatically determined; states, properties, and values that can be set by the user can be programmatically set; and notification of changes to these items is available to user agents, including assistive technology." — WCAG 2.2 SC 4.1.2 Name, Role, Value';
const C_F89 = '"F89: Failure of Success Criteria 1.1.1, 2.4.4, and 4.1.2 due to using null alt on an image where the image is the only content in a link" — the accessible name must reflect the control\'s current function, not a stale string';
const C_ARIA_LABEL = '"ARIA14: Using aria-label to provide an invisible label where a visible label cannot be used" — when both a visible label and aria-label are present, the aria-label overrides the visible text, so a stale aria-label hides the true (changed) name from AT';
const C_NAME_VERSUS = '"Editorial Note: ... The accessible name ... should match the visible label." — Trusted Tester 5.1.5 (does not have an accessible name) / 5.1.x Name, Role, Value: a control\'s accessible name must match its current visible label';

const cases = [];

// ---------- POSITIVES (12): visible text changes, accessible NAME stays stale ----------

// P1: aria-label stale; visible textContent flips Show->Hide. aria-label "Show details" never updates -> name stale & contradicts.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'label-text-changes-but-aria-label-stale',
  h1: 'Account details',
  targetSelector: '#t', activation: 'click',
  body: `  <button id="t" type="button" aria-label="Show details" aria-expanded="false" onclick="go()">Show</button>
  <div id="p" class="panel" hidden>Name: Ada Lovelace</div>`,
  script: `function go(){var b=document.getElementById('t'),p=document.getElementById('p');
  var open=p.hidden===false; if(open){p.hidden=true;b.textContent='Show';b.setAttribute('aria-expanded','false');}
  else{p.hidden=false;b.textContent='Hide';b.setAttribute('aria-expanded','true');}
  /* BUG: aria-label "Show details" is never updated, and it overrides the visible "Hide" text, so the accessible name is permanently "Show details". */}`,
  rationale: 'On activation the visible label flips Show->Hide, but the aria-label stays "Show details" and (per the accessible-name algorithm) overrides the visible text, so after activation the accessible name still says "Show" while the control now Hides. The resting-state read sees a correct-looking name; only re-reading after activation exposes the stale/contradicting name.',
  citation: C_ARIA_LABEL
});

// P2: media play/pause; aria-label "Play" stays, icon + visual flips to pause.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'play-pause-aria-label-stale',
  h1: 'Audio player',
  targetSelector: '#pp', activation: 'click',
  body: `  <button id="pp" type="button" aria-label="Play" onclick="go()"><span id="g" class="icon" aria-hidden="true">&#9658;</span></button>
  <span id="st">stopped</span>`,
  script: `var playing=false;function go(){playing=!playing;var b=document.getElementById('pp');
  document.getElementById('g').innerHTML=playing?'&#10074;&#10074;':'&#9658;';
  document.getElementById('st').textContent=playing?'playing':'stopped';
  /* BUG: aria-label stays "Play" even while audio is playing and button now Pauses. */}`,
  rationale: 'The icon and visible state change Play->Pause on click, but aria-label remains "Play"; after activation a screen-reader user is told "Play" on a button that now pauses. The defect only surfaces after the click, since the resting name "Play" is correct for the resting (stopped) state.',
  citation: C_412_NAME
});

// P3: image button (input type=image) alt stays "Mute" after toggling to unmuted.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'image-button-alt-stale',
  h1: 'Volume control',
  targetSelector: '#mute', activation: 'click',
  body: `  <input id="mute" type="image" alt="Mute"
    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23356'/%3E%3C/svg%3E" onclick="go();return false;">
  <span id="st">sound on</span>`,
  script: `var muted=false;function go(){muted=!muted;
  document.getElementById('st').textContent=muted?'muted':'sound on';
  /* BUG: input[type=image] alt stays "Mute" after the control has muted; now it unmutes but its name still says "Mute" (F89-style stale name on an image control). */}`,
  rationale: 'Activating the image button toggles muted state, but its alt="Mute" (the accessible name source for input[type=image]) is never updated, so after one activation the button unmutes while still named "Mute". Resting read looks fine; post-activation read is stale.',
  citation: C_F89
});

// P4: aria-labelledby points at a span whose text is NOT updated while a different visible span flips.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'aria-labelledby-target-not-updated',
  h1: 'Subscription',
  targetSelector: '#sub', activation: 'click',
  body: `  <span id="lab" hidden>Subscribe</span>
  <button id="sub" type="button" aria-labelledby="lab" onclick="go()"><span id="vis">Subscribe</span></button>`,
  script: `var on=false;function go(){on=!on;document.getElementById('vis').textContent=on?'Unsubscribe':'Subscribe';
  /* BUG: the aria-labelledby target #lab still reads "Subscribe"; the accessible name is computed from #lab, not the visible #vis text, so the name never becomes "Unsubscribe". */}`,
  rationale: 'The visible label flips Subscribe->Unsubscribe, but the accessible name is taken from the aria-labelledby target #lab, which is never updated, so the name stays "Subscribe" after the control becomes an Unsubscribe control. Only a post-activation re-read of the computed name reveals the mismatch.',
  citation: C_412_NAME
});

// P5: title attribute used as name; flips More->Less visibly but title stays "Show more".
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'title-attribute-name-stale',
  h1: 'Article',
  targetSelector: '#more', activation: 'click',
  body: `  <p id="body">Lorem ipsum dolor sit amet...</p>
  <button id="more" type="button" title="Show more" onclick="go()"><span id="mt" class="icon" aria-hidden="true">&#9660;</span></button>`,
  script: `var open=false;function go(){open=!open;document.getElementById('mt').innerHTML=open?'&#9650;':'&#9660;';
  /* BUG: this is an icon-only button (the glyph is aria-hidden), so its accessible name resolves to title="Show more"; the chevron flips to collapse but the title (the name) never updates, so the name stays "Show more" on a now-collapse control. */}`,
  rationale: 'This icon-only button has an aria-hidden glyph, so its accessible name resolves to title="Show more"; on activation the chevron flips to a collapse arrow but the title (the name source) never updates, so the name stays "Show more" though the control now collapses. Only re-reading the name after activation exposes the stale title.',
  citation: C_412_NAME
});

// P6: icon-only toggle uses aria-label "Add to favorites"; visual fills heart but label never says "Remove".
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'icon-button-name-stale-after-state-change',
  h1: 'Photo',
  targetSelector: '#fav', activation: 'click',
  body: `  <button id="fav" type="button" aria-label="Add to favorites" onclick="go()"><span id="hg" class="icon" aria-hidden="true">&#9825;</span></button>`,
  script: `var fav=false;function go(){fav=!fav;document.getElementById('hg').innerHTML=fav?'&#9829;':'&#9825;';
  document.getElementById('fav').classList.toggle('on',fav);
  /* BUG: filled heart now means "Remove from favorites" but aria-label stays "Add to favorites". */}`,
  rationale: 'Activation fills the heart (favorited), so the button now removes from favorites, but aria-label stays "Add to favorites"; a user who already favorited is told "Add to favorites" on a remove button. The stale name is only visible after the toggling click.',
  citation: C_412_NAME
});

// P7: expand/collapse where visible text updates correctly but a stale aria-label overrides it.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'aria-label-overrides-correct-visible-text',
  h1: 'FAQ',
  targetSelector: '#q', activation: 'click',
  body: `  <button id="q" type="button" aria-label="Expand answer" aria-expanded="false" onclick="go()"><span id="qt">Expand answer</span></button>
  <div id="a" class="panel" hidden>42.</div>`,
  script: `function go(){var b=document.getElementById('q'),a=document.getElementById('a');
  var open=a.hidden===false;a.hidden=open;
  document.getElementById('qt').textContent=open?'Expand answer':'Collapse answer';
  b.setAttribute('aria-expanded',(!open).toString());
  /* BUG: developer updated the VISIBLE text correctly to "Collapse answer" but forgot the aria-label, which still says "Expand answer" and overrides the visible text. */}`,
  rationale: 'The visible text correctly flips Expand->Collapse and aria-expanded flips, but the stale aria-label "Expand answer" overrides the visible text in the accessible name, so AT announces "Expand answer" on an already-expanded collapser. The contradiction is only observable after the activation re-read.',
  citation: C_ARIA_LABEL
});

// P8: name built from textContent but the changed text is inside aria-hidden so it never reaches the name.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'changed-text-in-aria-hidden-subtree',
  h1: 'Filter',
  targetSelector: '#flt', activation: 'click',
  body: `  <button id="flt" type="button" onclick="go()"><span aria-hidden="true" id="ft">Apply filter</span></button>`,
  script: `var on=false;function go(){on=!on;document.getElementById('ft').textContent=on?'Clear filter':'Apply filter';
  /* BUG: the only text node is inside an aria-hidden span, so the button has NO accessible name at all; the visible label still changes but the name is empty and certainly never reflects "Clear filter". */}`,
  rationale: 'The visible label flips Apply->Clear, but the text lives in an aria-hidden subtree, so the button has no accessible name in either state; after activation the now-"Clear filter" control is still nameless. A resting check might not flag it as state-related, but the interaction proves the name never tracks the function.',
  citation: C_F89
});

// P9: value-style button (sort) text flips Sort A-Z -> Sort Z-A but aria-label stale "Sort ascending".
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'sort-toggle-name-stale',
  h1: 'Table',
  targetSelector: '#sort', activation: 'click',
  body: `  <button id="sort" type="button" aria-label="Sort ascending" onclick="go()"><span id="srt">Sort A&#8211;Z</span></button>`,
  script: `var asc=true;function go(){asc=!asc;document.getElementById('srt').textContent=asc?'Sort A\\u2013Z':'Sort Z\\u2013A';
  /* BUG: after click it sorts descending but aria-label still "Sort ascending". */}`,
  rationale: 'The visible label flips ascending->descending, but aria-label stays "Sort ascending"; once descending, the control still announces "Sort ascending" (and will re-ascend). The stale name only manifests after the toggling activation.',
  citation: C_412_NAME
});

// P10: keyboard-activated (Enter) custom button; on activation flips Mute->Unmute visibly, data-label updated but name source (aria-label) not.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'key-enter-activation-name-stale',
  h1: 'Mic',
  targetSelector: '#mic', activation: 'key:Enter',
  body: `  <span id="mic" role="button" tabindex="0" aria-label="Mute microphone" onclick="go()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();go();}"><span id="mc">Mute</span></span>`,
  script: `var muted=false;function go(){muted=!muted;document.getElementById('mc').textContent=muted?'Unmute':'Mute';
  /* BUG: aria-label "Mute microphone" overrides the visible text and never updates to "Unmute microphone". */}`,
  rationale: 'Activating via Enter flips the visible label Mute->Unmute, but aria-label "Mute microphone" overrides the visible text and is never updated, so the accessible name stays "Mute microphone" while the control unmutes. Detectable only by re-reading the name after the keyboard activation.',
  citation: C_ARIA_LABEL
});

// P11: status-like button "Mark as read" -> visually "Mark as unread" but name unchanged.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'mark-read-toggle-name-stale',
  h1: 'Inbox',
  targetSelector: '#mr', activation: 'click',
  body: `  <button id="mr" type="button" aria-label="Mark as read" onclick="go()"><span id="mrt">Mark as read</span></button>`,
  script: `var read=false;function go(){read=!read;document.getElementById('mrt').textContent=read?'Mark as unread':'Mark as read';
  /* BUG: visible text updated, but stale aria-label "Mark as read" overrides it. */}`,
  rationale: 'After activation the message is read and the control toggles to "Mark as unread" visibly, but the overriding aria-label "Mark as read" is stale, so the accessible name still says "Mark as read". The mismatch appears only on the post-activation read.',
  citation: C_ARIA_LABEL
});

// P12: two-state button where BOTH states are wrong: name reads opposite of visible from the start AND never updates.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'name-contradicts-and-frozen',
  h1: 'Notifications',
  targetSelector: '#notif', activation: 'key:Space',
  body: `  <button id="notif" type="button" aria-label="Turn off notifications" onclick="go()"><span id="nt">Turn on notifications</span></button>`,
  script: `var on=false;function go(){on=!on;document.getElementById('nt').textContent=on?'Turn off notifications':'Turn on notifications';
  /* BUG: aria-label "Turn off notifications" contradicts the resting visible "Turn on notifications" AND never changes; name is wrong in both states. */}`,
  rationale: 'The accessible name (aria-label "Turn off notifications") already contradicts the resting visible text "Turn on notifications", and it never updates on activation, so the name is wrong before and after the toggle. The interaction confirms the name does not track the visible function in either state.',
  citation: C_ARIA_LABEL
});

// ---------- NEGATIVES (12): name updates correctly on the same interaction ----------

// N1: native button, textContent flips Show->Hide and IS the accessible name (no aria-label). Correct.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'native-button-textcontent-updates',
  h1: 'Account details',
  targetSelector: '#t', activation: 'click',
  body: `  <button id="t" type="button" aria-expanded="false" onclick="go()">Show details</button>
  <div id="p" class="panel" hidden>Name: Ada Lovelace</div>`,
  script: `function go(){var b=document.getElementById('t'),p=document.getElementById('p');
  var open=p.hidden===false;p.hidden=open;b.textContent=open?'Show details':'Hide details';
  b.setAttribute('aria-expanded',(!open).toString());
  /* OK: no aria-label, so the updated textContent IS the accessible name; it tracks Show<->Hide. */}`,
  rationale: 'The native button has no aria-label, so its textContent is the accessible name; the handler updates the text and aria-expanded together, so the name correctly becomes "Hide details" after activation. The post-activation re-read matches the visible function.',
  citation: C_NAME_VERSUS
});

// N2: aria-label IS updated alongside the icon for play/pause.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'play-pause-aria-label-updates',
  h1: 'Audio player',
  targetSelector: '#pp', activation: 'click',
  body: `  <button id="pp" type="button" aria-label="Play" onclick="go()"><span id="g" class="icon" aria-hidden="true">&#9658;</span></button>`,
  script: `var playing=false;function go(){playing=!playing;var b=document.getElementById('pp');
  document.getElementById('g').innerHTML=playing?'&#10074;&#10074;':'&#9658;';
  b.setAttribute('aria-label',playing?'Pause':'Play');
  /* OK: aria-label updates Play<->Pause with the icon. */}`,
  rationale: 'The handler updates aria-label to "Pause" when playback starts, so the accessible name tracks the visible/functional state; the post-activation re-read says "Pause" on the pause button.',
  citation: C_412_NAME
});

// N3: image button alt updated Mute<->Unmute.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'image-button-alt-updates',
  h1: 'Volume control',
  targetSelector: '#mute', activation: 'click',
  body: `  <input id="mute" type="image" alt="Mute"
    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23356'/%3E%3C/svg%3E" onclick="go();return false;">`,
  script: `var muted=false;function go(){muted=!muted;
  document.getElementById('mute').setAttribute('alt',muted?'Unmute':'Mute');
  /* OK: the image control's alt (its accessible name) updates with state. */}`,
  rationale: 'The image button updates its alt to "Unmute" when muted, so its accessible name tracks the function; after activation the name correctly reflects the now-available action.',
  citation: C_F89
});

// N4: aria-labelledby target text updated correctly.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'aria-labelledby-target-updates',
  h1: 'Subscription',
  targetSelector: '#sub', activation: 'click',
  body: `  <span id="lab" hidden>Subscribe</span>
  <button id="sub" type="button" aria-labelledby="lab" onclick="go()"><span id="vis">Subscribe</span></button>`,
  script: `var on=false;function go(){on=!on;var txt=on?'Unsubscribe':'Subscribe';
  document.getElementById('vis').textContent=txt;document.getElementById('lab').textContent=txt;
  /* OK: the aria-labelledby target #lab is updated together with the visible text. */}`,
  rationale: 'The handler updates both the visible text and the aria-labelledby target #lab, so the computed accessible name becomes "Unsubscribe" after activation, matching the visible function.',
  citation: C_412_NAME
});

// N5: pure textContent toggle, no overriding attr; More<->Less.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'textcontent-more-less-updates',
  h1: 'Article',
  targetSelector: '#more', activation: 'click',
  body: `  <p id="body">Lorem ipsum dolor sit amet...</p>
  <button id="more" type="button" aria-expanded="false" onclick="go()">Show more</button>`,
  script: `var open=false;function go(){open=!open;var b=document.getElementById('more');
  b.textContent=open?'Show less':'Show more';b.setAttribute('aria-expanded',open.toString());
  /* OK: textContent is the name and it updates. */}`,
  rationale: 'The button name is its textContent, which the handler updates to "Show less" along with aria-expanded; the post-activation read correctly reflects the collapse action.',
  citation: C_NAME_VERSUS
});

// N6: icon favorite toggle with aria-label updated Add<->Remove.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'icon-button-name-updates',
  h1: 'Photo',
  targetSelector: '#fav', activation: 'click',
  body: `  <button id="fav" type="button" aria-label="Add to favorites" onclick="go()"><span id="hg" class="icon" aria-hidden="true">&#9825;</span></button>`,
  script: `var fav=false;function go(){fav=!fav;var b=document.getElementById('fav');
  document.getElementById('hg').innerHTML=fav?'&#9829;':'&#9825;';
  b.setAttribute('aria-label',fav?'Remove from favorites':'Add to favorites');b.classList.toggle('on',fav);
  /* OK: aria-label updates with the heart state. */}`,
  rationale: 'The icon button updates its aria-label to "Remove from favorites" when favorited, so the accessible name tracks the toggled function; the activated read is correct.',
  citation: C_412_NAME
});

// N7: native checkbox semantics via <label> wrapping; here a real <button> whose accessible name comes only from text and is updated. (extra native control coverage)
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'native-checkbox-label-state',
  h1: 'Settings',
  targetSelector: '#cb', activation: 'click',
  body: `  <label><input id="cb" type="checkbox" onchange="go()"> Enable dark mode</label>
  <span id="st">light</span>`,
  script: `function go(){document.getElementById('st').textContent=document.getElementById('cb').checked?'dark':'light';
  /* OK: native checkbox. Its accessible name "Enable dark mode" is constant and correct in both states; native checked state is exposed by the platform automatically (no stale custom state). */}`,
  rationale: 'A native checkbox keeps a constant, correct accessible name ("Enable dark mode") across states, and the platform exposes its checked state automatically, so there is no stale custom name/state after activation; the control is correctly exposed.',
  citation: C_NAME_VERSUS
});

// N8: sort toggle, aria-label updated ascending<->descending.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'sort-toggle-name-updates',
  h1: 'Table',
  targetSelector: '#sort', activation: 'click',
  body: `  <button id="sort" type="button" aria-label="Sort ascending" onclick="go()"><span id="srt">Sort A&#8211;Z</span></button>`,
  script: `var asc=true;function go(){asc=!asc;var b=document.getElementById('sort');
  document.getElementById('srt').textContent=asc?'Sort A\\u2013Z':'Sort Z\\u2013A';
  b.setAttribute('aria-label',asc?'Sort ascending':'Sort descending');
  /* OK: aria-label tracks ascending/descending. */}`,
  rationale: 'The sort button updates both its visible text and aria-label to "Sort descending" on activation, so the accessible name correctly reflects the next action after the toggle.',
  citation: C_412_NAME
});

// N9: Enter-activated role=button, aria-label updated Mute<->Unmute.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'key-enter-name-updates',
  h1: 'Mic',
  targetSelector: '#mic', activation: 'key:Enter',
  body: `  <span id="mic" role="button" tabindex="0" aria-label="Mute microphone" onclick="go()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();go();}"><span class="icon" aria-hidden="true">&#127908;</span></span>`,
  script: `var muted=false;function go(){muted=!muted;
  document.getElementById('mic').setAttribute('aria-label',muted?'Unmute microphone':'Mute microphone');
  /* OK: aria-label updates on Enter activation. */}`,
  rationale: 'The custom role=button updates aria-label to "Unmute microphone" on Enter activation, so the accessible name correctly tracks the toggled function; the post-activation read is accurate.',
  citation: C_412_NAME
});

// N10: mark read/unread, aria-label updated.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'mark-read-name-updates',
  h1: 'Inbox',
  targetSelector: '#mr', activation: 'click',
  body: `  <button id="mr" type="button" aria-label="Mark as read" onclick="go()"><span id="mrt">Mark as read</span></button>`,
  script: `var read=false;function go(){read=!read;var b=document.getElementById('mr');var t=read?'Mark as unread':'Mark as read';
  document.getElementById('mrt').textContent=t;b.setAttribute('aria-label',t);
  /* OK: visible text and aria-label updated together. */}`,
  rationale: 'Both the visible text and aria-label update to "Mark as unread" after activation, so the accessible name tracks the toggled action; the activated re-read matches the visible label.',
  citation: C_412_NAME
});

// N11: Space-activated toggle, name updates Turn on<->Turn off.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'key-space-name-updates',
  h1: 'Notifications',
  targetSelector: '#notif', activation: 'key:Space',
  body: `  <button id="notif" type="button" onclick="go()">Turn on notifications</button>`,
  script: `var on=false;function go(){on=!on;document.getElementById('notif').textContent=on?'Turn off notifications':'Turn on notifications';
  /* OK: textContent is the name and it updates on Space activation. */}`,
  rationale: 'The native button name is its textContent, updated to "Turn off notifications" on Space activation, so the accessible name correctly tracks the function; the activated read matches the visible label.',
  citation: C_NAME_VERSUS
});

// N12: disclosure where visible text changes and there is no overriding aria-label; name follows correctly (Expand/Collapse) and aria-expanded flips.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'disclosure-name-and-expanded-update',
  h1: 'FAQ',
  targetSelector: '#q', activation: 'click',
  body: `  <button id="q" type="button" aria-expanded="false" onclick="go()">Expand answer</button>
  <div id="a" class="panel" hidden>42.</div>`,
  script: `function go(){var b=document.getElementById('q'),a=document.getElementById('a');
  var open=a.hidden===false;a.hidden=open;
  b.textContent=open?'Expand answer':'Collapse answer';b.setAttribute('aria-expanded',(!open).toString());
  /* OK: visible text is the name; it and aria-expanded update together. */}`,
  rationale: 'The disclosure updates its textContent name to "Collapse answer" and flips aria-expanded together on activation, so both name and state correctly reflect the expanded condition after the click.',
  citation: C_NAME_VERSUS
});

const r = writeCases('stale-name-after-activation', 'Dynamic name', cases);
console.log('stale-name-after-activation:', JSON.stringify(r));
