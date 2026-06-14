const NEWS_NAV = [
  { href: "index.html", label: "Home" },
  { href: "world.html", label: "World" },
  { href: "article.html", label: "Article" },
  { href: "opinion.html", label: "Opinion" },
  { href: "subscribe.html", label: "Subscribe" }
];

function Header({ active }) {
  return (
    <header className="border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <a href="index.html" className="font-serif text-3xl font-bold leading-none text-stone-900 sm:text-4xl">
            The Daily Ledger
          </a>
          <p className="hidden text-xs font-semibold uppercase tracking-[0.25em] text-stone-500 md:block">March 2026 Edition</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm font-semibold">
          {NEWS_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 transition ${
                active === item.href
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function BreakingBar({ text }) {
  return (
    <section className="border-b border-red-200 bg-red-50">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <span className="rounded bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Breaking</span>
        <p className="text-sm text-red-900">{text}</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-14 border-t border-stone-200 bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl font-bold text-stone-900">The Daily Ledger</p>
          <p className="mt-2 text-sm text-stone-600">Independent reporting with global context and sharp editorial analysis.</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Sections</p>
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            <li><a href="world.html" className="hover:text-stone-900">World</a></li>
            <li><a href="opinion.html" className="hover:text-stone-900">Opinion</a></li>
            <li><a href="article.html" className="hover:text-stone-900">Investigations</a></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Membership</p>
          <p className="mt-3 text-sm text-stone-700">Support independent journalism with full digital access and weekend briefings.</p>
          <a href="subscribe.html" className="mt-4 inline-flex rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700">Subscribe</a>
        </div>
      </div>
    </footer>
  );
}

function SiteShell({ active, breaking, children }) {
  return (
    <>
      <Header active={active} />
      <BreakingBar text={breaking} />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      <Footer />
    </>
  );
}

window.NewsPortal = {
  SiteShell
};
