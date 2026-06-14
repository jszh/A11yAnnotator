const { useEffect, useRef, useState } = React;

function useFocusTrap(isOpen, containerRef, onClose, triggerRef) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      return undefined;
    }

    const node = containerRef.current;
    const selectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    const getFocusable = () => Array.from(node.querySelectorAll(selectors));
    const previouslyFocused = document.activeElement;

    window.requestAnimationFrame(() => {
      const focusable = getFocusable();
      if (focusable[0]) {
        focusable[0].focus();
      }
    });

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusable();
      if (focusable.length === 0) {
        return;
      }

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
      const restore = triggerRef?.current || previouslyFocused;
      if (restore && typeof restore.focus === "function") {
        restore.focus();
      }
    };
  }, [isOpen, containerRef, onClose, triggerRef]);
}

function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <a href={item.href} className="focus-ring rounded text-slate-700">
                {item.label}
              </a>
            ) : (
              <span aria-current="page" className="font-semibold text-slate-900">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Header({ currentPage }) {
  const links = [
    { key: "home", label: "Home", href: "./index.html" },
    { key: "services", label: "Services", href: "./services.html" },
    { key: "about", label: "About", href: "./about.html" },
    { key: "contact", label: "Contact", href: "./contact.html" }
  ];

  return (
    <>
      <a href="#main-content" className="skip-link focus-ring">Skip to main content</a>
      <div role="alert" aria-live="assertive" className="sticky top-0 z-50 bg-amber-100 border-b border-amber-200">
        <div className="mx-auto max-w-7xl px-4 py-3 text-sm font-medium text-amber-950 lg:px-8">
          Road Closure: Main St between 3rd and 5th Ave until Nov 30
        </div>
      </div>
      <header className="sticky top-[49px] z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <a href="./index.html" className="focus-ring rounded-full bg-slate-950 px-4 py-3 text-lg font-semibold text-white">
              City of Lakewood
            </a>
            <p className="text-sm text-slate-600">Official Government Portal</p>
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
        </div>
      </header>
    </>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-lg font-semibold text-white">City of Lakewood</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Providing accessible services, transparent government, and responsive support for Lakewood residents.
          </p>
        </div>
        <nav aria-label="Footer services">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Services</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li><a href="./services.html" className="focus-ring rounded">All services</a></li>
            <li><a href="./permits.html" className="focus-ring rounded">Permits & Licenses</a></li>
            <li><a href="./pay-bill.html" className="focus-ring rounded">Pay a Bill</a></li>
          </ul>
        </nav>
        <nav aria-label="Footer contact">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Connect</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li><a href="./about.html" className="focus-ring rounded">About the city</a></li>
            <li><a href="./contact.html" className="focus-ring rounded">Department directory</a></li>
            <li><a href="./contact.html#social-links" className="focus-ring rounded">Social channels</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

function PageLayout({ currentPage, breadcrumbItems, liveMessage, children }) {
  return (
    <div>
      <div className="sr-live" aria-live="polite" aria-atomic="true">{liveMessage}</div>
      <Header currentPage={currentPage} />
      <main id="main-content" className="page-main mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Breadcrumbs items={breadcrumbItems} />
        {children}
      </main>
      <Footer />
    </div>
  );
}
