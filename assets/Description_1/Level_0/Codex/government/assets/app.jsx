const { useState, Fragment } = React;

const primaryNav = [
  { label: "Home", href: "index.html" },
  { label: "Services", href: "services.html" },
  { label: "Permits & Licenses", href: "permits.html" },
  { label: "Pay a Bill", href: "billing.html" },
  { label: "About", href: "about.html" },
  { label: "Contact", href: "contact.html" },
];

const serviceCategories = [
  {
    title: "Utilities & Billing",
    copy: "Manage water, sewer, and sanitation accounts, billing cycles, and payment support.",
    href: "billing.html",
  },
  {
    title: "Permits & Licenses",
    copy: "Apply for building, event, and contractor permits or review active application status.",
    href: "permits.html",
  },
  {
    title: "Public Safety",
    copy: "Access police, fire, emergency preparedness, and community safety resources.",
    href: "contact.html",
  },
  {
    title: "Transportation",
    copy: "Road closures, transit schedules, traffic notices, and street maintenance updates.",
    href: "services.html",
  },
  {
    title: "Parks & Recreation",
    copy: "Reserve facilities, review seasonal programs, and discover public parks and trails.",
    href: "services.html",
  },
  {
    title: "Social Services",
    copy: "Housing support, senior programs, food assistance, and resident resource referrals.",
    href: "contact.html",
  },
];

const quickActions = [
  { title: "Pay a Bill", copy: "Utility and municipal payments", href: "billing.html" },
  { title: "Report an Issue", copy: "Streetlight, pothole, and sanitation requests", href: "contact.html" },
  { title: "Apply for a Permit", copy: "Submit plans and documentation online", href: "permits.html" },
  { title: "Find a Park", copy: "Locate trails, playgrounds, and facilities", href: "services.html" },
];

const newsItems = [
  {
    title: "City Council approves downtown streetscape improvements",
    copy: "Phase one construction begins in January with pedestrian safety upgrades and utility modernization.",
  },
  {
    title: "Lakewood launches fall leaf collection schedule",
    copy: "Residents can check route maps and service dates by neighborhood ahead of the November pickup cycle.",
  },
  {
    title: "Public hearing scheduled for 2026 budget priorities",
    copy: "Share comments on housing, parks, infrastructure, and public safety investment at the next community session.",
  },
];

const events = [
  ["Nov 12", "Parks Master Plan Workshop", "City Hall Annex"],
  ["Nov 18", "Neighborhood Traffic Safety Forum", "Lakewood Community Center"],
  ["Nov 21", "Small Business Permit Clinic", "Civic Services Building"],
];

const departments = [
  ["City Hall", "(555) 210-4100", "Mon-Fri, 8:00 AM-5:00 PM"],
  ["Utilities Billing", "(555) 210-4221", "Mon-Fri, 8:30 AM-4:30 PM"],
  ["Permits & Inspections", "(555) 210-4305", "Mon-Fri, 8:00 AM-4:00 PM"],
  ["Parks & Recreation", "(555) 210-4477", "Mon-Fri, 9:00 AM-5:00 PM"],
  ["Emergency Management", "(555) 210-4999", "24/7 line"],
];

const leaders = [
  {
    name: "Elena Torres",
    title: "Mayor",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Marcus Green",
    title: "City Council President",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Dana Kim",
    title: "City Council Member",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Robert Singh",
    title: "City Council Member",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
  },
];

function Logo() {
  return (
    <a href="index.html" className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-lg shadow-slate-300">
        CL
      </div>
      <div>
        <div className="text-lg font-extrabold tracking-tight text-slate-950">City of Lakewood</div>
        <div className="text-xs text-slate-500">Official Government Portal</div>
      </div>
    </a>
  );
}

function PageHeader({ eyebrow, title, copy }) {
  return (
    <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">{eyebrow}</div>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{copy}</p>
      </div>
    </section>
  );
}

function Header({ currentPage }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="hidden flex-1 lg:block">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400 shadow-inner shadow-white">
            Search services, departments, forms, and city information
          </div>
        </div>
        <nav className="hidden items-center gap-2 md:flex">
          {primaryNav.map((item) => {
            const active = currentPage === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 py-3 text-sm text-slate-600 sm:px-6 lg:px-8">
          <span className="font-semibold text-slate-950">Popular services</span>
          <a href="billing.html" className="whitespace-nowrap hover:text-slate-950">Utility billing</a>
          <a href="permits.html" className="whitespace-nowrap hover:text-slate-950">Building permits</a>
          <a href="contact.html" className="whitespace-nowrap hover:text-slate-950">Report an issue</a>
          <a href="services.html" className="whitespace-nowrap hover:text-slate-950">Road closures</a>
          <a href="about.html" className="whitespace-nowrap hover:text-slate-950">City leadership</a>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="text-xl font-extrabold text-white">City of Lakewood</div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Serving approximately 160,000 residents with transparent, accessible, and reliable municipal services.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Services</div>
          <div className="mt-4 space-y-3 text-sm">
            <a href="services.html" className="block hover:text-white">All city services</a>
            <a href="permits.html" className="block hover:text-white">Permits & licenses</a>
            <a href="billing.html" className="block hover:text-white">Pay a bill</a>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Government</div>
          <div className="mt-4 space-y-3 text-sm">
            <a href="about.html" className="block hover:text-white">About Lakewood</a>
            <a href="contact.html" className="block hover:text-white">Departments & contact</a>
            <a href="about.html" className="block hover:text-white">Annual report</a>
          </div>
        </div>
        <div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="text-base font-semibold text-white">Need help now?</div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              For urgent safety concerns, contact emergency services. For city support, use the department directory or resident inquiry form.
            </p>
            <a href="contact.html" className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">
              Contact the City
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function PageShell({ currentPage, children }) {
  return (
    <div className="min-h-screen">
      <Header currentPage={currentPage} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function SectionIntro({ eyebrow, title, copy, action, href }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">{eyebrow}</div>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{title}</h2>
        {copy && <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{copy}</p>}
      </div>
      {action && (
        <a href={href} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          {action}
        </a>
      )}
    </div>
  );
}

function HomePage() {
  return (
    <PageShell currentPage="index.html">
      <section className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="font-semibold text-amber-900">
            Road Closure: Main St between 3rd and 5th Ave until Nov 30
          </div>
          <a href="services.html" className="font-semibold text-amber-800 underline-offset-4 hover:underline">
            View transportation updates
          </a>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="hero-panel rounded-[36px] bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-8 text-white shadow-2xl shadow-slate-200 sm:p-10">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-200">Resident Services</div>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Clear access to city services, updates, and support.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-200">
            The City of Lakewood portal helps residents complete tasks, stay informed, and connect with local government services.
          </p>
          <div className="mt-8 rounded-[28px] bg-white p-4 shadow-lg">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">How Can We Help You?</div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                placeholder="Search tasks like paying a utility bill or applying for a permit"
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
              />
              <button className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Search</button>
            </div>
          </div>
        </div>
        <div className="grid gap-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">City Snapshot</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["160,000", "Residents served"],
                ["34", "Active online services"],
                ["24/7", "Emergency information access"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="text-2xl font-extrabold text-slate-950">{value}</div>
                  <div className="mt-1 text-sm text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Need assistance?</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Browse service categories, contact a department, or use resident support to complete common city tasks.
            </p>
            <a href="contact.html" className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Contact a Department
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionIntro eyebrow="Quick Access" title="Complete common tasks online" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <a key={action.title} href={action.href} className="service-card rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Service</div>
              <div className="mt-8 text-2xl font-extrabold tracking-tight text-slate-950">{action.title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-600">{action.copy}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionIntro eyebrow="News & Announcements" title="Latest city updates" action="View All Services" href="services.html" />
            <div className="mt-6 space-y-4">
              {newsItems.map((item) => (
                <article key={item.title} className="rounded-[24px] bg-slate-50 p-5">
                  <div className="text-lg font-bold text-slate-950">{item.title}</div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionIntro eyebrow="Upcoming Events" title="Community calendar" />
            <div className="mt-6 space-y-4">
              {events.map(([date, title, location]) => (
                <article key={title} className="rounded-[24px] bg-slate-50 p-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{date}</div>
                  <div className="mt-2 text-lg font-bold text-slate-950">{title}</div>
                  <div className="mt-2 text-sm text-slate-600">{location}</div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function ServicesPage() {
  return (
    <PageShell currentPage="services.html">
      <PageHeader
        eyebrow="Services Overview"
        title="Find city services by category"
        copy="Browse task-oriented service categories for billing, permits, safety, transportation, parks, and resident support."
      />

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {serviceCategories.map((category) => (
            <a key={category.title} href={category.href} className="service-card rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Category</div>
              <div className="mt-8 text-2xl font-extrabold tracking-tight text-slate-950">{category.title}</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{category.copy}</p>
              <div className="mt-6 text-sm font-semibold text-sky-800">Open service details</div>
            </a>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function PermitsPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <PageShell currentPage="permits.html">
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Permits & Licenses</div>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">Submit an online permit application</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Use this form for common residential and small business permit requests. Supporting documents can be uploaded during submission.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Applicant Name</label>
                <input type="text" placeholder="Jordan Lee" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Project Type</label>
                <select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                  <option>Building Permit</option>
                  <option>Electrical Permit</option>
                  <option>Special Event Permit</option>
                  <option>Business License</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Project Address</label>
                <input type="text" placeholder="1457 Cedar Ave, Lakewood, ST 10021" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Upload Supporting Documents</label>
                <div className="mt-2 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Drag and drop plans, proof of ownership, or contractor documents here
                </div>
              </div>
            </div>

            <button onClick={() => setSubmitted(true)} className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
              Submit Application
            </button>

            {submitted && (
              <div className="mt-5 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                Application submitted successfully. Confirmation ID: LK-20483. A permit specialist will review your request within 3 business days.
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Status Tracker</div>
              <div className="mt-4 space-y-4">
                {[
                  ["Application Received", "Completed"],
                  ["Document Review", "In Progress"],
                  ["Inspector Assignment", "Pending"],
                  ["Final Decision", "Pending"],
                ].map(([step, status]) => (
                  <div key={step} className="rounded-[24px] bg-slate-50 px-4 py-4">
                    <div className="font-semibold text-slate-950">{step}</div>
                    <div className="mt-1 text-sm text-slate-500">{status}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Helpful links</div>
              <div className="mt-4 space-y-3 text-sm">
                <a href="services.html" className="block font-semibold text-sky-800">Permit requirements by category</a>
                <a href="contact.html" className="block font-semibold text-sky-800">Contact permit staff</a>
                <a href="about.html" className="block font-semibold text-sky-800">Development guidelines</a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

function BillingPage() {
  const [step, setStep] = useState("lookup");

  return (
    <PageShell currentPage="billing.html">
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Utilities & Billing</div>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">Pay your utility bill online</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Look up your account, review the current balance, and complete payment through a secure municipal payment flow.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                ["lookup", "1. Account Lookup"],
                ["payment", "2. Payment Method"],
                ["confirmation", "3. Confirmation"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setStep(value)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${step === value ? "tab-active" : "border-slate-200 bg-white text-slate-600"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {step === "lookup" && (
              <div className="mt-6 rounded-[24px] bg-slate-50 p-5">
                <label className="text-sm font-semibold text-slate-700">Account Number</label>
                <input type="text" placeholder="100245891" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
                <button onClick={() => setStep("payment")} className="mt-4 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
                  Look Up Balance
                </button>
              </div>
            )}

            {step === "payment" && (
              <div className="mt-6 space-y-5">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Current Balance</div>
                  <div className="mt-2 text-3xl font-extrabold text-slate-950">$148.26</div>
                  <div className="mt-2 text-sm text-slate-500">Due Dec 5 for account 100245891</div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="rounded-[24px] border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment-method" defaultChecked />
                      <span className="font-semibold text-slate-950">Credit Card</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">Visa, Mastercard, and Discover accepted</div>
                  </label>
                  <label className="rounded-[24px] border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment-method" />
                      <span className="font-semibold text-slate-950">Bank Transfer</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">Routing and account number required</div>
                  </label>
                </div>
                <button onClick={() => setStep("confirmation")} className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
                  Submit Payment
                </button>
              </div>
            )}

            {step === "confirmation" && (
              <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Payment Confirmed</div>
                <div className="mt-2 text-2xl font-extrabold text-slate-950">$148.26 paid successfully</div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Confirmation number LU-83314 has been emailed to the account holder. Your balance will update shortly.
                </p>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Billing Support</div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-[24px] bg-slate-50 px-4 py-4">Manage autopay and paperless billing through resident account services.</div>
                <div className="rounded-[24px] bg-slate-50 px-4 py-4">Late fee assistance is available for eligible residents.</div>
              </div>
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <a href="contact.html" className="text-sm font-semibold text-sky-800">Contact utilities billing</a>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

function AboutPage() {
  return (
    <PageShell currentPage="about.html">
      <PageHeader
        eyebrow="About Lakewood"
        title="A city shaped by service, growth, and community trust"
        copy="Founded as a rail and manufacturing town, Lakewood has grown into a diverse mid-sized city focused on resilient infrastructure, public spaces, and resident-centered service delivery."
      />

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionIntro eyebrow="Mission" title="Public service that is accessible, accountable, and practical" />
            <p className="mt-5 text-sm leading-7 text-slate-600">
              The City of Lakewood works to provide dependable services, transparent decision-making, and inclusive opportunities for residents, businesses, and visitors.
            </p>
            <div className="mt-6 rounded-[24px] bg-slate-50 p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Annual report</div>
              <div className="mt-2 text-lg font-bold text-slate-950">2025 Annual Report and Performance Summary</div>
              <a href="contact.html" className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Download Report
              </a>
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionIntro eyebrow="City History" title="From industrial roots to civic renewal" />
            <p className="mt-5 text-sm leading-7 text-slate-600">
              Over the last century, Lakewood expanded from a small corridor community into a regional hub with strong neighborhoods, growing parkland, and a steady focus on infrastructure and public safety.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionIntro eyebrow="Leadership" title="Mayor and City Council" />
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {leaders.map((leader) => (
            <article key={leader.name} className="surface-card rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="aspect-[4/5] overflow-hidden rounded-[24px] bg-slate-100">
                <img src={leader.image} alt={leader.name} className="h-full w-full object-cover" />
              </div>
              <div className="mt-4 text-xl font-bold text-slate-950">{leader.name}</div>
              <div className="mt-1 text-sm text-slate-500">{leader.title}</div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function ContactPage() {
  return (
    <PageShell currentPage="contact.html">
      <PageHeader
        eyebrow="Contact & Directory"
        title="Reach the right city department"
        copy="Use the department directory for direct assistance, submit a city inquiry online, or visit City Hall for in-person support."
      />

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <SectionIntro eyebrow="Department Directory" title="Phones and service hours" />
              <div className="mt-5 space-y-3">
                {departments.map(([name, phone, hours]) => (
                  <div key={name} className="rounded-[24px] bg-slate-50 px-4 py-4">
                    <div className="font-semibold text-slate-950">{name}</div>
                    <div className="mt-1 text-sm text-slate-600">{phone}</div>
                    <div className="mt-1 text-sm text-slate-500">{hours}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <SectionIntro eyebrow="City Hall Map" title="470 Civic Plaza, Lakewood, ST 10021" />
              <div className="mt-5 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,_#dbeafe,_#e2e8f0)] p-8">
                <div className="rounded-[24px] border border-white/70 bg-white/70 p-6 text-sm leading-7 text-slate-600">
                  Embedded map placeholder showing City Hall, adjacent public parking, and transit stops near Civic Plaza.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <SectionIntro eyebrow="Inquiry Form" title="Send a message" />
              <div className="mt-5 grid gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Name</label>
                  <input type="text" placeholder="Jordan Lee" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Email</label>
                  <input type="email" placeholder="jordan@example.com" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Department</label>
                  <select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                    <option>City Hall</option>
                    <option>Utilities Billing</option>
                    <option>Permits & Inspections</option>
                    <option>Parks & Recreation</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Message</label>
                  <textarea rows="5" placeholder="How can the City of Lakewood help?" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"></textarea>
                </div>
                <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Submit Inquiry</button>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <SectionIntro eyebrow="Connect" title="Official social channels" />
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                <a href="index.html" className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">Facebook</a>
                <a href="index.html" className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">Instagram</a>
                <a href="index.html" className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">X / Twitter</a>
                <a href="index.html" className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">YouTube</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function AppRouter() {
  const page = document.body.dataset.page;
  let component = <HomePage />;

  if (page === "services") component = <ServicesPage />;
  if (page === "permits") component = <PermitsPage />;
  if (page === "billing") component = <BillingPage />;
  if (page === "about") component = <AboutPage />;
  if (page === "contact") component = <ContactPage />;

  return <Fragment>{component}</Fragment>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppRouter />);
