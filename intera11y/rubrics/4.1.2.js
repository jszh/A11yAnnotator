'use strict';
// 4.1.2 Name, Role, Value. Rules 1–6: GenA11y's detect_name_role_value test rules, with the parts that are not
// 4.1.2 removed — "descriptive" names (a descriptive name is 2.4.6), "one label per field", and rule 7 ("Links
// must have valid href values"). Rule 7 below is added in the same style.
module.exports = {
  sc: '4.1.2', title: 'Name, Role, Value',
  rules: [
    {
      from: 'gena11y',
      text: 'Buttons must have non-empty accessible names.',
      tools: [],
      rubric: `An element with the button role exposed to assistive technology with an empty computed name fails (ACT 97a4e1; F68). Evidence: computed role, name and name source.`,
    },
    {
      from: 'gena11y',
      text: 'Elements with aria-hidden must not receive focus.',
      tools: ['query_ax_node', 'interact_and_observe'],
      rubric: `Keyboard focus that rests on an element that is aria-hidden, or inside an aria-hidden container, fails (ACT 6cfa84): assistive technology is told the focused element does not exist. It passes when the element cannot actually receive focus (display:none or visibility:hidden, or a focus sentinel that immediately moves focus elsewhere). Evidence: whether it was a Tab stop and what held focus.`,
    },
    {
      from: 'gena11y',
      text: 'Form fields must have non-empty accessible names.',
      tools: [],
      rubric: `A form field (textbox, combobox, listbox, checkbox, radio, slider, spinbutton, switch, searchbox) exposed to assistive technology with an empty computed name fails (ACT e086e5; F68). A placeholder alone, where the browser uses it as the name, is a name.`,
    },
    {
      from: 'gena11y',
      text: 'Menu items must have non-empty accessible names.',
      tools: [],
      rubric: `An element with a menuitem, menuitemcheckbox or menuitemradio role and an empty computed name fails (ACT m6b1q3).`,
    },
    {
      from: 'gena11y',
      text: 'Iframes must have non-empty accessible names; identical names → same purpose.',
      tools: ['compare_iframe_content'],
      rubric: `An iframe in the accessibility tree with an empty computed name fails (ACT cae760), unless it is removed from focus (tabindex="-1") and holds no interactive content. Iframes with the same name fail when their content serves different purposes (ACT 4b1c6c). compare_iframe_content compares same-named frames.`,
    },
    {
      from: 'gena11y',
      text: 'div/span used as controls (with onclick/keydown) must have an appropriate ARIA role.',
      tools: ['observe_state_after_activation', 'interact_and_observe'],
      rubric: `An element the page makes operable with script (a click or key handler that does something a user notices) fails when assistive technology receives no widget role for it — it is read as text or as a generic element (F59). It passes when it has a matching role, or when it only forwards to a native control it contains. Evidence: its handlers, computed role, and what operating it did.`,
    },
    {
      from: 'added',
      text: 'Custom controls must expose the states and values their role needs (checked, expanded, selected, pressed, value) and update them — and their name — when operated.',
      tools: ['observe_state_after_activation', 'interact_and_observe', 'query_ax_node'],
      rubric: `4.1.2 requires that states, properties and values that can be set by the user can be programmatically determined and that changes are notified. It fails when a widget role lacks a state it requires (a role="checkbox" without aria-checked; ACT 4e8ab6), or when operating a component visibly changes its state (expands, selects, toggles) and no exposed state changes to match, or its name no longer matches its function (a Play button that now pauses). A visual change that is not a state (an action performed, a navigation) passes. An ARIA or HTML authoring error that does not change what assistive technology receives for a component is not a failure of this criterion. Evidence: the trigger's ARIA attributes and computed states before and after operation, what was revealed or hidden.`,
    },
  ],
};
