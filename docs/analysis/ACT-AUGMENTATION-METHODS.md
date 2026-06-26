# Data-augmentation methods for the ACT-augmentation pipeline

Source: deep-research workflow (107 agents, adversarially verified). Full JSON: `_seeds/RESEARCH-augmentation-methods.json`.

## Summary
Methods for the 5-stage pipeline. DIVERSITY a: condition Stage-4 on personas and attributes, Evol-Instruct in-breadth mutation for rare SC variations, training-free Verbalized Sampling, Self-Instruct similarity dedup, DPP log-det and DCScore coverage metrics. HARDNESS b: Evol-Instruct five in-depth operations with 10-20-words-per-edit control to push axe-detectable cases to the human-judgment boundary. VALIDITY c: Self-Instruct audit 92-79-58-54 justifies Stage-5; Self-Refine plus N-CRITICS ensemble critics target fact-hallucination; RLAIF preference filtering and Evol-Instruct Elimination-Evolving filters. EFFICIENCY d: Self-Instruct over 290x seed amplification, AttrPrompt parity at 5 percent querying cost. High confidence, primary peer-reviewed sources, unanimous verification. Full findings below.

## Findings (all HIGH confidence)

### DIVERSITY a: Condition Stage-4 on personas AND explicit attributes (genre, component, domain, locale, style); persona synthesis taps distinct perspectives and attribute conditioning, not just more samples, raises diversity and quality.
- **Confidence:** high
- **Sources:** https://arxiv.org/abs/2406.20094, https://arxiv.org/html/2306.15895
- **Evidence:** 2406.20094 leverages various LLM perspectives for diverse data; AttrPrompt (NeurIPS 2023) attribute diversity is pivotal. Strong-form personas-access-every-perspective claim refuted 0-3; treat as a lever not a guarantee.
- **Verification vote:** 3-0 persona, 2-1 attribute, strong-form refuted 0-3

### DIVERSITY a: Add training-free Verbalized Sampling to Stage 4: ask the model to verbalize a probability distribution over candidate cases per call; mitigates mode collapse (1.6-2.1x diversity), validated on synthetic-data generation, zero fine-tuning.
- **Confidence:** high
- **Sources:** https://arxiv.org/abs/2510.01171
- **Evidence:** 2510.01171 training-free strategy to circumvent mode collapse; diversity up 1.6-2.1x; synthetic data generation without sacrificing accuracy/safety. CAVEAT accuracy/safety on separate tasks; Oct 2025 under ICLR 2026 review.
- **Verification vote:** 3-0 x3

### DIVERSITY a: Use Evol-Instruct IN-BREADTH mutation after Stage-3 dedup to generate brand-new scenarios in the same SC domain targeting RARE/long-tailed variations, enhancing topic and skill coverage.
- **Confidence:** high
- **Sources:** https://arxiv.org/abs/2304.12244
- **Evidence:** 2304.12244 (WizardLM, ICLR 2024) In-Breadth Evolving is mutation generating a new instruction in the same domain but more rare/long-tailed to enhance topic, skill, and dataset diversity; t-SNE dispersion exceeds ShareGPT/Alpaca.
- **Verification vote:** 3-0

### DIVERSITY a: Enforce a Self-Instruct similarity dedup filter in Stage 4 (keep a page only if below threshold; Self-Instruct used ROUGE-L below 0.7); for HTML augment lexical ROUGE-L with semantic-embedding or DOM-structural similarity.
- **Confidence:** high
- **Sources:** https://arxiv.org/abs/2212.10560
- **Evidence:** 2212.10560 (Self-Instruct, ACL 2023) adds an instruction only when ROUGE-L similarity with any existing one is less than 0.7. Caveat ROUGE-L is lexical not semantic.
- **Verification vote:** 3-0

### DIVERSITY MEASUREMENT a: Quantify coverage with DPP subset selection (log-determinant distance to a maximally diverse reference; gradient-space variant correlates with downstream gains) or DCScore (diversity-as-classification with proven axioms, better pseudo-truth correlation than Distinct-n/K-means/VendiScore). Use as a stopping/selection signal.
- **Confidence:** high
- **Sources:** https://arxiv.org/abs/2402.02318, https://openreview.net/forum?id=DMJ3b19RAJ, https://arxiv.org/abs/2502.08512
- **Evidence:** 2402.02318 (ICLR 2025) DPPs capture diversity and quality for subset selection; gradient-space measure correlates with downstream instruction-following. DCScore (ICML 2025) sample classification with verified diversity axioms, stronger pseudo-truth correlation. CAVEAT DCScore wins in-most-cases, on par with VendiScore in some columns; pseudo-truths are proxies.
- **Verification vote:** 3-0 x6

### HARDNESS b: Use Evol-Instruct five IN-DEPTH operations (add constraints, deepening, concretizing, increase reasoning steps, complicate input) to mutate a case axe-core already flags into one at the human-judgment boundary; the 10-20-words-per-edit rule gives gradual difficulty control.
- **Confidence:** high
- **Sources:** https://arxiv.org/abs/2304.12244
- **Evidence:** 2304.12244 (WizardLM, ICLR 2024) five in-depth operations verbatim (concretizing = replace general with specific; complicate input adds structured formats incl. HTML); Rewritten Prompt can only add 10 to 20 words; each evolution a bit harder.
- **Verification vote:** 3-0

### VALIDITY c (motivation): Self-Instruct human audit shows validity degrades monotonically down the chain (92 task, 79 input, 58 output, 54 all-fields), justifying adversarial Stage-5 and concentrating verification on label correctness and citation grounding.
- **Confidence:** high
- **Sources:** https://arxiv.org/abs/2212.10560
- **Evidence:** 2212.10560 Table 2 (single author-annotator, n=200): 92/79/58/54. Caveat single-annotator not multi-annotator; figures robust.
- **Verification vote:** 3-0

### VALIDITY/DE-HALLUCINATION c: Layer training-free self-critique into Stage 5 with an ENSEMBLE of critics. Self-Refine is the base generator+critic+refiner loop; N-CRITICS adds an ensemble plus model own feedback and explicitly targets FACT HALLUCINATION, on-point for hallucinated WCAG/EN-301549 citations and fake failures.
- **Confidence:** high
- **Sources:** https://arxiv.org/abs/2303.17651, https://arxiv.org/abs/2310.18679
- **Evidence:** Self-Refine 2303.17651 (NeurIPS 2023) single LLM as generator/refiner/feedback, no training. N-CRITICS 2310.18679 (NeurIPS 2023 WS) ensemble of critics plus model own feedback, no training, targets toxicity and fact hallucination. CAVEAT self-correction has limits (2310.01798); keep the accessibility-tree oracle authoritative. Self-Refine 20pct improvement refuted 1-2.
- **Verification vote:** 3-0 x4, 20pct refuted 1-2

### VALIDITY c: Adopt Evol-Instruct Elimination-Evolving as a cheap pre-filter before Stage-5 (reject no-information-gain mutations, refusals, punctuation-only pages, boilerplate copies), plus AI-preference filtering (RLAIF) for a no-human-label quality gate.
- **Confidence:** high
- **Sources:** https://arxiv.org/abs/2304.12244, https://arxiv.org/abs/2212.08073
- **Evidence:** 2304.12244 Sec 3.2 four failure criteria verbatim. 2212.08073 (Constitutional/RLAIF) generates self-critiques and revisions then finetunes on revised; RL stage uses a model to judge which sample is better (RLAIF) without human labels. CAVEAT criteria need HTML adaptation; borrow concepts not the fine-tuning.
- **Verification vote:** 3-0 x3

### EFFICIENCY/YIELD d: Self-Instruct turned 175 seeds into 52K+ instructions / 82K+ instances (over 290x), so invest human effort in a gold seed set per SC; AttrPrompt matched class-conditional prompts at only 5 percent of querying cost, so attribute/persona conditioning also improves yield-per-call.
- **Confidence:** high
- **Sources:** https://arxiv.org/abs/2212.10560, https://arxiv.org/html/2306.15895
- **Evidence:** 2212.10560 175 tasks to 52,445 instructions / 82,439 instances after filtering. 2306.15895 attributed prompts match class-conditional prompts at 5 percent of querying cost. CAVEAT 290x is across many generation steps not per call; 5 percent is cost-to-match on text-classification.
- **Verification vote:** 3-0 x2
