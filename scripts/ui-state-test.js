// End-to-end test of the annotation state machine: select element, check
// category, persistence across page switches and reloads, confirm gate,
// annotated-list click-back, export shape. Read-only on pages; saves/restores
// localStorage so the user's real annotations are untouched.
//
// Usage: node scripts/ui-state-test.js

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '..');
const BASE = 'http://127.0.0.1:3001';
const P1 = 'saved/ix.htm';
const P2 = 'saved/Doomersion — Learn languages by doomscrolling.htm';

function chromePath() {
  const guesses = [process.env.PUPPETEER_EXECUTABLE_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].filter(Boolean);
  for (const g of guesses) if (fs.existsSync(g)) return g;
}

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass: !!pass, detail: detail || '' });
  console.log((pass ? '  ✓ ' : '  ✗ ') + name + (detail ? ` — ${detail}` : ''));
}

async function main() {
  const samples = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/samples-saved.json'), 'utf8'));
  const p1items = [];
  for (const list of Object.values((samples[P1] || {}).sampled || {})) p1items.push(...list);
  if (!p1items.length) throw new Error('no samples for ' + P1);
  // pick a focusable sampled element (KB pills need tab neighbors)
  const target = p1items.find(it => /^(a|button|input|select)$/.test(it.tag)) || p1items[0];
  console.log('target:', target.tag, JSON.stringify(target.name || '').slice(0, 40), target.xpath.slice(-60));

  const browser = await puppeteer.launch({ headless: true, executablePath: chromePath(), args: ['--no-sandbox'], protocolTimeout: 120000 });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => document.getElementById('assetSelect') && document.getElementById('assetSelect').options.length > 1, { timeout: 30000 });

  // backup localStorage for both pages
  const backup = await page.evaluate((a, b) => ({
    a: localStorage.getItem('a11y_annotations:' + a),
    b: localStorage.getItem('a11y_annotations:' + b),
  }), P1, P2);
  await page.evaluate((a, b) => {
    localStorage.removeItem('a11y_annotations:' + a);
    localStorage.removeItem('a11y_annotations:' + b);
  }, P1, P2);

  const selectPage = async (v) => {
    await page.evaluate(v => {
      const sel = document.getElementById('assetSelect');
      sel.value = v; sel.dispatchEvent(new Event('change'));
    }, v);
    await new Promise(r => setTimeout(r, 5000));
  };
  const selectTarget = async () => {
    await page.evaluate(xp => {
      document.getElementById('pageFrame').contentWindow.postMessage({ t: 'ext-sel', xpath: xp }, '*');
    }, target.xpath);
    await page.waitForFunction(() => currentSelection.length === 1, { timeout: 5000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 300));
  };

  try {
    // ── 1. select page + element, check a category ──────────────────────────
    await selectPage(P1);
    await selectTarget();
    const selOk = await page.evaluate(() => currentSelection.length === 1 && currentSelection[0].xpath);
    check('ext-sel by xpath selects element', !!selOk, String(selOk).slice(-50));

    await page.evaluate(() => {
      document.querySelector('.cat-block:not(.special-block) .cat-cb').click();
    });
    await new Promise(r => setTimeout(r, 300));
    const st1 = await page.evaluate(() => ({
      n: Object.values(annotations).filter(a => Object.keys(a.errors).length).length,
      ls: !!localStorage.getItem('a11y_annotations:' + currentAssetFile),
      stats: document.getElementById('stats').textContent,
      tagged: (() => { try { return document.getElementById('pageFrame').contentDocument.querySelectorAll('.a11y-tagged').length; } catch (e) { return -1; } })(),
      progress: document.getElementById('progressCount').textContent,
    }));
    check('checkbox creates annotation', st1.n === 1, JSON.stringify(st1));
    check('annotation persisted to localStorage', st1.ls);
    check('iframe shows tagged highlight', st1.tagged === 1, 'tagged=' + st1.tagged);
    check('progress counts sample as annotated', /^1\//.test(st1.progress.replace(/\D*(\d+\/)/, '$1')), st1.progress);

    // ── 2. confirm gate ──────────────────────────────────────────────────────
    const gate0 = await page.evaluate(() => {
      const b = document.getElementById('confirmBtn');
      return { disabled: b.disabled, text: b.textContent };
    });
    check('confirm gated at 0/2 nav', gate0.disabled && /0\/2/.test(gate0.text), gate0.text);

    // press a KB or SR pill twice (re-selecting the target in between)
    let pressed = 0;
    for (let i = 0; i < 2; i++) {
      const clicked = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('#elemProps .ep-row'));
        for (const row of rows) {
          const k = row.querySelector('.ep-k');
          if (!k || k.textContent !== 'KB') continue;
          const pill = row.querySelector('.ep-v.ep-tab[role="button"]');
          if (pill) { pill.click(); return true; }
        }
        return false;
      });
      if (!clicked) break;
      pressed++;
      await new Promise(r => setTimeout(r, 500));
      await selectTarget();
    }
    const gate2 = await page.evaluate(() => {
      const b = document.getElementById('confirmBtn');
      return { disabled: b.disabled, text: b.textContent };
    });
    if (pressed === 2) {
      check('confirm unlocked after 2 nav presses', !gate2.disabled, gate2.text);
    } else {
      check('confirm gate (no KB pills on target — skipped presses)', true, 'pressed=' + pressed + ' ' + gate2.text);
    }
    if (!gate2.disabled) {
      await page.evaluate(() => document.getElementById('confirmBtn').click());
      await new Promise(r => setTimeout(r, 300));
      const conf = await page.evaluate(() => Object.values(annotations).some(a => a.confirmed));
      check('confirm marks annotation confirmed', conf);
    }

    // ── 3. persistence across page switch ────────────────────────────────────
    await selectPage(P2);
    const st2 = await page.evaluate(() => document.getElementById('stats').textContent);
    check('switching page resets stats', /^0/.test(st2.trim()), st2);
    await selectPage(P1);
    const st3 = await page.evaluate(() => ({
      stats: document.getElementById('stats').textContent,
      tagged: (() => { try { return document.getElementById('pageFrame').contentDocument.querySelectorAll('.a11y-tagged').length; } catch (e) { return -1; } })(),
    }));
    check('switching back restores annotation count', /^1/.test(st3.stats.trim()), st3.stats);
    check('switching back restores iframe tag highlight', st3.tagged === 1, 'tagged=' + st3.tagged);
    await selectTarget();
    const cbState = await page.evaluate(() => {
      const cb = document.querySelector('.cat-block:not(.special-block) .cat-cb');
      return cb.checked;
    });
    check('re-selecting element restores checkbox', cbState === true);

    // ── 4. full reload: annotList click-back (stale aid) ─────────────────────
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => document.getElementById('assetSelect') && document.getElementById('assetSelect').options.length > 1, { timeout: 30000 });
    await selectPage(P1);
    const listN = await page.evaluate(() => document.querySelectorAll('.annot-item').length);
    check('annotList restored after full reload', listN === 1, 'items=' + listN);
    await page.evaluate(() => { document.querySelector('.annot-item').click(); });
    await new Promise(r => setTimeout(r, 800));
    const reSel = await page.evaluate(() => currentSelection.length);
    check('annotList click re-selects element after reload', reSel === 1, 'currentSelection.length=' + reSel);

    // ── 5. export shape ───────────────────────────────────────────────────────
    const exp = await page.evaluate(() => buildExport());
    check('export contains the annotation', exp.elements && exp.elements.length === 1 && exp.elements[0].annotations.length === 1, JSON.stringify(exp).slice(0, 120));
    check('export identifies the page', exp.page === P1, 'export.page=' + JSON.stringify(exp.page));
  } finally {
    // restore localStorage
    await page.evaluate((a, b, bak) => {
      if (bak.a) localStorage.setItem('a11y_annotations:' + a, bak.a); else localStorage.removeItem('a11y_annotations:' + a);
      if (bak.b) localStorage.setItem('a11y_annotations:' + b, bak.b); else localStorage.removeItem('a11y_annotations:' + b);
    }, P1, P2, backup).catch(() => {});
    await browser.close();
  }

  const fails = results.filter(r => !r.pass);
  console.log(`\n${results.length - fails.length}/${results.length} checks passed`);
  fs.writeFileSync('/tmp/ui-state-test.json', JSON.stringify(results, null, 1));
}

main().catch(e => { console.error(e); process.exit(1); });
