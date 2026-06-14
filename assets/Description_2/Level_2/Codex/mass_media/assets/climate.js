const { html, PageShell, StoryCard, climateStories, keyDocuments, announce } = window.Groundwork;

function ClimatePage() {
  const [selectedTag, setSelectedTag] = React.useState("All");
  const [visibleCount, setVisibleCount] = React.useState(3);
  const tags = ["All", "Sea Level", "Wildfire", "Carbon Markets", "Water"];
  const filteredStories = climateStories.filter((story) => selectedTag === "All" || story.tag === selectedTag);
  const visibleStories = filteredStories.slice(0, visibleCount);

  return html`
    <${PageShell}
      currentPath="./climate.html"
      eyebrow="Climate Desk"
      title="Where emissions, water, and infrastructure failures meet public policy"
      description="Groundwork's climate desk follows the records, datasets, and local decisions behind environmental risk."
    >
      <section aria-labelledby="lead-investigation" className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <img src="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80" alt="Smoke and low clouds moving over a western mountain valley" className="h-80 w-full object-cover" />
          <div className="p-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-rust">Lead investigation</p>
            <h2 id="lead-investigation" className="mt-3 text-3xl font-serif leading-tight text-ink">
              <a href="./article.html" className="focus-ring rounded">Why towns built on snowmelt are now writing flood plans for dry riverbeds</a>
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">Groundwork reviewed basin recharge models, emergency plans, and zoning approvals to show how western communities are being forced to prepare for flood and scarcity at the same time.</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium text-slate-500">
              <span>By Owen Clarke</span>
              <span aria-hidden="true">•</span>
              <span>14 min read</span>
            </div>
          </div>
        </article>

        <section aria-labelledby="documents-heading" className="rounded-[2rem] border border-slate-200 bg-fog p-6">
          <h2 id="documents-heading" className="text-2xl font-serif text-ink">Key Documents</h2>
          <ul className="mt-5 space-y-4">
            ${keyDocuments.map((doc) => html`
              <li key=${doc.label} className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                <a href=${doc.href} className="focus-ring rounded text-sm font-semibold text-moss">${doc.label}</a>
                <p className="mt-2 text-sm text-slate-600">${doc.note}</p>
              </li>
            `)}
          </ul>
        </section>
      </section>

      <section aria-labelledby="filter-heading" className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="filter-heading" className="text-3xl font-serif text-ink">Recent Climate Reporting</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">Filter by subject to scan the reporting stream.</p>
          </div>
        </div>
        <div role="group" aria-label="Climate topic filters" className="mt-6 flex flex-wrap gap-3">
          ${tags.map((tag) => html`
            <button
              type="button"
              key=${tag}
              aria-pressed=${selectedTag === tag}
              onClick=${() => {
                setSelectedTag(tag);
                setVisibleCount(3);
                announce(`Showing ${tag === "All" ? "all" : tag} stories.`);
              }}
              className=${`focus-ring rounded-full border px-4 py-2 text-sm font-semibold ${selectedTag === tag ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-slate-700"}`}
            >
              ${tag}
            </button>
          `)}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="grid gap-6">
              ${visibleStories.map((story) => html`<${StoryCard} key=${story.title} story=${story} />`)}
            </div>
            ${visibleCount < filteredStories.length ? html`
              <button
                type="button"
                onClick=${(event) => {
                  setVisibleCount((count) => Math.min(count + 2, filteredStories.length));
                  announce("More climate stories loaded.");
                  window.setTimeout(() => event.currentTarget.focus(), 0);
                }}
                className="focus-ring mt-8 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Load More
              </button>
            ` : null}
          </div>

          <section aria-labelledby="viz-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 id="viz-heading" className="text-2xl font-serif text-ink">Data Visualization Preview</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">Preview of Groundwork's county-level aquifer decline dashboard.</p>
            <div className="map-grid mt-6 rounded-[1.5rem] border border-slate-200 bg-fog p-5">
              <div className="chart-bars flex h-48 items-end gap-4" aria-hidden="true">
                <span style=${{ height: "44%" }} className="flex-1"></span>
                <span style=${{ height: "58%" }} className="flex-1"></span>
                <span style=${{ height: "67%" }} className="flex-1"></span>
                <span style=${{ height: "83%" }} className="flex-1"></span>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">Projected recharge shortfall by basin, 2025 to 2035.</p>
            </div>
            <a href="./article.html" className="focus-ring mt-6 inline-flex rounded-full bg-moss px-5 py-3 text-sm font-semibold text-white">View Full Report</a>
          </section>
        </div>
      </section>
    </${PageShell}>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${ClimatePage} />`);
