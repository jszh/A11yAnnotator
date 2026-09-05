#!/usr/bin/env node
/**
 * fetch-data.js - pull a running (or finished) study's data out of Cloud
 * Storage and rebuild the results locally.
 *
 * Storage is only robust if the data comes back, so this is the other half of
 * lib/store.js and lib/journal.js. It downloads two independent things:
 *
 *   - the state snapshot, which is where the study is now, and
 *   - the journal, which is every event that ever happened, in order.
 *
 * The notes table is rebuilt from the JOURNAL, not the snapshot, because the
 * journal has the whole history: earlier versions of an edited note, and the
 * notes of a participant who was removed. The snapshot is compared against it
 * and any disagreement is reported rather than quietly resolved - if those two
 * ever diverge, that is something to look at, not to paper over.
 *
 * Usage:
 *   node eval/human-study/fetch-data.js [--bucket=agentic-a11y-human-study]
 *                                       [--out=results/human-study-<date>]
 */
const fs = require('fs');
const path = require('path');
const { GcsBucket } = require('./lib/gcs');

const ROOT = path.resolve(__dirname, '../..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const BUCKET = args.bucket || process.env.STUDY_BUCKET || 'agentic-a11y-human-study';
const STATE_OBJECT = args['state-object'] || 'state/study-state.json';
const JOURNAL_PREFIX = args['journal-prefix'] || 'journal';
const OUT = path.resolve(ROOT, args.out || `results/human-study-${new Date().toISOString().slice(0, 10)}`);
const SAMPLE = path.resolve(ROOT, args.sample || 'eval/human-study/sample/study-sample-200.json');

const csv = (rows) => {
  if (!rows.length) return '';
  const cols = [...rows.reduce((s, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set())];
  const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
};

(async () => {
  const bucket = new GcsBucket(BUCKET);
  fs.mkdirSync(OUT, { recursive: true });
  const cases = new Map(JSON.parse(fs.readFileSync(SAMPLE, 'utf8')).cases.map((c) => [c.caseId, c]));

  // --- snapshot -----------------------------------------------------------
  const snap = await bucket.read(STATE_OBJECT);
  if (!snap) console.warn(`no state snapshot at gs://${BUCKET}/${STATE_OBJECT} - the study may not have started yet`);
  const state = snap ? JSON.parse(snap.text) : null;
  if (state) fs.writeFileSync(path.join(OUT, 'study-state.json'), JSON.stringify(state, null, 2));

  // --- journal ------------------------------------------------------------
  const objects = [];
  for (const o of await bucket.list(`${JOURNAL_PREFIX}/`, 5000)) objects.push(o);
  objects.sort((a, b) => (a.name < b.name ? -1 : 1)); // runId then zero-padded batch number
  const events = [];
  for (const o of objects) {
    const got = await bucket.read(o.name);
    if (!got) continue;
    for (const line of got.text.split('\n')) {
      if (!line.trim()) continue;
      try { events.push(JSON.parse(line)); } catch (e) { console.warn(`unparseable line in ${o.name}`); }
    }
  }
  events.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.seq - b.seq));
  fs.writeFileSync(path.join(OUT, 'journal.jsonl'), events.map((e) => JSON.stringify(e)).join('\n') + (events.length ? '\n' : ''));

  // --- notes, rebuilt from the journal ------------------------------------
  // Last write per (participant, case) wins; every earlier version is kept in
  // history so an edit that lost something is recoverable.
  const latest = new Map();
  const history = [];
  for (const e of events) {
    if (e.event !== 'note') continue;
    const key = `${e.participantId}|${e.caseId}`;
    history.push({ at: e.at, participant: e.participant, caseId: e.caseId, note: e.note, previous: e.previous, status: e.status });
    if (e.note || e.status) latest.set(key, e);
    else latest.delete(key);
  }
  const rows = [...latest.values()].map((e) => {
    const c = cases.get(e.caseId);
    return {
      participant: e.participant, participantId: e.participantId,
      caseId: e.caseId, sc: e.sc || (c && c.sc) || '', page: e.page || (c && c.page.file) || '',
      scope: c ? c.scope : '', xpath: c ? c.xpath : '',
      stratum: c ? c.stratum : '', pattern: c ? c.pattern : '',
      harnessFlagged: c ? c.tools.harness.flagged : '', gena11yFlagged: c ? c.tools.gena11y.flagged : '', axeFlagged: c ? c.tools.axe.flagged : '',
      harnessLane: c ? c.lanes.harness : '', gena11yLane: c ? c.lanes.gena11y : '', axeLane: c ? c.lanes.axe : '',
      status: e.status || '', note: e.note || '', at: e.at,
    };
  }).sort((a, b) => (a.participant + a.caseId < b.participant + b.caseId ? -1 : 1));
  fs.writeFileSync(path.join(OUT, 'notes.csv'), csv(rows));
  fs.writeFileSync(path.join(OUT, 'note-history.jsonl'), history.map((h) => JSON.stringify(h)).join('\n') + (history.length ? '\n' : ''));

  // --- participants' answers, rebuilt from the journal --------------------
  // Every response event carries the participant's whole A/B/C mapping, so the
  // answers are readable from the journal alone - the letters mean something
  // different for each participant and would be meaningless without it.
  const answers = new Map();
  const answerHistory = [];
  for (const e of events) {
    if (e.event !== 'response') continue;
    const c = cases.get(e.caseId);
    const row = {
      participant: e.participant, participantId: e.participantId,
      caseId: e.caseId, sc: e.sc || (c && c.sc) || '', page: e.page || (c && c.page.file) || '',
      stratum: c ? c.stratum : '', pattern: c ? c.pattern : '',
      // Both shapes: answers recorded before multiple selection carry a single
      // `choice`, and the journal is never rewritten.
      choice: (Array.isArray(e.choices) ? e.choices : (e.choice ? [e.choice] : [])).join(' '),
      chosenTool: (Array.isArray(e.tools) ? e.tools : (e.tool ? [e.tool] : [])).join(' '),
      comment: e.comment || '',
      checkersAgreed: e.agreed,
      // Both shapes: the columns were lettered before they were numbered.
      label1: e.toolLabels && (e.toolLabels['1'] || e.toolLabels.A),
      label2: e.toolLabels && (e.toolLabels['2'] || e.toolLabels.B),
      label3: e.toolLabels && (e.toolLabels['3'] || e.toolLabels.C),
      harnessFlagged: c ? c.tools.harness.flagged : '', gena11yFlagged: c ? c.tools.gena11y.flagged : '', axeFlagged: c ? c.tools.axe.flagged : '',
      at: e.at,
    };
    answerHistory.push(row);
    answers.set(`${e.participantId}|${e.caseId}`, row);
  }
  const answerRows = [...answers.values()].sort((a, b) => (a.participant + a.caseId < b.participant + b.caseId ? -1 : 1));
  fs.writeFileSync(path.join(OUT, 'responses.csv'), csv(answerRows));
  fs.writeFileSync(path.join(OUT, 'response-history.jsonl'), answerHistory.map((h) => JSON.stringify(h)).join('\n') + (answerHistory.length ? '\n' : ''));

  // --- cross-check --------------------------------------------------------
  // The snapshot and the journal are written by different paths for exactly
  // this reason: if they disagree, say so.
  const drift = [];
  if (state) {
    for (const p of state.participants) {
      for (const [caseId, note] of Object.entries(p.notes || {})) {
        const j = latest.get(`${p.id}|${caseId}`);
        if (!j) drift.push({ kind: 'in-snapshot-not-journal', participant: p.name, caseId, note });
        else if (j.note !== note) drift.push({ kind: 'text-differs', participant: p.name, caseId, snapshot: note, journal: j.note });
      }
    }
    for (const e of latest.values()) {
      const p = state.participants.find((x) => x.id === e.participantId);
      if (!p) drift.push({ kind: 'participant-removed', participant: e.participant, caseId: e.caseId, note: e.note });
      else if (e.note && !(p.notes || {})[e.caseId]) drift.push({ kind: 'in-journal-not-snapshot', participant: e.participant, caseId: e.caseId, note: e.note });
    }
    for (const p of state.participants) {
      for (const [caseId, r] of Object.entries(p.responses || {})) {
        const j = answers.get(`${p.id}|${caseId}`);
        if (!j) drift.push({ kind: 'answer-in-snapshot-not-journal', participant: p.name, caseId, choice: (Array.isArray(r.choices) ? r.choices : (r.choice ? [r.choice] : [])).join(' ') });
        else {
          const snapChoice = (Array.isArray(r.choices) ? r.choices : (r.choice ? [r.choice] : [])).join(' ');
          if (j.choice !== snapChoice || (j.comment || '') !== (r.comment || '')) {
            drift.push({ kind: 'answer-differs', participant: p.name, caseId, snapshot: r, journal: { choice: j.choice, comment: j.comment } });
          }
        }
      }
    }
  }
  if (drift.length) fs.writeFileSync(path.join(OUT, 'drift.json'), JSON.stringify(drift, null, 2));

  const byKind = events.reduce((m, e) => (m[e.event] = (m[e.event] || 0) + 1, m), {});
  console.log(`data -> ${path.relative(ROOT, OUT)}`);
  console.log(`  journal    ${events.length} events in ${objects.length} batches`);
  console.log(`  events     ${Object.entries(byKind).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  ')}`);
  console.log(`  notes      ${rows.length} current, ${history.length} edits in history`);
  console.log(`  answers    ${answerRows.length} current, ${answerHistory.length} submissions in history`);
  if (answerRows.length) {
    const byChoice = answerRows.reduce((m, r) => (m[r.chosenTool || r.choice] = (m[r.chosenTool || r.choice] || 0) + 1, m), {});
    console.log(`  chosen     ${Object.entries(byChoice).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  ')}`);
  }
  if (state) console.log(`  snapshot   ${state.participants.length} participant(s), ${state.participants.reduce((n, p) => n + Object.keys(p.notes || {}).length, 0)} note(s)`);
  if (drift.length) console.log(`  DRIFT      ${drift.length} disagreement(s) between snapshot and journal - see drift.json`);
  else console.log('  drift      none - snapshot and journal agree');
})().catch((e) => { console.error(`fetch-data failed: ${e.message}`); process.exit(1); });
