/* client.js - the participant side of the study.
 *
 * What this file is allowed to do to the page under evaluation is the whole
 * design problem. The participant is judging that page's accessibility, so any
 * marker the study adds could change the answer. The rules it follows:
 *
 *   1. The visible highlight is a separate absolutely-positioned box that is
 *      `aria-hidden="true"` and not focusable. It sits over the target; it
 *      never restyles it. Assistive technology cannot see it at all.
 *   2. Nothing is added to the target that a screen reader would read: no
 *      aria-label, no aria-describedby, no wrapper, no live region on it. The
 *      only attribute ever set on the target is `tabindex="-1"`, and only when
 *      the element is not already focusable, so that Shift+Enter can put focus
 *      there. It is removed again when the highlight is dismissed or the task
 *      changes. `tabindex="-1"` adds no name, no role, and no tab stop.
 *   3. Escape is observed, never swallowed. Several tasks are about what the
 *      page itself does with Escape (keyboard traps, dialogs), so the key is
 *      handled on the bubble phase with no preventDefault - the page sees it
 *      exactly as it would without the study.
 *
 * Shift+Enter is the one key the study takes for itself; it is captured and
 * stopped, because "get me back to the thing I am supposed to be looking at"
 * has to work even from inside a widget that handles Enter.
 */
(function () {
  'use strict';

  var qs = function (id) { return document.getElementById(id); };
  var frame = qs('page-frame');
  var waiting = qs('waiting');
  var waitingText = qs('waiting-text');
  var waitingSub = qs('waiting-sub');
  var taskline = qs('taskline');
  var coverNote = qs('cover-note');
  var announcer = qs('announcer');
  var dialog = qs('tool-dialog');
  var toolForm = qs('tool-form');
  var toolGrid = qs('tool-grid');
  var toolTitle = qs('tool-dialog-title');
  var toolSub = qs('tool-dialog-sub');
  var toolError = qs('tool-error');
  var commentField = qs('comment-field');
  var commentInput = qs('disagree-comment');
  var disagreeRadio = qs('choice-disagree');
  var btnContinue = qs('tool-continue');
  var btnFocus = qs('toggle-focus');
  var btnFocusLabel = qs('toggle-focus-label');
  var btnFocusKey = qs('toggle-focus-key');
  var btnTools = qs('toggle-tools');
  var btnToolsLabel = qs('toggle-tools-label');
  var btnToolsKey = qs('toggle-tools-key');

  var state = { live: false, task: null, index: 0, total: 0 };
  var target = null;          // the highlighted element, inside the frame
  var highlightOn = false;
  var tempTabindex = null;    // element we added tabindex="-1" to
  var rafId = null;
  var lastBox = '';
  var lastFocusSent = '';
  var flashAnim = null;      // the ring's blink, cancelled before a new one
  var keyToggle = false;     // is this selection coming from a number key?
  var covered = false;       // is the target hidden behind the page's own content?
  var coverPending = null;   // a change waiting to be held long enough to be real
  var coverCheckedAt = 0;
  var outlineCheckedAt = 0;
  var lastOutline = '';      // the outline last drawn, so it is not rebuilt every frame
  var anchorMode = 'document'; // 'document' or 'viewport' - learned from the page
  var lastScroll = null;     // what the element's viewport position did last time the page scrolled

  // Symbols on a Mac, words everywhere else: "\u2325" means nothing on Windows,
  // and "Alt" is wrong on a Mac keyboard.
  var MAC = /Mac|iPhone|iPad/.test((navigator.platform || '') + ' ' + (navigator.userAgent || ''));
  var KEY_FOCUS = MAC ? '\u21e7\u23ce' : 'Shift+Enter';
  var KEY_EVAL = MAC ? '\u2325\u23ce' : 'Alt+Enter';
  var KEY_HIDE = 'Esc';

  var loadToken = 0;          // cancels target lookups left over from a previous task
  var HL_ID = 'a11ystudy-highlight-ring';
  var TEMP_ATTR = 'data-a11ystudy-temp-tabindex';
  var NOTHING_CHOSEN = 'Choose a result, or say you disagree with all of them.';
  // Which task the evaluation view is currently built for.
  var dialogTaskId = null;

  // --- announcements ------------------------------------------------------
  function announce(text) {
    // Clearing first makes repeat announcements of identical text speak again.
    announcer.textContent = '';
    window.setTimeout(function () { announcer.textContent = text; }, 40);
  }

  /**
   * The evaluation view's error message.
   *
   * `#tool-error` is a live region in its own right (role="alert", which is
   * assertive by definition), so writing into it is what announces it - the
   * message a sighted participant reads and the message a screen reader speaks
   * are the same node, and neither can drift from the other. The one thing a
   * live region will not do is speak text it is already showing, which is
   * exactly the repeat case here: pressing Enter twice with nothing chosen has
   * to say so twice. Re-setting identical text takes the node empty for a frame
   * first so the region fires again.
   */
  function showToolError(text) {
    if (toolError.textContent === text) {
      toolError.textContent = '';
      window.setTimeout(function () { toolError.textContent = text; }, 40);
      return;
    }
    toolError.textContent = text;
  }

  function clearToolError() { toolError.textContent = ''; }

  // --- structural xpath, the same shape the corpus uses --------------------
  function xpathOf(el) {
    if (!el || !el.tagName) return '';
    var doc = el.ownerDocument;
    // The two special cases are not cosmetic: the corpus's collector emits
    // '/html' and '/html/body' unindexed, and the console compares the focused
    // element's path against the case's path as strings. Emitting
    // '/html/body[1]/...' here would make every report look off-target.
    if (el === doc.documentElement) return '/html';
    if (el === doc.body && el.tagName === 'BODY') return '/html/body';
    if (!el.parentElement) return '';
    var tag = String(el.tagName).toLowerCase();
    var idx = 1;
    for (var s = el.previousElementSibling; s; s = s.previousElementSibling) {
      if (s.tagName === el.tagName) idx++;
    }
    return xpathOf(el.parentElement) + '/' + tag + '[' + idx + ']';
  }

  function describe(el) {
    if (!el || !el.tagName) return null;
    var name = el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('title') || '';
    if (!name) name = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    return {
      xpath: xpathOf(el),
      tag: String(el.tagName).toLowerCase(),
      role: el.getAttribute('role') || null,
      name: name || null
    };
  }

  // --- transport ----------------------------------------------------------
  function post(path, body) {
    return fetch('/api/client/' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    }).catch(function () { /* the operator's console will show the drop-out */ });
  }

  var focusTimer = null;
  function reportFocus(el, where) {
    var d = describe(el);
    if (!d) return;
    var key = where + '|' + d.xpath;
    if (key === lastFocusSent) return;
    lastFocusSent = key;
    if (focusTimer) window.clearTimeout(focusTimer);
    focusTimer = window.setTimeout(function () {
      post('focus', {
        caseId: state.task ? state.task.caseId : null,
        xpath: d.xpath, tag: d.tag, role: d.role, name: d.name,
        isTarget: !!(target && el === target),
        where: where,
        highlightVisible: highlightOn,
        popupOpen: !!(dialog && dialog.open)
      });
    }, 120);
  }

  // --- the highlight ------------------------------------------------------
  //
  // An SVG, not a bordered div. The marker has to be able to go dashed along
  // just the stretch of its outline where the page has drawn something over the
  // element, and the gaps have to go all the way through: a box-shadow halo
  // stays solid behind a dashed border and fills the gaps straight back in. Two
  // strokes on the same geometry sharing one dash pattern is the only way to
  // get a gap that actually shows the page through.
  var STROKE_OUTER = 8;   // white, underneath
  var STROKE_INNER = 4;   // orange, on top
  var DASH = '9 7';
  var PATH_INSET = STROKE_OUTER / 2;  // so the outermost paint lands on the box
  var SVGNS = 'http://www.w3.org/2000/svg';

  function ringFor(doc) {
    var svg = doc.getElementById(HL_ID);
    if (svg) return svg;
    svg = doc.createElementNS(SVGNS, 'svg');
    svg.id = HL_ID;
    // aria-hidden + no role: assistive technology must not be able to perceive
    // the study's marker, only the element underneath it.
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.cssText = [
      'position:absolute',
      'z-index:2147483646',
      'pointer-events:none',
      'overflow:visible',
      'background:transparent',
      'margin:0',
      'padding:0',
      'border:0',
      'display:none'
    ].join(';');
    (doc.body || doc.documentElement).appendChild(svg);
    return svg;
  }

  /**
   * White outline on a dark backdrop, black on a light one.
   *
   * The orange is the marker; the outline behind it is what keeps the marker's
   * edge legible, and a white outline on a white page is not an outline. So the
   * backdrop is sampled around the marker and the outline takes whichever of
   * black or white contrasts with it.
   *
   * The sampling is honest about what it can and cannot see. There is no way to
   * read rendered pixels from script, so what it reads is the first ancestor at
   * each point with a background colour that is not transparent. A photograph or
   * a video therefore reads as whatever is painted behind it, which is usually
   * the page - and where nothing resolves at all it keeps white, which is the
   * safer default over imagery.
   */
  function luminanceOf(css) {
    var m = /^rgba?\(([^)]+)\)$/.exec(css || '');
    if (!m) return null;
    var parts = m[1].split(',').map(function (x) { return parseFloat(x); });
    if (parts.length > 3 && parts[3] < 0.5) return null; // see-through: not a backdrop
    var lin = parts.slice(0, 3).map(function (v) {
      var c = v / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  }

  function backdropLuminance(doc, win, vb) {
    var pts = [];
    for (var i = 0; i < 5; i++) {
      var t = (i + 0.5) / 5;
      pts.push([vb.x + vb.w * t, vb.y + 2], [vb.x + vb.w * t, vb.y + vb.h - 2],
               [vb.x + 2, vb.y + vb.h * t], [vb.x + vb.w - 2, vb.y + vb.h * t]);
    }
    var sum = 0, n = 0;
    for (var k = 0; k < pts.length; k++) {
      var x = pts[k][0], y = pts[k][1];
      if (x < 0 || y < 0 || x > win.innerWidth || y > win.innerHeight) continue;
      var el = null;
      try { el = doc.elementFromPoint(x, y); } catch (e) { el = null; }
      while (el && el.nodeType === 1) {
        var l = luminanceOf(win.getComputedStyle(el).backgroundColor);
        if (l !== null) { sum += l; n++; break; }
        el = el.parentElement;
      }
    }
    return n ? sum / n : null;
  }

  /**
   * The four edges of the outline, in the SVG's own coordinates.
   *
   * Each edge runs the FULL width or height rather than stopping short at the
   * corners. Butt caps are compulsory here (see drawOutline), and butt caps
   * would otherwise leave a notch half a stroke wide at every corner; running
   * the edges past each other fills them, and the overhang lands exactly where
   * the neighbouring stroke already is, so nothing sticks out.
   */
  function edgeGeometry(w, h) {
    var a = PATH_INSET, x1 = Math.max(a, w - PATH_INSET), y1 = Math.max(a, h - PATH_INSET);
    return [
      { x: 0, y: a, dx: 1, dy: 0, len: w, inx: 0, iny: 1 },    // top
      { x: x1, y: 0, dx: 0, dy: 1, len: h, inx: -1, iny: 0 },  // right
      { x: w, y: y1, dx: -1, dy: 0, len: w, inx: 0, iny: -1 }, // bottom
      { x: a, y: h, dx: 0, dy: -1, len: h, inx: 1, iny: 0 }    // left
    ];
  }

  /**
   * Which stretches of the outline sit over something the page has drawn on
   * top of the element.
   *
   * Sampled a few pixels inside the outline, so what is measured is what the
   * marker is actually tracing - including the clamped case, where the outline
   * is inside the element rather than around it. The marker itself is
   * pointer-events:none, so it never turns up in the hit test.
   *
   * A point outside the viewport is not "covered", it is just not on screen,
   * and is reported as clear: the alternative is an element half off the bottom
   * of the page wearing a dashed edge for no reason.
   *
   * @returns {Array<Array<{to:number,covered:boolean}>>} one run-list per edge
   */
  function sampleOutline(el, vb) {
    var doc = el.ownerDocument;
    var win = doc.defaultView;
    var geoms = edgeGeometry(vb.w, vb.h);
    var out = [];
    for (var e = 0; e < geoms.length; e++) {
      var g = geoms[e];
      var n = Math.max(2, Math.min(24, Math.round(g.len / 24)));
      // Far enough in to be over the element rather than over its own outline,
      // but never past the middle of a small box.
      var inset = Math.min(PATH_INSET + 3, Math.max(vb.w, vb.h) / 2);
      var runs = [], prev = null;
      for (var i = 0; i < n; i++) {
        var t = g.len * (i + 0.5) / n;
        var lx = g.x + g.dx * t + g.inx * inset;
        var ly = g.y + g.dy * t + g.iny * inset;
        var px = vb.x + lx, py = vb.y + ly;
        var cov = false;
        if (px >= 0 && py >= 0 && px <= win.innerWidth && py <= win.innerHeight) {
          var top = null;
          try { top = doc.elementFromPoint(px, py); } catch (err) { top = null; }
          cov = !(top === el || (top && el.contains(top)));
        }
        var to = g.len * (i + 1) / n;
        if (prev && prev.covered === cov) prev.to = to;
        else { prev = { to: to, covered: cov }; runs.push(prev); }
      }
      out.push(runs);
    }
    return out;
  }

  function outlineKey(w, h, edges) {
    var k = w + 'x' + h;
    for (var i = 0; i < edges.length; i++) {
      for (var j = 0; j < edges[i].length; j++) k += '|' + Math.round(edges[i][j].to) + (edges[i][j].covered ? 'c' : 'v');
      k += ';';
    }
    return k;
  }

  function drawOutline(svg, w, h, edges, outline) {
    var doc = svg.ownerDocument;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    var geoms = edgeGeometry(w, h);
    // White first, orange over it, so the orange is never broken by a later
    // white segment crossing a corner.
    for (var pass = 0; pass < 2; pass++) {
      for (var e = 0; e < geoms.length; e++) {
        var g = geoms[e], from = 0;
        for (var r = 0; r < edges[e].length; r++) {
          var run = edges[e][r];
          var line = doc.createElementNS(SVGNS, 'line');
          line.setAttribute('x1', g.x + g.dx * from);
          line.setAttribute('y1', g.y + g.dy * from);
          line.setAttribute('x2', g.x + g.dx * run.to);
          line.setAttribute('y2', g.y + g.dy * run.to);
          line.setAttribute('stroke', pass ? '#ff7a00' : outline);
          line.setAttribute('stroke-width', pass ? STROKE_INNER : STROKE_OUTER);
          // Butt caps, and it matters. A square cap extends every dash by half
          // the stroke width at BOTH ends: the 4px orange gains 4px per dash
          // and stays dashed, but the 8px white gains 8px, swallows the 7px gap
          // whole, and merges back into a solid line behind the dashes - which
          // looks exactly like the halo not being dashed at all, because it is
          // not. The corners are closed by running the edges past each other
          // instead (see edgeGeometry).
          line.setAttribute('stroke-linecap', 'butt');
          if (run.covered) line.setAttribute('stroke-dasharray', DASH);
          svg.appendChild(line);
          from = run.to;
        }
      }
    }
  }

  /**
   * Is the element as a whole still the thing you can see?
   *
   * Separate from the outline sampling, and deliberately measuring a different
   * thing: the outline says which EDGES are covered, this says how much of the
   * ELEMENT is, which is what the header note is about. A block of text over
   * the middle of a banner covers a lot of it without touching its edges.
   *
   * @returns {number|null} the fraction of it you can actually see, or null if
   *   there is nothing on screen to sample
   */
  function visibleFraction(el) {
    var doc = el.ownerDocument;
    var win = doc.defaultView;
    if (!win) return null;
    var r = el.getBoundingClientRect();
    var hit = 0, tot = 0;
    for (var gx = 1; gx <= 5; gx++) {
      for (var gy = 1; gy <= 5; gy++) {
        var x = r.left + r.width * gx / 6;
        var y = r.top + r.height * gy / 6;
        if (x < 0 || y < 0 || x > win.innerWidth || y > win.innerHeight) continue;
        tot++;
        var top = null;
        try { top = doc.elementFromPoint(x, y); } catch (e) { top = null; }
        if (top === el || (top && el.contains(top))) hit++;
      }
    }
    return tot ? hit / tot : null;
  }

  /**
   * Hysteresis, then a delay, for the header note only. Two separate reasons:
   *
   *   - one threshold makes it flicker while an element sits right on it, so it
   *     takes 10% to become covered and 25% to come back;
   *   - a state has to hold for 400ms before it is shown, so scrolling past
   *     something does not rewrite the header on the way.
   *
   * The dashing itself is not debounced: it is a direct readout of what is over
   * the outline right now, and lagging it behind the page would be a lie.
   */
  function updateCovered(el, now) {
    if (now - coverCheckedAt < 250) return;
    coverCheckedAt = now;
    var f = visibleFraction(el);
    if (f === null) return; // off screen: not covered, just not here
    var next = covered ? (f > 0.25 ? false : true) : (f < 0.10 ? true : false);
    if (next === covered) { coverPending = null; return; }
    if (!coverPending || coverPending.value !== next) { coverPending = { value: next, since: now }; return; }
    if (now - coverPending.since < 400) return;
    covered = next;
    coverPending = null;
    applyCovered();
  }

  function applyCovered() {
    if (coverNote) coverNote.hidden = !covered;
  }

  function positionRing() {
    rafId = null;
    if (!highlightOn || !target || !target.ownerDocument) return;
    var doc = target.ownerDocument;
    var win = doc.defaultView;
    if (!win) return;
    var svg = ringFor(doc);
    var b = ringBox();
    if (!b) { rafId = win.requestAnimationFrame(positionRing); return; }

    // Position in whichever coordinate space this element actually lives in.
    //
    // The marker is repositioned from a rAF callback, which lands a frame after
    // the scroll it is reacting to. That is invisible as long as nothing has to
    // be written: an element that scrolls with the document keeps a constant
    // DOCUMENT position, so an absolutely-positioned marker just travels with
    // the page. An element pinned to the viewport is the other way round - its
    // document position changes with every pixel of scroll, so the marker is
    // rewritten every frame and visibly lags behind, which reads as the outline
    // bouncing while the element sits still. Anchoring the marker the same way
    // the element is anchored means neither case needs a write while scrolling.
    // Which one it is, is learned from the page rather than guessed at: watch
    // what the element's viewport position does when the page scrolls.
    var sx = win.scrollX, sy = win.scrollY;
    if (lastScroll && (sx !== lastScroll.x || sy !== lastScroll.y)) {
      var dScroll = sy - lastScroll.y;
      var dTop = b.vy - lastScroll.top;
      if (Math.abs(dScroll) > 0.5) {
        if (Math.abs(dTop) < 0.5) anchorMode = 'viewport';
        else if (Math.abs(dTop + dScroll) < 0.5) anchorMode = 'document';
      }
    }
    lastScroll = { x: sx, y: sy, top: b.vy };
    // A clamped box is defined against the edges of the frame, so it is
    // viewport-anchored by construction whatever the element does.
    var fixed = b.clamped || anchorMode === 'viewport';
    var left = fixed ? b.vx : b.left;
    var top = fixed ? b.vy : b.top;

    var box = (fixed ? 'f' : 'a') + left + ',' + top + ',' + b.width + ',' + b.height;
    // The loop has to keep running - the page can scroll or reflow under the
    // marker at any time - but usually nothing has moved, so only touch the
    // style when the geometry actually changed.
    if (box !== lastBox) {
      lastBox = box;
      svg.style.position = fixed ? 'fixed' : 'absolute';
      svg.style.left = left + 'px';
      svg.style.top = top + 'px';
      svg.style.width = b.width + 'px';
      svg.style.height = b.height + 'px';
      lastOutline = '';  // the outline has to be rebuilt at the new size
    }

    var now = win.performance ? win.performance.now() : Date.now();
    if (now - outlineCheckedAt >= 200) {
      outlineCheckedAt = now;
      var vb = { x: b.vx, y: b.vy, w: b.width, h: b.height };
      var edges = sampleOutline(target, vb);
      var lum = backdropLuminance(doc, win, vb);
      var outline = (lum !== null && lum > 0.5) ? '#000000' : '#ffffff';
      var key = outlineKey(b.width, b.height, edges) + outline;
      if (key !== lastOutline) {
        lastOutline = key;
        drawOutline(svg, b.width, b.height, edges, outline);
      }
    }
    if (svg.style.display !== 'block') svg.style.display = 'block';
    updateCovered(target, now);
    rafId = win.requestAnimationFrame(positionRing);
  }

  /**
   * Where to draw the marker, in both coordinate spaces.
   *
   * Normally three pixels outside the element on every side. But an element
   * that fills or overflows the viewport - a full-width banner, a page-sized
   * container - has its edges at or past the edge of the screen, and a marker
   * drawn outside those edges is a marker nobody can see: the participant is
   * told something is highlighted and finds a bare page. So each side the
   * ELEMENT ITSELF reaches is pulled back just inside the frame instead. The
   * marker then reads as "this element reaches past what you can see", which is
   * true.
   *
   * Only a side the element actually reaches, never one it merely comes near:
   * an element a few pixels in from the edge has room for its outline and does
   * not want it moved, and pulling that one in would take the marker off the
   * element it is marking.
   *
   * If the element is scrolled entirely out of view the box is left alone: the
   * marker belongs on the element, and pinning it to the edge of the frame
   * would claim something is here when it is not.
   */
  function ringBox() {
    if (!target || !target.ownerDocument) return null;
    var doc = target.ownerDocument;
    var win = doc.defaultView;
    if (!win) return null;
    var r = target.getBoundingClientRect();
    // A zero-size target (an empty icon span, a script node) still needs a
    // visible marker, so give it a minimum box centred on its position.
    var w = Math.max(r.width, 8);
    var h = Math.max(r.height, 8);
    var left = r.left - 3, top = r.top - 3, right = r.left + w + 3, bottom = r.top + h + 3;

    var vw = win.innerWidth || 0, vh = win.innerHeight || 0;
    var onScreen = vw > 0 && vh > 0 && r.left < vw && r.top < vh && r.left + w > 0 && r.top + h > 0;
    var TOUCH = 2;
    var hit = onScreen && (r.left <= TOUCH || r.top <= TOUCH || r.left + w >= vw - TOUCH || r.top + h >= vh - TOUCH);
    if (hit) {
      // 16px, not 3: the marker is an 8px-wide pair of strokes, and one pulled
      // in only as far as its own width loses half of itself to the edge of the
      // frame.
      var inset = 16;
      if (r.left <= TOUCH) left = inset;
      if (r.top <= TOUCH) top = inset;
      if (r.left + w >= vw - TOUCH) right = vw - inset;
      if (r.top + h >= vh - TOUCH) bottom = vh - inset;
    }
    return {
      left: Math.round(left + win.scrollX),
      top: Math.round(top + win.scrollY),
      vx: Math.round(left),   // the same box in viewport coordinates
      vy: Math.round(top),
      width: Math.round(Math.max(right - left, 8)),
      height: Math.round(Math.max(bottom - top, 8)),
      clamped: !!hit,
    };
  }

  function scrollToTarget() {
    if (!target) return;
    try { target.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) { /* older engines */ }
  }

  /**
   * Re-assert the scroll while the layout settles.
   *
   * One scrollIntoView at the moment the highlight appears is not enough on
   * these snapshots: several keep loading images and lazy sections afterwards,
   * and the element the participant was just shown slides back off the screen.
   * Only re-scroll when the target is actually out of view - taking a page away
   * from a participant who has since scrolled it themselves would be worse than
   * the problem.
   */
  function keepInView(el, delay) {
    window.setTimeout(function () {
      if (!highlightOn || target !== el || !el.ownerDocument) return;
      var win = el.ownerDocument.defaultView;
      if (!win) return;
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > win.innerHeight || r.right < 0 || r.left > win.innerWidth) scrollToTarget();
    }, delay);
  }

  /**
   * Pulse the ring so the eye is drawn to it. Web Animations rather than a
   * class or a stylesheet: the ring lives inside the page under evaluation, and
   * an animation adds no rule, no class and no attribute to that page - it
   * reverts to exactly the styles already there when it ends.
   */
  function flashRing(doc) {
    if (!doc) return;
    var ring = doc.getElementById(HL_ID);
    if (!ring || typeof ring.animate !== 'function') return;
    if (flashAnim) { try { flashAnim.cancel(); } catch (e) { /* already finished */ } }
    // Two blinks, on the marker itself. Its geometry is never animated: a ring
    // whose bounds move even slightly is a ring that misreports which element
    // the task is about.
    try {
      flashAnim = ring.animate([
        { opacity: 1 }, { opacity: 0.15 }, { opacity: 1 }
      ], { duration: 460, iterations: 2, easing: 'ease-in-out' });
    } catch (e) { flashAnim = null; }
  }

  function showHighlight(opts) {
    if (!target) return;
    highlightOn = true;
    lastBox = '';
    afterHighlightChange();
    if (rafId == null) positionRing();
    if (!opts || opts.scroll !== false) {
      scrollToTarget();
      keepInView(target, 300);
      keepInView(target, 1200);
    }
    if (!opts || opts.flash !== false) flashRing(target.ownerDocument);
  }

  function resetCovered() {
    covered = false;
    coverPending = null;
    coverCheckedAt = 0;
    outlineCheckedAt = 0;
    lastOutline = '';
    anchorMode = 'document';
    lastScroll = null;
    if (coverNote) coverNote.hidden = true;
  }

  function hideHighlight() {
    highlightOn = false;
    resetCovered();
    afterHighlightChange();
    var doc = target && target.ownerDocument;
    if (doc && doc.defaultView && rafId != null) { doc.defaultView.cancelAnimationFrame(rafId); rafId = null; }
    if (doc) {
      var ring = doc.getElementById(HL_ID);
      if (ring) ring.style.display = 'none';
    }
    releaseTempTabindex();
  }

  // Defined late (function declarations hoist) so the highlight helpers can
  // call it without caring where the toolbar lives.
  function afterHighlightChange() {
    if (typeof syncFocusButton === 'function') syncFocusButton();
  }

  function releaseTempTabindex(force) {
    var el = tempTabindex;
    if (!el) return;
    if (el.getAttribute(TEMP_ATTR) !== '1') { tempTabindex = null; return; }
    var doc = el.ownerDocument;
    if (!force && doc && doc.activeElement === el) {
      // Removing tabindex from the focused element blurs it. Escape was a
      // request to hide a box, not to give up your place on the page, so hold
      // the attribute until the participant moves away on their own. On a task
      // change (force) focus is going somewhere else anyway, so clean up now.
      var drop = function () {
        el.removeEventListener('blur', drop);
        el.removeAttribute('tabindex');
        el.removeAttribute(TEMP_ATTR);
        if (tempTabindex === el) tempTabindex = null;
      };
      el.addEventListener('blur', drop);
      return;
    }
    el.removeAttribute('tabindex');
    el.removeAttribute(TEMP_ATTR);
    tempTabindex = null;
  }

  function tryFocus(el) {
    try { el.focus({ preventScroll: false }); } catch (e) {
      try { el.focus(); } catch (e2) { return false; }
    }
    return el.ownerDocument.activeElement === el;
  }

  function focusTarget() {
    if (!target) {
      announce('This task is about the page as a whole. There is no single element to move to.');
      return;
    }
    showHighlight({ scroll: true });
    // Ask the browser rather than guess. Which elements are focusable is
    // fiddlier than any short list gets right - <video> is focusable only with
    // `controls`, a disabled <input> is not focusable at all, an <iframe> does
    // take focus as an element - and guessing wrong either fails silently or
    // adds an attribute to a page that did not need one. So attempt the focus
    // first and only fall back to the temporary tabindex if it did not take.
    if (!tryFocus(target)) {
      // The one mutation the study makes to the page. tabindex="-1" is
      // programmatic focus only: it adds no tab stop, no name and no role, so
      // it cannot change what the participant is being asked to judge.
      target.setAttribute('tabindex', '-1');
      target.setAttribute(TEMP_ATTR, '1');
      tempTabindex = target;
      tryFocus(target);
    }
    var d = describe(target);
    announce('Focus moved to the highlighted element' + (d && d.name ? ': ' + d.name : '') + '.');
    reportFocus(target, 'page');
  }

  // --- keys ---------------------------------------------------------------
  /**
   * Does this element take typed text? Checkboxes and buttons are <input> and
   * do not; a comment box does. One definition, because two of the shortcuts
   * hang off it and they must agree.
   */
  function isTextEntry(node) {
    if (!node || !node.tagName) return false;
    if (node.tagName === 'TEXTAREA') return true;
    if (node.isContentEditable) return true;
    if (node.tagName !== 'INPUT') return false;
    return !/^(checkbox|radio|button|submit|reset|range|color|file)$/i.test(node.type || 'text');
  }

  function onKeydown(e, where) {
    if (e.key === 'Enter' && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Taken by the study, and stopped, so it works from inside any widget.
      e.preventDefault();
      e.stopPropagation();
      // The evaluation view is modal, and moving focus into the page while it is open
      // strands the participant: every key then goes to the page's own
      // document, and a browser will not turn Escape there into a close request
      // for a dialog in the parent document, so nothing can be dismissed from
      // the keyboard again. Close it first - asking to go to the element means
      // they are done reading it.
      if (dialog && dialog.open) closeToolDialog();
      focusTarget();
      return;
    }
    // 1-4 while the evaluation view is open. Not while the participant is
    // typing their disagreement: a comment that says "1" would otherwise tick a
    // box instead of getting typed.
    //
    // "Typing" means a field that takes text. The options are <input> too, and
    // one of them holds focus the moment the dialog opens, so excluding inputs
    // wholesale stopped the keys working exactly where they are most likely to
    // be pressed.
    if (dialog && dialog.open && /^[1-4]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (!isTextEntry(e.target)) {
        var box = e.key === '4' ? disagreeRadio
          : toolForm.querySelector('#tool-grid input[name="choice"][value="' + e.key + '"]') ||
            toolForm.querySelector('#tool-grid input[name="choice"][value="all"]');
        if (box) {
          e.preventDefault();
          e.stopPropagation();
          box.checked = !box.checked;
          // Same exclusivity as clicking it, and the same place: one handler
          // decides what a selection means, whichever way it was made. The flag
          // is the one difference - picking 4 with the mouse should drop the
          // participant into the comment box, but picking it with a key must
          // not, or the next number they press gets typed into the comment
          // instead of ticking anything.
          keyToggle = true;
          try { box.dispatchEvent(new Event('change', { bubbles: true })); } finally { keyToggle = false; }
        }
        return;
      }
    }
    if (e.key === 'Enter' && e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      // Option/Alt+Enter opens the evaluation view, and closes it again, so the
      // key and the button it is printed on stay the same thing.
      e.preventDefault();
      e.stopPropagation();
      if (dialog && dialog.open) closeToolDialog();
      else openToolDialog();
      return;
    }
    if (e.key === 'Escape' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (dialog && dialog.open) {
        // Escape out of the text box first. Someone part-way through writing
        // why they disagree, reaching for Escape to get out of the field,
        // should not lose the dialog and the half-written reason with it. A
        // second Escape closes it.
        if (isTextEntry(e.target)) {
          e.preventDefault();
          e.stopPropagation();
          try { disagreeRadio.focus(); } catch (err) { /* gone */ }
          return;
        }
        // A native dialog closes itself on Escape only while the key is pressed
        // in its own document. Once focus is inside the page frame that close
        // request never arrives, so deferring to the browser is deferring to
        // something that will not happen; close it here instead. Still not
        // swallowed, for the same reason as below.
        if (where === 'page') closeToolDialog();
        return;
      }
      // Observed, never swallowed - the page's own Escape behaviour is often
      // the thing under evaluation.
      if (highlightOn) {
        hideHighlight();
        announce('Highlight hidden. Press Shift and Enter to return to the highlighted element.');
      }
    }
  }

  document.addEventListener('keydown', function (e) { onKeydown(e, 'shell'); }, true);
  document.addEventListener('focusin', function (e) { reportFocus(e.target, 'shell'); syncFocusButton(); });

  // --- the frame ----------------------------------------------------------
  function bindFrameDocument(doc) {
    if (!doc || doc.__a11ystudyBound) return;
    doc.__a11ystudyBound = true;
    doc.addEventListener('keydown', function (e) { onKeydown(e, 'page'); }, true);
    doc.addEventListener('focusin', function (e) { reportFocus(e.target, 'page'); syncFocusButton(); });
    // Same-origin subframes (saved snapshots embed a few) get the same
    // treatment so focus does not vanish from the monitor inside them.
    var frames = doc.querySelectorAll('iframe,frame');
    for (var i = 0; i < frames.length; i++) {
      try {
        var sub = frames[i].contentDocument;
        if (sub) bindFrameDocument(sub);
      } catch (e) { /* cross-origin: nothing we can or should do */ }
    }
  }

  function onFrameLoad() {
    var myLoad = ++loadToken;
    var doc = null;
    try { doc = frame.contentDocument; } catch (e) { doc = null; }
    releaseTempTabindex(true);
    target = null;
    tempTabindex = null;
    highlightOn = false;
    rafId = null;
    if (!doc) {
      announce('The page could not be loaded. Please tell the study operator.');
      return;
    }
    bindFrameDocument(doc);

    var task = state.task;
    if (!task) return;

    // The evaluation view is opened straight away rather than after the target is
    // located: it is what the participant is asked to read on every page load,
    // and it must not wait on a snapshot that is still settling.
    syncFocusButton();
    openToolDialog({ announce: false });

    var lead = 'Task ' + (state.index + 1) + ' of ' + state.total + '. Success criterion ' + task.sc + '. ';
    if (task.scope === 'page' || !task.xpath) {
      announce(lead + 'This task is about the whole page, so nothing is highlighted.');
      return;
    }
    locateTarget(task, myLoad, 0, lead);
  }

  /**
   * Find the target, retrying briefly.
   *
   * Resolving once at the load event is not enough on the dynamic snapshots in
   * this corpus: several are single-page apps that finish building their DOM
   * after `load` fires, so the node can be absent for a few hundred
   * milliseconds and then appear. Doing it once made the highlight come and go
   * depending on how fast the page happened to render, which is exactly the
   * kind of difference between participants a study cannot have. `token` drops
   * a retry on the floor as soon as a newer task takes over.
   */
  function locateTarget(task, token, attempt, lead) {
    if (token !== loadToken) return;
    // Re-read the document every attempt rather than closing over the one that
    // was current when `load` fired. Several snapshots navigate themselves once
    // more after loading, and a captured reference then points at a detached
    // document where the target can never appear - which looks exactly like a
    // missing element and is not.
    var doc = null;
    try { doc = frame.contentDocument; } catch (e) { doc = null; }
    if (doc) bindFrameDocument(doc);
    var el = null;
    try { el = doc ? window.resolveStudyXpath(task.xpath, doc) : null; } catch (e) { el = null; }
    if (el) {
      target = el;
      showHighlight({ scroll: true });
      var d = describe(target);
      announce(lead + 'The target element is highlighted' + (d && d.name ? ': ' + d.name : '') +
        '. Press Shift and Enter to move focus to it. Press Escape to hide the highlight.');
      return;
    }
    if (attempt >= 15) { // ~6 seconds
      announce(lead + 'The target element could not be found on this page. Please tell the study operator.');
      syncFocusButton();
      return;
    }
    window.setTimeout(function () { locateTarget(task, token, attempt + 1, lead); }, 400);
  }

  frame.addEventListener('load', onFrameLoad);

  // --- the evaluation view ------------------------------------------------------
  //
  // Three columns, one per checker, labelled A/B/C. Which letter is which tool
  // is decided per participant on the server and never sent here, so nothing on
  // this screen can give the mapping away - not the verdicts, not the order,
  // and not the DOM.
  var VERDICT_TEXT = {
    problem: 'Reports a problem here',
    clear: 'Reports no problem here'
  };

  function reportUi() {
    post('ui', {
      caseId: state.task ? state.task.caseId : null,
      popupOpen: !!(dialog && dialog.open),
      highlightVisible: highlightOn
    });
  }

  function buildToolCards(tools) {
    toolGrid.textContent = '';
    var legend = document.createElement('legend');
    legend.className = 'visually-hidden';
    legend.textContent = 'Which result do you agree with?';
    toolGrid.appendChild(legend);

    // When all three said the same thing there is nothing to choose between
    // them, so they collapse into one card carrying all three letters. The
    // value is 'all' rather than a letter, and the server records it as
    // standing for every tool.
    var unanimous = !!tools.agree;
    toolGrid.className = 'tool-grid' + (unanimous ? ' is-unanimous' : '');
    var cards = unanimous
      ? [{ label: tools.columns.map(function (c) { return c.label; }).join(', '), value: 'all', verdict: tools.columns[0].verdict, columns: tools.columns, keys: tools.columns.map(function (c) { return c.label; }) }]
      : tools.columns.map(function (c) { return { label: c.label, value: c.label, verdict: c.verdict, columns: [c] }; });

    cards.forEach(function (card) {
      var label = document.createElement('label');
      label.className = 'tool-card';

      var input = document.createElement('input');
      // Checkboxes, not radios: the columns are not mutually exclusive, and a
      // participant who thinks two of them got it right should be able to say
      // so rather than being made to pick a favourite.
      input.type = 'checkbox';
      input.name = 'choice';
      input.value = card.value;
      input.id = 'choice-' + card.value;

      var head = document.createElement('div');
      head.className = 'tool-card-head';
      var letter = document.createElement('span');
      letter.className = 'tool-letter';
      letter.textContent = card.label;
      head.appendChild(letter);

      var verdict = document.createElement('p');
      verdict.className = 'tool-verdict ' + (card.verdict === 'problem' ? 'is-problem' : 'is-clear');
      verdict.textContent = VERDICT_TEXT[card.verdict];

      label.appendChild(input);
      label.appendChild(head);
      label.appendChild(verdict);

      // What the tool actually said. A verdict on its own asks the participant
      // to agree with an assertion; the sentence is the finding they are being
      // asked to judge.
      //
      // In a collapsed card the three agreed on the verdict but usually not on
      // the wording, so each sentence is attributed to its letter - collapsing
      // the card should hide a choice that does not exist, not hide what each
      // of them said. Identical sentences are printed once, unattributed.
      var said = card.columns.filter(function (c) { return c.reason; });
      if (said.length) {
        var texts = said.map(function (c) { return c.reason; });
        var oneVoice = card.columns.length === 1 ||
          texts.every(function (t) { return t === texts[0]; });
        var list = document.createElement(oneVoice ? 'p' : 'ul');
        list.className = 'tool-reason' + (oneVoice ? '' : ' is-list');
        if (oneVoice) {
          list.textContent = texts[0];
        } else {
          said.forEach(function (c) {
            var li = document.createElement('li');
            var who = document.createElement('span');
            who.className = 'tool-reason-letter';
            who.textContent = c.label;
            li.appendChild(who);
            li.appendChild(document.createTextNode(c.reason));
            list.appendChild(li);
          });
        }
        label.appendChild(list);
      }
      toolGrid.appendChild(label);
    });
    return unanimous;
  }

  function openToolDialog(opts) {
    if (!state.task || !state.task.tools) return;
    // Several snapshots in this corpus navigate themselves once more a second
    // or two after `load`, and every load reopens this view. Rebuilding it then
    // would clear a selection the participant had already made on the task they
    // are still on - so a reopen for the SAME task, while it is already up, is
    // left alone. A new task always rebuilds.
    if (dialog.open && dialogTaskId === state.task.caseId) { syncContinue(); syncToolButton(); return; }
    dialogTaskId = state.task.caseId;
    var unanimous = buildToolCards(state.task.tools);
    clearToolError();
    commentInput.value = '';
    commentField.hidden = true;
    disagreeRadio.checked = false;

    // The criterion, in WCAG's words, as the first line: it is the question
    // being asked. The number goes on the line below it - out of the page
    // header, where it would be in front of the participant the whole time they
    // are looking at the page, but still here for anyone who wants it.
    toolTitle.textContent = 'WCAG ' + state.task.sc +
      (state.task.guidance ? ' — ' + state.task.guidance : '');
    toolSub.textContent = 'Task ' + (state.index + 1) + ' of ' + state.total +
      (unanimous ? ' · all three agree' : ' · the checkers disagree') +
      ' — ' + (unanimous
        ? 'select the result if you agree with it, or say you disagree.'
        : 'select all results you agree with, or say you disagree with all of them.');

    // Coming back to a task they already answered should show their answer, not
    // a blank form.
    var prev = state.task.response;
    if (prev && prev.choices && prev.choices.length) {
      for (var pi = 0; pi < prev.choices.length; pi++) {
        var again = toolForm.querySelector('input[name="choice"][value="' + prev.choices[pi] + '"]');
        if (again) again.checked = true;
      }
      if (prev.choices.indexOf('disagree') >= 0) { commentField.hidden = false; commentInput.value = prev.comment || ''; }
      toolSub.textContent += ' · you answered this already';
    }

    if (!dialog.open) dialog.showModal();
    // On the first option rather than the close button, which is what a native
    // dialog picks on its own. The first thing they have to do is choose.
    var first = toolForm.querySelector('#tool-grid input[name="choice"]');
    if (first) { try { first.focus(); } catch (e) { /* not focusable yet */ } }
    syncContinue();
    syncToolButton();
    reportUi();
    if (!opts || opts.announce !== false) {
      announce((unanimous ? 'All three checkers agree. ' : 'The checkers disagree. ') +
        'Choose all results you agree with, or say you disagree with all of them, then press Continue. Press Escape to dismiss.');
    }
  }

  /**
   * Continue is only live once something is chosen.
   *
   * `aria-disabled` rather than the `disabled` attribute, deliberately. A truly
   * disabled button drops out of the tab order, so a participant working by
   * keyboard or screen reader reaches the end of the form and finds nothing
   * there - no button, no reason, no way to ask. This one stays reachable and
   * announces itself as unavailable, and activating it says what is missing,
   * which is the same sentence Enter produces. It is not clickable in the sense
   * that matters: it performs no action and submits nothing.
   */
  function syncContinue() {
    var picked = toolForm.querySelectorAll('input[name="choice"]:checked').length;
    btnContinue.setAttribute('aria-disabled', picked ? 'false' : 'true');
  }

  function continueBlocked() {
    return btnContinue.getAttribute('aria-disabled') === 'true';
  }

  function closeToolDialog() {
    if (dialog.open) dialog.close();
    syncToolButton();
    reportUi();
  }

  /**
   * The toolbar button's state is DERIVED from the dialog, never mirrored.
   * Setting it alongside every open and close looked equivalent and was not:
   * the task lifecycle closes the dialog from one place and reopens it from
   * another, and any interleaving that skipped one of those left the button
   * claiming the popup was open while it was shut. Reading the dialog is the
   * only way the two cannot drift, and this is called on every render as well
   * so a drift would be corrected rather than persisted.
   */
  function syncToolButton() {
    var open = !!(dialog && dialog.open);
    btnTools.setAttribute('aria-pressed', open ? 'true' : 'false');
    btnToolsLabel.textContent = 'Evaluate';
    btnToolsKey.textContent = open ? KEY_HIDE : KEY_EVAL;
  }

  // Escape on a native dialog fires `cancel`, so the close path is the same
  // whether they used the key, the X, or Dismiss. Forgetting which task the
  // view was built for belongs here rather than in closeToolDialog, because
  // Escape does not go through that function - and a stale id would make the
  // next open skip the rebuild that restores a previous answer.
  //
  // Guarded on the dialog actually being shut. `close()` does not fire this
  // event synchronously - it queues it - so a close immediately followed by a
  // reopen (which is exactly what a task render does) delivers the close event
  // AFTER the new view is already up. Clearing the id unconditionally there
  // left it null on an open dialog, and the next open rebuilt over whatever the
  // participant had already ticked.
  dialog.addEventListener('close', function () {
    if (!dialog.open) dialogTaskId = null;
    syncToolButton();
    reportUi();
  });
  qs('tool-close').addEventListener('click', function () { closeToolDialog(); });
  qs('tool-dismiss').addEventListener('click', function () { closeToolDialog(); });

  toolForm.addEventListener('change', function (e) {
    if (!e.target || e.target.name !== 'choice') return;
    // "I disagree with all of them" is the one exclusive answer: ticking it
    // clears the columns, and ticking a column clears it.
    var boxes = toolForm.querySelectorAll('input[name="choice"]');
    if (e.target.value === 'disagree' && e.target.checked) {
      for (var i = 0; i < boxes.length; i++) if (boxes[i] !== e.target) boxes[i].checked = false;
    } else if (e.target.value !== 'disagree' && e.target.checked) {
      disagreeRadio.checked = false;
    }
    commentField.hidden = !disagreeRadio.checked;
    if (disagreeRadio.checked && !keyToggle) commentInput.focus();
    clearToolError();
    syncContinue();
  });

  // Enter is the shortcut printed on Continue, and it has to behave like it
  // even when Continue is not live: a key that silently does nothing is the
  // same dead end as a disabled button. The form's implicit submission still
  // runs when something is chosen; this only takes over the blocked case.
  toolForm.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return;
    if (isTextEntry(e.target)) return; // a newline in the comment box is a newline
    // Enter on a button is that button's own activation - Dismiss has to
    // dismiss, and Continue reaches the same error through its click handler.
    // Only the implicit submission the checkboxes would have made is taken over.
    if (e.target && e.target.tagName === 'BUTTON') return;
    if (!continueBlocked()) return;
    e.preventDefault();
    showToolError(NOTHING_CHOSEN);
  });

  // Activating a button that says it is unavailable should say why, not nothing.
  btnContinue.addEventListener('click', function (e) {
    if (!continueBlocked()) return;
    e.preventDefault();
    showToolError(NOTHING_CHOSEN);
  });

  toolForm.addEventListener('submit', function (e) {
    // The form is method="dialog", which would close on submit before the
    // answer is validated or sent; take it over.
    e.preventDefault();
    var picked = toolForm.querySelectorAll('input[name="choice"]:checked');
    if (!picked.length) { showToolError(NOTHING_CHOSEN); return; }
    var choices = [];
    for (var pi = 0; pi < picked.length; pi++) choices.push(picked[pi].value);
    if (choices.indexOf('disagree') >= 0 && !commentInput.value.trim()) {
      showToolError('Please say what you found instead.');
      commentInput.focus();
      return;
    }
    var body = { caseId: state.task.caseId, choices: choices, comment: commentInput.value };
    // Guard the in-flight window with the real `disabled`: here it is not a
    // state the participant has to understand and act on, it is a fraction of a
    // second in which a second Enter would post the same answer twice.
    btnContinue.disabled = true;
    var atLast = state.index >= state.total - 1;
    fetch('/api/client/response', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (out) {
        btnContinue.disabled = false;
        if (!out.ok) { showToolError(out.j.error || 'That answer could not be saved.'); return; }
        if (state.task) state.task.response = { choices: body.choices, comment: body.comment };
        closeToolDialog();
        // Continue means continue: the answer lands and the next task arrives.
        // The server pushes it down the same stream the operator's moves use,
        // so this only has to say what happened - `renderTask` does the rest.
        announce(atLast
          ? 'Answer recorded. That was the last task.'
          : 'Answer recorded. Moving to the next task.');
        if (atLast) return;
        post('advance', {}).then(function (r) {
          // A dropped advance leaves them on a task they have already answered
          // with no way to tell; the operator can still move them, but only if
          // somebody knows.
          if (!r || !r.ok) announce('Answer recorded, but moving on failed. Please tell the study operator.');
        });
      })
      .catch(function () { btnContinue.disabled = false; showToolError('That answer could not be sent. Please tell the study operator.'); });
  });

  // --- toolbar ------------------------------------------------------------
  btnFocus.addEventListener('click', function () {
    // The same action as the key it advertises - a button labelled Shift+Enter
    // that did something else would be worse than no label.
    if (highlightOn && focusIsOnTarget()) {
      hideHighlight();
      announce('Highlight hidden.');
    } else {
      focusTarget();
    }
    syncFocusButton();
    reportUi();
  });

  btnTools.addEventListener('click', function () {
    if (dialog.open) closeToolDialog();
    else openToolDialog();
  });

  /**
   * Three states, because there are two things the participant might want and
   * one button:
   *
   *   highlight hidden          -> "Show focus"  (Shift+Enter) - show it and go
   *   highlight on, focus there -> "Hide focus"  (Esc)         - put it away
   *   highlight on, focus moved -> "Re-focus"    (Shift+Enter) - come back
   *
   * The third is the one that matters in practice: a participant tabs off to
   * see how the page behaves and then wants to get back, and a button that
   * still says "Hide focus" is offering them the one thing they did not want.
   * Escape hides the highlight throughout, whatever the button happens to say.
   */
  function focusIsOnTarget() {
    if (!target || !target.ownerDocument) return false;
    return target.ownerDocument.activeElement === target;
  }

  function syncFocusButton() {
    var canHighlight = !!(state.task && state.task.xpath);
    btnFocus.hidden = !state.live || !state.task;
    btnFocus.disabled = !canHighlight;
    btnFocus.setAttribute('aria-pressed', highlightOn ? 'true' : 'false');
    var onTarget = highlightOn && focusIsOnTarget();
    btnFocusLabel.textContent = !highlightOn ? 'Show focus' : (onTarget ? 'Hide focus' : 'Re-focus');
    btnFocusKey.textContent = onTarget ? KEY_HIDE : KEY_FOCUS;
    btnTools.hidden = !state.live || !state.task;
    syncToolButton();
  }

  // --- rendering ----------------------------------------------------------
  function renderWaiting(text, sub) {
    waitingText.textContent = text;
    waitingSub.textContent = sub;
    // These are the messages that arrive when there is nothing else on screen -
    // "waiting to begin", "no tasks assigned", "this link is no longer active" -
    // and the block they are written into is not a live region: it is hidden
    // while a task is up, and a live region that appears already populated is
    // not reliably spoken. Route them through the announcer like every other
    // message this interface produces.
    announce(text + '. ' + sub);
    waiting.hidden = false;
    frame.hidden = true;
    taskline.hidden = true;
    resetCovered();
    if (frame.getAttribute('src')) frame.removeAttribute('src');
    target = null;
    highlightOn = false;
    if (dialog.open) dialog.close();
    btnFocus.hidden = true;
    btnTools.hidden = true;
  }

  function renderTask(view) {
    state.index = view.index;
    state.total = view.total;
    state.task = view.task;
    if (!view.task) {
      renderWaiting('No tasks assigned yet', 'The study operator has not assigned you any pages yet. This screen will update on its own.');
      return;
    }
    waiting.hidden = true;
    frame.hidden = false;
    taskline.hidden = false;
    resetCovered();
    taskline.innerHTML = '';
    // Which task, and nothing about which criterion: naming the success
    // criterion on screen tells the participant what to go looking for.
    taskline.appendChild(document.createTextNode('Task ' + (view.index + 1) + ' of ' + view.total));
    if (view.task.scope === 'page') {
      taskline.appendChild(document.createTextNode(' — whole page'));
    }
    frame.title = 'Page under evaluation, task ' + (view.index + 1) + ' of ' + view.total + ': ' + view.task.pageTitle;
    // A different task means a different question; never leave the previous
    // task's answer on screen while the new page loads.
    if (dialog.open) dialog.close();
    syncFocusButton();

    var nextSrc = view.task.pageUrl;
    if (frame.getAttribute('src') === nextSrc) {
      onFrameLoad(); // same page, different target - re-place without a reload
    } else {
      frame.setAttribute('src', nextSrc);
    }
    post('progress', { index: view.index, caseId: view.task.caseId });
  }

  function applyLive(live) {
    state.live = !!live;
    if (!state.live) {
      renderWaiting('Waiting for study to begin', 'The screen will update on its own when the study operator starts the session.');
    }
  }

  // --- server stream ------------------------------------------------------
  var es = null;
  var retry = 1000;
  function connect() {
    if (es) { try { es.close(); } catch (e) { /* already closed */ } }
    es = new EventSource('/api/client/events');
    es.addEventListener('open', function () { retry = 1000; });
    es.addEventListener('state', function (ev) {
      var d = JSON.parse(ev.data);
      applyLive(d.live);
      if (d.live) {
        fetch('/api/client/task').then(function (r) { return r.json(); }).then(function (t) {
          if (t && t.live && t.task) renderTask(t);
          else if (t && t.live) renderTask({ index: 0, total: 0, task: null });
        }).catch(function () { /* the stream will resend */ });
      }
    });
    es.addEventListener('task', function (ev) {
      var d = JSON.parse(ev.data);
      if (!state.live) applyLive(true);
      renderTask(d);
    });
    es.addEventListener('reload', function () {
      if (!frame.getAttribute('src')) return;
      announce('Reloading the page.');
      try { frame.contentWindow.location.reload(); } catch (e) { var s = frame.getAttribute('src'); frame.removeAttribute('src'); frame.setAttribute('src', s); }
    });
    es.addEventListener('highlight', function (ev) {
      var d = JSON.parse(ev.data);
      if (d.action === 'dismiss') { hideHighlight(); announce('Highlight hidden.'); return; }
      showHighlight({ scroll: true });
      if (d.focus) focusTarget();
      else announce('Highlight shown.');
      reportUi();
    });
    es.addEventListener('popup', function (ev) {
      // The operator can open or close the evaluation view on the participant's
      // screen - useful when someone dismisses it and cannot find the button.
      var d = JSON.parse(ev.data);
      if (d.action === 'hide') closeToolDialog();
      else openToolDialog();
    });
    es.addEventListener('revoked', function () {
      renderWaiting('This study link is no longer active', 'Please ask the study operator for a new link.');
      try { es.close(); } catch (e) { /* already closed */ }
      es = null;
    });
    es.onerror = function () {
      if (!es) return;
      try { es.close(); } catch (e) { /* already closed */ }
      es = null;
      window.setTimeout(connect, retry);
      retry = Math.min(retry * 2, 15000);
    };
  }

  applyLive(false);
  connect();
})();
