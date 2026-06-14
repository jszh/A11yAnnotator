const { useState } = React;

const primaryNav = [
  { label: "Home", href: "index.html" },
  { label: "Courses", href: "courses.html" },
  { label: "Learning Tool", href: "study.html" },
  { label: "Pricing", href: "pricing.html" },
  { label: "Dashboard", href: "dashboard.html" },
];

const exploreNav = [
  { label: "Technology", href: "courses.html" },
  { label: "Business", href: "courses.html" },
  { label: "Design", href: "courses.html" },
  { label: "Certificates", href: "course-detail.html" },
  { label: "For Teams", href: "pricing.html" },
];

const categories = [
  { name: "Web Development", meta: "128 courses", accent: "from-sky-600 to-cyan-400" },
  { name: "Data Science", meta: "94 courses", accent: "from-emerald-600 to-teal-400" },
  { name: "UX Design", meta: "61 courses", accent: "from-indigo-600 to-blue-400" },
  { name: "Business", meta: "78 courses", accent: "from-orange-500 to-amber-400" },
  { name: "Photography", meta: "42 courses", accent: "from-slate-700 to-slate-500" },
];

const courses = [
  {
    id: 1,
    title: "Python for Data Science",
    instructor: "Dr. Maya Chen",
    rating: 4.8,
    enrolled: "184k",
    price: "$49",
    duration: "24 hours",
    level: "Intermediate",
    category: "Data Science",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    blurb: "Build practical data pipelines, visualize results, and work with NumPy, pandas, and model-ready datasets.",
  },
  {
    id: 2,
    title: "Modern Front-End Foundations",
    instructor: "Avery Brooks",
    rating: 4.7,
    enrolled: "126k",
    price: "$39",
    duration: "18 hours",
    level: "Beginner",
    category: "Web Development",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    blurb: "Learn HTML, CSS, React patterns, and shipping workflows through portfolio-grade projects.",
  },
  {
    id: 3,
    title: "Product Strategy for Growth Teams",
    instructor: "Jordan Ellis",
    rating: 4.9,
    enrolled: "89k",
    price: "$59",
    duration: "16 hours",
    level: "Advanced",
    category: "Business",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    blurb: "Tie product strategy to execution with roadmaps, stakeholder management, and market analysis.",
  },
  {
    id: 4,
    title: "UX Research and Interface Systems",
    instructor: "Nina Patel",
    rating: 4.8,
    enrolled: "72k",
    price: "$44",
    duration: "20 hours",
    level: "Intermediate",
    category: "UX Design",
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80",
    blurb: "Move from research synthesis to interaction patterns and design systems with real client briefs.",
  },
  {
    id: 5,
    title: "Digital Photography Masterclass",
    instructor: "Leo Martinez",
    rating: 4.6,
    enrolled: "58k",
    price: "Free",
    duration: "12 hours",
    level: "Beginner",
    category: "Photography",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    blurb: "Understand composition, lighting, editing basics, and portfolio curation across multiple shooting scenarios.",
  },
  {
    id: 6,
    title: "SQL Analytics for Decision Making",
    instructor: "Priya Nair",
    rating: 4.7,
    enrolled: "101k",
    price: "$29",
    duration: "14 hours",
    level: "Intermediate",
    category: "Data Science",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    blurb: "Write production-ready queries and translate business questions into defensible metrics.",
  },
];

const reviews = [
  {
    name: "Anika S.",
    role: "Data Analyst",
    copy: "The pacing was excellent. I used the case studies directly in my portfolio and landed interviews within a month.",
  },
  {
    name: "Marcus T.",
    role: "Career Switcher",
    copy: "Structured without being rigid. The lesson notes and checkpoints made it much easier to stay consistent after work.",
  },
  {
    name: "Helena R.",
    role: "Product Designer",
    copy: "This felt credible and practical. The instructors clearly work in the field and the projects mirror real team workflows.",
  },
];

const curriculum = [
  ["Foundations of Python and notebooks", "6 lessons"],
  ["Cleaning, exploring, and visualizing data", "7 lessons"],
  ["Data structures for analysis workflows", "8 lessons"],
  ["Feature engineering and model preparation", "5 lessons"],
  ["Capstone case study and certificate assessment", "6 lessons"],
];

const lessonModules = [
  {
    title: "Module 1: Core Python",
    lessons: ["Lesson 1: Environment setup", "Lesson 2: Variables and loops", "Lesson 3: Functions in practice"],
  },
  {
    title: "Module 2: Data Structures",
    lessons: ["Lesson 4: Lists and slicing", "Lesson 5: Dictionaries", "Lesson 6: Data wrangling exercises"],
  },
  {
    title: "Module 3: Analysis Workflow",
    lessons: ["Lesson 7: DataFrames", "Lesson 8: Visual storytelling", "Lesson 9: Summary checkpoints"],
  },
  {
    title: "Module 4: Applied Project",
    lessons: ["Lesson 10: Project brief", "Lesson 11: Model inputs", "Lesson 12: Presentation review"],
  },
];

function stars(rating) {
  return `${rating.toFixed(1)} ★`;
}

function enrollmentCount(value) {
  return Number.parseFloat(value.replace("k", "")) * 1000;
}

function Logo() {
  return (
    <a href="index.html" className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-extrabold text-white shadow-lg shadow-slate-300">
        LP
      </div>
      <div>
        <div className="text-lg font-extrabold tracking-tight text-slate-950">LearnPath</div>
        <div className="text-xs text-slate-500">Structured learning for ambitious careers</div>
      </div>
    </a>
  );
}

function Header({ currentPage }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="hidden flex-1 lg:block">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400 shadow-inner shadow-white">
            Search programs, skills, certificates, or instructors
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
                  active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <a href="pricing.html" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
            Try Free
          </a>
          <a href="dashboard.html" className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-100">
            Sign Up
          </a>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/80">
        <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 py-3 text-sm text-slate-600 sm:px-6 lg:px-8">
          <span className="font-semibold text-slate-950">Explore</span>
          {exploreNav.map((item) => (
            <a key={item.label} href={item.href} className="whitespace-nowrap hover:text-slate-950">
              {item.label}
            </a>
          ))}
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
          <div className="text-xl font-extrabold text-white">LearnPath</div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Structured online education across technology, business, design, and personal development.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Platform</div>
          <div className="mt-4 space-y-3 text-sm">
            <a href="courses.html" className="block hover:text-white">Browse courses</a>
            <a href="study.html" className="block hover:text-white">Learning experience</a>
            <a href="pricing.html" className="block hover:text-white">Plans & pricing</a>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Resources</div>
          <div className="mt-4 space-y-3 text-sm">
            <a href="course-detail.html" className="block hover:text-white">Featured certificate</a>
            <a href="dashboard.html" className="block hover:text-white">Learner dashboard</a>
            <a href="index.html" className="block hover:text-white">Success stories</a>
          </div>
        </div>
        <div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="text-base font-semibold text-white">Institution-ready learning</div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Trusted by enterprise teams and universities for curated pathways, analytics, and verified completion.
            </p>
            <a href="pricing.html" className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">
              Explore Teams
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

function CourseCard({ course }) {
  return (
    <article className="course-card rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="aspect-[4/3] overflow-hidden rounded-[24px] bg-slate-100">
        <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{course.category}</span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{course.level}</span>
        </div>
        <h3 className="mt-3 text-lg font-bold text-slate-950">{course.title}</h3>
        <div className="mt-2 text-sm text-slate-500">{course.instructor}</div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{course.blurb}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span className="font-semibold text-amber-500">{stars(course.rating)}</span>
          <span>{course.duration}</span>
          <span>{course.enrolled} enrolled</span>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-xl font-extrabold text-slate-950">{course.price}</div>
          <a href="course-detail.html" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            View Course
          </a>
        </div>
      </div>
    </article>
  );
}

function HomePage() {
  return (
    <PageShell currentPage="index.html">
      <section className="mx-auto mt-8 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.3fr_0.7fr] lg:px-8">
        <div className="hero-panel rounded-[36px] bg-gradient-to-br from-slate-950 via-sky-900 to-teal-500 p-8 text-white shadow-2xl shadow-sky-100 sm:p-10">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
            Join 2M+ learners worldwide
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            Unlock Your Potential. Learn at Your Own Pace.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-sky-50/90">
            LearnPath combines university-style structure with flexible online learning across technology, business,
            design, and personal development.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="courses.html" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">
              Browse Courses
            </a>
            <a href="pricing.html" className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white">
              Start Free Trial
            </a>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["350+", "Expert-led courses"],
              ["92%", "Learner completion lift"],
              ["4.8/5", "Average course rating"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <div className="text-2xl font-extrabold">{value}</div>
                <div className="mt-1 text-sm text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Learning Pathway</div>
            <div className="mt-3 text-2xl font-extrabold text-slate-950">From skill discovery to verified completion</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Explore curated pathways, build evidence through projects, and track progress from one dashboard.
            </p>
            <a href="dashboard.html" className="mt-5 inline-flex rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white">
              See Dashboard
            </a>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Institutional Trust</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {["Verified certificates", "Employer-ready projects", "Mentor office hours", "Teams analytics"].map((item) => (
                <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionIntro eyebrow="Categories" title="Explore high-demand learning tracks" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => (
            <a key={category.name} href="courses.html" className={`lift-card rounded-[30px] bg-gradient-to-br ${category.accent} p-5 text-white shadow-lg`}>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">LearnPath Track</div>
              <div className="mt-12 text-2xl font-extrabold tracking-tight">{category.name}</div>
              <div className="mt-2 text-sm text-white/80">{category.meta}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionIntro
          eyebrow="Featured Courses"
          title="Start with learner favorites"
          copy="These flagship courses balance credibility, practical depth, and clear outcomes."
          action="Browse All Courses"
          href="courses.html"
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {courses.slice(0, 3).map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm font-semibold text-slate-500">
            <span className="text-slate-950">Trusted by learners, teams, and academic partners</span>
            <span>Join 2M+ learners worldwide</span>
            <span>Fortune 500 upskilling programs</span>
            <span>University-aligned pathways</span>
            <span>Career certificate outcomes</span>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionIntro eyebrow="How It Works" title="A simple path to meaningful progress" />
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {[
            ["1. Discover", "Browse role-based paths and compare skills, difficulty, and time commitment before you start."],
            ["2. Learn", "Follow structured modules with lessons, notes, resources, and applied practice in one workspace."],
            ["3. Advance", "Earn certificates, track streaks, and use recommendations to keep momentum after completion."],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">{title}</div>
              <p className="mt-4 text-base leading-7 text-slate-600">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function CoursesPage() {
  const [sort, setSort] = useState("Most Popular");
  const sortedCourses = [...courses].sort((a, b) => {
    if (sort === "Highest Rated") return b.rating - a.rating;
    if (sort === "Newest") return b.id - a.id;
    return enrollmentCount(b.enrolled) - enrollmentCount(a.enrolled);
  });

  return (
    <PageShell currentPage="courses.html">
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Course Catalog</div>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">Browse structured programs by goal, level, and time</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Compare outcomes across technology, business, design, and creative disciplines with consistent filters and clear pathways.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Filters</div>
            <div className="mt-6 space-y-6 text-sm">
              {[
                ["Category", ["Web Development", "Data Science", "UX Design", "Business", "Photography"]],
                ["Level", ["Beginner", "Intermediate", "Advanced"]],
                ["Duration", ["0-5 hours", "6-15 hours", "16-25 hours", "25+ hours"]],
                ["Rating", ["4.5 and up", "4.0 and up", "3.5 and up"]],
                ["Price", ["Free", "Paid"]],
              ].map(([group, items]) => (
                <div key={group}>
                  <div className="font-semibold text-slate-950">{group}</div>
                  <div className="mt-3 space-y-2 text-slate-600">
                    {items.map((item) => (
                      <label key={item} className="flex items-center gap-3">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-600" />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div>
            <div className="mb-5 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">Showing 124 courses across role-based pathways</div>
              <div className="flex flex-wrap gap-2">
                {["Most Popular", "Highest Rated", "Newest"].map((option) => (
                  <button
                    key={option}
                    onClick={() => setSort(option)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      sort === option ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {sortedCourses.map((course) => (
                <CourseCard key={`${sort}-${course.id}`} course={course} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function CourseDetailPage() {
  const [openSection, setOpenSection] = useState(2);
  const featuredCourse = courses[0];

  return (
    <PageShell currentPage="course-detail.html">
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Data Science Certificate</div>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">
                Python for Data Science
                <span className="block text-2xl text-slate-500">Intermediate · 24 hours</span>
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                Build confidence with applied Python workflows for analytics, visualization, and practical machine learning preparation.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="font-semibold text-amber-500">{stars(featuredCourse.rating)}</span>
                <span>{featuredCourse.enrolled} enrolled</span>
                <span>Updated this quarter</span>
              </div>
            </div>

            <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80"
                  alt="Instructor"
                  className="h-16 w-16 rounded-2xl object-cover"
                />
                <div>
                  <div className="text-lg font-bold text-slate-950">Dr. Maya Chen</div>
                  <div className="text-sm text-slate-500">Lead Data Scientist, former analytics educator at a top online university</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Maya specializes in making advanced technical topics practical for working professionals through project-first teaching.
              </p>
            </div>

            <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Course Includes</div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {["24 hours of video lectures", "Downloadable resources and templates", "Verified certificate of completion"].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Curriculum</div>
                  <h2 className="mt-2 text-2xl font-extrabold text-slate-950">5 sections · 32 lessons</h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {curriculum.map(([title, lessons], index) => {
                  const open = openSection === index;
                  return (
                    <div key={title} className="rounded-[24px] border border-slate-200">
                      <button
                        onClick={() => setOpenSection(open ? -1 : index)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      >
                        <div>
                          <div className="font-semibold text-slate-950">{title}</div>
                          <div className="mt-1 text-sm text-slate-500">{lessons}</div>
                        </div>
                        <span className="text-sm font-semibold text-teal-600">{open ? "Hide" : "View"}</span>
                      </button>
                      {open && (
                        <div className="border-t border-slate-200 px-5 py-4 text-sm leading-7 text-slate-600">
                          Lessons cover guided walkthroughs, applied notebooks, and milestone checkpoints to reinforce comprehension.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Student Reviews</div>
                  <div className="mt-2 text-3xl font-extrabold text-slate-950">4.8 average rating</div>
                </div>
                <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-600">Top rated by intermediate learners</div>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {reviews.map((review) => (
                  <article key={review.name} className="rounded-[24px] bg-slate-50 p-5">
                    <div className="font-semibold text-slate-950">{review.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{review.role}</div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{review.copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl font-extrabold text-slate-950">$49</div>
              <div className="mt-2 text-sm text-slate-500">Included in Pro, or purchase course-only access.</div>
              <a href="study.html" className="mt-6 block rounded-full bg-teal-600 px-5 py-4 text-center text-sm font-bold text-white shadow-lg shadow-teal-100">
                Enroll Now
              </a>
              <a href="pricing.html" className="mt-3 block rounded-full border border-slate-200 px-5 py-4 text-center text-sm font-semibold text-slate-700">
                Try Free
              </a>
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                {["Certificate included", "Flexible deadlines", "Downloadable exercises", "Mobile and desktop access"].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

function StudyPage() {
  const [tab, setTab] = useState("Overview");

  return (
    <PageShell currentPage="study.html">
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Progress</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-950">Lesson 4 of 12 - Module 2: Data Structures</div>
            </div>
            <div className="min-w-[220px]">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <span>Course progress</span>
                <span>33%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100">
                <div className="h-3 w-1/3 rounded-full bg-teal-600"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-slate-950 shadow-sm">
              <div className="aspect-video bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.3),_transparent_30%),linear-gradient(135deg,_#0f172a,_#0b3b45)] p-8 text-white">
                <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                  Lesson video
                </div>
                <div className="mt-24 max-w-xl">
                  <div className="text-3xl font-extrabold">Lists, slicing, and iteration patterns</div>
                  <p className="mt-4 text-sm leading-7 text-slate-200">
                    Build intuition for traversing nested data, refactoring repetitive operations, and preparing structures for analysis.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {["Overview", "Notes", "Q&A", "Resources"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setTab(item)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                      tab === item ? "tab-active" : "border-transparent bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-[24px] bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                {tab === "Overview" && "This lesson focuses on choosing the right data structure and recognizing how indexing, slicing, and mutation affect downstream analysis work."}
                {tab === "Notes" && "Key note: convert repetitive loop patterns into clear helper functions before scaling into notebook-based workflows."}
                {tab === "Q&A" && "Current discussion: when to prefer dictionaries over lists for lookups, and how to avoid subtle mutation bugs in shared references."}
                {tab === "Resources" && "Downloads include a practice notebook, list-operations cheat sheet, and the module project prompt."}
              </div>
            </div>
          </div>

          <aside className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Lesson Outline</div>
            <div className="mt-5 space-y-4">
              {lessonModules.map((module, moduleIndex) => (
                <div key={module.title} className="rounded-[24px] bg-slate-50 p-4">
                  <div className="font-semibold text-slate-950">{module.title}</div>
                  <div className="mt-3 space-y-2">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const completed = moduleIndex < 1 || (moduleIndex === 1 && lessonIndex < 1);
                      const active = lesson.startsWith("Lesson 4");
                      return (
                        <div key={lesson} className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm ${active ? "bg-white shadow-sm" : ""}`}>
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${completed ? "bg-emerald-100 text-emerald-700" : active ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                            {completed ? "✓" : lesson.match(/Lesson (\d+)/)[1]}
                          </span>
                          <span className={active ? "font-semibold text-slate-950" : "text-slate-600"}>{lesson}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

function PricingPage() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <PageShell currentPage="pricing.html">
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[36px] bg-gradient-to-br from-slate-950 via-sky-900 to-teal-500 p-8 text-white shadow-2xl shadow-sky-100 sm:p-10">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">Plans & Pricing</div>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">Flexible access for individuals and teams</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/80">
            Start with free learning, unlock the full library with Pro, or deploy LearnPath across your organization with Teams.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            ["Free", "Limited course access", "$0", "Start Learning"],
            ["Pro", "Full library and certificates", "$19/mo", "Try Free"],
            ["Teams", "Admin dashboard and analytics", "$49/seat/mo", "Sign Up"],
          ].map(([name, copy, price, cta], index) => (
            <article key={name} className={`rounded-[32px] border p-6 shadow-sm ${index === 1 ? "border-teal-500 bg-teal-50/60" : "border-slate-200 bg-white"}`}>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{name}</div>
              <div className="mt-3 text-3xl font-extrabold text-slate-950">{price}</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                {[
                  "Guided pathways",
                  index === 0 ? "Selected lessons only" : "Unlimited courses and projects",
                  index === 2 ? "Team analytics and seat management" : "Progress tracking dashboard",
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-white/80 px-4 py-3 font-semibold text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
              <a href={index === 2 ? "dashboard.html" : "courses.html"} className={`mt-6 block rounded-full px-5 py-4 text-center text-sm font-bold ${index === 1 ? "bg-teal-600 text-white" : "bg-slate-950 text-white"}`}>
                {cta}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionIntro eyebrow="Comparison" title="Choose the right level of access" />
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-4 pr-6 font-semibold">Feature</th>
                  <th className="pb-4 pr-6 font-semibold">Free</th>
                  <th className="pb-4 pr-6 font-semibold">Pro</th>
                  <th className="pb-4 font-semibold">Teams</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {[
                  ["Course library", "Limited", "Full", "Full"],
                  ["Certificates", "-", "Included", "Included"],
                  ["Downloadable resources", "-", "Included", "Included"],
                  ["Admin dashboard", "-", "-", "Included"],
                  ["Team analytics", "-", "-", "Included"],
                ].map((row) => (
                  <tr key={row[0]} className="border-t border-slate-100">
                    <td className="py-4 pr-6 font-semibold text-slate-950">{row[0]}</td>
                    <td className="py-4 pr-6">{row[1]}</td>
                    <td className="py-4 pr-6">{row[2]}</td>
                    <td className="py-4">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">FAQ</div>
            <div className="mt-5 space-y-3">
              {[
                ["Can I switch plans later?", "Yes. Upgrade or downgrade any time, and your progress stays intact across plan changes."],
                ["Does Pro include certificates?", "Yes. Pro unlocks course certificates and downloadable completion records."],
                ["What do Teams administrators get?", "Teams includes seat management, engagement reporting, pathway assignment, and oversight dashboards."],
              ].map(([question, answer], index) => {
                const open = openFaq === index;
                return (
                  <div key={question} className="rounded-[24px] border border-slate-200">
                    <button onClick={() => setOpenFaq(open ? -1 : index)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                      <span className="font-semibold text-slate-950">{question}</span>
                      <span className="text-sm font-semibold text-teal-600">{open ? "Hide" : "Open"}</span>
                    </button>
                    {open && <div className="border-t border-slate-200 px-5 py-4 text-sm leading-7 text-slate-600">{answer}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Guarantee</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-950">30-day money-back guarantee</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">Try LearnPath Pro with full access and request a refund within 30 days if it is not a fit.</p>
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Testimonials</div>
              <div className="mt-4 space-y-4">
                {reviews.slice(0, 2).map((review) => (
                  <div key={review.name} className="rounded-[24px] bg-slate-50 p-4">
                    <div className="font-semibold text-slate-950">{review.name}</div>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{review.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function DashboardPage() {
  return (
    <PageShell currentPage="dashboard.html">
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[36px] bg-gradient-to-r from-slate-950 via-sky-900 to-teal-500 p-8 text-white shadow-2xl shadow-sky-100">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Learner Dashboard</div>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Welcome back, Jordan</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
                Continue your pathway, review streaks and badges, and keep momentum across your current courses.
              </p>
            </div>
            <a href="study.html" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">
              Resume Learning
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-3">
              {[
                ["Python for Data Science", "72%", "260deg"],
                ["Modern Front-End Foundations", "45%", "162deg"],
                ["Product Strategy for Growth Teams", "28%", "101deg"],
              ].map(([course, progress, degrees]) => (
                <article key={course} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="progress-ring mx-auto flex h-24 w-24 items-center justify-center rounded-full" style={{ "--progress": degrees }}>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-950">{progress}</div>
                  </div>
                  <div className="mt-4 text-center text-sm font-semibold text-slate-950">{course}</div>
                </article>
              ))}
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <SectionIntro eyebrow="Continue Learning" title="Pick up where you left off" />
              <div className="mt-5 grid gap-4">
                {courses.slice(0, 3).map((course) => (
                  <div key={course.id} className="flex flex-col gap-4 rounded-[24px] bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-lg font-bold text-slate-950">{course.title}</div>
                      <div className="mt-1 text-sm text-slate-500">{course.instructor} · Next lesson ready</div>
                    </div>
                    <a href="study.html" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                      Resume
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <SectionIntro eyebrow="Recommended for You" title="Keep building adjacent skills" />
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {courses.slice(3, 6).map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Achievement Badges</div>
              <div className="mt-4 grid gap-3">
                {["7-day streak", "First certificate", "Project finisher"].map((badge) => (
                  <div key={badge} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700">
                    {badge}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Learning Streak</div>
              <div className="mt-2 text-4xl font-extrabold text-slate-950">18 days</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">You are ahead of your weekly plan. One more lesson keeps your streak active through Friday.</p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function AppRouter() {
  const page = document.body.dataset.page;

  if (page === "home") return <HomePage />;
  if (page === "courses") return <CoursesPage />;
  if (page === "course-detail") return <CourseDetailPage />;
  if (page === "study") return <StudyPage />;
  if (page === "pricing") return <PricingPage />;
  if (page === "dashboard") return <DashboardPage />;
  return <HomePage />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppRouter />);
