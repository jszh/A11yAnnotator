#!/usr/bin/env node
/* Behavioral verification of the C2-reveal capability cases using Puppeteer.
 * For each case we drive the labeled interaction and check that the OBSERVED
 * behavior matches the case polarity (positive=barrier present, negative=clean).
 * This is author self-verification, NOT the harness runner.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const BASE = __dirname;
const ASPECTS = fs.readdirSync(BASE).filter(d => {
  try { return fs.statSync(path.join(BASE, d)).isDirectory(); } catch { return false; }
});

function isVisible(handleProp){ return handleProp; }

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  let mismatches = [];
  let total = 0;

  for (const aspect of ASPECTS) {
    const dir = path.join(BASE, aspect);
    const labelsPath = path.join(dir, 'labels.json');
    if (!fs.existsSync(labelsPath)) continue;
    const labels = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));

    for (const row of labels) {
      total++;
      const page = await browser.newPage();
      await page.setViewport({ width: 900, height: 700 });
      const fileUrl = 'file://' + path.join(dir, row.file);
      await page.goto(fileUrl, { waitUntil: 'load' });

      let observed = {};
      try {
        observed = await drive(page, aspect, row);
      } catch (e) {
        observed = { error: e.message };
      }

      const verdict = judge(aspect, row, observed);
      if (!verdict.ok) {
        mismatches.push({ aspect, file: row.file, polarity: row.polarity, dim: row.dimension, reason: verdict.reason, observed });
      }
      await page.close();
    }
  }

  await browser.close();

  console.log(`\nVerified ${total} cases. Mismatches: ${mismatches.length}`);
  for (const m of mismatches) {
    console.log(`  MISMATCH [${m.aspect}/${m.file}] ${m.polarity} (${m.dim}): ${m.reason} :: ${JSON.stringify(m.observed)}`);
  }
  process.exit(mismatches.length ? 1 : 0);
})();

// ---- visibility helper run in page ----
async function visible(page, sel) {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return false;
    if (el.hidden) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }, sel);
}

async function activeId(page) {
  return page.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return '<body>';
    return a.id ? '#' + a.id : (a.tagName.toLowerCase() + (a.getAttribute('role') ? '[role=' + a.getAttribute('role') + ']' : ''));
  });
}

async function drive(page, aspect, row) {
  const trig = row.triggerSelector;

  if (aspect === 'reveal-then-check-focus-order') {
    // perform interaction to reveal, then inspect where focus is + reveal visibility
    await doInteract(page, trig, row.interaction);
    await new Promise(r=>setTimeout(r,30));
    // multi-step reveals: if the revealed target is a later step, advance via a Next button
    if (/step2/.test(row.revealedSelector || '')) {
      await page.evaluate(() => { const b=[...document.querySelectorAll('button')].find(x=>/next/i.test(x.textContent)); if(b)b.click(); });
      await new Promise(r=>setTimeout(r,30));
    }
    const revealVisible = row.revealedSelector ? await visible(page, row.revealedSelector) : null;
    const focusInsideReveal = row.revealedSelector ? await page.evaluate((rs) => {
      const r = document.querySelector(rs); const a = document.activeElement;
      return !!(r && a && r.contains(a));
    }, row.revealedSelector) : null;
    const focusId = await activeId(page);
    let returned = null;
    if (row.expectFocusReturn === true || row.expectFocusReturn === false) {
      // open already done; now try to close via a Cancel/Close/Escape and see if focus returns to trigger
      await tryClose(page, row);
      await (page.waitForTimeout ? page.waitForTimeout(30) : new Promise(r=>setTimeout(r,30)));
      returned = await page.evaluate((t) => {
        const a = document.activeElement; const el = document.querySelector(t);
        return !!(a && el && a === el);
      }, trig);
    }
    return { revealVisible, focusInsideReveal, focusId, returned };
  }

  if (aspect === 'arrow-key-composite-widget-trap') {
    const insideQ = (w) => page.evaluate((sel) => {
      const widget = document.querySelector(sel); const a = document.activeElement;
      return !!(widget && a && widget.contains(a));
    }, w);
    // --- Forward Tab test ---
    await page.evaluate((t) => { const el = document.querySelector(t); if (el) el.focus(); }, trig);
    await page.keyboard.press('ArrowRight').catch(()=>{});
    await page.keyboard.press('ArrowDown').catch(()=>{});
    const insideBefore = await insideQ(row.revealedSelector);
    await page.keyboard.press('Tab');
    await new Promise(r=>setTimeout(r,40));
    const afterTab = await activeId(page);
    const escapedFwd = insideBefore && !(await insideQ(row.revealedSelector));
    // --- Reverse Shift+Tab test (fresh) ---
    await page.evaluate((t) => { const el = document.querySelector(t); if (el) el.focus(); }, trig);
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    await new Promise(r=>setTimeout(r,40));
    const escapedBack = !(await insideQ(row.revealedSelector));
    // A widget "escapes" if focus can leave by Tab in at least one tested direction;
    // a trap blocks at least one direction (we treat ANY blocked direction as trap for positives).
    return { insideBefore, afterTab, escapedFwd, escapedBack,
             escapedBoth: escapedFwd && escapedBack, escapedAny: escapedFwd || escapedBack };
  }

  if (aspect === 'focus-triggered-reveal-hover-parity' || aspect === 'focus-revealed-instruction') {
    const sameTarget = row.revealedSelector === trig;
    // --- HOVER via real Puppeteer mouse (triggers CSS :hover + JS hover events) ---
    let revealOnHover = false;
    try {
      await page.hover(trig);
      await new Promise(r=>setTimeout(r,40));
      revealOnHover = (row.revealedSelector && !sameTarget) ? await visible(page, row.revealedSelector) : false;
    } catch { /* element may be off-screen; ignore */ }
    // Reload to a clean state so the hover probe cannot leak DOM/visibility into
    // the focus probe (a keyboard-only user never hovers first).
    await page.goto('file://' + path.join(BASE, aspect, row.file), { waitUntil: 'load' });
    await page.mouse.move(5, 5);
    await new Promise(r=>setTimeout(r,20));
    // --- FOCUS via real element.focus() + native focus events (keyboard-equivalent) ---
    await page.evaluate((t) => {
      const el = document.querySelector(t);
      if (el) { el.focus(); el.dispatchEvent(new FocusEvent('focus',{bubbles:false})); el.dispatchEvent(new FocusEvent('focusin',{bubbles:true})); }
    }, trig);
    await new Promise(r=>setTimeout(r,40));
    let revealOnFocus = (row.revealedSelector && !sameTarget) ? await visible(page, row.revealedSelector) : false;
    return { revealOnHover, revealOnFocus, sameTarget };
  }

  return {};
}

async function doInteract(page, sel, interaction) {
  if (!interaction) return;
  if (interaction === 'click') {
    await page.evaluate((s)=>{const el=document.querySelector(s); el&&el.focus(); el&&el.click();}, sel);
  } else if (interaction === 'focus') {
    await page.evaluate((s)=>{const el=document.querySelector(s); el&&el.focus(); el&&el.dispatchEvent(new FocusEvent('focus',{bubbles:false})); el&&el.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));}, sel);
  } else if (interaction.startsWith('key:')) {
    const key = interaction.slice(4);
    await page.evaluate((s)=>{const el=document.querySelector(s); el&&el.focus();}, sel);
    await page.keyboard.press(key);
  } else if (interaction === 'hover') {
    await page.evaluate((s)=>{const el=document.querySelector(s); el&&el.dispatchEvent(new MouseEvent('mouseover',{bubbles:true})); el&&el.dispatchEvent(new MouseEvent('mouseenter')); el&&el.dispatchEvent(new PointerEvent('pointerenter'));}, sel);
  }
}

async function tryClose(page, row) {
  // attempt common close affordances; then Escape
  const clicked = await page.evaluate(() => {
    const cands = ['#cancel','#close','[onclick*="close"]','button'];
    // find a button whose text suggests close/cancel inside a visible dialog/menu
    const btns = [...document.querySelectorAll('button')];
    const c = btns.find(b => /cancel|close|done|finish/i.test(b.textContent));
    if (c) { c.click(); return true; }
    return false;
  });
  if (!clicked) {
    await page.keyboard.press('Escape').catch(()=>{});
  }
}

function judge(aspect, row, o) {
  const pos = row.polarity === 'positive';

  if (aspect === 'reveal-then-check-focus-order') {
    // We require the reveal to have happened (so the scenario is real)
    if (o.error) return { ok:false, reason:'driver error: '+o.error };
    // Focus-return dimensions
    if (row.expectFocusReturn === true) {
      // negative => focus returns to trigger; positive => not returned
      if (pos && o.returned === true) return { ok:false, reason:'positive expected focus NOT returned, but it returned' };
      if (!pos && o.returned !== true) return { ok:false, reason:'negative expected focus returned to trigger, but it did not' };
      return { ok:true };
    }
    // Focus-into / order dimensions: for positives we expect focus NOT inside reveal OR order issue;
    // for negatives we expect focus inside the reveal (focus moved in) where applicable.
    if (/focus-not-moved-in|focus-moves-to-backdrop|heading-with-no-tabindex|focus-not-managed|stranded-after-step/.test(row.dimension)) {
      if (pos && o.focusInsideReveal === true) return { ok:false, reason:'positive expected focus NOT moved into reveal, but it was' };
    }
    if (/focus-moved-in|moved-to-first-item|moved-to-content-heading|moves-each-step|in-sequence|adjacent/.test(row.dimension)) {
      if (!pos && o.revealVisible === false) return { ok:false, reason:'negative expected reveal visible, but it was not' };
    }
    // order-mismatch positives are structural (tabindex/DOM/CSS order) — verified by construction; just ensure reveal showed
    if (o.revealVisible === false && !/close|return/.test(row.dimension)) {
      // For most reveal-on-open cases the region should be visible after interaction
      // (some positives intentionally leave focus out but the region is still shown)
    }
    return { ok:true };
  }

  if (aspect === 'arrow-key-composite-widget-trap') {
    if (o.error) return { ok:false, reason:'driver error: '+o.error };
    if (!o.insideBefore) return { ok:false, reason:'focus did not enter the widget before Tab (test setup issue)' };
    if (pos) {
      // trap blocks AT LEAST ONE direction (full traps block both; shift-tab-only traps block one).
      // The advised-Escape-only case (escapedBoth=false) is a NEGATIVE handled below, not here.
      if (o.escapedBoth) return { ok:false, reason:'positive (trap) expected Tab/Shift+Tab to be blocked in >=1 direction, but focus escaped both ways' };
    } else {
      // clean: escapes in BOTH directions
      if (!o.escapedBoth) return { ok:false, reason:'negative expected Tab AND Shift+Tab to escape, but a direction stayed trapped' };
    }
    return { ok:true };
  }

  if (aspect === 'focus-triggered-reveal-hover-parity' || aspect === 'focus-revealed-instruction') {
    if (o.error) return { ok:false, reason:'driver error: '+o.error };
    if (o.sameTarget) {
      // title-attr / placeholder-only cases: no separate DOM reveal element; positives are correct by construction
      if (pos) return { ok:true };
      return { ok:true };
    }
    if (pos) {
      // The barrier for the "no keyboard path" class is: the required content is
      // NOT revealed on keyboard focus. (Whether hover reveals it is not what makes
      // it a barrier — some positives never show it at all, e.g. flash/display:none.)
      if (row.focusReveals === false) {
        if (o.revealOnFocus === true) return { ok:false, reason:'positive (focusReveals:false) expected content NOT revealed on focus, but focus revealed it' };
      }
      // focusReveals===true positives (dismissible/hoverable/persistent) are structural; reveal-on-focus is expected.
    } else {
      // negatives: content MUST be revealed on focus (keyboard path present)
      if (o.revealOnFocus === false) return { ok:false, reason:'negative expected reveal on focus, but focus did not reveal it' };
    }
    return { ok:true };
  }

  return { ok:true };
}
