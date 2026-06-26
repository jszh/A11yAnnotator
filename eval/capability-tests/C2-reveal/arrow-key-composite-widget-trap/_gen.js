#!/usr/bin/env node
/* Generator: arrow-key-composite-widget-trap (SC 2.1.2 No Keyboard Trap + F10).
 * A roving-tabindex composite (menu / tablist / grid / listbox / toolbar /
 * radiogroup) where ARROW keys move focus WITHIN the widget. The defect:
 * Tab / Shift+Tab cannot ESCAPE the widget (keyboard trap) and no advisory
 * is given. Negatives let Tab move focus OUT to the next widget per APG.
 *
 * The capability drives interaction:"key:Tab" after entering the widget to
 * test whether focus can leave.
 *
 * Grounding (verbatim):
 *   SC 2.1.2 No Keyboard Trap: "If keyboard focus can be moved to a component
 *   of the page using a keyboard interface, then focus can be moved away from
 *   that component using only a keyboard interface, and, if it requires more
 *   than unmodified arrow or tab keys or other standard exit methods, the user
 *   is advised of the method for moving focus away."
 *   APG roving tabindex: "the tab and shift + tab keys move focus from one UI
 *   component to another while other keys, primarily the arrow keys, move focus
 *   inside of components that include multiple focusable elements."
 */
const fs = require('fs');
const path = require('path');
const DIR = __dirname;

const HEAD = (n, pol, dim) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>2.1.2 arrow-key-composite-widget-trap case ${n}</title>
<style>
  body{font:16px/1.5 system-ui,sans-serif;margin:40px;max-width:680px;color:#1a1a1a}
  h1{font-size:20px}
  button,[role]{font:inherit}
  .before,.after{display:inline-block;margin:6px 0;padding:8px 14px;border:1px solid #555;border-radius:6px;background:#f4f4f4}
  [role=menubar],[role=menu],[role=tablist],[role=toolbar],[role=radiogroup]{display:flex;gap:6px;padding:6px;border:1px solid #888;border-radius:8px;margin:10px 0;background:#fafafa}
  [role=menu]{flex-direction:column;width:200px}
  [role=menuitem],[role=tab],[role=button],[role=radio]{padding:7px 12px;border:1px solid #777;border-radius:6px;background:#fff;cursor:pointer}
  [role=listbox]{display:block;width:240px;border:1px solid #888;border-radius:8px;padding:4px;margin:10px 0;background:#fafafa}
  [role=option]{padding:6px 10px;border-radius:5px;cursor:pointer}
  [role=grid]{display:grid;grid-template-columns:repeat(3,60px);gap:4px;margin:10px 0}
  [role=gridcell]{border:1px solid #777;text-align:center;padding:10px;background:#fff}
  :focus{outline:3px solid #2557d6;outline-offset:2px}
  [aria-selected=true],[aria-checked=true],[tabindex="0"]:focus{background:#e6eefc}
  .help{color:#555;font-size:14px}
</style></head>
<body>
<!-- 2.1.2 ${pol} | arrow-key-composite-widget-trap | ${dim} -->`;
const FOOT = `\n</body></html>\n`;

/* Shared roving helpers (inline per file). Positive cases SWALLOW Tab; negatives
   let the browser's native Tab proceed (do not preventDefault on Tab). */

const positives = [
{ file:'case-01.html', dim:'menubar-tab-swallowed-no-exit', widget:'[role=menubar]', trigger:'#mi0', interaction:'key:Tab',
  rationale:'Focus enters the menubar (roving tabindex). Arrow keys move within, but the keydown handler calls preventDefault() on Tab as well, so Tab and Shift+Tab can never move focus out of the menubar to the surrounding page. No advisory is given for an alternate exit, so the user is trapped (F10).',
  body:`  <h1>App menubar</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="menubar" aria-label="Main">
    <button id="mi0" role="menuitem" tabindex="0">File</button>
    <button role="menuitem" tabindex="-1">Edit</button>
    <button role="menuitem" tabindex="-1">View</button>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var items=[...document.querySelectorAll('[role=menuitem]')],i=0;
document.querySelector('[role=menubar]').addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();items[i].tabIndex=-1;i=(i+(e.key==='ArrowRight'?1:items.length-1))%items.length;items[i].tabIndex=0;items[i].focus();}
  else if(e.key==='Tab'){e.preventDefault();/* BUG: Tab is swallowed -> no keyboard exit, no advisory. */}
});
</script>` },

{ file:'case-02.html', dim:'tablist-tab-cycles-within-only', widget:'[role=tablist]', trigger:'#t0', interaction:'key:Tab',
  rationale:'A tablist intercepts Tab and Shift+Tab and re-routes them to cycle among the tabs instead of letting focus leave; arrow keys also cycle. There is no unmodified-key path out of the tablist and no advisory, so the composite is a keyboard trap (F10).',
  body:`  <h1>Settings tabs</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="tablist" aria-label="Settings">
    <button id="t0" role="tab" tabindex="0" aria-selected="true">General</button>
    <button role="tab" tabindex="-1" aria-selected="false">Privacy</button>
    <button role="tab" tabindex="-1" aria-selected="false">Account</button>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var tabs=[...document.querySelectorAll('[role=tab]')],i=0;
function move(d){tabs[i].tabIndex=-1;tabs[i].setAttribute('aria-selected','false');i=(i+d+tabs.length)%tabs.length;tabs[i].tabIndex=0;tabs[i].setAttribute('aria-selected','true');tabs[i].focus();}
document.querySelector('[role=tablist]').addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'){e.preventDefault();move(1);}
  else if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}
  else if(e.key==='Tab'){e.preventDefault();move(e.shiftKey?-1:1);/* BUG: Tab is repurposed to cycle tabs, never exits. */}
});
</script>` },

{ file:'case-03.html', dim:'listbox-tab-trapped-roving', widget:'[role=listbox]', trigger:'#o0', interaction:'key:Tab',
  rationale:'A single-select listbox with roving tabindex traps Tab: the keydown handler preventDefaults Tab so focus stays on the current option, with arrow keys the only movement. No exit key works and no instruction is provided (F10).',
  body:`  <h1>Pick a country</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="listbox" aria-label="Country" tabindex="-1">
    <div id="o0" role="option" tabindex="0" aria-selected="true">Australia</div>
    <div role="option" tabindex="-1" aria-selected="false">Brazil</div>
    <div role="option" tabindex="-1" aria-selected="false">Canada</div>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var opts=[...document.querySelectorAll('[role=option]')],i=0;
function sel(n){opts[i].tabIndex=-1;opts[i].setAttribute('aria-selected','false');i=n;opts[i].tabIndex=0;opts[i].setAttribute('aria-selected','true');opts[i].focus();}
document.querySelector('[role=listbox]').addEventListener('keydown',function(e){
  if(e.key==='ArrowDown'){e.preventDefault();sel((i+1)%opts.length);}
  else if(e.key==='ArrowUp'){e.preventDefault();sel((i+opts.length-1)%opts.length);}
  else if(e.key==='Tab'){e.preventDefault();/* BUG: Tab swallowed, focus cannot leave the listbox. */}
});
</script>` },

{ file:'case-04.html', dim:'grid-tab-trapped-2d', widget:'[role=grid]', trigger:'#c0', interaction:'key:Tab',
  rationale:'A 3x3 grid uses arrow keys for 2-D navigation but its keydown handler also intercepts Tab to wrap to the next cell, so Tab never leaves the grid. With no advisory and no working exit key, it is a keyboard trap (F10).',
  body:`  <h1>Date picker grid</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="grid" aria-label="Days">
    <div id="c0" role="gridcell" tabindex="0">1</div><div role="gridcell" tabindex="-1">2</div><div role="gridcell" tabindex="-1">3</div>
    <div role="gridcell" tabindex="-1">4</div><div role="gridcell" tabindex="-1">5</div><div role="gridcell" tabindex="-1">6</div>
    <div role="gridcell" tabindex="-1">7</div><div role="gridcell" tabindex="-1">8</div><div role="gridcell" tabindex="-1">9</div>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var cells=[...document.querySelectorAll('[role=gridcell]')],i=0;
function go(n){if(n<0||n>=cells.length)return;cells[i].tabIndex=-1;i=n;cells[i].tabIndex=0;cells[i].focus();}
document.querySelector('[role=grid]').addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'){e.preventDefault();go(i+1);}
  else if(e.key==='ArrowLeft'){e.preventDefault();go(i-1);}
  else if(e.key==='ArrowDown'){e.preventDefault();go(i+3);}
  else if(e.key==='ArrowUp'){e.preventDefault();go(i-3);}
  else if(e.key==='Tab'){e.preventDefault();go((i+1)%cells.length);/* BUG: Tab re-routed inside grid, never exits. */}
});
</script>` },

{ file:'case-05.html', dim:'toolbar-shift-tab-trapped', widget:'[role=toolbar]', trigger:'#tb1', interaction:'key:Tab',
  rationale:'A toolbar lets Tab move forward out of the widget but intercepts Shift+Tab (preventDefault) to keep cycling backward inside the toolbar, so a user cannot reverse out to the preceding content. A partial trap on Shift+Tab still violates 2.1.2 (no advisory provided).',
  body:`  <h1>Formatting toolbar</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="toolbar" aria-label="Format">
    <button id="tb1" role="button" tabindex="0">Bold</button>
    <button role="button" tabindex="-1">Italic</button>
    <button role="button" tabindex="-1">Underline</button>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var btns=[...document.querySelectorAll('[role=toolbar] [role=button]')],i=0;
function mv(d){btns[i].tabIndex=-1;i=(i+d+btns.length)%btns.length;btns[i].tabIndex=0;btns[i].focus();}
document.querySelector('[role=toolbar]').addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'){e.preventDefault();mv(1);}
  else if(e.key==='ArrowLeft'){e.preventDefault();mv(-1);}
  else if(e.key==='Tab'&&e.shiftKey){e.preventDefault();mv(-1);/* BUG: Shift+Tab trapped, cannot exit backward. */}
});
</script>` },

{ file:'case-06.html', dim:'menu-escape-needed-but-undisclosed', widget:'[role=menu]', trigger:'#m0', interaction:'key:Tab',
  rationale:'A popup menu requires Escape to leave (Tab is swallowed) but provides no visible or programmatic advisory of that exit method; per 2.1.2, when exit needs more than unmodified Tab/arrows the user must be advised. The undisclosed non-standard exit makes this a trap.',
  body:`  <h1>Context menu</h1>
  <a class="before" href="#a">Before widget</a>
  <ul role="menu" aria-label="Actions">
    <li id="m0" role="menuitem" tabindex="0">Open</li>
    <li role="menuitem" tabindex="-1">Share</li>
    <li role="menuitem" tabindex="-1">Delete</li>
  </ul>
  <a class="after" href="#b">After widget</a>
<script>
var its=[...document.querySelectorAll('[role=menuitem]')],i=0;
function mv(d){its[i].tabIndex=-1;i=(i+d+its.length)%its.length;its[i].tabIndex=0;its[i].focus();}
document.querySelector('[role=menu]').addEventListener('keydown',function(e){
  if(e.key==='ArrowDown'){e.preventDefault();mv(1);}
  else if(e.key==='ArrowUp'){e.preventDefault();mv(-1);}
  else if(e.key==='Tab'){e.preventDefault();/* BUG: only Escape exits, but that is never advised to the user. */}
  /* Escape handler exists but is undisclosed: */
  else if(e.key==='Escape'){document.querySelector('.after').focus();}
});
</script>` },

{ file:'case-07.html', dim:'radiogroup-tab-trapped', widget:'[role=radiogroup]', trigger:'#r0', interaction:'key:Tab',
  rationale:'A custom radiogroup with roving tabindex swallows Tab so focus cannot move past the group; arrow keys are the only navigation. Native radio groups let Tab exit, but this custom one preventDefaults Tab with no advisory, trapping the user (F10).',
  body:`  <h1>Plan</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="radiogroup" aria-label="Plan">
    <div id="r0" role="radio" tabindex="0" aria-checked="true">Basic</div>
    <div role="radio" tabindex="-1" aria-checked="false">Pro</div>
    <div role="radio" tabindex="-1" aria-checked="false">Team</div>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var rs=[...document.querySelectorAll('[role=radio]')],i=0;
function pick(n){rs[i].tabIndex=-1;rs[i].setAttribute('aria-checked','false');i=n;rs[i].tabIndex=0;rs[i].setAttribute('aria-checked','true');rs[i].focus();}
document.querySelector('[role=radiogroup]').addEventListener('keydown',function(e){
  if(e.key==='ArrowDown'||e.key==='ArrowRight'){e.preventDefault();pick((i+1)%rs.length);}
  else if(e.key==='ArrowUp'||e.key==='ArrowLeft'){e.preventDefault();pick((i+rs.length-1)%rs.length);}
  else if(e.key==='Tab'){e.preventDefault();/* BUG: Tab swallowed, focus cannot leave the radiogroup. */}
});
</script>` },

{ file:'case-08.html', dim:'menu-both-tab-directions-blocked', widget:'[role=menu]', trigger:'#mm0', interaction:'key:Tab',
  rationale:'This menu blocks both Tab and Shift+Tab unconditionally (preventDefault on every Tab keydown) and offers no Escape or other exit; once focus is in the menu it is fully trapped in both directions with no advisory. Clear F10.',
  body:`  <h1>Profile menu</h1>
  <a class="before" href="#a">Before widget</a>
  <ul role="menu" aria-label="Profile">
    <li id="mm0" role="menuitem" tabindex="0">Account</li>
    <li role="menuitem" tabindex="-1">Billing</li>
    <li role="menuitem" tabindex="-1">Sign out</li>
  </ul>
  <a class="after" href="#b">After widget</a>
<script>
var its=[...document.querySelectorAll('[role=menuitem]')],i=0;
function mv(d){its[i].tabIndex=-1;i=(i+d+its.length)%its.length;its[i].tabIndex=0;its[i].focus();}
document.querySelector('[role=menu]').addEventListener('keydown',function(e){
  if(e.key==='ArrowDown'){e.preventDefault();mv(1);}
  else if(e.key==='ArrowUp'){e.preventDefault();mv(-1);}
  else if(e.key==='Tab'){e.preventDefault();e.stopPropagation();/* BUG: both directions blocked, no exit at all. */}
});
</script>` },

{ file:'case-09.html', dim:'tablist-focus-loop-refocus-on-blur', widget:'[role=tablist]', trigger:'#tt0', interaction:'key:Tab',
  rationale:'When the active tab loses focus (e.g. by Tab), a focusout handler immediately re-focuses it, so focus snaps back into the tablist and can never leave. This refocus-on-blur loop is a keyboard trap even though Tab itself is not preventDefaulted.',
  body:`  <h1>Reports</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="tablist" aria-label="Reports">
    <button id="tt0" role="tab" tabindex="0" aria-selected="true">Daily</button>
    <button role="tab" tabindex="-1" aria-selected="false">Weekly</button>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var tabs=[...document.querySelectorAll('[role=tab]')];
document.querySelector('[role=tablist]').addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'){e.preventDefault();tabs[0].tabIndex=-1;tabs[1].tabIndex=0;tabs[1].focus();}
  if(e.key==='ArrowLeft'){e.preventDefault();tabs[1].tabIndex=-1;tabs[0].tabIndex=0;tabs[0].focus();}
});
document.querySelector('[role=tablist]').addEventListener('focusout',function(e){
  /* BUG: yank focus back to the active tab on any blur -> focus can never leave. */
  setTimeout(function(){var a=tabs.find(t=>t.tabIndex===0)||tabs[0];a.focus();},0);
});
</script>` },

{ file:'case-10.html', dim:'menu-tab-noop-removes-tabindex', widget:'[role=menu]', trigger:'#n0', interaction:'key:Tab',
  rationale:'On open, every menuitem has tabindex=0 (no roving) and the page outside has no other tab stops because all other focusables are tabindex=-1; pressing Tab moves between menuitems only and never reaches page content, so focus is effectively trapped within the menu. No advisory is given.',
  body:`  <h1>Navigation</h1>
  <a class="before" href="#a" tabindex="-1">Before widget</a>
  <ul role="menu" aria-label="Nav">
    <li id="n0" role="menuitem" tabindex="0">Home</li>
    <li role="menuitem" tabindex="0">Search</li>
    <li role="menuitem" tabindex="0">Profile</li>
  </ul>
  <a class="after" href="#b" tabindex="-1">After widget</a>
<script>
/* BUG: all menuitems are tabindex=0 and every other focusable on the page is
   tabindex=-1, so Tab only ever cycles inside the menu -> trapped. */
</script>` },

{ file:'case-11.html', dim:'grid-tab-blocked-keydown-capture', widget:'[role=grid]', trigger:'#g0', interaction:'key:Tab',
  rationale:'A grid attaches a capture-phase keydown listener on document that preventDefaults Tab whenever focus is inside the grid, so even though individual cells look normal, Tab can never escape the grid. Capture-phase interception is still a keyboard trap (F10), with no advisory.',
  body:`  <h1>Spreadsheet</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="grid" id="grid" aria-label="Cells">
    <div id="g0" role="gridcell" tabindex="0">A1</div><div role="gridcell" tabindex="-1">B1</div>
    <div role="gridcell" tabindex="-1">A2</div><div role="gridcell" tabindex="-1">B2</div>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var cells=[...document.querySelectorAll('[role=gridcell]')],i=0,grid=document.getElementById('grid');
grid.addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'){e.preventDefault();cells[i].tabIndex=-1;i=(i+1)%cells.length;cells[i].tabIndex=0;cells[i].focus();}
});
document.addEventListener('keydown',function(e){
  if(e.key==='Tab'&&grid.contains(document.activeElement)){e.preventDefault();/* BUG: capture-phase Tab block traps the grid. */}
},true);
</script>` },

{ file:'case-12.html', dim:'menubar-tab-trap-no-instruction-escape-only', widget:'[role=menubar]', trigger:'#x0', interaction:'key:Tab',
  rationale:'A menubar swallows Tab and only F6 (a non-standard key) moves focus to the next region, but this exit method is never advised to the user as 2.1.2 requires; an undisclosed non-standard exit key with Tab blocked is a keyboard trap.',
  body:`  <h1>IDE menubar</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="menubar" aria-label="IDE">
    <button id="x0" role="menuitem" tabindex="0">Run</button>
    <button role="menuitem" tabindex="-1">Debug</button>
    <button role="menuitem" tabindex="-1">Terminal</button>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var its=[...document.querySelectorAll('[role=menuitem]')],i=0;
function mv(d){its[i].tabIndex=-1;i=(i+d+its.length)%its.length;its[i].tabIndex=0;its[i].focus();}
document.querySelector('[role=menubar]').addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'){e.preventDefault();mv(1);}
  else if(e.key==='ArrowLeft'){e.preventDefault();mv(-1);}
  else if(e.key==='Tab'){e.preventDefault();/* BUG: Tab blocked; only undisclosed F6 exits. */}
  else if(e.key==='F6'){document.querySelector('.after').focus();}
});
</script>` },
];

const negatives = [
{ file:'case-13.html', dim:'menubar-tab-exits-cleanly', widget:'[role=menubar]', trigger:'#mi0', interaction:'key:Tab',
  rationale:'The menubar uses roving tabindex: arrow keys move within, and Tab is NOT intercepted, so the browser moves focus out of the menubar to the next focusable element (the After link). Exactly the APG behavior, no trap.',
  body:`  <h1>App menubar</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="menubar" aria-label="Main">
    <button id="mi0" role="menuitem" tabindex="0">File</button>
    <button role="menuitem" tabindex="-1">Edit</button>
    <button role="menuitem" tabindex="-1">View</button>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var items=[...document.querySelectorAll('[role=menuitem]')],i=0;
document.querySelector('[role=menubar]').addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();items[i].tabIndex=-1;i=(i+(e.key==='ArrowRight'?1:items.length-1))%items.length;items[i].tabIndex=0;items[i].focus();}
  /* Tab is intentionally NOT handled -> native Tab moves focus out of the widget. */
});
</script>` },

{ file:'case-14.html', dim:'tablist-tab-moves-to-panel', widget:'[role=tablist]', trigger:'#t0', interaction:'key:Tab',
  rationale:'Arrow keys switch tabs (roving tabindex), and Tab is left to the browser so it moves focus from the active tab to the next tab stop (the tab panel / After link). Focus leaves the tablist with an unmodified key. No trap.',
  body:`  <h1>Settings tabs</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="tablist" aria-label="Settings">
    <button id="t0" role="tab" tabindex="0" aria-selected="true">General</button>
    <button role="tab" tabindex="-1" aria-selected="false">Privacy</button>
    <button role="tab" tabindex="-1" aria-selected="false">Account</button>
  </div>
  <div role="tabpanel" tabindex="0">General settings content</div>
  <a class="after" href="#b">After widget</a>
<script>
var tabs=[...document.querySelectorAll('[role=tab]')],i=0;
function move(d){tabs[i].tabIndex=-1;tabs[i].setAttribute('aria-selected','false');i=(i+d+tabs.length)%tabs.length;tabs[i].tabIndex=0;tabs[i].setAttribute('aria-selected','true');tabs[i].focus();}
document.querySelector('[role=tablist]').addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'){e.preventDefault();move(1);}
  else if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}
});
</script>` },

{ file:'case-15.html', dim:'listbox-tab-exits', widget:'[role=listbox]', trigger:'#o0', interaction:'key:Tab',
  rationale:'A single-select listbox: arrow keys change the active option, Tab is not handled so focus moves out of the listbox to the next control. The roving tabindex keeps one tab stop and Tab releases it cleanly.',
  body:`  <h1>Pick a country</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="listbox" aria-label="Country">
    <div id="o0" role="option" tabindex="0" aria-selected="true">Australia</div>
    <div role="option" tabindex="-1" aria-selected="false">Brazil</div>
    <div role="option" tabindex="-1" aria-selected="false">Canada</div>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var opts=[...document.querySelectorAll('[role=option]')],i=0;
function sel(n){opts[i].tabIndex=-1;opts[i].setAttribute('aria-selected','false');i=n;opts[i].tabIndex=0;opts[i].setAttribute('aria-selected','true');opts[i].focus();}
document.querySelector('[role=listbox]').addEventListener('keydown',function(e){
  if(e.key==='ArrowDown'){e.preventDefault();sel((i+1)%opts.length);}
  else if(e.key==='ArrowUp'){e.preventDefault();sel((i+opts.length-1)%opts.length);}
});
</script>` },

{ file:'case-16.html', dim:'grid-tab-exits-after-2d-nav', widget:'[role=grid]', trigger:'#c0', interaction:'key:Tab',
  rationale:'The grid uses arrow keys for 2-D movement among cells but does not intercept Tab, so Tab moves focus out of the grid to the next page element. A correctly behaving composite per APG; no keyboard trap.',
  body:`  <h1>Date picker grid</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="grid" aria-label="Days">
    <div id="c0" role="gridcell" tabindex="0">1</div><div role="gridcell" tabindex="-1">2</div><div role="gridcell" tabindex="-1">3</div>
    <div role="gridcell" tabindex="-1">4</div><div role="gridcell" tabindex="-1">5</div><div role="gridcell" tabindex="-1">6</div>
    <div role="gridcell" tabindex="-1">7</div><div role="gridcell" tabindex="-1">8</div><div role="gridcell" tabindex="-1">9</div>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var cells=[...document.querySelectorAll('[role=gridcell]')],i=0;
function go(n){if(n<0||n>=cells.length)return;cells[i].tabIndex=-1;i=n;cells[i].tabIndex=0;cells[i].focus();}
document.querySelector('[role=grid]').addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'){e.preventDefault();go(i+1);}
  else if(e.key==='ArrowLeft'){e.preventDefault();go(i-1);}
  else if(e.key==='ArrowDown'){e.preventDefault();go(i+3);}
  else if(e.key==='ArrowUp'){e.preventDefault();go(i-3);}
});
</script>` },

{ file:'case-17.html', dim:'toolbar-tab-and-shifttab-exit', widget:'[role=toolbar]', trigger:'#tb1', interaction:'key:Tab',
  rationale:'The toolbar handles only arrow keys; both Tab and Shift+Tab are left to the browser, so focus can move forward to the After link and backward to the Before link. Bidirectional exit works; no trap.',
  body:`  <h1>Formatting toolbar</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="toolbar" aria-label="Format">
    <button id="tb1" role="button" tabindex="0">Bold</button>
    <button role="button" tabindex="-1">Italic</button>
    <button role="button" tabindex="-1">Underline</button>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var btns=[...document.querySelectorAll('[role=toolbar] [role=button]')],i=0;
function mv(d){btns[i].tabIndex=-1;i=(i+d+btns.length)%btns.length;btns[i].tabIndex=0;btns[i].focus();}
document.querySelector('[role=toolbar]').addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'){e.preventDefault();mv(1);}
  else if(e.key==='ArrowLeft'){e.preventDefault();mv(-1);}
});
</script>` },

{ file:'case-18.html', dim:'menu-escape-exits-and-tab-exits', widget:'[role=menu]', trigger:'#m0', interaction:'key:Tab',
  rationale:'The popup menu lets Tab move focus out of the menu (not intercepted) AND also supports Escape; either standard method exits, so there is no trap and no need for an advisory.',
  body:`  <h1>Context menu</h1>
  <a class="before" href="#a">Before widget</a>
  <ul role="menu" aria-label="Actions">
    <li id="m0" role="menuitem" tabindex="0">Open</li>
    <li role="menuitem" tabindex="-1">Share</li>
    <li role="menuitem" tabindex="-1">Delete</li>
  </ul>
  <a class="after" href="#b">After widget</a>
<script>
var its=[...document.querySelectorAll('[role=menuitem]')],i=0;
function mv(d){its[i].tabIndex=-1;i=(i+d+its.length)%its.length;its[i].tabIndex=0;its[i].focus();}
document.querySelector('[role=menu]').addEventListener('keydown',function(e){
  if(e.key==='ArrowDown'){e.preventDefault();mv(1);}
  else if(e.key==='ArrowUp'){e.preventDefault();mv(-1);}
  else if(e.key==='Escape'){document.querySelector('.before').focus();}
  /* Tab not intercepted -> native exit also works. */
});
</script>` },

{ file:'case-19.html', dim:'native-radiogroup-tab-exits', widget:'fieldset', trigger:'#nr0', interaction:'key:Tab',
  rationale:'A native HTML radio group: arrow keys move between radios within the group and Tab moves focus out of the group to the next control, all handled by the user agent. Native semantics guarantee no keyboard trap.',
  body:`  <h1>Plan</h1>
  <a class="before" href="#a">Before widget</a>
  <fieldset><legend>Plan</legend>
    <label><input id="nr0" type="radio" name="plan" checked> Basic</label>
    <label><input type="radio" name="plan"> Pro</label>
    <label><input type="radio" name="plan"> Team</label>
  </fieldset>
  <a class="after" href="#b">After widget</a>` },

{ file:'case-20.html', dim:'menu-tab-closes-and-moves-on', widget:'[role=menu]', trigger:'#mm0', interaction:'key:Tab',
  rationale:'On Tab the menu closes and lets focus continue naturally to the next focusable element (the After link); the handler does not preventDefault Tab, it just dismisses the popup. Focus leaves the widget with an unmodified key. No trap.',
  body:`  <h1>Profile menu</h1>
  <a class="before" href="#a">Before widget</a>
  <ul role="menu" id="pm" aria-label="Profile">
    <li id="mm0" role="menuitem" tabindex="0">Account</li>
    <li role="menuitem" tabindex="-1">Billing</li>
    <li role="menuitem" tabindex="-1">Sign out</li>
  </ul>
  <a class="after" href="#b">After widget</a>
<script>
var its=[...document.querySelectorAll('[role=menuitem]')],i=0;
function mv(d){its[i].tabIndex=-1;i=(i+d+its.length)%its.length;its[i].tabIndex=0;its[i].focus();}
document.querySelector('[role=menu]').addEventListener('keydown',function(e){
  if(e.key==='ArrowDown'){e.preventDefault();mv(1);}
  else if(e.key==='ArrowUp'){e.preventDefault();mv(-1);}
  else if(e.key==='Tab'){document.getElementById('pm').setAttribute('aria-hidden','true');/* close, but do NOT preventDefault -> native Tab continues */}
});
</script>` },

{ file:'case-21.html', dim:'tablist-no-refocus-on-blur', widget:'[role=tablist]', trigger:'#tt0', interaction:'key:Tab',
  rationale:'The tablist switches tabs on arrow keys and does not re-focus on blur, so when Tab moves focus to the tab panel/After link, focus leaves and stays out. No refocus loop, no trap.',
  body:`  <h1>Reports</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="tablist" aria-label="Reports">
    <button id="tt0" role="tab" tabindex="0" aria-selected="true">Daily</button>
    <button role="tab" tabindex="-1" aria-selected="false">Weekly</button>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var tabs=[...document.querySelectorAll('[role=tab]')];
document.querySelector('[role=tablist]').addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'){e.preventDefault();tabs[0].tabIndex=-1;tabs[1].tabIndex=0;tabs[1].focus();}
  if(e.key==='ArrowLeft'){e.preventDefault();tabs[1].tabIndex=-1;tabs[0].tabIndex=0;tabs[0].focus();}
});
</script>` },

{ file:'case-22.html', dim:'menu-tab-exits-and-escape-advised', widget:'[role=menu]', trigger:'#a0', interaction:'key:Tab',
  rationale:'This menu navigates items with arrow keys, lets Tab/Shift+Tab move focus out of the menu (not intercepted), AND provides a visible advisory that Esc closes it; the standard Tab exit alone prevents any trap and the advisory is a bonus. No keyboard trap.',
  body:`  <h1>Help menu</h1>
  <a class="before" href="#a">Before widget</a>
  <p class="help" id="adv">Tip: Tab leaves this menu; Esc also closes it.</p>
  <ul role="menu" aria-label="Help" aria-describedby="adv">
    <li id="a0" role="menuitem" tabindex="0">Docs</li>
    <li role="menuitem" tabindex="-1">Contact</li>
  </ul>
  <a class="after" href="#b">After widget</a>
<script>
var its=[...document.querySelectorAll('[role=menuitem]')],i=0;
function mv(d){its[i].tabIndex=-1;i=(i+d+its.length)%its.length;its[i].tabIndex=0;its[i].focus();}
document.querySelector('[role=menu]').addEventListener('keydown',function(e){
  if(e.key==='ArrowDown'){e.preventDefault();mv(1);}
  else if(e.key==='ArrowUp'){e.preventDefault();mv(-1);}
  else if(e.key==='Escape'){document.querySelector('.after').focus();}
  /* Tab not intercepted -> native Tab/Shift+Tab exit the menu both ways. */
});
</script>` },

{ file:'case-23.html', dim:'grid-tab-exits-no-capture-block', widget:'[role=grid]', trigger:'#g0', interaction:'key:Tab',
  rationale:'The grid navigates cells with arrow keys and does not attach any Tab-blocking listener; Tab moves focus out of the grid normally. Identical structure to the trapping case but without the capture-phase block, so no trap.',
  body:`  <h1>Spreadsheet</h1>
  <a class="before" href="#a">Before widget</a>
  <div role="grid" id="grid" aria-label="Cells">
    <div id="g0" role="gridcell" tabindex="0">A1</div><div role="gridcell" tabindex="-1">B1</div>
    <div role="gridcell" tabindex="-1">A2</div><div role="gridcell" tabindex="-1">B2</div>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var cells=[...document.querySelectorAll('[role=gridcell]')],i=0,grid=document.getElementById('grid');
grid.addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'){e.preventDefault();cells[i].tabIndex=-1;i=(i+1)%cells.length;cells[i].tabIndex=0;cells[i].focus();}
});
/* No document-level Tab block -> Tab exits the grid normally. */
</script>` },

{ file:'case-24.html', dim:'menubar-f6-advised-and-tab-exits', widget:'[role=menubar]', trigger:'#x0', interaction:'key:Tab',
  rationale:'The menubar lets Tab move focus out of the widget (not intercepted) and additionally documents F6 as a region shortcut in a visible help line; the standard Tab exit alone already prevents any trap, and the non-standard key is advised.',
  body:`  <h1>IDE menubar</h1>
  <a class="before" href="#a">Before widget</a>
  <p class="help">Tip: Tab leaves the menubar; F6 jumps between regions.</p>
  <div role="menubar" aria-label="IDE">
    <button id="x0" role="menuitem" tabindex="0">Run</button>
    <button role="menuitem" tabindex="-1">Debug</button>
    <button role="menuitem" tabindex="-1">Terminal</button>
  </div>
  <a class="after" href="#b">After widget</a>
<script>
var its=[...document.querySelectorAll('[role=menuitem]')],i=0;
function mv(d){its[i].tabIndex=-1;i=(i+d+its.length)%its.length;its[i].tabIndex=0;its[i].focus();}
document.querySelector('[role=menubar]').addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'){e.preventDefault();mv(1);}
  else if(e.key==='ArrowLeft'){e.preventDefault();mv(-1);}
  /* Tab not intercepted -> exits; F6 advised as extra shortcut. */
});
</script>` },
];

function emit(list, polarity, expected){
  return list.map(c=>{
    const html = HEAD(c.file.replace(/\D/g,''), polarity==='positive'?'POSITIVE':'NEGATIVE', c.dim) + '\n' + c.body + FOOT;
    fs.writeFileSync(path.join(DIR, c.file), html, 'utf8');
    return {
      file: c.file, expected, polarity, aspect:'arrow-key-composite-widget-trap', sc:'2.1.2',
      dimension: c.dim, triggerSelector: c.trigger, interaction: c.interaction,
      revealedSelector: c.widget, expectFocusReturn: null, runnerShould:'decide',
      rationale: c.rationale,
      citation: '"If keyboard focus can be moved to a component of the page using a keyboard interface, then focus can be moved away from that component using only a keyboard interface, and, if it requires more than unmodified arrow or tab keys or other standard exit methods, the user is advised of the method for moving focus away." — WCAG 2.2 SC 2.1.2 No Keyboard Trap (Failure F10). APG roving tabindex: "the tab and shift + tab keys move focus from one UI component to another while other keys, primarily the arrow keys, move focus inside of components that include multiple focusable elements."'
    };
  });
}

const labels = emit(positives,'positive','failed').concat(emit(negatives,'negative','passed'));
fs.writeFileSync(path.join(DIR,'labels.json'), JSON.stringify(labels, null, 2)+'\n','utf8');
console.log('arrow-key-composite-widget-trap: wrote', positives.length+negatives.length, 'html +', labels.length, 'labels (',positives.length,'pos /',negatives.length,'neg )');
