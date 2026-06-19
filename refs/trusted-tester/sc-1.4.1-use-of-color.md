# SC 1.4.1 Use of Color (Level A) — TT Test 13.A

**TT section:** 13. Sensory Characteristics and Contrast → Use of Color · **Baseline:** 7. Sensory Characteristics
**WCAG SC 1.4.1:** Color is not used as the only visual means of conveying information, indicating an action,
prompting a response, or distinguishing a visual element.

## Identify Content
Identify content that relies on color to convey meaning (indicate an action, prompt a response, distinguish a
visual element). **Displaying content in grayscale may help identify content that uses only color** to convey
information.
- **DNA** for 13.A if no content relies on color to convey meaning.

## Test 13.A — `1.4.1-color-meaning`
**Test Condition:** *Color is not used as the only visual means of conveying information, indicating an action,
prompting a response, or distinguishing a visual element.*

### How to Test
1. Determine whether **color is the only visual method** used to convey information (e.g., review the onscreen
   text for a full description and/or look for other visual cues).

### Evaluate Results (PASS if)
1. When color is used to convey information, indicate an action, prompt a response, or distinguish a visual
   element, another visual, **onscreen** method is used to convey the information which does not use color.

### Notes
- Alternate text that appears on **mouse-over** of a visual element is **not** considered "onscreen text."
- An **error indicator cannot use color alone** as an indicator.
- It is considered a browser setting if a **visited link changes color** — this is not failed for 13.A.
- (13.B / 1.3.3) Color is a type of sensory information and cannot be used in combination with another type of
  sensory information alone to pass. (1.3.3 is out of our 22-SC scope but shares the section.)

> **Classic failures (from our rubric's lens):** F73 links distinguished only by color; F81 status/required/error
> conveyed only by color. The grayscale technique is the canonical detection method.
