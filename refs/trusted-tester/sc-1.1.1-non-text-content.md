# SC 1.1.1 Non-text Content (Level A) — TT Tests 7.A, 7.B, 7.C, 7.D (also 5.C)

**TT section:** 7. Images · **Baseline:** 6. Images · (also covers 4.1.2 Name, Role, Value)
**WCAG SC 1.1.1:** All non-text content presented to the user has a text alternative that serves the equivalent
purpose, except for [specific situations listed: controls/input, time-based media, test, sensory, CAPTCHA,
decoration].

> **TT v5.1.3 rewrite:** Section 7 was rewritten to **start with detecting empty vs non-empty accessible
> name**, then branch: non-empty → 7.A; empty → 7.B; background → 7.C; CAPTCHA → 7.D.

## Identify Content (Meaningful Images)
1. Use **ANDI: graphics/images** to find all images on the page **with non-empty accessible names**.
2. Use **ANDI: Focusable Elements** (and/or ANDI: links/buttons) to check the ANDI Output of keyboard-focusable
   images (they may be components of focusable elements). Use these if different from ANDI: Graphics/Images.
3. Identify images that have **non-empty** accessible names.
- *Note:* ANDI may skip background images and images with `role="presentation"`/`role="none"` → tested in 7.B/7.C.

---

## Test 7.A — `1.1.1-meaningful-image-name`
**Test Condition:** *The accessible name and accessible description for a meaningful image provides an equivalent
description of the image.*
**DNA** for images with empty/missing accessible names, or if there are no images on the page.

### How to Test (for each image with a non-empty accessible name)
1. a. Determine if the image is **pure decoration**.
   b. The ANDI Output must provide an **equivalent description** of the image.
      - i. Does not have to be a literal description — may describe the meaning or purpose of the image.
      - ii. Could be a brief description with instructions on where to find equivalent information elsewhere.
   c. If the image is a **CAPTCHA**, ANDI Output must describe the **purpose** of the CAPTCHA.
   d. If the image is of **meaningful text**, ANDI Output must contain the **same text**.

### Evaluate Results (PASS if ALL true)
1. The image is not pure decoration.
2. The ANDI Output contains an equivalent description for the image or refers to a description in page content.

### Notes
- WCAG "pure decoration" = "serving only an aesthetic purpose, providing no information, and having no
  functionality." Examples: a corner swirl, generic bullet points, abstract section dividers, invisible tracking
  pixel, part of a link added to improve appearance / increase clickable area.
- Any image on the page **not detected by ANDI** should **not** be tested in 7.A.
- Step 1.d (image of text) applies where text is the main content; skip if already tested under 1.b. Does not
  apply to text that is part of a picture with significant other visual content (graphs, screenshots, diagrams).

---

## Test 7.B — `1.1.1-decorative-image`
**Test Condition:** *There is no accessible name and accessible description for a decorative image.*
**DNA** for background images, images with non-empty accessible names, or no images on the page.

### How to Test (for each image identified with empty/no accessible name)
1. a. Determine if the image is the **only means of conveying important information** on the page.
   b. Determine if the image is **in the tab order**.
   c. Determine if the image has **no accessible name markup** (ANDI: "The image has no accessible name, [alt],
      or [title]").

### Evaluate Results (PASS if ALL true)
1. The image is **NOT** the only means of conveying important information.
2. The image is **NOT** in the tab order.
3. The image has an **empty (NOT missing)** accessible name.

> *Use visual inspection along with ANDI to determine if there are images skipped (not navigated to) by ANDI.*
> ANDI may skip `role="presentation"`/`role="none"`/`aria-hidden="true"`.

---

## Test 7.C — `1.1.1-decorative-background-image`
**Test Condition:** *The background image is not the only means used to convey important information.*
**DNA** if there are no background images on the page.

### How to Test
1. Select the "find background" button in ANDI: graphics/images to highlight all background images.
2. For each background image, determine whether important information provided by it is available without it.
   - a. Select "hide background" in ANDI to help determine if the image's information is also available without it.
   - b. Review the sequence/positioning of the image to determine whether equivalent information is presented in
     the same logical order.

### Evaluate Results (PASS if ANY true)
1. The background image is decorative, OR
2. The meaning of the background image is also available without the background image.

---

## Test 7.D — `1.1.1-captcha-alternative`
**Test Condition:** *Alternative forms of CAPTCHA are provided.*
**DNA** if there are no CAPTCHA images on the page.

### How to Test
1. Determine whether alternative forms of CAPTCHA with output modes for **different types of sensory
   perception** are provided.

### Evaluate Results (PASS if ALL true)
1. The CAPTCHA has a format for users without vision, AND
2. The CAPTCHA has a format for users without hearing.
