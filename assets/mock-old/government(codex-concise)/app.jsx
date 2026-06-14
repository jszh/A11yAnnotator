const siteNav = [
  { href: "index.html", label: "Home", key: "home" },
  { href: "services.html", label: "Services", key: "services" },
  { href: "about.html", label: "About", key: "about" },
  { href: "contact.html", label: "Contact", key: "contact" }
];

const serviceList = [
  {
    href: "benefits.html",
    name: "Family Benefits",
    summary: "Apply for childcare, food support, and household assistance programs.",
    tag: "Popular"
  },
  {
    href: "permits.html",
    name: "Permits and Licenses",
    summary: "Request construction, event, and small-business operating permits.",
    tag: "Fast Track"
  },
  {
    href: "contact.html",
    name: "Appointments and Help",
    summary: "Book in-person support or request accessibility accommodations.",
    tag: "Support"
  }
];

function Header({ active }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <a href="index.html" className="text-xl font-extrabold tracking-tight text-slate-900">
            CivicConnect Portal
          </a>
          <nav className="flex gap-1 rounded-xl bg-slate-100 p-1 text-sm font-medium">
            {siteNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 transition ${
                  active === item.key
                    ? "bg-government-700 text-white"
                    : "text-slate-700 hover:bg-white hover:text-slate-900"
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
    <footer className="mt-14 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-slate-600 sm:grid-cols-2 sm:px-6 lg:px-8">
        <div>
          <p className="font-semibold text-slate-800">CivicConnect Public Services</p>
          <p className="mt-2">Built for clear, secure, and accessible public service delivery.</p>
        </div>
        <div className="sm:text-right">
          <p>Service Hours: Mon-Fri, 8:00 AM - 6:00 PM</p>
          <p className="mt-2">Phone: (800) 555-0142</p>
        </div>
      </div>
    </footer>
  );
}

function AlertBanner() {
  return (
    <section className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto max-w-6xl px-4 py-3 text-sm text-amber-900 sm:px-6 lg:px-8">
        <span className="font-semibold">Service Alert:</span> Scheduled maintenance on Sunday, 2:00 AM-4:00 AM. Application submissions remain available.
      </div>
    </section>
  );
}

function ServiceGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {serviceList.map((service) => (
        <article key={service.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{service.tag}</span>
          <h3 className="mt-3 text-lg font-bold text-slate-900">{service.name}</h3>
          <p className="mt-2 text-sm text-slate-600">{service.summary}</p>
          <a href={service.href} className="mt-4 inline-flex rounded-lg bg-government-700 px-4 py-2 text-sm font-semibold text-white hover:bg-government-800">
            View service
          </a>
        </article>
      ))}
    </div>
  );
}

function HomePage() {
  return (
    <>
      <Header active="home" />
      <AlertBanner />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-gradient-to-br from-government-700 to-government-600 px-6 py-10 text-white sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-government-100">Public Service Portal</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">Access essential services in one trusted place</h1>
          <p className="mt-4 max-w-2xl text-government-100">Apply online, track requests, and find clear guidance for everyday government tasks.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="services.html" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-government-800">Browse Services</a>
            <a href="contact.html" className="rounded-lg border border-white/50 px-5 py-3 text-sm font-semibold text-white">Get Help</a>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Top services</h2>
            <a href="services.html" className="text-sm font-semibold text-government-700">See all services</a>
          </div>
          <ServiceGrid />
        </section>
      </main>
      <Footer />
    </>
  );
}

function ServicesPage() {
  return (
    <>
      <Header active="services" />
      <AlertBanner />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section>
          <h1 className="text-3xl font-black text-slate-900">Services Overview</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Choose a service category to start an application, check requirements, and review response times.</p>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">Service Navigation</h2>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <a href="benefits.html" className="rounded-full bg-government-100 px-4 py-2 font-semibold text-government-800">Family Benefits</a>
            <a href="permits.html" className="rounded-full bg-government-100 px-4 py-2 font-semibold text-government-800">Permits and Licenses</a>
            <a href="contact.html" className="rounded-full bg-government-100 px-4 py-2 font-semibold text-government-800">Appointments</a>
          </div>
        </section>

        <section className="mt-8">
          <ServiceGrid />
        </section>
      </main>
      <Footer />
    </>
  );
}

function BenefitsPage() {
  return (
    <>
      <Header active="services" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold text-government-700">Service Detail</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Family Benefits</h1>
          <p className="mt-3 max-w-3xl text-slate-600">Submit one application for childcare credits, household food assistance, and emergency support grants.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="contact.html" className="rounded-lg bg-government-700 px-5 py-3 text-sm font-semibold text-white">Start application</a>
            <a href="services.html" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Back to services</a>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-bold text-slate-900">Eligibility</h2>
            <p className="mt-2 text-sm text-slate-600">Resident status, household income verification, and dependent records.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-bold text-slate-900">Typical Processing</h2>
            <p className="mt-2 text-sm text-slate-600">10-15 business days after complete document upload.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-bold text-slate-900">Required Documents</h2>
            <p className="mt-2 text-sm text-slate-600">ID, proof of address, recent income statement, and dependent certificates.</p>
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}

function PermitsPage() {
  return (
    <>
      <Header active="services" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold text-government-700">Service Detail</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Permits and Licenses</h1>
          <p className="mt-3 max-w-3xl text-slate-600">Apply for construction permits, vendor event permits, and local business operating licenses.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="contact.html" className="rounded-lg bg-government-700 px-5 py-3 text-sm font-semibold text-white">Start permit request</a>
            <a href="services.html" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Back to services</a>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-bold text-slate-900">Permit Types</h2>
            <p className="mt-2 text-sm text-slate-600">Building, temporary events, signage, and neighborhood development permits.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-bold text-slate-900">Review Timeline</h2>
            <p className="mt-2 text-sm text-slate-600">5-20 business days depending on inspection and zoning checks.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-bold text-slate-900">Submission Checklist</h2>
            <p className="mt-2 text-sm text-slate-600">Site plan, scope details, insurance certificate, and owner authorization form.</p>
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}

function AboutPage() {
  return (
    <>
      <Header active="about" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-slate-900">About the Portal</h1>
        <p className="mt-4 max-w-3xl text-slate-600">CivicConnect is a public service portal designed to make government interactions simple, transparent, and accessible across all communities.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="font-bold text-slate-900">Mission</h2>
            <p className="mt-2 text-sm text-slate-600">Deliver clear service pathways and reduce application complexity.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="font-bold text-slate-900">Accessibility</h2>
            <p className="mt-2 text-sm text-slate-600">Built with high-contrast UI, readable typography, and mobile-first layouts.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="font-bold text-slate-900">Trust</h2>
            <p className="mt-2 text-sm text-slate-600">Clear status updates and transparent processing timelines for every request.</p>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ContactPage() {
  return (
    <>
      <Header active="contact" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-slate-900">Contact and Appointments</h1>
        <p className="mt-4 max-w-2xl text-slate-600">Reach service teams by phone or request in-person support through your local center.</p>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-bold text-slate-900">Support Channels</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><span className="font-semibold text-slate-800">General support:</span> (800) 555-0142</li>
              <li><span className="font-semibold text-slate-800">Email:</span> help@civicconnect.gov</li>
              <li><span className="font-semibold text-slate-800">TTY:</span> (800) 555-0169</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-bold text-slate-900">Request Appointment</h2>
            <form className="mt-4 space-y-3">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-government-500 focus:ring" placeholder="Full name" />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-government-500 focus:ring" placeholder="Email" />
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-government-500 focus:ring">
                <option>Choose service</option>
                <option>Family Benefits</option>
                <option>Permits and Licenses</option>
                <option>General Inquiry</option>
              </select>
              <button type="button" className="w-full rounded-lg bg-government-700 px-4 py-2 text-sm font-semibold text-white">Submit request</button>
            </form>
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}

const pages = {
  home: HomePage,
  services: ServicesPage,
  benefits: BenefitsPage,
  permits: PermitsPage,
  about: AboutPage,
  contact: ContactPage
};

const root = document.getElementById("root");
const page = root.dataset.page;
const Component = pages[page] || HomePage;

ReactDOM.createRoot(root).render(<Component />);
