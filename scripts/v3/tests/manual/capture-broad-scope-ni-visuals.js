'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '../../../..');
const NI_BASE = path.join(ROOT, 'scripts/v3/tests/generated/broad-scope/non-interference-interaction');
const MEDIA_BASE = path.join(ROOT, 'scripts/v3/tests/generated/broad-scope/media-process-auth');
const OUT = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation');
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH
  || process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function readManifest(base) {
  return JSON.parse(fs.readFileSync(path.join(base, 'manifest.json'), 'utf8'));
}

async function open(browser, rel) {
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 600, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(ROOT, rel)).href, { waitUntil: 'load' });
  return page;
}

async function screenshot(page, name, selector = null) {
  const file = path.join(OUT, `${name}.png`);
  if (selector) {
    const el = await page.$(selector);
    if (el) {
      try {
        await el.screenshot({ path: file });
        return path.relative(ROOT, file);
      } catch (e) {
        // Some relevant targets (notably <audio autoplay> without controls) have no visible box.
        // Fall through to the full-page capture so the evidence still records visible controls/absence.
      }
    }
  }
  await page.screenshot({ path: file, fullPage: true });
  return path.relative(ROOT, file);
}

async function targetState(page) {
  return page.evaluate(() => {
    const el = document.querySelector('#target');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      role: el.getAttribute('role') || '',
      accesskey: el.getAttribute('accesskey') || '',
      controls: el.hasAttribute('controls'),
      autoplay: el.hasAttribute('autoplay'),
      muted: el.muted === true || el.hasAttribute('muted'),
      paused: typeof el.paused === 'boolean' ? el.paused : null,
      currentTime: Number.isFinite(el.currentTime) ? Math.round(el.currentTime * 1000) / 1000 : null,
      duration: Number.isFinite(el.duration) ? Math.round(el.duration * 1000) / 1000 : null,
      loop: el.loop === true || el.hasAttribute('loop'),
      volume: Number.isFinite(el.volume) ? el.volume : null,
      transform: s.transform,
      opacity: s.opacity,
      animationName: s.animationName,
      animationDuration: s.animationDuration,
      animationIterationCount: s.animationIterationCount,
      box: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
      locationHash: location.hash,
      activated: window.activated === true,
      pathGestureCompleted: window.pathGestureCompleted === true || document.body.getAttribute('data-path-gesture-completed') === 'true',
      dragCompleted: window.dragCompleted === true || document.body.getAttribute('data-drag-completed') === 'true',
      clickCompleted: window.clickCompleted === true || document.body.getAttribute('data-click-completed') === 'true',
      alternativeCompleted: window.alternativeCompleted === true || document.body.getAttribute('data-alternative-completed') === 'true',
      dataState: el.getAttribute('data-state') || '',
      status: document.querySelector('#status')?.textContent || '',
      activeElementId: document.activeElement && document.activeElement.id || '',
    };
  });
}

async function mediaState(page) {
  return page.evaluate(() => {
    const el = document.querySelector('#target');
    if (!el) return null;
    let meta = {};
    const metaId = el.getAttribute('data-v3-media-meta');
    const script = metaId ? document.getElementById(metaId) : null;
    if (script && script.textContent) {
      try { meta = JSON.parse(script.textContent); } catch (e) { meta = { parseError: true }; }
    }
    return {
      tag: el.tagName.toLowerCase(),
      controls: el.hasAttribute('controls'),
      muted: el.muted === true || el.hasAttribute('muted'),
      tracks: [...el.querySelectorAll('track')].map((t) => ({
        kind: t.getAttribute('kind') || '',
        src: t.getAttribute('src') || '',
        srclang: t.getAttribute('srclang') || '',
        default: t.hasAttribute('default'),
      })),
      nearbyLinks: [...document.querySelectorAll('a')].map((a) => ({ text: (a.innerText || a.textContent || '').trim(), href: a.getAttribute('href') || '' })),
      inlineTranscripts: [...document.querySelectorAll('[data-v3-transcript],details')].map((n) => (n.textContent || n.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean),
      inlineDescriptions: [...document.querySelectorAll('[data-v3-description-text]')].map((n) => (n.textContent || n.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean),
      fixtureMeta: meta,
    };
  });
}

async function statusState(page) {
  return page.evaluate(() => {
    const el = document.querySelector('#status,[data-v3-status-message]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      text: (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
      role: el.getAttribute('role') || '',
      ariaLive: el.getAttribute('aria-live') || '',
      tabindex: el.getAttribute('tabindex') || '',
      dataStatusMeaning: el.getAttribute('data-v3-status-meaning') || '',
      programmaticStatusAnnouncement: el.getAttribute('data-v3-programmatic-status-announcement') === 'true',
      inOpenDialog: !!el.closest('dialog[open],[role="dialog"],[role="alertdialog"],[aria-modal="true"]'),
      inDisclosureContent: !!el.closest('[data-v3-disclosure-content],[data-v3-expanded-content]'),
      announcements: window.__v3StatusAnnouncements || [],
      activeElementId: document.activeElement && document.activeElement.id || '',
      box: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
    };
  });
}

async function captureCase(browser, c, source) {
  const page = await open(browser, c.file);
  const nativeDialogs = [];
  page.on('dialog', async (dialog) => {
    nativeDialogs.push({ type: dialog.type(), message: dialog.message() });
    await dialog.accept().catch(() => {});
  });
  const row = { id: c.id, aspect: c.aspect, expected: c.expected, source, file: c.file, captures: [], observations: {} };
  try {
    row.observations.before = await targetState(page);
    row.captures.push({ state: 'before-target', file: await screenshot(page, `${c.id}-before-target`, '#target') });
    row.captures.push({ state: 'before-page', file: await screenshot(page, `${c.id}-before-page`) });

    if (c.aspect === 'audio-control') {
      await new Promise((r) => setTimeout(r, 3300));
      row.observations.after3300ms = await targetState(page);
      row.captures.push({ state: 'after-3300ms-page', file: await screenshot(page, `${c.id}-after-3300ms-page`) });
    } else if (['pause-stop-hide', 'flash-risk'].includes(c.aspect)) {
      await new Promise((r) => setTimeout(r, 550));
      row.observations.after550ms = await targetState(page);
      row.captures.push({ state: 'after-550ms-target', file: await screenshot(page, `${c.id}-after-550ms-target`, '#target') });
    } else if (c.aspect === 'keyboard-trap') {
      await page.focus('#target').catch(() => {});
      await page.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 220));
      row.observations.afterTab = await targetState(page);
      row.captures.push({ state: 'after-tab-page', file: await screenshot(page, `${c.id}-after-tab-page`) });
    } else if (c.aspect === 'context-change') {
      const actionType = await page.$eval('#target', (el) => (
        el.hasAttribute('onfocus') ? 'focus' : el.hasAttribute('oninput') ? 'input' : el.hasAttribute('onchange') ? 'change' : 'focus'
      )).catch(() => 'focus');
      await page.focus('#target').catch(() => {});
      if (actionType !== 'focus') {
        await page.keyboard.type('x').catch(() => {});
        if (actionType === 'change') await page.keyboard.press('Tab').catch(() => {});
      }
      await new Promise((r) => setTimeout(r, 100));
      row.observations.afterAction = { actionType, state: await targetState(page) };
      row.captures.push({ state: `after-${actionType}-page`, file: await screenshot(page, `${c.id}-after-${actionType}-page`) });
    } else if (c.aspect === 'pointer-operation') {
      const box = await page.$eval('#target', (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      }).catch(() => null);
      if (box) {
        await page.mouse.move(box.x, box.y);
        await page.mouse.down();
        await new Promise((r) => setTimeout(r, 60));
        row.observations.afterPointerDown = await targetState(page);
        await page.mouse.up();
      }
      row.captures.push({ state: 'after-pointer-page', file: await screenshot(page, `${c.id}-after-pointer-page`) });
    } else if (c.aspect === 'pointer-gesture') {
      const box = await page.$eval('#target', (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2, width: r.width, height: r.height };
      }).catch(() => null);
      if (box) {
        const dx = Math.max(70, box.width / 2);
        const dy = Math.max(32, box.height / 2);
        await page.mouse.move(box.x - dx / 2, box.y);
        await page.mouse.down();
        await page.mouse.move(box.x - dx / 6, box.y, { steps: 3 });
        await page.mouse.move(box.x + dx / 6, box.y + dy, { steps: 5 });
        await page.mouse.move(box.x + dx / 2, box.y + dy, { steps: 3 });
        await page.mouse.up();
        await new Promise((r) => setTimeout(r, 140));
        row.observations.afterGesture = await targetState(page);
        row.captures.push({ state: 'after-gesture-page', file: await screenshot(page, `${c.id}-after-gesture-page`) });
      }
      await page.reload({ waitUntil: 'load' });
      await page.click('#target').catch(() => {});
      await new Promise((r) => setTimeout(r, 140));
      row.observations.afterClick = await targetState(page);
      row.captures.push({ state: 'after-click-page', file: await screenshot(page, `${c.id}-after-click-page`) });
      const alternative = await page.$('#alternative');
      if (alternative) {
        await page.reload({ waitUntil: 'load' });
        await page.click('#alternative').catch(() => {});
        await new Promise((r) => setTimeout(r, 140));
        row.observations.afterAlternative = await targetState(page);
        row.captures.push({ state: 'after-alternative-page', file: await screenshot(page, `${c.id}-after-alternative-page`) });
      }
    } else if (c.aspect === 'dragging-movement') {
      const box = await page.$eval('#target', (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2, width: r.width };
      }).catch(() => null);
      if (box) {
        await page.mouse.move(box.x, box.y);
        await page.mouse.down();
        await page.mouse.move(box.x + Math.max(60, box.width + 40), box.y, { steps: 8 });
        await page.mouse.up();
        await new Promise((r) => setTimeout(r, 140));
        row.observations.afterDrag = await targetState(page);
        row.captures.push({ state: 'after-drag-page', file: await screenshot(page, `${c.id}-after-drag-page`) });
      }
      await page.reload({ waitUntil: 'load' });
      await page.click('#target').catch(() => {});
      await new Promise((r) => setTimeout(r, 140));
      row.observations.afterClick = await targetState(page);
      row.captures.push({ state: 'after-click-page', file: await screenshot(page, `${c.id}-after-click-page`) });
      const alternative = await page.$('#alternative');
      if (alternative) {
        await page.reload({ waitUntil: 'load' });
        await page.click('#alternative').catch(() => {});
        await new Promise((r) => setTimeout(r, 140));
        row.observations.afterAlternative = await targetState(page);
        row.captures.push({ state: 'after-alternative-page', file: await screenshot(page, `${c.id}-after-alternative-page`) });
      }
    } else if (c.aspect === 'status-announcement') {
      await page.evaluate(() => {
        window.__v3StatusAnnouncements = [];
        window.__v3AnnounceStatus = (message, target = null) => {
          const path = target && target.id ? `#${target.id}` : '';
          window.__v3StatusAnnouncements.push({ message: String(message || ''), targetPath: path, source: 'capture-programmatic-announcement' });
        };
      }).catch(() => {});
      await page.click('#target').catch(() => {});
      await new Promise((r) => setTimeout(r, 340));
      row.observations.afterStatusAction = await statusState(page);
      row.observations.nativeDialogs = nativeDialogs;
      row.captures.push({ state: 'after-status-target', file: await screenshot(page, `${c.id}-after-status-target`, '#status') });
      row.captures.push({ state: 'after-status-page', file: await screenshot(page, `${c.id}-after-status-page`) });
    } else if (c.aspect === 'reveal-state-discovery') {
      await page.click('#target').catch(() => {});
      await new Promise((r) => setTimeout(r, 220));
      row.observations.afterReveal = await targetState(page);
      row.observations.revealedState = await page.evaluate(() => {
        const target = document.querySelector('#target');
        const controlled = target && target.getAttribute('aria-controls')
          ? document.getElementById(target.getAttribute('aria-controls'))
          : (target && target.tagName.toLowerCase() === 'summary' ? target.closest('details') : null);
        if (!controlled) return null;
        const r = controlled.getBoundingClientRect();
        const s = getComputedStyle(controlled);
        return {
          id: controlled.id || '',
          tag: controlled.tagName.toLowerCase(),
          text: (controlled.innerText || controlled.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200),
          hidden: controlled.hidden === true,
          display: s.display,
          visibility: s.visibility,
          focusableCount: controlled.querySelectorAll('a[href],button,input,textarea,select,[tabindex]:not([tabindex="-1"])').length,
          box: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
        };
      });
      row.captures.push({ state: 'after-reveal-target', file: await screenshot(page, `${c.id}-after-reveal-target`, '#target') });
      row.captures.push({ state: 'after-reveal-page', file: await screenshot(page, `${c.id}-after-reveal-page`) });
    } else if (c.aspect === 'visual-structure-discovery') {
      row.observations.visualStructure = await page.evaluate(() => {
        const target = document.querySelector('#target');
        if (!target) return null;
        const s = getComputedStyle(target);
        const r = target.getBoundingClientRect();
        return {
          tag: target.tagName.toLowerCase(),
          role: target.getAttribute('role') || '',
          text: (target.innerText || target.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200),
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          display: s.display,
          gridTemplateColumns: s.gridTemplateColumns,
          childCount: target.children.length,
          box: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
        };
      });
      row.captures.push({ state: 'visual-structure-target', file: await screenshot(page, `${c.id}-visual-structure-target`, '#target') });
      row.captures.push({ state: 'visual-structure-page', file: await screenshot(page, `${c.id}-visual-structure-page`) });
    } else if (c.aspect === 'visual-content-discovery') {
      row.observations.visualContent = await page.evaluate(() => {
        const target = document.querySelector('#target');
        if (!target) return null;
        const s = getComputedStyle(target);
        const r = target.getBoundingClientRect();
        return {
          tag: target.tagName.toLowerCase(),
          role: target.getAttribute('role') || '',
          text: (target.innerText || target.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200),
          ariaLabel: target.getAttribute('aria-label') || '',
          title: target.getAttribute('title') || '',
          visualAlternative: target.getAttribute('data-v3-visual-alternative') || '',
          visualAlternativeAdequate: target.getAttribute('data-v3-visual-alternative-adequate') === 'true',
          decorative: target.getAttribute('data-v3-decorative') === 'true' || target.getAttribute('aria-hidden') === 'true',
          colorOnly: target.getAttribute('data-v3-color-only') === 'true',
          nonColorCue: target.getAttribute('data-v3-has-noncolor-cue') === 'true',
          backgroundImage: s.backgroundImage && s.backgroundImage !== 'none' ? 'present' : '',
          color: s.color,
          backgroundColor: s.backgroundColor,
          box: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
        };
      });
      row.captures.push({ state: 'visual-content-target', file: await screenshot(page, `${c.id}-visual-content-target`, '#target') });
      row.captures.push({ state: 'visual-content-page', file: await screenshot(page, `${c.id}-visual-content-page`) });
    } else if (c.aspect === 'media-alternatives') {
      row.observations.media = await mediaState(page);
      row.captures.push({ state: 'media-page', file: await screenshot(page, `${c.id}-media-page`) });
    }
  } finally {
    await page.close().catch(() => {});
  }
  return row;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const ni = readManifest(NI_BASE);
  const media = readManifest(MEDIA_BASE);
  const wanted = new Set([
    'audio-p1', 'audio-n1', 'audio-n2', 'audio-n3', 'audio-n4', 'audio-n5', 'audio-n7', 'audio-n9', 'audio-n10',
    'motion-p1', 'motion-n1',
    'flash-p1', 'flash-p5', 'flash-p8', 'flash-n1', 'flash-n5', 'flash-n8',
    'trap-p1', 'trap-n1',
    'context-p1', 'context-p2', 'context-n1',
    'pointer-p1', 'pointer-n1',
    'gesture-p1', 'gesture-n1', 'gesture-n2', 'gesture-n3', 'gesture-n4',
    'drag-p1', 'drag-n1', 'drag-n2', 'drag-n3', 'drag-n4',
    'reveal-p1', 'reveal-p2', 'reveal-p3', 'reveal-p4', 'reveal-p5', 'reveal-p6', 'reveal-p7', 'reveal-p8', 'reveal-p9', 'reveal-p10',
    'reveal-n1', 'reveal-n2', 'reveal-n3', 'reveal-n4', 'reveal-n5', 'reveal-n6', 'reveal-n7', 'reveal-n8', 'reveal-n9', 'reveal-n10',
    'vstruct-p1', 'vstruct-p2', 'vstruct-p3', 'vstruct-p4', 'vstruct-p5', 'vstruct-p6', 'vstruct-p7', 'vstruct-p8', 'vstruct-p9', 'vstruct-p10',
    'vstruct-n1', 'vstruct-n2', 'vstruct-n3', 'vstruct-n4', 'vstruct-n5', 'vstruct-n6', 'vstruct-n7', 'vstruct-n8', 'vstruct-n9', 'vstruct-n10',
    'vcontent-p1', 'vcontent-p2', 'vcontent-p3', 'vcontent-p4', 'vcontent-p5', 'vcontent-p6', 'vcontent-p7', 'vcontent-p8', 'vcontent-p9', 'vcontent-p10',
    'vcontent-n1', 'vcontent-n2', 'vcontent-n3', 'vcontent-n4', 'vcontent-n5', 'vcontent-n6', 'vcontent-n7', 'vcontent-n8', 'vcontent-n9', 'vcontent-n10',
    'shortcut-p1', 'shortcut-p2', 'shortcut-p3', 'shortcut-n1', 'shortcut-n2', 'shortcut-n3', 'shortcut-n4', 'shortcut-n6', 'shortcut-n10',
    'status-p1', 'status-p5', 'status-p6', 'status-p7', 'status-n1', 'status-n2', 'status-n5', 'status-n6', 'status-n7', 'status-n8', 'status-n9', 'status-n10',
    'label-p1', 'label-p2', 'label-p3', 'label-n1', 'label-n2', 'label-n3', 'label-n4', 'label-n5',
    'targetsize-p1', 'targetsize-n1', 'targetsize-n2', 'targetsize-n3', 'targetsize-n4', 'targetsize-n5', 'targetsize-n6',
    ...Array.from({ length: 10 }, (_, i) => `media-p${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `media-n${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `auth-p${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `auth-n${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `redundant-p${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `redundant-n${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `cog-p${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `cog-n${i + 1}`),
  ]);
  const cases = [
    ...ni.cases.filter((c) => wanted.has(c.id)).map((c) => ({ ...c, source: 'non-interference-interaction' })),
    ...media.cases.filter((c) => wanted.has(c.id)).map((c) => ({ ...c, source: 'media-process-auth' })),
  ];
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const captures = [];
  try {
    for (const c of cases) captures.push(await captureCase(browser, c, c.source));
  } finally {
    await browser.close();
  }
  const out = path.join(OUT, 'manifest.json');
  fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), captures }, null, 2) + '\n');
  console.log(out);
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
