const { useEffect, useRef, useState } = React;

function useFocusTrap(isOpen, containerRef, onClose, triggerRef) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return undefined;

    const node = containerRef.current;
    const selectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");
    const getFocusable = () => Array.from(node.querySelectorAll(selectors));
    const previous = document.activeElement;

    window.requestAnimationFrame(() => {
      const focusable = getFocusable();
      if (focusable[0]) focusable[0].focus();
    });

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      const restore = triggerRef?.current || previous;
      if (restore && typeof restore.focus === "function") restore.focus();
    };
  }, [isOpen, containerRef, onClose, triggerRef]);
}

function SubscribeModal({ isOpen, onClose, triggerRef }) {
  const modalRef = useRef(null);
  useFocusTrap(isOpen, modalRef, onClose, triggerRef);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-20">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscribe-modal-heading"
        className="panel w-full max-w-xl rounded-[2rem] border border-white/70 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="subscribe-modal-heading" className="font-editorial text-3xl font-semibold text-slate-950">Subscriber Preview</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">This mock overlay previews a paywall or subscriber prompt with trapped focus.</p>
          </div>
          <button type="button" onClick={onClose} className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" aria-label="Close subscription preview">
            Close
          </button>
        </div>
        <p className="mt-6 text-sm leading-7 text-slate-700">Members get unlimited articles, newsletters, and the full archives. Choose a plan on the subscription page to continue.</p>
      </div>
    </div>
  );
}

function Header({ currentPage, tickerPaused, onToggleTicker }) {
  const links = [
    { key: "home", label: "Home", href: "./index.html" },
    { key: "world", label: "World", href: "./world.html" },
    { key: "article", label: "Featured Article", href: "./article.html" },
    { key: "opinion", label: "Opinion", href: "./opinion.html" },
    { key: "subscribe", label: "Subscribe", href: "./subscribe.html" }
  ];

  return (
    <>
      <a href="#main-content" className="skip-link focus-ring">Skip to main content</a>
      <div className="sticky top-0 z-50 border-b border-rose-200 bg-rose-50">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:px-8">
          <p className="text-sm font-semibold text-rose-900">BREAKING: UN Emergency Session Called Over Red Sea Tensions</p>
          <button
            type="button"
            onClick={onToggleTicker}
            className="focus-ring ml-auto rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-900"
            aria-pressed={tickerPaused}
            aria-label={tickerPaused ? "Resume breaking news ticker" : "Pause breaking news ticker"}
          >
            {tickerPaused ? "Resume ticker" : "Pause ticker"}
          </button>
        </div>
      </div>
      <header className="sticky top-[53px] z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-5 lg:px-8">
          <a href="./index.html" className="focus-ring font-editorial text-4xl font-semibold text-slate-950">
            The Meridian
          </a>
          <nav aria-label="Primary" className="ml-auto flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={link.key}
                href={link.href}
                aria-current={currentPage === link.key ? "page" : undefined}
                className={`focus-ring rounded-full px-4 py-2 text-sm font-medium ${
                  currentPage === link.key ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-700"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}

function Footer({ newsletterStatus, onNewsletterSubmit }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address to join the newsletter.");
      onNewsletterSubmit("Newsletter form error shown.");
      return;
    }
    setError("");
    onNewsletterSubmit("Newsletter signup confirmed.");
    setEmail("");
  };

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <h2 className="font-editorial text-3xl font-semibold text-white">The Meridian Briefing</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">A daily digest of global affairs, politics, technology, and culture delivered before the first meeting on your calendar.</p>
        </div>
        <form className="space-y-3" onSubmit={submit} noValidate>
          <label className="block text-sm font-medium text-slate-100">
            Email address
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="focus-ring mt-2 w-full rounded-2xl border border-slate-600 bg-slate-900 px-4 py-3 text-white"
              aria-required="true"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "newsletter-error" : "newsletter-help"}
            />
          </label>
          <p id="newsletter-help" className="text-sm text-slate-400">Get weekday newsletters and occasional subscriber updates.</p>
          {error && <p id="newsletter-error" className="text-sm text-rose-300">{error}</p>}
          <button type="submit" className="focus-ring rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950" aria-label="Sign up for Meridian newsletter">
            Sign Up
          </button>
          <div className="sr-live" aria-live="polite" aria-atomic="true">{newsletterStatus}</div>
        </form>
      </div>
    </footer>
  );
}

function StoryCard({ story, href = "./article.html", large = false }) {
  return (
    <article className="panel rounded-[2rem] border border-white/70 p-4 shadow-sm">
      <img src={story.image} alt="" className={`w-full rounded-[1.5rem] object-cover ${large ? "h-72" : "h-44"}`} />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{story.category || "World"}</p>
      <h3 className={`font-editorial mt-2 font-semibold text-slate-950 ${large ? "text-3xl" : "text-2xl"}`}>
        <a href={href} className="focus-ring rounded">
          {story.title}
        </a>
      </h3>
      {story.summary || story.dek ? (
        <p className="mt-3 text-sm leading-7 text-slate-600">{story.summary || story.dek}</p>
      ) : null}
      <p className="mt-3 text-sm text-slate-500">{story.byline} · {story.time}</p>
    </article>
  );
}

function PageLayout({ currentPage, liveMessage, children }) {
  const [tickerPaused, setTickerPaused] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState("");

  return (
    <div>
      <div className="sr-live" aria-live="polite" aria-atomic="true">{liveMessage}</div>
      <Header currentPage={currentPage} tickerPaused={tickerPaused} onToggleTicker={() => setTickerPaused((value) => !value)} />
      <main id="main-content" className="page-main mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {children}
      </main>
      <Footer newsletterStatus={newsletterStatus} onNewsletterSubmit={setNewsletterStatus} />
    </div>
  );
}
