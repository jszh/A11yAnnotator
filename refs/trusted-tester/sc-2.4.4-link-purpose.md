# SC 2.4.4 Link Purpose (In Context) (Level A) — TT Test 6.A

**TT section:** 6. Links · **Baseline:** 14. Links · (also covers 4.1.2 Name, Role, Value)
**WCAG SC 2.4.4:** The purpose of each link can be determined from the link text alone or from the link text
together with its programmatically determined link context, except where the purpose of the link would be
ambiguous to users in general.

## Identify Content
Use **ANDI: links/buttons** to identify all links.
- **DNA** if the page does not have links.
- *Note:* This test does **not** apply to links that function as an anchor or target and are not perceivable or
  selectable by users.

## Test 6.A — `2.4.4-link-purpose`
**Test Condition:** *The purpose of each link can be determined from any combination of the link text, accessible
name, accessible description, and/or programmatically determined link context.*

### How to Test
1. Evaluate the **ANDI Output** for link purpose.
2. Determine whether the ANDI Output, in combination with the **programmatically determined link context** (text
   that is in the **same sentence, paragraph, list item, or table cell** as the link, or in a **table header
   cell** associated with the table cell that contains the link), adequately describes the link's purpose or
   function.
   - a. In cases where the purpose of the link is **intentionally vague or ambiguous** (e.g., a "Door 1," "Door
     2," "Door 3" surprise), it may be sufficient for the combination of link text, accessible name, accessible
     description, and/or link context to refer to the link purpose vaguely or ambiguously.

### Evaluate Results (PASS if)
1. The combination of the programmatically determined link context and the ANDI Output provide adequate
   description of the link's purpose.

### Note
- Any changes to links that occur automatically or as a result of interaction with the page should be included.
- "Programmatically determined link context" is **limited** to same sentence/paragraph/list-item/table-cell or
  associated table header — not arbitrary nearby text.
