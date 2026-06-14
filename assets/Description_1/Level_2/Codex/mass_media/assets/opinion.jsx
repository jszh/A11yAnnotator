function OpinionPage() {
  const { opinionWriters } = window.MeridianData;

  return (
    <PageLayout currentPage="opinion" liveMessage="">
      <section className="panel rounded-[2rem] border border-white/70 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Opinion</p>
        <h1 className="font-editorial mt-3 text-5xl font-semibold text-slate-950">Arguments, criticism, and sharp analysis</h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[1.5rem] bg-slate-50 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Featured Essay</p>
            <h2 className="font-editorial mt-3 text-4xl font-semibold text-slate-950">The world cannot afford diplomacy designed for peacetime</h2>
            <div className="mt-5 flex items-center gap-4">
              <img src={opinionWriters[0].avatar} alt="Amina Bell" className="h-14 w-14 rounded-full object-cover" />
              <div>
                <p className="text-lg font-semibold text-slate-900">Amina Bell</p>
                <p className="text-sm text-slate-500">Columnist</p>
              </div>
            </div>
            <p className="mt-5 text-base leading-8 text-slate-700">The institutional vocabulary of caution is no longer keeping pace with cascading crises. If the world continues to react with ad hoc coordination, it will normalize instability as a cost of doing business.</p>
          </article>

          <section aria-labelledby="letters-heading" className="rounded-[1.5rem] bg-slate-50 p-6">
            <h2 id="letters-heading" className="font-editorial text-3xl font-semibold text-slate-950">Letters to the Editor</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
              <p>“Your coverage of housing policy is strongest when it treats local budgeting as the central political story.”</p>
              <p>“I appreciate the way Meridian separates reporting from analysis without flattening either one.”</p>
            </div>
          </section>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="columnists-heading">
        <h2 id="columnists-heading" className="font-editorial text-3xl font-semibold text-slate-950">Recent Opinion by Columnist</h2>
        <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {opinionWriters.map((writer) => (
            <li key={writer.name}>
              <article className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <img src={writer.avatar} alt={writer.name} className="h-14 w-14 rounded-full object-cover" />
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{writer.name}</h3>
                    <p className="text-sm text-slate-500">{writer.title}</p>
                  </div>
                </div>
                <a href="./article.html" className="focus-ring mt-5 block rounded font-editorial text-3xl font-semibold text-slate-950">
                  {writer.headline}
                </a>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<OpinionPage />);
