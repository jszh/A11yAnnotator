// Meridian Learning – Shared Components
// Requires React 18 UMD + Babel Standalone loaded first

const Meridian = (() => {
  const { useState } = React;

  // ── Config ─────────────────────────────────────────────
  const NAV = [
    { label: 'Explore',   href: 'courses.html' },
    { label: 'Paths',     href: '#' },
    { label: 'Live',      href: '#' },
    { label: 'For Teams', href: '#' },
  ];

  // ── Course card colour map ──────────────────────────────
  const CAT_COLORS = {
    'Data Science':    { bg: '#eef2ff', fg: '#4f46e5', icon: '📊', badge: 'badge-indigo' },
    'Web Dev':         { bg: '#f0fdf4', fg: '#059669', icon: '💻', badge: 'badge-emerald' },
    'Design':          { bg: '#fdf4ff', fg: '#7c3aed', icon: '🎨', badge: 'badge-violet' },
    'AI & ML':         { bg: '#eff6ff', fg: '#0284c7', icon: '🤖', badge: 'badge-sky' },
    'Business':        { bg: '#fffbeb', fg: '#d97706', icon: '📈', badge: 'badge-amber' },
    'Photography':     { bg: '#fdf4ff', fg: '#7c3aed', icon: '📷', badge: 'badge-violet' },
    'Music':           { bg: '#fff1f2', fg: '#e11d48', icon: '🎵', badge: 'badge-indigo' },
    'Language':        { bg: '#f0fdf4', fg: '#059669', icon: '🌍', badge: 'badge-emerald' },
    'Science':         { bg: '#eff6ff', fg: '#0284c7', icon: '🔬', badge: 'badge-sky' },
    'Marketing':       { bg: '#fffbeb', fg: '#d97706', icon: '📣', badge: 'badge-amber' },
  };

  function catStyle(cat) {
    return CAT_COLORS[cat] || { bg: '#eef2ff', fg: '#4f46e5', icon: '📚', badge: 'badge-indigo' };
  }

  // ── Stars component ─────────────────────────────────────
  function Stars({ rating }) {
    return (
      <span className="stars">
        {'★★★★★'.split('').map((s, i) => (
          <span key={i} style={{ opacity: i < Math.round(rating) ? 1 : 0.25 }}>{s}</span>
        ))}
        <span className="stars-val" style={{ marginLeft: '0.25rem' }}>{rating.toFixed(1)}</span>
      </span>
    );
  }

  // ── Course card ─────────────────────────────────────────
  function CourseCard({ title, instructor, category, rating, students, duration, level, price, href, bestseller }) {
    const cs = catStyle(category);
    return (
      <a href={href || 'course-detail.html'} className="course-card" style={{ textDecoration: 'none' }}>
        <div className="course-thumb" style={{ background: cs.bg }}>
          <span style={{ fontSize: '3rem' }}>{cs.icon}</span>
        </div>
        <div className="course-body">
          {bestseller && (
            <span className="badge badge-amber" style={{ alignSelf: 'flex-start', marginBottom: '0.15rem' }}>Bestseller</span>
          )}
          <span className={`badge ${cs.badge}`} style={{ alignSelf: 'flex-start', fontSize: '0.6rem' }}>{category}</span>
          <span className="course-title">{title}</span>
          <span className="course-instructor">{instructor}</span>
          <div className="course-meta">
            <Stars rating={rating} />
            <span>({(students / 1000).toFixed(1)}k)</span>
            <span>·</span>
            <span>{duration}</span>
            <span>·</span>
            <span>{level}</span>
            {price !== undefined && (
              <>
                <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--ink)', fontSize: '0.85rem' }}>
                  {price === 0 ? 'Free' : `$${price}`}
                </span>
              </>
            )}
          </div>
        </div>
      </a>
    );
  }

  // ── Global nav ──────────────────────────────────────────
  function GlobalNav({ active }) {
    return (
      <nav className="global-nav">
        <div className="nav-inner">
          <a href="index.html" className="nav-logo">
            <div className="nav-logo-mark">M</div>
            Meridian
          </a>
          <div className="nav-links">
            {NAV.map(({ label, href }) => (
              <a key={label} href={href}
                className={`nav-link${active === href ? ' active' : ''}`}>
                {label}
              </a>
            ))}
          </div>
          <div className="nav-end">
            <div className="nav-search">
              🔍 <span>Search courses…</span>
            </div>
            <a href="dashboard.html" className="btn btn-ghost btn-sm">Dashboard</a>
            <a href="plans.html" className="btn btn-primary btn-sm">Start Free</a>
          </div>
        </div>
      </nav>
    );
  }

  // ── Footer ──────────────────────────────────────────────
  function Footer() {
    const cols = [
      { title: 'Learn', links: [
        { label: 'All Courses', href: 'courses.html' },
        { label: 'Learning Paths', href: '#' },
        { label: 'Live Classes', href: '#' },
        { label: 'Certificates', href: '#' },
      ]},
      { title: 'Tools', links: [
        { label: 'Study Tool', href: 'study.html' },
        { label: 'Progress Tracker', href: 'dashboard.html' },
        { label: 'Mobile App', href: '#' },
        { label: 'Offline Mode', href: '#' },
      ]},
      { title: 'Plans', links: [
        { label: 'Pricing', href: 'plans.html' },
        { label: 'For Teams', href: '#' },
        { label: 'Institutions', href: '#' },
        { label: 'Student Discount', href: '#' },
      ]},
      { title: 'Company', links: [
        { label: 'About', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Press', href: '#' },
      ]},
    ];
    return (
      <footer className="site-footer">
        <div className="container">
          <div className="footer-logo">
            <div className="nav-logo-mark">M</div>
            Meridian
          </div>
          <div className="footer-tagline">Unlock your potential, one lesson at a time.</div>
          <div className="footer-grid">
            {cols.map(col => (
              <div key={col.title}>
                <div className="footer-col-title">{col.title}</div>
                {col.links.map(l => (
                  <a key={l.label} href={l.href} className="footer-link">{l.label}</a>
                ))}
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <span>© 2026 Meridian Learning, Inc. All rights reserved.</span>
            <span style={{ display: 'flex', gap: '1.25rem' }}>
              <a href="#" className="footer-link">Privacy</a>
              <a href="#" className="footer-link">Terms</a>
              <a href="#" className="footer-link">Cookies</a>
            </span>
          </div>
        </div>
      </footer>
    );
  }

  // ── Page shell (standard) ───────────────────────────────
  function Shell({ active, children }) {
    return (
      <div className="page-shell">
        <GlobalNav active={active} />
        <main className="page-main">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  // ── Dashboard shell (sidebar layout) ───────────────────
  function DashShell({ active, sideActive, children }) {
    const sideLinks = [
      { icon: '🏠', label: 'Home',        href: 'dashboard.html', key: 'home' },
      { icon: '📚', label: 'My Courses',  href: '#', key: 'courses' },
      { icon: '🗺️', label: 'Paths',       href: '#', key: 'paths' },
      { icon: '🃏', label: 'Study',        href: 'study.html', key: 'study' },
      { icon: '🏆', label: 'Achievements', href: '#', key: 'achieve' },
      { icon: '📅', label: 'Calendar',    href: '#', key: 'cal' },
      { icon: '⚙️', label: 'Settings',   href: '#', key: 'settings' },
    ];
    return (
      <div className="page-shell">
        <GlobalNav active={active} />
        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
          <aside className="dash-sidebar">
            {sideLinks.map(l => (
              <a key={l.key} href={l.href}
                className={`dash-link${sideActive === l.key ? ' active' : ''}`}>
                <span className="dash-icon">{l.icon}</span>
                <span>{l.label}</span>
              </a>
            ))}
          </aside>
          <div className="dash-main" style={{ flex: 1 }}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  // ── Section header helper ───────────────────────────────
  function SectionHead({ eyebrow, title, sub, center, action }) {
    return (
      <div style={{ textAlign: center ? 'center' : 'left', marginBottom: '2rem' }}>
        {eyebrow && <div className="eyebrow">✦ {eyebrow}</div>}
        <h2 className="section-heading">{title}</h2>
        {sub && <p className="section-sub" style={{ margin: center ? '0 auto' : undefined }}>{sub}</p>}
        {action && <div style={{ marginTop: '0.75rem' }}>{action}</div>}
      </div>
    );
  }

  return { Shell, DashShell, CourseCard, Stars, SectionHead, catStyle };
})();
