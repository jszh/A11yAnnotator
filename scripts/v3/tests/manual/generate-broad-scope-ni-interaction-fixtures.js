'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../../..');
const OUT = path.join(ROOT, 'scripts/v3/tests/generated/broad-scope/non-interference-interaction');

function page(title, body, style = '', script = '') {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body { font: 16px Arial, sans-serif; margin: 24px; }
    @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(20px); } }
    @keyframes flashFast { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pulse { from { opacity: .4; } to { opacity: 1; } }
    ${style}
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    ${body}
  </main>
  <script>${script}</script>
</body>
</html>`;
}

const cases = [];
const add = (aspect, expected, id, html) => cases.push({ aspect, expected, id, html });

function toneWavDataUri(seconds = 4, frequency = 440) {
  const sampleRate = 8000;
  const samples = Math.floor(sampleRate * seconds);
  const dataSize = samples;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate, 28);
  buf.writeUInt16LE(1, 32);
  buf.writeUInt16LE(8, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples; i++) {
    const v = Math.round(128 + 80 * Math.sin((2 * Math.PI * frequency * i) / sampleRate));
    buf[44 + i] = Math.max(0, Math.min(255, v));
  }
  return `data:audio/wav;base64,${buf.toString('base64')}`;
}

const TONE = toneWavDataUri();

for (let i = 1; i <= 10; i++) {
  add('audio-control', 'positive', `audio-p${i}`, page(`Audio positive ${i}`, `<audio id="target" autoplay loop data-v3-non-silent-tone="true" src="${TONE}"></audio>`));
  const control = i === 1
    ? `<audio id="target" autoplay loop muted data-v3-non-silent-tone="true" src="${TONE}"></audio>`
    : i === 2
      ? `<audio id="target" autoplay loop controls data-v3-non-silent-tone="true" src="${TONE}"></audio>`
      : i === 3
        ? `<audio id="target" autoplay loop data-v3-non-silent-tone="true" src="${TONE}"></audio><button aria-controls="target" onclick="document.getElementById('target').pause()">Pause audio</button>`
      : i === 4
        ? `<audio id="target" controls data-v3-non-silent-tone="true" src="${TONE}"></audio>`
      : i === 5
        ? `<audio id="target" data-v3-non-silent-tone="true" src="${TONE}"></audio>`
      : i === 6
        ? `<audio id="target" autoplay muted controls data-v3-non-silent-tone="true" src="${TONE}"></audio>`
      : i === 7
        ? `<audio id="target" autoplay data-v3-non-silent-tone="false" src="${TONE}"></audio>`
      : i === 8
        ? `<video id="target" autoplay loop muted data-v3-non-silent-tone="true" src="${TONE}"></video>`
      : i === 9
        ? `<audio id="target" autoplay loop data-v3-non-silent-tone="true" src="${TONE}"></audio><input type="range" aria-label="Audio volume" min="0" max="100" value="50" oninput="document.getElementById('target').volume = Number(this.value) / 100">`
      : `<audio id="target" autoplay loop data-v3-non-silent-tone="true" src="${TONE}"></audio><button onclick="document.getElementById('target').muted = true">Mute sound</button>`;
  add('audio-control', 'negative', `audio-n${i}`, page(`Audio negative ${i}`, control));
}

for (let i = 1; i <= 10; i++) {
  add('pause-stop-hide', 'positive', `motion-p${i}`, page(`Motion positive ${i}`, `<p>Reading task continues while this non-essential ticker moves.</p><div id="target" data-v3-parallel-non-essential="true">Persistent motion ${i}</div>`, `#target{display:inline-block;animation:ticker 8s linear infinite}`));
  add('pause-stop-hide', 'negative', `motion-n${i}`, page(`Motion negative ${i}`, `<div id="target">Brief or controlled motion ${i}</div>`, `#target{display:inline-block;animation:pulse 2s linear 1}`));
}

for (let i = 1; i <= 10; i++) {
  const positiveScript = i <= 4
    ? `setInterval(() => { const t = document.getElementById('target'); t.style.opacity = t.style.opacity === '0' ? '1' : '0'; }, 100);`
    : i <= 7
      ? `setInterval(() => { const t = document.getElementById('target'); t.style.backgroundColor = t.style.backgroundColor === 'rgb(0, 0, 0)' ? 'rgb(204, 0, 0)' : 'rgb(0, 0, 0)'; }, 100);`
      : `setInterval(() => { const t = document.getElementById('target'); t.style.opacity = t.style.opacity === '0' ? '1' : '0'; }, 100);`;
  const positiveStyle = i <= 7
    ? `#target{display:flex;align-items:center;justify-content:center;width:360px;height:260px;background:#c00;color:white;opacity:1}`
    : `#target{display:flex;align-items:center;justify-content:center;width:80px;height:80px;background:#c00;color:white;opacity:1}`;
  add('flash-risk', 'positive', `flash-p${i}`, page(
    `Flash positive ${i}`,
    `<div id="target" data-v3-flash-target>Flash risk ${i}</div>`,
    positiveStyle,
    positiveScript,
  ));
  const negativeStyle = i <= 4
    ? `#target{display:flex;align-items:center;justify-content:center;width:360px;height:260px;background:#c00;color:white;opacity:1}`
    : i <= 7
      ? `#target{display:flex;align-items:center;justify-content:center;width:80px;height:80px;background:#06c;color:white;opacity:1}`
      : `#target{display:flex;align-items:center;justify-content:center;width:360px;height:260px;background:#444;color:white;opacity:1}`;
  const negativeScript = i <= 4
    ? `setInterval(() => { const t = document.getElementById('target'); t.style.opacity = t.style.opacity === '0' ? '1' : '0'; }, 500);`
    : i <= 7
      ? `setInterval(() => { const t = document.getElementById('target'); t.style.opacity = t.style.opacity === '0' ? '1' : '0'; }, 100);`
      : `setInterval(() => { const t = document.getElementById('target'); t.style.backgroundColor = t.style.backgroundColor === 'rgb(68, 68, 68)' ? 'rgb(90, 90, 90)' : 'rgb(68, 68, 68)'; }, 100);`;
  add('flash-risk', 'negative', `flash-n${i}`, page(
    `Flash negative ${i}`,
    `<div id="target" data-v3-flash-target>Flash control ${i}</div>`,
    negativeStyle,
    negativeScript,
  ));
}

const trapRegionStyle = `
  .modal { border: 2px solid #333; padding: 12px; width: 320px; background: #f7f7f7; }
  .closed { display: none; }
`;
const cycleRegionScript = `
  const modal = document.getElementById('target');
  modal && modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const controls = [...modal.querySelectorAll('button,a[href],input')];
    const i = Math.max(0, controls.indexOf(document.activeElement));
    e.preventDefault();
    const next = e.shiftKey ? (i - 1 + controls.length) % controls.length : (i + 1) % controls.length;
    controls[next].focus();
  });
`;
const fixedSetTrapScript = `
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    if (!['target','trapB'].includes(document.activeElement && document.activeElement.id)) return;
    e.preventDefault();
    document.getElementById(document.activeElement.id === 'target' ? 'trapB' : 'target').focus();
  });
`;
for (let i = 1; i <= 10; i++) {
  const positive = i <= 4
    ? page(`Trap positive ${i}`, `<a href="#">Before</a><button id="target" onblur="setTimeout(() => this.focus(), 10)">Self-refocus trap ${i}</button><a href="#">After</a>`)
    : i <= 7
      ? page(`Trap positive ${i}`, `<a href="#">Before</a><section id="target" class="modal" role="dialog" aria-label="Trapping dialog ${i}"><button>First trapped ${i}</button><button>Second trapped ${i}</button></section><a href="#">After</a>`, trapRegionStyle, cycleRegionScript)
      : page(`Trap positive ${i}`, `<a href="#">Before</a><button id="target">Fixed set A ${i}</button><button id="trapB">Fixed set B ${i}</button>`, '', fixedSetTrapScript);
  add('keyboard-trap', 'positive', `trap-p${i}`, positive);

  const negative = i === 1
    ? page(`Trap negative ${i}`, `<input id="target" value="normal input"><button>Next</button>`)
    : i === 2
      ? page(`Trap negative ${i}`, `<button id="target" onblur="setTimeout(() => this.focus(), 10)">Only focusable is not a trap proof</button>`)
      : i === 3
        ? page(`Trap negative ${i}`, `<a id="exit" href="#">Before</a><section id="target" class="modal" role="dialog" aria-label="Escapable dialog ${i}"><p>Press Escape to leave.</p><button>First</button><button>Second</button></section><a href="#">After</a>`, trapRegionStyle, `${cycleRegionScript}
          modal && modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') { document.getElementById('exit').focus(); } });`)
      : i === 4
        ? page(`Trap negative ${i}`, `<a id="exit" href="#">Before</a><section id="target" class="modal" role="dialog" aria-label="Closable dialog ${i}"><button>First</button><button data-dismiss onclick="document.getElementById('target').classList.add('closed');document.getElementById('exit').focus()">Close</button></section><a href="#">After</a>`, trapRegionStyle, cycleRegionScript)
      : i === 5
        ? page(`Trap negative ${i}`, `<a id="exit" href="#">Before</a><section id="target" class="modal" role="dialog" aria-label="Advised exit dialog ${i}"><p>Press Escape to return to page content.</p><button>First</button><button>Second</button></section><a href="#">After</a>`, trapRegionStyle, `${cycleRegionScript}
          modal && modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') { document.getElementById('exit').focus(); } });`)
      : i === 6
        ? page(`Trap negative ${i}`, `<a href="#">Before</a><section id="target" class="modal" role="dialog" aria-label="Natural dialog ${i}"><button>First</button><button>Second</button></section><a href="#">After</a>`, trapRegionStyle)
      : i === 7
        ? page(`Trap negative ${i}`, `<a href="#">Before</a><section id="target" class="modal" role="dialog" aria-label="One-way dialog ${i}"><button>First</button><button>Second</button></section><a href="#">After</a>`, trapRegionStyle, `
          const modal = document.getElementById('target');
          modal && modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); modal.querySelector('button').focus(); }
          });`)
      : i === 8
        ? page(`Trap negative ${i}`, `<input id="target" onfocus="document.getElementById('next').focus()" value="redirects"><button id="next">Redirect target</button><a href="#">After</a>`)
      : i === 9
        ? page(`Trap negative ${i}`, `<button id="target">Single focusable ordinary button</button>`)
      : page(`Trap negative ${i}`, `<a id="exit" href="#">Before</a><section id="target" class="modal" role="dialog" aria-label="Close button dialog ${i}"><button>First</button><button aria-label="Close dialog" onclick="document.getElementById('target').classList.add('closed');document.getElementById('exit').focus()">×</button></section><a href="#">After</a>`, trapRegionStyle, cycleRegionScript);
  add('keyboard-trap', 'negative', `trap-n${i}`, negative);
}

for (let i = 1; i <= 10; i++) {
  const mod = i % 3;
  const positiveControl = mod === 0
    ? `<input id="target" onfocus="document.title='Focus context ${i}';document.body.append(' moved focus ${i}')" value="">`
    : mod === 1
      ? `<input id="target" oninput="document.title='Input context ${i}';document.body.append(' moved input ${i}')" value="">`
      : `<input id="target" onchange="document.title='Change context ${i}';document.body.append(' moved change ${i}')" value="">`;
  add('context-change', 'positive', `context-p${i}`, page(`Context positive ${i}`, positiveControl));
  add('context-change', 'negative', `context-n${i}`, page(`Context negative ${i}`, `<input id="target" aria-describedby="h"><span id="h">Helpful inline hint.</span>`));
}

for (let i = 1; i <= 10; i++) {
  add('pointer-operation', 'positive', `pointer-p${i}`, page(`Pointer positive ${i}`, `<canvas id="target" width="120" height="40" onpointerdown="window.activated=true"></canvas>`));
  add('pointer-operation', 'negative', `pointer-n${i}`, page(`Pointer negative ${i}`, `<button id="target">Ordinary click button ${i}</button>`));
}

function pointerGestureScript(i, opts = {}) {
  const clickWorks = opts.clickWorks ? 'true' : 'false';
  const altWorks = opts.altWorks ? 'true' : 'false';
  return `
    const target = document.getElementById('target');
    const statusEl = document.getElementById('status');
    let down = false;
    let startX = 0;
    let maxY = 0;
    let minY = 0;
    let maxX = 0;
    function complete(kind) {
      if (kind === 'gesture') {
        window.pathGestureCompleted = true;
        document.body.setAttribute('data-path-gesture-completed', 'true');
      } else if (kind === 'click') {
        window.clickCompleted = true;
        document.body.setAttribute('data-click-completed', 'true');
      } else if (kind === 'alternative') {
        window.alternativeCompleted = true;
        document.body.setAttribute('data-alternative-completed', 'true');
      }
      target.setAttribute('data-state', 'advanced');
      statusEl.textContent = kind + ' completed ${i}';
    }
    function start(e) {
      down = true;
      startX = e.clientX;
      maxX = e.clientX;
      maxY = e.clientY;
      minY = e.clientY;
    }
    function move(e) {
      if (!down) return;
      maxX = Math.max(maxX, e.clientX);
      maxY = Math.max(maxY, e.clientY);
      minY = Math.min(minY, e.clientY);
      if ((maxX - startX) > 55 && (maxY - minY) > 24) complete('gesture');
    }
    function end() { down = false; }
    target.addEventListener('pointerdown', start);
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', end);
    target.addEventListener('mousedown', start);
    target.addEventListener('mousemove', move);
    target.addEventListener('mouseup', end);
    if (${clickWorks}) target.addEventListener('click', () => complete('click'));
    const alt = document.getElementById('alternative');
    if (alt && ${altWorks}) alt.addEventListener('click', () => complete('alternative'));
  `;
}

for (let i = 1; i <= 10; i++) {
  add('pointer-gesture', 'positive', `gesture-p${i}`, page(
    `Pointer gesture positive ${i}`,
    `<div id="target" data-v3-path-gesture-target tabindex="0" aria-label="Zigzag gesture area ${i}">Draw zigzag ${i}</div><p id="status">Waiting</p>`,
    `#target{width:180px;height:76px;border:2px solid #333;background:#eef;display:flex;align-items:center;justify-content:center;user-select:none;touch-action:none}`,
    pointerGestureScript(i),
  ));
  const neg = i % 4;
  if (neg === 0) {
    add('pointer-gesture', 'negative', `gesture-n${i}`, page(
      `Pointer gesture negative ${i}`,
      `<div id="target" role="button" data-v3-path-gesture-target tabindex="0" aria-label="Advance ${i}">Advance ${i}</div><p id="status">Waiting</p>`,
      `#target{width:170px;height:76px;border:2px solid #333;background:#efe;display:flex;align-items:center;justify-content:center;user-select:none;touch-action:none}`,
      pointerGestureScript(i, { clickWorks: true }),
    ));
  } else if (neg === 1) {
    add('pointer-gesture', 'negative', `gesture-n${i}`, page(
      `Pointer gesture negative ${i}`,
      `<div id="target" data-v3-path-gesture-target tabindex="0" aria-label="Zigzag gesture area ${i}">Draw zigzag ${i}</div><button id="alternative" data-v3-pointer-gesture-alternative data-v3-pointer-gesture-alternative-for="target">Advance ${i}</button><p id="status">Waiting</p>`,
      `#target{width:180px;height:76px;border:2px solid #333;background:#efe;display:flex;align-items:center;justify-content:center;user-select:none;touch-action:none}#alternative{margin-left:12px;min-height:32px}`,
      pointerGestureScript(i, { altWorks: true }),
    ));
  } else if (neg === 2) {
    add('pointer-gesture', 'negative', `gesture-n${i}`, page(
      `Pointer gesture negative ${i}`,
      `<div id="target" data-v3-path-gesture-target data-v3-essential-pointer-gesture="true" tabindex="0" aria-label="Signature pad ${i}">Signature pad ${i}</div><p id="status">Waiting</p>`,
      `#target{width:190px;height:76px;border:2px solid #333;background:#efe;display:flex;align-items:center;justify-content:center;user-select:none;touch-action:none}`,
      pointerGestureScript(i),
    ));
  } else {
    add('pointer-gesture', 'negative', `gesture-n${i}`, page(
      `Pointer gesture negative ${i}`,
      `<div id="target" data-v3-path-gesture-target data-v3-ua-pointer-gesture="true" tabindex="0" aria-label="Browser gesture ${i}">UA gesture ${i}</div><p id="status">Waiting</p>`,
      `#target{width:190px;height:86px;border:2px solid #333;background:#efe;display:flex;align-items:center;justify-content:center;user-select:none;touch-action:none}`,
      pointerGestureScript(i),
    ));
  }
}

for (let i = 1; i <= 10; i++) {
  const key = String.fromCharCode(96 + i);
  const positiveControl = i === 3
    ? `<button id="off">Turn off shortcuts</button>`
    : '';
  const positiveExtra = i === 2
    ? `<div id="activity-log" aria-live="polite">No shortcut activity</div>`
    : '<p id="status">Waiting</p>';
  const positiveAction = i === 2
    ? `document.getElementById('activity-log').textContent = 'Shortcut ${i} changed this non-status region';`
    : `window.shortcutActivationCount = (window.shortcutActivationCount || 0) + 1;
        window.shortcutActivated = true;
        document.body.setAttribute('data-shortcut-activated', 'true');
        document.getElementById('target').setAttribute('data-activated', 'true');
        document.getElementById('status').textContent = 'Shortcut ${i} activated ' + window.shortcutActivationCount;`;
  add('character-shortcuts', 'positive', `shortcut-p${i}`, page(
    `Shortcut positive ${i}`,
    `${positiveControl}<button id="target" data-shortcut-key="${key}" aria-keyshortcuts="${key}">Shortcut action ${i}</button>${positiveExtra}`,
    '',
    `document.addEventListener('keydown', (e) => {
      if (e.key === '${key}' && !e.ctrlKey && !e.altKey && !e.metaKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        ${positiveAction}
      }
    });`,
  ));
  const neg = i % 4;
  if (neg === 0) {
    add('character-shortcuts', 'negative', `shortcut-n${i}`, page(`Shortcut negative ${i}`, `<button id="target">No shortcut ${i}</button><p id="status">Waiting</p>`));
  } else if (neg === 1) {
    add('character-shortcuts', 'negative', `shortcut-n${i}`, page(
      `Shortcut negative ${i}`,
      `<button id="target" data-shortcut-key="${key}" data-shortcut-scope="focus" aria-keyshortcuts="${key}">Focused-only shortcut ${i}</button><p id="status">Waiting</p>`,
      '',
      `document.getElementById('target').addEventListener('keydown', (e) => {
        if (e.key === '${key}') {
          window.shortcutActivationCount = (window.shortcutActivationCount || 0) + 1;
          window.shortcutActivated = true;
          document.getElementById('target').setAttribute('data-activated', 'true');
          document.getElementById('status').textContent = 'Focused shortcut ${i} activated ' + window.shortcutActivationCount;
        }
      });`,
    ));
  } else if (neg === 2) {
    const remap = i === 2 || i === 6 || i === 10;
    add('character-shortcuts', 'negative', `shortcut-n${i}`, page(
      `Shortcut negative ${i}`,
      `<button id="off" onclick="${remap ? `window.shortcutRemapped = true; document.getElementById('target').setAttribute('aria-keyshortcuts','Control+${key}'); document.getElementById('status').textContent = 'Shortcut remapped';` : `window.shortcutsDisabled = true; document.getElementById('status').textContent = 'Shortcuts disabled';`}">${remap ? 'Remap shortcut' : 'Turn off shortcuts'}</button><button id="target" data-shortcut-key="${key}" aria-keyshortcuts="${key}">Configurable shortcut ${i}</button><p id="status">Waiting</p>`,
      '',
      `document.addEventListener('keydown', (e) => {
        if (e.key === '${key}' && !window.shortcutsDisabled && (!window.shortcutRemapped || e.ctrlKey)) {
          window.shortcutActivationCount = (window.shortcutActivationCount || 0) + 1;
          window.shortcutActivated = true;
          document.getElementById('target').setAttribute('data-activated', 'true');
          document.getElementById('status').textContent = 'Configurable shortcut ${i} activated ' + window.shortcutActivationCount;
        }
      });`,
    ));
  } else {
    add('character-shortcuts', 'negative', `shortcut-n${i}`, page(
      `Shortcut negative ${i}`,
      `<button id="target" data-shortcut-key="${i === 3 ? `Alt+${key}` : `Control+${key}`}" aria-keyshortcuts="${i === 3 ? `Alt+${key}` : `Control+${key}`}">Modified shortcut ${i}</button><p id="status">Waiting</p>`,
      '',
      `document.addEventListener('keydown', (e) => {
        if (e.key === '${key}' && ${i === 3 ? 'e.altKey' : 'e.ctrlKey'}) {
          window.shortcutActivationCount = (window.shortcutActivationCount || 0) + 1;
          window.shortcutActivated = true;
          document.getElementById('target').setAttribute('data-activated', 'true');
          document.getElementById('status').textContent = 'Modified shortcut ${i} activated ' + window.shortcutActivationCount;
        }
      });`,
    ));
  }
}

for (let i = 1; i <= 10; i++) {
  const pos = (i - 1) % 10;
  let positiveBody = `<button id="target" data-v3-status-trigger>Save changes ${i}</button><p id="status" data-v3-status-message></p>`;
  let positiveStyle = '';
  let positiveScript = `document.getElementById('target').addEventListener('click', () => {
      document.getElementById('status').textContent = 'Saved changes ${i}';
    });`;
  if (pos === 1) {
    positiveBody = `<button id="target" data-v3-status-trigger>Submit ${i}</button><p id="status" data-v3-status-message></p>`;
    positiveScript = `document.getElementById('target').addEventListener('click', () => {
      document.getElementById('status').textContent = '5 errors on page ${i}';
    });`;
  } else if (pos === 2) {
    positiveBody = `<button id="target" data-v3-status-trigger>Upload ${i}</button><p id="status" data-v3-status-message></p>`;
    positiveScript = `document.getElementById('target').addEventListener('click', () => {
      document.getElementById('status').textContent = 'Upload 50 percent complete ${i}';
    });`;
  } else if (pos === 3) {
    positiveBody = `<button id="target" data-v3-status-trigger>Add item ${i}</button><p id="status" data-v3-status-message>Cart has 0 items</p>`;
    positiveScript = `document.getElementById('target').addEventListener('click', () => {
      document.getElementById('status').textContent = 'Cart has 3 items ${i}';
    });`;
  } else if (pos === 4) {
    positiveBody = `<button id="target" data-v3-status-trigger>Finish task ${i}</button><p id="status" data-v3-status-message>Application busy ${i}</p>`;
    positiveScript = `document.getElementById('target').addEventListener('click', () => {
      document.getElementById('status').textContent = '';
    });`;
  } else if (pos === 5) {
    positiveBody = `<button id="target" data-v3-status-trigger>Favorite ${i}</button><span id="status" data-v3-status-message data-v3-status-meaning="" aria-label=""></span>`;
    positiveStyle = `#status{display:inline-block;width:24px;height:24px;margin-left:8px;border-radius:50%;background:#999;vertical-align:middle}`;
    positiveScript = `document.getElementById('target').addEventListener('click', () => {
      const s = document.getElementById('status');
      s.style.background = '#0a0';
      s.setAttribute('data-v3-status-meaning', 'Saved as favorite ${i}');
    });`;
  } else if (pos === 6) {
    positiveBody = `<button id="target" data-v3-status-trigger>Search ${i}</button><p id="status" data-v3-status-message></p>`;
    positiveScript = `document.getElementById('target').addEventListener('click', () => {
      setTimeout(() => { document.getElementById('status').textContent = '18 results returned ${i}'; }, 180);
    });`;
  } else if (pos === 7) {
    positiveBody = `<button id="target" data-v3-status-trigger>Sync ${i}</button><p id="status" data-v3-status-message>Idle</p>`;
    positiveScript = `document.getElementById('target').addEventListener('click', () => {
      document.getElementById('status').textContent = 'Sync complete ${i}';
    });`;
  } else if (pos === 8) {
    positiveBody = `<button id="target" data-v3-status-trigger>Filter ${i}</button><p id="status" data-v3-status-message></p>`;
    positiveScript = `document.getElementById('target').addEventListener('click', () => {
      document.getElementById('status').textContent = 'No matching items ${i}';
    });`;
  } else if (pos === 9) {
    positiveBody = `<button id="target" data-v3-status-trigger>Queue ${i}</button><p id="status" data-v3-status-message></p>`;
    positiveScript = `document.getElementById('target').addEventListener('click', () => {
      document.getElementById('status').textContent = 'Added to queue ${i}';
    });`;
  }
  add('status-announcement', 'positive', `status-p${i}`, page(
    `Status positive ${i}`,
    positiveBody,
    positiveStyle,
    positiveScript,
  ));
  const neg = (i - 1) % 10;
  if (neg === 0) {
    add('status-announcement', 'negative', `status-n${i}`, page(
      `Status negative ${i}`,
      `<button id="target" data-v3-status-trigger>Save changes ${i}</button><p id="status" data-v3-status-message role="status"></p>`,
      '',
      `document.getElementById('target').addEventListener('click', () => {
        document.getElementById('status').textContent = 'Saved changes ${i}';
      });`,
    ));
  } else if (neg === 1) {
    add('status-announcement', 'negative', `status-n${i}`, page(
      `Status negative ${i}`,
      `<button id="target" data-v3-status-trigger>Save changes ${i}</button><p id="status" data-v3-status-message role="alert"></p>`,
      '',
      `document.getElementById('target').addEventListener('click', () => {
        document.getElementById('status').textContent = 'Saved changes ${i}';
      });`,
    ));
  } else if (neg === 2) {
    add('status-announcement', 'negative', `status-n${i}`, page(
      `Status negative ${i}`,
      `<button id="target" data-v3-status-trigger>Search ${i}</button><p id="status" data-v3-status-message aria-live="polite"></p>`,
      '',
      `document.getElementById('target').addEventListener('click', () => {
        document.getElementById('status').textContent = '3 results loaded for query ${i}';
      });`,
    ));
  } else if (neg === 3) {
    add('status-announcement', 'negative', `status-n${i}`, page(
      `Status negative ${i}`,
      `<button id="target" data-v3-status-trigger>Search ${i}</button><p id="status" data-v3-status-message aria-live="assertive"></p>`,
      '',
      `document.getElementById('target').addEventListener('click', () => {
        document.getElementById('status').textContent = 'Urgent status ${i}';
      });`,
    ));
  } else if (neg === 4) {
    add('status-announcement', 'negative', `status-n${i}`, page(
      `Status negative ${i}`,
      `<button id="target" data-v3-status-trigger>Submit ${i}</button><p id="status" data-v3-status-message tabindex="-1"></p>`,
      '',
      `document.getElementById('target').addEventListener('click', () => {
        const status = document.getElementById('status');
        status.textContent = 'Submission error ${i}';
        status.focus();
      });`,
    ));
  } else if (neg === 5) {
    add('status-announcement', 'negative', `status-n${i}`, page(
      `Status negative ${i}`,
      `<button id="target" data-v3-status-trigger>Save changes ${i}</button><p id="status" data-v3-status-message data-v3-programmatic-status-announcement="true"></p>`,
      '',
      `document.getElementById('target').addEventListener('click', () => {
        const status = document.getElementById('status');
        status.textContent = 'Saved changes ${i}';
        if (window.__v3AnnounceStatus) window.__v3AnnounceStatus(status.textContent, status);
      });`,
    ));
  } else if (neg === 6) {
    add('status-announcement', 'negative', `status-n${i}`, page(
      `Status negative ${i}`,
      `<button id="target" data-v3-status-trigger>Open error dialog ${i}</button><dialog id="dialog"><p id="status" data-v3-status-message></p><button>OK</button></dialog>`,
      '',
      `document.getElementById('target').addEventListener('click', () => {
        const dialog = document.getElementById('dialog');
        document.getElementById('status').textContent = 'Submission error ${i}';
        dialog.showModal();
        dialog.querySelector('button').focus();
      });`,
    ));
  } else if (neg === 7) {
    add('status-announcement', 'negative', `status-n${i}`, page(
      `Status negative ${i}`,
      `<button id="target" data-v3-status-trigger>Browser alert ${i}</button><p id="status" data-v3-status-message></p>`,
      '',
      `document.getElementById('target').addEventListener('click', () => {
        alert('Submission error ${i}');
      });`,
    ));
  } else if (neg === 8) {
    add('status-announcement', 'negative', `status-n${i}`, page(
      `Status negative ${i}`,
      `<button id="target" data-v3-status-trigger aria-expanded="false" aria-controls="panel">Show details ${i}</button><section id="panel" data-v3-disclosure-content hidden><p id="status" data-v3-status-message></p></section>`,
      '',
      `document.getElementById('target').addEventListener('click', () => {
        const panel = document.getElementById('panel');
        document.getElementById('target').setAttribute('aria-expanded', 'true');
        panel.hidden = false;
        document.getElementById('status').textContent = 'Additional questions added ${i}';
      });`,
    ));
  } else {
    add('status-announcement', 'negative', `status-n${i}`, page(
      `Status negative ${i}`,
      `<button id="target" data-v3-status-trigger>Log progress ${i}</button><p id="status" data-v3-status-message role="log"></p>`,
      '',
      `document.getElementById('target').addEventListener('click', () => {
        document.getElementById('status').textContent = 'Progress log entry ${i}';
      });`,
    ));
  }
}

for (let i = 1; i <= 10; i++) {
  const mod = i % 4;
  if (mod === 0) {
    add('label-in-name', 'positive', `label-p${i}`, page(
      `Label positive ${i}`,
      `<button id="target" aria-label="Submit order ${i}">Pay now ${i}</button>`,
    ));
  } else if (mod === 1) {
    add('label-in-name', 'positive', `label-p${i}`, page(
      `Label positive ${i}`,
      `<a id="target" href="#checkout" aria-label="Continue checkout ${i}">Review cart ${i}</a>`,
    ));
  } else if (mod === 2) {
    add('label-in-name', 'positive', `label-p${i}`, page(
      `Label positive ${i}`,
      `<button id="target" aria-label="Delete item ${i}">Remove ${i}</button>`,
    ));
  } else {
    add('label-in-name', 'positive', `label-p${i}`, page(
      `Label positive ${i}`,
      `<span id="name${i}">Archive message ${i}</span><button id="target" aria-labelledby="name${i}">Save message ${i}</button>`,
    ));
  }

  const neg = i % 5;
  if (neg === 0) {
    add('label-in-name', 'negative', `label-n${i}`, page(
      `Label negative ${i}`,
      `<button id="target" aria-label="Pay now ${i}, submit order">Pay now ${i}</button>`,
    ));
  } else if (neg === 1) {
    add('label-in-name', 'negative', `label-n${i}`, page(
      `Label negative ${i}`,
      `<button id="target">Pay now ${i}</button>`,
    ));
  } else if (neg === 2) {
    add('label-in-name', 'negative', `label-n${i}`, page(
      `Label negative ${i}`,
      `<span id="name${i}">Review cart ${i}, continue checkout</span><a id="target" href="#checkout" aria-labelledby="name${i}">Review cart ${i}</a>`,
    ));
  } else if (neg === 3) {
    add('label-in-name', 'negative', `label-n${i}`, page(
      `Label negative ${i}`,
      `<input id="target" type="submit" value="Search catalog ${i}" aria-label="Search catalog ${i} submit">`,
    ));
  } else {
    add('label-in-name', 'negative', `label-n${i}`, page(
      `Label negative ${i}`,
      `<button id="target" aria-label="Remove ${i} from cart">Remove ${i}</button>`,
    ));
  }
}

for (let i = 1; i <= 10; i++) {
  add('target-size-minimum', 'positive', `targetsize-p${i}`, page(
    `Target size positive ${i}`,
    `<div class="cluster"><button id="target" aria-label="Tiny target ${i}"></button><button id="neighbor" aria-label="Adjacent target ${i}"></button></div>`,
    `.cluster{display:flex;gap:2px;align-items:center}
     #target,#neighbor{box-sizing:border-box;width:18px;height:18px;padding:0;border:1px solid #333;background:#eee}`,
  ));
  const neg = i % 6;
  if (neg === 0) {
    add('target-size-minimum', 'negative', `targetsize-n${i}`, page(
      `Target size negative ${i}`,
      `<button id="target" aria-label="Large target ${i}"></button><button id="neighbor" aria-label="Other target ${i}"></button>`,
      `#target{box-sizing:border-box;width:32px;height:32px;padding:0;border:1px solid #333;background:#eee}
       #neighbor{margin-left:4px;width:32px;height:32px}`,
    ));
  } else if (neg === 1) {
    add('target-size-minimum', 'negative', `targetsize-n${i}`, page(
      `Target size negative ${i}`,
      `<button id="target" aria-label="Small spaced target ${i}"></button><button id="neighbor" aria-label="Far target ${i}"></button>`,
      `#target,#neighbor{box-sizing:border-box;width:18px;height:18px;padding:0;border:1px solid #333;background:#eee}
       #neighbor{margin-left:60px}`,
    ));
  } else if (neg === 2) {
    add('target-size-minimum', 'negative', `targetsize-n${i}`, page(
      `Target size negative ${i}`,
      `<p>This sentence includes a tiny <a id="target" data-v3-inline-target="true" data-v3-in-sentence="true" data-v3-inline-exception="true" href="#">go</a><a id="neighbor" href="#">to</a> phrase inside prose.</p>`,
      `#target,#neighbor{font-size:12px;line-height:14px}`,
    ));
  } else if (neg === 3) {
    add('target-size-minimum', 'negative', `targetsize-n${i}`, page(
      `Target size negative ${i}`,
      `<button id="target" data-v3-essential-target="true" aria-label="Essential tiny target ${i}"></button><button id="neighbor" aria-label="Adjacent target ${i}"></button>`,
      `#target,#neighbor{box-sizing:border-box;width:18px;height:18px;padding:0;border:1px solid #333;background:#eee}`,
    ));
  } else if (neg === 4) {
    add('target-size-minimum', 'negative', `targetsize-n${i}`, page(
      `Target size negative ${i}`,
      `<button id="target" data-v3-equivalent-target="true" aria-label="Tiny target ${i}"></button><button id="neighbor" aria-label="Adjacent target ${i}"></button><button id="equiv">Equivalent large target ${i}</button>`,
      `#target,#neighbor{box-sizing:border-box;width:18px;height:18px;padding:0;border:1px solid #333;background:#eee}
       #equiv{margin-left:20px;min-width:120px;min-height:32px}`,
    ));
  } else {
    add('target-size-minimum', 'negative', `targetsize-n${i}`, page(
      `Target size negative ${i}`,
      `<input id="target" data-v3-ua-control="true" type="checkbox"><input id="neighbor" type="checkbox" aria-label="Adjacent checkbox ${i}">`,
      `#target,#neighbor{margin:0}`,
    ));
  }
}

function dragScript(i, opts = {}) {
  const clickWorks = opts.clickWorks ? 'true' : 'false';
  const altWorks = opts.altWorks ? 'true' : 'false';
  return `
    const target = document.getElementById('target');
    const statusEl = document.getElementById('status');
    let down = false;
    let startX = 0;
    function complete(kind) {
      if (kind === 'drag') {
        window.dragCompleted = true;
        document.body.setAttribute('data-drag-completed', 'true');
      } else if (kind === 'click') {
        window.clickCompleted = true;
        document.body.setAttribute('data-click-completed', 'true');
      } else if (kind === 'alternative') {
        window.alternativeCompleted = true;
        document.body.setAttribute('data-alternative-completed', 'true');
      }
      target.setAttribute('data-state', 'moved');
      statusEl.textContent = kind + ' completed ${i}';
    }
    function start(e) { down = true; startX = e.clientX; }
    function move(e) {
      if (down && Math.abs(e.clientX - startX) > 40) complete('drag');
    }
    function end() { down = false; }
    target.addEventListener('pointerdown', start);
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', end);
    target.addEventListener('mousedown', start);
    target.addEventListener('mousemove', move);
    target.addEventListener('mouseup', end);
    if (${clickWorks}) target.addEventListener('click', () => complete('click'));
    const alt = document.getElementById('alternative');
    if (alt && ${altWorks}) alt.addEventListener('click', () => complete('alternative'));
  `;
}

for (let i = 1; i <= 10; i++) {
  add('dragging-movement', 'positive', `drag-p${i}`, page(
    `Drag positive ${i}`,
    `<div id="target" data-v3-drag-target tabindex="0" aria-label="Drag card ${i}">Drag card ${i}</div><p id="status">Waiting</p>`,
    `#target{width:140px;height:54px;border:2px solid #333;background:#eef;display:flex;align-items:center;justify-content:center;user-select:none;touch-action:none}`,
    dragScript(i),
  ));
  const neg = i % 4;
  if (neg === 0) {
    add('dragging-movement', 'negative', `drag-n${i}`, page(
      `Drag negative ${i}`,
      `<button id="target" data-v3-drag-target aria-label="Click card ${i}">Click card ${i}</button><p id="status">Waiting</p>`,
      `#target{width:140px;height:54px;border:2px solid #333;background:#efe;user-select:none}`,
      dragScript(i, { clickWorks: true }),
    ));
  } else if (neg === 1) {
    add('dragging-movement', 'negative', `drag-n${i}`, page(
      `Drag negative ${i}`,
      `<div id="target" data-v3-drag-target tabindex="0" aria-label="Drag card ${i}">Drag card ${i}</div><button id="alternative" data-v3-drag-alternative data-v3-drag-alternative-for="target">Move card ${i}</button><p id="status">Waiting</p>`,
      `#target{width:140px;height:54px;border:2px solid #333;background:#efe;display:flex;align-items:center;justify-content:center;user-select:none;touch-action:none}#alternative{margin-left:12px;min-height:32px}`,
      dragScript(i, { altWorks: true }),
    ));
  } else if (neg === 2) {
    add('dragging-movement', 'negative', `drag-n${i}`, page(
      `Drag negative ${i}`,
      `<div id="target" data-v3-drag-target data-v3-essential-drag="true" tabindex="0" aria-label="Freehand drawing canvas ${i}">Freehand drawing ${i}</div><p id="status">Waiting</p>`,
      `#target{width:180px;height:64px;border:2px solid #333;background:#efe;display:flex;align-items:center;justify-content:center;user-select:none;touch-action:none}`,
      dragScript(i),
    ));
  } else {
    add('dragging-movement', 'negative', `drag-n${i}`, page(
      `Drag negative ${i}`,
      `<div id="target" data-v3-drag-target data-v3-ua-drag="true" tabindex="0" aria-label="User-agent provided drag ${i}">UA drag ${i}</div><p id="status">Waiting</p>`,
      `#target{width:150px;height:54px;border:2px solid #333;background:#efe;display:flex;align-items:center;justify-content:center;user-select:none;touch-action:none}`,
      dragScript(i),
    ));
  }
}

for (let i = 1; i <= 10; i++) {
  const pos = (i - 1) % 10;
  if (pos === 0) {
    add('reveal-state-discovery', 'positive', `reveal-p${i}`, page(
      `Reveal positive ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="false" aria-controls="panel">Show shipping details ${i}</button><section id="panel" hidden><h2>Shipping details ${i}</h2><a href="#track">Track package ${i}</a></section>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { target.setAttribute('aria-expanded','true'); panel.hidden = false; });`,
    ));
  } else if (pos === 1) {
    add('reveal-state-discovery', 'positive', `reveal-p${i}`, page(
      `Reveal positive ${i}`,
      `<details id="details"><summary id="target">More billing help ${i}</summary><h2>Billing help ${i}</h2><button>Contact billing ${i}</button></details>`,
    ));
  } else if (pos === 2) {
    add('reveal-state-discovery', 'positive', `reveal-p${i}`, page(
      `Reveal positive ${i}`,
      `<div role="tablist"><button id="target" role="tab" aria-selected="false" aria-controls="panel">Security tab ${i}</button></div><section id="panel" role="tabpanel" hidden><h2>Security settings ${i}</h2><input aria-label="Recovery code ${i}"></section>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { target.setAttribute('aria-selected','true'); panel.hidden = false; });`,
    ));
  } else if (pos === 3) {
    add('reveal-state-discovery', 'positive', `reveal-p${i}`, page(
      `Reveal positive ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="false" aria-controls="menu">Open account menu ${i}</button><nav id="menu" hidden><ul><li><a href="#profile">Profile ${i}</a></li><li><a href="#signout">Sign out ${i}</a></li></ul></nav>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { target.setAttribute('aria-expanded','true'); menu.hidden = false; });`,
    ));
  } else if (pos === 4) {
    add('reveal-state-discovery', 'positive', `reveal-p${i}`, page(
      `Reveal positive ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="false" aria-controls="dialog">Open modal contents ${i}</button><div id="dialog" role="dialog" hidden><h2>Confirm transfer ${i}</h2><button>Approve transfer ${i}</button></div>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { target.setAttribute('aria-expanded','true'); dialog.hidden = false; dialog.querySelector('button').focus(); });`,
    ));
  } else if (pos === 5) {
    add('reveal-state-discovery', 'positive', `reveal-p${i}`, page(
      `Reveal positive ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="false" aria-controls="faq">Show FAQ answer ${i}</button><article id="faq" hidden><h3>Refund timing ${i}</h3><p>Refunds usually arrive within five business days ${i}.</p></article>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { target.setAttribute('aria-expanded','true'); faq.hidden = false; });`,
    ));
  } else if (pos === 6) {
    add('reveal-state-discovery', 'positive', `reveal-p${i}`, page(
      `Reveal positive ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="false" aria-controls="filters">Show filters ${i}</button><form id="filters" hidden><label>Maximum price ${i}<input type="number"></label><button>Apply filters ${i}</button></form>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { target.setAttribute('aria-expanded','true'); filters.hidden = false; });`,
    ));
  } else if (pos === 7) {
    add('reveal-state-discovery', 'positive', `reveal-p${i}`, page(
      `Reveal positive ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="false" aria-controls="tree">Open folder ${i}</button><ul id="tree" role="tree" hidden><li role="treeitem" tabindex="0">Quarterly report ${i}</li></ul>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { target.setAttribute('aria-expanded','true'); tree.hidden = false; });`,
    ));
  } else if (pos === 8) {
    add('reveal-state-discovery', 'positive', `reveal-p${i}`, page(
      `Reveal positive ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="false" aria-controls="carousel">Next slide ${i}</button><section id="carousel" hidden><h2>Slide two ${i}</h2><button>Pause carousel ${i}</button></section>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { target.setAttribute('aria-expanded','true'); carousel.hidden = false; });`,
    ));
  } else {
    add('reveal-state-discovery', 'positive', `reveal-p${i}`, page(
      `Reveal positive ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="false" aria-controls="errors">Show form errors ${i}</button><div id="errors" hidden><h2>Form errors ${i}</h2><a href="#email">Fix email ${i}</a></div>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { target.setAttribute('aria-expanded','true'); errors.hidden = false; });`,
    ));
  }

  const neg = (i - 1) % 10;
  if (neg === 0) {
    add('reveal-state-discovery', 'negative', `reveal-n${i}`, page(
      `Reveal negative ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="true" aria-controls="panel">Hide visible details ${i}</button><section id="panel"><h2>Already visible details ${i}</h2><a href="#track">Track package ${i}</a></section>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { target.setAttribute('aria-expanded','false'); panel.hidden = true; });`,
    ));
  } else if (neg === 1) {
    add('reveal-state-discovery', 'negative', `reveal-n${i}`, page(
      `Reveal negative ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="false" aria-controls="panel" disabled>Disabled details ${i}</button><section id="panel" hidden><h2>Disabled content ${i}</h2></section>`,
    ));
  } else if (neg === 2) {
    add('reveal-state-discovery', 'negative', `reveal-n${i}`, page(
      `Reveal negative ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="false">No controlled panel ${i}</button>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { target.setAttribute('aria-expanded','true'); });`,
    ));
  } else if (neg === 3) {
    add('reveal-state-discovery', 'negative', `reveal-n${i}`, page(
      `Reveal negative ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="false" aria-controls="panel">Decorative reveal ${i}</button><span id="panel" hidden aria-hidden="true">*</span>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { target.setAttribute('aria-expanded','true'); panel.hidden = false; });`,
    ));
  } else if (neg === 4) {
    add('reveal-state-discovery', 'negative', `reveal-n${i}`, page(
      `Reveal negative ${i}`,
      `<details id="details" open><summary id="target">Already open details ${i}</summary><h2>Visible help ${i}</h2><button>Visible control ${i}</button></details>`,
    ));
  } else if (neg === 5) {
    add('reveal-state-discovery', 'negative', `reveal-n${i}`, page(
      `Reveal negative ${i}`,
      `<div role="tablist"><button id="target" role="tab" aria-selected="true" aria-controls="panel">Selected tab ${i}</button></div><section id="panel" role="tabpanel"><h2>Current tab ${i}</h2><button>Current action ${i}</button></section>`,
    ));
  } else if (neg === 6) {
    add('reveal-state-discovery', 'negative', `reveal-n${i}`, page(
      `Reveal negative ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="false" aria-controls="panel">Broken reveal ${i}</button><section id="panel" hidden><h2>Never revealed ${i}</h2></section>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { target.setAttribute('aria-expanded','false'); });`,
    ));
  } else if (neg === 7) {
    add('reveal-state-discovery', 'negative', `reveal-n${i}`, page(
      `Reveal negative ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="false" aria-controls="panel">Color only marker ${i}</button><span id="panel" hidden style="display:inline-block;width:4px;height:4px;background:#ccc"></span>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { target.setAttribute('aria-expanded','true'); panel.hidden = false; });`,
    ));
  } else if (neg === 8) {
    add('reveal-state-discovery', 'negative', `reveal-n${i}`, page(
      `Reveal negative ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="false" aria-controls="panel">Class-only state ${i}</button><section id="panel" hidden><h2>Still hidden ${i}</h2></section>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { document.body.classList.add('opened-${i}'); });`,
    ));
  } else {
    add('reveal-state-discovery', 'negative', `reveal-n${i}`, page(
      `Reveal negative ${i}`,
      `<button id="target" data-v3-reveal-trigger aria-expanded="false" aria-controls="panel">Whitespace reveal ${i}</button><span id="panel" hidden> </span>`,
      '',
      `document.getElementById('target').addEventListener('click', () => { target.setAttribute('aria-expanded','true'); panel.hidden = false; });`,
    ));
  }
}

for (let i = 1; i <= 10; i++) {
  const pos = (i - 1) % 10;
  if (pos <= 2) {
    add('visual-structure-discovery', 'positive', `vstruct-p${i}`, page(
      `Visual structure positive ${i}`,
      `<div id="target" class="fake-heading">Account Security ${i}</div><p>Change your password and recovery options.</p>`,
      `.fake-heading{font-size:${24 + pos}px;font-weight:700;margin:1em 0 .4em}`,
    ));
  } else if (pos <= 5) {
    add('visual-structure-discovery', 'positive', `vstruct-p${i}`, page(
      `Visual structure positive ${i}`,
      `<div id="target" class="fake-list"><div>• Passport ${i}</div><div>• Driver license ${i}</div><div>• Utility bill ${i}</div></div>`,
      `.fake-list{margin:1em 0}.fake-list>div{margin:.3em 0}`,
    ));
  } else {
    add('visual-structure-discovery', 'positive', `vstruct-p${i}`, page(
      `Visual structure positive ${i}`,
      `<div id="target" class="fake-table" data-v3-visual-table="true"><div>Plan</div><div>Cost</div><div>Basic</div><div>$10</div><div>Pro</div><div>$20</div></div>`,
      `.fake-table{display:grid;grid-template-columns:repeat(2, minmax(80px, 120px));gap:1px;margin:1em 0}.fake-table>div{border:1px solid #777;padding:6px}`,
    ));
  }

  const neg = (i - 1) % 10;
  if (neg <= 2) {
    add('visual-structure-discovery', 'negative', `vstruct-n${i}`, page(
      `Visual structure negative ${i}`,
      `<h2 id="target">Account Security ${i}</h2><p>Change your password and recovery options.</p>`,
      `h2{font-size:${24 + neg}px;font-weight:700}`,
    ));
  } else if (neg <= 5) {
    add('visual-structure-discovery', 'negative', `vstruct-n${i}`, page(
      `Visual structure negative ${i}`,
      `<ul id="target"><li>Passport ${i}</li><li>Driver license ${i}</li><li>Utility bill ${i}</li></ul>`,
    ));
  } else if (neg <= 8) {
    add('visual-structure-discovery', 'negative', `vstruct-n${i}`, page(
      `Visual structure negative ${i}`,
      `<table id="target"><tr><th>Plan</th><th>Cost</th></tr><tr><td>Basic</td><td>$10</td></tr><tr><td>Pro</td><td>$20</td></tr></table>`,
      `table{border-collapse:collapse}td,th{border:1px solid #777;padding:6px}`,
    ));
  } else {
    add('visual-structure-discovery', 'negative', `vstruct-n${i}`, page(
      `Visual structure negative ${i}`,
      `<button id="target" style="font-size:24px;font-weight:700">Open account settings ${i}</button><p>The large text is an interactive control label, not a section heading.</p>`,
    ));
  }
}

for (let i = 1; i <= 10; i++) {
  const pos = (i - 1) % 10;
  if (pos <= 2) {
    add('visual-content-discovery', 'positive', `vcontent-p${i}`, page(
      `Visual content positive ${i}`,
      `<div id="target" data-v3-visual-content="background-image-text" data-v3-bg-image-text="true" class="bg-text" aria-label=""></div>`,
      `.bg-text{width:180px;height:70px;border:1px solid #555;background:linear-gradient(135deg,#ffd,#fc9);color:transparent;position:relative}.bg-text::before{content:'SALE ${i}';position:absolute;left:24px;top:20px;color:#111;font:bold 24px Arial}`,
    ));
  } else if (pos <= 4) {
    add('visual-content-discovery', 'positive', `vcontent-p${i}`, page(
      `Visual content positive ${i}`,
      `<canvas id="target" width="220" height="120" data-v3-visual-content="canvas-chart"></canvas>`,
      '',
      `const c=document.getElementById('target');const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,220,120);x.fillStyle='#c00';x.fillRect(30,70,40,30);x.fillStyle='#0a0';x.fillRect(90,40,40,60);x.fillStyle='#00c';x.fillRect(150,20,40,80);x.fillStyle='#111';x.fillText('Q1',40,110);x.fillText('Q2',100,110);x.fillText('Q3',160,110);`,
    ));
  } else if (pos <= 6) {
    add('visual-content-discovery', 'positive', `vcontent-p${i}`, page(
      `Visual content positive ${i}`,
      `<svg id="target" width="220" height="100" data-v3-visual-content="svg-chart" viewBox="0 0 220 100"><rect x="20" y="50" width="40" height="30" fill="#b00"/><rect x="80" y="30" width="40" height="50" fill="#070"/><rect x="140" y="10" width="40" height="70" fill="#00b"/><text x="20" y="95">Revenue ${i}</text></svg>`,
    ));
  } else {
    add('visual-content-discovery', 'positive', `vcontent-p${i}`, page(
      `Visual content positive ${i}`,
      `<div id="target" data-v3-visual-content="color-only-information" data-v3-color-only="true"><span style="display:inline-block;width:18px;height:18px;background:#d00"></span> Invoice ${i}</div>`,
    ));
  }

  const neg = (i - 1) % 10;
  if (neg <= 1) {
    add('visual-content-discovery', 'negative', `vcontent-n${i}`, page(
      `Visual content negative ${i}`,
      `<div id="target" data-v3-visual-content="background-image-text" data-v3-bg-image-text="true" data-v3-visual-alternative="Sale ${i}" data-v3-visual-alternative-adequate="true" class="bg-text">Sale ${i}</div>`,
      `.bg-text{width:180px;height:70px;border:1px solid #555;background:linear-gradient(135deg,#ffd,#fc9);font:bold 24px Arial;color:#111;display:flex;align-items:center;justify-content:center}`,
    ));
  } else if (neg <= 3) {
    add('visual-content-discovery', 'negative', `vcontent-n${i}`, page(
      `Visual content negative ${i}`,
      `<canvas id="target" width="220" height="120" data-v3-visual-content="canvas-chart" aria-label="Bar chart: Q1 30, Q2 60, Q3 80" data-v3-visual-alternative-adequate="true"></canvas>`,
      '',
      `const c=document.getElementById('target');const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,220,120);x.fillStyle='#c00';x.fillRect(30,70,40,30);x.fillStyle='#0a0';x.fillRect(90,40,40,60);x.fillStyle='#00c';x.fillRect(150,20,40,80);`,
    ));
  } else if (neg <= 5) {
    add('visual-content-discovery', 'negative', `vcontent-n${i}`, page(
      `Visual content negative ${i}`,
      `<svg id="target" width="220" height="100" data-v3-visual-content="svg-chart" data-v3-visual-alternative-adequate="true" role="img" aria-label="Revenue chart with Q3 highest" viewBox="0 0 220 100"><rect x="20" y="50" width="40" height="30" fill="#b00"/><rect x="80" y="30" width="40" height="50" fill="#070"/><rect x="140" y="10" width="40" height="70" fill="#00b"/><title>Revenue chart with Q3 highest</title></svg>`,
    ));
  } else if (neg <= 7) {
    add('visual-content-discovery', 'negative', `vcontent-n${i}`, page(
      `Visual content negative ${i}`,
      `<div id="target" data-v3-visual-content="color-only-information" data-v3-color-only="true" data-v3-has-noncolor-cue="true"><span style="display:inline-block;width:18px;height:18px;background:#d00"></span> Invoice ${i} <strong>Overdue</strong></div>`,
    ));
  } else {
    add('visual-content-discovery', 'negative', `vcontent-n${i}`, page(
      `Visual content negative ${i}`,
      `<div id="target" data-v3-visual-content="decorative-background" data-v3-decorative="true" aria-hidden="true" style="width:180px;height:70px;background:linear-gradient(135deg,#ffd,#fc9)"></div><p>Decorative background ${i}</p>`,
    ));
  }
}

fs.mkdirSync(OUT, { recursive: true });
const manifest = { generatedAt: new Date().toISOString(), cases: [] };
for (const c of cases) {
  const dir = path.join(OUT, c.aspect, c.expected);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${c.id}.html`);
  fs.writeFileSync(file, c.html);
  manifest.cases.push({ id: c.id, aspect: c.aspect, expected: c.expected, file: path.relative(ROOT, file) });
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(path.join(OUT, 'manifest.json'));
