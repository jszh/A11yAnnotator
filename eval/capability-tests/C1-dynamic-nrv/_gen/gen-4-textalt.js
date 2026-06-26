'use strict';
const { writeCases } = require('./shared');

const C_412 = '"states, properties, and values that can be set by the user can be programmatically set; and notification of changes to these items is available to user agents, including assistive technology." — WCAG 2.2 SC 4.1.2 Name, Role, Value';
const C_F89 = '"F89: Failure of Success Criteria 1.1.1, 2.4.4, and 4.1.2 due to using null alt on an image where the image is the only content in a link" — an image control\'s text alternative must reflect its current function';
const C_F86 = '"F86: Failure of Success Criterion 4.1.2 due to not providing names for each part of a multipart form field" — each functional part must carry a current, correct name/text alternative';
const C_G94 = '"G94: Providing short text alternative for non-text content that serves the same purpose and presents the same information as the non-text content" — when the image\'s meaning changes, its short text alternative must change to keep presenting the same information';

const cases = [];

// ---------- POSITIVES (12) ----------

// P1: icon button with <img alt>; icon swaps grid->list but alt stays "Grid view".
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'icon-button-img-alt-stale',
  h1: 'Gallery', targetSelector: '#vw', activation: 'click',
  body: `  <button id="vw" type="button" onclick="go()"><img id="ic" alt="Grid view"
    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' fill='%23356'/%3E%3C/svg%3E"></button>`,
  script: `var grid=true;function go(){grid=!grid;document.getElementById('ic').style.opacity=grid?'1':'0.5';
  /* BUG: clicking switches to list view (visual change) but the img alt stays "Grid view"; the button's name comes from the alt and is now stale relative to its function (it now switches to grid). */}`,
  rationale: 'The view-toggle icon changes function (now switches to grid) but its img alt stays "Grid view", so the button name no longer matches what it does. The resting alt is correct; only re-reading after activation reveals the stale text alternative.',
  citation: C_F89
});

// P2: status icon (checkmark) text alt "Saved" stays after state changes to error.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'status-icon-alt-stale',
  h1: 'Document', targetSelector: '#save', activation: 'click',
  body: `  <button id="save" type="button" onclick="go()">Save</button>
  <img id="st" alt="Saved"
    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='9' fill='%23090'/%3E%3C/svg%3E">`,
  script: `var ok=true;function go(){ok=!ok;var st=document.getElementById('st');
  st.src=ok?"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='9' fill='%23090'/%3E%3C/svg%3E":"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='9' fill='%23b00'/%3E%3C/svg%3E";
  /* BUG: the status icon turns red (error) but its alt stays "Saved", so the status text alternative is stale and now wrong. */}`,
  rationale: 'After activation the status icon turns red (error state) but its alt stays "Saved", so the text alternative contradicts the actual status. The stale alt is only observable after the state-changing click.',
  citation: C_G94
});

// P3: SVG icon with <title> used as name; title stays "Locked" after unlocking.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'svg-title-alt-stale',
  h1: 'Privacy', targetSelector: '#lk', activation: 'click',
  body: `  <button id="lk" type="button" onclick="go()"><svg width="24" height="24" role="img" aria-labelledby="lt"><title id="lt">Locked</title><rect width="24" height="24" fill="#356"/></svg></button>
  <span id="ls">private</span>`,
  script: `var locked=true;function go(){locked=!locked;document.getElementById('ls').textContent=locked?'private':'public';
  /* BUG: the lock toggles to unlocked/public but the SVG <title> (the accessible name) stays "Locked". */}`,
  rationale: 'Activating the lock makes it public/unlocked, but the SVG <title> that names the button stays "Locked", so the text alternative is stale relative to the new state. Detectable only by re-reading the name after the toggle.',
  citation: C_412
});

// P4: aria-label on icon button "Expand sidebar" stays after sidebar expands (now collapses).
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'icon-button-aria-label-stale',
  h1: 'Layout', targetSelector: '#sb', activation: 'click',
  body: `  <button id="sb" type="button" aria-label="Expand sidebar" onclick="go()"><span class="icon" id="ci" aria-hidden="true">&#8594;</span></button>
  <div id="side" class="panel" hidden>Sidebar</div>`,
  script: `var open=false;function go(){open=!open;document.getElementById('side').hidden=!open;
  document.getElementById('ci').innerHTML=open?'&#8592;':'&#8594;';
  /* BUG: the chevron flips and the sidebar opens, but aria-label stays "Expand sidebar" even though it now collapses. */}`,
  rationale: 'The chevron flips and the sidebar opens, so the button now collapses the sidebar, but aria-label stays "Expand sidebar"; the text alternative is stale relative to the changed function. Only the post-activation read exposes it.',
  citation: C_F89
});

// P5: a like counter status whose aria-label "0 likes" never updates after liking.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'status-count-alt-stale',
  h1: 'Post', targetSelector: '#like', activation: 'click',
  body: `  <button id="like" type="button" aria-label="Like" onclick="go()">&#9825;</button>
  <span id="cnt" role="status" aria-label="0 likes">0</span>`,
  script: `var n=0;function go(){n++;document.getElementById('cnt').textContent=n;
  /* BUG: the visible count updates and the role=status text node changes, but aria-label "0 likes" overrides the text content and never updates, so the status name stays "0 likes". */}`,
  rationale: 'The visible like count increases, but the status\'s aria-label "0 likes" overrides its text content and never updates, so the exposed status name stays "0 likes". The stale alternative is only observable after liking.',
  citation: C_412
});

// P6: stepper +/- buttons whose alt/aria-label describe a fixed quantity that no longer applies.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'multipart-stepper-name-stale',
  h1: 'Cart', targetSelector: '#inc', activation: 'click',
  body: `  <span>Apples</span>
  <button id="dec" type="button" aria-label="Remove one, 2 in cart" onclick="step(-1)">&minus;</button>
  <span id="q">2</span>
  <button id="inc" type="button" aria-label="Add one, 2 in cart" onclick="step(1)">+</button>`,
  script: `var q=2;function step(d){q=Math.max(0,q+d);document.getElementById('q').textContent=q;
  /* BUG: the buttons' aria-labels embed the count "2 in cart" but are never updated; after changing the quantity the names misreport the cart count (a multipart control with stale per-part names). */}`,
  rationale: 'Each stepper button embeds the cart count ("2 in cart") in its name, but the names never update after the quantity changes, so the per-part names misreport the count. F86-style stale naming on a multipart control is only visible after activation.',
  citation: C_F86
});

// P7: toggle that swaps a sun/moon icon; aria-label "Switch to dark mode" stays after switching to dark.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'theme-toggle-alt-stale',
  h1: 'Theme', targetSelector: '#th', activation: 'click',
  body: `  <button id="th" type="button" aria-label="Switch to dark mode" onclick="go()"><span class="icon" id="ti" aria-hidden="true">&#9728;</span></button>`,
  script: `var dark=false;function go(){dark=!dark;document.body.style.background=dark?'#111':'#fff';document.body.style.color=dark?'#eee':'#1a1a1a';
  document.getElementById('ti').innerHTML=dark?'&#9789;':'&#9728;';
  /* BUG: after switching to dark, the button should say "Switch to light mode" but aria-label stays "Switch to dark mode". */}`,
  rationale: 'After switching to dark mode the button now switches to light, but aria-label stays "Switch to dark mode", so the text alternative is stale relative to the new function. Only re-reading after activation reveals it.',
  citation: C_F89
});

// P8: connection status component aria-label "Online" frozen after going offline.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'connection-status-alt-stale',
  h1: 'Sync', targetSelector: '#tog', activation: 'click',
  body: `  <button id="tog" type="button" onclick="go()">Toggle connection</button>
  <span id="dot" role="img" aria-label="Online" style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#090"></span>`,
  script: `var online=true;function go(){online=!online;var d=document.getElementById('dot');
  d.style.background=online?'#090':'#b00';
  /* BUG: the status dot turns red (offline) but its aria-label stays "Online", so the status image's text alternative is stale and wrong. */}`,
  rationale: 'Toggling connection turns the status dot red (offline), but its aria-label stays "Online", so the role=img status text alternative is stale and now wrong. The stale label is only observable after the toggle.',
  citation: C_G94
});

// P9: play button uses <img alt="Play"> inside; after play the icon changes to pause but alt stays.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'media-icon-img-alt-stale',
  h1: 'Video', targetSelector: '#pp', activation: 'key:Enter',
  body: `  <button id="pp" type="button" onclick="go()"><img id="pi" alt="Play"
    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpolygon points='6,4 20,12 6,20' fill='%23356'/%3E%3C/svg%3E"></button>`,
  script: `var playing=false;function go(){playing=!playing;document.getElementById('pi').src=playing?"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect x='5' y='4' width='4' height='16' fill='%23356'/%3E%3Crect x='15' y='4' width='4' height='16' fill='%23356'/%3E%3C/svg%3E":"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpolygon points='6,4 20,12 6,20' fill='%23356'/%3E%3C/svg%3E";
  /* BUG: the icon image changes to the pause glyph but its alt stays "Play"; the button name (from the img alt) is now stale. */}`,
  rationale: 'On Enter the icon image swaps to the pause glyph, but its alt stays "Play", so the button name from the img alt is stale relative to the now-pause function. Detectable only by re-reading the name after activation.',
  citation: C_F89
});

// P10: notification bell with badge; aria-label "Notifications, none" frozen after a new notification appears.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'badge-count-alt-stale',
  h1: 'Bell', targetSelector: '#add', activation: 'click',
  body: `  <button id="bell" type="button" aria-label="Notifications, none">&#128276; <span id="badge">0</span></button>
  <button id="add" type="button" onclick="go()">Simulate new</button>`,
  script: `var n=0;function go(){n++;document.getElementById('badge').textContent=n;
  /* BUG: the badge count rises but the bell's aria-label stays "Notifications, none", so the component's text alternative no longer matches its state. */}`,
  rationale: 'A new notification raises the visible badge, but the bell\'s aria-label stays "Notifications, none", so the component\'s text alternative no longer matches its state. The stale alt is only observable after the state change.',
  citation: C_412
});

// P11: expand-row chevron button; aria-label "Show row details" stale after row expands.
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'row-expander-alt-stale',
  h1: 'Orders', targetSelector: '#rx', activation: 'key:Space',
  body: `  <button id="rx" type="button" aria-label="Show row details" aria-expanded="false" onclick="go()"><span class="icon" id="cx" aria-hidden="true">&#9654;</span></button>
  <div id="det" class="panel" hidden>Order #1001 details</div>`,
  script: `function go(){var d=document.getElementById('det');var open=d.hidden===false;d.hidden=open;
  document.getElementById('rx').setAttribute('aria-expanded',(!open).toString());
  document.getElementById('cx').innerHTML=open?'&#9654;':'&#9660;';
  /* BUG: aria-expanded flips correctly but aria-label stays "Show row details" even when expanded (should be "Hide row details"); the text alternative is stale. */}`,
  rationale: 'aria-expanded flips correctly, but the icon button\'s aria-label stays "Show row details" even when the row is expanded, so the text alternative is stale relative to the now-hide function. The mismatch surfaces only after the activation re-read.',
  citation: C_F89
});

// P12: a "copy" icon button whose aria-label changes visually to "Copied!" via a tooltip but the accessible name stays "Copy" forever (no notification of the changed confirmation).
cases.push({
  polarity: 'positive', expected: 'failed',
  dimension: 'copied-confirmation-not-exposed',
  h1: 'Snippet', targetSelector: '#cp', activation: 'click',
  body: `  <button id="cp" type="button" aria-label="Copy" onclick="go()"><span class="icon" aria-hidden="true">&#128203;</span></button>
  <span id="tip" aria-hidden="true"></span>`,
  script: `function go(){var tip=document.getElementById('tip');tip.textContent='Copied!';tip.style.marginLeft='8px';
  /* BUG: the visible "Copied!" confirmation appears in an aria-hidden span and the button name stays "Copy"; the changed confirmation state is never notified to AT (no live region, no name change). */}`,
  rationale: 'The visible "Copied!" confirmation appears in an aria-hidden span and the button name stays "Copy", so the confirmation state change is never notified to AT. The interaction shows the changed status is exposed only visually.',
  citation: C_412
});

// ---------- NEGATIVES (12) ----------

// N1: view-toggle img alt updates Grid<->List.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'icon-button-img-alt-updates',
  h1: 'Gallery', targetSelector: '#vw', activation: 'click',
  body: `  <button id="vw" type="button" onclick="go()"><img id="ic" alt="Switch to list view"
    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' fill='%23356'/%3E%3C/svg%3E"></button>`,
  script: `var grid=true;function go(){grid=!grid;document.getElementById('ic').setAttribute('alt',grid?'Switch to list view':'Switch to grid view');
  document.getElementById('ic').style.opacity=grid?'1':'0.5';
  /* OK: the img alt (the button name) updates to describe the NEXT action. */}`,
  rationale: 'The view-toggle updates its img alt to describe the next action ("Switch to grid view") on activation, so the button name tracks its changed function; the post-activation read is correct.',
  citation: C_F89
});

// N2: status icon alt updates Saved<->Error.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'status-icon-alt-updates',
  h1: 'Document', targetSelector: '#save', activation: 'click',
  body: `  <button id="save" type="button" onclick="go()">Save</button>
  <img id="st" alt="Saved"
    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='9' fill='%23090'/%3E%3C/svg%3E">`,
  script: `var ok=true;function go(){ok=!ok;var st=document.getElementById('st');st.setAttribute('alt',ok?'Saved':'Save failed');
  st.src=ok?"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='9' fill='%23090'/%3E%3C/svg%3E":"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='9' fill='%23b00'/%3E%3C/svg%3E";
  /* OK: the status alt updates with the icon to "Save failed". */}`,
  rationale: 'The status icon updates its alt to "Save failed" when it turns red, so the text alternative matches the actual status after activation.',
  citation: C_G94
});

// N3: SVG title updates Locked<->Unlocked.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'svg-title-updates',
  h1: 'Privacy', targetSelector: '#lk', activation: 'click',
  body: `  <button id="lk" type="button" onclick="go()"><svg width="24" height="24" role="img" aria-labelledby="lt"><title id="lt">Locked</title><rect width="24" height="24" fill="#356"/></svg></button>
  <span id="ls">private</span>`,
  script: `var locked=true;function go(){locked=!locked;document.getElementById('ls').textContent=locked?'private':'public';
  document.getElementById('lt').textContent=locked?'Locked':'Unlocked';
  /* OK: the SVG <title> updates with the state. */}`,
  rationale: 'The SVG <title> that names the button updates to "Unlocked" when the state changes, so the text alternative tracks the new state; the post-activation read is correct.',
  citation: C_412
});

// N4: sidebar icon aria-label updates Expand<->Collapse.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'icon-button-aria-label-updates',
  h1: 'Layout', targetSelector: '#sb', activation: 'click',
  body: `  <button id="sb" type="button" aria-label="Expand sidebar" onclick="go()"><span class="icon" id="ci" aria-hidden="true">&#8594;</span></button>
  <div id="side" class="panel" hidden>Sidebar</div>`,
  script: `var open=false;function go(){open=!open;document.getElementById('side').hidden=!open;
  document.getElementById('ci').innerHTML=open?'&#8592;':'&#8594;';
  document.getElementById('sb').setAttribute('aria-label',open?'Collapse sidebar':'Expand sidebar');
  /* OK: aria-label updates with the chevron and function. */}`,
  rationale: 'The sidebar toggle updates aria-label to "Collapse sidebar" when expanded, so the text alternative matches the changed function after activation.',
  citation: C_F89
});

// N5: live like count exposed via role=status without an overriding aria-label.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'status-count-live-text',
  h1: 'Post', targetSelector: '#like', activation: 'click',
  body: `  <button id="like" type="button" aria-label="Like" onclick="go()">&#9825;</button>
  <span id="cnt" role="status" aria-live="polite">0 likes</span>`,
  script: `var n=0;function go(){n++;document.getElementById('cnt').textContent=n+(n===1?' like':' likes');
  /* OK: the role=status has no overriding aria-label, so its updated text content (and aria-live) notifies the new count. */}`,
  rationale: 'The like counter has no overriding aria-label, so its updated text content within a polite live region notifies the new count to AT after activation; the exposed status is current.',
  citation: C_412
});

// N6: stepper aria-labels update with the count.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'multipart-stepper-name-updates',
  h1: 'Cart', targetSelector: '#inc', activation: 'click',
  body: `  <span>Apples</span>
  <button id="dec" type="button" aria-label="Remove one apple, 2 in cart" onclick="step(-1)">&minus;</button>
  <span id="q">2</span>
  <button id="inc" type="button" aria-label="Add one apple, 2 in cart" onclick="step(1)">+</button>`,
  script: `var q=2;function step(d){q=Math.max(0,q+d);document.getElementById('q').textContent=q;
  document.getElementById('dec').setAttribute('aria-label','Remove one apple, '+q+' in cart');
  document.getElementById('inc').setAttribute('aria-label','Add one apple, '+q+' in cart');
  /* OK: both stepper buttons' names update with the cart count. */}`,
  rationale: 'Both stepper buttons update their aria-labels to embed the current cart count after each change, so the per-part names stay accurate on this multipart control.',
  citation: C_F86
});

// N7: theme toggle aria-label updates dark<->light.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'theme-toggle-alt-updates',
  h1: 'Theme', targetSelector: '#th', activation: 'click',
  body: `  <button id="th" type="button" aria-label="Switch to dark mode" onclick="go()"><span class="icon" id="ti" aria-hidden="true">&#9728;</span></button>`,
  script: `var dark=false;function go(){dark=!dark;document.body.style.background=dark?'#111':'#fff';document.body.style.color=dark?'#eee':'#1a1a1a';
  document.getElementById('ti').innerHTML=dark?'&#9789;':'&#9728;';
  document.getElementById('th').setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
  /* OK: aria-label updates to the next action. */}`,
  rationale: 'The theme toggle updates aria-label to "Switch to light mode" after switching to dark, so the text alternative tracks the changed function; the post-activation read is correct.',
  citation: C_F89
});

// N8: connection status aria-label updates Online<->Offline.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'connection-status-alt-updates',
  h1: 'Sync', targetSelector: '#tog', activation: 'click',
  body: `  <button id="tog" type="button" onclick="go()">Toggle connection</button>
  <span id="dot" role="img" aria-label="Online" style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#090"></span>`,
  script: `var online=true;function go(){online=!online;var d=document.getElementById('dot');
  d.style.background=online?'#090':'#b00';d.setAttribute('aria-label',online?'Online':'Offline');
  /* OK: the status image's aria-label updates with its color. */}`,
  rationale: 'The connection status updates its aria-label to "Offline" when it turns red, so the role=img text alternative matches the actual status after activation.',
  citation: C_G94
});

// N9: media icon img alt updates Play<->Pause (Enter).
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'media-icon-img-alt-updates',
  h1: 'Video', targetSelector: '#pp', activation: 'key:Enter',
  body: `  <button id="pp" type="button" onclick="go()"><img id="pi" alt="Play"
    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpolygon points='6,4 20,12 6,20' fill='%23356'/%3E%3C/svg%3E"></button>`,
  script: `var playing=false;function go(){playing=!playing;var pi=document.getElementById('pi');pi.setAttribute('alt',playing?'Pause':'Play');
  pi.src=playing?"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect x='5' y='4' width='4' height='16' fill='%23356'/%3E%3Crect x='15' y='4' width='4' height='16' fill='%23356'/%3E%3C/svg%3E":"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpolygon points='6,4 20,12 6,20' fill='%23356'/%3E%3C/svg%3E";
  /* OK: img alt updates Play<->Pause with the glyph. */}`,
  rationale: 'On Enter the icon image swaps to the pause glyph and its alt updates to "Pause", so the button name from the img alt tracks the function; the post-activation read is correct.',
  citation: C_F89
});

// N10: bell badge aria-label updates with the count.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'badge-count-alt-updates',
  h1: 'Bell', targetSelector: '#add', activation: 'click',
  body: `  <button id="bell" type="button" aria-label="Notifications, none">&#128276; <span id="badge">0</span></button>
  <button id="add" type="button" onclick="go()">Simulate new</button>`,
  script: `var n=0;function go(){n++;document.getElementById('badge').textContent=n;
  document.getElementById('bell').setAttribute('aria-label','Notifications, '+n+' new');
  /* OK: the bell's aria-label updates to the new count. */}`,
  rationale: 'The bell updates its aria-label to "Notifications, N new" as the badge rises, so the component\'s text alternative matches its state after activation.',
  citation: C_412
});

// N11: row expander aria-label updates Show<->Hide (Space).
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'row-expander-alt-updates',
  h1: 'Orders', targetSelector: '#rx', activation: 'key:Space',
  body: `  <button id="rx" type="button" aria-label="Show row details" aria-expanded="false" onclick="go()"><span class="icon" id="cx" aria-hidden="true">&#9654;</span></button>
  <div id="det" class="panel" hidden>Order #1001 details</div>`,
  script: `function go(){var d=document.getElementById('det');var open=d.hidden===false;d.hidden=open;
  document.getElementById('rx').setAttribute('aria-expanded',(!open).toString());
  document.getElementById('rx').setAttribute('aria-label',open?'Show row details':'Hide row details');
  document.getElementById('cx').innerHTML=open?'&#9654;':'&#9660;';
  /* OK: aria-label and aria-expanded both update with the row. */}`,
  rationale: 'The row expander updates both aria-expanded and aria-label ("Hide row details") when the row opens, so the text alternative and state both track the function after activation.',
  citation: C_F89
});

// N12: copy button exposes "Copied!" via a live region and updates its name.
cases.push({
  polarity: 'negative', expected: 'passed',
  dimension: 'copied-confirmation-exposed',
  h1: 'Snippet', targetSelector: '#cp', activation: 'click',
  body: `  <button id="cp" type="button" aria-label="Copy" onclick="go()"><span class="icon" aria-hidden="true">&#128203;</span></button>
  <span id="tip" role="status" aria-live="polite"></span>`,
  script: `function go(){document.getElementById('tip').textContent='Copied!';
  document.getElementById('cp').setAttribute('aria-label','Copy (copied)');
  /* OK: the confirmation is in a polite live region and the button name updates, so the change is notified. */}`,
  rationale: 'The "Copied!" confirmation is placed in a polite live region and the button name updates, so the confirmation state change is notified to AT after activation; the change is exposed, not visual-only.',
  citation: C_412
});

const r = writeCases('dynamic-named-component-text-alt-stale', 'Dynamic text alternative', cases);
console.log('dynamic-named-component-text-alt-stale:', JSON.stringify(r));
