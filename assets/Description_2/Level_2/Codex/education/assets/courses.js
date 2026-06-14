const { useEffect, useMemo, useState } = React;
const { html, PageShell, courseCatalog, CourseCard, announce } = window.SkillForge;

function CoursesPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    field: "All",
    format: "All",
    duration: "All",
    cost: "All",
    credential: "All",
  });

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const filteredCourses = useMemo(() => {
    return courseCatalog.filter((course) => {
      const matchesSearch = `${course.title} ${course.instructor} ${course.summary}`.toLowerCase().includes(search.toLowerCase());
      const matchesField = filters.field === "All" || course.field === filters.field;
      const matchesFormat = filters.format === "All" || course.format === filters.format;
      const matchesDuration = filters.duration === "All" || course.duration === filters.duration;
      const matchesCost = filters.cost === "All" || course.costTier === filters.cost;
      const matchesCredential = filters.credential === "All" || course.credential === filters.credential;
      return matchesSearch && matchesField && matchesFormat && matchesDuration && matchesCost && matchesCredential;
    });
  }, [filters, search]);

  useEffect(() => {
    announce(`${filteredCourses.length} programs shown.`);
  }, [filteredCourses.length]);

  const renderOptions = (name, options, selected) => html`
    <fieldset className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
      <legend className="px-2 text-sm font-semibold text-slate-950">${name}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        ${options.map((option) => html`
          <label key=${`${name}-${option}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input
              type="radio"
              name=${name}
              checked=${selected === option}
              onChange=${() => updateFilter(name.toLowerCase(), option)}
            />
            <span>${option}</span>
          </label>
        `)}
      </div>
    </fieldset>
  `;

  return html`
    <${PageShell}
      eyebrow="Program catalog"
      title="Browse certificate pathways with clear start dates, formats, and outcomes"
      description="Filter by field, learning format, duration, cost, and credential type to compare programs built for adult learners balancing work and reskilling."
    >
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form className="space-y-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-6" aria-label="Course filters">
          <div>
            <label htmlFor="course-search" className="text-sm font-semibold text-slate-950">Search programs</label>
            <input
              id="course-search"
              type="search"
              value=${search}
              onInput=${(event) => setSearch(event.target.value)}
              placeholder="Search by title, instructor, or skill"
              className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
            />
          </div>
          ${renderOptions("field", ["All", "Healthcare Support", "IT", "Trades", "Business Administration"], filters.field)}
          ${renderOptions("format", ["All", "Self-Paced", "Cohort", "Live Online"], filters.format)}
          ${renderOptions("duration", ["All", "6 weeks", "7 weeks", "8 weeks", "10 weeks", "12 weeks"], filters.duration)}
          ${renderOptions("cost", ["All", "Free", "Under $500", "$500+"], filters.cost)}
          ${renderOptions("credential", ["All", "Certificate", "Badge", "CEU"], filters.credential)}
        </form>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-slate-200 bg-white p-5">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Available programs</h2>
              <p className="mt-1 text-sm text-slate-500">${filteredCourses.length} results</p>
            </div>
            <label className="text-sm font-medium text-slate-700">
              <span className="mr-3">Sort</span>
              <select className="focus-ring rounded-full border border-slate-300 bg-white px-4 py-2 text-sm">
                <option>Next start date</option>
                <option>Lowest cost</option>
                <option>Shortest duration</option>
              </select>
            </label>
          </div>

          ${filteredCourses.length ? html`
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              ${filteredCourses.map((course) => html`<${CourseCard} key=${course.id} course=${course} />`)}
            </div>
          ` : html`
            <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white p-8">
              <h2 className="text-2xl font-semibold text-slate-950">No matching programs</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">No courses match your current search and filters. Try removing one or more filters, or search for broader terms like "healthcare" or "certificate".</p>
            </div>
          `}
        </div>
      </section>
    <//>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${CoursesPage} />`);
