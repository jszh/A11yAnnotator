# SC 3.3.1 Error Identification — augmented test corpus

The published ACT rules for SC 3.3.1 (notably 36b590) check the *mechanical* shape of error reporting: when a form-field error indicator exists, does it identify its related field and describe a cause, in text or via a text alternative. They are silent on whether that text is *true*. They cannot tell that a fluent, field-naming message describes the wrong cause, that a post-submit page silently re-displayed the form (or even showed a success banner) after a real validation failure, that an inline message is parked next to the wrong field, that a top-of-form error summary lists fields/counts that disagree with the page's actually-flagged state, that the error is signalled by colour/border/icon glyph alone with no error meaning in text anywhere, or that an icon's text alternative exists but misstates, genericises, or mislocates the error. Each of these defeats the SC's *intent* ("users ... can determine what is wrong") while passing the rule's structural expectations, so they require human judgment.

This corpus adds adversarial, human-judgment pages across six aspects that the ACT rules miss: error text that is fluent and field-identifying but factually wrong; silent redisplay after a real error (trigger-and-observe failure of any indicator); inline error placed next to the wrong field with no programmatic association; error-summary-vs-flagged-state incoherence; error signalled only by visual styling with no in-text meaning; and an error icon whose text alternative misstates the error. Every aspect now meets the bar of 5 valid human-judgment pages — two aspects (silent-redisplay-after-real-error and inline-error-adjacent-to-wrong-field) sit at exactly 6 valid pages, the other four at 7, with no aspect short of the threshold.

| aspect | valid pages | page statuses |
|---|---|---|
| error-message-mismatches-actual-error | 7 | valid, valid, valid, valid, valid, valid, valid |
| silent-redisplay-after-real-error | 6 | valid, valid, valid, valid, valid, valid |
| inline-error-adjacent-to-wrong-field | 6 | valid, valid, valid, valid, valid, valid |
| error-summary-incoherent-with-flagged-state | 7 | valid, valid, valid, valid, valid, valid, valid |
| non-text-only-error-indicator | 7 | valid, valid, valid, valid, valid, valid, valid |
| error-icon-text-alternative-misstates-error | 7 | valid, valid, valid, valid, valid, valid, valid |
