const { html, PageShell, ProductCard, productCatalog, moodTiles } = window.ThreadHouse;

function HomePage() {
  const arrivals = productCatalog.slice(0, 6);

  return html`
    <${PageShell}
      eyebrow="Spring edit"
      title="Marketplace picks for conscious wardrobes"
      description="ThreadHouse curates independent labels, recycled fibers, and expressive essentials for style-first shoppers who want transparency without sacrificing edge."
    >
      <section aria-labelledby="hero-heading" className="overflow-hidden rounded-[2rem] bg-slate-900 text-white shadow-2xl shadow-slate-300/50">
        <div className="relative min-h-[75vh]">
          <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=80" alt="Models wearing pieces from the ThreadHouse spring collection in a sunlit studio" className="absolute inset-0 h-full w-full object-cover" />
          <div className="hero-overlay absolute inset-0"></div>
          <div className="relative z-10 flex min-h-[75vh] max-w-3xl flex-col justify-end px-6 py-12 lg:px-12 lg:py-16">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-lime-300">Editorial drop</p>
            <h2 id="hero-heading" className="mt-4 text-4xl font-semibold tracking-tight lg:text-6xl">Wear What You Stand For — New Spring Collection</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 lg:text-lg">Layered linens, sculpted tailoring, and accessories built for city movement. Every piece is selected for traceable materials and independent design perspective.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="./products.html" className="focus-ring rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950">Shop spring arrivals</a>
              <a href="./product.html" className="focus-ring rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white">Explore the featured look</a>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="mood-heading" className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="mood-heading" className="text-3xl font-semibold text-slate-950">Shop by Mood</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Build a look around how you want to feel, not just what you need to buy.</p>
          </div>
          <a href="./products.html" className="focus-ring hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 lg:inline-flex">Browse all moods</a>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          ${moodTiles.map((tile) => html`
            <article key=${tile.title} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
              <img src=${tile.image} alt=${`${tile.title} style inspiration`} className="h-72 w-full object-cover" />
              <div className="p-5">
                <h3 className="text-xl font-semibold text-slate-950">${tile.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">${tile.description}</p>
                <a href="./products.html" className="focus-ring mt-4 inline-flex rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white" aria-label=${`Shop ${tile.title} mood products`}>
                  Shop ${tile.title}
                </a>
              </div>
            </article>
          `)}
        </div>
      </section>

      <section aria-labelledby="arrivals-heading" className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="arrivals-heading" className="text-3xl font-semibold text-slate-950">New Arrivals</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Fresh drops from labels exploring low-impact fabrics, modular fits, and versatile styling.</p>
          </div>
          <a href="./products.html" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">See all new arrivals</a>
        </div>
        <div className="product-scroll mt-8 grid auto-cols-[minmax(280px,320px)] grid-flow-col gap-6 overflow-x-auto pb-4">
          ${arrivals.map((product) => html`<${ProductCard} key=${product.id} product=${product} href="./product.html" />`)}
        </div>
      </section>

      <section aria-labelledby="mission-heading" className="mt-16 grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 id="mission-heading" className="text-3xl font-semibold text-slate-950">Why ThreadHouse exists</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">We built ThreadHouse for shoppers who want expressive clothes without the opacity of fast fashion. Every collection note highlights material impact, studio origin, and why each silhouette earns its place in a long-term wardrobe.</p>
        </div>
        <div className="flex items-center justify-start lg:justify-end">
          <a href="./account.html" className="focus-ring inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white">Our Mission</a>
        </div>
      </section>
    <//>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${HomePage} />`);

