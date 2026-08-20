# 2.1.2 region identification, and the tools-ON test of the composite-group rubric clause

Two items carried over from the 2026-08-19 FP batch (`8f964d9e`), both explicitly deferred there as
"needs its own measurement". Neither is a new investigation; both are the measurement.

- **A.** `TRAP_REGION_SEL` was being used as a region *resolver* with no fallback, so on a page whose
  confining container is role-less the region collapsed onto the control and a real trap read as an escape.
- **B.** `field-programmatic-association-v0`'s composite-input-group clause was reverted as *untested* —
  not refuted — because its target FP family does not reproduce in the tools-OFF fixed-evidence replay.

---

## A. Region identification

### The defect

`runKeyboardTrapEscape` resolved its region as `el.closest(TRAP_REGION_SEL) || el`. The selector answers a
different question from the one being asked of it. Its job is *"is this container worth **enumerating** as a
trap candidate"*, where deliberate over-matching is harmless because a confirmation gate follows — its own
comment says so. As a **resolver** it has no fallback, and `|| el` is not one: when nothing matches, the
region becomes the control itself, every sibling is outside it, and the first Tab reads as *"focus left the
region"*.

The shape that triggers it is ordinary: a `<section class="filters">` or `<div class="carousel">` that
confines focus but is role-less and carries none of the modal-ish class words. Root-caused twice on the
corpus (residual RCA, 2026-08-15) on exactly those two containers.

A second route into the same collapse was found while fixing the first, and it is not reachable from the
wrapper-shaped fixtures: `closest()` starts **at** the element, so a control whose own class carries a
modal-ish word — `<input class="popup-search">` — matched *itself*. The search now starts at the parent.

### The repair

Nearest ancestor that is a usable trap boundary, under two invariants, then the old fallback:

1. **≥ 2 visible focusables inside** — a one-control "region" makes every sibling move an escape, which is
   the collapse restated one level up.
2. **≥ 1 visible focusable outside** — otherwise "focus left the region" is unobservable *by construction*.

Invariant (2) is the one doing the safety work, and it is why the walk needs no explicit stop-list: `<body>`
holds every focusable in the document, so it can never qualify. Without it, the walk climbs until something
contains two focusables, lands on `<body>` or `<main>`, and then a document-wide tab ring that wraps at its
end satisfies `cycledBackToStart` with no escape — **a confirmed trap on every page in the corpus**. The
repair's two failure directions are pinned against the same fixture for that reason.

Invariant (2) is deliberately **not** applied to the `closest()` hit. There the author declared a boundary
and that path is already validated; requiring escape-observability of it would abstain on a full-screen
modal over inert background content, which is a real trap.

### Abstain vs fall back — measured, not argued

The first implementation abstained when no bounded group existed. That is the more obviously "sound" choice
and it was wrong. Across the 55 corpus 2.1.2 pages, 383 visible focusables resolve as:

| resolution | count | share |
| --- | ---: | ---: |
| declared region (`TRAP_REGION_SEL` matched an ancestor) | 66 | 17.2% |
| inferred bounded group | 257 | 67.1% |
| neither | 60 | **15.7%** |

The 60 are overwhelmingly lone controls sitting outside every component — a skip link, a lone submit. For
those the control **is** the component, and "focus can be moved away from this control" is exactly the
per-control claim the experiment is asked to settle. Abstaining would have cost a sixth of the lane and
bought no soundness. The group-scale question on such a page belongs to the kbd-graph instruments, which
scan regions directly instead of climbing from one control.

The anchor is now reported (`regionAnchor`: `trap-region-selector` / `focusable-group-ancestor` /
`control-fallback`), so a control-scale clear is distinguishable downstream from a region-scale one.

### Before/after, same four fixtures

| fixture | HEAD `8f964d9e` | repaired |
| --- | --- | --- |
| plain `<section>`, real both-direction confinement | `escapeProven` ✅ — **false CLEAR** | `trapProven` ✅ |
| same page with `class="modal"` (declared path) | `trapProven` ✅ | `trapProven` ✅ *(unchanged)* |
| plain `<section>`, no confinement | clear | clear *(unchanged)* |
| group holds every focusable in the document | `escapeProven` ✅ — **unfalsifiable CLEAR** | control-scale clear, no region-scale claim |

Row 1 is the defect. Row 4 is the one HEAD got wrong in a way nobody had noticed: with the region collapsed
onto the input, Tab-to-the-button was recorded as an escape on a page where escaping is impossible.

### What was deliberately not changed

`TRAP_REGION_SEL` itself is untouched, and the reason is a second finding rather than caution.

**The constant is defined twice.** `kbd-graph.js` exports it; `act-page-collect.js:776` carries a
character-for-character inline copy inside its `focusRisk` predicate, with a comment naming the original.
The two are identical today, so this is a latent hazard rather than a live bug — but it means *widening the
constant would silently diverge them*, and the divergence would land on obligation **minting**: pages whose
containers the new list matches would gain 2.1.2 obligations that `focusRisk` still refuses to enumerate.
Any widening must single-source the selector first. `act-page-collect.js` currently carries another agent's
uncommitted work, so that repair is filed rather than made here.

**The list's gaps are far smaller than a grep suggests.** An earlier draft of this report counted them with
`grep -l` — pages containing the string `role="alertdialog"`, `popover`, and so on — and reported "30 pages
the enumerator cannot see". **That was wrong, and the error is instructive.** A page containing the string
tells you nothing about whether the element is already matched by a *different* term in the same selector,
and authors who reach for `role="alertdialog"` also write `aria-modal="true"` or `class="dialog"`.

Queried against the actual DOM of all 1,769 corpus pages, per element rather than per page:

| container shape | elements | already matched | by which existing term |
| --- | ---: | ---: | --- |
| `role="alertdialog"` | 4 | **4 — all** | `[aria-modal=true]`, `[class*=dialog i]` |
| `popover` | 1 | **1 — all** | `[role=dialog]` |
| `role="application"` | 4 | 0 | *genuinely unmatched* |
| `role="treegrid"` | 1 | 0 | *genuinely unmatched* |

The real gap is **five elements**, four of which are `role="application"` — the one term worth holding back
regardless, since an application region is *expected* to intercept keys and is therefore the shape most
likely to look trapped to a Tab-only probe.

`alertdialog` remains defensible on principle — ARIA makes it a subclass of `dialog`, and the selector names
`dialog` but not it — but adding it changes **zero elements today**. That is forward-looking robustness for a
page that uses `alertdialog` without a modal attribute or class, not a fix for anything measured.

Both findings are deferred deliberately. Widening the candidate set changes what gets minted and what the
reveal pass and the late-arrival gate fire on — a different blast radius from the resolver fix, and it needs
its own gate rather than a ride on this one.

---

## B. The composite-group rubric clause, tested on a live pipeline

### What the test had to establish first

The clause was reverted as **untested**, not refuted, for a specific reason: in the fixed-evidence judge
replay, all five `form-label-and-group-relationships-by-context` FPs it was written for come back
`missedAgree` in *both* arms. You cannot measure an edit on a population that does not appear.

So question one was reproduction, and only then effect. Design: the full 90-case 1.3.1 slice (the only SC
this rubric is routed for), three reps per arm, arms alternating so any drift in provider behaviour over the
hour is shared rather than loaded onto one. Both trees are HEAD `8f964d9e` plus the live corpus, and
`diff -rq` confirms they differ in exactly one file — the rubric.

### Correction to the stated cause: this is a LIVE-vs-REPLAY difference, not a tools difference

The batch report attributed the replay's non-reproduction to *"the 585 run had tools ON; this replay is
single-shot tools-OFF"*. The conclusion — the evidence differs — was right; the mechanism named was wrong.

Measured here, with tools genuinely enabled, the whole 90-case slice makes **3, 0, 1** tool calls in the
three head reps. The runner's own guard fires on two of them: *"tools were ENABLED but ZERO tool calls were
made."* SC 1.3.1 barely uses the tool lane at all — the 585 run's 119 calls were dominated by
`resolve_destination` (50) and `interact_and_observe` (33), which are 2.4.4 and interaction tooling.

What actually differs between the 585 run and the replay is **live evidence collection versus frozen
packs**. That is what makes the family reappear, and it is worth keeping straight: it means a frozen-pack
replay is not a safe stand-in for a live run on structural SCs, whatever the tool setting.

### Q1 — reproduction: yes

| case | 585 | head r1 | r2 | r3 |
| --- | --- | --- | --- | --- |
| case-06 | FP | ok | FP | FP |
| case-09 | FP | FP | FP | FP |
| case-17 | FP | FP | FP | FP |
| case-18 | FP | FP | FP | FP |
| case-20 | FP | FP | FP | FP |

14 of 15 case-reps reproduce, against **0 of 5** in the fixed-evidence replay. The arms are comparable.

### Q2 — effect

| arm | FP mean (per rep) | TP mean (per rep) |
| --- | --- | --- |
| HEAD rubric | **5.7** (5, 6, 6) | 28.3 (30, 29, 26) |
| + composite-group clause | **2.7** (4, 3, 1) | 28.3 (29, 28, 28) |

FP −3.0 at **identical** recall. Within the target family: FP 4.7 → 1.0, family TP unchanged at 4.0.

The aggregate alone would be arguable — the treated arm's own per-rep spread (1..4) is as wide as the gap.
The per-case table is what carries it:

| case | head (of 3) | new (of 3) |
| --- | ---: | ---: |
| family case-09 / -17 / -18 / -20 | 3 | **0** |
| family case-06 | 2 | **0** |
| family case-07 | 0 | 2 |
| family case-11 | 0 | 1 |
| layout-table…case-07 | 0 | 2 |

Every one of the five target cases moves the same direction in every rep — 14 flagged case-reps to 0. Noise
does not land 14 coin flips one way. Recall churn is ±1 on two unrelated cases.

### The new FPs are the clause's own escape hatch misfiring

The clause introduces FPs on three cases, and they are not composite groups at all. `case-07` and `case-11`
are the same "Reserve a tasting" form, where **every field has a visible `<label for=…>` correctly wired to
it** — clean passes with nothing for this rubric to be confused by.

The clause's last sentence is the suspect:

> Flag the group instead when the wrapper is genuinely unnamed — a bare `<div>` holding the parts, with the
> question sitting in loose text no element references …

Both pages wrap their fields in `<div class="grid">`. A weak judge reading that sentence has a licence to
flag any `<div>`-wrapped form, which is nearly every form. So a third arm is running with that one sentence
removed and nothing else changed.

**Overfit caveat, stated up front:** the trim is motivated by a mechanism, but it is being measured on the
same 90 cases that motivated it. Whatever it shows needs held-out confirmation before the clause is treated
as settled.

---

## C. What the region repair uncovered — a second, hidden defect

The region repair was validated against the human-annotated 2.1.2 corpus (39 cases, deterministic no-LLM,
three reps per arm — every rep byte-identical within its arm, so the lane is genuinely deterministic):

| arm | tp | fn | fp | tn |
| --- | ---: | ---: | ---: | ---: |
| HEAD | 25 | 2 | 1 | 11 |
| + region anchor | 25 | 2 | **2** | 10 |
| + region anchor + widened grammar | 25 | 2 | 1 | 11 |

Every arm is byte-identical across its three reps, so these are exact, not means. The region anchor alone
leaves recall unmoved and adds **one false positive**; the combined change removes it again. Rather than accept it, the flip was root-caused:
`multi-element-region-loop-tab-must-exit/case-06`, which goes `noObligation` → `caught`.

The page is a football club's live-commentary `<aside class="live">`. Tab and Shift+Tab both cycle inside
it — a genuine, deliberate confinement — and it says:

> This live panel keeps keyboard focus while updates stream in. **Press Ctrl+M at any time to skip past the
> panel** and continue down the page.

`Ctrl+M` is really bound, and it really moves focus to the footer. The page **passes** 2.1.2 under the
advised-exit exception, and the corpus label is right.

`parseAdvisory` returned `null` on that sentence. Two gaps, both in the grammar shipped in the previous
batch:

1. the verb set had no `skip`;
2. nothing was allowed between the key and its purpose clause — the pattern permitted only an optional
   literal `"key"`, so `Ctrl+M` **at any time** `to skip` could not match.

An unparsed advisory *asserts* a trap, so the page scored as a keyboard trap.

**This is the interesting part.** The gap was not introduced by the region repair — it was already there, and
it was **unreachable**. The collapsed region cleared every such page trivially, before any advisory was
consulted, so no advisory-grammar failure could ever change an outcome. Fixing region identification is what
made the grammar reachable, and the first thing it did was expose a page the grammar gets wrong.

The repair adds `skip`/`bypass`/`advance` to the verb set and a **bounded, lazy, sentence-local** gap between
key and purpose (`[^\s.!?]` keeps it inside one sentence, ≤ 4 tokens). Verified on the real page:

```
regionAnchor     : focusable-group-ancestor | regionFoc 5 | docFoc 14
advised          : true | key "m" | reserved false
advisedKeyEscapes: true
tabEscapes       : false | shiftEscapes false | cycled true
trapProven       : false | escapeProven true
```

Each repair alone gets this page **wrong, in opposite directions** — region-only asserts a trap on a
conformant page; grammar-only never sees the confinement. That conjunction is now pinned as an end-to-end
test rather than left to the two unit suites to imply.

Guards kept: the article rejection (`press a key to leave` → untestable, never a keystroke), the
sentence-boundary rule (`Press F2 at the top of the list. Use the menu to leave the panel.` → no key
stitched), and the conjunctive rule that a parsed key must still be **pressed and observed to work**.
Backtracking re-checked on adversarial input: 0.94 MB of near-miss prose in 2 ms, 1.81 MB in 4 ms.

### Q3 — the trimmed clause, and what it says about the mechanism

A third arm removed exactly one sentence — the clause's "flag the group instead when the wrapper is
genuinely unnamed" escape hatch — and changed nothing else.

| arm | FP mean (per rep) | TP mean (per rep) |
| --- | --- | --- |
| HEAD rubric | 5.7 (5, 6, 6) | 28.3 (30, 29, 26) |
| + clause | 2.7 (4, 3, 1) | 28.3 (29, 28, 28) |
| + clause, escape hatch trimmed | 2.7 (3, 3, 2) | 30.0 (29, 29, 32) |

Both variants cut FPs by the same ~3 per rep against HEAD, at no recall cost. That is the robust finding,
and it is the one to carry: **three reps do not separate the two variants** — the trimmed arm's higher
recall mean leans on a single rep of 32, and its FP mean is identical.

The escape-hatch hypothesis was **half right**, and the half that failed is the more useful half.

- It *did* explain the two family FPs it was proposed for: `case-07` and `case-11` — the same
  "Reserve a tasting" form, every field carrying a correctly wired visible `<label for=…>` — go to zero
  when the sentence is removed.
- It did **not** explain `layout-table-fabricating-data-semantics/case-07`, which the clause flags in both
  variants and, if anything, slightly more often once trimmed (2/3 → 3/3).

That page is a `role="presentation"` layout table holding two ordinary, individually-labelled fields
("Registrant full name", "Approximate year of event"). So the leak is not the escape hatch — it is the
**premise**. Teaching the judge to look for composite input groups makes it find them where none exist: two
adjacent labelled fields become "parts", and the absent group wrapper becomes the defect. A rubric clause
changes verdicts outside its own subject, and no amount of trimming its qualifiers fixes that.

Trimming also brought family `case-20` back as an FP (0/3 → 3/3), which is the mirror image: the escape
hatch's contrast — *this is fine when named, flag it when unnamed* — was doing real work on that page.

**Decision: the FULL clause ships; the trim does not.** The ~3 FP/rep gain at neutral recall is measured,
reproducible, and consistent per-case across every rep, so the clause goes in. Between the two variants the
full one wins on the only grounds this run can settle:

- it achieves what the clause was written to do — **all five** target FPs go to zero, where the trim leaves
  family `case-20` back at 3/3;
- the trim was chosen *after* seeing which cases the clause broke, so it carries strictly more overfit risk
  than the clause itself;
- the trim's apparent recall edge is one rep of 32 against 29/29, and its FP mean is identical.

The shipped text is byte-identical to the arm that was measured, and the arm labelled `head` was verified
byte-identical to the repo file — so the A/B compared what it claimed to.

`layout-table…case-07` ships as a known, stable cost: it is the clause's own FP, outside the family the
clause was written for, and unchanged by trimming — so it belongs to the premise, not the wording.

**Overfit status.** The clause itself was written from the 585 run's FPs and is now measured on the same
cases — this is a confirmation that the diagnosis was right, not a held-out result. The trim is worse off
still: it was chosen after seeing which cases the clause broke. Neither should be reported as generalising
until a slice nobody tuned against says the same thing.

### Why the scored corpus shows nothing, and where the repair actually lands

The combined change scores **identically to HEAD** on the 39 scored 2.1.2 cases. That is worth stating
plainly rather than burying: on the corpus available for scoring, this repair buys no recall. Its only
visible effect there was to surface the grammar bug, which it then also had to fix.

The reason is not that the shape is rare — it is that the shape is **disputed**. Six 2.1.2 cases are
excluded from the scored run as `needs-validation`, and one of them is
`multi-element-region-loop-tab-must-exit/case-05`, one of the two pages this defect was root-caused on in
the first place. The include-set drops exactly the cases that exercise the repair.

Run explicitly as a directional probe (never a score — these labels are unvalidated), one of the six moves,
and it is that one:

| case | expected | HEAD | repaired |
| --- | --- | --- | --- |
| `multi-element-region-loop…/case-05` | failed *(disputed)* | `noObligation` | `noVerdict` |

Probed directly, the page is a five-tag cloud whose **only** handler wraps Shift+Tab on the first tag.
Forward Tab is untouched and walks straight out into the related-articles list:

```
regionAnchor : focusable-group-ancestor | regionFoc 5 | docFoc 12
tabEscapes   : true   shiftEscapes: false   cycled: false
trapProven   : false  escapeProven: false        ⇒ INCONCLUSIVE
```

ACT `a1b64e` requires escape in **one** direction, so a working forward Tab means this is not a 2.1.2
failure — which is why the case carries `needs-validation` while its `expected` still reads `failed`.

So the repair's effect on this page is: HEAD could not see the component at all (`noObligation`); the
repaired harness sees it, observes the two sweeps disagree, and **withholds both verdicts**. That is the
right answer, it is reached for the right reason, and it is the behaviour pinned by the one-way-conflict
test. Turning blindness into a principled abstention does not move a score, and should not be sold as if
it did.

---

## Gate

ACT 581 held-out gate, **both arms run fresh in this session, same machine, serial** (the runner is serial
per case by design and timing-sensitive on 2.1.2/1.4.13, so the arms never overlap). Base is pristine HEAD
`8f964d9e` in a clean worktree; proposed is that tree plus the two changed files and nothing else, confirmed
by `git status`.

| | tp | fn | fp | tn | tnWithClear | outOfScope | error | total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| base | 13 | 101 | 1 | 262 | 9 | 195 | 0 | 581 |
| proposed | 13 | 101 | 1 | 262 | 9 | 195 | 0 | 581 |

**Zero delta on every field, and zero deltas across all 581 rows** compared row-by-row rather than by
totals — so no offsetting pair is hiding inside an unchanged count.

The base arm also reproduces the previous batch's recorded reference (`v3-act-subset-r5-gate-prop2`)
field-for-field, which is what makes it trustworthy as a baseline rather than merely self-consistent.

Two process notes, because both nearly produced a wrong answer:

- The first gate attempt was launched in the **main working tree**, which carries another agent's
  uncommitted changes to `act-page-collect.js`, `orchestrator.js` and five further pipeline files. It would
  have measured their work as this change's. Killed and re-run in worktrees.
- The worktrees initially lacked `eval/checker-comparison/node_modules` (untracked, so `git worktree add`
  cannot supply it), which silently disabled the QualWeb lane — *"qualweb start failed (lane inert this
  run)"*. Comparable between arms, but not comparable to the reference. Symlinked and re-run. The exact
  match with the recorded baseline is the evidence the environment is now right.

A third attempt wedged at case 302/581 with the node process at 0.1% CPU on a Chrome that never answered.
The rule it stopped on (`2t702h`) completes fine in isolation, so it was environmental. The gate driver now
carries a watchdog: if an arm's log goes untouched for five minutes, kill and retry it from the top, and say
so — a silent stall is indistinguishable from slow progress, which is how twenty minutes were lost.

---

## Tests

| suite | result |
| --- | --- |
| full `npm test` | **1502 tests, 1501 pass, 0 fail, 1 skipped** (10.9 min) |
| new `kbd-trap-region-anchor.test.js` | 8/8 — the defect, the two directions it must not move, the abstention boundary, and the one-way corpus shape |
| `kbd-trap-advised-exit.test.js` | 9/9 — 2 rewritten for the new anchor, 1 added for the control-fallback advisory read, 1 added for the gapped-advisory conjunction |
| grammar on adversarial input | 0.94 MB near-miss prose in 2 ms; 1.81 MB in 4 ms — no backtracking blowup |

## Summary

| | change | evidence |
| --- | --- | --- |
| **A** | region resolved to a bounded ancestor, control fallback kept | fixture before/after; 15.7% measurement behind keeping the fallback; ACT 581 zero delta, zero rows |
| **B** | advisory grammar: `skip`/`bypass`/`advance` + bounded sentence-local gap | removes the +1 FP the region fix caused; real page verified end-to-end |
| **C** | composite-group rubric clause | FP 5.7 → 2.7 per rep at neutral recall; 5 target cases 3/3 → 0/3 |

**Deterministic changes are gate-clean.** ACT 581: zero delta on every field and on every one of 581 rows,
with the base arm reproducing the recorded reference exactly. 2.1.2 corpus: identical to HEAD.

**The rubric clause ships in its full form**, byte-identical to the measured arm. It is a genuine, measured
improvement — and it is still a prompt change tested on the cases that motivated it, with a stable cost of
its own outside its subject. Treat the ~3 FP/rep as confirmed on this slice, not as a generalisation.

### What this round is actually about

The region defect was worth fixing on its own terms, but the thing worth remembering is what it was hiding.

An unsound clear is not just a wrong answer — it is a **shadow over everything downstream of it**. While the
region collapsed onto the control, every role-less confinement cleared before the advisory was ever read, so
no advisory-grammar defect could change any outcome. The grammar bug was not latent in the sense of rare; it
was latent in the sense of *unreachable*. Repairing the first defect is what made the second one cost
something, and the deterministic 2.1.2 corpus registered that as a regression — which is exactly what a
useful measurement should do.

The corollary is uncomfortable and worth keeping: a **zero-delta gate does not mean a change is inert**. This
one is zero-delta on all 581 rows and identical on the scored 2.1.2 corpus, and it still fixed two real
defects and changed a real page's disposition from blindness to a correct abstention. The gate's job is to
catch regressions, not to price improvements, and a change whose value lands on cases the include-set drops
will look free and read as pointless.

One more, added after the fact and worth as much as either repair: **the first version of this report
measured that gap with `grep -l` and got it wrong by roughly an order of magnitude.** Counting *pages that
contain a string* answered a different question from *elements the selector fails to match*, and the two
diverge precisely because authors pile redundant signals onto the same element. The habit that catches it is
the same one that produced the 15.7% fallback measurement and the noise floors elsewhere in this batch:
query the artefact you actually care about, not a text proxy for it.

### Filed, not fixed

- **`TRAP_REGION_SEL` is defined twice** — `kbd-graph.js` and an inline copy in `act-page-collect.js:776`.
  Identical today, so latent; but widening one would diverge them, and the divergence would land on
  obligation *minting*. Single-source before any widening. Not done here because that file carries another
  agent's uncommitted work.
- **The selector's own gaps — measured, and small.** Five elements across 1,769 corpus pages are genuinely
  unmatched (`role="application"` ×4, `role="treegrid"` ×1); every `alertdialog` and `popover` in the corpus
  is already matched by a sibling term. **Recommendation: consolidate, do not widen.** The terms that would
  add the most coverage are the ones that should not be added — `role=radiogroup` alone would create 11 new
  candidate regions and mint **36 new obligations**, and a radiogroup is an ordinary form-control group, not
  a focus-trapping region. Those obligations do not become deterministic false positives; they become
  autoPartials, which is LLM-lane surface, and 47 of the 49 FPs in the 585 run were LLM-lane. Measured cost
  of the other candidates: `class*=sheet` 32 obligations, `class*=flyout` 13, `class*=drawer` 7,
  `role=application` 4.
- **`layout-table-fabricating-data-semantics/case-07`** — the composite-group clause's own stable FP, outside
  the family it was written for. Worth a look before the clause ships.
