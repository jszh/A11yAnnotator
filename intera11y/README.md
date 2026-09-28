# InterA11y

A WCAG 2.2 checker for 12 success criteria that need the page to be driven — by keyboard, pointer, activation,
form submission — and/or an agent that gathers more evidence, and that have validated labels to measure against:
2.1.1, 2.1.2, 2.4.3, 2.4.7, 1.4.13, 4.1.3, 3.3.1, 4.1.2, 1.4.1, 2.4.4, 1.4.3, 1.1.1.

- [DESIGN.md](DESIGN.md) — the pipeline, data model and principles.
- [COMPARISON-WITH-GENA11Y.md](COMPARISON-WITH-GENA11Y.md) — what is adopted, modified and added relative to GenA11y.
- `rubrics/<sc>.js` — each criterion's test rules in GenA11y's format, with each rule's tools and rubric; the judge
  gets variant `v1` (rules + tools) or `v2` (v1 + rubric) — `INTERA11Y_RUBRIC=v1|v2`, default v2.

## Running

```
node intera11y/bin/intera11y.js --corpus=validated-dev|validated-test|act|supplementary|saved-pages|expert-annotated|augmented-dev \
     [--sc=2.4.7,2.1.2] [--ids=a,b | --ids-file=f] [--limit=N] \
     [--out=name] [--pages=8] [--browsers=2] [--llm-conc=16] [--model=gemini-3.7-flash] [--effort=high]
```

Needs `GEMINI_API_KEY` in `.env`, Chrome (`CHROME_PATH`, default the macOS Chrome or `/usr/bin/google-chrome`),
and for `saved-pages` the annotator server (`A11Y_BASE`, default `http://127.0.0.1:3001`). Output goes to
`results/<out>/`; re-running with the same `--out` resumes. `expert-annotated` runs the saved pages but judges only
the elements annotated in the expert study (candidates ∩ annotated; every candidate for SCs with a page-scope case).

The page-wide LLM screening sweep is on by default; `INTERA11Y_SCREEN=0` turns it off. Every run also records
each criterion's verdict over the rule-based candidates alone (`verdictWithoutScreen`), and the scorer reports it
as a separate row, "InterA11y without sweep".

Scoring against GenA11y and the v3 harness on the same cases:

```
node intera11y/eval/score.js --act=<run> --supp=<run> --expert=<saved-pages run> [--json=out.json]
```

## Layout

```
bin/intera11y.js        corpus runner
src/core/               session (browser, fresh pages), deadline, page runner, resolution, config
src/model/              PageModel: element inventory + computed AX tree + exposure; axe-core evidence
src/probes/             keyboard, activation, pointer, forms, styles, content (+ shared before/after delta)
src/criteria/           one test specification per SC: identify → probes → assess → evidence → tools → screen
src/screen/             the screening sweep (per-SC element kinds, neutral selection prompt) and screened candidates
src/judge/              neutral prompt, batching, Gemini function-calling client, tool registry
src/lib/                v3 seam (the only import from scripts/v3), XPath conventions, PNG codec
rubrics/                one test procedure per SC
eval/                   corpus loaders, the fixed dev/test split, scorer
```
