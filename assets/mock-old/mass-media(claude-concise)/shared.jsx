// The Tribune – Shared Components
// Requires React 18 (UMD) + Babel Standalone loaded first

const Tribune = (() => {
  const { useState } = React;

  // ── Navigation config ──────────────────────────
  const NAV_LINKS = [
    { label: 'Home',     href: 'index.html' },
    { label: 'World',    href: 'world.html' },
    { label: 'Politics', href: '#' },
    { label: 'Economy',  href: '#' },
    { label: 'Tech',     href: '#' },
    { label: 'Culture',  href: '#' },
    { label: 'Opinion',  href: 'opinion.html' },
    { label: 'Video',    href: '#' },
  ];

  // ── Masthead ───────────────────────────────────
  function Masthead({ active }) {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    return (
      <header className="masthead">
        <div className="masthead-inner">
          <div className="masthead-top">
            <div className="flex items-center gap-4">
              <a href="index.html" className="site-name">The Tribune</a>
              <span className="masthead-tagline">{today}</span>
            </div>
            <div className="masthead-actions">
              <a href="subscribe.html" className="btn-subscribe">Subscribe</a>
            </div>
          </div>
          <nav aria-label="Primary">
            <div className="nav-bar">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className={`nav-link${active === href ? ' active' : ''}`}
                >
                  {label}
                </a>
              ))}
            </div>
          </nav>
        </div>
      </header>
    );
  }

  // ── Breaking banner ────────────────────────────
  function BreakingBar({ text }) {
    if (!text) return null;
    return (
      <div className="breaking-bar" role="alert" aria-live="polite">
        <span className="breaking-label">Breaking</span>
        <span className="breaking-text">{text}</span>
      </div>
    );
  }

  // ── Footer ─────────────────────────────────────
  function Footer() {
    const cols = [
      { title: 'Sections', links: [
        { label: 'World', href: 'world.html' },
        { label: 'Opinion', href: 'opinion.html' },
        { label: 'Politics', href: '#' },
        { label: 'Economy', href: '#' },
        { label: 'Technology', href: '#' },
        { label: 'Culture', href: '#' },
      ]},
      { title: 'Services', links: [
        { label: 'Subscribe', href: 'subscribe.html' },
        { label: 'Newsletters', href: '#' },
        { label: 'Podcasts', href: '#' },
        { label: 'The Tribune App', href: '#' },
      ]},
      { title: 'Company', links: [
        { label: 'About Us', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Advertise', href: '#' },
        { label: 'Contact', href: '#' },
      ]},
      { title: 'Policies', links: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Use', href: '#' },
        { label: 'Cookie Settings', href: '#' },
        { label: 'Corrections', href: '#' },
      ]},
    ];
    return (
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">The Tribune</div>
          <div className="footer-tagline">Independent Journalism Since 1887</div>
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
            <span>© 2026 The Tribune Media Group. All rights reserved.</span>
            <span>Delivering truth since 1887.</span>
          </div>
        </div>
      </footer>
    );
  }

  // ── Page shell ─────────────────────────────────
  function SiteShell({ active, breaking, children }) {
    return (
      <div className="page-shell">
        <Masthead active={active} />
        {breaking && <BreakingBar text={breaking} />}
        <main className="page-content">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  // ── Story card ─────────────────────────────────
  function StoryCard({ eyebrow, headline, deck, author, time, href, large }) {
    return (
      <div className="story-card">
        {eyebrow && <span className="story-eyebrow">{eyebrow}</span>}
        <a href={href || 'article.html'} className={`story-headline${large ? ' story-headline-lg' : ''}`}>
          {headline}
        </a>
        {deck && <p className="story-deck">{deck}</p>}
        {(author || time) && (
          <div className="story-meta">
            {author && <span className="author">{author}</span>}
            {time && <span>{time}</span>}
          </div>
        )}
      </div>
    );
  }

  // ── Numbered list story ────────────────────────
  function ListStory({ num, headline, href }) {
    return (
      <div className="list-story">
        <span className="list-story-num">{num}</span>
        <a href={href || 'article.html'} className="list-story-headline">{headline}</a>
      </div>
    );
  }

  // ── Opinion card ───────────────────────────────
  function OpinionCard({ initials, name, role, headline, excerpt, href }) {
    const bg = ['#0f1117','#c41230','#2d3142','#c99a2e'][
      (name.charCodeAt(0) % 4)
    ];
    return (
      <div className="opinion-card">
        <div className="flex items-center gap-4" style={{ position: 'relative', zIndex: 1 }}>
          <div className="opinion-avatar" style={{ background: bg }}>{initials}</div>
          <div>
            <div className="opinion-byline">{name}</div>
            <div className="opinion-role">{role}</div>
          </div>
        </div>
        <a href={href || 'opinion.html'} className="story-headline" style={{ position: 'relative', zIndex: 1 }}>
          {headline}
        </a>
        {excerpt && <p className="story-deck" style={{ position: 'relative', zIndex: 1 }}>{excerpt}</p>}
      </div>
    );
  }

  return { SiteShell, StoryCard, ListStory, OpinionCard };
})();
