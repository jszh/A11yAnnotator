'use strict';
// Requests, not successful executions. Automatic browser probes are excluded.
function newToolAccumulator() {
  return { calls: 0, byName: {}, multiTurnResults: 0, maxTurns: 0, llmCalls: 0 };
}
function recordToolTrace(acc, event) {
  if (!acc || !event) return;
  for (const block of (event.blocks || [])) {
    if (block && block.kind === 'tool_use') {
      acc.calls++;
      const name = block.name || '(unnamed)';
      acc.byName[name] = (acc.byName[name] || 0) + 1;
    }
  }
  if (event.type === 'result') {
    if (event.numTurns > 1) acc.multiTurnResults++;
    acc.maxTurns = Math.max(acc.maxTurns, event.numTurns || 0);
    acc.llmCalls++;
  }
}
module.exports = { newToolAccumulator, recordToolTrace };
