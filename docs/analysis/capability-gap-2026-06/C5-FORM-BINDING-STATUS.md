# C5 — Form constraint + message-binding runner (3.3.1/3.3.2/3.3.3): status

`scripts/v3/lib/form-binding-runner.js`. Validated vs 200 independent adversarial cases (10 aspects, 2 agents;
held-out set untouched): **131/200 (66%); DANGEROUS = 10 false-clear, 2 false-barrier.**

## What it adds (the Phase-1 gap: the old form-error-probe never bound the error to THE field nor passed the constraint)
- **Field CONSTRAINT collection**: required/type/pattern/min/max/maxlength/minlength/step/inputmode + nonObviousFormat.
- **Drive submit + observe**: types the invalid value, submits, diffs the DOM for the new error/suggestion text.
- **BIND message → field**: aria-describedby / aria-errormessage(+aria-invalid) IDREF, adjacency, or page-summary.
- **Instruction + group-label collection**: label/describedby/placeholder/title; fieldset>legend / role=group / split-input.

## Division of labour (sound)
- DECIDES the structural checks deterministically: instruction present + field-attached (3.3.2 proximity), group
  label present incl. split-input groups (3.3.2), error present + bound to the field (3.3.1 binding), suggestion
  present + reachable (3.3.3 reachability). [acc: instruction 17/20, reachability 18/20, binding 16/20, group 16/20]
- ABSTAINS + routes the SEMANTIC checks to the rubric WITH the facts it lacked: error-vs-actual-constraint match,
  instruction-vs-constraint consistency, suggestion correctness, error-name correctness, summary coherence,
  security/purpose+composition exception. (These show decided 0/20 — correctly deferred, scored as acceptable.)

## Residual false-clears (10) — semantic-binding-correctness + detection gaps, rubric-backstopped
- error-field-binding ×4: bound-but-to-the-WRONG/passing field, dangling/detached describedby, shared-ambiguous
  container — whether the binding is to THE failing field is partly semantic.
- field-group-label ×3: inadequate-but-present labels / split-input variants the heuristic misses.
- instruction-proximity ×3: stranded-vs-associated edge cases.

## Verdict
Reasonable + robust as a fact-collection prototype: the binding + constraint facts (the real missing capability)
are now produced for the rubric; structural checks decided soundly; semantic checks correctly deferred. The
residual false-clears are the hard semantic-correctness cases the rubric now has the facts to catch. DONE as a prototype.
