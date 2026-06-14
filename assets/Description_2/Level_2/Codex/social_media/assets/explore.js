const { html, exploreTiles, risingCreators, palettes, PageShell, RightRail } = window.Folia;

function ExplorePage() {
  const rail = html`
    <${RightRail} title="Discovery Notes">
      <div className="rounded-[1.5rem] bg-white/90 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">Saved mediums</h3>
        <p className="mt-2 text-sm text-slate-600">Digital Art, Photography, Motion, Editorial Layout, Experimental Type</p>
      </div>
      <div className="rounded-[1.5rem] bg-white/90 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">Curator note</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">Hover or focus any tile to reveal the creator and appreciation count without changing DOM order.</p>
      </div>
    <//>
  `;

  return html`
    <${PageShell}
      currentPath="./explore.html"
      kicker="Visual discovery"
      title="Explore Folia"
      description="Browse medium-led inspiration from digital art, photography, typography, 3D, and motion creators."
      rightRail=${rail}
    >
      <section aria-labelledby="explore-heading">
        <h2 id="explore-heading" className="text-3xl font-semibold text-slate-950">Explore by Medium</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Discovery tiles are sorted by medium and reveal creator details on hover or keyboard focus.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          ${exploreTiles.map((tile) => html`
            <article key=${tile.creator + tile.medium} className="group hover-tile relative overflow-hidden rounded-[2rem] border border-white/70 shadow-xl shadow-slate-200/50">
              <img src=${tile.image} alt=${`${tile.medium} work by ${tile.creator}`} className="h-72 w-full object-cover" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-5 text-white opacity-100 transition-all md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                <p className="text-sm font-semibold uppercase tracking-[0.24em]">${tile.medium}</p>
                <h3 className="mt-2 text-2xl font-semibold">${tile.creator}</h3>
                <p className="mt-1 text-sm">${tile.appreciates} appreciations</p>
              </div>
              <a href="./profile.html" className="focus-ring absolute inset-0 z-20 rounded-[2rem]" aria-label=${`View ${tile.creator}'s ${tile.medium} profile preview`}>
                <span className="sr-only">${tile.creator}</span>
              </a>
            </article>
          `)}
        </div>
      </section>

      <section aria-labelledby="rising-heading" className="mt-10">
        <h2 id="rising-heading" className="text-3xl font-semibold text-slate-950">Rising Creators</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          ${risingCreators.map((creator) => html`
            <article key=${creator.name} className="glass-panel rounded-[1.75rem] border border-white/70 p-5 shadow-lg shadow-slate-200/50">
              <h3 className="text-xl font-semibold text-slate-950">${creator.name}</h3>
              <p className="mt-2 text-sm text-slate-600">${creator.specialty}</p>
              <p className="mt-4 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">${creator.badge}</p>
            </article>
          `)}
        </div>
      </section>

      <section aria-labelledby="palette-heading" className="mt-10">
        <h2 id="palette-heading" className="text-3xl font-semibold text-slate-950">Trending Palettes</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          ${palettes.map((palette, index) => html`
            <article key=${index} className="glass-panel rounded-[1.75rem] border border-white/70 p-5 shadow-lg shadow-slate-200/50">
              <div className="flex gap-2">
                ${palette.map((swatch) => html`<span key=${swatch} className="palette-chip h-20 flex-1 rounded-2xl" style=${{ background: swatch }} aria-label=${`Palette swatch ${swatch}`}></span>`)}
              </div>
              <p className="mt-4 text-sm text-slate-600">Saved ${48 + index * 12} times this week</p>
            </article>
          `)}
        </div>
      </section>
    <//>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${ExplorePage} />`);
