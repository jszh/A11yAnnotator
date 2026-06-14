const MAIN_NAV = [
  { href: "index.html", label: "Home" },
  { href: "courses.html", label: "Courses" },
  { href: "study-lab.html", label: "Study Lab" },
  { href: "pricing.html", label: "Plans" },
  { href: "dashboard.html", label: "Dashboard" }
];

function PlatformHeader({ active, sectionLinks = [] }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a href="index.html" className="text-2xl font-extrabold tracking-tight text-slate-900">
            Horizon Academy
          </a>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Verified Instructors</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">University-Grade Tracks</span>
          </div>
        </div>

        <nav className="mt-3 flex flex-wrap gap-2">
          {MAIN_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active === item.href
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </a>
          ))}
          <a href="pricing.html" className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">
            Try Free
          </a>
        </nav>

        {sectionLinks.length > 0 && (
          <nav className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
            {sectionLinks.map((item) => (
              <a key={item.href + item.label} href={item.href} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50">
                {item.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-5 text-sm text-slate-500 sm:px-6 lg:px-8">
      {items.map((item, i) => (
        <span key={item.label + i}>
          {i > 0 ? <span className="mx-2 text-slate-300">/</span> : null}
          {item.href ? <a className="hover:text-slate-700" href={item.href}>{item.label}</a> : <span>{item.label}</span>}
        </span>
      ))}
    </div>
  );
}

function PlatformFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="font-display text-xl font-bold text-slate-900">Horizon Academy</p>
          <p className="mt-3 text-sm text-slate-600">Career-ready learning with live mentoring, structured pathways, and measurable outcomes.</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Explore</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li><a href="courses.html" className="hover:text-slate-900">Courses</a></li>
            <li><a href="study-lab.html" className="hover:text-slate-900">Study Lab</a></li>
            <li><a href="dashboard.html" className="hover:text-slate-900">Dashboard</a></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li><a href="index.html" className="hover:text-slate-900">About Platform</a></li>
            <li><a href="pricing.html" className="hover:text-slate-900">Pricing</a></li>
            <li><a href="courses.html" className="hover:text-slate-900">Partnerships</a></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Start Now</p>
          <p className="mt-3 text-sm text-slate-600">Join 120,000+ learners progressing through verified learning paths.</p>
          <a href="pricing.html" className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Sign Up</a>
        </div>
      </div>
    </footer>
  );
}

function PlatformShell({ active, sectionLinks, breadcrumbs, children }) {
  return (
    <>
      <PlatformHeader active={active} sectionLinks={sectionLinks} />
      <Breadcrumbs items={breadcrumbs} />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      <PlatformFooter />
    </>
  );
}

window.EduPlatform = {
  PlatformShell
};
