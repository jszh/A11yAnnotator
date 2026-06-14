const { useEffect, useMemo, useRef, useState } = React;
const html = htm.bind(React.createElement);

const SkillForge = (() => {
  const navLinks = [
    { href: "./index.html", label: "Home" },
    { href: "./courses.html", label: "Programs" },
    { href: "./course-detail.html", label: "Certificate" },
    { href: "./classroom.html", label: "Classroom" },
    { href: "./pricing.html", label: "Plans" },
    { href: "./dashboard.html", label: "Dashboard" },
  ];

  const employerPartners = ["Google", "Mayo Clinic", "Deloitte"];

  const courseCatalog = [
    {
      id: "medical-admin",
      title: "Medical Administrative Assistant Certificate",
      instructor: "Dr. Lena Ortiz, RHIA",
      field: "Healthcare Support",
      format: "Cohort",
      duration: "8 weeks",
      hours: 72,
      costTier: "$500+",
      price: 349,
      credential: "Certificate",
      nextStart: "March 3",
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
      summary: "Train for front-office healthcare roles with live labs, EHR practice, and employer-reviewed workflows.",
    },
    {
      id: "it-support",
      title: "IT Support Specialist Track",
      instructor: "Marcus Bell, CompTIA A+",
      field: "IT",
      format: "Self-Paced",
      duration: "10 weeks",
      hours: 84,
      costTier: "Under $500",
      price: 429,
      credential: "Badge",
      nextStart: "Start today",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      summary: "Build help desk, troubleshooting, and ticketing fluency with guided labs and certification prep.",
    },
    {
      id: "electrical-tech",
      title: "Residential Electrical Technician Foundations",
      instructor: "Aisha Patel, Master Electrician",
      field: "Trades",
      format: "Live Online",
      duration: "12 weeks",
      hours: 96,
      costTier: "$500+",
      price: 620,
      credential: "CEU",
      nextStart: "April 9",
      image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80",
      summary: "Move from safety basics to blueprint reading and code-aligned installation planning.",
    },
    {
      id: "business-admin",
      title: "Business Administration Career Starter",
      instructor: "Naomi Brooks, MBA",
      field: "Business Administration",
      format: "Cohort",
      duration: "6 weeks",
      hours: 48,
      costTier: "Under $500",
      price: 299,
      credential: "Certificate",
      nextStart: "March 17",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
      summary: "Learn operations, scheduling, spreadsheets, and communication systems for office roles.",
    },
    {
      id: "sterile-processing",
      title: "Sterile Processing Technician Prep",
      instructor: "Renee Wallace, CRCST",
      field: "Healthcare Support",
      format: "Self-Paced",
      duration: "8 weeks",
      hours: 58,
      costTier: "Free",
      price: 0,
      credential: "Badge",
      nextStart: "Start today",
      image: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
      summary: "Explore instrument handling, infection prevention, and exam readiness with mentor feedback.",
    },
    {
      id: "bookkeeping",
      title: "Bookkeeping and Payroll Foundations",
      instructor: "Elliot Kane, CPA",
      field: "Business Administration",
      format: "Live Online",
      duration: "7 weeks",
      hours: 52,
      costTier: "Under $500",
      price: 465,
      credential: "Certificate",
      nextStart: "March 24",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
      summary: "Practice payroll workflows, reconciliations, and client-ready reporting with live instruction.",
    },
  ];

  const successStories = [
    {
      name: "Camille R.",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
      before: "Retail supervisor",
      after: "Medical front desk coordinator at Mayo Clinic partner network",
      quote: "The cohort pacing and office simulations made the transition realistic, not abstract.",
    },
    {
      name: "Jordan T.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
      before: "Warehouse associate",
      after: "Tier 1 IT support specialist",
      quote: "I needed a track that respected my work schedule. SkillForge gave me a path I could actually finish.",
    },
    {
      name: "Elena M.",
      image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&q=80",
      before: "Caregiver",
      after: "Billing specialist with employer tuition reimbursement",
      quote: "The instructors taught the role, not just the theory. That changed my confidence completely.",
    },
  ];

  const courseDetail = {
    ...courseCatalog[0],
    outcomes: [
      "Manage patient intake, scheduling, insurance verification, and EHR documentation workflows.",
      "Communicate with providers, patients, and billing teams using role-based scripts and escalation paths.",
      "Prepare for entry-level medical administration interviews with employer-reviewed portfolio tasks.",
    ],
    schedule: [
      { week: "Week 1", title: "Clinical front office systems", detail: "Patient intake, privacy standards, and front-desk communication." },
      { week: "Week 2", title: "Insurance and eligibility checks", detail: "Coverage validation, benefits coordination, and payer terminology." },
      { week: "Week 3", title: "Medical billing fundamentals", detail: "Coding basics, claims pathways, and denial-prevention workflows." },
      { week: "Week 4", title: "Scheduling and referral operations", detail: "Calendar management, referrals, and provider support." },
      { week: "Week 5", title: "EHR documentation labs", detail: "Hands-on charting exercises and scenario review." },
      { week: "Week 6", title: "Revenue cycle coordination", detail: "Copays, claims follow-up, and payment workflows." },
      { week: "Week 7", title: "Career prep studio", detail: "Resume refinement, mock interviews, and employer panels." },
      { week: "Week 8", title: "Capstone and placement sprint", detail: "Final scenario assessment and placement coaching." },
    ],
    materials: [
      "Laptop or tablet with webcam and reliable broadband connection",
      "Notebook or printable weekly workbook",
      "Access to the included SkillForge EHR simulation sandbox",
    ],
    qaSessions: [
      "Tuesdays at 7:00 PM ET",
      "Thursdays at 12:30 PM ET",
      "Saturday office hour: 10:00 AM ET",
    ],
  };

  const dashboardData = {
    dueDates: [
      { day: "12", label: "SOAP note worksheet" },
      { day: "14", label: "Billing discussion post" },
      { day: "16", label: "Live Q&A RSVP" },
      { day: "18", label: "Module 3 quiz" },
    ],
    cohort: ["Camille", "Jordan", "Mina", "Theo", "Sofia"],
    recommendations: [
      "Live claims scrubbing workshop",
      "Medical terminology flashcards",
      "Interview clinic with employer panel",
    ],
    achievements: [
      "Attendance streak: 3 live sessions",
      "Billing basics badge unlocked",
      "Projected completion: April 18",
    ],
  };

  const classroomLessons = [
    { id: "lesson-1", title: "Insurance terminology essentials", duration: "11 min", completed: true },
    { id: "lesson-2", title: "Front desk call routing", duration: "9 min", completed: true },
    { id: "lesson-3", title: "Claims status workflows", duration: "14 min", completed: false },
    { id: "lesson-4", title: "Denial prevention checklist", duration: "12 min", completed: false },
  ];

  function announce(message) {
    const region = document.getElementById("global-live-region");
    if (!region) return;
    region.textContent = "";
    window.setTimeout(() => {
      region.textContent = message;
    }, 50);
  }

  function formatPrice(price) {
    return price === 0 ? "Free" : `$${price}`;
  }

  function Header() {
    return html`
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 lg:px-8">
          <a href="./index.html" className="focus-ring flex shrink-0 items-center gap-3 rounded-full border border-white/70 bg-white px-4 py-2 text-sm font-semibold tracking-[0.22em] text-slate-900 shadow-sm" aria-label="SkillForge home">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white">SF</span>
            <span>SKILLFORGE</span>
          </a>
          <nav aria-label="Primary" className="hidden flex-1 justify-center lg:flex">
            <ul className="flex flex-wrap items-center gap-2">
              ${navLinks.map((link) => html`
                <li key=${link.href}>
                  <a href=${link.href} className="focus-ring rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950">
                    ${link.label}
                  </a>
                </li>
              `)}
            </ul>
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <a href="./pricing.html" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Try Free</a>
            <a href="./dashboard.html" className="focus-ring rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Sign Up</a>
          </div>
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <a href="./courses.html" className="focus-ring rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Programs</a>
            <a href="./dashboard.html" className="focus-ring rounded-full bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Sign Up</a>
          </div>
        </div>
        <nav aria-label="Mobile primary" className="border-t border-slate-200/80 bg-white/95 px-4 py-3 lg:hidden">
          <ul className="flex flex-wrap gap-2">
            ${navLinks.map((link) => html`
              <li key=${`mobile-${link.href}`}>
                <a href=${link.href} className="focus-ring rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                  ${link.label}
                </a>
              </li>
            `)}
          </ul>
        </nav>
      </header>
    `;
  }

  function Footer() {
    return html`
      <footer className="border-t border-slate-200 bg-slate-950 text-slate-200">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-4 lg:px-8">
          <section aria-labelledby="footer-brand">
            <h2 id="footer-brand" className="text-lg font-semibold text-white">SkillForge</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Vocational and professional certificates for adult learners ready to move into healthcare support, IT, trades, and business operations.</p>
          </section>
          <section aria-labelledby="footer-programs">
            <h2 id="footer-programs" className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Programs</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="./courses.html" className="focus-ring rounded text-slate-300 hover:text-white">Browse certificates</a></li>
              <li><a href="./course-detail.html" className="focus-ring rounded text-slate-300 hover:text-white">Featured cohort</a></li>
              <li><a href="./classroom.html" className="focus-ring rounded text-slate-300 hover:text-white">Learning tools</a></li>
            </ul>
          </section>
          <section aria-labelledby="footer-support">
            <h2 id="footer-support" className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Support</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="./pricing.html" className="focus-ring rounded text-slate-300 hover:text-white">Pricing and aid</a></li>
              <li><a href="./dashboard.html" className="focus-ring rounded text-slate-300 hover:text-white">Student dashboard</a></li>
              <li><a href="./course-detail.html#qa-sessions" className="focus-ring rounded text-slate-300 hover:text-white">Live Q&A schedule</a></li>
            </ul>
          </section>
          <section aria-labelledby="footer-trust">
            <h2 id="footer-trust" className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Credibility</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Employer-informed curriculum, verified instructors, and milestone coaching built for career changers balancing work and life.</p>
          </section>
        </div>
      </footer>
    `;
  }

  function PageShell({ title, eyebrow, description, children }) {
    return html`
      <div className="page-shell">
        <a href="#main-content" className="focus-ring sr-only rounded bg-white px-4 py-2 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">Skip to main content</a>
        <${Header} />
        <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <section className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-700">${eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 lg:text-5xl">${title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 lg:text-lg">${description}</p>
          </section>
          ${children}
        </main>
        <${Footer} />
      </div>
    `;
  }

  function StatChip({ label, value, tone = "blue" }) {
    const tones = {
      blue: "bg-blue-50 text-blue-800",
      gold: "bg-amber-100 text-amber-900",
      mint: "bg-emerald-100 text-emerald-900",
      slate: "bg-slate-100 text-slate-800",
    };

    return html`
      <div className=${`rounded-3xl px-4 py-3 ${tones[tone]}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em]">${label}</p>
        <p className="mt-1 text-xl font-semibold">${value}</p>
      </div>
    `;
  }

  function ProgressTag({ value, label }) {
    return html`
      <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" aria-label=${label}>
        ${value}
      </div>
    `;
  }

  function AccreditationBadge({ label }) {
    return html`
      <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-900" aria-label=${`${label} accreditation badge`}>
          ✓
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-950">${label}</p>
          <p className="text-xs text-slate-500">Verified quality signal</p>
        </div>
      </div>
    `;
  }

  function CourseCard({ course }) {
    return html`
      <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <img src=${course.image} alt=${`${course.title} program preview`} className="h-56 w-full object-cover" />
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-800" aria-label=${`${course.format} format`}>
              ${course.format}
            </span>
            <span className="text-sm font-medium text-slate-500">${course.credential}</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">${course.title}</h2>
            <p className="mt-1 text-sm text-slate-500">${course.instructor}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">${course.summary}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-slate-950">Next start</dt>
              <dd>${course.nextStart}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Total hours</dt>
              <dd>${course.hours} hours</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Duration</dt>
              <dd>${course.duration}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Cost</dt>
              <dd>${formatPrice(course.price)}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-semibold text-slate-950">${formatPrice(course.price)}</p>
            <a
              href=${course.id === "medical-admin" ? "./course-detail.html" : "./courses.html"}
              className="focus-ring rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              aria-label=${`Enroll now in ${course.title} with instructor ${course.instructor}`}
            >
              Enroll Now
            </a>
          </div>
        </div>
      </article>
    `;
  }

  function Modal({ open, title, description, children, onClose }) {
    const dialogRef = useRef(null);
    const lastFocused = useRef(null);

    useEffect(() => {
      if (!open) return undefined;
      lastFocused.current = document.activeElement;
      const node = dialogRef.current;
      const getFocusable = () => Array.from(node.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter((item) => !item.hasAttribute("disabled"));
      const focusable = getFocusable();
      if (focusable.length) {
        focusable[0].focus();
      }

      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
          return;
        }
        if (event.key !== "Tab") return;
        const current = getFocusable();
        if (!current.length) {
          event.preventDefault();
          return;
        }
        const first = current[0];
        const last = current[current.length - 1];
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

    return html`
      <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
        <div ref=${dialogRef} role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description" className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="dialog-title" className="text-2xl font-semibold text-slate-950">${title}</h2>
              <p id="dialog-description" className="mt-2 text-sm leading-6 text-slate-600">${description}</p>
            </div>
            <button type="button" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" aria-label=${`Close ${title}`} onClick=${onClose}>Close</button>
          </div>
          <div className="mt-6">${children}</div>
        </div>
      </div>
    `;
  }

  function CurriculumAccordion({ sections }) {
    const [openIndex, setOpenIndex] = useState(0);

    const onToggle = (index) => {
      setOpenIndex((current) => current === index ? -1 : index);
    };

    return html`
      <ul className="space-y-4">
        ${sections.map((section, index) => {
          const isOpen = openIndex === index;
          const buttonId = `curriculum-trigger-${index}`;
          const panelId = `curriculum-panel-${index}`;
          return html`
            <li key=${section.week} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white">
              <h3 className="text-lg font-semibold text-slate-950">
                <button
                  id=${buttonId}
                  type="button"
                  className="focus-ring flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                  aria-expanded=${isOpen}
                  aria-controls=${panelId}
                  onClick=${() => onToggle(index)}
                  onKeyDown=${(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onToggle(index);
                    }
                  }}
                >
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">${section.week}</span>
                    <span className="mt-1 block text-lg font-semibold text-slate-950">${section.title}</span>
                  </span>
                  <span className="text-2xl text-slate-500" aria-hidden="true">${isOpen ? "−" : "+"}</span>
                </button>
              </h3>
              <div id=${panelId} role="region" aria-labelledby=${buttonId} className=${isOpen ? "px-5 pb-5" : "hidden"}>
                <p className="text-sm leading-6 text-slate-600">${section.detail}</p>
              </div>
            </li>
          `;
        })}
      </ul>
    `;
  }

  function TabGroup({ tabs, label }) {
    const [active, setActive] = useState(0);
    const tabRefs = useRef([]);

    const onKeyDown = (event, index) => {
      const lastIndex = tabs.length - 1;
      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = index === lastIndex ? 0 : index + 1;
      if (event.key === "ArrowLeft") nextIndex = index === 0 ? lastIndex : index - 1;
      if (nextIndex !== index) {
        event.preventDefault();
        setActive(nextIndex);
        window.setTimeout(() => tabRefs.current[nextIndex]?.focus(), 0);
      }
    };

    return html`
      <div>
        <div role="tablist" aria-label=${label} className="flex flex-wrap gap-2">
          ${tabs.map((tab, index) => html`
            <button
              key=${tab.label}
              ref=${(node) => { tabRefs.current[index] = node; }}
              type="button"
              role="tab"
              id=${`tab-${label}-${index}`}
              aria-selected=${active === index}
              aria-controls=${`panel-${label}-${index}`}
              tabIndex=${active === index ? 0 : -1}
              className=${`focus-ring rounded-full px-4 py-2 text-sm font-semibold ${active === index ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}
              onClick=${() => setActive(index)}
              onKeyDown=${(event) => onKeyDown(event, index)}
            >
              ${tab.label}
            </button>
          `)}
        </div>
        ${tabs.map((tab, index) => html`
          <div
            key=${`panel-${tab.label}`}
            role="tabpanel"
            id=${`panel-${label}-${index}`}
            aria-labelledby=${`tab-${label}-${index}`}
            hidden=${active !== index}
            className="mt-6"
          >
            ${tab.content}
          </div>
        `)}
      </div>
    `;
  }

  return {
    html,
    announce,
    navLinks,
    employerPartners,
    courseCatalog,
    successStories,
    courseDetail,
    dashboardData,
    classroomLessons,
    formatPrice,
    Header,
    Footer,
    PageShell,
    StatChip,
    ProgressTag,
    AccreditationBadge,
    CourseCard,
    Modal,
    CurriculumAccordion,
    TabGroup,
  };
})();

window.SkillForge = SkillForge;
