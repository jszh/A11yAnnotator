---
id: media-alternatives-v0
sc: 1.2.2
skill: media-alternatives
visionEvidence: [element-crop]
---

# 1.2.2 — captions for prerecorded media (v0 atomic rubric, A)

**Division of labor (v3.2).** The collector found a `<video>` and extracted its `<track>` children
(`signals.media`: `hasCaptionsTrack`, `captionsTrackEmpty`, `hasDescriptionsTrack`, `trackKinds`). Whether a
captions track EXISTS is mechanical; you judge whether an ADEQUATE captions alternative is provided. No checker
decides caption adequacy.

**Judge:** does the prerecorded video provide synchronized captions for its audio content? A `<video>` with NO
`<track kind="captions">`/`kind="subtitles"` (and no equivalent author-provided caption mechanism visible in the
frame) is a barrier. (A video with no audio track / a purely decorative background video carries no 1.2.2
obligation — judge from the frame whether it plausibly has meaningful audio.)

**WCAG soundness caveats (REQUIRED before failing or clearing):**
- **Absence ≠ pass / present-but-empty.** `captionsTrackEmpty:true` (a `<track>` element with no `src`) is NOT
  captions — treat it as ABSENT. Do not read the mere PRESENCE of a `<track>` tag as a clear.
- Caption **sync and quality** (do the captions match the spoken words, are they timed correctly) CANNOT be judged
  from a static frame or the DOM — return **PARTIAL** on the sync/quality question; only judge captions PRESENCE
  + plausibility here.
- If the frame does not let you tell whether the media has meaningful audio (so whether 1.2.2 even applies),
  return PARTIAL, not a clear.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
