const { useMemo, useState } = React;

function linkFor(prefix, path) {
  return `${prefix}${path}`;
}

function TrustBanner({ prefix }) {
  return (
    <div className="bg-slate-900 text-white text-sm">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between gap-2">
        <p>
          An official website of the United States government.
        </p>
        <a
          href="https://www.usa.gov"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="Learn how to verify official government websites"
        >
          How to verify
        </a>
      </div>
    </div>
  );
}

function Header({ prefix }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky-header border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <a
            href={linkFor(prefix, "index.html")}
            className="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
            aria-label="Government public services homepage"
          >
            <div className="h-10 w-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold">G</div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">Government Public Services</p>
              <p className="text-xs text-slate-600">National & Local Portal</p>
            </div>
          </a>

          <form className="hidden md:flex flex-1 max-w-xl" role="search" aria-label="Sitewide search">
            <label htmlFor="site-search" className="sr-only">Search government services</label>
            <input
              id="site-search"
              type="search"
              className="w-full rounded-l-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Search for services, forms, and programs"
            />
            <button
              type="submit"
              className="rounded-r-md bg-blue-800 px-4 py-2 text-white font-semibold hover:bg-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Search
            </button>
          </form>

          <div className="hidden md:flex items-center gap-4 text-sm">
            <button className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded">English</button>
            <a href={linkFor(prefix, "contact/contact.html")} className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded">Help</a>
            <a href={linkFor(prefix, "contact/contact.html")} className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded">Contact</a>
            <button className="rounded-md border border-blue-800 px-3 py-2 text-blue-900 font-semibold hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Sign In</button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-expanded={mobileOpen}
            aria-controls="mobile-utility"
          >
            Menu
          </button>
        </div>

        <div id="mobile-utility" className={`${mobileOpen ? "block" : "hidden"} md:hidden mt-3 space-y-2`}>
          <form className="flex" role="search" aria-label="Mobile site search">
            <label htmlFor="mobile-search" className="sr-only">Search</label>
            <input id="mobile-search" type="search" className="w-full rounded-l-md border border-slate-300 px-3 py-2 text-sm" placeholder="Search services" />
            <button type="submit" className="rounded-r-md bg-blue-800 px-4 py-2 text-white font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Go</button>
          </form>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <button className="rounded border border-slate-300 px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">English</button>
            <a href={linkFor(prefix, "contact/contact.html")} className="rounded border border-slate-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Help</a>
            <a href={linkFor(prefix, "contact/contact.html")} className="rounded border border-slate-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Contact</a>
            <button className="rounded border border-blue-800 px-3 py-2 text-blue-900 font-semibold text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Sign In</button>
          </div>
        </div>
      </div>
    </header>
  );
}

function ServiceNav({ prefix }) {
  const [openMenu, setOpenMenu] = useState("");

  const navItems = [
    { key: "benefits", label: "Benefits", href: linkFor(prefix, "services/benefits/benefits.html") },
    { key: "taxes", label: "Taxes", href: linkFor(prefix, "services/taxes/taxes.html") },
    { key: "immigration", label: "Immigration", href: linkFor(prefix, "services/services.html#immigration") },
    { key: "payments", label: "Payments", href: linkFor(prefix, "services/services.html#payments") },
    { key: "licenses", label: "Licenses", href: linkFor(prefix, "services/licenses/licenses.html") },
    { key: "public-safety", label: "Public Safety", href: linkFor(prefix, "services/services.html#public-safety") },
    { key: "travel", label: "Travel", href: linkFor(prefix, "services/services.html#travel") },
    { key: "business", label: "Business Services", href: linkFor(prefix, "services/services.html#business") },
  ];

  const menuItems = {
    benefits: [
      { label: "Apply for benefits", href: linkFor(prefix, "services/benefits/benefits.html") },
      { label: "Eligibility checker", href: linkFor(prefix, "services/benefits/benefits.html#eligibility") },
    ],
    taxes: [
      { label: "File and pay taxes", href: linkFor(prefix, "services/taxes/taxes.html") },
      { label: "Track refund", href: linkFor(prefix, "services/taxes/taxes.html#refund") },
    ],
    licenses: [
      { label: "Renew license or ID", href: linkFor(prefix, "services/licenses/licenses.html") },
      { label: "Permit lookup", href: linkFor(prefix, "services/licenses/licenses.html#permits") },
    ],
  };

  return (
    <nav className="border-b border-slate-200 bg-slate-50" aria-label="Primary service navigation">
      <div className="mx-auto max-w-7xl px-4 py-2 overflow-x-auto">
        <ul className="flex gap-2 min-w-max">
          {navItems.map((item) => {
            const hasMenu = Boolean(menuItems[item.key]);
            const isOpen = openMenu === item.key;

            return (
              <li key={item.key} className="relative">
                <div className="flex items-center gap-1">
                  <a
                    href={item.href}
                    className="rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-100 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {item.label}
                  </a>
                  {hasMenu && (
                    <button
                      type="button"
                      onClick={() => setOpenMenu(isOpen ? "" : item.key)}
                      className="rounded px-2 py-2 text-sm text-slate-700 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      aria-haspopup="true"
                      aria-expanded={isOpen}
                      aria-label={`Open ${item.label} menu`}
                    >
                      ▾
                    </button>
                  )}
                </div>

                {hasMenu && isOpen && (
                  <div className="menu-panel absolute left-0 top-full mt-1 rounded-md border border-slate-200 bg-white p-2 shadow-lg fade-up">
                    <ul>
                      {menuItems[item.key].map((menuItem) => (
                        <li key={menuItem.label}>
                          <a
                            href={menuItem.href}
                            className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-blue-100 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                          >
                            {menuItem.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

function HeroTaskSection({ heroStyle, title, description, quickLinks }) {
  const heroClass = heroStyle === "image" ? "hero-image text-white" : "bg-blue-900 text-white";

  return (
    <section className={heroClass}>
      <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">{title}</h1>
          <p className="text-lg md:text-xl text-blue-50">{description}</p>
        </div>

        <form className="mt-7 max-w-2xl" role="search" aria-label="Task search">
          <label htmlFor="hero-search" className="sr-only">Search task</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="hero-search"
              type="search"
              placeholder="Start a task, service, or application"
              className="w-full rounded-md border border-white/40 bg-white px-4 py-3 text-slate-900"
            />
            <button
              type="submit"
              className="rounded-md bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Find Task
            </button>
          </div>
        </form>

        <ul className="mt-6 flex flex-wrap gap-3 text-sm">
          {quickLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="inline-block rounded-md border border-white/60 px-3 py-2 text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function QuickTaskGrid({ items }) {
  return (
    <section className="bg-white" aria-labelledby="quick-tasks-title">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h2 id="quick-tasks-title" className="text-2xl font-bold text-slate-900">Quick Tasks</h2>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, idx) => (
            <a
              key={item.title}
              href={item.href}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-400 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="icon-badge" aria-hidden="true">{idx + 1}</span>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-700">{item.description}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ title, description, href }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-700">{description}</p>
      <a
        href={href}
        className="mt-4 inline-block rounded-md bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Open service
      </a>
    </article>
  );
}

function AnnouncementModule({ announcements }) {
  return (
    <section className="bg-amber-50 border-y border-amber-200" aria-labelledby="announcements-title">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h2 id="announcements-title" className="text-2xl font-bold text-slate-900">Announcements & Alerts</h2>
        <ul className="mt-4 space-y-3">
          {announcements.map((item) => (
            <li key={item.title} className="rounded-md border border-amber-300 bg-white p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">{item.type}</p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-700">{item.description}</p>
              <a href={item.href} className="mt-2 inline-block text-sm font-semibold text-blue-900 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Read more</a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Footer({ prefix }) {
  return (
    <footer className="bg-slate-900 text-slate-100 mt-10">
      <div className="mx-auto max-w-7xl px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h2 className="font-bold text-white">Government Public Services</h2>
          <p className="mt-2 text-sm text-slate-300">Helping residents access trusted national and local services online.</p>
        </div>

        <div>
          <h3 className="font-semibold text-white">Explore</h3>
          <ul className="mt-2 space-y-2 text-sm">
            <li><a href={linkFor(prefix, "about/about.html")} className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">About</a></li>
            <li><a href={linkFor(prefix, "services/services.html")} className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Services</a></li>
            <li><a href={linkFor(prefix, "contact/contact.html")} className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Contact</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white">Policy</h3>
          <ul className="mt-2 space-y-2 text-sm">
            <li><a href={linkFor(prefix, "about/about.html")} className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Accessibility Statement</a></li>
            <li><a href={linkFor(prefix, "about/about.html")} className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Privacy & Security</a></li>
            <li><a href={linkFor(prefix, "contact/contact.html")} className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Language Access</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white">Contact</h3>
          <p className="mt-2 text-sm text-slate-300">Call 1-800-GOV-HELP</p>
          <p className="text-sm text-slate-300">Mon-Fri, 8:00 AM - 8:00 PM</p>
          <p className="mt-3 text-xs text-slate-400">Official government portal. Secure connection required for sign-in and transactions.</p>
        </div>
      </div>
    </footer>
  );
}

const pageContent = {
  home: {
    title: "Find and complete government tasks in one place",
    description: "Search benefits, tax, licensing, payment, and local support services with clear guidance and secure access.",
    heroStyle: "image",
    sections: [
      { title: "Featured Services", cards: [
        { title: "Benefits enrollment", description: "Apply, upload documents, and monitor decision status.", path: "services/benefits/benefits.html" },
        { title: "Tax filing and refunds", description: "File returns, set payment plans, and track refunds.", path: "services/taxes/taxes.html" },
        { title: "License renewal", description: "Renew licenses and IDs with online eligibility checks.", path: "services/licenses/licenses.html" },
      ] },
      { title: "Local Services", cards: [
        { title: "City permits", description: "Find local permit requirements and application links.", path: "services/services.html#local-permits" },
        { title: "Public safety alerts", description: "Receive emergency and preparedness notifications.", path: "services/services.html#public-safety" },
        { title: "Business registration", description: "Start or update your business registration online.", path: "services/services.html#business" },
      ] },
    ],
    announcements: [
      { type: "Alert", title: "System maintenance on Sunday 2:00 AM-4:00 AM", description: "Some account services may be unavailable during scheduled maintenance.", path: "services/services.html" },
      { type: "Update", title: "New mobile ID renewal option now available", description: "Eligible residents can complete ID renewals from mobile devices.", path: "services/licenses/licenses.html" },
    ],
  },
  about: {
    title: "About this public service portal",
    description: "Learn how this portal supports residents, businesses, and visitors with secure and accessible online services.",
    heroStyle: "solid",
    sections: [
      { title: "Our Mission", cards: [
        { title: "Service-first design", description: "Task-oriented experiences reduce confusion and help people act quickly.", path: "about/about.html" },
        { title: "Accessibility commitment", description: "We maintain semantic structure, keyboard access, and clear visual focus for all users.", path: "about/about.html" },
        { title: "Security and trust", description: "Official channels and secure sign-in keep account activity protected.", path: "contact/contact.html" },
      ] },
    ],
    announcements: [
      { type: "Notice", title: "Public feedback sessions this month", description: "Residents can join virtual sessions to shape service improvements.", path: "contact/contact.html" },
    ],
  },
  services: {
    title: "Browse public services by category",
    description: "Explore benefits, taxes, licensing, safety, travel, and business services from one searchable directory.",
    heroStyle: "solid",
    sections: [
      { title: "Popular Services", cards: [
        { title: "Benefits", description: "Income, housing, healthcare, and family support programs.", path: "services/benefits/benefits.html" },
        { title: "Taxes", description: "Individual and business filing, payment, and refund support.", path: "services/taxes/taxes.html" },
        { title: "Licenses", description: "Driver, occupational, and local permit renewals.", path: "services/licenses/licenses.html" },
      ] },
      { title: "More Categories", cards: [
        { title: "Travel", description: "Passport and travel advisories.", path: "services/services.html#travel" },
        { title: "Public Safety", description: "Emergency resources and preparedness guides.", path: "services/services.html#public-safety" },
        { title: "Business Services", description: "Registration, taxes, and compliance tools.", path: "services/services.html#business" },
      ] },
    ],
    announcements: [
      { type: "Update", title: "Expanded evening support hours for tax season", description: "Live support is available until 9 PM through April.", path: "services/taxes/taxes.html" },
    ],
  },
  benefits: {
    title: "Benefits and assistance services",
    description: "Find eligibility, apply online, and manage active benefits programs from your account dashboard.",
    heroStyle: "image",
    sections: [
      { title: "Benefits Programs", cards: [
        { title: "Healthcare support", description: "Coverage applications and renewal steps.", path: "services/benefits/benefits.html#health" },
        { title: "Food assistance", description: "Program details, household eligibility, and renewal dates.", path: "services/benefits/benefits.html#food" },
        { title: "Housing assistance", description: "Rental and utility support resources.", path: "services/benefits/benefits.html#housing" },
      ] },
    ],
    announcements: [
      { type: "Reminder", title: "Income verification deadline approaching", description: "Submit updated documents to avoid interruption of benefits.", path: "services/benefits/benefits.html" },
    ],
  },
  taxes: {
    title: "Tax filing, payment, and refund services",
    description: "File returns, make secure payments, and track refunds with clear status updates.",
    heroStyle: "solid",
    sections: [
      { title: "Tax Tools", cards: [
        { title: "File tax return", description: "Start, save, and submit your tax return online.", path: "services/taxes/taxes.html#file" },
        { title: "Make payment", description: "Pay by bank transfer, card, or installment plan.", path: "services/taxes/taxes.html#pay" },
        { title: "Track refund", description: "Check processing and refund issue dates.", path: "services/taxes/taxes.html#refund" },
      ] },
    ],
    announcements: [
      { type: "Alert", title: "Refund processing may take up to 21 days", description: "Electronic filing and direct deposit are fastest.", path: "services/taxes/taxes.html#refund" },
    ],
  },
  licenses: {
    title: "Licenses, IDs, and permit services",
    description: "Renew and manage licenses with online forms, appointment options, and document checklists.",
    heroStyle: "image",
    sections: [
      { title: "License Services", cards: [
        { title: "Renew driver license", description: "Online and in-office options by eligibility.", path: "services/licenses/licenses.html#drivers" },
        { title: "State ID replacement", description: "Replace lost or damaged identification cards.", path: "services/licenses/licenses.html#id" },
        { title: "Professional licenses", description: "Submit renewals and fee payments.", path: "services/licenses/licenses.html#professional" },
      ] },
    ],
    announcements: [
      { type: "Notice", title: "Saturday appointments available this quarter", description: "Select offices now offer weekend renewals.", path: "services/licenses/licenses.html" },
    ],
  },
  contact: {
    title: "Contact and support",
    description: "Reach support teams, report technical issues, and request language or accessibility assistance.",
    heroStyle: "solid",
    sections: [
      { title: "Support Channels", cards: [
        { title: "Phone support", description: "Speak with an agent for account and service questions.", path: "contact/contact.html#phone" },
        { title: "Secure message center", description: "Send protected inquiries and receive follow-up.", path: "contact/contact.html#message" },
        { title: "Accessibility help", description: "Request alternate formats and assistive support.", path: "contact/contact.html#accessibility" },
      ] },
    ],
    announcements: [
      { type: "Update", title: "Live chat now supports more languages", description: "Access translated support during business hours.", path: "contact/contact.html" },
    ],
  },
};

function App() {
  const root = document.getElementById("root");
  const pageId = root.dataset.page || "home";
  const depth = Number(root.dataset.depth || "0");
  const prefix = "../".repeat(depth);
  const content = pageContent[pageId] || pageContent.home;

  const quickTasks = useMemo(() => [
    { title: "Check application status", description: "Review updates for submitted requests.", href: linkFor(prefix, "services/services.html") },
    { title: "Apply for benefits", description: "Start a new eligibility and enrollment request.", href: linkFor(prefix, "services/benefits/benefits.html") },
    { title: "Renew license or ID", description: "Complete renewals with document checklist.", href: linkFor(prefix, "services/licenses/licenses.html") },
    { title: "Make a payment", description: "Pay taxes, fines, or service fees securely.", href: linkFor(prefix, "services/taxes/taxes.html") },
    { title: "Find government programs", description: "Browse local and national program directories.", href: linkFor(prefix, "services/services.html") },
    { title: "Track refund", description: "View latest tax refund processing stage.", href: linkFor(prefix, "services/taxes/taxes.html#refund") },
  ], [prefix]);

  const quickLinks = [
    { label: "Benefits", href: linkFor(prefix, "services/benefits/benefits.html") },
    { label: "Taxes", href: linkFor(prefix, "services/taxes/taxes.html") },
    { label: "Licenses", href: linkFor(prefix, "services/licenses/licenses.html") },
    { label: "Contact Support", href: linkFor(prefix, "contact/contact.html") },
  ];

  const anchorTargets = {
    services: ["immigration", "payments", "public-safety", "travel", "business", "local-permits"],
    benefits: ["eligibility", "health", "food", "housing"],
    taxes: ["file", "pay", "refund"],
    licenses: ["permits", "drivers", "id", "professional"],
    contact: ["phone", "message", "accessibility"],
  };

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <TrustBanner prefix={prefix} />
      <Header prefix={prefix} />
      <ServiceNav prefix={prefix} />

      <main id="main-content">
        <HeroTaskSection
          heroStyle={content.heroStyle}
          title={content.title}
          description={content.description}
          quickLinks={quickLinks}
        />

        <QuickTaskGrid items={quickTasks} />

        {anchorTargets[pageId] && (
          <section aria-label="Service topic anchors" className="bg-white border-t border-slate-200">
            <div className="mx-auto max-w-7xl px-4 py-8">
              <h2 className="text-2xl font-bold text-slate-900">Topic Directories</h2>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {anchorTargets[pageId].map((id) => (
                  <a
                    id={id}
                    key={id}
                    href={`#${id}`}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium capitalize hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {id.replace("-", " ")}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {content.sections.map((section) => (
          <section key={section.title} className="bg-slate-50 border-t border-slate-200">
            <div className="mx-auto max-w-7xl px-4 py-10">
              <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.cards.map((card) => (
                  <ServiceCard
                    key={card.title}
                    title={card.title}
                    description={card.description}
                    href={linkFor(prefix, card.path)}
                  />
                ))}
              </div>
            </div>
          </section>
        ))}

        <AnnouncementModule
          announcements={content.announcements.map((item) => ({
            ...item,
            href: linkFor(prefix, item.path),
          }))}
        />
      </main>

      <Footer prefix={prefix} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
