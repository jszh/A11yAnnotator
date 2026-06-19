# SC 1.4.3 Contrast (Minimum) (Level AA) — TT Test 13.C

**TT section:** 13. Sensory Characteristics and Contrast → Color Contrast · **Baseline:** 8. Contrast
**WCAG SC 1.4.3:** The visual presentation of text and images of text has a contrast ratio of at least 4.5:1,
except: large text 3:1; incidental (inactive/decorative/invisible/part of a picture with significant other
content); logotypes.

## Identify Content
Identify **ALL text AND images of text**. **EXCLUDE** text that is:
- In logotypes (logo or brand name)
- For inactive (disabled) user interface components
- Purely decorative and not meaningful (no functionality)
- Contained within a picture that contains significant other visual content
- Changed to indicate it is a "visited" link
- *Note:* Some text may not initially be visible (appears on mouseover or focus). It must still conform to the
  contrast requirement **wherever it occurs**.
- **DNA** for 13.C if the page has no visible text or images of text.

## Test 13.C — `1.4.3-contrast`
**Test Condition:** *The visual presentation of text and images of text have sufficient contrast.*

### How to Test
1. Launch **ANDI: color contrast**.
2. Review any "Contrast Alerts" in ANDI's "Accessibility Alerts" section to identify text that fails the minimum
   contrast ratio.
3. In ANDI's "Accessibility Alerts," identify any "**Manual Contrast Tests Needed**."
   - a. If text is not selectable or appears on a background image, determine the contrast using the **Colour
     Contrast Analyser (CCA)**.
   - b. Open CCA, select the **Foreground** color-dropper, click a pixel in the text font. If the text color is
     varied, choose a pixel that provides the **least contrast**.
   - c. Select the **Background** color-dropper, click a pixel in the background close to the text. If the
     background is varied, choose a pixel that provides the **least contrast**.
   - d. Identify the Contrast Ratio.
   - e. Compare the contrast ratio against the minimum required ratio identified in the ANDI Contrast Ratio output.
4. If the page contains an image of text alone (or an image with text and no other significant content), test the
   image of text with CCA (ANDI: color contrast cannot detect text inside images).
   - a. Graphics/images module → arrow buttons → identify images of text.
   - b. Open CCA, test the contrast of the text in the image (foreground/background droppers, least contrast).
   - c. Determine whether the resulting contrast ratio is at least **4.5:1**.
     - *Note:* if the text in the image is large-scale (≥18pt or 14pt bold), **3:1** applies. TT has not
       identified a tool to compare text size in images, so this determination is not in the process — but use
       3:1 if it can be satisfactorily demonstrated the text is large-scale.

### Evaluate Results (PASS if ANY true)
1. The contrast between the text and its background is ≥ the minimum required ratio identified in the ANDI
   Contrast Ratio output, OR
2. If the text is an image of text, the contrast between the image of text and its background is ≥ 4.5:1 (or 3:1
   for large-scale text) as identified using the CCA.

### Thresholds (from Applicable Standards)
- Normal text: **4.5:1**; Large-scale text (≥18pt or ≥14pt bold): **3:1**.
- Incidental (inactive UI, pure decoration, not visible to anyone, part of a picture with significant other
  content) and Logotypes: **no contrast requirement**.

> **Two distinct mechanisms:** (a) selectable live text → ANDI auto-computes from CSS colors; (b) text on a
> background image / image-of-text → ANDI can't, so a human eyedroppers the **least-contrast** foreground &
> background pixels with CCA. Our pixel-contrast path mirrors (b); our CSSOM path mirrors (a).
