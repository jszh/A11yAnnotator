'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../../..');
const OUT = path.join(ROOT, 'scripts/v3/tests/generated/broad-scope/adaptation');

function page(title, body, style = '') {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body { font: 16px Arial, sans-serif; margin: 24px; }
    .flex { max-width: 720px; white-space: normal; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes blink { from { opacity: .2; } to { opacity: 1; } }
    ${style}
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    ${body}
  </main>
</body>
</html>`;
}

const cases = [];
const add = (aspect, expected, id, html) => cases.push({ aspect, expected, id, html });

for (let i = 1; i <= 10; i++) {
  add('text-spacing', 'positive', `ts-p${i}`, page(`TS positive ${i}`,
    `<div id="target" class="target">Spacing sensitive</div>`,
    `#target{font:16px Arial;width:${136 + (i % 4)}px;height:24px;overflow:hidden;white-space:nowrap;border:1px solid #555}`));
  add('text-spacing', 'negative', `ts-n${i}`, page(`TS negative ${i}`,
    i === 7
      ? `<div id="target" class="target">Already clipped before spacing ${i} with a very very very long label</div>`
      : `<div id="target" class="flex">Flexible readable text ${i} wraps and remains available when spacing changes.</div>`,
    i === 7
      ? `#target{font:16px Arial;width:80px;height:20px;overflow:hidden;white-space:nowrap}`
      : `#target{font:16px Arial;width:420px;min-height:24px;white-space:normal}`));
}

for (let i = 1; i <= 10; i++) {
  add('forced-colors', 'positive', `fc-p${i}`, page(`FC positive ${i}`,
    `<button id="target">Forced color opt out ${i}</button>`,
    `#target{color:#111;background:#fff;border:2px solid #111;padding:8px}
     @media (forced-colors: active){#target{forced-color-adjust:none;color:#777;background:#777;border-color:#777}}`));
  add('forced-colors', 'negative', `fc-n${i}`, page(`FC negative ${i}`,
    `<button id="target">System color friendly ${i}</button>`,
    `#target{color:ButtonText;background:ButtonFace;border:2px solid ButtonText;padding:8px}`));
}

for (let i = 1; i <= 10; i++) {
  add('forced-colors-nontext', 'positive', `fcn-p${i}`, page(`FC nontext positive ${i}`,
    `<button id="target" aria-label="Open menu ${i}"></button>`,
    `#target{width:48px;height:36px;background:#fff;border:3px solid #111;border-radius:6px;position:relative}
     #target::before{content:"";position:absolute;left:12px;right:12px;top:10px;border-top:3px solid #111;box-shadow:0 7px 0 #111,0 14px 0 #111}
     @media (forced-colors: active){#target{forced-color-adjust:none;background:#777;border-color:#777}
       #target::before{border-color:#777;box-shadow:0 7px 0 #777,0 14px 0 #777}}`));
  add('forced-colors-nontext', 'negative', `fcn-n${i}`, page(`FC nontext negative ${i}`,
    `<button id="target" aria-label="Open menu ${i}"></button>`,
    `#target{width:48px;height:36px;background:ButtonFace;border:3px solid ButtonText;border-radius:6px;position:relative}
     #target::before{content:"";position:absolute;left:12px;right:12px;top:10px;border-top:3px solid ButtonText;box-shadow:0 7px 0 ButtonText,0 14px 0 ButtonText}`));
}

for (let i = 1; i <= 10; i++) {
  add('reduced-motion', 'positive', `rm-p${i}`, page(`RM positive ${i}`,
    `<p>Article content remains readable while this non-essential animation plays beside it.</p><div id="target" data-v3-parallel-non-essential="true">Persistent moving content ${i}</div>`,
    `#target{display:inline-block;animation:${i % 2 ? 'spin' : 'blink'} 10s linear infinite}`));
  let body = `<div id="target">Motion stops under reduced motion ${i}</div>`;
  let style = `#target{display:inline-block;animation:spin 10s linear infinite}@media (prefers-reduced-motion: reduce){#target{animation:none!important}}`;
  if (i >= 5 && i <= 7) {
    body = `<p>Article content remains readable while this ticker can be paused.</p>
      <div id="target" data-v3-parallel-non-essential="true">Pausable persistent motion ${i}</div>
      <button id="pauseMotion" onclick="document.getElementById('target').style.animationPlayState='paused'">Pause animation</button>`;
    style = `#target{display:inline-block;animation:${i % 2 ? 'spin' : 'blink'} 10s linear infinite}`;
  } else if (i >= 8) {
    body = `<p>The following animation is the only progress indication for a required security check.</p>
      <div id="target" data-v3-essential-motion="true" role="status">Essential security progress animation ${i}</div>`;
    style = `#target{display:inline-block;animation:spin 10s linear infinite}`;
  }
  add('reduced-motion', 'negative', `rm-n${i}`, page(`RM negative ${i}`, body, style));
}

for (let i = 1; i <= 10; i++) {
  add('resize-text', 'positive', `zr-p${i}`, page(`ZR positive ${i}`,
    `<div id="target">Resize sensitive button label ${i}</div>`,
    `#target{font-size:1rem;line-height:1.2;width:${245 + i}px;height:24px;overflow:hidden;white-space:nowrap;border:1px solid #555}`));
  add('resize-text', 'negative', `zr-n${i}`, page(`ZR negative ${i}`,
    `<div id="target">Flexible resize text ${i} can wrap and remain visible when root font size grows.</div>`,
    `#target{font-size:1rem;line-height:1.35;max-width:720px;min-height:28px;white-space:normal}`));
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
