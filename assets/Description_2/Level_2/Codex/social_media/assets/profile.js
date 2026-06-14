const { html, featuredWorks, PageShell, RightRail } = window.Folia;

function ProfilePage() {
  const rail = html`
    <${RightRail} title="Profile Details">
      <div className="rounded-[1.5rem] bg-white/90 p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">Works in</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">Procreate, Figma, Film Photography</p>
      </div>
      <div className="rounded-[1.5rem] bg-white/90 p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">Appreciations</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">8.4K this month</p>
      </div>
    <//>
  `;

  return html`
    <${PageShell}
      currentPath="./profile.html"
      kicker="Creator folio"
      title="Profile"
      description="A portfolio view for ongoing projects, pinned work, and creative tools used across the studio."
      rightRail=${rail}
    >
      <section aria-labelledby="profile-heading" className="overflow-hidden rounded-[2rem] border border-white/70 shadow-xl shadow-slate-200/50">
        <div className="relative">
          <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80" alt="Artist desk with prints, camera, and sketchbooks" className="h-72 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h2 id="profile-heading" className="text-4xl font-semibold">Maya Lin</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">Illustrator and visual designer building poster systems, editorial stories, and tactile digital textures.</p>
            <p className="mt-3 text-sm font-medium text-emerald-200">Works in: Procreate, Figma, Film Photography</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="featured-heading" className="mt-10">
        <h2 id="featured-heading" className="text-3xl font-semibold text-slate-950">Featured Work</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          ${featuredWorks.map((work) => html`
            <article key=${work.title} className="glass-panel overflow-hidden rounded-[1.75rem] border border-white/70 shadow-lg shadow-slate-200/50">
              <img src=${work.image} alt=${`${work.title} featured work preview`} className="h-56 w-full object-cover" />
              <div className="p-4">
                <h3 className="text-xl font-semibold text-slate-950">${work.title}</h3>
                <p className="mt-2 text-sm text-slate-600">${work.views} views · ${work.appreciates} appreciations</p>
              </div>
            </article>
          `)}
        </div>
      </section>

      <section aria-labelledby="grid-heading" className="mt-10">
        <h2 id="grid-heading" className="text-3xl font-semibold text-slate-950">Project Grid</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          ${featuredWorks.concat(featuredWorks).map((work, index) => html`
            <article key=${work.title + index} className="glass-panel overflow-hidden rounded-[1.75rem] border border-white/70 shadow-lg shadow-slate-200/50">
              <img src=${work.image} alt=${`${work.title} project card`} className="h-64 w-full object-cover" />
              <div className="flex items-center justify-between gap-3 p-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">${work.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">${work.views} views</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">${work.appreciates} appreciates</span>
              </div>
            </article>
          `)}
        </div>
      </section>
    <//>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${ProfilePage} />`);
