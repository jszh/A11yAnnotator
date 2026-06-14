/**
 * Gov Portal – Shared Navigation Component
 * Handles: mega menu keyboard nav, mobile drawer, accordion, scroll-to-top
 * WCAG 2.1 AA compliant keyboard patterns
 */
(function () {
  'use strict';

  /* ── Mega Menu ─────────────────────────────────────────────
     Pattern: button[aria-haspopup] → .mega-menu[role=menu]
     Keys: Enter/Space/↓ open · ↑/↓ move · Esc close · Tab close
  ─────────────────────────────────────────────────────────── */
  function initMegaMenu() {
    const triggers = document.querySelectorAll('.nav-link[aria-haspopup="true"]');

    function closeAll() {
      triggers.forEach(function (t) {
        t.setAttribute('aria-expanded', 'false');
        var menu = document.getElementById(t.getAttribute('aria-controls'));
        if (menu) { menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true'); }
      });
    }

    triggers.forEach(function (trigger) {
      var menuId = trigger.getAttribute('aria-controls');
      var menu   = document.getElementById(menuId);
      if (!menu) return;

      function openMenu() {
        closeAll();
        trigger.setAttribute('aria-expanded', 'true');
        menu.classList.add('open');
        menu.setAttribute('aria-hidden', 'false');
        var first = menu.querySelector('[role="menuitem"]');
        if (first) first.focus();
      }

      function closeMenu() {
        trigger.setAttribute('aria-expanded', 'false');
        menu.classList.remove('open');
        menu.setAttribute('aria-hidden', 'true');
        trigger.focus();
      }

      /* Click toggle */
      trigger.addEventListener('click', function () {
        trigger.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
      });

      /* Keyboard on trigger */
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault(); openMenu();
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault(); openMenu();
          var items = menu.querySelectorAll('[role="menuitem"]');
          if (items.length) items[items.length - 1].focus();
        }
      });

      /* Keyboard inside menu */
      menu.addEventListener('keydown', function (e) {
        var items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
        var idx   = items.indexOf(document.activeElement);

        if (e.key === 'Escape')    { e.preventDefault(); closeMenu(); }
        if (e.key === 'ArrowDown') { e.preventDefault(); if (idx < items.length - 1) items[idx + 1].focus(); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); if (idx > 0) items[idx - 1].focus(); else closeMenu(); }
        if (e.key === 'Home')      { e.preventDefault(); items[0].focus(); }
        if (e.key === 'End')       { e.preventDefault(); items[items.length - 1].focus(); }
        /* Tab out of last item → close */
        if (e.key === 'Tab' && !e.shiftKey && idx === items.length - 1) { closeMenu(); }
        if (e.key === 'Tab' && e.shiftKey  && idx === 0)                { e.preventDefault(); closeMenu(); }
      });
    });

    /* Close on outside click */
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-item')) closeAll();
    });

    /* Close on global Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });
  }

  /* ── Mobile Nav Drawer ─────────────────────────────────────
     Pattern: #ham-btn[aria-expanded] → #mobile-nav[hidden]
     Keys: Esc closes · Tab cycles within drawer
  ─────────────────────────────────────────────────────────── */
  function initMobileNav() {
    var ham       = document.getElementById('ham-btn');
    var mobileNav = document.getElementById('mobile-nav');
    var closeBtn  = document.getElementById('mobile-close');
    var backdrop  = document.getElementById('mobile-backdrop');
    if (!ham || !mobileNav) return;

    function openNav() {
      mobileNav.hidden = false;
      ham.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      var first = mobileNav.querySelector('a, button:not(#mobile-close), [tabindex]');
      if (closeBtn) closeBtn.focus(); else if (first) first.focus();
    }

    function closeNav() {
      mobileNav.hidden = true;
      ham.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      ham.focus();
    }

    ham.addEventListener('click', function () {
      mobileNav.hidden ? openNav() : closeNav();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeNav);
    if (backdrop) backdrop.addEventListener('click', closeNav);

    /* Escape key */
    mobileNav.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();

      /* Focus trap inside drawer */
      if (e.key === 'Tab') {
        var focusable = Array.from(mobileNav.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ));
        var first = focusable[0];
        var last  = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ── Accordion ─────────────────────────────────────────────
     Pattern: .acc-btn[aria-expanded] → .acc-panel
     Keys: Enter/Space toggle · ↑/↓ move between items
  ─────────────────────────────────────────────────────────── */
  function initAccordions() {
    var accordions = document.querySelectorAll('.accordion');
    accordions.forEach(function (acc) {
      var buttons = Array.from(acc.querySelectorAll('.acc-btn'));

      buttons.forEach(function (btn, i) {
        var panelId = btn.getAttribute('aria-controls');
        var panel   = document.getElementById(panelId);
        if (!panel) return;

        btn.addEventListener('click', function () {
          var expanded = btn.getAttribute('aria-expanded') === 'true';
          /* Close all in this accordion */
          buttons.forEach(function (b) {
            b.setAttribute('aria-expanded', 'false');
            var p = document.getElementById(b.getAttribute('aria-controls'));
            if (p) p.classList.remove('open');
          });
          /* Open this one if it was closed */
          if (!expanded) {
            btn.setAttribute('aria-expanded', 'true');
            panel.classList.add('open');
          }
        });

        btn.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowDown') { e.preventDefault(); if (i < buttons.length - 1) buttons[i + 1].focus(); }
          if (e.key === 'ArrowUp')   { e.preventDefault(); if (i > 0) buttons[i - 1].focus(); }
          if (e.key === 'Home')      { e.preventDefault(); buttons[0].focus(); }
          if (e.key === 'End')       { e.preventDefault(); buttons[buttons.length - 1].focus(); }
        });
      });
    });
  }

  /* ── Header Search ──────────────────────────────────────── */
  function initSearch() {
    var searchForms = document.querySelectorAll('.header-search, .hero-search');
    searchForms.forEach(function (form) {
      var input = form.querySelector('input[type="search"], input[type="text"]');
      var btn   = form.querySelector('button[type="submit"], button');
      if (!input || !btn) return;
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); btn.click(); }
      });
      btn.addEventListener('click', function () {
        var q = input.value.trim();
        if (q) console.log('Search:', q); /* replace with actual search handler */
      });
    });
  }

  /* ── Scroll-to-top ──────────────────────────────────────── */
  function initScrollTop() {
    var btn = document.getElementById('scroll-top');
    if (!btn) return;
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    window.addEventListener('scroll', function () {
      btn.style.display = window.scrollY > 400 ? 'flex' : 'none';
    });
  }

  /* ── Init all ───────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initMegaMenu();
    initMobileNav();
    initAccordions();
    initSearch();
    initScrollTop();
  });

})();
