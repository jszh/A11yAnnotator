const e = React.createElement;
const root = ReactDOM.createRoot(document.getElementById("root"));

const navItems = [
  { href: "index.html", label: "Home", key: "home" },
  { href: "services.html", label: "Services", key: "services" },
  { href: "license-renewal.html", label: "Driver's License", key: "license" },
  { href: "benefits.html", label: "Benefits", key: "benefits" },
  { href: "about.html", label: "About", key: "about" },
  { href: "contact.html", label: "Contact", key: "contact" },
];

const quickLinks = [
  { title: "Renew Driver's License", href: "license-renewal.html", detail: "Complete or schedule a renewal in about 10 minutes." },
  { title: "Apply for Benefits", href: "benefits.html", detail: "Screen for SNAP, Medicaid, and heating assistance." },
  { title: "Register to Vote", href: "services.html#families", detail: "Update registration and election information." },
  { title: "Find a School", href: "services.html#students", detail: "Browse public school districts, calendars, and contacts." },
];

const updates = [
  { department: "Department of Taxes", time: "Updated 2 hours ago", text: "Online filing support expanded for residents filing state and federal returns together." },
  { department: "Agency of Education", time: "Updated today", text: "Summer meal program sites published for all counties beginning June 10." },
  { department: "Department of Health", time: "Updated yesterday", text: "Mobile vaccination clinics added in Rutland and St. Albans this week." },
];

const stages = [
  {
    id: "new-residents",
    title: "New Residents",
    description: "Start local records, identification, and transportation services after a move.",
    services: [
      "Transfer vehicle registration - ~15 minutes online",
      "Establish residency records - ~8 minutes",
      "Update tax withholding profile - ~12 minutes",
    ],
  },
  {
    id: "families",
    title: "Families",
    description: "Access benefits, child care support, public health, and civic services.",
    services: [
      "Child care subsidy pre-check - ~7 minutes",
      "Register to vote - ~5 minutes",
      "Birth certificate request - ~10 minutes",
    ],
  },
  {
    id: "students",
    title: "Students",
    description: "Explore school systems, tuition support, and transit options for learners.",
    services: [
      "Find a school district - ~4 minutes",
      "Apply for tuition assistance - ~20 minutes",
      "Student transit pass - ~6 minutes",
    ],
  },
  {
    id: "seniors",
    title: "Seniors",
    description: "Locate health coverage, property tax relief, and heating support programs.",
    services: [
      "Medicare counseling request - ~5 minutes",
      "Property tax credit renewal - ~12 minutes",
      "Heating assistance check - ~8 minutes",
    ],
  },
  {
    id: "businesses",
    title: "Businesses",
    description: "Launch filings, permits, and employer services for Vermont employers.",
    services: [
      "Register a business - ~15 minutes",
      "Employer tax account setup - ~10 minutes",
      "Occupational permit renewal - ~9 minutes",
    ],
  },
];

function nav(active) {
  return navItems
    .map((item) => {
      const current = item.key === active;
      return `<a href="${item.href}" ${current ? 'aria-current="page"' : ""} class="rounded-full px-4 py-2 text-sm font-semibold ${current ? "bg-[color:var(--primary)] text-white" : "bg-[color:var(--surface-alt)] text-[color:var(--primary)] hover:bg-white"}">${item.label}</a>`;
    })
    .join("");
}

function shell(active, pageTitle, pageIntro, content) {
  return `
    <div class="portal-shell">
      <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-slate-900">Skip to main content</a>
      <header class="border-b border-[color:var(--border)] bg-white/90 backdrop-blur">
        <div class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:px-8">
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div class="flex items-start gap-3">
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--primary)] text-lg font-bold text-white" aria-hidden="true">VT</div>
              <div>
                <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--primary)]">State of Vermont</p>
                <p class="font-display text-2xl font-bold text-[color:var(--ink)]">Official Resident Services Portal</p>
                <p class="text-sm text-[color:var(--muted)]">Trusted online services for residents, families, and businesses</p>
              </div>
            </div>
            <div class="flex items-center gap-2 self-start rounded-full border border-[color:var(--border)] bg-[color:var(--surface-alt)] p-1" aria-label="Language selector">
              <button class="rounded-full bg-[color:var(--primary)] px-3 py-2 text-sm font-semibold text-white" aria-pressed="true">EN</button>
              <button class="rounded-full px-3 py-2 text-sm font-semibold text-[color:var(--primary)] hover:bg-white" aria-pressed="false">ES</button>
              <button class="rounded-full px-3 py-2 text-sm font-semibold text-[color:var(--primary)] hover:bg-white" aria-pressed="false">FR</button>
            </div>
          </div>
          <nav aria-label="Primary" class="flex flex-wrap gap-2">${nav(active)}</nav>
        </div>
      </header>
      <main id="main-content" class="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <section class="mb-8 rounded-[2rem] border border-[color:var(--border)] bg-white/75 px-6 py-8 shadow-sm">
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--primary)]">Resident Portal</p>
          <div class="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 class="font-display text-4xl font-bold text-[color:var(--ink)]">${pageTitle}</h1>
              <p class="mt-2 max-w-3xl text-lg text-[color:var(--muted)]">${pageIntro}</p>
            </div>
            <div class="rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3 text-sm text-[color:var(--muted)]">Online support hours: Mon-Fri, 8:00 AM to 5:00 PM</div>
          </div>
        </section>
        ${content}
      </main>
      <footer class="border-t border-[color:var(--border)] bg-[color:var(--primary-dark)] text-slate-100">
        <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr_0.9fr] lg:px-8">
          <div>
            <p class="font-display text-2xl font-bold">Public services that are easier to use</p>
            <p class="mt-3 max-w-md text-sm text-slate-200">This portal mockup demonstrates accessible, task-oriented state services for Vermont residents.</p>
          </div>
          <div>
            <h2 class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Resident Services</h2>
            <ul class="mt-3 space-y-2 text-sm">
              <li><a href="services.html" class="hover:text-white">Browse service categories</a></li>
              <li><a href="license-renewal.html" class="hover:text-white">Renew a driver's license</a></li>
              <li><a href="benefits.html" class="hover:text-white">Check benefit eligibility</a></li>
            </ul>
          </div>
          <div>
            <h2 class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Help</h2>
            <ul class="mt-3 space-y-2 text-sm">
              <li><a href="about.html" class="hover:text-white">Transparency and accessibility</a></li>
              <li><a href="contact.html" class="hover:text-white">Contact a representative</a></li>
              <li><a href="contact.html#feedback-form" class="hover:text-white">Submit site feedback</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  `;
}

function homePage() {
  const links = quickLinks.map((link) => `
    <a href="${link.href}" class="quick-link rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-alt)] p-5">
      <h3 class="text-xl font-bold text-[color:var(--ink)]">${link.title}</h3>
      <p class="mt-2 text-sm text-[color:var(--muted)]">${link.detail}</p>
      <span class="mt-4 inline-flex text-sm font-semibold text-[color:var(--primary)]">Open task</span>
    </a>
  `).join("");
  const feed = updates.map((item) => `
    <li class="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-alt)] p-4">
      <p class="text-sm font-semibold text-[color:var(--primary)]">${item.department}</p>
      <p class="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">${item.time}</p>
      <p class="mt-2 text-sm text-[color:var(--ink)]">${item.text}</p>
    </li>
  `).join("");
  return shell(
    "home",
    "Find resident services, deadlines, and updates in one place",
    "Use the official Vermont resident portal to complete common tasks quickly, understand what information you need, and track updates from state departments.",
    `
      <div class="page-grid">
        <section class="space-y-6">
          <div class="panel rounded-[2rem] p-6">
            <div class="rounded-[1.5rem] border border-amber-300 bg-amber-50 p-5" role="alert" aria-live="polite">
              <p class="text-sm font-semibold uppercase tracking-[0.18em] text-amber-900">Seasonal reminder</p>
              <div class="mt-2 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 class="font-display text-2xl font-bold text-amber-950">Tax Filing Deadline: April 15 - File Online Now</h2>
                  <p class="mt-1 text-sm text-amber-900">Residents can securely start state and federal filing from one account.</p>
                </div>
                <a href="services.html#families" class="rounded-full bg-amber-700 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-800">Start tax services</a>
              </div>
            </div>
            <div class="hero-search mt-6 rounded-[1.75rem] p-6 text-white">
              <p class="text-sm font-semibold uppercase tracking-[0.22em] text-teal-100">What Do You Need Today?</p>
              <form class="mt-4" role="search" aria-label="Search resident services">
                <label for="portal-search" class="sr-only">Search the resident portal</label>
                <div class="flex flex-col gap-3 md:flex-row">
                  <input id="portal-search" type="search" placeholder="Search by service, department, or program" class="min-h-[56px] flex-1 rounded-2xl border border-white/30 bg-white/95 px-4 text-[color:var(--ink)] placeholder:text-slate-500" />
                  <button type="submit" class="min-h-[56px] rounded-2xl bg-[color:var(--accent)] px-6 font-semibold text-slate-950 hover:bg-amber-300">Search services</button>
                </div>
              </form>
            </div>
          </div>
          <section aria-labelledby="quick-links-title" class="panel rounded-[2rem] p-6">
            <div class="flex items-center justify-between gap-3">
              <h2 id="quick-links-title" class="font-display text-2xl font-bold">Popular tasks</h2>
              <a href="services.html" class="text-sm font-semibold text-[color:var(--primary)] hover:underline">View all services</a>
            </div>
            <div class="mt-5 grid gap-4 md:grid-cols-2">${links}</div>
          </section>
        </section>
        <aside class="space-y-6" aria-label="Latest information">
          <section class="panel rounded-[2rem] p-6">
            <h2 class="font-display text-2xl font-bold">Live updates feed</h2>
            <ul class="mt-5 space-y-4">${feed}</ul>
          </section>
          <section class="panel rounded-[2rem] p-6">
            <h2 class="font-display text-2xl font-bold">Accessibility and language</h2>
            <p class="mt-3 text-sm text-[color:var(--muted)]">All portal actions are keyboard accessible and support screen readers. Language support is available in English, Spanish, and French.</p>
            <a href="contact.html" class="mt-5 inline-flex rounded-full bg-[color:var(--primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[color:var(--primary-dark)]">Request language help</a>
          </section>
        </aside>
      </div>
    `
  );
}

function servicesPage() {
  const cards = stages.map((stage) => {
    const target = stage.title === "Families" || stage.title === "Seniors" ? "benefits.html" : "license-renewal.html";
    return `
      <article id="${stage.id}" class="service-card panel rounded-[2rem] p-6">
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">${stage.title}</p>
        <p class="mt-3 text-sm text-[color:var(--muted)]">${stage.description}</p>
        <ul class="mt-5 space-y-3">${stage.services.map((service) => `<li class="rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3 text-sm text-[color:var(--ink)]">${service}</li>`).join("")}</ul>
        <div class="mt-6 flex gap-3">
          <a href="${target}" class="rounded-full bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--primary-dark)]">Open related service</a>
          <a href="contact.html" class="rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-[color:var(--primary)] hover:bg-white">Ask for help</a>
        </div>
      </article>
    `;
  }).join("");
  return shell(
    "services",
    "Services organized around life events and resident needs",
    "Browse common tasks by life stage to quickly find the right online service, estimate how long it will take, and move into the next step with confidence.",
    `<section aria-label="Resident service categories" class="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">${cards}</section>`
  );
}

function licensePage() {
  const dates = ["12", "13", "14", "15", "16", "17", "18"];
  return shell(
    "license",
    "Renew a driver's license",
    "Review eligibility, gather the correct documents, check your fee, and reserve an appointment time if an in-person step is required.",
    `
      <div class="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section class="space-y-6">
          <article class="panel rounded-[2rem] p-6">
            <div class="flex flex-wrap gap-3" aria-label="Renewal progress">
              <div class="rounded-full bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white">1. Eligibility</div>
              <div class="rounded-full bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white">2. Documents</div>
              <div class="rounded-full bg-[color:var(--surface-alt)] px-4 py-2 text-sm font-semibold text-[color:var(--muted)]">3. Fee</div>
              <div class="rounded-full bg-[color:var(--surface-alt)] px-4 py-2 text-sm font-semibold text-[color:var(--muted)]">4. Schedule</div>
              <div class="rounded-full bg-[color:var(--surface-alt)] px-4 py-2 text-sm font-semibold text-[color:var(--muted)]">5. Confirm</div>
            </div>
            <h2 class="mt-6 font-display text-2xl font-bold">Eligibility checker</h2>
            <form class="mt-4 grid gap-4 md:grid-cols-2">
              <label class="text-sm font-semibold text-[color:var(--ink)]">Current license status
                <select class="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-base font-normal">
                  <option>Valid and not expired</option>
                  <option>Expired less than 12 months</option>
                  <option>Expired more than 12 months</option>
                </select>
              </label>
              <label class="text-sm font-semibold text-[color:var(--ink)]">Vermont residency confirmed?
                <select class="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-base font-normal">
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </label>
              <label class="text-sm font-semibold text-[color:var(--ink)]">Vision information updated in the last 2 years?
                <select class="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-base font-normal">
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </label>
              <label class="text-sm font-semibold text-[color:var(--ink)]">Mailing address
                <input type="text" value="128 Maple Lane, Montpelier, VT" class="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-base font-normal" />
              </label>
            </form>
            <div class="mt-5 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">You appear eligible to renew online. If your photo or vision record has changed, schedule an appointment below.</div>
          </article>
          <article class="panel rounded-[2rem] p-6">
            <h2 class="font-display text-2xl font-bold">Required documents checklist</h2>
            <ul class="mt-4 space-y-3">
              <li class="flex items-start gap-3 rounded-2xl bg-[color:var(--surface-alt)] p-4"><input type="checkbox" aria-label="Current driver's license or license number" class="mt-1 h-5 w-5 rounded border-[color:var(--border)]" /><span class="text-sm text-[color:var(--ink)]">Current driver's license or license number</span></li>
              <li class="flex items-start gap-3 rounded-2xl bg-[color:var(--surface-alt)] p-4"><input type="checkbox" aria-label="Two proofs of Vermont residency" class="mt-1 h-5 w-5 rounded border-[color:var(--border)]" /><span class="text-sm text-[color:var(--ink)]">Two proofs of Vermont residency</span></li>
              <li class="flex items-start gap-3 rounded-2xl bg-[color:var(--surface-alt)] p-4"><input type="checkbox" aria-label="Vision certification, if requested" class="mt-1 h-5 w-5 rounded border-[color:var(--border)]" /><span class="text-sm text-[color:var(--ink)]">Vision certification, if requested</span></li>
              <li class="flex items-start gap-3 rounded-2xl bg-[color:var(--surface-alt)] p-4"><input type="checkbox" aria-label="Email address for your confirmation receipt" class="mt-1 h-5 w-5 rounded border-[color:var(--border)]" /><span class="text-sm text-[color:var(--ink)]">Email address for your confirmation receipt</span></li>
            </ul>
          </article>
        </section>
        <aside class="space-y-6">
          <article class="panel rounded-[2rem] p-6">
            <h2 class="font-display text-2xl font-bold">Fee breakdown</h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex items-center justify-between rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3"><dt>Renewal fee</dt><dd class="font-semibold">$35.00</dd></div>
              <div class="flex items-center justify-between rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3"><dt>Online processing</dt><dd class="font-semibold">$0.00</dd></div>
              <div class="flex items-center justify-between rounded-2xl bg-[color:var(--primary)] px-4 py-3 text-white"><dt>Total due</dt><dd class="font-semibold">$35.00</dd></div>
            </dl>
          </article>
          <article class="panel rounded-[2rem] p-6">
            <h2 class="font-display text-2xl font-bold">Appointment scheduler</h2>
            <p class="mt-3 text-sm text-[color:var(--muted)]">Select a preferred date for DMV assistance if your renewal needs an in-person step.</p>
            <div class="calendar-grid mt-4" role="grid" aria-label="Available appointment dates">
              <div class="text-center text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">Mon</div>
              <div class="text-center text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">Tue</div>
              <div class="text-center text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">Wed</div>
              <div class="text-center text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">Thu</div>
              <div class="text-center text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">Fri</div>
              <div class="text-center text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">Sat</div>
              <div class="text-center text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">Sun</div>
              ${dates.map((date, idx) => `<button class="min-h-[52px] rounded-2xl border ${idx === 2 ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-white" : "border-[color:var(--border)] bg-[color:var(--surface-alt)] text-[color:var(--ink)] hover:bg-white"}">May ${date}</button>`).join("")}
            </div>
          </article>
          <article class="panel rounded-[2rem] p-6">
            <h2 class="font-display text-2xl font-bold">Confirmation summary</h2>
            <p class="mt-3 text-sm text-[color:var(--muted)]">A confirmation email will be sent to <strong>resident@example.gov</strong> with your payment receipt, appointment time, and next steps.</p>
            <button class="mt-5 w-full rounded-2xl bg-[color:var(--accent)] px-5 py-4 text-sm font-semibold text-slate-950 hover:bg-amber-300">Continue to secure payment</button>
          </article>
        </aside>
      </div>
    `
  );
}

function benefitsPage() {
  return shell(
    "benefits",
    "Check eligibility and apply for benefits",
    "Complete a short screener to see which support programs may fit your household, then move directly into the application process for each qualifying program.",
    `
      <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section class="panel rounded-[2rem] p-6">
          <h2 class="font-display text-2xl font-bold">Benefit eligibility screener</h2>
          <form class="mt-5 space-y-4" aria-label="Benefits eligibility form">
            <label class="block text-sm font-semibold text-[color:var(--ink)]">Household size
              <select class="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-base font-normal">
                <option>1 person</option>
                <option>2 people</option>
                <option>3 people</option>
                <option>4 or more people</option>
              </select>
            </label>
            <label class="block text-sm font-semibold text-[color:var(--ink)]">Monthly income range
              <select class="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-base font-normal">
                <option>Under $1,500</option>
                <option>$1,500 to $2,999</option>
                <option>$3,000 to $4,999</option>
                <option>$5,000+</option>
              </select>
            </label>
            <fieldset class="rounded-[1.5rem] border border-[color:var(--border)] p-4">
              <legend class="px-2 text-sm font-semibold text-[color:var(--ink)]">Employment status</legend>
              <div class="mt-3 space-y-3 text-sm text-[color:var(--ink)]">
                <label class="flex items-center gap-3"><input name="employment" type="radio" /><span>Employed full-time</span></label>
                <label class="flex items-center gap-3"><input name="employment" type="radio" checked /><span>Employed part-time</span></label>
                <label class="flex items-center gap-3"><input name="employment" type="radio" /><span>Unemployed</span></label>
                <label class="flex items-center gap-3"><input name="employment" type="radio" /><span>Retired or disabled</span></label>
              </div>
            </fieldset>
            <button type="button" class="w-full rounded-2xl bg-[color:var(--primary)] px-5 py-4 text-sm font-semibold text-white hover:bg-[color:var(--primary-dark)]">View estimated matches</button>
          </form>
        </section>
        <section class="space-y-6">
          <article class="panel rounded-[2rem] p-6">
            <h2 class="font-display text-2xl font-bold">Estimated qualifying programs</h2>
            <p class="mt-3 text-sm text-[color:var(--muted)]">Based on the sample responses shown, this resident may qualify for the following programs.</p>
            <div class="mt-5 space-y-4">
              <article class="program-card rounded-[1.5rem] border border-[color:var(--border)] bg-white p-5 shadow-sm">
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div><h3 class="text-xl font-bold text-[color:var(--ink)]">SNAP</h3><p class="mt-2 text-sm text-[color:var(--muted)]">Monthly food assistance for income-qualified households.</p></div>
                  <button class="rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300">Start SNAP application</button>
                </div>
              </article>
              <article class="program-card rounded-[1.5rem] border border-[color:var(--border)] bg-white p-5 shadow-sm">
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div><h3 class="text-xl font-bold text-[color:var(--ink)]">Medicaid</h3><p class="mt-2 text-sm text-[color:var(--muted)]">Health coverage options for adults, children, and eligible family members.</p></div>
                  <button class="rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300">Start Medicaid application</button>
                </div>
              </article>
              <article class="program-card rounded-[1.5rem] border border-[color:var(--border)] bg-white p-5 shadow-sm">
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div><h3 class="text-xl font-bold text-[color:var(--ink)]">Heating Assistance</h3><p class="mt-2 text-sm text-[color:var(--muted)]">Seasonal support for winter heating costs and fuel emergencies.</p></div>
                  <button class="rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300">Start heating assistance application</button>
                </div>
              </article>
            </div>
          </article>
          <article class="panel rounded-[2rem] p-6">
            <h2 class="font-display text-2xl font-bold">Next steps</h2>
            <ol class="mt-4 space-y-3 text-sm text-[color:var(--ink)]">
              <li class="rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3">1. Review program details and gather proof of income, residency, and household members.</li>
              <li class="rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3">2. Start an application for each program you want to pursue.</li>
              <li class="rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3">3. Save your application ID to continue later or speak with a representative.</li>
            </ol>
          </article>
        </section>
      </div>
    `
  );
}

function aboutPage() {
  return shell(
    "about",
    "About Vermont resident services",
    "Learn how state agencies coordinate digital services, publish public information, and maintain accessibility standards across resident-facing systems.",
    `
      <div class="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article class="panel rounded-[2rem] p-6">
          <div class="flex flex-col gap-5 md:flex-row">
            <img src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='360' viewBox='0 0 360 360'%3E%3Crect width='360' height='360' rx='40' fill='%23184e59'/%3E%3Ccircle cx='180' cy='130' r='62' fill='%23f2d3b0'/%3E%3Cpath d='M88 294c24-54 70-82 92-82s68 28 92 82' fill='%23d9e5e4'/%3E%3Cpath d='M118 110c14-42 112-52 128 8-10-14-32-24-65-24-29 0-49 6-63 16z' fill='%230f3840'/%3E%3C/svg%3E" alt="Illustrated portrait representing the governor's welcome message" class="h-52 w-52 rounded-[2rem] object-cover" />
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">Governor's message</p>
              <h2 class="mt-2 font-display text-2xl font-bold">Welcome to Vermont's online resident services</h2>
              <p class="mt-3 text-sm text-[color:var(--muted)]">We are committed to delivering clear, secure, and accessible public services that save residents time and make government easier to navigate.</p>
            </div>
          </div>
        </article>
        <article class="panel rounded-[2rem] p-6">
          <h2 class="font-display text-2xl font-bold">State agency directory</h2>
          <div class="mt-5 grid gap-3">
            <div class="department-card rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)]">Department of Motor Vehicles</div>
            <div class="department-card rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)]">Department for Children and Families</div>
            <div class="department-card rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)]">Department of Health</div>
            <div class="department-card rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)]">Agency of Education</div>
            <div class="department-card rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)]">Agency of Digital Services</div>
          </div>
        </article>
        <article class="panel rounded-[2rem] p-6">
          <h2 class="font-display text-2xl font-bold">Open data and transparency reports</h2>
          <ul class="mt-4 space-y-3 text-sm">
            <li class="rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3">Quarterly digital service performance dashboard</li>
            <li class="rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3">Annual accessibility compliance report</li>
            <li class="rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3">State spending and procurement open datasets</li>
          </ul>
        </article>
        <article class="panel rounded-[2rem] p-6">
          <h2 class="font-display text-2xl font-bold">Legislative news and accessibility statement</h2>
          <p class="mt-3 text-sm text-[color:var(--muted)]">Recent legislative updates include expanded digital identity verification, clearer data privacy notices, and additional translation support for resident portals.</p>
          <div class="mt-4 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Accessibility compliance statement: This portal mockup is designed to meet WCAG AA contrast requirements, support keyboard-only navigation, and expose clear semantic structure to assistive technology.</div>
        </article>
      </div>
    `
  );
}

function contactPage() {
  return shell(
    "contact",
    "Contact state departments and improve the resident portal",
    "Use chat, department helplines, or the feedback form below to get assistance, report an issue, or suggest an improvement for the website experience.",
    `
      <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section class="space-y-6">
          <article class="panel rounded-[2rem] p-6">
            <h2 class="font-display text-2xl font-bold">Live support</h2>
            <div class="mt-4 rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-alt)] p-5">
              <p class="text-lg font-semibold text-[color:var(--ink)]">Chat with a representative</p>
              <p class="mt-2 text-sm text-[color:var(--muted)]">Mon-Fri 8am-5pm</p>
              <button class="mt-4 rounded-full bg-[color:var(--primary)] px-4 py-3 text-sm font-semibold text-white hover:bg-[color:var(--primary-dark)]">Start secure chat</button>
            </div>
            <div class="mt-4 rounded-[1.5rem] border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">Multilingual support is available for all resident service lines in English, Spanish, and French.</div>
          </article>
          <article class="panel rounded-[2rem] p-6">
            <h2 class="font-display text-2xl font-bold">Helplines by department</h2>
            <ul class="mt-4 space-y-3 text-sm">
              <li class="rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3"><strong>DMV:</strong> 802-555-0140</li>
              <li class="rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3"><strong>Benefits and Family Services:</strong> 802-555-0199</li>
              <li class="rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3"><strong>Health Programs:</strong> 802-555-0112</li>
              <li class="rounded-2xl bg-[color:var(--surface-alt)] px-4 py-3"><strong>Education Support:</strong> 802-555-0175</li>
            </ul>
          </article>
        </section>
        <section id="feedback-form" class="panel rounded-[2rem] p-6">
          <h2 class="font-display text-2xl font-bold">Website improvement feedback</h2>
          <form class="mt-5 grid gap-4">
            <label class="text-sm font-semibold text-[color:var(--ink)]">Name<input type="text" class="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-base font-normal" /></label>
            <label class="text-sm font-semibold text-[color:var(--ink)]">Email address<input type="email" class="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-base font-normal" /></label>
            <label class="text-sm font-semibold text-[color:var(--ink)]">Topic
              <select class="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-base font-normal">
                <option>Accessibility suggestion</option>
                <option>Navigation issue</option>
                <option>Content clarity</option>
                <option>General feedback</option>
              </select>
            </label>
            <label class="text-sm font-semibold text-[color:var(--ink)]">Suggestion<textarea rows="6" class="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-base font-normal" placeholder="Tell us what would make this portal easier to use."></textarea></label>
            <button type="submit" class="rounded-2xl bg-[color:var(--accent)] px-5 py-4 text-sm font-semibold text-slate-950 hover:bg-amber-300">Send feedback</button>
          </form>
        </section>
      </div>
    `
  );
}

const pageMap = {
  home: homePage,
  services: servicesPage,
  license: licensePage,
  benefits: benefitsPage,
  about: aboutPage,
  contact: contactPage,
};

function PortalApp() {
  const key = document.body.dataset.page || "home";
  const html = (pageMap[key] || homePage)();
  return e("div", { dangerouslySetInnerHTML: { __html: html } });
}

root.render(e(PortalApp));
