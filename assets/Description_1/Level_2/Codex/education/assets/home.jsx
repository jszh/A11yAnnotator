function HomePage() {
  const { categories, courses } = window.LearnPathData;

  return (
    <PageLayout currentPage="home" liveMessage="">
      <section className="hero-shell rounded-[2rem] p-8 text-white shadow-xl">
        <h1 className="max-w-3xl text-5xl font-semibold leading-tight">Unlock Your Potential. Learn at Your Own Pace.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-100">LearnPath combines structured pathways, expert instruction, and flexible study tools for ambitious learners at every stage.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="./courses.html" className="focus-ring rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">Browse Courses</a>
          <a href="./pricing.html" className="focus-ring rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white">Start Free Trial</a>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl font-semibold text-slate-950">Explore by Category</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {categories.map((category) => (
            <a key={category.name} href={category.href} className="focus-ring panel rounded-[2rem] border border-white/70 p-5 text-lg font-semibold text-slate-900 shadow-sm">
              {category.name}
            </a>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="featured-courses-heading">
        <h2 id="featured-courses-heading" className="text-3xl font-semibold text-slate-950">Featured Courses</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.slice(0, 3).map((course) => (
            <article key={course.id} className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
              <img src={course.image} alt="" className="h-52 w-full rounded-[1.5rem] object-cover" />
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">{course.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{course.instructor}</p>
              <p className="mt-2 text-sm text-slate-600">{course.rating} ★ · {course.enrolled} enrolled</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{course.price}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
        <h2 className="text-3xl font-semibold text-slate-950">Join 2M+ learners worldwide</h2>
        <p className="mt-3 text-base leading-7 text-slate-600">Professionals, students, and teams trust LearnPath for structured, high-signal learning that fits around real work.</p>
      </section>

      <section className="mt-12" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="text-3xl font-semibold text-slate-950">How It Works</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            ["1. Discover", "Browse curated pathways by skill, level, and time commitment."],
            ["2. Learn", "Follow structured lessons with notes, Q&A, and downloadable resources."],
            ["3. Apply", "Earn certificates, build projects, and keep progressing from your dashboard."]
          ].map(([title, text]) => (
            <article key={title} className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
              <h3 className="text-2xl font-semibold text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<HomePage />);
