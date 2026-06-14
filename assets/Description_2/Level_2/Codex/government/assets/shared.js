const {
  useEffect,
  useMemo,
  useRef,
  useState,
} = React;

const GovPortal = (() => {
  const navLinks = [
    { href: "./index.html", label: "Home" },
    { href: "./services.html", label: "Services" },
    { href: "./license-renewal.html", label: "License Renewal" },
    { href: "./benefits.html", label: "Benefits" },
    { href: "./about.html", label: "About" },
    { href: "./contact.html", label: "Contact" },
  ];

  const quickTasks = [
    {
      title: "Renew Driver's License",
      href: "./license-renewal.html",
      description: "Check eligibility, upload documents, and schedule an appointment.",
      iconLabel: "Motor vehicle services",
    },
    {
      title: "Apply for Benefits",
      href: "./benefits.html",
      description: "Screen for food, health, and heating support in one place.",
      iconLabel: "Benefits and assistance services",
    },
    {
      title: "Register to Vote",
      href: "./services.html#families",
      description: "Update your voter registration and review local election deadlines.",
      iconLabel: "Voting and civic participation services",
    },
    {
      title: "Find a School",
      href: "./services.html#students",
      description: "Explore district resources, enrollment support, and transportation tools.",
      iconLabel: "Education and school finder services",
    },
  ];

  const lifeStages = [
    {
      id: "new-residents",
      title: "New Residents",
      description: "Transfer records, update residency, and connect utilities and local services.",
      services: [
        { name: "Driver's License Renewal", time: "~10 minutes online", href: "./license-renewal.html" },
        { name: "Vehicle Registration Transfer", time: "~15 minutes online", href: "./services.html" },
        { name: "Residency Checklist", time: "~5 minutes", href: "./about.html" },
      ],
    },
    {
      id: "families",
      title: "Families",
      description: "Support for childcare, nutrition, school enrollment, and family health programs.",
      services: [
        { name: "Apply for Benefits", time: "~12 minutes", href: "./benefits.html" },
        { name: "Childcare Search", time: "~7 minutes", href: "./services.html" },
        { name: "Register to Vote", time: "~6 minutes", href: "./services.html" },
      ],
    },
    {
      id: "students",
      title: "Students",
      description: "Grants, tuition support, school lookups, and career planning tools.",
      services: [
        { name: "Find a School", time: "~4 minutes", href: "./services.html" },
        { name: "Tuition Assistance", time: "~14 minutes", href: "./services.html" },
        { name: "Internship Portal", time: "~9 minutes", href: "./about.html" },
      ],
    },
    {
      id: "seniors",
      title: "Seniors",
      description: "Health coverage, independence services, transportation, and heating relief.",
      services: [
        { name: "Medicaid Renewal", time: "~11 minutes", href: "./benefits.html" },
        { name: "Heating Assistance", time: "~8 minutes", href: "./benefits.html" },
        { name: "Senior Transit Pass", time: "~5 minutes", href: "./services.html" },
      ],
    },
    {
      id: "businesses",
      title: "Businesses",
      description: "Licensing, hiring support, tax filing, and procurement resources.",
      services: [
        { name: "Business Registration", time: "~18 minutes", href: "./services.html" },
        { name: "Tax Filing Reminder", time: "~3 minutes", href: "./index.html" },
        { name: "Workforce Grants", time: "~9 minutes", href: "./about.html" },
      ],
    },
  ];

  const departmentFeed = [
    { department: "Department of Taxes", time: "Updated 45 minutes ago", message: "Online filing support is available for individual returns through April 15." },
    { department: "Agency of Education", time: "Updated 2 hours ago", message: "School calendar guidance and transportation weather notices have been posted for this week." },
    { department: "Department for Children and Families", time: "Updated today", message: "SNAP and heating assistance interviews can now be scheduled online." },
  ];

  const departmentDirectory = [
    { name: "Agency of Human Services", contact: "(802) 555-0114", label: "Health and benefits administration" },
    { name: "Department of Motor Vehicles", contact: "(802) 555-0125", label: "Motor vehicle licensing office" },
    { name: "Agency of Education", contact: "(802) 555-0172", label: "Education and district services office" },
    { name: "Department of Taxes", contact: "(802) 555-0198", label: "State taxes and filing support office" },
  ];

  function announce(message) {
    const region = document.getElementById("global-live-region");
    if (!region) return;
    region.textContent = "";
    window.setTimeout(() => {
      region.textContent = message;
    }, 40);
  }

  function Header({ currentPath = "" }) {
    return (
      <header className="sticky-header border-b border-pine-100 bg-stone-25/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 lg:px-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-pine-700 px-4 py-3 text-white shadow-civic">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em]">State of Vermont</p>
                  <p className="text-lg font-semibold">Resident Services Portal</p>
                </div>
                <p className="max-w-xl text-sm text-slate-600">Official online access to resident licensing, health, education, and benefits services.</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <a href="./contact.html" className="focus-ring rounded-full border border-pine-200 px-4 py-2 font-semibold text-pine-900" aria-label="Contact the State of Vermont resident services portal">
                  Help Center
                </a>
                <span className="rounded-full bg-pine-50 px-3 py-2 font-medium text-pine-900">Secure access</span>
              </div>
            </div>
            <nav aria-label="Primary" className="overflow-x-auto portal-scroll">
              <ul className="flex min-w-max items-center gap-2 pb-1">
                {navLinks.map((link) => {
                  const active = currentPath === link.href;
                  return (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className={`focus-ring inline-flex rounded-full px-4 py-2 text-sm font-semibold ${active ? "bg-pine-700 text-white" : "bg-white text-slate-700 border border-slate-200"}`}
                        aria-current={active ? "page" : undefined}
                        aria-label={`Go to ${link.label}`}
                      >
                        {link.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </header>
    );
  }

  function Footer() {
    return (
      <footer className="mt-16 border-t border-pine-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <section aria-labelledby="footer-mission">
            <h2 id="footer-mission" className="text-xl font-semibold text-pine-900">Resident-first digital services</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">This portal organizes trusted state services around life events, plain language guidance, and accessible online tasks.</p>
          </section>
          <nav aria-label="Footer">
            <ul className="grid gap-3 text-sm text-slate-700">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="focus-ring font-medium hover:text-pine-700" aria-label={`Open ${link.label} page`}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    );
  }

  function Breadcrumbs({ items }) {
    return (
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {item.href ? (
                <a href={item.href} className="focus-ring rounded font-medium text-pine-700" aria-label={`Navigate to ${item.label}`}>
                  {item.label}
                </a>
              ) : (
                <span aria-current="page" className="font-semibold text-slate-800">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  function PageShell({ currentPath, title, eyebrow, description, breadcrumbs, children, aside }) {
    return (
      <div className="page-shell">
        <a href="#main-content" className="sr-anchor focus-ring rounded bg-white px-4 py-2 text-sm font-semibold text-slate-900">Skip to main content</a>
        <Header currentPath={currentPath} />
        <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-pine-700">{eyebrow}</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 lg:text-5xl">{title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 lg:text-lg">{description}</p>
            </div>
            {aside ? <aside>{aside}</aside> : null}
          </section>
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  function IconBadge({ label, children }) {
    return (
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-pine-50 text-pine-700" role="img" aria-label={label}>
        {children}
      </div>
    );
  }

  function Modal({ open, title, description, onClose, children }) {
    const dialogRef = useRef(null);
    const lastFocused = useRef(null);

    useEffect(() => {
      if (!open) return undefined;
      lastFocused.current = document.activeElement;
      const node = dialogRef.current;
      if (!node) return undefined;
      const focusable = () => Array.from(node.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter((item) => !item.hasAttribute("disabled"));
      const currentFocusable = focusable();
      if (currentFocusable.length) currentFocusable[0].focus();

      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
          return;
        }
        if (event.key !== "Tab") return;
        const list = focusable();
        if (!list.length) {
          event.preventDefault();
          return;
        }
        const first = list[0];
        const last = list[list.length - 1];
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
        if (lastFocused.current && typeof lastFocused.current.focus === "function") {
          lastFocused.current.focus();
        }
      };
    }, [open, onClose]);

    if (!open) return null;

    return (
      <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description" className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="modal-title" className="text-2xl font-semibold text-slate-950">{title}</h2>
              <p id="modal-description" className="mt-2 text-sm text-slate-600">{description}</p>
            </div>
            <button type="button" onClick={onClose} className="focus-ring rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700" aria-label={`Close ${title}`}>
              Close
            </button>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    );
  }

  return {
    announce,
    Breadcrumbs,
    departmentDirectory,
    departmentFeed,
    Footer,
    Header,
    IconBadge,
    lifeStages,
    Modal,
    PageShell,
    quickTasks,
    useMemo,
    useRef,
    useState,
  };
})();

window.GovPortal = GovPortal;
