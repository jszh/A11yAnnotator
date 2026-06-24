export const meta = {
  name: 'act-augment-fullpass-batch',
  description: 'Run the per-SC ACT-augmentation pipeline sequentially over a batch of WCAG SCs (autonomous full pass)',
  phases: [{ title: 'Batch', detail: 'one SC pipeline at a time' }],
};

// args.batch = [ { sc, outDir, resource }, ... ]  (each is a full sc-pipeline args object)
let A = args;
if (typeof A === 'string') { try { A = JSON.parse(A); } catch (e) {} }
const batch = (A && Array.isArray(A.batch)) ? A.batch : [];
const PIPE = '/Users/jason/Developer/A11yAnnotator/eval/act-augmented/_tools/sc-pipeline.workflow.js';

const out = [];
for (const scArgs of batch) {
  phase('Batch');
  log(`=== SC ${scArgs.sc} starting (${out.length + 1}/${batch.length}) ===`);
  try {
    const r = await workflow({ scriptPath: PIPE }, scArgs);
    const fr = (r && r.finalReport) ? r.finalReport : {};
    const af = fr.aspectsFinalized || [];
    const rec = {
      sc: scArgs.sc, ok: true,
      allAspectsHave5: fr.allAspectsHave5ValidPages,
      aspects: af.length,
      valid: af.reduce((n, a) => n + (a.validPageCount || 0), 0),
      shortAspects: af.filter(a => (a.validPageCount || 0) < 5).map(a => a.slug),
    };
    out.push(rec);
    log(`=== SC ${scArgs.sc} done: aspects=${rec.aspects} valid=${rec.valid} allHave5=${rec.allAspectsHave5}${rec.shortAspects.length ? ' SHORT:' + rec.shortAspects.join(',') : ''} ===`);
  } catch (e) {
    out.push({ sc: scArgs.sc, ok: false, error: String(e) });
    log(`!!! SC ${scArgs.sc} FAILED: ${e} !!!`);
  }
}
return { batchSize: batch.length, results: out };
