---
id: captcha-alternative-v0
sc: 1.1.1
skill: captcha
visionEvidence: [element-crop, surrounding-region]
---

# 1.1.1 — CAPTCHA alternative modalities (v0 atomic rubric, review-tier)

**Division of labor (v3.2).** You do NOT investigate the whole page. The collector detected a CAPTCHA widget
(reCAPTCHA / hCaptcha / Cloudflare Turnstile / a generic captcha control) and screenshotted it with its
surrounding region. This is a **REVIEW-tier** obligation: WCAG 1.1.1 requires that when a CAPTCHA uses one
sensory modality, an **alternative form using a DIFFERENT modality** is provided — concretely, a visual
puzzle MUST be paired with an **audio** alternative (and ideally a path for users who can neither see nor
hear). Trusted Tester 7.D prompts a HUMAN here; you should usually defer the same way.

**Judge — ask the question, do not over-verdict:**
- **REPRODUCED (barrier)** ONLY when the evidence positively shows a **single-modality** CAPTCHA with no
  alternative — e.g. a visual image/puzzle CAPTCHA with NO audio-challenge control anywhere in the
  `element-crop`/`surrounding-region`, and no visible "try an audio challenge / alternative" affordance.
- **NOT REPRODUCED (no barrier)** ONLY when you can SEE that a second modality is offered — e.g. an explicit
  audio-challenge button/icon beside the visual challenge (reCAPTCHA's headphone icon), or a clearly-labelled
  alternative path.
- **PARTIAL (review)** is the DEFAULT. A modern widget (reCAPTCHA v2 checkbox, Turnstile, an invisible/score
  CAPTCHA) renders almost nothing until challenged, so a single static frame usually cannot confirm whether
  both modalities exist. When you cannot confirm the alternatives either way, return PARTIAL — never a
  confident clear, and never a barrier you cannot see.

**Evidence handed to you:** `signals.captcha` (the detection + the modality question) and the
`element-crop`/`surrounding-region` pixels.

**WCAG soundness caveats:**
- Do NOT fail a CAPTCHA merely for existing — the obligation is about the MISSING alternative modality, not
  the CAPTCHA itself.
- An invisible/score-based CAPTCHA that presents no sensory challenge at all is not a 1.1.1 barrier on this
  page — return PARTIAL/NOT REPRODUCED, not a barrier.
- This is single-page evidence; the alternative may live behind an interaction you cannot trigger — prefer
  PARTIAL over a false clear.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈ {REPRODUCED
(single-modality CAPTCHA, no alternative visible), NOT REPRODUCED (a second modality is visibly offered),
PARTIAL (cannot confirm from a static frame — the expected review outcome), N/A (abstain)}.
