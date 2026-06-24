# case-06 — Museum scroll: seal-script calligraphy whose brushwork is the artefact (genuine original-format exception, PASS)

## Scenario
A museum object page presents a scanned 11th-century Chinese seal-script (篆書) hanging scroll
reading 山高水長 ("the mountain is high, the water runs long"). The *artefact is the brushwork*:
the stroke formation, ink density, asymmetry, and the individual calligrapher's hand are exactly
what the museum exhibits and what scholarship discusses. Re-typesetting the same characters in a
modern OpenType seal font would show a *different object* and destroy the information conveyed
about how this hand, in this period, formed these glyphs. So the depiction in its original
format is essential — the genuine original-format exception. The page handles it conformantly:
the scroll image has a text alternative that transcribes *and* describes the calligraphic form,
and the modern Unicode transcription, romanisation, and English translation are also provided
beside it as live, selectable, resizable text (correct `lang="zh-Hant"`).

This is the PASS twin to case-03's FAIL. The discriminator: here a real original artefact's form
carries historical information that re-typesetting would lose; there, modern text was merely
costumed to look old.

## Attribute tuple
- **Content domain:** cultural heritage / museum object record (Asian art)
- **UI component / pattern:** object detail layout — artefact `<figure>` + live transcription/translation panels
- **Host-language construct:** `<img>` (inline-SVG `data:` URI) of calligraphy, paired with live `lang="zh-Hant"` text
- **Locale / i18n:** zh-Hant (Traditional Chinese characters) within an en page, with romanisation and translation
- **Failure mechanism:** NONE (boundary pass) — original-format-essential exception genuinely applies AND adjustable text is also provided

## Developer persona
A museum digital-collections developer who understands both art-historical value and WCAG. They
know the scholarly point is the brushwork (un-reproducible by any font), so they imaged the
scroll — but they also know low-vision and cognitive-disability users need adjustable text, so
they added a transcribing/descriptive alt and a live, resizable Unicode transcription,
romanisation, and translation alongside, with proper language tagging.

## Element / selector carrying the issue
No issue. Relevant elements: the artefact image `.object figure img` (genuine exception) and the
live companion text `.panel .orig[lang="zh-Hant"]`, `.rom`, and the translation panel.

## Exact accessibility mechanism
The scroll image's accessible name transcribes the four characters *and* describes the
calligraphic form (rounded even-weight strokes, the lean of 長, dry-brush flecking on 水), so AT
users learn both the words and what is visually significant about the original. The
*irreplaceable* information — this specific hand's brushwork — is what the image preserves, so
the image of text is essential and permitted. Crucially, the page does not strand users who need
adjustable text: the characters appear again as live, selectable HTML (`lang="zh-Hant"`, so a
screen reader uses the correct pronunciation rules), with romanisation and an English
translation, all resizable and recolourable. A low-vision user can enlarge the live transcription;
a researcher gets the original form.

## Expected ACT-style outcome
**passed** (SC 1.4.5). The image of text cannot be replaced by text *with the same effect* (a
modern font would show a different artefact and lose the historical information about the
calligrapher's hand), and equivalent adjustable text is additionally provided.

## Why automated tools miss it
Structurally this page is indistinguishable from one that merely imaged its restaurant menu in
Chinese: an `<img>` with alt sitting next to some live Chinese text. An automated tool cannot OCR
the scroll, cannot tell calligraphy-as-artefact from text-as-image, and has no concept of
"original format essential to information about a time period." Confirming the exception
genuinely applies — and that adjustable equivalent text is provided — is a human art-historical
and contextual judgment, not a lint check.

## Citation
**Reference:** WCAG 2.2 Understanding Images of Text — Examples (`wcag-understanding/images-of-text.html`)
> "A representation of a letter ... A web page contains a representation of an original letter. The depiction of the letter in its original format is essential to information being conveyed about the time period in which it was written. The letter is included as a gif image which does not allow the text characteristics to be changed. The image has a text alternative."

**Reference:** WCAG 2.2 Understanding Images of Text — note on "in addition to" (`wcag-understanding/images-of-text.html`)
> "Where images of text are used in addition to text to convey the same information, and where both are presented to the user, this success criterion is met."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, Evaluate Results (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "The image of text cannot be replaced with text, OR ... The image of text can be visually customized."
