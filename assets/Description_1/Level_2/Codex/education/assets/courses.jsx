function CoursesPage() {
  const { courses } = window.LearnPathData;
  const [liveMessage, setLiveMessage] = useState("");
  const [sort, setSort] = useState("Most Popular");
  const [level, setLevel] = useState([]);
  const [price, setPrice] = useState("All");

  const visibleCourses = useMemo(() => {
    let next = [...courses];
    if (level.length) next = next.filter((course) => level.includes(course.level));
    if (price !== "All") next = next.filter((course) => (price === "Free" ? course.price === "Free" : course.price !== "Free"));
    if (sort === "Highest Rated") next.sort((a, b) => b.rating - a.rating);
    if (sort === "Newest") next.reverse();
    return next;
  }, [courses, level, price, sort]);

  useEffect(() => {
    setLiveMessage(`${visibleCourses.length} courses shown.`);
  }, [visibleCourses.length]);

  const toggleLevel = (value) => {
    setLevel((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  return (
    <PageLayout currentPage="courses" liveMessage={liveMessage}>
      <section>
        <h1 className="text-4xl font-semibold text-slate-950">Course Catalog</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">Find structured learning paths in development, data, design, business, and creative practice.</p>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Filters</h2>
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Category</legend>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {["Web Development", "Data Science", "UX Design", "Business", "Photography"].map((item) => (
                <label key={item} className="flex items-center gap-3"><input type="checkbox" /> <span>{item}</span></label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-8">
            <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Level</legend>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {["Beginner", "Intermediate", "Advanced"].map((item) => (
                <label key={item} className="flex items-center gap-3"><input type="checkbox" checked={level.includes(item)} onChange={() => toggleLevel(item)} /> <span>{item}</span></label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-8">
            <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Duration</legend>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {["0-10 hours", "10-20 hours", "20+ hours"].map((item) => (
                <label key={item} className="flex items-center gap-3"><input type="checkbox" /> <span>{item}</span></label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-8">
            <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Rating</legend>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {["4.5 and up", "4.7 and up"].map((item) => (
                <label key={item} className="flex items-center gap-3"><input type="checkbox" /> <span>{item}</span></label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-8">
            <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Price</legend>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {["All", "Free", "Paid"].map((item) => (
                <label key={item} className="flex items-center gap-3"><input type="radio" name="price" checked={price === item} onChange={() => setPrice(item)} /> <span>{item}</span></label>
              ))}
            </div>
          </fieldset>
        </aside>

        <section aria-labelledby="courses-grid-heading">
          <div className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 id="courses-grid-heading" className="text-2xl font-semibold text-slate-950">Available Courses</h2>
                <p className="mt-1 text-sm text-slate-600">{visibleCourses.length} results</p>
              </div>
              <label className="text-sm font-medium text-slate-700">
                Sort
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="focus-ring ml-3 rounded-full border border-slate-300 px-4 py-2">
                  {["Most Popular", "Highest Rated", "Newest"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </div>

          {visibleCourses.length === 0 ? (
            <p className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">No courses match your current filters. Try removing one or more filters to broaden results.</p>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<CoursesPage />);
