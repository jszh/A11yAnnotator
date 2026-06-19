# SC 1.4.5 Images of Text (Level AA) — TT Test 7.E

**TT section:** 7. Images → Images of Text · **Baseline:** 6. Images
**WCAG SC 1.4.5:** If the technologies being used can achieve the visual presentation, text is used to convey
information rather than images of text, except for [customizable / essential].

## Identify Content
Identify all **images of text**.
- **EXCLUDE** text that is part of a picture that contains significant other visual content such as CAPTCHA,
  graphs, screenshots, and diagrams, which visually convey important information more than just text.
- **DNA** for 7.E if there are no images of text on the page.

## Test 7.E — `1.4.5-image-of-text`
**Test Condition:** *The image of text cannot be replaced by text or is customizable.*

### How to Test
1. Determine if text can be used instead of the image of text to present the **same effect and information**.
   - a. **Logotypes** (text that is part of a logo or brand name) cannot be replaced by text.
   - b. Type samples, branding, images of specific fonts that are not widely supported are additional examples of
     images of text that cannot be replaced by text.
2. Determine if the image of text can be **visually customized**: adjust the font, size, color, and background
   with controls provided by the web page.
   - a. Customizing font size for an image of text also implies the ability to adjust the size without
     pixelation (typically evident when simply using the browser resize functionality to resize images).

### Evaluate Results (PASS if ANY true)
1. The image of text cannot be replaced with text, OR
2. The image of text can be visually customized.

> **Detection step is OCR-like:** the tester must first recognize that an image *contains text* (vs being a
> photo/diagram), then judge whether that text is essential (logotype) or could have been live text.
