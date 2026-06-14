function WorldPage() {
  const { worldStories } = window.MeridianData;
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Asia", "Europe", "Americas", "Middle East", "Africa"];

  return (
    <PageLayout currentPage="world" liveMessage="">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Category</p>
        <h1 className="font-editorial mt-3 text-5xl font-semibold text-slate-950">World</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">Coverage of diplomacy, conflict, climate, migration, and the political economy of global power.</p>
      </section>

      <fieldset className="mt-8 panel rounded-[2rem] border border-white/70 p-5 shadow-sm" role="group">
        <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Topic filters</legend>
        <div className="mt-4 flex flex-wrap gap-3">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
              className={`focus-ring rounded-full px-4 py-2 text-sm font-medium ${activeFilter === filter ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700"}`}
              aria-label={`Show ${filter} world coverage`}
            >
              {filter}
            </button>
          ))}
        </div>
      </fieldset>

      <section className="mt-8">
        <StoryCard story={worldStories[0]} href="./article.html" large />
      </section>

      <section className="mt-8" aria-labelledby="world-grid-heading">
        <h2 id="world-grid-heading" className="font-editorial text-3xl font-semibold text-slate-950">Latest World Coverage</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {worldStories.slice(1).map((story) => (
            <StoryCard key={story.title} story={story} href="./article.html" />
          ))}
        </div>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<WorldPage />);
