const { html, PageShell, StoryCard, TopicNav, latestInvestigations, announce } = window.Groundwork;

function HomePage() {
  const stats = [
    { value: "112", label: "counties where groundwater decline accelerated after 2020" },
    { value: "41%", label: "of federal adaptation grants routed to just five metro regions" },
    { value: "3.8M", label: "residents now relying on stressed western aquifers" },
  ];

  return html`
    <${PageShell}
      currentPath="./index.html"
      eyebrow="Groundwork"
      title="Investigations into the systems behind climate risk"
      description="Groundwork follows the data, contracts, and scientific evidence shaping environmental policy, infrastructure failure, and community survival."
    >
      <${TopicNav} />

      <section aria-labelledby="hero-story" className="mt-10 overflow-hidden rounded-[2.5rem] bg-ink text-white shadow-editorial">
        <div className="relative min-h-[78vh]">
          <img src="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80" alt="Dust and floodwater patterns cutting across a western desert basin" className="absolute inset-0 h-full w-full object-cover" />
          <div className="hero-wash absolute inset-0"></div>
          <div className="relative z-10 flex min-h-[78vh] max-w-4xl flex-col justify-end px-6 py-10 lg:px-12 lg:py-14">
            <p className="text-xs font-extrabold uppercase tracking-[0.34em] text-sand">Feature investigation</p>
            <h2 id="hero-story" className="mt-4 text-4xl font-serif leading-tight lg:text-6xl">
              <a href="./article.html" className="focus-ring rounded">The Invisible Flood: How Groundwater Collapse Is Reshaping the American West</a>
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200 lg:text-lg">Years of unmetered extraction, delayed drought planning, and public silence have created a disaster moving underground. Groundwork spent six months analyzing aquifer data, county permits, and insurance filings to map the regions already living inside the next water emergency.</p>
            <div className="mt-8 flex flex-wrap gap-4 text-sm font-medium text-slate-200">
              <span>Nina Patel and Owen Clarke</span>
              <span aria-hidden="true">•</span>
              <span>18 min immersive read</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="latest-investigations" className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="latest-investigations" className="text-3xl font-serif text-ink">Latest Investigations</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">New reporting across water systems, methane oversight, and recovery policy.</p>
          </div>
          <a href="./climate.html" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Open climate desk</a>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          ${latestInvestigations.map((story) => html`<${StoryCard} key=${story.title} story=${story} />`)}
        </div>
      </section>

      <section aria-labelledby="climate-strip" className="mt-16">
        <h2 id="climate-strip" className="text-2xl font-serif text-ink">Climate</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          ${[
            "Tracking aquifer collapse county by county",
            "New flood models for informal housing",
            "The local politics of managed retreat",
          ].map((headline) => html`
            <article key=${headline} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <h3 className="text-xl font-serif text-ink"><a href="./article.html" className="focus-ring rounded">${headline}</a></h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">Field reporting and public records from communities adapting ahead of federal timelines.</p>
            </article>
          `)}
        </div>
      </section>

      <section aria-labelledby="energy-strip" className="mt-12">
        <h2 id="energy-strip" className="text-2xl font-serif text-ink">Energy</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          ${[
            "Gas leak promises versus utility filings",
            "Battery storage siting and wildfire corridors",
            "Who profits from resilience bond deals",
          ].map((headline) => html`
            <article key=${headline} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <h3 className="text-xl font-serif text-ink"><a href="./article.html" className="focus-ring rounded">${headline}</a></h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">Investigations into infrastructure finance, emissions accounting, and utility regulation.</p>
            </article>
          `)}
        </div>
      </section>

      <section aria-labelledby="policy-strip" className="mt-12">
        <h2 id="policy-strip" className="text-2xl font-serif text-ink">Policy</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          ${[
            "The grant formulas deciding which towns survive heat",
            "Environmental justice rules with no enforcement budget",
            "Inside state climate offices built on temporary staff",
          ].map((headline) => html`
            <article key=${headline} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <h3 className="text-xl font-serif text-ink"><a href="./article.html" className="focus-ring rounded">${headline}</a></h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">Groundwork examines how procedural choices reshape climate outcomes on the ground.</p>
            </article>
          `)}
        </div>
      </section>

      <section aria-labelledby="numbers-heading" className="mt-16 rounded-[2rem] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="numbers-heading" className="text-3xl font-serif text-ink">By the Numbers</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">Key figures from Groundwork's groundwater investigation.</p>
          </div>
          <button type="button" onClick=${() => announce("Data highlight section announced.")} className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Announce stats</button>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          ${stats.map((stat) => html`
            <article key=${stat.label} className="rounded-[1.5rem] border border-slate-200 bg-fog p-6">
              <p className="text-5xl font-serif text-ink">${stat.value}</p>
              <h3 className="mt-4 text-lg font-semibold text-ink">${stat.label}</h3>
            </article>
          `)}
        </div>
      </section>

      <section aria-labelledby="donation-banner" className="mt-16 overflow-hidden rounded-[2rem] border border-slate-200 bg-moss text-white">
        <div className="grid gap-6 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-10">
          <div>
            <h2 id="donation-banner" className="text-3xl font-serif">Reader-supported. Methodology-forward. Independent.</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-100">Donations fund records requests, field visits, document review, and expert collaborations that keep Groundwork free to read.</p>
          </div>
          <div className="flex flex-col items-start justify-center gap-4 lg:items-end">
            <a href="./support.html" className="focus-ring rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink">Donate to Groundwork</a>
            <p className="text-sm text-slate-200">Your support helps fund 12 more hours of reporting for every new monthly member.</p>
          </div>
        </div>
      </section>
    </${PageShell}>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${HomePage} />`);
