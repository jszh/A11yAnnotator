# Hunks to apply: text-less colour-token lane wiring (`act-page-collect.js`, `llm-adjudicator.js`)

The colour-token lane (residual RCA s10 Tier 3 — status-dot matrices: empty spans coloured by class, spread
across parents, that the main colour-peer lane structurally cannot see) is landed in `collect-colour-peers.js`
but ships **DISABLED**: `collectColourPeers(opts)` runs the lane only when handed `{ tokenLane: true }` (or the
in-page escape hatch `window.__V3_COLOUR_TOKEN_LANE = '1'`). Every current call site passes no argument, so
production output is byte-identical today. `act-page-collect.js` and `llm-adjudicator.js` are held by the
lead; the hunks below are supplied to apply, not applied here.

| file | change |
|---|---|
| `scripts/v3/lib/collect-colour-peers.js` | token lane in `collectColourPeers(opts)`, flag-gated, additive `tokenLane: true` + `legendText` on token groups only |
| `scripts/v3/lib/vision-capture.js` | (separate fix, same branch) `<area>` crops via owning `img[usemap]` + `areaCoordsToRect` export |
| `scripts/v3/tests/llm/colour-token-lane.test.js` | 14 pure-node tests — every conjunct individually broken, flag off/on, payload discipline, S8 self-containment |
| `scripts/v3/tests/llm/colour-token-lane.browser.test.js` | in-browser mirror (PENDING lead gate — not yet executed) |
| `scripts/v3/tests/llm/area-crop-vision.test.js` | 18 pure-node tests — coords parser + captureVision clip plumbing |
| `scripts/v3/tests/llm/area-crop-vision.browser.test.js` | in-browser mirror (PENDING lead gate — not yet executed) |
| `scripts/v3/tools/measure-colour-token-aperture.js` | the held-out aperture measurement the RCA requires BEFORE enablement |

**Order of operations (the RCA's requirement):**
1. run `node scripts/v3/tools/measure-colour-token-aperture.js` over the corpus roots (post-run only — it
   reads the same pages a live run reads) and hand-review every firing page;
2. only if the aperture is acceptable (guidance in the script header: the main lane's accepted regime is 84%
   of pages zero groups / mean 0.23 / p90 1 — the token lane must sit well inside that), apply HUNK A and set
   `V3_COLOUR_TOKEN_LANE=1` on the runs that should carry it;
3. apply HUNK B together with (or before) HUNK A — without it a token group reaches the judge described as a
   text-carrying peer set, which is exactly wrong for this shape.

**No other file needs changing.** Verified against the current tree: `build-v3.js` mints the group obligation
from `bundle.collect.structure.colourPeerGroups` on `members[0].xpath` (its colour-group loop and the
`colourGroupAnchors` in-scope set) with no per-group filtering, so token groups mint the moment the collector
emits them; `llm-adjudicator.js`'s `selectRubricSubjects` threads `__colourPeerGroup` by
`members[0].xpath === baseEl.xpath`, which token groups satisfy identically. Disabled flag ⇒ no groups ⇒ no
mints ⇒ byte-identical runs, so both hunks are inert until step 2.

---

## HUNK A — `act-page-collect.js`: thread the env flag as the evaluate argument (required to enable)

`collectColourPeers` is self-contained for `page.evaluate` (the S8 contract forbids it reading `process.env`
in-page), so the Node-side env read belongs to the caller. `liveEval` currently cannot pass an argument.

### Anchor 1 (the `liveEval` helper, ~line 1321)

```js
  const liveEval = async (name, fn, empty) => {
    try { return await page.evaluate(fn); } catch (e) {
```

### Replace with

```js
  // `arg` (optional) is forwarded as the evaluate argument — used by collectColourPeers to receive the
  // Node-side V3_COLOUR_TOKEN_LANE flag (the collector is self-contained and must not read env in-page).
  const liveEval = async (name, fn, empty, arg) => {
    try { return await (arg === undefined ? page.evaluate(fn) : page.evaluate(fn, arg)); } catch (e) {
```

Every existing call site omits `arg`, so every other collector's evaluate is byte-identical.

### Anchor 2 (the collectColourPeers call, ~line 1335)

```js
  const colourPeerGroups = await liveEval('collectColourPeers', collectColourPeers, []);
```

### Replace with

```js
  // V3_COLOUR_TOKEN_LANE=1 (default off) additionally nominates text-less colour-token groups (status-dot
  // matrices) — see collect-colour-peers.js's token-lane header and HUNKS-colour-token-lane.md. The flag may
  // not be set on any scored run until the held-out aperture measurement has been reviewed.
  const colourPeerGroups = await liveEval('collectColourPeers', collectColourPeers, [],
    { tokenLane: process.env.V3_COLOUR_TOKEN_LANE === '1' });
```

With the env var unset this passes `{ tokenLane: false }`, which the collector treats identically to no
argument (pinned by `colour-token-lane.test.js` §1).

---

## HUNK B — `llm-adjudicator.js`: describe a token group truthfully in the prompt

The `s.colourPeerGroup` block's fixed note states the members are "IDENTICAL on every non-colour axis … " and
that "text-less swatches are already excluded" — for a token group the first list names axes that were not
measured and the exclusion claim is false, so an enabled lane would hand the judge a self-contradictory
signal. `g.tokenLane` does not exist on any group until the lane is enabled, so this hunk is byte-identical
today (same argument as HUNK C/D in `HUNKS-contrast-controlgroup-atrest.md`).

### Anchor (currently ~line 773)

```js
  if (element.__colourPeerGroup) {
    const g = element.__colourPeerGroup;
    s.colourPeerGroup = {
      members: (g.members || []).slice(0, 12),
      distinctColours: g.distinctColours,
      note: 'These elements are STRUCTURAL PEERS (same tag, same role, same parent) that are IDENTICAL on every '
```

### Replace with

```js
  if (element.__colourPeerGroup) {
    const g = element.__colourPeerGroup;
    s.colourPeerGroup = {
      members: (g.members || []).slice(0, 12),
      distinctColours: g.distinctColours,
      ...(g.tokenLane === true ? { tokenLane: true, legendText: g.legendText || undefined } : {}),
      note: g.tokenLane === true
        ? 'These elements are TEXT-LESS COLOUR TOKENS: the same tag and class, spread across DIFFERENT '
          + 'parents, each painting its own background, with no text of their own — and the same token class '
          + 'also appears inside a text-bearing context (legendText). The SET is the question, not the anchor '
          + 'element alone. What is yours to judge: whether the colour codes information (a status, a '
          + 'category), and whether that information is available in text AT THE POINT OF USE — a legend '
          + 'elsewhere that only NAMES the colours does not by itself make each token readable without colour '
          + 'perception (G14). A token set whose meaning is also conveyed per-instance in text, a pattern, or '
          + 'an icon is not a failure.'
        : 'These elements are STRUCTURAL PEERS (same tag, same role, same parent) that are IDENTICAL on every '
```

(the original note string continues unchanged as the `:` arm, through its final `'… an accessible name).',`)

### Byte cost

Token groups only: ~0.2 KB for the flag + legendText, and the note swap. Ordinary peer-group prompts are
byte-identical; with the lane disabled everything is byte-identical.

---

## Aperture measurement — how to run

```
node scripts/v3/tools/measure-colour-token-aperture.js
  # defaults: eval/act-augmented + eval/checker-comparison/act-subset/pages + eval/checker-comparison/act-rest/pages
node scripts/v3/tools/measure-colour-token-aperture.js --roots eval/checker-comparison/act-rest/pages --limit 200
node scripts/v3/tools/measure-colour-token-aperture.js --out /tmp/colour-token-aperture.json --concurrency 6 --verbose
```

POST-RUN ONLY (it loads the same corpus pages a live run reads). It launches headless Chrome
(`CHROME_PATH`/`PUPPETEER_EXECUTABLE_PATH` respected), evaluates the real `collectColourPeers` with
`{ tokenLane: true }` on every page, and prints every firing page with its group keys and `legendText`, plus
firing-rate / mean / p90 / max aggregates. Exit 1 if >5% of pages fire (clearly too loose); exit 0 means
"inside the review band — hand-review each listed page before enabling".
