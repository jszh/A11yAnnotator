# Builder worklist — ACT-subset cases the harness gets wrong

Generated from `eval/checker-comparison/upstream-evidence/v3-act-subset/raw.json` (312 decided cases). Two jobs: **(A)** make the BOTH-FAIL cases
pass (v3 ∪ axe currently miss a real failure — FN→TP), and **(B)** eliminate v3's false barriers.

Each case is a local file: `eval/checker-comparison/act-subset/<localPath>`.

## A. BOTH-FAIL — 16 ACT-failed cases neither v3 nor axe catches (build to CATCH)

By SC: **1.4.5**:5 · **2.4.2**:3 · **1.1.1**:3 · **1.4.3**:3 · **2.1.1**:1 · **4.1.2**:1

| SC | rule | testcaseId | v3 status | axe status | backdrop | localPath |
|---|---|---|---|---|---|---|
| 1.1.1 | qt1vmo | `485f10faf2` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/qt1vmo/485f10faf222cd48fea2ab3ee79c2d354e51ea33.html` |
| 1.1.1 | qt1vmo | `2f7d82593e` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/qt1vmo/2f7d82593e287df64b7459695e355a840254255c.html` |
| 1.1.1 | qt1vmo | `bac67a5a2a` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/qt1vmo/bac67a5a2ada971100bbec89961ad3e6c869f268.html` |
| 1.4.3 | afw4f7 | `e8f3acb1dc` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | review (abstained) | gradient | `pages/afw4f7/e8f3acb1dc814b8b815c69b7150cdea67d5bd98e.html` |
| 1.4.3 | afw4f7 | `41afaa9b33` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | review (abstained) | image-bg | `pages/afw4f7/41afaa9b33287aba9c608c3466e2b164f57a02ed.html` |
| 1.4.3 | afw4f7 | `bf47c65f28` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | review (abstained) | gradient | `pages/afw4f7/bf47c65f2854b6ac100a6f700d354b243b069231.html` |
| 1.4.5 | 0va7u6 | `80ff3d6a9f` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/0va7u6/80ff3d6a9f2de0b2b9f179a13d91d47ce8c9ab26.html` |
| 1.4.5 | 0va7u6 | `45041ac39e` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/0va7u6/45041ac39ebf8f9d8ff642ea0bb56e947f0ac76e.html` |
| 1.4.5 | 0va7u6 | `bf02394140` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/0va7u6/bf023941401d04f61ce739ee10fcc15f87d298a7.html` |
| 1.4.5 | 0va7u6 | `e1d4ed7556` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/0va7u6/e1d4ed7556dabfcfde47aaf4cd0861e0fdf585d9.html` |
| 1.4.5 | 0va7u6 | `6a7f199a37` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/0va7u6/6a7f199a37309ccab08941b0bc64e182770c29ac.html` |
| 2.1.1 | akn7bn | `62673162e2` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | silent (no rule) |  | `pages/akn7bn/62673162e22ee1e95e962522b1d1c3b549dbfc49.html` |
| 2.4.2 | c4a8a4 | `2c1397032a` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/c4a8a4/2c1397032aad720fe43dee2be0d326be56957320.html` |
| 2.4.2 | c4a8a4 | `1844d7bce8` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/c4a8a4/1844d7bce889d85a80b620468baa804eab3ff2c8.html` |
| 2.4.2 | c4a8a4 | `4c72b3b9b0` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/c4a8a4/4c72b3b9b06bf1edc3c959070731b65871ee0c8f.html` |
| 4.1.2 | 6cfa84 | `9812d828fe` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | review (abstained) |  | `pages/6cfa84/9812d828fef2da32081f4c0acce0c58912f071cb.html` |

## B. V3 FALSE BARRIERS — 0 ACT-not-failed cases v3 wrongly flags (ELIMINATE)

All are 1.4.3 `text-contrast-pixel` BARRIER on a not-failed case → audit §B5 (abstain on glyph effects / composited backdrops).

| SC | rule | testcaseId | expected | backdrop | localPath |
|---|---|---|---|---|---|

## How to iterate on one rule

To work a single rule (offline, fast inner loop) instead of the whole subset, pass `--rule=<ruleId>`
— it loads only that rule's mirrored cases, runs v3 + axe, and prints the lanes:

```bash
# e.g. the composited-contrast rule from the worklist above
node eval/checker-comparison/run-v3-act-suite.js --subset --local --axe --rule=afw4f7 --max-auto=10 --element-cap=60
```

Swap `--rule=afw4f7` for any `rule` id in the tables above. Add `--sc=1.4.3` to further narrow by SC,
or open a single case directly in a browser via its `localPath`:
`file://$PWD/eval/checker-comparison/act-subset/<localPath>`.

> Note: a scoped run overwrites `upstream-evidence/v3-act-subset/{raw,summary}.json` with just that
> rule. Re-run the full suite (`--limit=0`, drop `--rule`) to restore the complete numbers, then
> `node eval/checker-comparison/build-worklist.js` to regenerate this list.
