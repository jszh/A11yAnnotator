window.GovernmentPortal = (() => {
  const navItems = [
    { label: "Home", href: "./index.html" },
    { label: "Services", href: "./services.html" },
    { label: "License Renewal", href: "./drivers-license.html" },
    { label: "Benefits", href: "./benefits.html" },
    { label: "About", href: "./about.html" },
    { label: "Contact", href: "./contact.html" },
  ];

  const quickLinks = [
    { title: "Renew Driver's License", href: "./drivers-license.html", detail: "Complete your renewal in about 10 minutes." },
    { title: "Apply for Benefits", href: "./benefits.html", detail: "Check SNAP, Medicaid, and heating assistance eligibility." },
    { title: "Register to Vote", href: "./services.html#families", detail: "Update registration or verify your polling place." },
    { title: "Find a School", href: "./services.html#students", detail: "Browse district contacts, enrollment windows, and supports." },
  ];

  const updates = [
    { department: "Department of Taxes", title: "Online filing support hours extended through April 15.", time: "Updated today at 8:15 AM" },
    { department: "Agency of Education", title: "Summer meal site applications open for local districts and partners.", time: "Updated today at 9:40 AM" },
    { department: "Department of Health", title: "Seasonal vaccine clinic schedule posted for county health offices.", time: "Updated yesterday at 4:20 PM" },
    { department: "Agency of Human Services", title: "Heating assistance verification deadlines available in resident portal inbox.", time: "Updated yesterday at 1:05 PM" },
  ];

  const lifeStages = [
    {
      id: "new-residents",
      title: "New Residents",
      description: "Set up your move, update state records, and connect core services.",
      services: [
        { name: "Driver's License Renewal", eta: "~10 minutes online", href: "./drivers-license.html" },
        { name: "Vehicle Registration Transfer", eta: "~15 minutes online", href: "./services.html" },
        { name: "Resident Tax Withholding Setup", eta: "~8 minutes online", href: "./services.html" },
      ],
    },
    {
      id: "families",
      title: "Families",
      description: "Support child care, food, housing, and civic participation needs.",
      services: [
        { name: "Apply for Benefits", eta: "~12 minutes online", href: "./benefits.html" },
        { name: "Register to Vote", eta: "~5 minutes online", href: "./services.html" },
        { name: "Child Care Assistance", eta: "~20 minutes online", href: "./benefits.html" },
      ],
    },
    {
      id: "students",
      title: "Students",
      description: "Navigate enrollment, scholarships, learning access, and records.",
      services: [
        { name: "Find a School", eta: "~6 minutes online", href: "./services.html" },
        { name: "Request Education Records", eta: "~10 minutes online", href: "./services.html" },
        { name: "Career Training Grants", eta: "~14 minutes online", href: "./benefits.html" },
      ],
    },
    {
      id: "seniors",
      title: "Seniors",
      description: "Access health coverage, transportation, and home energy support.",
      services: [
        { name: "Medicaid Renewal", eta: "~15 minutes online", href: "./benefits.html" },
        { name: "Heating Assistance", eta: "~9 minutes online", href: "./benefits.html" },
        { name: "Senior Transit Pass", eta: "~7 minutes online", href: "./services.html" },
      ],
    },
    {
      id: "businesses",
      title: "Businesses",
      description: "Manage registrations, labor reporting, and workforce programs.",
      services: [
        { name: "Business License Lookup", eta: "~4 minutes online", href: "./services.html" },
        { name: "Employer Tax Account", eta: "~11 minutes online", href: "./services.html" },
        { name: "Hiring Incentive Programs", eta: "~18 minutes online", href: "./benefits.html" },
      ],
    },
  ];

  const programs = [
    { name: "SNAP", tag: "Food support", summary: "Monthly assistance for groceries based on household size and income.", cta: "Start SNAP Application" },
    { name: "Medicaid", tag: "Health coverage", summary: "Medical, dental, and prescription coverage for qualifying households.", cta: "Start Medicaid Application" },
    { name: "Heating Assistance", tag: "Seasonal support", summary: "Help with winter heating bills and fuel delivery costs.", cta: "Start Heating Assistance Application" },
  ];

  const agencyDirectory = [
    { agency: "Agency of Transportation", service: "Licensing, registration, road safety", phone: "(802) 555-0141" },
    { agency: "Agency of Human Services", service: "Benefits, housing, family support", phone: "(802) 555-0175" },
    { agency: "Agency of Education", service: "Schools, grants, student records", phone: "(802) 555-0122" },
    { agency: "Department of Health", service: "Public health alerts and clinics", phone: "(802) 555-0184" },
  ];

  const helplines = [
    { dept: "Resident Services Center", phone: "(800) 555-1000", hours: "Mon-Fri, 8:00 AM-5:00 PM" },
    { dept: "License & Registration", phone: "(800) 555-1024", hours: "Mon-Fri, 8:00 AM-4:30 PM" },
    { dept: "Benefits Assistance", phone: "(800) 555-1088", hours: "Mon-Fri, 8:30 AM-5:00 PM" },
    { dept: "Education Help Desk", phone: "(800) 555-1066", hours: "Mon-Fri, 8:00 AM-4:00 PM" },
  ];

  function Logo() {
    return (
      <a href="./index.html" className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold uppercase tracking-[0.28em] text-sky-900">
          VT
        </div>
        <div>
          <p className="text-base font-semibold tracking-[0.12em] text-white sm:text-lg">State of Vermont</p>
          <p className="text-xs uppercase tracking-[0.3em] text-sky-100">Resident Services Portal</p>
        </div>
      </a>
    );
  }

  function UtilityBar() {
    return (
      <div className="border-b border-sky-900/10 bg-slate-50 text-slate-600">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <span>Official state services, information, and resident support.</span>
            <span className="hidden h-3 w-px bg-slate-300 sm:block" />
            <a href="./contact.html" className="font-semibold text-sky-800">Need help?</a>
          </div>
          <div className="flex items-center gap-2">
            <span>Language:</span>
            <div className="flex items-center gap-1">
              {["EN", "ES", "FR"].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={`rounded-full px-3 py-1 font-semibold ${lang === "EN" ? "bg-sky-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function Header({ current }) {
    return (
      <header className="sticky top-0 z-40 shadow-[0_10px_35px_rgba(23,50,77,0.08)]">
        <UtilityBar />
        <div className="hero-surface">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Logo />
              <div className="hidden flex-1 items-center justify-end gap-3 lg:flex">
                <a href="./services.html" className="rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20">
                  Browse Services
                </a>
                <a href="./contact.html" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-sky-900">
                  Contact Support
                </a>
              </div>
            </div>
            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                    current === item.href ? "bg-white text-sky-900" : "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/18"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>
    );
  }

  function Footer() {
    return (
      <footer className="mt-20 border-t border-slate-200 bg-slate-950 text-slate-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_repeat(3,1fr)] lg:px-8">
          <div className="space-y-4">
            <p className="text-lg font-semibold tracking-[0.12em]">Resident Services Portal</p>
            <p className="max-w-sm text-sm leading-6 text-slate-300">
              Access licensing, health, education, and benefits services from a single state portal designed for residents.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Top Tasks</p>
            <div className="space-y-2 text-sm text-slate-300">
              <a className="block" href="./drivers-license.html">Renew Driver's License</a>
              <a className="block" href="./benefits.html">Apply for Benefits</a>
              <a className="block" href="./services.html">Find Resident Services</a>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Government</p>
            <div className="space-y-2 text-sm text-slate-300">
              <a className="block" href="./about.html">About the Portal</a>
              <a className="block" href="./about.html#directory">Agency Directory</a>
              <a className="block" href="./about.html#transparency">Open Data & Reports</a>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Support</p>
            <div className="space-y-2 text-sm text-slate-300">
              <a className="block" href="./contact.html">Chat with a representative</a>
              <a className="block" href="./contact.html">Multilingual support</a>
              <p>(800) 555-1000</p>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  function Shell({ current, children }) {
    return (
      <div className="portal-shell">
        <Header current={current} />
        <main>{children}</main>
        <Footer />
      </div>
    );
  }

  function SectionHeading({ eyebrow, title, copy, actions }) {
    return (
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-800">{eyebrow}</p> : null}
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
          {copy ? <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{copy}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    );
  }

  function Hero({ eyebrow, title, copy, children }) {
    return (
      <section className="px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <div className="hero-surface data-grid mx-auto overflow-hidden rounded-[2.25rem]">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 sm:px-8 sm:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-14">
            <div className="space-y-6 text-white">
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-50 ring-1 ring-white/15">
                {eyebrow}
              </p>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{title}</h1>
                <p className="max-w-2xl text-sm leading-7 text-sky-50/92 sm:text-base">{copy}</p>
              </div>
            </div>
            <div>{children}</div>
          </div>
        </div>
      </section>
    );
  }

  return {
    Shell,
    SectionHeading,
    Hero,
    navItems,
    quickLinks,
    updates,
    lifeStages,
    programs,
    agencyDirectory,
    helplines,
  };
})();
