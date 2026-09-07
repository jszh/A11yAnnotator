#!/usr/bin/env node
/**
 * Recompute a Gemini run's recorded costUsd from its own token counts, in place.
 *
 * Needed because artifacts written between the cost-accounting commit and the cached-token fix
 * (2026-09-06/07) charged cached input TWICE — once at the uncached rate and again at the cache
 * rate — because Gemini's promptTokenCount already includes cachedContentTokenCount. On
 * supplementary585-ours-gem37 that recorded $22.32 against an actual $15.00.
 *
 * Tokens are the authoritative artifact and are untouched; only the derived cost changes. The
 * original value is preserved as costUsdPrevious with a note, so a corrected artifact never looks
 * like it was always right.
 *
 * Usage: node recost-gemini-run.js <run> [<run> ...] [--tier=flex|standard] [--dry]
 */
const fs = require('fs');
const path = require('path');
const { geminiCostUsd } = require('../../../scripts/v3/lib/llm-agent-adapter.js');

const REPO = path.resolve(__dirname, '../../..');
const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const tierArg = (argv.find((a) => a.startsWith('--tier=')) || '').slice(7) || null;
const runs = argv.filter((a) => !a.startsWith('--'));
if (!runs.length) { console.error('usage: recost-gemini-run.js <run> [...] [--tier=flex] [--dry]'); process.exit(2); }

for (const run of runs) {
  const p = path.join(REPO, 'results', run, 'summary.json');
  if (!fs.existsSync(p)) { console.log(`${run}: no summary.json`); continue; }
  const s = JSON.parse(fs.readFileSync(p, 'utf8'));
  const holder = (s.llm && (s.llm.inputTokens || s.llm.outputTokens)) ? s.llm : (s.tokens || {});
  const model = s.model || (s.tokens || {}).model || (s.config || {}).model || '';
  const inTok = Number(holder.inputTokens || 0);
  const outTok = Number(holder.outputTokens || 0);
  const cacheTok = Number(holder.cacheReadTokens || 0);
  if (!/^gemini/.test(model) || (!inTok && !outTok)) { console.log(`${run}: not a priceable Gemini run (model=${model || '?'})`); continue; }
  // Tier is not recorded in older artifacts, so it must be supplied; guessing it would silently
  // halve or double the figure, which is exactly the class of error this tool exists to undo.
  const tier = tierArg || (s.config && s.config.serviceTier) || null;
  const fixed = geminiCostUsd({ model, inputTokens: inTok, outputTokens: outTok, cachedTokens: cacheTok, serviceTier: tier, at: s.finishedAt || s.generatedAt || null });
  const prev = typeof holder.costUsd === 'number' ? holder.costUsd : null;
  if (fixed == null) { console.log(`${run}: no price for ${model} — left untouched`); continue; }
  const delta = prev == null ? null : fixed - prev;
  console.log(`${run}\n  model=${model} tier=${tier || 'standard'} in=${inTok.toLocaleString()} out=${outTok.toLocaleString()} cache=${cacheTok.toLocaleString()}`
    + `\n  recorded=${prev == null ? '—' : '$' + prev.toFixed(2)}  corrected=$${fixed.toFixed(2)}`
    + (delta == null ? '' : `  (${delta >= 0 ? '+' : ''}${delta.toFixed(2)})`));
  if (DRY) continue;
  holder.costUsd = Number(fixed.toFixed(6));
  if (prev != null && Math.abs(delta) > 1e-9) {
    holder.costUsdPrevious = prev;
    holder.costUsdNote = 'Recomputed 2026-09-07 from this run\'s own tokens: the original value double-charged '
      + 'cached input (Gemini promptTokenCount already includes cachedContentTokenCount). Tokens unchanged.';
    holder.costUsdTier = tier || 'standard';
  }
  fs.writeFileSync(p, JSON.stringify(s, null, 1));
  console.log('  written');
}
