'use strict';
// Which elements of the PageModel the screening sweep shows for a criterion — the element kinds the criterion
// concerns (GenA11y extracted a per-criterion element set the same way). Deliberately broad: these choose what the
// model reads, not what is tested.
const WIDGET_ROLE = /^(button|link|checkbox|radio|switch|tab|menuitem|menuitemcheckbox|menuitemradio|option|slider|spinbutton|textbox|searchbox|combobox|listbox|menu|menubar|tablist|tree|treeitem|grid|gridcell|treegrid|radiogroup|toolbar|scrollbar|dialog|alertdialog)$/;
const has = (e, re) => re.test(e.openTag || '');
const role = (e) => String(e.role || '').split(/\s+/)[0];

const interactive = (e) => e.nativeFocusable || (e.tabindex !== null && e.tabindex !== undefined) || WIDGET_ROLE.test(role(e))
  || !!e.listeners || (e.inlineHandlers && e.inlineHandlers.length > 0) || e.cursorPointer
  || /^(iframe|summary|details|video|audio)$/.test(e.tag) || has(e, /\scontenteditable(=|\s|>)/);

const links = (e) => e.tag === 'a' || role(e) === 'link' || has(e, /\shref=/) || (e.cursorPointer && /click/.test(e.listeners || ''));

const images = (e) => /^(img|svg|canvas|object|embed|video|audio|picture|area|i)$/.test(e.tag) || role(e) === 'img'
  || (e.tag === 'input' && /type="image"/.test(e.openTag)) || has(e, /background(-image)?:[^;"]*url\(/);

const text = (e) => !!(e.text && e.text.trim()) && e.boxed;

const formish = (e) => /^(form|input|select|textarea|fieldset|label|output)$/.test(e.tag)
  || /^(textbox|searchbox|combobox|checkbox|radio|radiogroup|listbox|spinbutton|switch|slider|alert|status)$/.test(role(e))
  || has(e, /\saria-(invalid|errormessage|required)=/);

const live = (e) => /^(status|alert|log|marquee|timer|progressbar|alertdialog)$/.test(role(e)) || e.tag === 'output' || has(e, /\saria-live=/);

const stateful = (e) => has(e, /\saria-(selected|current|pressed|checked|expanded)=/);

const hoverish = (e) => interactive(e) || has(e, /\stitle=/) || has(e, /\saria-describedby=/) || role(e) === 'tooltip'
  || /mouse(over|enter)|pointerenter|focusin/.test(e.listeners || '');

const dialogs = (e) => e.tag === 'dialog' || /^(dialog|alertdialog)$/.test(role(e)) || has(e, /\saria-modal=/);

module.exports = {
  interactive, links, images, text, formish, live, stateful, hoverish, dialogs,
  any: (...fs) => (e, m) => fs.some((f) => f(e, m)),
};
