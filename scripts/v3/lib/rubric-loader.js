'use strict';
// Harness 3.2 §9 — the rubric loader. The LLM lane no longer INVESTIGATES (the collector + deterministic
// runners do); each rubric's job is to JUDGE MEANING over the evidence it is handed, and DEFER where a
// deterministic runner already decided. This loader reads two rubric sources into the `opts.llmRubrics`
// the adjudicator consumes, and PINS each rubric's content hash into a `promptHash` provenance slot
// (authority.js calibrates per mechanism, so a reworded rubric is a DIFFERENT mechanism — a v1's gold
// calibration can never transfer to a v3.2 rewrite):
//   • skills/*.md  → the broad `llm-agent` whole-obligation rubrics (per skill);
//   • scripts/v3/llm-rubrics/*.md → the atomic, versioned `llm-rubric:<id>-v<n>` set (scoped to the gap,
//     declaring their `visionEvidence` needs in frontmatter).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// the kinds of pixels a rubric may ask the adjudicator to hand it (3.2 §"Vision evidence").
const VISION_EVIDENCE = ['element-crop', 'surrounding-region', 'state-before', 'state-after', 'viewport', 'viewport-320'];
const sha256 = (s) => 'sha256:' + crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');

// Per-skill vision needs for the broad `llm-agent` rubrics (3.2 per-skill vision map). The atomic
// rubrics declare their own in frontmatter; the skill rubrics declare theirs here (single table) so the
// existing skills/*.md need no machine-readable header to participate.
const SKILL_VISION = Object.freeze({
  'color-and-visual-text': ['element-crop', 'surrounding-region'],
  'focus-visibility': ['state-before', 'state-after'],
  'reflow-and-pointer-affordances': ['viewport-320', 'element-crop'],
  'forms-instructions-errors': ['state-before', 'state-after'],
  'dynamic-announcement': ['state-before', 'state-after'],
  'name-role-state': ['element-crop'],
  'page-structure': ['viewport'],
  'grouping-and-reading-order': ['viewport'],
  'keyboard-operability': [],
  'focus-management': [],
});

// minimal YAML-ish frontmatter parse (`--- ... ---`): scalar + [a, b] list values only.
function parseFrontmatter(text) {
  const m = String(text).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: String(text) };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^([\w][\w-]*):\s*(.*)$/);
    if (!mm) continue;
    let v = mm[2].trim();
    if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    else v = v.replace(/^["']|["']$/g, '');
    meta[mm[1]] = v;
  }
  return { meta, body: m[2] };
}

const SKILLS_DIR = path.join(__dirname, '..', '..', '..', 'skills');
const RUBRICS_DIR = path.join(__dirname, '..', 'llm-rubrics');
const okVision = (v) => (Array.isArray(v) ? v.filter((x) => VISION_EVIDENCE.includes(x)) : []);

// Load both rubric sources. Returns { skills:{[skill]:{text,promptHash,visionEvidence}},
// rubrics:{[id]:{id,sc,skill,visionEvidence,text,promptHash}}, promptHash } — the combined hash changes
// if ANY rubric's content changes, so it can pin the run's prompt provenance.
function loadRubrics({ skillsDir = SKILLS_DIR, rubricsDir = RUBRICS_DIR } = {}) {
  const conflicts = [];
  const ls = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []); // SORTED ⇒ deterministic across filesystems
  const skills = {};
  for (const f of ls(skillsDir)) {
    if (!f.endsWith('.md') || /^(README|COVERAGE-GAPS)\b/i.test(f)) continue;
    const skill = f.replace(/\.md$/, '');
    const { meta, body } = parseFrontmatter(fs.readFileSync(path.join(skillsDir, f), 'utf8'));
    const text = body.trim();
    const vision = okVision(meta.visionEvidence).length ? okVision(meta.visionEvidence) : (SKILL_VISION[skill] || []);
    // the hash binds the agent's ACTUAL inputs — body AND which crops it is handed — so changing the
    // vision needs is a DIFFERENT mechanism that cannot inherit the old gold (adversarial: provenance hole).
    skills[skill] = { text, promptHash: sha256(JSON.stringify({ text, visionEvidence: vision })), visionEvidence: vision };
  }
  const rubrics = {};
  for (const f of ls(rubricsDir)) {
    if (!f.endsWith('.md')) continue;
    const { meta, body } = parseFrontmatter(fs.readFileSync(path.join(rubricsDir, f), 'utf8'));
    const id = meta.id || f.replace(/\.md$/, '');
    if (Object.prototype.hasOwnProperty.call(rubrics, id)) { conflicts.push(`duplicate rubric id ${JSON.stringify(id)} (in ${f}) — first wins`); continue; } // keep first (sorted ⇒ stable); a stray file can't silently clobber a calibrated rubric
    const text = body.trim();
    const vision = okVision(meta.visionEvidence);
    // #15 fix: a rubric whose core judgment is a PIXEL comparison (e.g. alt-text-adequacy-v0's "does the name
    // match what the image DEPICTS") cannot be answered from text signals alone — the existing NON-VISUAL
    // EXCEPTION (llm-adjudicator.js) was designed for NAME/ROLE-type judgments (a real off-screen element with
    // a genuine accessible name, still text-judgeable) and lets ANY rubric proceed text-only when the element
    // has zero vision evidence. Confirmed live: with zero pixels, a model fabricated a specific "the image
    // actually depicts X" claim instead of abstaining — the rubric's own caveat text ("you cannot know that")
    // didn't stop it. `requiresVision: true` in frontmatter opts a rubric OUT of the non-visual exception, so
    // the required-evidence gate abstains (auto-PARTIAL) instead of inviting a hallucinated pixel comparison.
    const requiresVision = meta.requiresVision === 'true';
    rubrics[id] = { id, sc: meta.sc || null, skill: meta.skill || null, visionEvidence: vision, requiresVision, text, promptHash: sha256(JSON.stringify({ text, sc: meta.sc || null, visionEvidence: vision, requiresVision })) };
  }
  const fingerprint = JSON.stringify({
    skills: Object.fromEntries(Object.entries(skills).map(([k, v]) => [k, v.promptHash])),
    rubrics: Object.fromEntries(Object.entries(rubrics).map(([k, v]) => [k, v.promptHash])),
  });
  return { skills, rubrics, conflicts, promptHash: sha256(fingerprint) };
}

module.exports = { loadRubrics, parseFrontmatter, VISION_EVIDENCE, SKILL_VISION, sha256, SKILLS_DIR, RUBRICS_DIR };
