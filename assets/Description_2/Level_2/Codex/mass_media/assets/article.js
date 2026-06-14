const { html, PageShell, StoryCard, latestInvestigations, announce } = window.Groundwork;

function ArticlePage() {
  const shareTitle = "The Invisible Flood";

  return html`
    <${PageShell}
      currentPath="./article.html"
      eyebrow="Feature Investigation"
      title="The Invisible Flood: How Groundwater Collapse Is Reshaping the American West"
      description="A Groundwork investigation into depleted aquifers, weak oversight, and the public records showing how a slow-moving water disaster became normalized."
    >
      <article className="mt-10">
        <header className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rust">Water, policy, and infrastructure</p>
          <p className="mt-5 text-xl leading-8 text-slate-600">New satellite analysis and county pump logs reveal a growing mismatch between what states report, what farmers extract, and what towns can safely depend on.</p>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80" alt="Reporter Nina Patel" className="h-12 w-12 rounded-full object-cover" />
              <div>
                <p className="font-semibold text-ink">Nina Patel</p>
                <p>Published April 22, 2025</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80" alt="Reporter Owen Clarke" className="h-12 w-12 rounded-full object-cover" />
              <div>
                <p className="font-semibold text-ink">Owen Clarke</p>
                <p>Updated with document review April 24, 2025</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            ${["X", "Facebook", "LinkedIn"].map((platform) => html`
              <button key=${platform} type="button" onClick=${() => announce(`Shared on ${platform}.`)} className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" aria-label=${`Share ${shareTitle} on ${platform}`}>
                ${platform}
              </button>
            `)}
          </div>
        </header>

        <section aria-labelledby="methodology-note" className="mt-10 max-w-4xl rounded-[1.75rem] border border-slate-200 bg-white p-6">
          <h2 id="methodology-note" className="text-2xl font-serif text-ink">How We Reported This</h2>
          <p className="mt-3 text-base leading-8 text-slate-600">Groundwork analyzed two decades of NASA GRACE satellite records, county-level well permits, crop insurance filings, and emergency management plans. We interviewed 37 hydrologists, growers, utility officials, and residents in Arizona, California, Colorado, and New Mexico.</p>
        </section>

        <figure className="mt-10 overflow-hidden rounded-[2rem] bg-white shadow-sm">
          <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80" alt="Dry agricultural land crossed by irrigation lines and flooded runoff channels" className="h-[28rem] w-full object-cover" />
          <figcaption className="px-6 py-4 text-sm text-slate-600">Field reporting in eastern Colorado found irrigation districts preparing for both flash flooding and aquifer decline in the same season.</figcaption>
        </figure>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="max-w-4xl">
            <section aria-labelledby="body-one">
              <h2 id="body-one" className="text-3xl font-serif text-ink">A crisis hidden by paperwork lag</h2>
              <p className="mt-4 text-base leading-8 text-slate-700">In county after county, groundwater depletion appears first as a clerical problem: monitoring wells untested, extraction estimates rounded, recharge assumptions copied forward from older models. By the time state dashboards show visible decline, smaller towns have already lost redundancy in drinking water supply and fire response capacity.</p>
              <p className="mt-4 text-base leading-8 text-slate-700">Groundwork found permit logs in three western states where high-capacity wells remained listed as inactive years after local records showed they were pumping. Those discrepancies shape drought declarations, crop insurance assumptions, and the federal formulas used to distribute adaptation funding.</p>
            </section>

            <blockquote className="mt-10 rounded-[1.75rem] border-l-4 border-rust bg-white p-6 text-2xl font-serif leading-10 text-ink">
              "We keep planning as if groundwater is a reserve. In many counties, it's already the emergency."
            </blockquote>

            <section aria-labelledby="body-two" className="mt-10">
              <h2 id="body-two" className="text-3xl font-serif text-ink">Charts that show a widening gap</h2>
              <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-fog p-6">
                <div className="chart-bars flex h-56 items-end gap-5" aria-hidden="true">
                  <span style=${{ height: "34%" }} className="flex-1"></span>
                  <span style=${{ height: "49%" }} className="flex-1"></span>
                  <span style=${{ height: "61%" }} className="flex-1"></span>
                  <span style=${{ height: "81%" }} className="flex-1"></span>
                  <span style=${{ height: "88%" }} className="flex-1"></span>
                </div>
                <p className="mt-4 text-sm text-slate-600">Estimated annual groundwater deficit compared with reported state mitigation spending.</p>
              </div>
              <p className="mt-5 text-base leading-8 text-slate-700">Even where drought planning exists, the curve is moving in the wrong direction. Reporting gaps widened between 2021 and 2024, precisely when federal adaptation dollars accelerated. Counties with the steepest extraction spikes were often the ones still relying on broad basin averages instead of localized recharge monitoring.</p>
            </section>

            <section aria-labelledby="body-three" className="mt-10">
              <h2 id="body-three" className="text-3xl font-serif text-ink">Maps of extraction and loss</h2>
              <div className="map-grid mt-5 rounded-[1.75rem] border border-slate-200 bg-white p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.25rem] bg-slate-100 p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-moss">County clusters</p>
                    <p className="mt-3 text-base leading-7 text-slate-600">High-risk zones overlap with older irrigation districts and growth corridors lacking updated municipal backup plans.</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-slate-100 p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-moss">Infrastructure exposure</p>
                    <p className="mt-3 text-base leading-7 text-slate-600">Schools, hospitals, and mobile home communities increasingly sit inside the most stressed service areas.</p>
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="footnotes" className="mt-10">
              <h2 id="footnotes" className="text-3xl font-serif text-ink">Footnotes</h2>
              <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <li>1. GRACE aquifer loss estimates normalized using county-level precipitation anomalies from NOAA monthly climate normals.</li>
                <li>2. Insurance filings cross-referenced with municipal emergency management annexes obtained through state public records requests.</li>
                <li>3. Interview transcripts edited lightly for length and clarity.</li>
              </ol>
            </section>
          </div>

          <aside className="self-start rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-serif text-ink">Support This Reporting</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">Independent support pays for document retrieval fees, field travel, and expert review.</p>
            <a href="./support.html" className="focus-ring mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">Contribute now</a>
            <p className="mt-4 text-sm text-slate-500">Monthly members help fund about 12 additional hours of reporting per month.</p>
          </aside>
        </div>
      </article>

      <section aria-labelledby="related-heading" className="mt-16">
        <h2 id="related-heading" className="text-3xl font-serif text-ink">Related Investigations</h2>
        <div className="story-scroll mt-8 grid auto-cols-[minmax(280px,340px)] grid-flow-col gap-6 overflow-x-auto pb-4">
          ${latestInvestigations.map((story) => html`<${StoryCard} key=${story.title} story=${story} />`)}
        </div>
      </section>
    </${PageShell}>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${ArticlePage} />`);
