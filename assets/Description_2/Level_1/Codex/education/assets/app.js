const { useEffect, useMemo, useState } = React;
const h = React.createElement;
const root = ReactDOM.createRoot(document.getElementById("root"));
const currentPage = window.SKILLFORGE_PAGE || "home";

const primaryNav = [
  { key: "home", label: "Home", href: "./index.html" },
  { key: "courses", label: "Programs", href: "./courses.html" },
  { key: "learning", label: "Classroom", href: "./learning.html" },
  { key: "pricing", label: "Pricing", href: "./pricing.html" },
  { key: "dashboard", label: "Dashboard", href: "./dashboard.html" },
];

const secondaryNav = [
  { label: "Career Quiz", href: "./index.html#find-path" },
  { label: "Funding Options", href: "./pricing.html#financing" },
  { label: "Live Cohorts", href: "./courses.html#live-cohorts" },
  { label: "Advisor Chat", href: "./pricing.html#advisor-chat" },
];

function cx() {
  return Array.from(arguments).filter(Boolean).join(" ");
}

function icon(name, className) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24",
    className: className || "h-5 w-5",
    "aria-hidden": "true",
  };
  if (name === "arrow") return h("svg", common, h("path", { d: "M5 12h14" }), h("path", { d: "m13 5 7 7-7 7" }));
  if (name === "check") return h("svg", common, h("path", { d: "m5 13 4 4L19 7" }));
  if (name === "clock") return h("svg", common, h("circle", { cx: "12", cy: "12", r: "9" }), h("path", { d: "M12 7v5l3 2" }));
  if (name === "book") return h("svg", common, h("path", { d: "M4 6.5A2.5 2.5 0 0 1 6.5 4H20v15.5A1.5 1.5 0 0 0 18.5 18H6.5A2.5 2.5 0 0 0 4 20.5z" }), h("path", { d: "M8 8h8" }), h("path", { d: "M8 12h8" }));
  return h("svg", common, h("circle", { cx: "12", cy: "12", r: "9" }));
}

function htmlBlock(markup, className) {
  return h("div", { className, dangerouslySetInnerHTML: { __html: markup } });
}

function header() {
  return h(
    "header",
    { className: "sticky top-0 z-40 border-b border-white/70 bg-slate-50/90 backdrop-blur" },
    h(
      "div",
      { className: "mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8" },
      h(
        "div",
        { className: "flex flex-col gap-4" },
        h(
          "div",
          { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" },
          h(
            "div",
            { className: "flex items-center justify-between gap-4" },
            h(
              "a",
              { href: "./index.html", className: "focus-ring inline-flex items-center gap-3 rounded-2xl" },
              h("div", { className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--sf-navy)] text-lg font-bold text-white" }, "SF"),
              h(
                "div",
                null,
                h("p", { className: "font-display text-xl font-bold text-[var(--sf-navy)]" }, "SkillForge"),
                h("p", { className: "text-sm text-slate-600" }, "Career certificates for adult learners")
              )
            ),
            h("a", { href: "./pricing.html#advisor-chat", className: "focus-ring inline-flex rounded-full border border-[var(--sf-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--sf-navy)] lg:hidden" }, "Talk to Advisor")
          ),
          h(
            "div",
            { className: "flex flex-wrap items-center gap-3" },
            h(
              "label",
              { htmlFor: "site-search", className: "relative min-w-[220px] flex-1" },
              h("span", { className: "sr-only" }, "Search programs"),
              h("input", {
                id: "site-search",
                type: "search",
                placeholder: "Search programs, credentials, or careers",
                className: "focus-ring h-11 w-full rounded-full border border-[var(--sf-border)] bg-white px-4 text-sm text-slate-900 placeholder:text-slate-500",
              })
            ),
            h("a", { href: "./dashboard.html", className: "focus-ring rounded-full border border-[var(--sf-border)] px-4 py-2 text-sm font-semibold text-[var(--sf-navy)]" }, "Sign In"),
            h("a", { href: "./pricing.html", className: "focus-ring rounded-full bg-[var(--sf-blue)] px-5 py-2.5 text-sm font-semibold text-white" }, "Try Free")
          )
        ),
        h(
          "nav",
          { "aria-label": "Primary", className: "flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between" },
          h(
            "div",
            { className: "flex flex-wrap gap-2" },
            primaryNav.map((item) =>
              h(
                "a",
                {
                  key: item.key,
                  href: item.href,
                  "aria-current": item.key === currentPage ? "page" : undefined,
                  className: cx("focus-ring rounded-full px-4 py-2 text-sm font-semibold transition", item.key === currentPage ? "nav-active" : "border border-[var(--sf-border)] bg-white text-slate-700 hover:border-blue-200 hover:text-[var(--sf-blue)]"),
                },
                item.label
              )
            )
          ),
          h(
            "div",
            { className: "flex flex-wrap gap-2" },
            secondaryNav.map((item) =>
              h("a", { key: item.label, href: item.href, className: "focus-ring rounded-full bg-[var(--sf-sky)] px-3 py-2 text-sm font-medium text-[var(--sf-navy)] hover:bg-white" }, item.label)
            )
          )
        )
      )
    )
  );
}

function footer() {
  return h(
    "footer",
    { className: "mt-16 border-t border-[var(--sf-border)] bg-white/80" },
    h(
      "div",
      { className: "mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] lg:px-8" },
      h("div", null, h("p", { className: "font-display text-2xl font-bold text-[var(--sf-navy)]" }, "SkillForge"), h("p", { className: "mt-3 max-w-md text-sm leading-7 text-slate-600" }, "Stackable certificates, live cohorts, and career coaching built for working adults ready to pivot into higher-opportunity roles.")),
      htmlBlock('<h2 class="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Explore</h2><ul class="mt-4 space-y-3 text-sm"><li><a class="focus-ring text-slate-700 hover:text-[var(--sf-blue)]" href="./courses.html">Programs</a></li><li><a class="focus-ring text-slate-700 hover:text-[var(--sf-blue)]" href="./learning.html">Learning Tools</a></li><li><a class="focus-ring text-slate-700 hover:text-[var(--sf-blue)]" href="./pricing.html">Tuition &amp; Aid</a></li></ul>'),
      htmlBlock('<h2 class="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Support</h2><ul class="mt-4 space-y-3 text-sm"><li><a class="focus-ring text-slate-700 hover:text-[var(--sf-blue)]" href="./course-detail.html">Program Details</a></li><li><a class="focus-ring text-slate-700 hover:text-[var(--sf-blue)]" href="./dashboard.html">Student Dashboard</a></li><li><a class="focus-ring text-slate-700 hover:text-[var(--sf-blue)]" href="./pricing.html#advisor-chat">Advisor Chat</a></li></ul>'),
      htmlBlock('<h2 class="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Trust</h2><div class="mt-4 space-y-3 text-sm text-slate-700"><p>Accreditation-aligned curricula</p><p>Employer-reviewed competency maps</p><p>Accessibility-first course delivery</p></div>')
    )
  );
}

function pageHeader(props) {
  return h(
    "section",
    { className: "surface-panel soft-shadow rounded-[2rem] border border-white/70 px-5 py-6 sm:px-8" },
    props.breadcrumbs
      ? h(
          "nav",
          { "aria-label": "Breadcrumb", className: "mb-4 text-sm text-slate-500" },
          h(
            "ol",
            { className: "flex flex-wrap items-center gap-2" },
            props.breadcrumbs.map((crumb, index) =>
              h(
                "li",
                { key: crumb.label, className: "flex items-center gap-2" },
                index > 0 ? h("span", { "aria-hidden": "true" }, "/") : null,
                h("a", { href: crumb.href, className: "focus-ring rounded-md hover:text-[var(--sf-blue)]" }, crumb.label)
              )
            )
          )
        )
      : null,
    h(
      "div",
      { className: "flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between" },
      h("div", { className: "max-w-3xl" }, h("p", { className: "text-sm font-bold uppercase tracking-[0.2em] text-[var(--sf-blue)]" }, props.eyebrow), h("h1", { className: "font-display mt-3 text-4xl font-bold text-[var(--sf-navy)] sm:text-5xl" }, props.title), h("p", { className: "mt-4 text-base leading-8 text-slate-600" }, props.intro)),
      props.actions ? h("div", { className: "flex flex-wrap gap-3" }, props.actions) : null
    ),
    props.tabs
      ? h(
          "nav",
          { "aria-label": "Section", className: "mt-6 flex flex-wrap gap-2" },
          props.tabs.map((tab) =>
            h("a", { key: tab.label, href: tab.href, className: cx("focus-ring rounded-full border px-4 py-2 text-sm font-semibold", tab.active ? "subnav-active" : "border-[var(--sf-border)] bg-slate-50 text-slate-600 hover:bg-white") }, tab.label)
          )
        )
      : null
  );
}

function homePage() {
  return h(
    "main",
    { id: "main-content", className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" },
    htmlBlock(`
      <section class="hero-grid soft-shadow overflow-hidden rounded-[2rem] px-6 py-8 text-white sm:px-10 lg:px-12 lg:py-12">
        <div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.22em] text-blue-100">Career-ready certificates</p>
            <h1 class="font-display mt-4 max-w-3xl text-5xl font-bold leading-tight sm:text-6xl">Your Next Career Starts Here</h1>
            <p class="mt-5 max-w-2xl text-lg leading-8 text-blue-50">Earn industry-recognized certificates in as little as 8 weeks through instructor-led cohorts and self-paced pathways built for working adults.</p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a href="./courses.html" class="focus-ring inline-flex items-center gap-2 rounded-full bg-[var(--sf-gold)] px-6 py-3 text-base font-bold text-[var(--sf-navy)]">Start Learning</a>
              <a href="#find-path" class="focus-ring inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-base font-semibold text-white">Find Your Path</a>
              <a href="./pricing.html" class="focus-ring inline-flex rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white">Sign Up</a>
            </div>
            <div class="warning-pill mt-8 inline-flex rounded-full px-4 py-2 text-sm font-bold text-amber-900">Cohort starting March 3 - 4 seats left</div>
            <div class="mt-8 grid gap-4 sm:grid-cols-3">
              <div class="rounded-[1.5rem] bg-white/10 p-4"><p class="text-sm text-blue-100">Job placement support</p><p class="mt-2 text-2xl font-bold">92%</p></div>
              <div class="rounded-[1.5rem] bg-white/10 p-4"><p class="text-sm text-blue-100">Average weekly study time</p><p class="mt-2 text-2xl font-bold">8-10 hrs</p></div>
              <div class="rounded-[1.5rem] bg-white/10 p-4"><p class="text-sm text-blue-100">Employer partners</p><p class="mt-2 text-2xl font-bold">120+</p></div>
            </div>
          </div>
          <aside class="surface-panel rounded-[1.75rem] border border-white/10 p-6 text-[var(--sf-ink)]">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--sf-blue)]">Live advisor queue</p>
                <h2 class="mt-2 text-2xl font-bold text-[var(--sf-navy)]">Compare pathways in 3 minutes</h2>
              </div>
              <div class="status-pill rounded-full px-3 py-1 text-sm font-bold text-emerald-900">12 advisors online</div>
            </div>
            <form id="find-path" class="mt-6 space-y-4" aria-label="Find your path quiz">
              <div><label for="goal" class="mb-2 block text-sm font-semibold text-slate-700">Career goal</label><select id="goal" class="focus-ring h-12 w-full rounded-2xl border border-[var(--sf-border)] bg-white px-4 text-sm"><option>Move into healthcare support</option><option>Start in IT support</option><option>Upskill for office administration</option><option>Explore trade certifications</option></select></div>
              <div><label for="availability" class="mb-2 block text-sm font-semibold text-slate-700">Weekly availability</label><select id="availability" class="focus-ring h-12 w-full rounded-2xl border border-[var(--sf-border)] bg-white px-4 text-sm"><option>5-8 hours</option><option>8-12 hours</option><option>12+ hours</option></select></div>
              <div><label for="format" class="mb-2 block text-sm font-semibold text-slate-700">Preferred format</label><select id="format" class="focus-ring h-12 w-full rounded-2xl border border-[var(--sf-border)] bg-white px-4 text-sm"><option>Cohort with live instruction</option><option>Self-paced</option><option>Live online evenings</option></select></div>
              <button type="submit" class="focus-ring inline-flex w-full items-center justify-center rounded-full bg-[var(--sf-blue)] px-5 py-3 font-semibold text-white">Get My Recommended Path</button>
            </form>
          </aside>
        </div>
      </section>
      <section class="mt-8 surface-panel soft-shadow rounded-[2rem] border border-white/80 px-6 py-6 sm:px-8">
        <p class="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Trusted by hiring and training partners</p>
        <div class="mt-5 grid gap-4 sm:grid-cols-3">
          <div class="rounded-[1.5rem] border border-[var(--sf-border)] bg-white px-5 py-5 text-center text-xl font-bold text-slate-700">Google</div>
          <div class="rounded-[1.5rem] border border-[var(--sf-border)] bg-white px-5 py-5 text-center text-xl font-bold text-slate-700">Mayo Clinic</div>
          <div class="rounded-[1.5rem] border border-[var(--sf-border)] bg-white px-5 py-5 text-center text-xl font-bold text-slate-700">Deloitte</div>
        </div>
      </section>
      <section class="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div class="space-y-5">
          <div class="metric-card soft-shadow rounded-[2rem] border border-white/80 p-6">
            <p class="text-sm font-bold uppercase tracking-[0.2em] text-[var(--sf-blue)]">Learning discovery</p>
            <h2 class="font-display mt-3 text-3xl font-bold text-[var(--sf-navy)]">Clear pathways for busy adults</h2>
            <div class="mt-5 space-y-4">
              <div class="flex items-start gap-3 rounded-[1.25rem] bg-white p-4"><div class="mt-1 rounded-full bg-[var(--sf-mint)] p-2 text-emerald-800">✓</div><p class="text-sm leading-7 text-slate-700">Browse by career field, format, duration, and credential type.</p></div>
              <div class="flex items-start gap-3 rounded-[1.25rem] bg-white p-4"><div class="mt-1 rounded-full bg-[var(--sf-mint)] p-2 text-emerald-800">✓</div><p class="text-sm leading-7 text-slate-700">See next cohort dates, tuition, and expected outcomes before you enroll.</p></div>
              <div class="flex items-start gap-3 rounded-[1.25rem] bg-white p-4"><div class="mt-1 rounded-full bg-[var(--sf-mint)] p-2 text-emerald-800">✓</div><p class="text-sm leading-7 text-slate-700">Move from discovery to application with guided advisor support.</p></div>
            </div>
          </div>
          <div class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6">
            <p class="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Popular tracks</p>
            <div class="mt-4 grid gap-4">
              <a href="./course-detail.html" class="focus-ring flex items-center justify-between gap-4 rounded-[1.5rem] border border-[var(--sf-border)] bg-white px-4 py-4 hover:border-blue-200"><div><p class="font-semibold text-[var(--sf-navy)]">Medical Administrative Assistant Certificate</p><p class="mt-1 text-sm text-slate-600">Cohort · 8 weeks · $349</p></div><span aria-hidden="true">→</span></a>
              <a href="./courses.html" class="focus-ring flex items-center justify-between gap-4 rounded-[1.5rem] border border-[var(--sf-border)] bg-white px-4 py-4 hover:border-blue-200"><div><p class="font-semibold text-[var(--sf-navy)]">IT Support Technician Track</p><p class="mt-1 text-sm text-slate-600">Live Online · 10 weeks · $499</p></div><span aria-hidden="true">→</span></a>
              <a href="./courses.html" class="focus-ring flex items-center justify-between gap-4 rounded-[1.5rem] border border-[var(--sf-border)] bg-white px-4 py-4 hover:border-blue-200"><div><p class="font-semibold text-[var(--sf-navy)]">Business Administration Foundations</p><p class="mt-1 text-sm text-slate-600">Self-Paced · 6 weeks · $199</p></div><span aria-hidden="true">→</span></a>
            </div>
          </div>
        </div>
        <section aria-labelledby="success-stories" class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6">
          <p class="text-sm font-bold uppercase tracking-[0.2em] text-[var(--sf-blue)]">Success Stories</p>
          <h2 id="success-stories" class="font-display mt-3 text-3xl font-bold text-[var(--sf-navy)]">Real learners, visible outcomes</h2>
          <div class="mt-6 grid gap-5 lg:grid-cols-3">
            <article class="overflow-hidden rounded-[1.75rem] bg-slate-900 text-white">
              <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80" alt="Portrait of adult learner Latoya Jenkins smiling in a bright office" class="h-56 w-full object-cover">
              <div class="p-5"><p class="text-sm uppercase tracking-[0.16em] text-blue-100">Latoya Jenkins</p><h3 class="mt-2 text-xl font-bold">Retail supervisor to medical admin specialist</h3><p class="mt-3 text-sm text-slate-200">$9/hr wage increase in 12 weeks</p></div>
            </article>
            <article class="overflow-hidden rounded-[1.75rem] bg-slate-900 text-white">
              <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80" alt="Portrait of Ethan Cruz in a casual work shirt seated near a laptop" class="h-56 w-full object-cover">
              <div class="p-5"><p class="text-sm uppercase tracking-[0.16em] text-blue-100">Ethan Cruz</p><h3 class="mt-2 text-xl font-bold">Warehouse lead to IT support technician</h3><p class="mt-3 text-sm text-slate-200">CompTIA-ready in 10 weeks</p></div>
            </article>
            <article class="overflow-hidden rounded-[1.75rem] bg-slate-900 text-white">
              <img src="https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80" alt="Portrait of Janelle Morris in a training center with notebooks on a desk" class="h-56 w-full object-cover">
              <div class="p-5"><p class="text-sm uppercase tracking-[0.16em] text-blue-100">Janelle Morris</p><h3 class="mt-2 text-xl font-bold">Caregiver to billing and coding assistant</h3><p class="mt-3 text-sm text-slate-200">Hired by a partner clinic before graduation</p></div>
            </article>
          </div>
        </section>
      </section>
    `)
  );
}

function courseCard(course) {
  return h(
    "article",
    { key: course.title, className: "surface-panel soft-shadow flex h-full flex-col rounded-[1.75rem] border border-white/80 p-6" },
    htmlBlock(`<div class="flex flex-wrap items-center gap-2"><span class="rounded-full bg-[var(--sf-sky)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--sf-blue)]">${course.field}</span><span class="rounded-full bg-[var(--sf-mint)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">${course.format}</span></div><h2 class="mt-4 text-2xl font-bold text-[var(--sf-navy)]">${course.title}</h2><p class="mt-3 text-sm leading-7 text-slate-600">${course.description}</p><dl class="mt-5 grid grid-cols-2 gap-3 text-sm"><div class="rounded-2xl bg-slate-50 p-3"><dt class="text-slate-500">Next start</dt><dd class="mt-1 font-semibold text-slate-900">${course.nextStart}</dd></div><div class="rounded-2xl bg-slate-50 p-3"><dt class="text-slate-500">Total hours</dt><dd class="mt-1 font-semibold text-slate-900">${course.hours}</dd></div><div class="rounded-2xl bg-slate-50 p-3"><dt class="text-slate-500">Duration</dt><dd class="mt-1 font-semibold text-slate-900">${course.duration}</dd></div><div class="rounded-2xl bg-slate-50 p-3"><dt class="text-slate-500">Cost</dt><dd class="mt-1 font-semibold text-slate-900">${course.cost}</dd></div></dl>`),
    h("div", { className: "mt-5 flex items-center justify-between gap-3" }, h("p", { className: "text-sm font-semibold text-slate-500" }, course.credential), h("a", { href: "./course-detail.html", className: "focus-ring inline-flex items-center gap-2 rounded-full bg-[var(--sf-blue)] px-4 py-2.5 text-sm font-semibold text-white" }, "Enroll Now", icon("arrow", "h-4 w-4")))
  );
}

const courses = [
  { title: "Medical Administrative Assistant Certificate", field: "Healthcare Support", format: "Cohort", duration: "8 weeks", hours: "96 hours", cost: "$349", nextStart: "March 3", credential: "Certificate", description: "Front-office systems, EHR workflow, scheduling, and billing fundamentals for outpatient care teams." },
  { title: "IT Support Technician Track", field: "Information Technology", format: "Live Online", duration: "10 weeks", hours: "120 hours", cost: "$499", nextStart: "March 10", credential: "Certificate", description: "Hardware, ticketing, troubleshooting, and customer support workflows aligned to entry-level help desk roles." },
  { title: "Business Administration Foundations", field: "Business Administration", format: "Self-Paced", duration: "6 weeks", hours: "52 hours", cost: "$199", nextStart: "Start anytime", credential: "Badge", description: "Office operations, spreadsheets, communication, and reporting for career-changers moving into admin roles." },
  { title: "Residential Electrical Basics", field: "Trades", format: "Cohort", duration: "12 weeks", hours: "140 hours", cost: "$650", nextStart: "April 7", credential: "CEU", description: "Safety, circuits, blueprint reading, and jobsite workflows with guided labs and mentor check-ins." },
  { title: "Pharmacy Support Essentials", field: "Healthcare Support", format: "Self-Paced", duration: "5 weeks", hours: "38 hours", cost: "Free", nextStart: "Start anytime", credential: "Badge", description: "Medication terminology, inventory basics, and pharmacy operations readiness for support staff roles." },
  { title: "Bookkeeping for Small Business", field: "Business Administration", format: "Live Online", duration: "7 weeks", hours: "64 hours", cost: "$420", nextStart: "March 17", credential: "Certificate", description: "AP/AR workflows, payroll fundamentals, reconciliations, and software practice with instructor feedback." },
];

function coursesPage() {
  return h(
    "main",
    { id: "main-content", className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" },
    pageHeader({
      eyebrow: "Programs",
      title: "Discover programs built around real job pathways",
      intro: "Browse SkillForge offerings by field, delivery format, duration, cost, and credential type. Every program page clarifies time commitment, start dates, and next-step actions.",
      actions: [h("a", { key: "path", href: "./index.html#find-path", className: "focus-ring rounded-full bg-[var(--sf-blue)] px-5 py-3 text-sm font-semibold text-white" }, "Find Your Path"), h("a", { key: "pricing", href: "./pricing.html", className: "focus-ring rounded-full border border-[var(--sf-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--sf-navy)]" }, "View Financing")],
      breadcrumbs: [{ label: "Home", href: "./index.html" }, { label: "Programs", href: "./courses.html" }],
      tabs: [{ label: "All Programs", href: "./courses.html", active: true }, { label: "Featured Cohort", href: "./course-detail.html", active: false }, { label: "Student Dashboard", href: "./dashboard.html", active: false }],
    }),
    h(
      "div",
      { className: "mt-8 grid gap-8 xl:grid-cols-[320px_1fr]" },
      htmlBlock(`
        <aside class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6">
          <h2 class="text-2xl font-bold text-[var(--sf-navy)]">Filter programs</h2>
          <form class="mt-6 space-y-5" aria-label="Course filters">
            <div><label for="career-field" class="mb-2 block text-sm font-semibold text-slate-700">Career Field</label><select id="career-field" class="focus-ring h-12 w-full rounded-2xl border border-[var(--sf-border)] bg-white px-4 text-sm"><option>All fields</option><option>Trades</option><option>Healthcare Support</option><option>Information Technology</option><option>Business Administration</option></select></div>
            <div><label for="format-filter" class="mb-2 block text-sm font-semibold text-slate-700">Format</label><select id="format-filter" class="focus-ring h-12 w-full rounded-2xl border border-[var(--sf-border)] bg-white px-4 text-sm"><option>All formats</option><option>Self-Paced</option><option>Cohort</option><option>Live Online</option></select></div>
            <div><label for="duration-filter" class="mb-2 block text-sm font-semibold text-slate-700">Duration</label><select id="duration-filter" class="focus-ring h-12 w-full rounded-2xl border border-[var(--sf-border)] bg-white px-4 text-sm"><option>Any duration</option><option>Under 6 weeks</option><option>6-8 weeks</option><option>9+ weeks</option></select></div>
            <div><label for="cost-filter" class="mb-2 block text-sm font-semibold text-slate-700">Cost</label><select id="cost-filter" class="focus-ring h-12 w-full rounded-2xl border border-[var(--sf-border)] bg-white px-4 text-sm"><option>All tuition levels</option><option>Free</option><option>Under $500</option><option>$500+</option></select></div>
            <div><label for="credential-filter" class="mb-2 block text-sm font-semibold text-slate-700">Credential Type</label><select id="credential-filter" class="focus-ring h-12 w-full rounded-2xl border border-[var(--sf-border)] bg-white px-4 text-sm"><option>All credentials</option><option>Certificate</option><option>Badge</option><option>CEU</option></select></div>
            <button type="button" class="focus-ring w-full rounded-full bg-[var(--sf-blue)] px-5 py-3 text-sm font-semibold text-white">Apply Filters</button>
          </form>
        </aside>
      `),
      h("section", { id: "live-cohorts" }, h("div", { className: "mb-5 flex flex-wrap items-center justify-between gap-3" }, h("div", null, h("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-slate-500" }, "Showing 6 programs"), h("h2", { className: "mt-2 text-3xl font-bold text-[var(--sf-navy)]" }, "Programs for career changers")), h("a", { href: "./course-detail.html", className: "focus-ring rounded-full border border-[var(--sf-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--sf-navy)]" }, "View featured cohort")), h("div", { className: "grid gap-6 md:grid-cols-2 xl:grid-cols-2" }, courses.map(courseCard)))
    )
  );
}

function courseDetailPage() {
  return h(
    "main",
    { id: "main-content", className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" },
    pageHeader({
      eyebrow: "Featured Cohort",
      title: "Medical Administrative Assistant Certificate",
      intro: "8 weeks · Cohort · $349. Built for adult learners transitioning into outpatient front-office, scheduling, billing, and care coordination roles.",
      actions: [h("a", { key: "enroll", href: "./pricing.html", className: "focus-ring rounded-full bg-[var(--sf-blue)] px-5 py-3 text-sm font-semibold text-white" }, "Enroll Now"), h("a", { key: "classroom", href: "./learning.html", className: "focus-ring rounded-full border border-[var(--sf-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--sf-navy)]" }, "Preview Classroom")],
      breadcrumbs: [{ label: "Home", href: "./index.html" }, { label: "Programs", href: "./courses.html" }, { label: "Medical Admin Certificate", href: "./course-detail.html" }],
      tabs: [{ label: "Overview", href: "./course-detail.html", active: true }, { label: "Weekly Classroom", href: "./learning.html", active: false }, { label: "Pricing Options", href: "./pricing.html", active: false }],
    }),
    htmlBlock(`
      <div class="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div class="space-y-8">
          <section class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6">
            <h2 class="text-2xl font-bold text-[var(--sf-navy)]">What you will learn</h2>
            <ul class="mt-5 grid gap-4 sm:grid-cols-2">
              <li class="flex gap-3 rounded-[1.5rem] bg-slate-50 p-4"><div class="mt-1 rounded-full bg-[var(--sf-mint)] p-2 text-emerald-800">✓</div><span class="text-sm leading-7 text-slate-700">Navigate patient scheduling, intake, referrals, and follow-up workflows.</span></li>
              <li class="flex gap-3 rounded-[1.5rem] bg-slate-50 p-4"><div class="mt-1 rounded-full bg-[var(--sf-mint)] p-2 text-emerald-800">✓</div><span class="text-sm leading-7 text-slate-700">Use core medical terminology and EHR-ready documentation practices.</span></li>
              <li class="flex gap-3 rounded-[1.5rem] bg-slate-50 p-4"><div class="mt-1 rounded-full bg-[var(--sf-mint)] p-2 text-emerald-800">✓</div><span class="text-sm leading-7 text-slate-700">Process claims basics, insurance verification, and front-desk billing tasks.</span></li>
              <li class="flex gap-3 rounded-[1.5rem] bg-slate-50 p-4"><div class="mt-1 rounded-full bg-[var(--sf-mint)] p-2 text-emerald-800">✓</div><span class="text-sm leading-7 text-slate-700">Prepare for entry-level administrative roles with mock interviews and coaching.</span></li>
            </ul>
          </section>
          <section class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6">
            <div class="flex items-center justify-between gap-3"><h2 class="text-2xl font-bold text-[var(--sf-navy)]">Weekly schedule breakdown</h2><span class="rounded-full bg-[var(--sf-sky)] px-3 py-1 text-sm font-semibold text-[var(--sf-blue)]">Tuesday + Thursday live sessions</span></div>
            <div class="mt-5 space-y-4">
              <div class="flex flex-col gap-3 rounded-[1.5rem] border border-[var(--sf-border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Week 1</p><p class="mt-1 text-lg font-semibold text-slate-900">Healthcare communication and systems</p></div><span class="rounded-full bg-[var(--sf-mint)] px-3 py-1 text-sm font-semibold text-emerald-900">Complete</span></div>
              <div class="flex flex-col gap-3 rounded-[1.5rem] border border-[var(--sf-border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Week 2</p><p class="mt-1 text-lg font-semibold text-slate-900">Scheduling, referrals, and patient intake</p></div><span class="rounded-full bg-[var(--sf-mint)] px-3 py-1 text-sm font-semibold text-emerald-900">Complete</span></div>
              <div class="flex flex-col gap-3 rounded-[1.5rem] border border-[var(--sf-border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Week 3</p><p class="mt-1 text-lg font-semibold text-slate-900">Medical Billing Fundamentals</p></div><span class="rounded-full bg-[var(--sf-gold)]/20 px-3 py-1 text-sm font-semibold text-amber-900">Current</span></div>
              <div class="flex flex-col gap-3 rounded-[1.5rem] border border-[var(--sf-border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Week 4</p><p class="mt-1 text-lg font-semibold text-slate-900">Claims workflows and reimbursement</p></div><span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">Upcoming</span></div>
            </div>
          </section>
          <section class="grid gap-8 lg:grid-cols-2">
            <div class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6"><h2 class="text-2xl font-bold text-[var(--sf-navy)]">Instructor profile</h2><div class="mt-5 flex items-start gap-4"><img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80" alt="Instructor Dr. Alicia Warren wearing a navy blazer in a clinic setting" class="h-24 w-24 rounded-[1.5rem] object-cover"><div><p class="text-lg font-bold text-slate-900">Dr. Alicia Warren, MHA, CPC</p><p class="mt-2 text-sm leading-7 text-slate-600">15 years in ambulatory care operations, former clinic administrator, certified professional coder, and lead curriculum advisor for allied health pathways.</p></div></div></div>
            <div class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6"><h2 class="text-2xl font-bold text-[var(--sf-navy)]">Required materials</h2><ul class="mt-5 space-y-3 text-sm leading-7 text-slate-700"><li>Reliable internet connection and webcam for live cohort sessions.</li><li>Notebook or digital note-taking tool for workflow simulations.</li><li>Access to browser-based EHR practice environment provided by SkillForge.</li></ul></div>
          </section>
        </div>
        <aside class="space-y-6">
          <section class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6"><h2 class="text-2xl font-bold text-[var(--sf-navy)]">Financing options</h2><div class="mt-5 space-y-4 text-sm leading-7 text-slate-700"><div class="rounded-[1.5rem] bg-slate-50 p-4"><p class="font-semibold text-slate-900">Payment plan</p><p class="mt-1">$89 today, then 3 monthly payments of $87.</p></div><div class="rounded-[1.5rem] bg-slate-50 p-4"><p class="font-semibold text-slate-900">Employer reimbursement</p><p class="mt-1">Download a sponsor-ready training summary and invoice.</p></div><a href="./pricing.html#financing" class="focus-ring inline-flex rounded-full bg-[var(--sf-blue)] px-5 py-3 font-semibold text-white">See all funding paths</a></div></section>
          <section class="metric-card soft-shadow rounded-[2rem] border border-white/80 p-6"><p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--sf-blue)]">Alumni outcomes</p><p class="mt-3 text-4xl font-bold text-[var(--sf-navy)]">92%</p><p class="mt-2 text-base text-slate-700">job placement within 3 months</p><p class="mt-4 text-sm leading-7 text-slate-600">Graduates report stronger confidence with scheduling, patient intake, and claims language during interviews.</p></section>
          <section class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6"><h2 class="text-xl font-bold text-[var(--sf-navy)]">Live Q&amp;A schedule</h2><p class="mt-2 text-sm text-slate-600">Every Wednesday at 7:00 PM ET</p><ul class="mt-5 space-y-3 text-sm text-slate-700"><li>March 5 - Course orientation and success planning</li><li>March 12 - Billing workflows and practice cases</li><li>March 19 - Career services and employer expectations</li></ul><a href="./learning.html" class="focus-ring mt-5 inline-flex rounded-full border border-[var(--sf-border)] bg-white px-5 py-3 font-semibold text-[var(--sf-navy)]">View classroom agenda</a></section>
        </aside>
      </div>
    `)
  );
}

function countdownParts(targetDate) {
  const remaining = Math.max(0, targetDate.getTime() - Date.now());
  return {
    days: Math.floor(remaining / (1000 * 60 * 60 * 24)),
    hours: Math.floor((remaining / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((remaining / (1000 * 60)) % 60),
  };
}

function learningPage() {
  const targetDate = useMemo(function () {
    return new Date(Date.now() + (2 * 24 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000) + (25 * 60 * 1000));
  }, []);
  const [countdown, setCountdown] = useState(countdownParts(targetDate));

  useEffect(function () {
    const timer = window.setInterval(function () {
      setCountdown(countdownParts(targetDate));
    }, 60000);
    return function () {
      window.clearInterval(timer);
    };
  }, [targetDate]);

  return h(
    "main",
    { id: "main-content", className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" },
    pageHeader({
      eyebrow: "Cohort Classroom",
      title: "Week 3 of 8 - Medical Billing Fundamentals",
      intro: "Track your live session countdown, weekly agenda, assignments, peer discussion, and course resources from one classroom view.",
      actions: [h("a", { key: "submit", href: "#assignment-submission", className: "focus-ring rounded-full bg-[var(--sf-blue)] px-5 py-3 text-sm font-semibold text-white" }, "Submit Assignment"), h("a", { key: "dashboard", href: "./dashboard.html", className: "focus-ring rounded-full border border-[var(--sf-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--sf-navy)]" }, "Go to Dashboard")],
      breadcrumbs: [{ label: "Home", href: "./index.html" }, { label: "Programs", href: "./courses.html" }, { label: "Classroom", href: "./learning.html" }],
      tabs: [{ label: "Agenda", href: "./learning.html", active: true }, { label: "Program Detail", href: "./course-detail.html", active: false }, { label: "Tuition Support", href: "./pricing.html", active: false }],
    }),
    h(
      "div",
      { className: "mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]" },
      h("div", { className: "space-y-8" }, h("section", { className: "surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6" }, h("div", { className: "flex flex-wrap items-center justify-between gap-4" }, h("div", null, h("p", { className: "text-sm font-bold uppercase tracking-[0.18em] text-[var(--sf-blue)]" }, "Weekly agenda panel"), h("h2", { className: "mt-2 text-2xl font-bold text-[var(--sf-navy)]" }, "This week in your cohort")), h("div", { className: "warning-pill rounded-full px-4 py-2 text-sm font-bold text-amber-900" }, "Live session in ", countdown.days, "d ", countdown.hours, "h ", countdown.minutes, "m")), htmlBlock('<div class="mt-5 space-y-4"><div class="flex gap-3 rounded-[1.5rem] bg-slate-50 p-4"><div class="rounded-full bg-[var(--sf-sky)] p-2 text-[var(--sf-blue)]">•</div><p class="text-sm leading-7 text-slate-700">Tuesday: Watch the billing lecture and complete coding worksheet</p></div><div class="flex gap-3 rounded-[1.5rem] bg-slate-50 p-4"><div class="rounded-full bg-[var(--sf-sky)] p-2 text-[var(--sf-blue)]">•</div><p class="text-sm leading-7 text-slate-700">Wednesday: Attend live case review and bring one insurance verification question</p></div><div class="flex gap-3 rounded-[1.5rem] bg-slate-50 p-4"><div class="rounded-full bg-[var(--sf-sky)] p-2 text-[var(--sf-blue)]">•</div><p class="text-sm leading-7 text-slate-700">Thursday: Peer discussion post due before 8:00 PM ET</p></div><div class="flex gap-3 rounded-[1.5rem] bg-slate-50 p-4"><div class="rounded-full bg-[var(--sf-sky)] p-2 text-[var(--sf-blue)]">•</div><p class="text-sm leading-7 text-slate-700">Friday: Submit assignment portal checklist and instructor reflection</p></div></div>')), htmlBlock(`
        <section id="assignment-submission" class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6">
          <h2 class="text-2xl font-bold text-[var(--sf-navy)]">Assignment submission portal</h2>
          <form class="mt-6 grid gap-5 lg:grid-cols-2" aria-label="Assignment submission">
            <div><label for="assignment-name" class="mb-2 block text-sm font-semibold text-slate-700">Assignment name</label><select id="assignment-name" class="focus-ring h-12 w-full rounded-2xl border border-[var(--sf-border)] bg-white px-4 text-sm"><option>Week 3 billing workflow worksheet</option><option>Peer discussion response</option><option>Claims terminology quiz</option></select></div>
            <div><label for="assignment-file" class="mb-2 block text-sm font-semibold text-slate-700">Upload file</label><input id="assignment-file" type="file" class="focus-ring h-12 w-full rounded-2xl border border-[var(--sf-border)] bg-white px-4 py-3 text-sm"></div>
            <div class="lg:col-span-2"><label for="assignment-notes" class="mb-2 block text-sm font-semibold text-slate-700">Notes for your instructor</label><textarea id="assignment-notes" rows="5" class="focus-ring w-full rounded-[1.5rem] border border-[var(--sf-border)] bg-white px-4 py-3 text-sm">I included the optional payer workflow notes on page 2.</textarea></div>
            <div class="lg:col-span-2 flex flex-wrap gap-3"><button type="submit" class="focus-ring rounded-full bg-[var(--sf-blue)] px-5 py-3 text-sm font-semibold text-white">Upload Assignment</button><a href="./dashboard.html" class="focus-ring rounded-full border border-[var(--sf-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--sf-navy)]">Save and return to dashboard</a></div>
          </form>
        </section>`)),
      htmlBlock(`
        <div class="space-y-8">
          <section class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6">
            <h2 class="text-2xl font-bold text-[var(--sf-navy)]">Peer discussion board</h2>
            <div class="mt-5 space-y-4">
              <a href="./dashboard.html" class="focus-ring block rounded-[1.5rem] border border-[var(--sf-border)] bg-white p-4 hover:border-blue-200"><div class="flex items-start justify-between gap-4"><div><p class="font-semibold text-slate-900">Best way to verify secondary insurance?</p><p class="mt-2 text-sm text-slate-600">14 replies</p></div><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">6 min ago</span></div></a>
              <a href="./dashboard.html" class="focus-ring block rounded-[1.5rem] border border-[var(--sf-border)] bg-white p-4 hover:border-blue-200"><div class="flex items-start justify-between gap-4"><div><p class="font-semibold text-slate-900">Template for intake correction notes</p><p class="mt-2 text-sm text-slate-600">9 replies</p></div><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">18 min ago</span></div></a>
              <a href="./dashboard.html" class="focus-ring block rounded-[1.5rem] border border-[var(--sf-border)] bg-white p-4 hover:border-blue-200"><div class="flex items-start justify-between gap-4"><div><p class="font-semibold text-slate-900">Practice set: CPT modifier examples</p><p class="mt-2 text-sm text-slate-600">21 replies</p></div><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">34 min ago</span></div></a>
            </div>
          </section>
          <section class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6">
            <h2 class="text-2xl font-bold text-[var(--sf-navy)]">Resource library</h2>
            <div class="mt-5 grid gap-4">
              <a href="./course-detail.html" class="focus-ring resource-card rounded-[1.5rem] border border-white/70 p-4 text-sm font-semibold text-[var(--sf-navy)] hover:border-blue-200">Slides: Week 3 billing fundamentals</a>
              <a href="./course-detail.html" class="focus-ring resource-card rounded-[1.5rem] border border-white/70 p-4 text-sm font-semibold text-[var(--sf-navy)] hover:border-blue-200">Worksheet packet: intake-to-claim practice</a>
              <a href="./course-detail.html" class="focus-ring resource-card rounded-[1.5rem] border border-white/70 p-4 text-sm font-semibold text-[var(--sf-navy)] hover:border-blue-200">Reading links: payer terminology and reimbursement</a>
            </div>
          </section>
        </div>
      `)
    )
  );
}

function pricingPage() {
  const [tuition, setTuition] = useState(349);
  const [months, setMonths] = useState(4);
  const monthly = (tuition / months).toFixed(2);

  return h(
    "main",
    { id: "main-content", className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" },
    pageHeader({
      eyebrow: "Pricing",
      title: "Choose the support model that matches how you learn or sponsor",
      intro: "SkillForge supports individual learners, employer-funded reskilling, and nonprofit or government workforce programs with flexible pricing and coaching access.",
      actions: [h("a", { key: "chat", href: "#advisor-chat", className: "focus-ring rounded-full bg-[var(--sf-blue)] px-5 py-3 text-sm font-semibold text-white" }, "Talk to an Advisor"), h("a", { key: "scholarship", href: "#scholarship", className: "focus-ring rounded-full border border-[var(--sf-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--sf-navy)]" }, "Scholarship Application")],
      breadcrumbs: [{ label: "Home", href: "./index.html" }, { label: "Pricing", href: "./pricing.html" }],
      tabs: [{ label: "Pricing Tracks", href: "./pricing.html", active: true }, { label: "Program Detail", href: "./course-detail.html", active: false }, { label: "Student Dashboard", href: "./dashboard.html", active: false }],
    }),
    htmlBlock(`
      <section class="mt-8 grid gap-6 lg:grid-cols-3">
        <article class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6"><p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--sf-blue)]">Individual Enrollment</p><p class="mt-4 text-4xl font-bold text-[var(--sf-navy)]">From $199</p><p class="mt-4 text-sm leading-7 text-slate-600">Self-paced or cohort pathways with financing, coaching, and milestone reminders.</p><a href="./courses.html" class="focus-ring mt-6 inline-flex rounded-full bg-[var(--sf-blue)] px-5 py-3 text-sm font-semibold text-white">Start Learning</a></article>
        <article class="hero-grid soft-shadow rounded-[2rem] border p-6 text-white"><p class="text-sm font-bold uppercase tracking-[0.18em] text-blue-100">Employer Sponsorship</p><p class="mt-4 text-4xl font-bold">Custom seats</p><p class="mt-4 text-sm leading-7 text-blue-50">Seat bundles, manager progress reporting, and workforce-aligned learning cohorts.</p><a href="#advisor-chat" class="focus-ring mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--sf-navy)]">Request Consultation</a></article>
        <article class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6"><p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--sf-blue)]">Non-profit / Government</p><p class="mt-4 text-4xl font-bold text-[var(--sf-navy)]">Grant-ready</p><p class="mt-4 text-sm leading-7 text-slate-600">Community pricing, outcome dashboards, and advisor-led onboarding for funded programs.</p><a href="#advisor-chat" class="focus-ring mt-6 inline-flex rounded-full bg-[var(--sf-blue)] px-5 py-3 text-sm font-semibold text-white">Request Consultation</a></article>
      </section>
    `),
    h(
      "div",
      { className: "mt-8 grid gap-8 xl:grid-cols-[1fr_0.9fr]" },
      h(
        "section",
        { id: "financing", className: "surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6" },
        h("h2", { className: "text-2xl font-bold text-[var(--sf-navy)]" }, "Financing calculator"),
        h(
          "div",
          { className: "mt-6 grid gap-5 sm:grid-cols-2" },
          h("div", null, h("label", { htmlFor: "tuition-range", className: "mb-2 block text-sm font-semibold text-slate-700" }, "Tuition amount"), h("input", { id: "tuition-range", type: "range", min: "199", max: "1500", step: "50", value: tuition, onChange: function (event) { setTuition(Number(event.target.value)); }, className: "focus-ring w-full" }), h("p", { className: "mt-2 text-sm text-slate-600" }, "Selected tuition: ", h("span", { className: "font-semibold text-slate-900" }, "$", tuition))),
          h("div", null, h("label", { htmlFor: "months-range", className: "mb-2 block text-sm font-semibold text-slate-700" }, "Payment months"), h("input", { id: "months-range", type: "range", min: "2", max: "12", step: "1", value: months, onChange: function (event) { setMonths(Number(event.target.value)); }, className: "focus-ring w-full" }), h("p", { className: "mt-2 text-sm text-slate-600" }, "Installments: ", h("span", { className: "font-semibold text-slate-900" }, months, " months")))
        ),
        h("div", { className: "metric-card mt-6 rounded-[1.75rem] p-6" }, h("p", { className: "text-sm font-bold uppercase tracking-[0.18em] text-[var(--sf-blue)]" }, "Estimated monthly payment"), h("p", { className: "mt-3 text-5xl font-bold text-[var(--sf-navy)]" }, "$", monthly), h("p", { className: "mt-3 text-sm text-slate-600" }, "Illustrative only. Final financing terms depend on plan selection and scholarship eligibility.")),
        htmlBlock('<div id="scholarship" class="mt-6 rounded-[1.5rem] bg-slate-50 p-5"><p class="text-lg font-bold text-slate-900">Scholarship application</p><p class="mt-2 text-sm leading-7 text-slate-600">Apply for workforce transition awards, nonprofit partner scholarships, or employer reskilling reimbursement.</p><a href="./courses.html" class="focus-ring mt-4 inline-flex rounded-full bg-[var(--sf-blue)] px-5 py-3 text-sm font-semibold text-white">Open eligibility form</a></div>')
      ),
      htmlBlock(`
        <aside class="space-y-6">
          <section id="advisor-chat" class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6">
            <h2 class="text-2xl font-bold text-[var(--sf-navy)]">Talk to an Advisor</h2>
            <p class="mt-3 text-sm leading-7 text-slate-600">Live chat is available for tuition planning, transfer questions, and pacing advice.</p>
            <div class="mt-5 rounded-[1.5rem] bg-[var(--sf-sky)] p-5"><p class="font-semibold text-[var(--sf-navy)]">Advisor Priya is online now</p><p class="mt-2 text-sm text-slate-700">Average response time: under 2 minutes</p><button type="button" class="focus-ring mt-4 rounded-full bg-[var(--sf-blue)] px-5 py-3 text-sm font-semibold text-white">Start Live Chat</button></div>
          </section>
          <section class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6">
            <h2 class="text-2xl font-bold text-[var(--sf-navy)]">Accreditation badges</h2>
            <div class="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <div class="rounded-[1.5rem] border border-[var(--sf-border)] bg-white p-4 text-sm font-semibold text-slate-700">Workforce Ready</div>
              <div class="rounded-[1.5rem] border border-[var(--sf-border)] bg-white p-4 text-sm font-semibold text-slate-700">Employer Reviewed</div>
              <div class="rounded-[1.5rem] border border-[var(--sf-border)] bg-white p-4 text-sm font-semibold text-slate-700">Accessible Delivery</div>
            </div>
          </section>
        </aside>
      `)
    )
  );
}

function dashboardPage() {
  return h(
    "main",
    { id: "main-content", className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" },
    pageHeader({
      eyebrow: "Dashboard",
      title: "Your Program: Medical Admin Certificate - Week 3 of 8",
      intro: "Stay on top of your live session, upcoming assignments, cohort connections, and projected certificate completion from one student dashboard.",
      actions: [h("a", { key: "join", href: "./learning.html", className: "focus-ring rounded-full bg-[var(--sf-blue)] px-5 py-3 text-sm font-semibold text-white" }, "Join Classroom"), h("a", { key: "office-hours", href: "./pricing.html#advisor-chat", className: "focus-ring rounded-full border border-[var(--sf-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--sf-navy)]" }, "Book Office Hours")],
      breadcrumbs: [{ label: "Home", href: "./index.html" }, { label: "Dashboard", href: "./dashboard.html" }],
      tabs: [{ label: "Overview", href: "./dashboard.html", active: true }, { label: "Classroom", href: "./learning.html", active: false }, { label: "Program Detail", href: "./course-detail.html", active: false }],
    }),
    htmlBlock(`
      <div class="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div class="space-y-8">
          <section class="hero-grid soft-shadow rounded-[2rem] p-6 text-white">
            <p class="text-sm font-bold uppercase tracking-[0.18em] text-blue-100">Upcoming live session reminder</p>
            <h2 class="mt-3 text-3xl font-bold">Wednesday, March 12 at 7:00 PM ET</h2>
            <p class="mt-3 max-w-2xl text-base leading-8 text-blue-50">Live case review: claims corrections and reimbursement workflow practice.</p>
            <div class="mt-6 flex flex-wrap gap-3"><a href="./learning.html" class="focus-ring rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--sf-navy)]">Join Live Session</a><a href="./course-detail.html" class="focus-ring rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white">Review syllabus</a></div>
          </section>
          <section class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6">
            <div class="flex items-center justify-between gap-4"><h2 class="text-2xl font-bold text-[var(--sf-navy)]">Assignment due dates</h2><a href="./learning.html#assignment-submission" class="focus-ring text-sm font-semibold text-[var(--sf-blue)]">Submit work</a></div>
            <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div class="calendar-cell rounded-[1.5rem] border border-[var(--sf-border)] bg-white p-4"><p class="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Mar 6</p><p class="mt-2 text-sm font-semibold text-slate-900">Submit intake workflow worksheet</p><p class="mt-2 text-xs text-slate-500">Worksheet</p></div>
              <div class="calendar-cell rounded-[1.5rem] border border-[var(--sf-border)] bg-white p-4"><p class="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Mar 7</p><p class="mt-2 text-sm font-semibold text-slate-900">Discussion response: billing accuracy</p><p class="mt-2 text-xs text-slate-500">Discussion</p></div>
              <div class="calendar-cell rounded-[1.5rem] border border-[var(--sf-border)] bg-white p-4"><p class="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Mar 9</p><p class="mt-2 text-sm font-semibold text-slate-900">Quiz: payer terminology</p><p class="mt-2 text-xs text-slate-500">Quiz</p></div>
              <div class="calendar-cell rounded-[1.5rem] border border-dashed border-[var(--sf-border)] bg-slate-50 p-4"><p class="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Apr 18</p><p class="mt-2 text-sm font-semibold text-slate-900">Projected completion</p><p class="mt-2 text-xs text-slate-500">Certificate milestone</p></div>
            </div>
          </section>
        </div>
        <div class="space-y-8">
          <section class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6"><h2 class="text-2xl font-bold text-[var(--sf-navy)]">Peer cohort</h2><div class="mt-5 flex flex-wrap items-center gap-3"><div class="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sf-sky)] text-sm font-bold text-[var(--sf-blue)]" aria-label="Cohort member AM">AM</div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sf-sky)] text-sm font-bold text-[var(--sf-blue)]" aria-label="Cohort member JR">JR</div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sf-sky)] text-sm font-bold text-[var(--sf-blue)]" aria-label="Cohort member TC">TC</div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sf-sky)] text-sm font-bold text-[var(--sf-blue)]" aria-label="Cohort member LS">LS</div><div class="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sf-sky)] text-sm font-bold text-[var(--sf-blue)]" aria-label="Cohort member PK">PK</div></div><p class="mt-4 text-sm leading-7 text-slate-600">Your small-group lab team meets after Thursday discussions to review intake workflow cases.</p></section>
          <section class="surface-panel soft-shadow rounded-[2rem] border border-white/80 p-6"><h2 class="text-2xl font-bold text-[var(--sf-navy)]">Instructor office hours</h2><p class="mt-3 text-sm leading-7 text-slate-600">Reserve a 15-minute slot with Dr. Alicia Warren for assignment feedback or career coaching.</p><a href="./pricing.html#advisor-chat" class="focus-ring mt-5 inline-flex rounded-full bg-[var(--sf-blue)] px-5 py-3 text-sm font-semibold text-white">Book Office Hours</a></section>
          <section class="metric-card soft-shadow rounded-[2rem] border border-white/80 p-6"><p class="text-sm font-bold uppercase tracking-[0.18em] text-[var(--sf-blue)]">Certificate preview</p><h2 class="mt-3 text-3xl font-bold text-[var(--sf-navy)]">Projected completion: April 18</h2><p class="mt-3 text-sm leading-7 text-slate-600">Complete all assignments and attend 6 of 8 live sessions to unlock certificate generation and alumni career services.</p></section>
        </div>
      </div>
    `)
  );
}

function App() {
  return h(
    "div",
    { className: "site-shell min-h-screen" },
    h("a", { href: "#main-content", className: "focus-ring sr-only rounded-full bg-white px-4 py-2 text-sm font-semibold focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50" }, "Skip to content"),
    header(),
    currentPage === "courses" ? coursesPage() : null,
    currentPage === "course-detail" ? courseDetailPage() : null,
    currentPage === "learning" ? learningPage() : null,
    currentPage === "pricing" ? pricingPage() : null,
    currentPage === "dashboard" ? dashboardPage() : null,
    currentPage === "home" ? homePage() : null,
    footer()
  );
}

root.render(h(App));
