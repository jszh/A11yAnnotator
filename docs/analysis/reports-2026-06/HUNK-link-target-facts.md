# Hunk to apply: link-target facts (`llm-adjudicator.js`)

`llm-adjudicator.js` is held by the lead; this is supplied to apply, not applied here. Everything else in
the lane is landed:

| file | change |
|---|---|
| `scripts/v3/lib/collect-link-facts.js` | new `collectLinkTargetFacts()` + export |
| `scripts/v3/lib/act-page-collect.js` | runs it under `liveEval`; joins onto elements by xpath as `element.linkTargetFacts`; also adds `mousemove`/`pointermove` to the 1.4.13 hover-trigger listener set |
| `scripts/v3/llm-rubrics/link-purpose-v0.md` | reads `signals.linkTarget` as the destination evidence for the contradiction mode |
| `scripts/v3/tests/llm/link-target-facts.test.js` | collector (fragment/heading resolution, missing target, terminal segment/extension, same-name flag, `area[href]`) + the act-page-collect join |
| `scripts/v3/tests/coverage/collector-liveness.test.js` | `collectLinkTargetFacts` added to `GUARDED_COLLECTORS`; fixture given fragment/file links so the hot loop runs |

**WHY.** The 2.4.4 name-contradicts-destination mode needs to know what the destination IS. For a
same-document fragment (`href="#…"`) that previously required a stochastic `resolve_destination` tool call —
a judge that made the call caught the contradiction, a judge that didn't cleared it, and the tool's
screenshot/OCR path is lossy on RTL text where the DOM is exact. The collector resolves the fragment target
in the DOM at collect time (no network, no tool budget, no variance) and additionally states, per link, the
href's terminal path segment / file extension and whether another link on the page shares this trimmed name
while resolving to a different href.

`element.linkTargetFacts` does not exist anywhere before this change, so the branch cannot fire on any
current record and every existing prompt stays byte-identical until the collector lands.

---

## HUNK — surface `s.linkTarget` for link subjects in the `name-role-state` skill

### Anchor (currently ~line 616–619, the tail of the `s.enclosingContext` branch inside `if (skill === 'name-role-state')`, immediately before the `// Item 12` comment)

```js
            : 'this link sits within enclosing block text that MAY disambiguate it — judge whether the name TOGETHER WITH this enclosing-block context identifies the link purpose.',
      };
    }
    // Item 12 (composite name-role-state): surface the already-collected states/axStates bundle so the rubric can
```

### Insert between `}` and the `// Item 12` comment

```js
    // 2.4.4 LINK-TARGET FACTS (residual RCA S10) — collected per link by collect-link-facts.js and joined by
    // xpath in act-page-collect.js. DOM-RESOLVED and deterministic: for a same-document fragment href the
    // collector resolved the target element IN the document (exists? what does its own heading / accessible
    // name say?); for every link it states the href's terminal path segment + file extension and whether
    // another link on the page shares this trimmed name while resolving to a DIFFERENT href. Replaces a
    // stochastic resolve_destination call on the fragment-destination question with a fact. Not a detector:
    // it MINTS nothing and changes no routing.
    if (element.linkTargetFacts && typeof element.linkTargetFacts === 'object'
        && (element.tag === 'a' || element.tag === 'area' || element.axRole === 'link' || element.roleAttr === 'link')) {
      s.linkTarget = {
        ...element.linkTargetFacts,
        uncertainReason: 'DOM-RESOLVED destination facts for THIS link (no tool call, no OCR). When `fragment` is present the href is a same-document fragment: `targetExists` says whether the target element exists in the DOM, and `targetHeadingText` / `firstHeadingText` / `targetName` are what the destination says it is, in its own words — AUTHORITATIVE over screenshots/OCR for what the fragment destination is; judge name-vs-destination agreement against these strings, and treat targetExists:false as a destination the name cannot be describing. `terminalSegment`/`extension` are the href\'s final path segment and file type — a name that presents the destination as an article/page while the href ends in a downloadable file describes the wrong purpose. `sameNameDifferentTarget:true` means another link on this page shares this trimmed name but resolves to a DIFFERENT href (the identical-names mode\'s precondition); false means the name is unique here or all bearers go the same place. The asymmetry stands: these facts may REFUTE a name, never RESCUE a vague one.',
      };
    }
```

### Byte cost

≈ 1.5 KB per link subject (dominated by the fixed note), only on subjects whose element carries
`linkTargetFacts` — i.e. links the collector enumerated (`a[href]` / `area[href]`, capped at 300/page).
The fragment block only exists on same-document fragment links; a plain external link carries ~60 bytes of
facts plus the note.

### Pre-registered targets (for the paired re-run)

- `2.4.4/descriptive-name-contradicts-on-page-destination/case-03` (fragment target is a heading)
- `2.4.4/descriptive-name-contradicts-on-page-destination/case-04` (fragment target is a container whose first inside heading names it)
- `2.4.4/descriptive-name-contradicts-on-page-destination/case-05` (RTL — DOM string replaces the lossy OCR path)
- `2.4.4/icon-link-name-present-but-wrong-or-meaningless/case-05` (terminal segment + extension)
- enables Tier 2 #10 (3.3.1 page-level error-summary correspondence rides on the same fragment resolution)
