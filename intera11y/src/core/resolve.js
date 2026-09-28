// Resolution: a deterministic FAIL/PASS stands; an OPEN candidate takes the judge's verdict. The criterion fails
// on the page if any candidate (or any page-level finding) fails. INCOMPLETE when nothing failed but some
// candidate is UNDETERMINED or has no verdict, or a probe it depends on did not complete — never silently PASS.
// Each candidate keeps its origin (rules, screen, or both); the verdict is also reported over the rule-based
// candidates alone, which is what the page would get without the screening sweep.

function verdictOf(candidates, findings, incompleteProbe) {
  const noVerdict = candidates.filter((c) => c.status === 'NO_VERDICT' || c.status === 'UNDETERMINED').length;
  if (findings.length) return 'FAIL';
  if (candidates.every((c) => c.status === 'NOT_APPLICABLE') && !incompleteProbe) return 'NOT_APPLICABLE';
  if (noVerdict || incompleteProbe) return 'INCOMPLETE';
  return 'PASS';
}

function resolveCriterion({ criterion, assessed, judged, coverage, ms, costUsd, usage, screen }) {
  const candidates = assessed.map((c) => {
    const a = c.assessment;
    const base = { xpath: c.xpath, kind: c.kind, origin: c.origin || 'rules' };
    if (a.status !== 'OPEN') return { ...base, status: a.status, source: `rule:${a.rule}`, reason: a.reason || '' };
    const j = judged.results.get(c.key || c.xpath) || { verdict: 'NO_VERDICT', reason: 'not judged' };
    return { ...base, status: j.verdict, source: 'judge', reason: j.reason || '', evidence: j.evidence || '', rule: a.rule || null };
  });
  const findings = candidates.filter((c) => c.status === 'FAIL').map((c) => ({ xpath: c.xpath, reason: c.reason, source: c.source, origin: c.origin }));
  for (const f of judged.pageFindings) findings.push({ xpath: f.xpath ? String(f.xpath).replace(/#[a-z-]+$/, '') : null, reason: f.reason, evidence: f.evidence, source: 'judge:page', origin: 'judge' });
  const incompleteProbe = Object.entries(coverage).some(([k, v]) => k !== 'screen' && v.completeness !== 'complete');
  const incompleteScreen = !!(coverage.screen && coverage.screen.completeness !== 'complete');
  const verdict = verdictOf(candidates, findings, incompleteProbe || incompleteScreen);
  const ruleCands = candidates.filter((c) => c.origin !== 'screen');
  const verdictWithoutScreen = verdictOf(ruleCands, findings.filter((f) => f.origin !== 'screen'), incompleteProbe);
  const tally = {};
  for (const c of candidates) tally[`${c.source.split(':')[0]}:${c.status}`] = (tally[`${c.source.split(':')[0]}:${c.status}`] || 0) + 1;
  return { sc: criterion.sc, verdict, verdictWithoutScreen, findings, tally, candidates, coverage, screen: screen || null, ms, costUsd, judgeUsage: usage || null };
}

module.exports = { resolveCriterion };
