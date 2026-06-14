function DashboardPage() {
  const { dashboardCourses, courses } = window.LearnPathData;

  return (
    <PageLayout currentPage="dashboard" liveMessage="">
      <section>
        <h1 className="text-5xl font-semibold text-slate-950">Welcome back, Jordan</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">Pick up where you left off, track your streak, and discover the next course that fits your goals.</p>
      </section>

      <section className="mt-10" aria-labelledby="in-progress-heading">
        <h2 id="in-progress-heading" className="text-3xl font-semibold text-slate-950">In Progress</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {dashboardCourses.map((course) => (
            <article key={course.title} className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-950 text-lg font-semibold text-white" aria-label={`${course.progress} percent complete`}>
                  {course.progress}%
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-slate-950">{course.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{course.next}</p>
                  <a href={course.href} className="focus-ring mt-4 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                    Resume
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="recommended-heading">
        <h2 id="recommended-heading" className="text-3xl font-semibold text-slate-950">Recommended for You</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.slice(2, 5).map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.9fr]" aria-labelledby="achievements-heading">
        <section aria-labelledby="achievements-heading" className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
          <h2 id="achievements-heading" className="text-3xl font-semibold text-slate-950">Achievements</h2>
          <div className="mt-5 flex flex-wrap gap-4">
            {[
              ["7-Day Streak", "Badge for completing lessons seven days in a row"],
              ["First Certificate", "Badge for earning a course certificate"],
              ["Data Explorer", "Badge for completing a data science project"]
            ].map(([label, alt]) => (
              <div key={label} className="rounded-[1.5rem] bg-slate-50 px-4 py-5 text-center text-sm font-medium text-slate-700" aria-label={alt}>
                {label}
              </div>
            ))}
          </div>
        </section>

        <aside className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
          <h2 className="text-3xl font-semibold text-slate-950">Learning Streak</h2>
          <p className="mt-5 text-5xl font-semibold text-emerald-600">12 days</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">Keep the streak alive by completing one lesson today.</p>
        </aside>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<DashboardPage />);
