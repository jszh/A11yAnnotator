'use strict';
/*
 * Generator for the WCAG 3.3.2 (Labels or Instructions) + 3.3.3 (Error Suggestion)
 * constraint+binding capability-test corpus. INDEPENDENT test author — built only
 * from WCAG 2.2 Understanding/Techniques (G131, G89, G184, G177, G84/G85, ARIA2),
 * the 3.3.3 security exception wording, Trusted Tester 5.1.x, EN 301 549.
 *
 * Each case is a SELF-CONTAINED HTML form (no external resources). For 3.3.3 the
 * suggestion appears on SUBMIT with invalid input via an inline JS validator.
 *
 * Writes: eval/capability-tests/<sc>/<aspect>/case-NN.html + labels.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ---- shared HTML scaffolding -------------------------------------------------
const HEAD = (title, extraCss = '') => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>
  body{font:16px/1.5 system-ui,sans-serif;margin:40px;max-width:560px;color:#1a1a1a}
  h1{font-size:20px}
  label{display:block;font-weight:600;margin-bottom:4px}
  input,select,textarea{padding:8px;width:100%;box-sizing:border-box;font:inherit}
  fieldset{border:1px solid #999;padding:12px;margin:0 0 12px}
  legend{font-weight:600;padding:0 6px}
  .hint{color:#444;font-size:14px;margin:2px 0 6px}
  .err{color:#b00020;margin-top:6px}
  button{margin-top:14px;padding:9px 18px;font:inherit}
  .far{margin-top:600px}
  ${extraCss}
</style></head>`;

function writeCase(sc, aspect, n, comment, body) {
  const dir = path.join(ROOT, sc, aspect);
  fs.mkdirSync(dir, { recursive: true });
  const file = `case-${String(n).padStart(2, '0')}.html`;
  const html = `<!DOCTYPE html>
<!-- ${sc} ${comment} -->
${HEAD(`${sc} ${aspect} case ${n}`).replace(/^<!DOCTYPE html>\n/, '')}
<body>
${body}
</body></html>
`;
  fs.writeFileSync(path.join(dir, file), html);
  return file;
}

function writeManifest(sc, aspect, rows) {
  const dir = path.join(ROOT, sc, aspect);
  fs.writeFileSync(path.join(dir, 'labels.json'), JSON.stringify(rows, null, 2) + '\n');
}

// A 3.3.3 inline validator that shows `msg` on submit when the value is invalid per `testFnSrc`.
// `testFnSrc` is the SOURCE of a function (value)=>boolean returning TRUE when VALID.
function validatorScript({ formId, fieldId, errId, testFnSrc, msgExpr }) {
  return `  <script>
    (function(){
      var f=document.getElementById('${formId}'), fld=document.getElementById('${fieldId}'), m=document.getElementById('${errId}');
      var valid=${testFnSrc};
      f.addEventListener('submit',function(ev){
        ev.preventDefault();
        if(!valid(fld.value)){ m.innerHTML=${msgExpr}; m.hidden=false; fld.setAttribute('aria-invalid','true'); }
        else { m.hidden=true; fld.removeAttribute('aria-invalid'); }
      });
    })();
  </script>`;
}

const manifests = {};
function add(sc, aspect, row) {
  const key = sc + '/' + aspect;
  (manifests[key] = manifests[key] || []).push(row);
}

// citations (verbatim grounding) ------------------------------------------------
const CITE = {
  sc332: '"Labels or instructions are provided when content requires user input." — WCAG 2.2 SC 3.3.2 Labels or Instructions',
  intent332fmt: '"Instructions or labels may also specify data formats for data entry fields, especially if they are out of the customary formats or if there are specific rules for correct input." — Understanding SC 3.3.2 (Intent)',
  intent332id: '"The intent of this success criterion is to have content authors present instructions or labels that identify the controls in a form so that users know what input data is expected." — Understanding SC 3.3.2 (Intent)',
  g89: '"The objective of this technique is to help the user avoid input errors by informing them about restrictions on the format of data that they must enter." — Technique G89 Providing expected data format and example',
  g131: '"The objective of this technique is to ensure that the label for any interactive component within web content makes the component\'s purpose clear." — Technique G131 Providing descriptive labels',
  g184: '"The objective of this technique is to help the user avoid input errors by informing them ahead of time about restrictions on the format of data that they must enter." — Technique G184 Providing text instructions at the beginning of a form or set of fields',
  aria2: '"The objective of this technique is to enhance programmatic indication that a form field (which is shown through presentation to be required) is mandatory for successful submission of a form." — Technique ARIA2 Identifying a required field with the aria-required property',
  h71: '"H71: Providing a description for groups of form controls using fieldset and legend elements" — Sufficient technique for SC 3.3.2 (group label/instruction)',
  g162: '"G162: Positioning labels to maximize predictability of relationships" — Sufficient technique for SC 3.3.2 (label/instruction proximity)',
  sc333: '"If an input error is automatically detected and suggestions for correction are known, then the suggestions are provided to the user, unless it would jeopardize the security or purpose of the content." — WCAG 2.2 SC 3.3.3 Error Suggestion',
  intent333: '"The intent of this success criterion is to ensure that users receive appropriate suggestions for correction of an input error if it is possible." — Understanding SC 3.3.3 (Intent)',
  g177: '"The objective of this technique is to suggest correct text where the information supplied by the user is not accepted and possible correct text is known." — Technique G177 Providing suggested correction text',
  g177prox: '"Suggestions or links to the suggestions should be placed close to the form fields they are associated with, such as at the top of the form, preceding the form fields, or next to the form fields requiring correction." — Technique G177 Providing suggested correction text',
  g85: '"G85: Providing a text description when user input falls outside the required format or values" — Sufficient technique for SC 3.3.3 (Situation A)',
  g84: '"G84: Providing a text description when the user provides information that is not in the list of allowed values" — Sufficient technique for SC 3.3.3 (Situation B)',
  exc: '"...unless it would jeopardize the security or purpose of the content." — WCAG 2.2 SC 3.3.3 (security/purpose exception)',
  tt332: 'Trusted Tester 5.1.x form test conditions — a required-input control must have a label or instruction identifying the expected input, programmatically associated and proximate. EN 301 549 §9.3.3.2.',
  tt333: 'Trusted Tester 5.1.x error-suggestion test conditions — when input error is detected and a correction is known (and not security-restricted), a suggestion must be provided. EN 301 549 §9.3.3.3.',
};

module.exports = { ROOT, writeCase, writeManifest, validatorScript, add, manifests, CITE, HEAD };
