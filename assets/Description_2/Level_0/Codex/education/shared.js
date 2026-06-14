window.SkillForge = (() => {
  const html = window.htm.bind(window.React.createElement);

  const primaryNav = [
    { label: "Home", href: "./index.html" },
    { label: "Courses", href: "./courses.html" },
    { label: "Pricing", href: "./pricing.html" },
    { label: "Dashboard", href: "./dashboard.html" },
  ];

  const secondaryNav = [
    { label: "Explore Paths", href: "./courses.html" },
    { label: "Program Detail", href: "./course-detail.html" },
    { label: "Classroom", href: "./classroom.html" },
    { label: "Learner Hub", href: "./dashboard.html" },
  ];

  const employerLogos = ["Google", "Mayo Clinic", "Deloitte"];

  const stories = [
    {
      name: "Candice R.",
      track: "Medical Admin Certificate",
      before: "Retail shift lead",
      after: "Clinic intake coordinator",
      pay: "+$8/hr within 10 weeks",
    },
    {
      name: "Luis M.",
      track: "IT Support Technician",
      before: "Warehouse associate",
      after: "Help desk analyst",
      pay: "First salaried role in 3 months",
    },
    {
      name: "Nia T.",
      track: "Bookkeeping Foundations",
      before: "Freelance gig worker",
      after: "Accounts receivable specialist",
      pay: "Employer-sponsored upskilling",
    },
  ];

  const courses = [
    {
      title: "Medical Administrative Assistant Certificate",
      field: "Healthcare Support",
      format: "Cohort",
      duration: "8 weeks",
      hours: "96 hours",
      cost: "$349",
      credential: "Certificate",
      startDate: "Mar 3",
      level: "Beginner",
      outcome: "Front-office healthcare operations",
    },
    {
      title: "Medical Billing Fundamentals",
      field: "Healthcare Support",
      format: "Live Online",
      duration: "6 weeks",
      hours: "54 hours",
      cost: "$279",
      credential: "Badge",
      startDate: "Mar 10",
      level: "Intermediate",
      outcome: "Claims workflows and coding basics",
    },
    {
      title: "CompTIA IT Support Starter Track",
      field: "IT",
      format: "Self-Paced",
      duration: "10 weeks",
      hours: "72 hours",
      cost: "$499",
      credential: "Certificate",
      startDate: "Start anytime",
      level: "Beginner",
      outcome: "Help desk and device troubleshooting",
    },
    {
      title: "Office Administration Essentials",
      field: "Business Administration",
      format: "Self-Paced",
      duration: "5 weeks",
      hours: "38 hours",
      cost: "Free",
      credential: "CEU",
      startDate: "Start anytime",
      level: "Beginner",
      outcome: "Scheduling, systems, and support",
    },
    {
      title: "Electrical Estimating for New Tradespeople",
      field: "Trades",
      format: "Cohort",
      duration: "7 weeks",
      hours: "64 hours",
      cost: "$560",
      credential: "Certificate",
      startDate: "Apr 7",
      level: "Intermediate",
      outcome: "Field-ready estimating skills",
    },
    {
      title: "Project Coordination for Career Changers",
      field: "Business Administration",
      format: "Live Online",
      duration: "4 weeks",
      hours: "24 hours",
      cost: "$225",
      credential: "Badge",
      startDate: "Mar 18",
      level: "Beginner",
      outcome: "Project rituals, communication, scheduling",
    },
    {
      title: "Patient Scheduling Systems Lab",
      field: "Healthcare Support",
      format: "Self-Paced",
      duration: "3 weeks",
      hours: "18 hours",
      cost: "$120",
      credential: "CEU",
      startDate: "Start anytime",
      level: "Beginner",
      outcome: "EHR scheduling practice",
    },
    {
      title: "Cybersecurity Support Foundations",
      field: "IT",
      format: "Cohort",
      duration: "9 weeks",
      hours: "88 hours",
      cost: "$640",
      credential: "Certificate",
      startDate: "Apr 14",
      level: "Intermediate",
      outcome: "Security monitoring and escalation",
    },
  ];

  const weeklySchedule = [
    { week: "Week 1", title: "Healthcare systems and front desk operations", note: "Orientation, vocabulary, systems overview" },
    { week: "Week 2", title: "Patient registration and scheduling workflows", note: "Hands-on EHR scheduling lab" },
    { week: "Week 3", title: "Medical billing fundamentals", note: "Claims intake and coding basics" },
    { week: "Week 4", title: "Insurance verification and compliance", note: "HIPAA scenarios and forms practice" },
    { week: "Week 5", title: "Communication, conflict handling, and triage", note: "Role play with instructor feedback" },
    { week: "Week 6", title: "Electronic records and digital office tools", note: "Templates, chart notes, office systems" },
    { week: "Week 7", title: "Career readiness and employer workflows", note: "Resume lab and mock employer tasks" },
    { week: "Week 8", title: "Capstone simulation and certification prep", note: "Final practical and advising session" },
  ];

  const agenda = [
    ["Mon", "Review coding worksheet and insurance verification quiz", "2 tasks due"],
    ["Tue", "Live lecture: claims lifecycle walkthrough", "6:30 PM CT"],
    ["Wed", "Peer discussion on denied claims case study", "18 new replies"],
    ["Thu", "Instructor office hours and practice lab", "Open slots: 4"],
    ["Fri", "Capstone checkpoint submission", "Due 11:59 PM"],
  ];

  const resources = [
    { title: "Week 3 Slides", type: "Slides", meta: "42 pages" },
    { title: "Claims Worksheet Packet", type: "Worksheet", meta: "Download PDF" },
    { title: "CMS Reading Links", type: "Reading", meta: "3 curated sources" },
    { title: "Live Session Replay", type: "Video", meta: "52 minutes" },
  ];

  const discussions = [
    { author: "Tina", topic: "What changed your understanding of primary vs secondary insurance?", replies: 12 },
    { author: "Marcus", topic: "Template for following up on rejected claims", replies: 8 },
    { author: "Aisha", topic: "How are you organizing payer codes for the quiz?", replies: 6 },
  ];

  const dashboardAssignments = [
    { due: "Mar 12", title: "Claims workflow worksheet", status: "Needs review" },
    { due: "Mar 14", title: "Discussion post: patient intake scenario", status: "Due soon" },
    { due: "Mar 18", title: "Week 3 quiz", status: "Locked until Friday" },
  ];

  const cohortMembers = ["CR", "LM", "NT", "AO", "JP", "SK"];

  function Logo() {
    return html`
      <a href="./index.html" className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold uppercase text-white logo-chip">
          SF
        </div>
        <div>
          <p className="text-lg font-extrabold tracking-[0.1em] text-slate-950">SkillForge</p>
          <p className="text-[11px] uppercase tracking-[0.34em] text-slate-500">Career Training</p>
        </div>
      </a>
    `;
  }

  function Header({ current }) {
    return html`
      <header className="sticky top-0 z-50 border-b border-slate-200/80 nav-sheen">
        <div className="border-b border-slate-200/70 bg-slate-950 text-slate-100">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs sm:px-6 lg:px-8">
            <p className="font-semibold uppercase tracking-[0.28em] text-sky-200">Accredited workforce pathways</p>
            <div className="flex flex-wrap items-center gap-3 text-slate-300">
              <span>Cohort starting March 3 - 4 seats left</span>
              <a href="./pricing.html" className="rounded-full bg-sky-400 px-3 py-1 font-semibold text-slate-950">Try Free</a>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <${Logo} />
            <div className="hidden flex-1 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm text-slate-500 lg:block">
              Search pathways in trades, healthcare support, IT, and business administration
            </div>
            <nav className="ml-auto hidden items-center gap-2 lg:flex">
              ${primaryNav.map(
                (item) => html`
                  <a
                    key=${item.href}
                    href=${item.href}
                    className=${`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      current === item.href ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    ${item.label}
                  </a>
                `
              )}
            </nav>
          </div>
          <div className="flex gap-2 overflow-x-auto border-t border-slate-200/80 py-3 hide-scrollbar">
            ${secondaryNav.map(
              (item) => html`
                <a
                  key=${item.href}
                  href=${item.href}
                  className=${`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    current === item.href
                      ? "bg-sky-100 text-sky-900 badge-glow"
                      : "bg-white/80 text-slate-600 hover:bg-white"
                  }`}
                >
                  ${item.label}
                </a>
              `
            )}
          </div>
        </div>
      </header>
    `;
  }

  function Footer() {
    return html`
      <footer className="mt-20 border-t border-slate-200 bg-slate-950 text-slate-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_repeat(3,1fr)] lg:px-8">
          <div className="space-y-4">
            <p className="text-xl font-bold tracking-[0.1em]">SkillForge</p>
            <p className="max-w-sm text-sm leading-6 text-slate-300">
              Vocational and professional certification pathways for adult learners, career changers, and employer partners.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs">Accredited Curriculum</span>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs">Employer Aligned</span>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs">Flexible Scheduling</span>
            </div>
          </div>
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Programs</p>
            <div className="space-y-2 text-sm text-slate-300">
              <a className="block" href="./courses.html">Browse Courses</a>
              <a className="block" href="./course-detail.html">Featured Certificate</a>
              <a className="block" href="./classroom.html">Learning Tools</a>
            </div>
          </div>
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Support</p>
            <div className="space-y-2 text-sm text-slate-300">
              <a className="block" href="./pricing.html">Financing Options</a>
              <a className="block" href="./dashboard.html">Learner Dashboard</a>
              <a className="block" href="./pricing.html">Talk to an Advisor</a>
            </div>
          </div>
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Contact</p>
            <div className="space-y-2 text-sm text-slate-300">
              <p>admissions@skillforge.mock</p>
              <p>Mon-Thu, 8 AM-7 PM CT</p>
              <p>Employer Partnerships and nonprofit cohorts available</p>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  function Shell({ current, children }) {
    return html`
      <div>
        <${Header} current=${current} />
        <main>${children}</main>
        <${Footer} />
      </div>
    `;
  }

  function SectionTitle({ eyebrow, title, copy, actions }) {
    return html`
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-sky-700">${eyebrow}</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">${title}</h2>
          ${copy ? html`<p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">${copy}</p>` : null}
        </div>
        ${actions ? html`<div>${actions}</div>` : null}
      </div>
    `;
  }

  function StatCard({ value, label, tone = "bg-white" }) {
    return html`
      <div className=${`${tone} rounded-[1.75rem] p-5 brand-border`}>
        <p className="text-3xl font-extrabold text-slate-950">${value}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">${label}</p>
      </div>
    `;
  }

  function CourseCard({ course, href = "./course-detail.html" }) {
    const formatTone =
      course.format === "Cohort"
        ? "bg-emerald-100 text-emerald-900"
        : course.format === "Live Online"
          ? "bg-sky-100 text-sky-900"
          : "bg-slate-100 text-slate-700";

    return html`
      <article className="mesh-panel overflow-hidden rounded-[2rem] p-6 ring-1 ring-slate-200/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">${course.field}</span>
          <span className=${`rounded-full px-3 py-1 text-xs font-semibold ${formatTone}`}>${course.format}</span>
        </div>
        <div className="mt-5 space-y-3">
          <h3 className="text-2xl font-bold tracking-tight text-slate-950">${course.title}</h3>
          <p className="text-sm leading-6 text-slate-600">${course.outcome}</p>
        </div>
        <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Next start</p>
            <p className="mt-2 font-semibold text-slate-900">${course.startDate}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Credential</p>
            <p className="mt-2 font-semibold text-slate-900">${course.credential}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Duration</p>
            <p className="mt-2 font-semibold text-slate-900">${course.duration} · ${course.hours}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Cost</p>
            <p className="mt-2 font-semibold text-slate-900">${course.cost}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href=${href} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Enroll Now</a>
          <a href="./classroom.html" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Preview Classroom</a>
        </div>
      </article>
    `;
  }

  return {
    html,
    Shell,
    SectionTitle,
    StatCard,
    CourseCard,
    primaryNav,
    secondaryNav,
    employerLogos,
    stories,
    courses,
    weeklySchedule,
    agenda,
    resources,
    discussions,
    dashboardAssignments,
    cohortMembers,
  };
})();
