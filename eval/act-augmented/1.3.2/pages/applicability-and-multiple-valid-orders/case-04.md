# case-04 — Magazine feature whose pull-quote is interleaved into the middle of a sentence (FAIL)

## Scenario
A long-form coastal-feature article ("The long tide"). A pull-quote / callout `<aside>` would be
perfectly fine sitting before or after the body &mdash; the order of article-vs-sidebar carries no
meaning, which is the PASS case the Understanding describes for magazine callouts. But this author
used CSS flexbox/float to push the callout into the right margin while, in the DOM, the `<aside>` is
physically wedged BETWEEN the two halves of a single running sentence. The sentence is split into
`p#part-a` ("...the river that once fed the marsh") and `p#part-b` ("was dammed upstream in the
1970s..."), with the entire pull-quote and its attribution sitting in the gap. This is interleaving,
which breaks the body&rsquo;s meaningful sequence.

## Attribute tuple
- **Content domain:** news / long-form editorial (environmental feature)
- **UI component / pattern:** magazine pull-quote callout `<aside>` floated to the margin
- **Host-language construct:** one sentence split across two `<p>` with an `<aside>` between them;
  flex `order:99` + `float:right` for visual placement
- **Locale / i18n:** en
- **Failure mechanism:** F1-style interleaving &mdash; CSS positions a callout so the linearized
  reading order splices it into the middle of a sentence, changing the meaning

## Developer persona
A CMS template developer building a "magazine layout" where editors drop a pull-quote inline next
to the paragraph it relates to. The template author placed the `<aside>` at the exact insertion
point in the body so the float would sit "next to" the relevant line, not realising the editor had
chosen an insertion point in the middle of a sentence &mdash; visually the float clears the text, but
the DOM now severs the sentence around it.

## Element / selector carrying the issue
`aside.callout`, sitting in the DOM between `p#part-a` and `p#part-b`. The interleaving is the
defect; the strongest selector is `aside.callout` (or the `#part-a` &rarr; `aside` &rarr; `#part-b`
sequence).

## Exact accessibility mechanism
A screen reader reads the DOM in order: it speaks the opening clause "...the river that once fed the
marsh", then jumps into the pull-quote "We are not losing the marsh. The marsh is leaving... &mdash;
Dr. Helen Okafor, coastal geomorphologist", and only then returns to "was dammed upstream in the
1970s...". The sentence is broken; the listener cannot reassemble the author&rsquo;s point because a
quotation and an attribution have been spoken into the middle of it. Unlike the harmless
article-vs-sidebar case, the blocks here ARE interleaved, so the body&rsquo;s meaningful sequence is
destroyed.

## Expected ACT-style outcome
**failed** (SC 1.3.2, F1). The visual layout looks like a normal magazine pull-quote, but the
programmatically determined reading order interleaves the callout into a sentence and changes its
meaning.

## Why automated tools miss it
The `<aside>`, the two `<p>` fragments, and the flex/float CSS are all valid &mdash; nothing is
missing or malformed, so linters and axe/WAVE/Lighthouse stay silent (and there is no 1.3.2 rule
anyway). Detecting the failure requires reading the prose and noticing that one sentence has been
cut in half by an interleaved aside &mdash; a semantic/linguistic judgement no automated checker
performs.

## Citation
**Reference:** WCAG 2.2 Understanding &mdash; Meaningful Sequence, Intent (`wcag-understanding/meaningful-sequence.html`)
> "if a page contains two independent articles, the relative order of the articles may not affect their meaning, as long as they are not interleaved."

**Reference:** WCAG Technique F1 &mdash; *Failure ... due to changing the meaning of content by positioning information with CSS* (`wcag-techniques/failures/F1.html`)
> "it is important not to rely on CSS to visually position content in a specific sequence if this sequence results in a meaning that is different from the programmatically determined reading order."
