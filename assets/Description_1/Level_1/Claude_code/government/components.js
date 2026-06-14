// ============================================================
// City of Lakewood — Shared Header & Footer Components
// Plain React.createElement (no JSX) for use across all pages
// ============================================================

const NAV_ITEMS = [
  { label: 'Home',     href: 'index.html',    id: 'home' },
  { label: 'Services', href: 'services.html', id: 'services' },
  { label: 'About',    href: 'about.html',    id: 'about' },
  { label: 'Contact',  href: 'contact.html',  id: 'contact' },
];

// ── Header ──────────────────────────────────────────────────
function CityHeader({ currentPage }) {
  const [menuOpen,   setMenuOpen]   = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  const ce = React.createElement;

  const navLinkClass = (id) =>
    `block px-5 py-3.5 text-sm font-semibold border-b-2 transition-all focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/60 ${
      currentPage === id
        ? 'text-white border-amber-400 bg-white/10'
        : 'text-blue-100 border-transparent hover:text-white hover:bg-white/10 hover:border-blue-300'
    }`;

  const mobileNavLinkClass = (id) =>
    `block px-4 py-3 text-sm font-semibold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white/60 ${
      currentPage === id
        ? 'text-white bg-white/20'
        : 'text-blue-100 hover:text-white hover:bg-white/10'
    }`;

  return ce(React.Fragment, null,

    // Skip-to-content
    ce('a', {
      href: '#main-content',
      className: 'sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-3 focus:left-3 bg-white text-blue-900 font-semibold px-4 py-2 rounded shadow-lg border-2 border-blue-600'
    }, 'Skip to main content'),

    // ── Outer header wrapper
    ce('header', { role: 'banner', className: 'bg-[#0d2340] text-white shadow-lg' },

      // Top utility bar
      ce('div', { className: 'bg-[#081929] text-gray-300 text-xs py-1.5' },
        ce('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-between items-center gap-2' },
          ce('span', null, 'City Hall: ',
            ce('a', { href: 'tel:3039877000', className: 'hover:text-white focus:text-white focus:outline-none underline-offset-2 hover:underline' }, '(303) 987-7000'),
            ' · Mon–Fri 8 am–5 pm'
          ),
          ce('div', { className: 'flex gap-4' },
            ce('a', { href: '#', className: 'hover:text-white focus:text-white focus:outline-none hover:underline', 'aria-label': 'Accessibility options' }, 'Accessibility'),
            ce('a', { href: '#', className: 'hover:text-white focus:text-white focus:outline-none hover:underline', lang: 'es', 'aria-label': 'Switch to Spanish' }, 'Español'),
            ce('a', { href: '#', className: 'hover:text-white focus:text-white focus:outline-none hover:underline' }, 'Staff Login'),
          )
        )
      ),

      // Brand bar
      ce('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between' },

        // Logo + City name
        ce('a', { href: 'index.html', className: 'flex items-center gap-3 group', 'aria-label': 'City of Lakewood — return to home' },
          ce('div', {
            className: 'w-14 h-14 rounded-full bg-[#1a4a8a] border-2 border-[#4a90d9] flex flex-col items-center justify-center flex-shrink-0',
            'aria-hidden': 'true'
          },
            ce('span', { className: 'text-xl leading-none' }, '⚙'),
            ce('span', { className: 'text-[9px] font-bold tracking-widest leading-tight' }, 'LKW')
          ),
          ce('div', null,
            ce('div', { className: 'text-xl font-bold tracking-wide group-hover:text-blue-200 transition-colors' }, 'City of Lakewood'),
            ce('div', { className: 'text-[11px] text-blue-300 font-medium tracking-widest uppercase' }, 'Official Government Portal')
          )
        ),

        // Utility buttons (search + hamburger)
        ce('div', { className: 'flex items-center gap-2' },

          ce('button', {
            type: 'button',
            onClick: () => setSearchOpen(v => !v),
            className: 'p-2.5 rounded-lg hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors',
            'aria-label': searchOpen ? 'Close search' : 'Open site search',
            'aria-expanded': String(searchOpen),
            'aria-controls': 'header-search'
          },
            ce('svg', { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'aria-hidden': 'true' },
              ce('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0' })
            )
          ),

          ce('button', {
            type: 'button',
            onClick: () => setMenuOpen(v => !v),
            className: 'md:hidden p-2.5 rounded-lg hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors',
            'aria-label': menuOpen ? 'Close navigation menu' : 'Open navigation menu',
            'aria-expanded': String(menuOpen),
            'aria-controls': 'mobile-nav'
          },
            ce('svg', { className: 'w-6 h-6', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'aria-hidden': 'true' },
              menuOpen
                ? ce('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M6 18L18 6M6 6l12 12' })
                : ce('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M4 6h16M4 12h16M4 18h16' })
            )
          )
        )
      ),

      // Expandable search bar
      searchOpen && ce('div', { id: 'header-search', className: 'bg-[#1a3a6b] py-3 px-4' },
        ce('div', { className: 'max-w-7xl mx-auto' },
          ce('form', { role: 'search', 'aria-label': 'Site search', onSubmit: e => e.preventDefault() },
            ce('div', { className: 'flex gap-2' },
              ce('label', { htmlFor: 'header-search-input', className: 'sr-only' }, 'Search the site'),
              ce('input', {
                id: 'header-search-input',
                type: 'search',
                placeholder: 'Search city services, departments, permits…',
                className: 'flex-1 px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400',
                autoFocus: true
              }),
              ce('button', {
                type: 'submit',
                className: 'px-6 py-2 bg-blue-500 hover:bg-blue-400 focus:bg-blue-400 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300'
              }, 'Search')
            )
          )
        )
      ),

      // ── Navigation bar
      ce('nav', { role: 'navigation', 'aria-label': 'Main navigation', className: 'bg-[#1a3a6b] border-t border-[#2a5090]' },
        ce('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },

          // Desktop nav
          ce('ul', { className: 'hidden md:flex', role: 'list' },
            NAV_ITEMS.map(item =>
              ce('li', { key: item.id },
                ce('a', {
                  href: item.href,
                  className: navLinkClass(item.id),
                  'aria-current': currentPage === item.id ? 'page' : undefined
                }, item.label)
              )
            ),
            ce('li', { className: 'ml-auto flex items-center gap-1', 'aria-label': 'Quick actions' },
              ce('a', { href: 'pay-bill.html', className: 'flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-amber-300 border-b-2 border-transparent hover:text-amber-200 hover:border-amber-300 transition-all focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/60' },
                ce('span', { 'aria-hidden': 'true' }, '💳'),
                'Pay a Bill'
              ),
              ce('a', { href: 'permits.html', className: 'flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-amber-300 border-b-2 border-transparent hover:text-amber-200 hover:border-amber-300 transition-all focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/60' },
                ce('span', { 'aria-hidden': 'true' }, '📋'),
                'Apply for Permit'
              )
            )
          ),

          // Mobile nav
          menuOpen && ce('ul', { id: 'mobile-nav', className: 'md:hidden py-2 border-t border-blue-700 mt-0', role: 'list' },
            NAV_ITEMS.map(item =>
              ce('li', { key: item.id },
                ce('a', {
                  href: item.href,
                  className: mobileNavLinkClass(item.id),
                  'aria-current': currentPage === item.id ? 'page' : undefined
                }, item.label)
              )
            ),
            ce('li', { className: 'border-t border-blue-700 mt-2 pt-2' },
              ce('a', { href: 'pay-bill.html', className: 'flex items-center gap-2 px-4 py-3 text-sm font-semibold text-amber-300 hover:text-amber-200 hover:bg-white/10 rounded focus:outline-none focus:ring-2 focus:ring-white/60' },
                ce('span', { 'aria-hidden': 'true' }, '💳'), 'Pay a Bill'
              )
            ),
            ce('li', null,
              ce('a', { href: 'permits.html', className: 'flex items-center gap-2 px-4 py-3 text-sm font-semibold text-amber-300 hover:text-amber-200 hover:bg-white/10 rounded focus:outline-none focus:ring-2 focus:ring-white/60' },
                ce('span', { 'aria-hidden': 'true' }, '📋'), 'Apply for Permit'
              )
            )
          )
        )
      )
    )
  );
}

// ── Footer ──────────────────────────────────────────────────
function CityFooter() {
  const ce = React.createElement;
  const year = new Date().getFullYear();

  const footerLink = (label, href = '#') =>
    ce('li', { key: label },
      ce('a', {
        href,
        className: 'hover:text-white hover:underline focus:text-white focus:outline-none focus:underline transition-colors'
      }, label)
    );

  return ce('footer', { role: 'contentinfo', className: 'bg-[#0d2340] text-gray-300 mt-16' },

    ce('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12' },
      ce('div', { className: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10' },

        // Col 1 — City info
        ce('div', null,
          ce('div', { className: 'flex items-center gap-2.5 mb-4' },
            ce('div', { className: 'w-10 h-10 rounded-full bg-[#1a4a8a] border border-[#4a90d9] flex items-center justify-center flex-shrink-0', 'aria-hidden': 'true' },
              ce('span', { className: 'text-base' }, '⚙')
            ),
            ce('div', null,
              ce('div', { className: 'text-white font-bold text-sm' }, 'City of Lakewood'),
              ce('div', { className: 'text-xs text-gray-400' }, 'Colorado')
            )
          ),
          ce('address', { className: 'not-italic text-sm text-gray-400 leading-relaxed' },
            '480 S Allison Pkwy', ce('br'), 'Lakewood, CO 80226', ce('br'),
            ce('a', { href: 'tel:3039877000', className: 'hover:text-white focus:text-white focus:outline-none mt-1 inline-block' }, '(303) 987-7000')
          )
        ),

        // Col 2 — Quick Links
        ce('div', null,
          ce('h2', { className: 'text-white font-semibold mb-4 text-xs uppercase tracking-widest' }, 'Quick Links'),
          ce('ul', { className: 'space-y-2 text-sm' },
            footerLink('City Council'),
            footerLink('City Manager'),
            footerLink('Budget & Finance'),
            footerLink('City Code'),
            footerLink('Public Records'),
            footerLink('Staff Directory')
          )
        ),

        // Col 3 — Services
        ce('div', null,
          ce('h2', { className: 'text-white font-semibold mb-4 text-xs uppercase tracking-widest' }, 'Services'),
          ce('ul', { className: 'space-y-2 text-sm' },
            footerLink('Pay a Bill', 'pay-bill.html'),
            footerLink('Apply for Permit', 'permits.html'),
            footerLink('Report an Issue', '#'),
            footerLink('Parks & Recreation', 'services.html'),
            footerLink('Public Safety', 'services.html'),
            footerLink('All Services', 'services.html')
          )
        ),

        // Col 4 — Connect
        ce('div', null,
          ce('h2', { className: 'text-white font-semibold mb-4 text-xs uppercase tracking-widest' }, 'Connect With Us'),
          ce('div', { className: 'flex gap-2.5 mb-5' },
            [
              { label: 'Facebook',    icon: 'f' },
              { label: 'X (Twitter)', icon: '𝕏' },
              { label: 'Instagram',   icon: '◎' },
              { label: 'YouTube',     icon: '▶' },
            ].map(s =>
              ce('a', {
                key: s.label, href: '#',
                'aria-label': `City of Lakewood on ${s.label}`,
                className: 'w-9 h-9 rounded bg-[#1a3a6b] flex items-center justify-center text-sm font-bold hover:bg-blue-600 focus:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400'
              }, s.icon)
            )
          ),
          ce('p', { className: 'text-sm' },
            ce('span', { className: 'text-gray-400' }, 'Newsletter: '),
            ce('a', { href: '#', className: 'text-blue-400 hover:text-blue-300 hover:underline focus:text-blue-300 focus:outline-none focus:underline' }, 'Subscribe to updates')
          ),
          ce('p', { className: 'text-sm mt-2' },
            ce('span', { className: 'text-gray-400' }, 'Emergencies: '),
            ce('a', { href: 'tel:911', className: 'text-white font-bold hover:text-blue-200 focus:text-blue-200 focus:outline-none' }, 'Call 911')
          )
        )
      )
    ),

    // Bottom bar
    ce('div', { className: 'border-t border-gray-700' },
      ce('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500' },
        ce('p', null, `© ${year} City of Lakewood, Colorado. All rights reserved.`),
        ce('nav', { 'aria-label': 'Legal links' },
          ce('ul', { className: 'flex flex-wrap gap-4', role: 'list' },
            ['Privacy Policy', 'Terms of Use', 'Accessibility', 'Sitemap'].map(label =>
              ce('li', { key: label },
                ce('a', { href: '#', className: 'hover:text-gray-300 hover:underline focus:text-gray-300 focus:outline-none focus:underline transition-colors' }, label)
              )
            )
          )
        )
      )
    )
  );
}
