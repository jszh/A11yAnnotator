# Builder worklist v2 — DRAFT (proposed-only) ACT cases the harness gets wrong

Generated from `eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json (draft-only cases)` (269 decided draft cases). Companion to the approved-only
[V3-ACT-WORKLIST.md](./V3-ACT-WORKLIST.md). Two jobs: **(A)** make the BOTH-FAIL cases pass (v3 ∪ axe
miss a real failure — FN→TP), and **(B)** eliminate v3's false barriers.

> **🆕 = draft-only SC** (2.4.6, 2.1.2, 2.4.10, 3.3.1) — no approved ACT rule reaches these, so these
> rows are the *first ACT signal* we have on them; they sort to the top of each table.

> **Caveat:** draft rules and their `expected` outcomes are **unstable** (under review upstream) — treat
> this list as *pipeline-polishing signal*, not an authoritative benchmark.

Each case is a local file: `eval/checker-comparison/act-subset/<localPath>`.

## A. BOTH-FAIL — 50 draft ACT-failed cases neither v3 nor axe catches (build to CATCH)

By SC: **2.4.4**:14 · **2.4.6**:10🆕 · **4.1.2**:8 · **2.1.2**:5🆕 · **1.1.1**:5 · **2.4.10**:4🆕 · **1.3.1**:3 · **3.3.1**:1🆕

| SC | rule | testcaseId | v3 status | axe status | backdrop | localPath |
|---|---|---|---|---|---|---|
| 2.1.2 🆕 | 80af7b | `f5ea9fd3b6` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | silent (no rule) |  | `pages/80af7b/f5ea9fd3b681971b2af4953fae9bb2d319a203c6.html` |
| 2.1.2 🆕 | 80af7b | `0ec0e93e7f` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | silent (no rule) |  | `pages/80af7b/0ec0e93e7f8ffca39e1eb58a4a8503f1bd4cb145.html` |
| 2.1.2 🆕 | 80af7b | `7dcc4ae007` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | silent (no rule) |  | `pages/80af7b/7dcc4ae00712889d448ecbcba200e032dca59bf0.html` |
| 2.1.2 🆕 | 80af7b | `8fba3918b3` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | silent (no rule) |  | `pages/80af7b/8fba3918b361f251dab4c19bec8eddc5624218ee.html` |
| 2.1.2 🆕 | 80af7b | `62fd24e73e` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | silent (no rule) |  | `pages/80af7b/62fd24e73ea55f55ad45de392128a816a6f03526.html` |
| 2.4.10 🆕 | 047fe0 | `7505d097f7` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/047fe0/7505d097f7d59d71dc7eb8f7ab82c5682def54d4.html` |
| 2.4.10 🆕 | 047fe0 | `81d501e520` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/047fe0/81d501e52085d9e5712e241bdd24708e7cb4a301.html` |
| 2.4.10 🆕 | 047fe0 | `929079705b` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/047fe0/929079705b1789667853e023b818eb4101630700.html` |
| 2.4.10 🆕 | 047fe0 | `4e34cac083` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/047fe0/4e34cac08353c5383b8743bffada2aaf3a780149.html` |
| 2.4.6 🆕 | cc0f0a | `9b967559ff` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/cc0f0a/9b967559ff2691dc30436766f53feea55447b348.html` |
| 2.4.6 🆕 | cc0f0a | `1e52060759` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/cc0f0a/1e52060759a535934176a5a981446066aad6b31f.html` |
| 2.4.6 🆕 | cc0f0a | `fa5104f9bd` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/cc0f0a/fa5104f9bd07fe52813d7e511c3cc87c4c1cf232.html` |
| 2.4.6 🆕 | cc0f0a | `649946098f` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/cc0f0a/649946098faf6f36b8232ea74fc3bae3cf8997e7.html` |
| 2.4.6 🆕 | cc0f0a | `2f1d964151` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/cc0f0a/2f1d964151ff5269a6027371956ee3b4a4a23fe7.html` |
| 2.4.6 🆕 | cc0f0a | `3ee841b751` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/cc0f0a/3ee841b7513a315f4f5161893d1333386f0f1d21.html` |
| 2.4.6 🆕 | b49b2e | `79cce8d893` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/b49b2e/79cce8d89309bea03e122d2917d340a525db4de0.html` |
| 2.4.6 🆕 | b49b2e | `acae544ba6` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/b49b2e/acae544ba63bf9c71988fb67d491c7d404164f52.html` |
| 2.4.6 🆕 | b49b2e | `6000a70ba2` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/b49b2e/6000a70ba2da9a828fa9c817ae6a0d2c092522fb.html` |
| 2.4.6 🆕 | b49b2e | `d76e8834b6` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/b49b2e/d76e8834b616356b2803586a8fbd0825a84e3fc8.html` |
| 3.3.1 🆕 | 36b590 | `d7863608ff` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | silent (no rule) |  | `pages/36b590/d7863608ff2aab99c43663cb3701c65c28b75c23.html` |
| 1.1.1 | e88epe | `e5b8fa7ab6` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/e88epe/e5b8fa7ab66409e7b52b335a8b6aebe11fd78635.html` |
| 1.1.1 | e88epe | `5d0c52f3b0` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/e88epe/5d0c52f3b06b60f712efaa08eb6947f18494c241.html` |
| 1.1.1 | e88epe | `9ff50232e7` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/e88epe/9ff50232e74195770418bcfb23c1508dfcef639a.html` |
| 1.1.1 | e88epe | `0d0061ffdf` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/e88epe/0d0061ffdf406f0d9b21aaa00f5d557e4137e0b2.html` |
| 1.1.1 | e88epe | `6d108d00cc` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/e88epe/6d108d00cc7a54f66547f02d7e7606342b11f801.html` |
| 1.3.1 | d0f69e | `664972feaa` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | review (abstained) |  | `pages/d0f69e/664972feaac1097f9365d73aac844c81fa927fa2.html` |
| 1.3.1 | d0f69e | `6bb6ca5dcd` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | review (abstained) |  | `pages/d0f69e/6bb6ca5dcdbd1fef063561f61de88740db24bd5d.html` |
| 1.3.1 | d0f69e | `1a0ee1b554` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/d0f69e/1a0ee1b5549d2f1eebd337e85cae8487331ab723.html` |
| 2.4.4 | 5effbb | `b2a671d96a` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/5effbb/b2a671d96ac510ccc6e34dd58a141d13bb196508.html` |
| 2.4.4 | 5effbb | `bf3ba787eb` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/5effbb/bf3ba787eb7a6819ea1a6adccdfd1f30842ed788.html` |
| 2.4.4 | 5effbb | `e6a7c92409` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/5effbb/e6a7c924092d2351c3a5b4361ccde7917ad23c66.html` |
| 2.4.4 | 5effbb | `98f0638a03` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/5effbb/98f0638a038a244b0bde70ff316cde1be7ce9a3b.html` |
| 2.4.4 | 5effbb | `43730455b6` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/5effbb/43730455b69439980b95151be477ca594e0d7556.html` |
| 2.4.4 | 5effbb | `45d884e81c` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/5effbb/45d884e81c4ef8234cfbd85d259dd6a64685c9d2.html` |
| 2.4.4 | fd3a94 | `9ceacbea5d` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/fd3a94/9ceacbea5df44a14dc17df2089edb134f22decd3.html` |
| 2.4.4 | fd3a94 | `8dc58c481c` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/fd3a94/8dc58c481c594488a331cd267974a324b97c9c98.html` |
| 2.4.4 | fd3a94 | `ef75d42424` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/fd3a94/ef75d42424140b163d7939aacc6a80c8dbc8816a.html` |
| 2.4.4 | fd3a94 | `f92350be3a` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/fd3a94/f92350be3a294ad1a41de6d7202f09bdd4e5d6c0.html` |
| 2.4.4 | fd3a94 | `0b01e772df` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/fd3a94/0b01e772dff47d4fd971ca4cfda2a9810843c10a.html` |
| 2.4.4 | fd3a94 | `dddcd76a61` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/fd3a94/dddcd76a61f61fa6652f847b66cd77fdcf7724cf.html` |
| 2.4.4 | fd3a94 | `7ebe961dbb` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/fd3a94/7ebe961dbb4fb0e259fc3bc98a8f048170b063af.html` |
| 2.4.4 | fd3a94 | `1379913f07` | no deterministic runner for this SC (LLM/vision or scanner-import territory) | silent (no rule) |  | `pages/fd3a94/1379913f0770843f89d37ceaad3a63e36f07924e.html` |
| 4.1.2 | kb1m8s | `17a785ed25` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | review (abstained) |  | `pages/kb1m8s/17a785ed25669522866f98997f76d69150243c8b.html` |
| 4.1.2 | kb1m8s | `358fa0b821` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | review (abstained) |  | `pages/kb1m8s/358fa0b821c3118de63adfbe37bd0e85a3bd6f8c.html` |
| 4.1.2 | kb1m8s | `1345bf067f` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | silent (no rule) |  | `pages/kb1m8s/1345bf067f66f2ee893f75e43d72121a0119d6b1.html` |
| 4.1.2 | kb1m8s | `7cddc927da` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | silent (no rule) |  | `pages/kb1m8s/7cddc927da518cc9b170051a9010e256068c875b.html` |
| 4.1.2 | kb1m8s | `c4a2fe12d5` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | review (abstained) |  | `pages/kb1m8s/c4a2fe12d5a48f7ace66475d3791e051ddefa807.html` |
| 4.1.2 | 4b1c6c | `c1cc2a71e8` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | review (abstained) |  | `pages/4b1c6c/c1cc2a71e88c5fec2bc41175d63339404747bf00.html` |
| 4.1.2 | 4b1c6c | `ac65ce86f3` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | silent (no rule) |  | `pages/4b1c6c/ac65ce86f38bce79d12b797567bb8d85875aab88.html` |
| 4.1.2 | 4b1c6c | `4d33680e81` | v3 runner ABSTAINED (auto-PARTIAL — out of its decidable sub-domain) | silent (no rule) |  | `pages/4b1c6c/4d33680e81b31e47fc46d3b6543cc050e369525b.html` |

## B. V3 FALSE BARRIERS — 0 draft ACT-not-failed cases v3 wrongly flags (ELIMINATE)

| SC | rule | testcaseId | expected | v3 status | backdrop | localPath |
|---|---|---|---|---|---|---|

## How to iterate on one draft rule

Work a single draft rule offline (fast inner loop) with `--proposed --rule=<ruleId>` — it loads only
that rule's mirrored cases, runs v3 + axe, and prints the lanes:

```bash
# e.g. a draft-only-SC rule from the worklist above
node eval/checker-comparison/run-v3-act-suite.js --subset --local --axe --proposed --rule=80af7b --max-auto=10 --element-cap=60
```

Swap `--rule=80af7b` for any `rule` id above. Add `--sc=2.1.2` to narrow by SC, or open a single
case in a browser via `file://$PWD/eval/checker-comparison/act-subset/<localPath>`.

> Note: a scoped run overwrites `upstream-evidence/v3-act-subset-proposed/{raw,summary}.json` with just
> that rule. Re-run the full draft suite (`--proposed --limit=0`, drop `--rule`) to restore complete
> numbers, then `node eval/checker-comparison/build-worklist-proposed.js` to regenerate this list.
