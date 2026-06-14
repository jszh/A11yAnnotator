const { useState } = React;

const modeColors = {
  Discover: "#2563eb",
  Learn: "#0ea5e9",
  Present: "#8b5cf6",
  Create: "#14b8a6",
  Join: "#f97316",
};

function createLinks(base) {
  return {
    home: `${base}/index.html`,
    courses: `${base}/courses/courses.html`,
    courseDetail: `${base}/courses/detail.html`,
    subjects: `${base}/subjects/subjects.html`,
    curriculum: `${base}/curriculum/curriculum.html`,
    study: `${base}/study/study.html`,
    flashcards: `${base}/study/flashcards/flashcards.html`,
    test: `${base}/study/test/test.html`,
    plans: `${base}/plans/plans.html`,
    enterprise: `${base}/enterprise/enterprise.html`,
    dashboard: `${base}/dashboard/dashboard.html`,
    account: `${base}/account/account.html`,
  };
}

function AnnouncementBar() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="announcement" role="status" aria-live="polite">
      <span>New: Free AI learning planner in all study plans through March.</span>
      <button aria-label="Close announcement" onClick={() => setOpen(false)}>
        ×
      </button>
    </div>
  );
}

function GlobalHeader({ links, currentPath = "", navMode = "category" }) {
  const [expanded, setExpanded] = useState(false);
  const categoryNav = [
    ["Courses", links.courses],
    ["Subjects", links.subjects],
    ["Products", links.plans],
    ["Solutions", links.enterprise],
    ["Resources", links.curriculum],
    ["Company", links.enterprise],
  ];
  const learningNav = [
    ["Study", links.study],
    ["Flashcards", links.flashcards],
    ["Test", links.test],
    ["Match / Practice", links.study],
    ["Create", links.account],
  ];

  const navItems = navMode === "learning" ? learningNav : categoryNav;

  return (
    <header className="site-header" role="banner">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="header-top">
        <a className="logo" href={links.home} aria-label="Go to EduPortal home">
          <span className="logo-mark" aria-hidden="true">ED</span>
          <span>EduPortal</span>
        </a>

        <label className="search-wrap" aria-label="Search courses, subjects, and resources">
          <span aria-hidden="true">🔎</span>
          <input
            className="search-input"
            type="search"
            placeholder="Search courses, tools, and lesson standards"
          />
        </label>

        <div className="header-actions">
          <a className="link-btn" href={links.account}>Log in</a>
          <a className="btn primary" href={links.account}>Start free</a>
          <a className="btn outline" href={links.account} aria-label="Select language">
            EN
          </a>
          <a className="btn outline" href={links.account}>Create</a>
          <button
            className="mobile-toggle"
            aria-label="Toggle navigation menu"
            onClick={() => setExpanded((s) => !s)}
          >
            ☰
          </button>
        </div>
      </div>

      <nav className="header-nav" aria-label="Primary navigation" aria-expanded={expanded ? "true" : "false"}>
        <ul className="nav-list">
          {navItems.map(([label, href]) => (
            <li key={`${label}-${href}`}>
              <a href={href} className={currentPath === href ? "active" : ""}>{label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

function HeroCourseDiscovery({ links }) {
  return (
    <section className="hero" aria-labelledby="hero-course-title">
      <div className="hero-grid">
        <div>
          <p className="tag">Career Growth Pathways</p>
          <h1 id="hero-course-title">Launch a new role with guided learning tracks</h1>
          <p>
            Discover certificates, degree pathways, and industry projects designed with university
            and employer partners.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <a className="btn primary" href={links.courses}>Start learning</a>
            <a className="btn outline" href={links.subjects}>Explore subjects</a>
          </div>
        </div>
        <div className="hero-art" aria-label="Career and skill visual placeholder">
          Career Path Visual
        </div>
      </div>
    </section>
  );
}

function HeroLearningTool({ links }) {
  return (
    <section className="hero text-center" aria-labelledby="hero-learning-title">
      <p className="tag">Learning Tool</p>
      <h1 id="hero-learning-title">What do you want to master today?</h1>
      <p className="mx-auto max-w-2xl">
        Study smarter with spaced repetition, quick checks, and instant feedback for students and teachers.
      </p>
      <div className="flex justify-center flex-wrap gap-3 mt-4">
        <a className="btn primary" href={links.account}>Sign up free</a>
        <a className="btn outline" href={links.enterprise}>Switch to teacher mode</a>
      </div>
    </section>
  );
}

function HeroProductPlans({ links }) {
  const cards = [
    ["Starter", "Students", "$0 / month"],
    ["Pro", "Teachers", "$12 / seat"],
    ["Campus", "Institutions", "$99 / org"],
  ];
  return (
    <section className="hero" aria-labelledby="hero-plans-title">
      <h1 id="hero-plans-title">Pick the right plan for every learning scale</h1>
      <div className="plan-grid mt-4">
        {cards.map(([name, audience, price]) => (
          <PlanComparisonCard
            key={name}
            name={name}
            audience={audience}
            price={price}
            primaryHref={links.account}
            secondaryHref={links.plans}
          />
        ))}
      </div>
      <div className="action-bar mt-4" aria-label="Feature actions">
        {Object.keys(modeColors).map((label) => (
          <div key={label} className="action-chip" style={{ background: modeColors[label] }}>
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}

function HeroEnterpriseSaaS({ links }) {
  return (
    <section className="hero enterprise-hero" aria-labelledby="hero-enterprise-title">
      <h1 id="hero-enterprise-title">Support every learner with connected school intelligence</h1>
      <p>
        Unify attendance, assessment, and intervention with secure analytics for district and higher-ed teams.
      </p>
      <a className="btn primary mt-2" href={links.enterprise}>Explore solutions</a>
    </section>
  );
}

function LogoTrustStrip() {
  const logos = ["Stanford", "MITx", "AWS Academy", "Intel", "Teach For All", "UNESCO ED"];
  return (
    <section aria-label="Trusted by institutions">
      <h2 className="page-title">Trusted by universities and education partners</h2>
      <div className="logo-strip">
        {logos.map((logo) => (
          <div key={logo} className="logo-chip">{logo}</div>
        ))}
      </div>
    </section>
  );
}

function CategoryQuickGrid({ links }) {
  const items = [
    ["Career Path", "Role-aligned learning tracks", links.courses],
    ["Skill Learning", "Hands-on short courses", links.subjects],
    ["Degrees", "University-backed pathways", links.courses],
    ["Certificates", "Job-ready credentials", links.courses],
    ["Teacher Resources", "Classroom packs and rubrics", links.curriculum],
    ["Enterprise Training", "District and workforce programs", links.enterprise],
  ];
  return (
    <section aria-labelledby="quick-grid-title">
      <h2 id="quick-grid-title" className="page-title">Find your next learning path</h2>
      <div className="quick-grid">
        {items.map(([title, text, href]) => (
          <a key={title} className="card no-underline" href={href}>
            <h3 className="mt-0">{title}</h3>
            <p className="text-slate-600 mb-0">{text}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function LearningModeCard({ title, text, href, className }) {
  return (
    <a href={href} className={`card mode-card ${className}`}>
      <div>
        <h3 className="m-0 text-white">{title}</h3>
        <p className="mt-2 mb-0 text-white/90">{text}</p>
      </div>
      <span className="tag bg-white text-slate-800 w-max">Launch</span>
    </a>
  );
}

function PlanComparisonCard({ name, audience, price, primaryHref, secondaryHref }) {
  return (
    <article className="card">
      <span className="tag">{audience}</span>
      <h3>{name}</h3>
      <p className="metric">{price}</p>
      <div className="hero-art mt-3" style={{ minHeight: "110px" }}>Device Preview</div>
      <div className="flex gap-3 mt-3 flex-wrap">
        <a className="btn primary" href={primaryHref}>Try free</a>
        <a className="btn outline" href={secondaryHref}>See details</a>
      </div>
    </article>
  );
}

function EnterpriseSolutionCard({ title, text }) {
  return (
    <article className="card">
      <h3 className="mt-0">{title}</h3>
      <p className="mb-0 text-slate-600">{text}</p>
    </article>
  );
}

function CurriculumSidebar() {
  return (
    <aside className="sidebar p-4" aria-label="Curriculum navigation">
      <h3 className="mt-0">Standards</h3>
      <ul>
        <li><a href="#">Mathematics</a></li>
        <li><a href="#">Science</a></li>
        <li><a href="#">Computer Science</a></li>
      </ul>
      <details className="mt-4" open>
        <summary>Grade Levels</summary>
        <ul className="mt-2">
          <li><a href="#">Grade 6</a></li>
          <li><a href="#">Grade 7</a></li>
          <li><a href="#">Grade 8</a></li>
        </ul>
      </details>
    </aside>
  );
}

function LessonListItem({ title, type, icon }) {
  return (
    <article className="lesson-item">
      <div className="lesson-left">
        <span aria-hidden="true">{icon}</span>
        <div>
          <h3 className="my-0 text-base">{title}</h3>
          <p className="my-0 text-slate-500">{type}</p>
        </div>
      </div>
      <a className="btn outline" href="#">Open</a>
    </article>
  );
}

function ProgressWidget() {
  return (
    <section className="widget" aria-label="Learning progress widget">
      <h3 className="mt-0">Weekly Progress</h3>
      <div className="circle-progress" aria-hidden="true"><span>70%</span></div>
      <p className="mb-1">2h 40m remaining this week</p>
      <p className="mb-0 text-slate-600">Correct: 84 | Incorrect: 16</p>
    </section>
  );
}

function Footer({ links }) {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-inner">
        <div>
          <strong>EduPortal</strong>
          <p>Learning discovery for students, teachers, and institutions.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <p><a href={links.courses}>Courses</a></p>
          <p><a href={links.subjects}>Subjects</a></p>
          <p><a href={links.study}>Study Tools</a></p>
        </div>
        <div>
          <h4>Plans</h4>
          <p><a href={links.plans}>Pricing</a></p>
          <p><a href={links.enterprise}>Enterprise</a></p>
          <p><a href={links.dashboard}>Dashboard</a></p>
        </div>
        <div>
          <h4>Support</h4>
          <p><a href={links.account}>Account</a></p>
          <p><a href={links.curriculum}>Curriculum</a></p>
          <p><a href={links.home}>Home</a></p>
        </div>
      </div>
      <small>© 2026 EduPortal. Accessible learning for every stage.</small>
    </footer>
  );
}

function TrendingSection({ links }) {
  const items = [
    ["Popular Course", "AI for Educators", links.courseDetail],
    ["Trending Topic", "Data Literacy", links.subjects],
    ["Weekly Pick", "Presentation Skills", links.courses],
    ["AI Skill", "Prompt Engineering", links.courses],
  ];

  return (
    <section aria-labelledby="trending-title">
      <h2 id="trending-title" className="page-title">Trending and featured content</h2>
      <div className="mode-scroller">
        {items.map(([label, title, href]) => (
          <a key={title} href={href} className="card no-underline">
            <span className="tag">{label}</span>
            <h3>{title}</h3>
            <p className="mb-0 text-slate-600">Explore now</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function LearningModes({ links }) {
  return (
    <section aria-labelledby="learning-modes-title">
      <h2 id="learning-modes-title" className="page-title">Learning modes</h2>
      <div className="mode-scroller">
        <LearningModeCard title="Study" text="Adaptive review sessions" href={links.study} className="mode-study" />
        <LearningModeCard title="Flashcards" text="Spaced repetition deck" href={links.flashcards} className="mode-flashcards" />
        <LearningModeCard title="Test" text="Timed checks with hints" href={links.test} className="mode-test" />
        <LearningModeCard title="Match" text="Quick memory challenge" href={links.study} className="mode-match" />
      </div>
    </section>
  );
}

function EnterpriseSolutions() {
  const items = [
    ["Security", "District-grade permissions and data protection controls."],
    ["Analytics", "Live performance insights by class, school, and district."],
    ["Student Data", "Unified profile and attendance signals across systems."],
    ["Performance Tracking", "Intervention workflows and outcome tracking."],
  ];
  return (
    <section aria-labelledby="enterprise-solutions-title">
      <h2 id="enterprise-solutions-title" className="page-title">Enterprise solutions</h2>
      <div className="solution-grid">
        {items.map(([title, text]) => <EnterpriseSolutionCard key={title} title={title} text={text} />)}
      </div>
    </section>
  );
}

function CurriculumSection() {
  const lessons = [
    ["Intro to Linear Relationships", "Video", "▶"],
    ["Practice: Graphing Lines", "Practice", "✓"],
    ["Article: Slope in Real Life", "Article", "📄"],
    ["Quiz Checkpoint", "Assessment", "🧪"],
  ];
  return (
    <section className="split" aria-label="Curriculum content structure">
      <CurriculumSidebar />
      <div className="surface">
        <h1 className="mt-0">Mathematics Standards</h1>
        <p className="text-slate-600">Unit 3: Expressions and Linear Equations</p>
        <p className="text-slate-700">
          Objective: Students interpret rate of change and model relationships using graphs and equations.
        </p>
        <div className="flex gap-3 mt-2 mb-4">
          <a className="btn outline" href="#" aria-label="Download CSV">Download CSV</a>
          <a className="btn outline" href="#" aria-label="Export resources">Export Resources</a>
        </div>
        <div className="lesson-list">
          {lessons.map(([title, type, icon]) => (
            <LessonListItem key={title} title={title} type={type} icon={icon} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardSection({ links }) {
  return (
    <section className="dashboard-grid" aria-label="Dashboard overview">
      <article className="card">
        <h2 className="mt-0">Today</h2>
        <p className="text-slate-600">3 classes, 2 assignments due, 1 assessment review.</p>
        <a className="btn outline" href={links.study}>Go to study mode</a>
      </article>
      <ProgressWidget />
      <article className="card">
        <h2 className="mt-0">Teacher Snapshot</h2>
        <p className="text-slate-600">Class completion: 76% | Engagement score: High</p>
        <a className="btn outline" href={links.enterprise}>View institution tools</a>
      </article>
    </section>
  );
}

function AccountSection() {
  return (
    <section className="surface" aria-labelledby="account-title">
      <h1 id="account-title" className="mt-0">Account Center</h1>
      <p className="text-slate-600">Manage profile, learning goals, billing, and security.</p>
      <form className="grid gap-4 max-w-2xl" aria-label="Account preferences">
        <label>
          Full name
          <input className="search-input mt-2" type="text" placeholder="Alex Rivera" />
        </label>
        <label>
          Email
          <input className="search-input mt-2" type="email" placeholder="alex@example.edu" />
        </label>
        <label>
          Learning role
          <select className="search-input mt-2" defaultValue="student">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Institution Admin</option>
          </select>
        </label>
        <button className="btn primary w-max" type="submit">Save changes</button>
      </form>
    </section>
  );
}

function SegmentCards({ links }) {
  const items = [
    ["Start new career", "Build from beginner to interview-ready skills", links.courses],
    ["Gain job skills", "Focused project-based tracks in 4-8 weeks", links.subjects],
    ["Earn degree", "Transferable credit from partner institutions", links.enterprise],
  ];
  return (
    <section className="card-row" aria-label="Audience segments">
      {items.map(([title, text, href]) => (
        <a key={title} href={href} className="card no-underline">
          <h3 className="mt-0">{title}</h3>
          <p className="mb-0 text-slate-600">{text}</p>
        </a>
      ))}
    </section>
  );
}

function PageMain({ page, links }) {
  const discoveryPages = ["home", "courses", "subjects"];
  const learningPages = ["study", "flashcards", "test"];

  return (
    <main id="main-content" className="page-container" tabIndex="-1">
      {discoveryPages.includes(page) && <HeroCourseDiscovery links={links} />}
      {page === "home" && <SegmentCards links={links} />}

      {learningPages.includes(page) && <HeroLearningTool links={links} />}

      {page === "plans" && <HeroProductPlans links={links} />}
      {page === "enterprise" && <HeroEnterpriseSaaS links={links} />}

      {(page === "home" || page === "courses" || page === "subjects") && <LogoTrustStrip />}

      {(page === "home" || page === "courses" || page === "subjects") && <CategoryQuickGrid links={links} />}
      {(page === "home" || page === "courses" || page === "subjects") && <TrendingSection links={links} />}

      {(page === "study" || page === "flashcards" || page === "test") && <LearningModes links={links} />}
      {(page === "study" || page === "flashcards" || page === "test") && <ProgressWidget />}

      {page === "plans" && (
        <section>
          <h2 className="page-title">Compare plans at a glance</h2>
          <div className="plan-grid">
            <PlanComparisonCard name="Starter" audience="Students" price="$0 / month" primaryHref={links.account} secondaryHref={links.plans} />
            <PlanComparisonCard name="Pro" audience="Teachers" price="$12 / seat" primaryHref={links.account} secondaryHref={links.plans} />
            <PlanComparisonCard name="Campus" audience="Institutions" price="$99 / org" primaryHref={links.account} secondaryHref={links.plans} />
          </div>
        </section>
      )}

      {page === "enterprise" && <EnterpriseSolutions />}
      {page === "curriculum" && <CurriculumSection />}
      {page === "dashboard" && <DashboardSection links={links} />}
      {page === "account" && <AccountSection />}

      {page === "courseDetail" && (
        <section className="surface" aria-labelledby="course-detail-title">
          <span className="tag">Single Course Detail</span>
          <h1 id="course-detail-title">Applied Data Skills for Educators</h1>
          <p className="text-slate-600">8 modules • Intermediate • Certificate eligible</p>
          <div className="hero-grid mt-4">
            <div>
              <p>
                Learn analytics workflows for classroom interventions, assessment analysis, and curriculum planning.
              </p>
              <div className="flex gap-3 flex-wrap">
                <a className="btn primary" href={links.account}>Enroll now</a>
                <a className="btn outline" href={links.courses}>Back to marketplace</a>
              </div>
            </div>
            <div className="hero-art">Course Preview</div>
          </div>
          <section className="mt-5">
            <h2>Course Modules</h2>
            <div className="lesson-list">
              <LessonListItem title="Module 1: Data Basics" type="Video" icon="▶" />
              <LessonListItem title="Module 2: Metrics and KPIs" type="Article" icon="📄" />
              <LessonListItem title="Module 3: Intervention Planning" type="Practice" icon="✓" />
            </div>
          </section>
        </section>
      )}
    </main>
  );
}

function App({ page = "home", basePath = "." }) {
  const links = createLinks(basePath);
  const current = (() => {
    switch (page) {
      case "home": return links.home;
      case "courses": return links.courses;
      case "courseDetail": return links.courseDetail;
      case "subjects": return links.subjects;
      case "curriculum": return links.curriculum;
      case "study": return links.study;
      case "flashcards": return links.flashcards;
      case "test": return links.test;
      case "plans": return links.plans;
      case "enterprise": return links.enterprise;
      case "dashboard": return links.dashboard;
      case "account": return links.account;
      default: return "";
    }
  })();

  const navMode = ["study", "flashcards", "test"].includes(page) ? "learning" : "category";

  return (
    <>
      <AnnouncementBar />
      <GlobalHeader links={links} currentPath={current} navMode={navMode} />
      <PageMain page={page} links={links} />
      <Footer links={links} />
    </>
  );
}

window.EduPortal = {
  mount: ({ page, basePath, rootId = "root" }) => {
    const root = ReactDOM.createRoot(document.getElementById(rootId));
    root.render(<App page={page} basePath={basePath} />);
  },
};
