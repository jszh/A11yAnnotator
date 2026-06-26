'use strict';
// Functional adversarial-validity check for the C1 corpus.
// We diff the ACCESSIBLE EXPOSURE *of the controls/named-components themselves* (not arbitrary
// visible text). For each element that carries a control role or a name/state/value source attr,
// we record its computed accessible name + its aria state/value attrs, keyed by a stable id.
// We then compare the per-control signature before vs after the labeled activation, alongside a
// visible fingerprint (body innerHTML), and assert the adversarial premise:
//   POSITIVE -> something visible changes, but NO control's accessible name/state/value updates
//               (or it updates wrongly, for the contradiction dimensions).
//   NEGATIVE -> the relevant control's accessible name/state/value updates correctly
//               (native/platform controls exempt from the author-attr diff: visible change suffices).
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.resolve(__dirname, '..');

// Per-control accessible signature: id -> "name||attrs". Only elements that are controls or that
// carry a name/state/value attribute are included, so plain visible-text/status nodes whose
// textContent legitimately changes do NOT pollute the diff.
async function controlSig(page) {
  // Tag every control / named-component / status node with a stable key and record its raw
  // state/value attrs + (for native checkbox) the live checked property.
  const meta = await page.evaluate(() => {
    const ATTRS = ['aria-pressed','aria-expanded','aria-checked','aria-selected','aria-valuenow','aria-valuetext','aria-label','aria-labelledby','aria-activedescendant','alt','title'];
    const CTRL = 'a[href],button,input,select,textarea,summary,[role=button],[role=switch],[role=checkbox],[role=radio],[role=slider],[role=spinbutton],[role=combobox],[role=option],[role=tab],[role=menuitem],[role=img],[role=status],output';
    const set = new Map();
    document.querySelectorAll(CTRL).forEach(el => set.set(el, true));
    document.querySelectorAll('*').forEach(el => { for (const a of ATTRS) if (el.hasAttribute(a)) { set.set(el, true); break; } });
    const out = {};
    let i = 0;
    for (const el of set.keys()) {
      const key = el.id || (el.tagName.toLowerCase() + '#' + (i)); i++;
      const attrs = [];
      for (const a of ATTRS) if (el.hasAttribute(a)) attrs.push(a + '=' + el.getAttribute(a));
      if (el.matches('input[type=checkbox],input[type=radio]')) attrs.push('checked=' + el.checked);
      if (el.getAttribute('role') === 'status' || el.tagName === 'OUTPUT') attrs.push('text=' + (el.textContent||'').replace(/\s+/g,' ').trim());
      el.setAttribute('data-vkey', key);
      out[key] = attrs.sort().join(',');
    }
    return out;
  });
  // computed accessible name per keyed control via the rooted AX snapshot (reliable name algorithm)
  const sig = {};
  for (const key of Object.keys(meta)) {
    let name = '';
    try {
      const h = await page.$(`[data-vkey="${key}"]`);
      if (h) { const s = await page.accessibility.snapshot({ root: h }); if (s && s.name) name = s.name; }
    } catch (e) {}
    sig[key] = `${key} :: name="${name}" :: ${meta[key]}`;
  }
  return Object.keys(sig).sort().map(k => sig[k]).join('\n');
}

async function targetName(page, sel) {
  try { const h = await page.$(sel); if (!h) return ''; const s = await page.accessibility.snapshot({ root: h }); return (s && s.name) || ''; }
  catch (e) { return ''; }
}

async function snap(page, sel) {
  const ctrl = await controlSig(page);
  const tname = await targetName(page, sel);
  const body = await page.evaluate(() => document.body.innerHTML.replace(/ data-vkey="[^"]*"/g,'').replace(/\s+/g,' ').trim());
  return { ctrl, body, tname };
}

async function activate(page, sel, activation) {
  const el = await page.$(sel);
  if (activation === 'click') { await el.click(); }
  else { await el.focus(); await page.keyboard.press(activation === 'key:Enter' ? 'Enter' : activation === 'key:Space' ? 'Space' : 'ArrowRight'); }
  await new Promise(r => setTimeout(r, 70));
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const aspects = fs.readdirSync(ROOT).filter(d => fs.existsSync(path.join(ROOT, d, 'labels.json')));
  let total = 0, ok = 0; const failures = [];
  for (const a of aspects) {
    const labels = JSON.parse(fs.readFileSync(path.join(ROOT, a, 'labels.json'), 'utf8'));
    for (const l of labels) {
      total++;
      const page = await browser.newPage();
      const errs = []; page.on('pageerror', e => errs.push(String(e)));
      await page.goto('file://' + path.join(ROOT, a, l.file), { waitUntil: 'load' });
      if (!(await page.$(l.targetSelector))) { failures.push(`${a}/${l.file}: targetSelector "${l.targetSelector}" NOT FOUND`); await page.close(); continue; }
      const before = await snap(page, l.targetSelector);
      await activate(page, l.targetSelector, l.activation);
      const after = await snap(page, l.targetSelector);
      if (errs.length) { failures.push(`${a}/${l.file}: JS error: ${errs[0]}`); await page.close(); continue; }

      const visibleChanged = before.body !== after.body;
      const ctrlChanged = before.ctrl !== after.ctrl;     // did any CONTROL's name/state/value update?
      const nameChanged = before.tname !== after.tname;   // did the TARGET's accessible NAME update?
      const notSettable = /not-settable/.test(l.dimension);
      const nameAspect = (l.aspect === 'stale-name-after-activation' || l.aspect === 'dynamic-named-component-text-alt-stale');
      // Is the TARGET itself the named component (it carries a name-source attr)? If so its own name
      // is the subject of staleness; otherwise the stale subject is a separate element and we fall
      // back to the whole-control-set signature.
      const targetIsNamed = await page.evaluate(s => {
        const el = document.querySelector(s); if (!el) return false;
        return ['aria-label','aria-labelledby','alt','title'].some(a => el.hasAttribute(a)) || /button/i.test(el.tagName) || el.getAttribute('role')==='button';
      }, l.targetSelector);
      const contradicting = /contradict|inverted|off-by-one|invalid|non-numeric|one-way|valuetext|wrong/.test(l.dimension);
      const platformNative = /native|details|range/.test(l.dimension);

      let pass = true, why = '';
      if (l.polarity === 'positive') {
        if (notSettable) {
          if (ctrlChanged) { pass = false; why = 'not-settable positive but a control value changed on the key'; }
        } else if (!visibleChanged) {
          pass = false; why = 'positive but NOTHING visible changed on activation';
        } else if (nameAspect && targetIsNamed) {
          // the target's accessible NAME must NOT have correctly updated to the new visible label
          if (nameChanged && !contradicting) { pass = false; why = `positive name-stale but the accessible NAME updated ("${before.tname}"->"${after.tname}")`; }
        } else if (ctrlChanged && !contradicting) {
          pass = false; why = 'positive but a control accessible name/state/value updated correctly (premise broken)';
        }
      } else {
        // negative: the accessible exposure MUST update correctly somewhere — either the target's
        // own accessible name, or some tracked control/status signature (the updated subject may be
        // a separate element, e.g. a status icon driven by the activated button).
        if (platformNative) {
          if (!visibleChanged && !ctrlChanged && !nameChanged) { pass = false; why = 'negative native control: no observable change at all'; }
        } else if (!ctrlChanged && !nameChanged) {
          pass = false; why = 'negative but no accessible name/state/value updated (target or related control)';
        }
      }
      if (pass) ok++; else failures.push(`${a}/${l.file} [${l.polarity}/${l.dimension}]: ${why}`);
      await page.close();
    }
  }
  await browser.close();
  console.log(`\nVERIFY: ${ok}/${total} premise-valid`);
  if (failures.length) { console.log('\nFAILURES:'); failures.forEach(f => console.log(' - ' + f)); process.exit(1); }
  else console.log('ALL CASES PREMISE-VALID');
})().catch(e => { console.error(e); process.exit(2); });
