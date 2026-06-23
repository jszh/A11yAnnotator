#!/usr/bin/env node
'use strict';
// Build docs/reference/coverage-explorer.html — an examinable, INTEGRATED view of WCAG SC coverage.
// One row per SC (pathways + ACT-rule pills + EN + TT + a status badge); click the row to expand ONE unified
// detail panel that folds together: harness FP/FN errors (full pipeline, from results/exp19), requirement
// aspects covered by NO component (completeness), and the act-augmented WIP test corpus (aspects ACT rules can't
// reach + their human-judgment pages). ACT pills are full-pipeline accuracy bars; opening a rule shows a
// TP/FP/TN/FN breakdown; a no-data rule shows whether act-augmented WIP tests address its blind spots.
// Regenerate: node scripts/build-coverage-explorer.js   ·   Narrative: docs/reference/COVERAGE-AND-GAPS.md

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const R = (p) => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch (e) { return ''; } };
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function md(src) {
  const lines = String(src || '').split('\n'); const out = []; let inList = false, inCode = false;
  const inline = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  for (const raw of lines) {
    if (/^```/.test(raw)) { if (inCode) { out.push('</pre>'); inCode = false; } else { if (inList) { out.push('</ul>'); inList = false; } out.push('<pre class="code">'); inCode = true; } continue; }
    if (inCode) { out.push(esc(raw)); continue; }
    const h = raw.match(/^(#{1,6})\s+(.*)$/); if (h) { if (inList) { out.push('</ul>'); inList = false; } const lv = Math.min(6, h[1].length + 2); out.push(`<h${lv}>${inline(h[2])}</h${lv}>`); continue; }
    const li = raw.match(/^\s*[-*]\s+(.*)$/); if (li) { if (!inList) { out.push('<ul>'); inList = true; } out.push(`<li>${inline(li[1])}</li>`); continue; }
    if (inList) { out.push('</ul>'); inList = false; }
    if (raw.trim() === '') { out.push(''); continue; }
    out.push(`<p>${inline(raw)}</p>`);
  }
  if (inList) out.push('</ul>'); if (inCode) out.push('</pre>'); return out.join('\n');
}
function expectationOf(content) { const m = String(content || '').match(/#+\s*Expectation[s]?\s*\n([\s\S]*?)(?:\n#+\s|\n## |$)/i); return m ? m[1].trim().replace(/\s+/g, ' ') : ''; }

// ---- sources ----
const actManifest = (() => { try { return JSON.parse(R('act-rules/act-rules-manifest.json')); } catch (e) { return { rules: [], not_fully_automatable: [] }; } })();
const actNotAuto = new Set(actManifest.not_fully_automatable || []);
const actById = {}; for (const r of (actManifest.rules || [])) actById[r.id] = r;
const allRuleIds = (actManifest.rules || []).map((r) => r.id);
const actContent = {}; for (const r of (actManifest.rules || [])) actContent[r.id] = R(`act-rules/extracted/${r.id}.md`);
const actBySc = {}; for (const r of (actManifest.rules || [])) for (const sc of (r.in_scope_requirements || [])) (actBySc[sc] = actBySc[sc] || []).push(r.id);

const ttFiles = (() => { try { return fs.readdirSync(path.join(ROOT, 'refs/trusted-tester')).filter((f) => /^sc-/.test(f)); } catch (e) { return []; } })();
const ttBySc = {}; for (const f of ttFiles) { const m = f.match(/^sc-(\d+\.\d+\.\d+)-/); if (m) ttBySc[m[1]] = f; }
const enRaw = R('docs/reference/standards/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md');
const enBySc = {}; { const parts = enRaw.split(/\n(?=### )/); for (const p of parts) { const m = p.match(/^###\s+C\.9\.\d+\.\d+\.\d+\s+—\s+SC\s+(\d+\.\d+\.\d+)/m); if (m) enBySc[m[1]] = p; } }

// ---- per-rule FULL-PIPELINE performance (deterministic + axe + LLM) from the canonical deployed eval run ----
const RUN_CANDIDATES = ['results/exp19-effort-high/results.json', 'results/run10-deployed-current/results.json', 'results/exp17-full-html-facetgate/results.json'];
const perRule = {}; let RUNSRC = null, RUN_N = 0;
for (const cand of RUN_CANDIDATES) {
  let cases = []; try { const r = JSON.parse(R(cand)); cases = Array.isArray(r) ? r : (r.cases || r.results || Object.values(r).find(Array.isArray) || []); } catch (e) {}
  if (cases.length && cases[0].ruleId && ('correct' in cases[0])) {
    RUNSRC = cand; RUN_N = cases.length;
    for (const x of cases) {
      const v = (perRule[x.ruleId] = perRule[x.ruleId] || { tp: 0, fp: 0, tn: 0, fn: 0, n: 0, llmFilled: 0, errCases: [] });
      v.n++; if (x.inScopeBarrierFilled) v.llmFilled++;
      const failed = x.expected === 'failed';
      if (x.falsePositive) { v.fp++; v.errCases.push({ id: (x.testcaseId || '').slice(0, 10), kind: 'FP', via: x.llmFlag ? 'LLM over-flag' : 'over-flag' }); }
      else if (failed && x.correct) v.tp++;
      else if (failed && !x.correct) { v.fn++; v.errCases.push({ id: (x.testcaseId || '').slice(0, 10), kind: 'FN', via: 'missed barrier' }); }
      else v.tn++;
    }
    break;
  }
}
const ruleStats = (id) => perRule[id] || null;
const ruleErr = (id) => { const v = perRule[id]; return v ? v.fp + v.fn : 0; };

// ---- ACT-AUGMENTED corpus (the human-judgment WIP tests for aspects ACT rules can't reach) ----
const ACTAUG = {}; let AA_PAGES = 0, AA_ASPECTS = 0;
try {
  const m = JSON.parse(R('eval/act-augmented/_annotator/manifest.json'));
  const scs = Array.isArray(m) ? m : (m.scs || Object.values(m).find(Array.isArray) || []);
  for (const s of scs) {
    const aspects = (s.aspects || []).map((a) => ({ slug: a.slug, title: a.title || a.slug, plain: a.plain || '', desc: a.description || '', why: a.whyUncovered || a.scLimb || '', priority: a.priority || 'medium', refs: a.references || [], tt: a.ttTests || [], pages: (a.pages || []).map((p) => ({ id: p.id || '', scenario: p.scenario || '' })), pageCount: (a.pages || []).length }));
    if (aspects.length) { ACTAUG[s.sc] = { aspects, totalPages: aspects.reduce((n, a) => n + a.pageCount, 0) }; AA_ASPECTS += aspects.length; AA_PAGES += ACTAUG[s.sc].totalPages; }
  }
} catch (e) {}
// cross-ref: which ACT rule a given act-augmented aspect references (so a no-data rule can point to its WIP tests)
const aspectsByRule = {};
for (const sc in ACTAUG) for (const a of ACTAUG[sc].aspects) { const prose = (a.desc || '') + ' ' + (a.why || ''); for (const id of allRuleIds) if (new RegExp('\\b' + id + '\\b').test(prose)) (aspectsByRule[id] = aspectsByRule[id] || []).push({ sc, slug: a.slug, title: a.title, pageCount: a.pageCount }); }

// ---- coverage model (pathways) + completeness (aspects no component covers) ----
const P = (label, kind, tools, items, clears) => ({ label, kind, tools, items, clears });
const MODEL = [
  { sc: '1.1.1', name: 'Non-text Content', scope: '22', pathways: [P('det', 'det', 'exp-runners', ['glyph-text-alt', 'long-desc-presence'], true), P('axe', 'axe', 'axe-core', ['image-alt', 'svg-img-alt', 'input-image-alt', 'object-alt', 'role-img-alt']), P('LLM', 'llm', 'llm-adjudicator', ['alt-text-adequacy-v0', 'long-description-completeness-v0', 'captcha-alternative-v0'])] },
  { sc: '1.3.1', name: 'Info & Relationships', scope: '22', pathways: [P('axe', 'axe', 'axe-core', ['wholesale 1.3.1', 'td-headers-attr', 'aria-required-children', 'aria-required-parent']), P('LLM', 'llm', 'collect-tables/lists', ['info-relationships-v0'])] },
  { sc: '1.3.2', name: 'Meaningful Sequence', scope: '22', pathways: [P('LLM', 'llm', 'vsr-analysis', ['sequence-meaning-v0'])] },
  { sc: '1.4.1', name: 'Use of Color', scope: '22', pathways: [P('LLM', 'llm', 'rubric', ['use-of-color-v0']), P('axe', 'axe', 'axe-core', ['link-in-text-block']), P('IBM', 'ibm', 'equal-access', ['triage prior'])] },
  { sc: '1.4.3', name: 'Contrast (Minimum)', scope: '22', pathways: [P('det', 'det', 'exp-runners', ['text-contrast-pixel'], true), P('LLM', 'llm', 'rubric', ['contrast-over-complex-backdrop-v0'])] },
  { sc: '1.4.5', name: 'Images of Text', scope: '22', pathways: [P('LLM', 'llm', 'rubric', ['images-of-text-v0'])] },
  { sc: '1.4.10', name: 'Reflow', scope: '22', pathways: [P('det (barrier-only)', 'det', 'exp-runners', ['reflow-overflow-probe'], false), P('LLM', 'llm', 'rubric', ['reflow-no-hscroll-v0'])] },
  { sc: '1.4.11', name: 'Non-text Contrast', scope: '22', pathways: [P('det', 'det', 'exp-runners', ['non-text-contrast'], true), P('LLM', 'llm', 'rubric', ['non-text-contrast-v0'])] },
  { sc: '1.4.13', name: 'Content on Hover/Focus', scope: '22', pathways: [P('det (barrier-only)', 'det', 'exp-runners', ['hover-content-tri'], false), P('LLM', 'llm', 'rubric', ['hover-content-v0'])] },
  { sc: '2.1.1', name: 'Keyboard', scope: '22', pathways: [P('det (narrow)', 'det', 'exp-runners', ['keyboard-activation'], true), P('axe', 'axe', 'axe-core', ['scrollable-region-focusable', 'frame-focusable-content'])] },
  { sc: '2.1.2', name: 'No Keyboard Trap', scope: '22', pathways: [P('det', 'det', 'exp-runners', ['keyboard-trap-escape', 'composite-arrow-trap'], true)] },
  { sc: '2.4.2', name: 'Page Titled', scope: '22', pathways: [P('axe', 'axe', 'axe-core', ['document-title']), P('LLM', 'llm', 'rubric', ['page-title-v0'])] },
  { sc: '2.4.3', name: 'Focus Order', scope: '22', pathways: [P('det (F44)', 'det', 'exp-runners', ['positive-tabindex'], true), P('LLM', 'llm', 'rubric', ['focus-order-meaning-v0']), P('axe', 'axe', 'axe-core', ['tabindex'])] },
  { sc: '2.4.4', name: 'Link Purpose (In Context)', scope: '22', pathways: [P('axe', 'axe', 'axe-core', ['link-name']), P('LLM', 'llm', 'rubric', ['link-purpose-v0'])] },
  { sc: '2.4.6', name: 'Headings & Labels', scope: '22', pathways: [P('LLM', 'llm', 'rubric', ['heading-descriptive-v0']), P('det (label presence)', 'det', 'exp-runners', ['field-label-probe'], true)] },
  { sc: '2.4.7', name: 'Focus Visible', scope: '22', pathways: [P('det', 'det', 'exp-runners', ['focus-visual-retry'], true), P('LLM', 'llm', 'rubric', ['focus-visible-clear-v0'])] },
  { sc: '3.3.1', name: 'Error Identification', scope: '22', pathways: [P('det (barrier-only)', 'det', 'exp-runners', ['form-error-probe'], false), P('LLM', 'llm', 'rubric', ['error-identification-v0'])] },
  { sc: '3.3.2', name: 'Labels or Instructions', scope: '22', pathways: [P('det', 'det', 'exp-runners', ['field-label-probe'], true), P('LLM', 'llm', 'rubric', ['field-label-v0'])] },
  { sc: '3.3.3', name: 'Error Suggestion', scope: '22', pathways: [P('LLM', 'llm', 'rubric', ['error-suggestion-v0'])] },
  { sc: '4.1.2', name: 'Name, Role, Value', scope: '22', pathways: [P('det', 'det', 'exp-runners', ['ax-state-diff', 'multipart-grouping'], true), P('axe', 'axe', 'axe-core', ['button-name', 'link-name', 'aria-required-attr', 'aria-valid-attr-value', 'nested-interactive']), P('LLM', 'llm', 'rubric', ['accessible-name-adequacy-v0'])] },
  { sc: '4.1.3', name: 'Status Messages', scope: '22', pathways: [P('LLM + CDP tools', 'llm', 'status-detector', ['status-message-v0'])] },
  { sc: '2.4.10', name: 'Section Headings (AAA)', scope: 'AAA', pathways: [P('LLM (non-authoritative)', 'llm', 'rubric', ['section-headings-v0'])] },
];
const Miss = (text, cite, hi) => ({ text, cite, hi });
const MISSING = {
  '1.1.1': [Miss('Image-map <area> alternative text — no deterministic check, no axe rule, and no rubric covers <area>/usemap alternatives.', 'H24 / F65', '<area> alt text in an image map')],
  '1.3.1': [Miss('Semantic emphasis — text emphasised only with styled <b>/<i>/CSS instead of <strong>/<em> conveys no programmatic relationship; no component checks this.', 'F87', 'emphasis conveyed by styling, not <strong>/<em>')],
  '1.3.2': [Miss('sequence-meaning-v0 fires only when vsr-analysis detects a reading-order divergence signal; a reorder that does not trip that gate is never checked.', 'coverage gated', 'reading order with no VSR-divergence signal is unchecked')],
  '1.4.1': [Miss('use-of-color-v0 covers link/field colour cues, but no dedicated check that a form-control STATE (error/required/disabled) is not conveyed by colour alone.', 'no dedicated rule', 'form-control state conveyed by colour alone')],
  '2.4.3': [Miss('tabindex="-1" misuse — removing an element that should be a focus stop from the tab order. F44 covers the opposite case; nothing covers this one.', 'beyond F44', 'tabindex="-1" removing an expected focus stop')],
  '2.4.6': [Miss('Form-LABEL descriptiveness — heading-descriptive-v0 judges HEADINGS; field-label-probe judges label PRESENCE; neither judges whether a form label is adequately DESCRIPTIVE.', 'beyond heading-descriptive', 'whether a form label (not heading) is descriptive')],
};

// ---- render ----
const detailPanes = [];
const addPane = (key, title, html) => { detailPanes.push(`<div class="pane" id="pane-${key}">${title ? `<h3>${esc(title)}</h3>` : ''}${html}</div>`); };
const enClauseNum = (sc) => 'C.9.' + sc;
const sluggish = (name) => name.toLowerCase().replace(/[()/]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function confusionTable(v) {
  if (!v) return '';
  const correct = v.tp + v.tn, err = v.fp + v.fn;
  return `<div class="confusion"><table class="cm"><thead><tr><th></th><th>flags barrier</th><th>clears</th></tr></thead><tbody>
    <tr><th>ACT: failed</th><td class="${v.tp ? 'good' : ''}">${v.tp} TP</td><td class="${v.fn ? 'bad' : 'def'}">${v.fn} ${v.fn ? '<b class="bad">FN</b>' : 'FN'}</td></tr>
    <tr><th>ACT: passed/n-a</th><td class="${v.fp ? 'bad' : ''}">${v.fp} ${v.fp ? '<b class="bad">FP</b>' : 'FP'}</td><td class="good">${v.tn} TN</td></tr>
    </tbody></table><p class="cmnote"><b>${(100 * correct / v.n).toFixed(0)}%</b> on ${v.n} cases · ${correct} correct · ${err} error · LLM filled ${v.llmFilled}${v.errCases.length ? ' · errors: ' + v.errCases.map((c) => `<code>${esc(c.id)}</code>(${esc(c.kind)})`).join(' ') : ''}</p></div>`;
}
function rulePill(id) {
  const r = actById[id] || {}; const v = ruleStats(id); const k = 'act-' + id; const aa = aspectsByRule[id];
  const aaHtml = aa ? `<div class="aanote"><b>⚗ Act-augmented WIP tests address this rule's blind spots:</b><ul>${aa.map((x) => `<li><code>${esc(x.sc)}</code> ${esc(x.title.slice(0, 80))} — ${x.pageCount} pages</li>`).join('')}</ul></div>` : '';
  addPane(k, `ACT ${id} — ${r.name || ''}${actNotAuto.has(id) ? '  ·  ⚙ not fully automatable' : ''}`, confusionTable(v) + aaHtml + '<h4>Rule (verbatim)</h4>' + md(actContent[id] || '_no content_'));
  if (!v) return `<button class="pill nodata${aa ? ' hasaa' : ''}" data-detail="${k}" title="no eval data${aa ? ' · ' + aa.length + ' act-augmented aspect(s)' : ''}"><span class="rid">${id}${actNotAuto.has(id) ? ' ⚙' : ''}</span><span class="lbl">no data${aa ? ' · ⚗' + aa.length : ''}</span></button>`;
  const correct = v.tp + v.tn, err = v.fp + v.fn; const W = 50; const w = (x) => Math.round(W * x / Math.max(1, v.n));
  return `<button class="pill ${err ? 'err' : 'full'}" data-detail="${k}" title="${correct}/${v.n} correct (${(100 * correct / v.n).toFixed(0)}%) · ${err} error"><span class="rid">${id}${actNotAuto.has(id) ? ' ⚙' : ''}</span><span class="bar"><i class="ok" style="width:${w(correct)}px"></i><i class="er" style="width:${w(err)}px"></i></span>${err ? `<span class="errflag">${err}✗</span>` : ''}</button>`;
}
function aspectChip(sc, a) {
  const k = 'aa-' + sc + '-' + a.slug; const pri = a.priority === 'high' ? 'phi' : a.priority === 'low' ? 'plo' : 'pmd';
  addPane(k, `Act-augmented aspect — ${a.title}`, `<p class="aaplain">${esc(a.plain)}</p><p>${esc(a.desc)}</p>${a.why ? `<p><b>Why ACT rules can't reach it:</b> ${esc(a.why)}</p>` : ''}<p><b>Associates with:</b> guideline SC ${esc(sc)}${a.tt && a.tt.length ? ` · Trusted Tester ${esc(a.tt.join(', '))}` : ''} · priority <b>${esc(a.priority)}</b></p>${a.refs && a.refs.length ? `<h5>Technique / failure references</h5><ul>${a.refs.map((r) => `<li><code>${esc(r.doc || '')}</code>${r.quote ? ` — “${esc(String(r.quote).slice(0, 180))}…”` : ''}</li>`).join('')}</ul>` : ''}<h5>Test pages — ${a.pageCount} <span class="wip">(WIP · no harness verdict yet)</span></h5><ul class="aapages">${a.pages.map((p) => `<li><code>${esc(p.id)}</code>${p.scenario ? ` — ${esc(String(p.scenario).slice(0, 140))}` : ''}</li>`).join('')}</ul>`);
  return `<button class="aachip ${pri}" data-detail="${k}"><span class="aatitle">${esc(a.title.slice(0, 54))}${a.title.length > 54 ? '…' : ''}</span><span class="aacount">${a.pageCount}p</span><span class="aapri ${pri}">${esc(a.priority)}</span></button>`;
}

function scBlock(e) {
  const acts = actBySc[e.sc] || [];
  const actCell = acts.length ? acts.map(rulePill).join(' ') : '<span class="none">no ACT rule</span>';
  const enK = 'en-' + e.sc; addPane(enK, `EN 301 549 — ${enClauseNum(e.sc)} (SC ${e.sc})`, enBySc[e.sc] ? md(enBySc[e.sc]) : `<p>EN clause <code>${esc(enClauseNum(e.sc))}</code> is a <strong>pass-through</strong> to WCAG 2.2 SC ${esc(e.sc)} (Conformance Requirements clause 9.6). Conformance-scope is checked separately — see the EN-scope section.</p>`);
  const enCell = e.scope === 'AAA' ? '<span class="none">n/a</span>' : `<button class="chip en" data-detail="${enK}">${enClauseNum(e.sc)}</button>`;
  const ttK = 'tt-' + e.sc; const ttHas = !!ttBySc[e.sc]; if (ttHas) addPane(ttK, `Trusted Tester — SC ${e.sc}`, md(R('refs/trusted-tester/' + ttBySc[e.sc])));
  const ttCell = ttHas ? `<button class="chip tt" data-detail="${ttK}">TT ${e.sc}</button>` : '<span class="none">none</span>';
  const pathCell = e.pathways.map((p) => `<div class="pw"><span class="kind ${p.kind}">${esc(p.label)}</span> ${p.items.map((it) => `<code>${esc(it)}</code>`).join(' ')}</div>`).join('');

  const errRules = acts.filter((id) => ruleErr(id) > 0);
  const errN = errRules.reduce((n, id) => n + ruleErr(id), 0);
  const missing = MISSING[e.sc] || [];
  const aa = ACTAUG[e.sc];
  const hasGap = errN > 0 || missing.length > 0;
  // status badge
  const st = [];
  if (errN) st.push(`<span class="st serr">⚠ ${errN} error${errN > 1 ? 's' : ''}</span>`);
  if (missing.length) st.push(`<span class="st smiss">◢ ${missing.length} no-component</span>`);
  if (!errN && !missing.length) st.push('<span class="st sok">✓ clean</span>');
  if (aa) st.push(`<span class="st saa">⚗ ${aa.aspects.length} aspects · ${aa.totalPages}p</span>`);

  // ---- unified detail ----
  let det = '';
  if (errRules.length) {
    det += `<div class="dsec err"><h4>⚠ Harness errors — full pipeline (det + axe + LLM)</h4><ul>` + errRules.map((id) => { const v = perRule[id]; const exp = expectationOf(actContent[id]); const parts = []; if (v.fp) parts.push(`${v.fp} over-flag${v.fp > 1 ? 's' : ''} (FP${v.errCases.some((c) => /LLM/.test(c.via)) ? ', via the LLM lane' : ''})`); if (v.fn) parts.push(`${v.fn} missed (FN)`); return `<li><b>ACT ${id}</b>: ${parts.join('; ')} on ${v.n} cases — does not yet satisfy <span class="quote"><mark>${esc(exp)}</mark></span></li>`; }).join('') + `</ul></div>`;
  }
  if (missing.length) {
    det += `<div class="dsec miss"><h4>◢ Requirement aspects with NO component (deterministic, rubric, or axe)</h4><ul>` + missing.map((m) => `<li>${esc(m.text)} <span class="cite">[${esc(m.cite)}]</span> — <mark>${esc(m.hi)}</mark></li>`).join('') + `</ul></div>`;
  }
  if (aa) {
    det += `<div class="dsec aa"><h4>⚗ Act-augmented tests — ${aa.aspects.length} aspects ACT rules can't reach · ${aa.totalPages} human-judgment pages <span class="wip">(WIP · no harness verdict)</span></h4><div class="aachips">` + aa.aspects.map((a) => aspectChip(e.sc, a)).join(' ') + `</div></div>`;
  }
  det += `<div class="dsec pw"><h4>Coverage pathways</h4>${pathCell}</div>`;

  const summary = `<tr class="sc" data-sc="${e.sc}" data-gap="${hasGap ? 1 : 0}">
    <td class="sccell"><a href="https://www.w3.org/WAI/WCAG22/Understanding/${sluggish(e.name)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${e.sc}</a><div class="scname">${esc(e.name)}</div>${e.scope !== '22' ? `<div class="scopeflag">${e.scope}</div>` : ''}</td>
    <td class="paths">${pathCell}</td>
    <td class="actcell">${actCell}</td>
    <td class="refc">${enCell}</td><td class="refc">${ttCell}</td>
    <td class="status">${st.join(' ')} <span class="exp">▸</span></td></tr>`;
  const detail = `<tr class="detail" data-sc="${e.sc}"><td colspan="6">${det}</td></tr>`;
  return summary + detail;
}

const EN_SCOPE = [
  { clause: 'C.9.6.2 — Full pages', hi: 'conformance cannot be achieved if part of a web page is excluded', gap: 'The collector caps at ~80 elements; elements past the cap are invisible. Disclosed, but not full-page.' },
  { clause: 'C.9.6.5 — Non-interference', hi: '1.4.2 (audio control) and 2.3.1 (three flashes) must hold for the whole page', gap: 'No lane verifies 1.4.2 or 2.3.1; 2.2.2 is rubric-only. 2.1.2 is covered.' },
  { clause: 'C.9.7 — User preferences', hi: 'must not block user-agent presentation modes, nor override platform accessibility settings', gap: 'No lane checks prefers-reduced-motion override, forced-colors, or zoom blocking.' },
  { clause: 'C.9.6.3 — Complete processes', hi: 'all web pages in a process must conform', gap: 'Single-page evaluation; multi-step process conformance is out of scope.' },
];

const tableRows = MODEL.map(scBlock).join('\n');
const enScopeHtml = EN_SCOPE.map((g) => `<div class="enscope"><div class="enc">${esc(g.clause)}</div><div class="enreq">Requires: <mark>${esc(g.hi)}</mark></div><div class="engap">⚠ ${esc(g.gap)}</div></div>`).join('');
addPane('en-scope', 'EN 301 549 — conformance-scope gaps', enScopeHtml);
const totN = Object.values(perRule).reduce((a, v) => a + v.n, 0);
const accPct = totN ? (100 * Object.values(perRule).reduce((a, v) => a + v.tp + v.tn, 0) / totN).toFixed(1) : '?';
const errRuleCount = Object.keys(perRule).filter((id) => ruleErr(id) > 0).length;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>WCAG Coverage Explorer — A11yAnnotator v3</title>
<style>
:root{--g:#1a7f37;--a:#9a6700;--r:#cf222e;--line:#d0d7de;--ink:#1f2328;--mut:#656d76;--ok:#2da44e;--er:#cf222e}
*{box-sizing:border-box}body{font:13.5px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--ink);margin:0;background:#f6f8fa}
header{padding:16px 24px;background:#fff;border-bottom:1px solid var(--line)}h1{margin:0 0 4px;font-size:20px}.sub{color:var(--mut);font-size:12.5px;max-width:96ch}
.wrap{padding:14px 24px 60px}.legend{margin:9px 0;display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--mut);align-items:center}.legend b{color:var(--ink)}
.controls{margin:8px 0 12px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}.controls input{padding:5px 8px;border:1px solid var(--line);border-radius:6px;font:inherit}
table{border-collapse:collapse;width:100%;background:#fff;border:1px solid var(--line);border-radius:8px;overflow:hidden}
th,td{border-bottom:1px solid var(--line);border-right:1px solid #eaeef2;padding:6px 9px;text-align:left;vertical-align:top}
thead th{position:sticky;top:0;background:#f6f8fa;font-size:11.5px;text-transform:uppercase;letter-spacing:.03em;color:var(--mut);z-index:2}
tr.sc{cursor:pointer}tr.sc:hover{background:#f6faff}tr.sc.expanded{background:#eef5ff}
.sccell{background:#fbfcfd;white-space:nowrap;font-weight:700}.sccell a{color:#0969da;text-decoration:none;font-size:15px}.scname{font-weight:400;font-size:11px;color:var(--mut);white-space:normal;max-width:15ch}.scopeflag{margin-top:2px;font-size:10px;color:var(--a);font-weight:700}
.paths .pw{margin:1px 0;font-size:11.5px}.kind{font-weight:600;padding:0 5px;border-radius:4px;font-size:11px}.kind.det{background:#dafbe1;color:#0a5a2a}.kind.axe{background:#ddf4ff;color:#0a4a82}.kind.llm{background:#fff1d6;color:#7a5200}.kind.ibm{background:#f0e8ff;color:#5a3a9a}
.paths code,.dsec code{background:#f0f3f6;padding:0 4px;border-radius:3px;font-size:11px}
.actcell{min-width:210px}
.pill{font:inherit;display:inline-flex;align-items:center;gap:4px;border:1px solid var(--line);background:#fff;border-radius:6px;padding:1px 5px;cursor:pointer;margin:2px 3px 0 0;vertical-align:top}.pill:hover{border-color:#0969da}.pill .rid{font-size:10.5px;font-weight:600;font-family:ui-monospace,monospace}.pill .lbl{font-size:10px;color:var(--mut);font-style:italic}
.pill .bar{display:inline-flex;height:7px;width:50px;border-radius:4px;overflow:hidden;background:#e7ebef}.pill .bar i{height:7px;display:inline-block}.pill .bar .ok{background:var(--ok)}.pill .bar .er{background:var(--er)}
.pill.err{border-color:#ffb3b3;background:#fff5f5}.pill .errflag{font-size:9px;color:var(--r);font-weight:700}.pill.nodata{opacity:.7}.pill.hasaa{border-color:#9ec3ff;opacity:1}.pill.hasaa .lbl{color:#0a4a82}
.chip{font:inherit;font-size:11px;border:1px solid var(--line);background:#fff;border-radius:20px;padding:1px 8px;cursor:pointer}.chip:hover{border-color:#0969da}.chip.en{border-color:#6e7781}.chip.tt{border-color:#bf8700}
.none{color:var(--mut);font-size:11px;font-style:italic}
.status{font-size:11px;white-space:nowrap}.st{padding:1px 6px;border-radius:4px;font-weight:600;margin-right:3px;display:inline-block;margin-bottom:2px}.st.serr{background:#ffe3e3;color:#a40e26}.st.smiss{background:#ffe0c2;color:#8a4b00}.st.sok{background:#dafbe1;color:#0a5a2a}.st.saa{background:#e7f0ff;color:#0a4a82}.exp{color:var(--mut);font-weight:700}.sc.expanded .exp{transform:rotate(90deg);display:inline-block}
tr.detail{display:none}tr.detail.open{display:table-row}tr.detail td{background:#fafdff;padding:10px 14px}
.dsec{margin:0 0 10px}.dsec h4{margin:0 0 5px;font-size:12.5px}.dsec.err h4{color:#a40e26}.dsec.miss h4{color:#8a4b00}.dsec.aa h4{color:#0a4a82}.dsec ul{margin:3px 0;padding-left:20px}.dsec li{margin:4px 0;font-size:12.5px}.cite{font-size:11px;color:var(--mut)}
.quote{display:inline-block;margin-top:2px}mark{background:#fff3a3;padding:0 3px}
.aachips{display:flex;flex-wrap:wrap;gap:5px}.aachip{font:inherit;font-size:11px;border:1px solid #9ec3ff;background:#fff;border-radius:6px;padding:2px 7px;cursor:pointer;display:inline-flex;gap:5px;align-items:center}.aachip:hover{border-color:#0969da}.aacount{color:#0a4a82;font-weight:700}.aapri{font-size:9px;padding:0 4px;border-radius:3px}.aapri.phi{background:#ffd9b3;color:#8a4b00}.aapri.pmd{background:#fff3cd;color:#7a5200}.aapri.plo{background:#eaeef2;color:#656d76}
.wip{color:var(--a);font-weight:600;font-size:11px}
.modal{position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;z-index:10;padding:30px}.modal.open{display:flex;justify-content:center;align-items:flex-start}.modal .box{background:#fff;max-width:920px;width:100%;max-height:88vh;overflow:auto;border-radius:10px;padding:22px 28px;box-shadow:0 12px 48px rgba(0,0,0,.3)}.modal .close{position:sticky;top:0;float:right;border:none;background:#eaeef2;border-radius:6px;padding:4px 10px;cursor:pointer}
.pane h3{margin:0 0 10px;font-size:16px}.pane h4,.pane h5{font-size:13px;margin:12px 0 4px}.pane p{margin:6px 0}.pane code{background:#f0f3f6;padding:1px 4px;border-radius:4px}.pane pre.code{background:#f6f8fa;padding:10px;border-radius:6px;overflow:auto;font-size:12px;white-space:pre-wrap}.pane ul{margin:6px 0;padding-left:20px}
.confusion{background:#f6f8fa;border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin-bottom:10px}.cm{border-collapse:collapse;font-size:12px}.cm th,.cm td{border:1px solid var(--line);padding:4px 8px;text-align:center}.cm td.good{background:#dafbe1}.cm td.bad{background:#ffebe9}.cmnote{font-size:12px;margin:5px 0 0}.bad{color:var(--r)}.muted{color:var(--mut)}.aanote{background:#eef5ff;border-left:3px solid #9ec3ff;padding:6px 10px;border-radius:4px;margin-bottom:10px;font-size:12.5px}.aaplain{font-style:italic;color:#444}
.enscope{margin:8px 0;padding:10px 14px;background:#fff7f7;border-left:3px solid var(--r);border-radius:4px}.enc{font-weight:700;font-size:13px}.enreq{font-size:12.5px;margin:3px 0}.engap{font-size:12.5px;color:#a40e26}.section{margin-top:24px}.section h2{font-size:16px;margin:0 0 8px}
footer{color:var(--mut);font-size:12px;padding:6px 24px 30px}
</style></head><body>
<header>
<h1>WCAG Coverage Explorer <span style="font-weight:400;color:var(--mut);font-size:14px">— A11yAnnotator v3</span></h1>
<div class="sub"><b>Click any SC row</b> to expand a unified detail: harness FP/FN errors, requirement aspects no component covers, and the act-augmented WIP test corpus. ACT-rule pills are the <b>full-pipeline</b> (det + axe + LLM) accuracy on that rule's test cases; open one for a TP/FP/TN/FN breakdown. A <code>no-data</code> pill that borders blue (⚗) has act-augmented WIP tests for its blind spots. Pill scoring: <code>${esc((RUNSRC || '').replace('results/', '').replace('/results.json', '') || 'none')}</code> (${RUN_N} cases, ${accPct}%).</div>
<div class="legend">
<span><b>Pathway:</b> <span class="kind det">det</span> <span class="kind axe">axe</span> <span class="kind llm">LLM</span> <span class="kind ibm">IBM</span></span>
<span><b>Pill:</b> <span style="display:inline-block;width:20px;height:7px;background:var(--ok);border-radius:3px;vertical-align:middle"></span> correct <span style="display:inline-block;width:14px;height:7px;background:var(--er);border-radius:3px;vertical-align:middle"></span> error · ⚙ not-automatable</span>
<span><b>Status:</b> <span class="st serr">⚠ error</span> <span class="st smiss">◢ no-component</span> <span class="st saa">⚗ act-augmented</span></span>
<span><b>Aspect priority</b> (impact of the gap): <span class="aapri phi">high</span> <span class="aapri pmd">medium</span> <span class="aapri plo">low</span></span>
</div>
<div class="controls">
<input id="q" type="search" placeholder="Filter by SC, name, tool, experiment, rule id, aspect…" style="min-width:320px">
<label><input type="checkbox" id="hidecov"> hide fully-covered (only SCs with an error or no-component gap)</label>
<label><input type="checkbox" id="expand"> expand all</label>
</div>
</header>
<div class="wrap">
<table id="tbl"><thead><tr><th>SC</th><th>Coverage pathways</th><th>ACT rules (full-pipeline accuracy)</th><th>EN</th><th>TT</th><th>Status — click row to expand</th></tr></thead>
<tbody>${tableRows}</tbody></table>
<div class="section"><h2>EN 301 549 conformance-scope — normative requirements with no harness lane ⚠</h2>
<p class="sub" style="margin:0 0 8px">Apply across the whole page/process, not per-element, and are genuinely unimplemented.</p>${enScopeHtml}</div>
</div>
<footer>Full pipeline (det + axe + LLM) over ${esc((RUNSRC || '').replace('results/', '').replace('/results.json', '') || 'no run')}: ${RUN_N} ACT cases, ${accPct}% accuracy, ${errRuleCount} rules with FP/FN errors · ${Object.keys(MISSING).length} SCs with a no-component aspect · act-augmented WIP corpus: ${AA_ASPECTS} aspects / ${AA_PAGES} pages (no harness verdicts yet). See <code>docs/reference/COVERAGE-AND-GAPS.md</code>.</footer>
<div class="modal" id="modal"><div class="box"><button class="close" id="close">✕ close</button><div id="modalbody"></div></div></div>
<div hidden id="panes">${detailPanes.join('\n')}</div>
<script>
const modal=document.getElementById('modal'),body=document.getElementById('modalbody'),tbl=document.getElementById('tbl');
document.addEventListener('click',e=>{const b=e.target.closest('[data-detail]');if(b){const p=document.getElementById('pane-'+b.dataset.detail);body.innerHTML=p?p.innerHTML:'';modal.classList.add('open');}if(e.target.id==='close'||e.target===modal)modal.classList.remove('open');});
document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.classList.remove('open');});
// accordion: click an SC row toggles its detail row (but not when a pill/chip/link was clicked)
tbl.addEventListener('click',e=>{if(e.target.closest('[data-detail]')||e.target.closest('a'))return;const sr=e.target.closest('tr.sc');if(!sr)return;const dr=sr.nextElementSibling;if(dr&&dr.classList.contains('detail')){const open=dr.classList.toggle('open');dr.style.display=open?'table-row':'none';sr.classList.toggle('expanded',open);}});
const q=document.getElementById('q'),hc=document.getElementById('hidecov'),ex=document.getElementById('expand');
function apply(){const term=q.value.toLowerCase();for(const sr of tbl.tBodies[0].rows){if(!sr.classList.contains('sc'))continue;const dr=sr.nextElementSibling;const txt=(sr.textContent+' '+(dr?dr.textContent:'')).toLowerCase();const hasGap=sr.dataset.gap==='1';const show=(!term||txt.includes(term))&&(!hc.checked||hasGap);sr.style.display=show?'':'none';if(dr&&dr.classList.contains('detail')){const open=ex.checked||dr.classList.contains('open');sr.classList.toggle('expanded',show&&open);dr.style.display=(show&&open)?'table-row':'none';}}}
q.addEventListener('input',apply);hc.addEventListener('change',apply);ex.addEventListener('change',apply);
</script></body></html>`;

const OUT = path.join(ROOT, 'docs/reference/coverage-explorer.html');
fs.writeFileSync(OUT, html);
console.log('wrote', path.relative(ROOT, OUT), '·', MODEL.length, 'SCs ·', detailPanes.length, 'panes ·', (html.length / 1024).toFixed(0) + 'KB');
console.log('  full-pipeline:', RUNSRC || 'NONE', RUN_N, 'cases', accPct + '% ·', errRuleCount, 'error-rules · act-aug', AA_ASPECTS, 'aspects /', AA_PAGES, 'pages · no-data rules w/ act-aug:', Object.keys(aspectsByRule).filter((id) => !perRule[id]).length);
