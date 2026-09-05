/* control.js - operator console.
 *
 * Everything here is a thin shell over /api/control/*; the server holds the
 * state and pushes it back over SSE, so two operators looking at the console at
 * once see the same thing, and a reload loses nothing.
 *
 * The console shows what the tools said about the current case. The participant
 * client never receives that - see clientTaskView in server.js.
 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var state = null;
  var es = null;
  var noteTimers = {};
  // Which participant's own page is open, if any. Null is the overview.
  var selected = null;

  function api(path, body, method) {
    return fetch('/api/control/' + path, {
      method: method || (body ? 'POST' : 'GET'),
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
        return j;
      });
    });
  }

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      // Booleans have to be handled as booleans. `setAttribute('disabled',
      // false)` writes disabled="false", and HTML disables on the attribute's
      // PRESENCE - so the false branch was disabling the very button it was
      // meant to leave alone.
      else if (attrs[k] === false || attrs[k] == null) { /* absent */ }
      else if (attrs[k] === true) n.setAttribute(k, '');
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  function msg(node, text, ok) {
    node.textContent = text;
    node.className = 'msg ' + (ok ? 'ok' : 'bad');
  }

  // --- login --------------------------------------------------------------
  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    $('login-error').textContent = '';
    api('login', { password: $('password').value })
      .then(function () { $('password').value = ''; start(); })
      .catch(function (err) { $('login-error').textContent = err.message; });
  });

  $('logout').addEventListener('click', function () {
    api('logout', {}).then(function () {
      if (es) { es.close(); es = null; }
      $('console').hidden = true;
      $('login').hidden = false;
      $('password').focus();
    });
  });

  function start() {
    $('login').hidden = true;
    $('console').hidden = false;
    connect();
  }

  function connect() {
    if (es) es.close();
    es = new EventSource('/api/control/events');
    es.addEventListener('state', function (ev) { render(JSON.parse(ev.data)); });
    es.addEventListener('focus', function (ev) {
      // A focus move is the highest-frequency event in the console; patch just
      // that participant instead of rebuilding every card and stealing focus
      // from whatever the operator is typing into.
      var d = JSON.parse(ev.data);
      if (!state) return;
      var p = state.participants.filter(function (x) { return x.id === d.participantId; })[0];
      if (!p) return;
      p.focus = d.focus;
      patchFocus(p);
    });
    es.addEventListener('ui', function (ev) {
      var d = JSON.parse(ev.data);
      if (!state) return;
      var p = state.participants.filter(function (x) { return x.id === d.participantId; })[0];
      if (!p) return;
      p.ui = d.ui;
      patchUi(p);
    });
    es.onerror = function () { /* EventSource retries on its own */ };
  }

  // --- rendering ----------------------------------------------------------
  function render(s) {
    state = s;
    $('live-dot').className = 'dot' + (s.live ? ' on' : '');
    $('live-label').textContent = s.live ? 'open — participants can see tasks' : (s.studyOpen ? 'open, no console stream' : 'closed');
    $('toggle-open').textContent = s.studyOpen ? 'Close study' : 'Open study';
    $('bar-sample').textContent = s.sample.cases + ' cases · ' + s.sample.file + ' · seed ' + s.sample.seed;
    // A participant who is removed while their page is open should not leave
    // the operator on a screen about nobody.
    if (selected && !s.participants.some(function (p) { return p.id === selected; })) selected = null;
    $('page-overview').hidden = !!selected;
    $('page-detail').hidden = !selected;
    if (selected) renderDetail(s.participants.filter(function (p) { return p.id === selected; })[0]);
    else {
      renderParticipants(s.participants);
      renderOverview(s.sample.totals);
    }
    // Outside the overview/detail branch: the assignment panel lives on the
    // overview page but its participant list has to stay current either way.
    renderAbilityPeople(s.participants);
    renderAbilityCounts(s.sample.abilityTotals);
  }

  function open(id) { selected = id; if (state) render(state); }

  $('detail-back').addEventListener('click', function () { open(null); });

  /** One row per participant: enough to watch a session, nothing that drives one. */
  function participantRow(p) {
    var cur = p.current;
    var answered = p.answeredCount || 0;
    return el('tr', { class: 'prow', onclick: function () { open(p.id); } }, [
      el('td', {}, [
        el('button', { class: 'linky', text: p.name, onclick: function (e) { e.stopPropagation(); open(p.id); } }),
        el('span', { class: 'dot' + (p.connected ? ' on' : ''), title: p.connected ? 'connected' : 'not connected' })
      ]),
      el('td', { class: 'num', text: answered + ' / ' + (p.taskCount || 0) }),
      el('td', { class: 'num' + (p.unansweredCount ? ' left-open' : ''), text: p.unansweredCount ? String(p.unansweredCount) : '—' }),
      el('td', { text: cur ? ('WCAG ' + cur.sc) : '—' }),
      el('td', { class: 'trunc', text: cur ? cur.page : '—' }),
      el('td', {}, [el('span', { class: 'pill' + (p.ui && p.ui.popupOpen ? ' on' : ''), 'data-popup-for': p.id,
        text: p.ui ? (p.ui.popupOpen ? 'evaluation open' : 'evaluation closed') : 'evaluation unknown' })]),
      el('td', { class: 'num', text: cur ? (cur.index + 1) + '/' + cur.total : '—' })
    ]);
  }

  function renderDetail(p) {
    if (!p) { open(null); return; }
    $('detail-name').textContent = p.name;
    $('detail-status').textContent = (p.answeredCount || 0) + ' of ' + (p.taskCount || 0) + ' answered' +
      (p.connected ? ' · connected' : ' · not connected');
    var host = $('detail-body');
    var active = document.activeElement;
    var keepId = active && active.dataset ? active.dataset.keep : null;
    var keepStart = keepId ? active.selectionStart : null;
    var keepEnd = keepId ? active.selectionEnd : null;
    var keepValue = keepId && typeof active.value === 'string' ? active.value : null;
    host.textContent = '';
    host.appendChild(participantCard(p));
    if (keepId) {
      var again = host.querySelector('[data-keep="' + keepId + '"]');
      if (again) {
        if (keepValue != null && again.value !== keepValue) again.value = keepValue;
        again.focus();
        try { again.setSelectionRange(keepStart, keepEnd); } catch (e) { /* not a text field */ }
      }
    }
  }

  function toolTag(label, flagged, lane) {
    if (!lane) return el('span', { class: 'tag nolane', text: label + ' no lane' });
    return el('span', { class: 'tag ' + (flagged ? 'flag' : 'clear'), text: label + (flagged ? ' flagged' : ' clear') });
  }

  function renderParticipants(list) {
    var host = $('participant-list');
    // The cards are rebuilt on every state push, and pushes arrive continuously
    // while a participant works. If the operator is mid-sentence in a note when
    // one lands, the rebuild would take the caret away AND overwrite what they
    // have typed with the server's copy, which is up to a debounce interval
    // behind. Carry the live field across the rebuild instead.
    var active = document.activeElement;
    var keepId = active && active.dataset ? active.dataset.keep : null;
    var keepStart = keepId ? active.selectionStart : null;
    var keepEnd = keepId ? active.selectionEnd : null;
    var keepValue = keepId && typeof active.value === 'string' ? active.value : null;
    host.textContent = '';
    if (!list.length) {
      host.appendChild(el('p', { class: 'empty', text: 'No participants yet. Add one to get a study link.' }));
      return;
    }
    host.appendChild(el('table', { class: 'ptable' }, [
      el('thead', {}, [el('tr', {}, [
        el('th', { text: 'participant' }), el('th', { class: 'num', text: 'answered' }),
        el('th', { class: 'num', text: 'left' }),
        el('th', { text: 'criterion' }), el('th', { text: 'page' }),
        el('th', { text: 'evaluation' }), el('th', { class: 'num', text: 'task' })
      ])]),
      el('tbody', {}, list.map(participantRow))
    ]));
    if (keepId) {
      var again = host.querySelector('[data-keep="' + keepId + '"]');
      if (again) {
        if (keepValue != null && again.value !== keepValue) again.value = keepValue;
        again.focus();
        try { again.setSelectionRange(keepStart, keepEnd); } catch (e) { /* not a text field */ }
      }
    }
  }

  /**
   * Every task this participant has, answered or not, as one clickable strip.
   *
   * The console could only ever show the task they happen to be on, so "what is
   * still outstanding" was a question the operator had no way to answer without
   * stepping through all forty. Answered is derived from `responses` - the
   * `status` map is the operator's own done/skipped flag and is not set by
   * answering, so it says nothing about whether the work is finished.
   */
  function taskGrid(p) {
    var ids = p.taskIds || [];
    var cells = ids.map(function (caseId, i) {
      var r = (p.responses || {})[caseId];
      var current = i === p.cursor;
      var b = el('button', {
        class: 'tcell ' + (r ? 'is-done' : 'is-open') + (current ? ' is-current' : ''),
        text: String(i + 1),
        title: (i + 1) + '. ' + caseId + (r ? ' — ' + answerText(r) : ' — not answered yet'),
        'aria-current': current ? 'true' : null,
        onclick: function () { api('nav', { participant: p.id, action: 'goto', index: i }); }
      });
      return b;
    });
    var left = ids.filter(function (id) { return !(p.responses || {})[id]; }).length;
    return el('div', { class: 'box' }, [
      el('h3', { text: 'Tasks' }),
      el('p', { class: 'note', text: left
        ? (ids.length - left) + ' of ' + ids.length + ' answered · ' + left + ' still outstanding'
        : 'all ' + ids.length + ' answered' }),
      el('div', { class: 'tgrid' }, cells)
    ]);
  }

  function participantCard(p) {
    var cur = p.current;
    var url = location.origin + p.url;

    var head = el('div', { class: 'pcard-head' }, [
      el('span', { class: 'pname', text: p.name }),
      el('span', { class: 'pill ' + (p.connected ? 'on' : 'off'), text: p.connected ? 'connected' : 'offline' }),
      el('span', { class: 'pill', text: p.answeredCount + '/' + p.taskCount + ' answered' }),
      el('span', { class: 'plink', title: url, text: url }),
      el('button', { class: 'ghost', text: 'Copy link', onclick: function () {
        navigator.clipboard.writeText(url).then(function () { this.textContent = 'Copied'; }.bind(this));
      } }),
      el('button', { class: 'ghost', text: 'New link', onclick: function () {
        if (confirm('Rotate ' + p.name + "'s link? Their current link stops working immediately.")) {
          api('participant-rotate', { participant: p.id });
        }
      } }),
      el('button', { class: 'ghost', text: 'Remove', onclick: function () {
        if (confirm('Remove ' + p.name + '? Their notes go with them.')) api('participant-remove', { participant: p.id });
      } })
    ]);

    var taskBox = el('div', { class: 'box' }, [el('h3', { text: 'Current task' })]);
    if (!cur) {
      taskBox.appendChild(el('p', { class: 'empty', text: p.taskCount ? 'not started' : 'no tasks assigned' }));
    } else {
      var kv = el('dl', { class: 'kv' }, [
        el('dt', { text: 'case' }), el('dd', { class: 'mono', text: cur.caseId + '  (' + (cur.index + 1) + '/' + cur.total + ')' }),
        el('dt', { text: 'SC' }), el('dd', { text: 'WCAG ' + cur.sc + (cur.scope === 'page' ? '  · whole page' : '') }),
        el('dt', { text: 'page' }), el('dd', { text: cur.page }),
        el('dt', { text: 'target' }), el('dd', { class: 'mono', text: cur.scope === 'page' ? '(page-scope, nothing highlighted)' : cur.xpath }),
        el('dt', { text: 'element' }), el('dd', { text: cur.element ? (cur.element.tag + (cur.element.axRole ? ' · ' + cur.element.axRole : '') + (cur.element.axName ? ' · "' + cur.element.axName + '"' : '')) : '—' }),
        el('dt', { text: 'stratum' }), el('dd', { text: cur.stratum + '  ' + cur.pattern })
      ]);
      taskBox.appendChild(kv);
      taskBox.appendChild(el('div', { class: 'tools' }, [
        toolTag('harness', cur.tools.harness.flagged, cur.lanes.harness),
        toolTag('GenA11y', cur.tools.gena11y.flagged, cur.lanes.gena11y),
        toolTag('axe', cur.tools.axe.flagged, cur.lanes.axe)
      ]));
    }

    var focusBox = el('div', { class: 'box', 'data-focus-for': p.id }, [el('h3', { text: 'Current focus' })]);
    focusBox.appendChild(focusBody(p));

    // What this participant is being shown, and what they said about it. The
    // letters mean something different for every participant, so the mapping
    // has to sit on screen next to their answer or the answer is unreadable.
    var blindBox = el('div', { class: 'box' }, [el('h3', { text: 'Evaluation view (as they see it)' })]);
    if (!cur) {
      blindBox.appendChild(el('p', { class: 'empty', text: 'no task' }));
    } else {
      blindBox.appendChild(el('div', { class: 'blind-cols' }, cur.blinded.columns.map(function (c) {
        return el('div', { class: 'blind-col ' + (c.verdict === 'problem' ? 'is-problem' : 'is-clear') }, [
          el('span', { class: 'blind-letter', text: c.label }),
          el('span', { class: 'blind-tool', text: p.toolLabels[c.label] }),
          el('span', { class: 'blind-verdict', text: c.verdict === 'problem' ? 'problem' : 'clear' }),
          c.evaluates ? null : el('span', { class: 'blind-nolane', text: 'no lane' }),
          // The participant reads this sentence, so the operator should see the
          // same words when a question comes back about it.
          c.reason ? el('p', { class: 'blind-reason', text: c.reason }) : null
        ]);
      })));
      blindBox.appendChild(el('p', { class: 'note', text: cur.blinded.agree
        ? 'All three agree - they see one column labelled 1, 2, 3.'
        : 'They see three separate columns.' }));
      var r = cur.response;
      blindBox.appendChild(el('dl', { class: 'kv' }, [
        el('dt', { text: 'answer' }),
        el('dd', { class: r ? 'answer-given' : 'empty', text: !r ? 'not answered yet' : answerText(r) }),
        el('dt', { text: 'comment' }), el('dd', { text: (r && r.comment) || '\u2014' })
      ]));
      blindBox.appendChild(answerPicker(p, cur, r));
    }

    var tasksBox = taskGrid(p);

    var popupBox = el('span', { class: 'pill' + (p.ui && p.ui.popupOpen ? ' on' : ''), 'data-popup-for': p.id,
      text: p.ui ? (p.ui.popupOpen ? 'evaluation open' : 'evaluation closed') : 'evaluation unknown' });

    var nav = el('div', { class: 'nav' }, [
      el('button', { class: 'key', text: '← Prev', onclick: function () { api('nav', { participant: p.id, action: 'prev' }); } }),
      el('button', { class: 'key', text: 'Next →', onclick: function () { api('nav', { participant: p.id, action: 'next' }); } }),
      // Wraps, so it still finds the gaps once they have run to the end.
      el('button', {
        class: 'key',
        text: p.unansweredCount ? 'Next unfinished (' + p.unansweredCount + ')' : 'All answered',
        disabled: !p.unansweredCount,
        onclick: function () { api('nav', { participant: p.id, action: 'next-unanswered' }); }
      }),
      el('button', { text: 'Reload page', onclick: function () { api('nav', { participant: p.id, action: 'reload' }); } }),
      el('button', { text: 'Show highlight', onclick: function () { api('highlight', { participant: p.id, action: 'show' }); } }),
      el('button', { text: 'Focus target', onclick: function () { api('highlight', { participant: p.id, action: 'show', focus: true }); } }),
      el('button', { text: p.ui && p.ui.popupOpen ? 'Hide evaluation' : 'Show evaluation', onclick: function () {
        api('popup', { participant: p.id, action: p.ui && p.ui.popupOpen ? 'hide' : 'show' });
      } }),
      el('span', { class: 'idx', text: 'go to' }),
      (function () {
        var i = el('input', { type: 'number', min: '1', max: String(p.taskCount || 1), size: '4', value: String((p.cursor || 0) + 1), 'data-keep': p.id + ':goto' });
        i.style.width = '5.5em';
        i.addEventListener('change', function () { api('nav', { participant: p.id, action: 'goto', index: Number(i.value) - 1 }); });
        return i;
      })()
    ]);

    // The keep key names the case as well as the field: a live edit should
    // survive a rebuild of the SAME task, and must not be carried over when the
    // participant has moved on to a different one.
    var noteArea = el('textarea', { rows: '2', placeholder: 'Notes for this task (optional)', 'data-keep': p.id + ':note:' + (cur ? cur.caseId : 'none') });
    noteArea.value = cur ? (cur.note || '') : '';
    noteArea.disabled = !cur;
    noteArea.addEventListener('input', function () {
      // Debounced write-through: the operator is usually typing while watching
      // the participant, and a note lost to a navigation would be worse than a
      // slightly late save.
      var key = p.id + ':note:' + cur.caseId;
      if (noteTimers[key]) clearTimeout(noteTimers[key]);
      noteTimers[key] = setTimeout(function () {
        api('note', { participant: p.id, caseId: cur.caseId, note: noteArea.value });
      }, 400);
    });
    var noteRow = el('div', { class: 'note-row' }, [
      noteArea,
      el('button', { text: 'Done', onclick: function () {
        if (cur) api('note', { participant: p.id, caseId: cur.caseId, note: noteArea.value, status: 'done' });
      } }),
      el('button', { text: 'Skip', onclick: function () {
        if (cur) api('note', { participant: p.id, caseId: cur.caseId, note: noteArea.value, status: 'skipped' });
      } })
    ]);

    head.appendChild(popupBox);
    return el('div', { class: 'pcard' }, [
      head,
      // Directly under the name: "what is left" is the question the operator
      // opens this page to answer, and every cell is also the way to get there.
      tasksBox,
      el('div', { class: 'pcard-grid' }, [taskBox, focusBox]),
      blindBox,
      nav,
      noteRow
    ]);
  }

  /**
 * Enter an answer for the participant - reading it out over a call, working
 * through a case together.
 *
 * The same four options they have, and it goes through the same recorder on the
 * server, which writes down that the operator gave it. An answer typed here is
 * a different kind of measurement from one the participant gave and the
 * analysis has to be able to tell them apart.
 */
function answerPicker(p, cur, existing) {
  var chosen = {};
  (Array.isArray(existing && existing.choices) ? existing.choices : []).forEach(function (c) { chosen[c] = true; });
  var comment = el('input', { type: 'text', placeholder: 'reason (required for 4)', 'data-keep': p.id + ':answer:' + cur.caseId });
  comment.value = (existing && existing.comment) || '';
  // The outcome of the operator's own action, success or failure, so it has to
  // be a live region like the panel's other message lines - it is created in
  // script rather than markup, which is the only reason it was not one.
  var err = el('p', { class: 'msg', role: 'status', 'aria-live': 'polite' });

  var options = cur.blinded.agree
    ? [{ value: 'all', label: '1, 2, 3' }]
    : cur.blinded.columns.map(function (c) { return { value: c.label, label: c.label }; });
  options.push({ value: 'disagree', label: '4' });

  var buttons = options.map(function (o) {
    var b = el('button', {
      class: 'pick' + (chosen[o.value] ? ' on' : ''),
      'aria-pressed': chosen[o.value] ? 'true' : 'false',
      text: o.label,
      onclick: function () {
        // Same exclusivity the participant's own view has: 4 clears the rest,
        // any of the others clears 4.
        if (o.value === 'disagree') { chosen = { disagree: !chosen.disagree }; }
        else { chosen.disagree = false; chosen[o.value] = !chosen[o.value]; }
        buttons.forEach(function (btn, i) {
          var on = !!chosen[options[i].value];
          btn.className = 'pick' + (on ? ' on' : '');
          btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        err.textContent = '';
      }
    });
    return b;
  });

  var send = el('button', { class: 'key', text: 'Record answer', onclick: function () {
    var choices = options.map(function (o) { return o.value; }).filter(function (v) { return chosen[v]; });
    api('answer', { participant: p.id, caseId: cur.caseId, choices: choices, comment: comment.value })
      .then(function () { err.textContent = 'recorded'; err.className = 'msg ok'; })
      .catch(function (e) { err.textContent = e.message; err.className = 'msg bad'; });
  } });

  return el('div', { class: 'picker' }, [
    el('h4', { text: 'Answer for them' }),
    el('div', { class: 'picks' }, buttons.concat([send])),
    comment,
    err
  ]);
}

/**
 * An answer in words. Handles both shapes: answers recorded before multiple
 * selection carry a single `choice`, and nothing rewrites them.
 */
function answerText(r) {
  var choices = Array.isArray(r.choices) ? r.choices : (r.choice ? [r.choice] : []);
  var tools = Array.isArray(r.tools) ? r.tools : (r.tool ? [r.tool] : []);
  if (!choices.length) return 'not answered yet';
  if (choices.indexOf('disagree') >= 0) return 'disagrees with all';
  if (choices.indexOf('all') >= 0) return 'agrees with all (1, 2, 3)';
  return 'chose ' + choices.join(', ') + ' = ' + tools.join(', ');
}

function focusBody(p) {
    var f = p.focus;
    if (!f) return el('p', { class: 'empty', text: 'nothing reported yet' });
    var cur = p.current;
    var onTarget = f.isTarget || (cur && cur.xpath && f.xpath === cur.xpath);
    // data-field on each value: the console's text content runs together when
    // read as a string (a <dt> and its <dd> have no separator), so anything
    // reading this panel back - a test, a screen-scrape - gets a stable hook
    // rather than having to guess where one field ends.
    var row = function (key, label, text, cls) {
      return [el('dt', { text: label }), el('dd', { class: cls, 'data-field': key, text: text })];
    };
    return el('dl', { class: 'kv' }, [].concat(
      row('element', 'element', (f.tag || '?') + (f.role ? ' · ' + f.role : '')),
      row('name', 'name', f.name || '—'),
      row('path', 'path', f.xpath || '—', 'mono'),
      row('where', 'where', f.where === 'shell' ? 'study chrome' : 'page'),
      row('onTarget', 'on target', onTarget ? 'yes' : 'no', onTarget ? 'target-hit' : 'target-miss'),
      row('highlight', 'highlight', f.highlightVisible ? 'visible' : 'hidden'),
      row('popup', 'evaluation view', f.popupOpen ? 'open' : 'closed'),
      row('at', 'at', new Date(f.at).toLocaleTimeString())
    ));
  }

  function patchUi(p) {
    var pill = document.querySelector('[data-popup-for="' + p.id + '"]');
    if (!pill) return;
    pill.className = 'pill' + (p.ui && p.ui.popupOpen ? ' on' : '');
    pill.textContent = p.ui ? (p.ui.popupOpen ? 'evaluation open' : 'evaluation closed') : 'evaluation unknown';
  }

  function patchFocus(p) {
    var box = document.querySelector('[data-focus-for="' + p.id + '"]');
    if (!box) return;
    while (box.childNodes.length > 1) box.removeChild(box.lastChild);
    box.appendChild(focusBody(p));
  }

  function renderOverview(totals) {
    var host = $('sample-overview');
    if (!totals) { host.textContent = ''; return; }
    host.textContent = '';
    var mk = function (title, obj) {
      var rows = Object.keys(obj).sort().map(function (k) {
        return el('tr', {}, [el('td', { text: k }), el('td', { text: String(obj[k]) })]);
      });
      return el('table', { class: 'ov' }, [
        el('thead', {}, [el('tr', {}, [el('th', { text: title }), el('th', { text: 'n' })])]),
        el('tbody', {}, rows)
      ]);
    };
    host.appendChild(mk('stratum', totals.byStratum || {}));
    host.appendChild(mk('pattern (H/G/A flagged)', totals.byPattern || {}));
    host.appendChild(mk('scope', totals.byScope || {}));
    host.appendChild(el('p', { class: 'note', text: totals.scsCovered + ' of ' + totals.scsInSource + ' success criteria · ' + totals.pagesCovered + ' pages' }));
  }

  // --- actions ------------------------------------------------------------
  $('toggle-open').addEventListener('click', function () {
    api('open', { open: !(state && state.studyOpen) });
  });

  $('add-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('add-name').value.trim();
    api('participants', name ? { names: [name] } : { count: 1 }).then(function () { $('add-name').value = ''; });
  });

  $('split-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var body = {
      mode: $('split-mode').value,
      anchor: Number($('split-anchor').value || 0),
      seed: Number($('split-seed').value || 20260825)
    };
    var raw = $('split-filter').value.trim();
    if (raw) {
      try { body.selection = JSON.parse(raw); }
      catch (err) { return msg($('split-msg'), 'Pool filter is not valid JSON: ' + err.message, false); }
    }
    api('split', body)
      .then(function (r) {
        msg($('split-msg'), 'Split across ' + r.assigned.length + ' participant(s): ' +
          r.assigned.map(function (p) { return p.name + ' ' + p.taskCount; }).join(', '), true);
      })
      .catch(function (err) { msg($('split-msg'), err.message, false); });
  });

  $('dict-example').addEventListener('click', function () {
    var names = (state && state.participants.length ? state.participants : [{ name: 'P1' }, { name: 'P2' }]).map(function (p) { return p.name; });
    var ex = {};
    ex[names[0]] = { strata: ['ALL_ISSUE', 'DIFFER'], scs: ['1.1.1', '2.4.4', '4.1.2'], shuffle: true, seed: 1 };
    if (names[1]) ex[names[1]] = { pages: ['Domino\'s.htm', 'Kahoot!.htm'], limit: 20 };
    $('dict-json').value = JSON.stringify(ex, null, 2);
  });

  // --- assign by ability ---------------------------------------------------
  // The participant checkboxes are rebuilt from state rather than written once,
  // because participants can be added and removed while this panel is open.
  function renderAbilityPeople(list) {
    var host = $('ability-people');
    if (!host) return;
    var checked = {};
    [].forEach.call(host.querySelectorAll('input[type=checkbox]'), function (b) { checked[b.value] = b.checked; });
    host.textContent = '';
    if (!list.length) {
      host.appendChild(el('p', { class: 'empty', text: 'No participants yet.' }));
      return;
    }
    list.forEach(function (p) {
      var box = el('input', { type: 'checkbox', value: p.id });
      box.checked = !!checked[p.id];
      var mix = Object.keys(p.abilityMix || {}).map(function (k) { return k + ' ' + p.abilityMix[k]; }).join(' · ');
      host.appendChild(el('label', {}, [
        box, ' ' + p.name + ' ',
        el('span', { class: 'note', text: mix ? '(' + mix + ')' : '(no tasks)' })
      ]));
    });
  }

  /** How big each pool is, so the operator can see what they are handing out. */
  function renderAbilityCounts(totals) {
    ['vision', 'screenreader', 'other'].forEach(function (k) {
      var t = $('ability-n-' + k);
      if (t) t.textContent = '(' + ((totals || {})[k] || 0) + ' cases)';
    });
  }

  $('ability-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var people = [].filter.call($('ability-people').querySelectorAll('input[type=checkbox]'), function (b) { return b.checked; })
      .map(function (b) { return b.value; });
    var abilities = [].filter.call(document.querySelectorAll('#ability-form input[name=ability]'), function (b) { return b.checked; })
      .map(function (b) { return b.value; });
    if (!people.length) return msg($('ability-msg'), 'Choose at least one participant.', false);
    if (!abilities.length) return msg($('ability-msg'), 'Choose at least one task type.', false);
    api('assign-by-ability', {
      participants: people, abilities: abilities, mode: $('ability-mode').value,
      anchor: Number($('ability-anchor').value) || 0, seed: Number($('ability-seed').value) || undefined
    })
      .then(function (r) {
        var who = r.assigned.map(function (p) { return p.name + ' ' + p.taskCount; }).join(', ');
        var text = (r.mode === 'each' ? 'Gave each of ' : 'Divided ') + r.pool + ' ' + r.abilities.join(' + ') +
          ' cases: ' + who;
        // An answer that no longer has a task is the one consequence of
        // reassigning that cannot be undone by reassigning again.
        if (r.orphaned && r.orphaned.length) {
          text += ' — WARNING: ' + r.orphaned.map(function (o) {
            return o.participant + ' has ' + o.answers + ' answer(s) outside their new list';
          }).join('; ');
        }
        msg($('ability-msg'), text, !(r.orphaned && r.orphaned.length));
      })
      .catch(function (err) { msg($('ability-msg'), err.message, false); });
  });

  $('dict-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var raw = $('dict-json').value.trim();
    if (!raw) return msg($('dict-msg'), 'Nothing to apply.', false);
    var dict;
    try { dict = JSON.parse(raw); }
    catch (err) { return msg($('dict-msg'), 'Not valid JSON: ' + err.message, false); }
    api('assign', { selection: dict })
      .then(function (r) {
        var text = 'Assigned: ' + r.assigned.map(function (p) { return p.name + ' ' + p.taskCount; }).join(', ');
        if (r.problems && r.problems.length) text += '  |  problems: ' + JSON.stringify(r.problems);
        msg($('dict-msg'), text, !(r.problems && r.problems.length));
      })
      .catch(function (err) { msg($('dict-msg'), err.message, false); });
  });

  // Already signed in? Go straight to the console.
  api('state').then(start).catch(function () { $('password').focus(); });
})();
