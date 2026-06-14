// Summarize /tmp/toolkit-audit.json (produced by toolkit-audit.js).
const fs = require('fs');
const r = JSON.parse(fs.readFileSync(process.argv[2] || '/tmp/toolkit-audit.json', 'utf8'));

// ── in-frame phase ────────────────────────────────────────────────────────────
const pages = Object.entries(r.inframe || {});
console.log(`\n═══ IN-FRAME (${pages.length} pages) ═══`);
let rtPages = 0, rtFails = 0, rtCamel = 0, colTotal = 0, mmTotal = 0, dupTotal = 0;
let tabH = 0, tabZ = 0, tabD = 0, tabCE = 0, tabMiss = 0, tabTotal = 0;
const axeErr = [], axeNone = [], fatal = [];
let axeNodes = 0, axeAid = 0;
const missTags = {};
for (const [rel, v] of pages) {
  if (v.fatal) { fatal.push([rel, v.fatal]); continue; }
  if (v.roundTripFails) { rtPages++; rtFails += v.roundTripFails; rtCamel += v.roundTripCamelCase || 0; }
  colTotal += v.aidCollisions || 0;
  const ti = v.tabIssues || {};
  tabTotal += v.tabOrderLen || 0;
  tabH += ti.hiddenAncestorN || 0; tabZ += ti.zeroRectN || 0;
  tabD += ti.closedDetailsN || 0; tabCE += ti.contenteditableFalseN || 0;
  tabMiss += ti.missingTabbableN || 0;
  for (const m of ti.missingTabbable || []) missTags[m.tag] = (missTags[m.tag] || 0) + 1;
  const sr = v.sampleResolver || {};
  mmTotal += sr.mismatchN || 0; dupTotal += sr.dupXpaths || 0;
  if (sr.viaNone) console.log(`  sample unresolved: ${rel.slice(6, 50)} — ${sr.viaNone}/${sr.n} (xpath:${sr.viaXpath} meta:${sr.viaMeta})`);
  if (sr.mismatchN) console.log(`  sample MISMATCH: ${rel.slice(6, 50)} — ${JSON.stringify(sr.mismatches.slice(0, 2))}`);
  if (!v.axe) axeNone.push(rel);
  else if (v.axe.error) axeErr.push([rel, v.axe.error]);
  else { axeNodes += v.axe.nodes; axeAid += v.axe.nodesWithAid; }
}
console.log(`fatal pages: ${fatal.length}`, fatal.map(f => f[0].slice(6, 40) + ': ' + f[1]));
console.log(`xpath round-trip: ${rtFails} failures on ${rtPages} pages (${rtCamel} camelCase-SVG)`);
console.log(`aid hash collisions: ${colTotal}`);
console.log(`tab order: ${tabTotal} entries total — hiddenAncestor:${tabH} zeroRect:${tabZ} closedDetails:${tabD} ceFalse:${tabCE} missingTabbable:${tabMiss}`, missTags);
console.log(`sample resolver: mismatches:${mmTotal} duplicate-xpaths:${dupTotal}`);
console.log(`axe: no-result:${axeNone.length} errors:${axeErr.length} | node targets with aid: ${axeAid}/${axeNodes}`);
if (axeNone.length) console.log('  axe no-result pages:', axeNone.map(p => p.slice(6, 45)));
if (axeErr.length) console.log('  axe error pages:', axeErr.map(([p, e]) => p.slice(6, 40) + ': ' + String(e).slice(0, 60)));

// ── props phase ───────────────────────────────────────────────────────────────
const props = r.props || [];
console.log(`\n═══ PROPS (${props.length} elements) ═══`);
// role equivalence: front-end heuristic label vs CDP role value
const ROLE_EQ = {
  img: ['image'], a: ['link'], heading: ['heading'], link: ['link'],
  button: ['button', 'DisclosureTriangle'],
  image: ['image'], paragraph: ['paragraph'], label: ['LabelText', 'label'],
  sectionfooter: ['sectionfooter', 'generic'], sectionheader: ['sectionheader', 'generic'],
  generic: ['generic'],
  list: ['list'], listitem: ['listitem'], navigation: ['navigation'], main: ['main'],
  banner: ['banner'], contentinfo: ['contentinfo'], complementary: ['complementary'],
  region: ['region', 'Section'], article: ['article'], form: ['form'],
  textbox: ['textbox', 'searchbox'], searchbox: ['searchbox'], listbox: ['listbox', 'combobox'],
  table: ['table'], row: ['row'], cell: ['cell', 'gridcell'], columnheader: ['columnheader'],
  dialog: ['dialog'], group: ['group'], checkbox: ['checkbox'], radio: ['radio'],
  slider: ['slider'], spinbutton: ['spinbutton'], summary: ['DisclosureTriangle', 'button'],
};
const norm = s => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
let nameMatch = 0, nameDiff = [], roleMatch = 0, roleDiff = [], focMatch = 0, focDiff = [];
let feMissing = 0, axMissing = 0, axIgnored = 0;
for (const p of props) {
  if (!p.fe || p.fe.err) { feMissing++; continue; }
  if (!p.ax || p.ax.err || p.ax.role === undefined) { axMissing++; continue; }
  // skip elements Chrome itself ignores — CDP name/role are then unreliable refs
  if (p.ax.inTree === false) { axIgnored++; continue; }
  const fr = norm(p.fe.role), ar = (p.ax.role || '').trim();
  const arl = norm(ar);
  const rOk = fr === arl || (ROLE_EQ[fr] || []).map(norm).includes(arl) ||
    (arl === 'generic' && (fr === p.fe.tag || ['div', 'span'].includes(fr)));
  if (rOk) roleMatch++; else roleDiff.push({ rel: p.rel.slice(6, 35), tag: p.fe.tag, fe: p.fe.role, ax: p.ax.role });
  const fn = norm(p.fe.name), an = norm(p.ax.name);
  const nOk = fn === an || (!fn && !an) || (an && fn && (fn.includes(an) || an.includes(fn)));
  if (nOk) nameMatch++; else nameDiff.push({ rel: p.rel.slice(6, 35), tag: p.fe.tag, fe: (p.fe.name || '').slice(0, 50), ax: (p.ax.name || '').slice(0, 50) });
  const fOk = !!p.fe.focusable === !!p.ax.focusable;
  if (fOk) focMatch++; else focDiff.push({ rel: p.rel.slice(6, 35), tag: p.fe.tag, fe: p.fe.focusable, ax: !!p.ax.focusable });
}
const compared = props.length - feMissing - axMissing - axIgnored;
console.log(`compared: ${compared} (fe-missing:${feMissing} ax-missing:${axMissing} ax-ignored:${axIgnored})`);
console.log(`ROLE   : ${roleMatch}/${compared} match — ${roleDiff.length} differ`);
roleDiff.slice(0, 15).forEach(d => console.log('   ', JSON.stringify(d)));
console.log(`NAME   : ${nameMatch}/${compared} match — ${nameDiff.length} differ`);
nameDiff.slice(0, 15).forEach(d => console.log('   ', JSON.stringify(d)));
console.log(`KEYBOARD: ${focMatch}/${compared} match — ${focDiff.length} differ`);
focDiff.slice(0, 15).forEach(d => console.log('   ', JSON.stringify(d)));
