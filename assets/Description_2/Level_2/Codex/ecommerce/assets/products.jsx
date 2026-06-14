const { PageShell, ProductCard, productCatalog } = window.ThreadHouse;

function ProductsPage() {
  const [styleMatch, setStyleMatch] = React.useState(false);
  const [selectedMaterial, setSelectedMaterial] = React.useState("All");
  const [priceRange, setPriceRange] = React.useState("All");

  const items = React.useMemo(() => {
    return productCatalog.filter((item) => {
      const materialPass = selectedMaterial === "All" || item.material === selectedMaterial;
      const pricePass = priceRange === "All"
        || (priceRange === "Under 75" && item.price < 75)
        || (priceRange === "75 to 120" && item.price >= 75 && item.price <= 120)
        || (priceRange === "Over 120" && item.price > 120);
      return materialPass && pricePass;
    });
  }, [selectedMaterial, priceRange]);

  React.useEffect(() => {
    const region = document.getElementById("results-live-region");
    if (region) {
      region.textContent = `${items.length} products shown${styleMatch ? " with curated sets highlighted" : ""}.`;
    }
  }, [items.length, styleMatch]);

  return (
    <PageShell
      eyebrow="Marketplace"
      title="Shop all ThreadHouse pieces"
      description="Compare independent labels, refine by fabric or fit, and toggle curated style sets for complete outfit inspiration."
    >
      <div className="grid gap-8 xl:grid-cols-[320px_1fr]">
        <aside aria-labelledby="filter-heading" className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6">
          <h2 id="filter-heading" className="text-2xl font-semibold text-slate-950">Filters</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Refine by clothing type, sizing, color palette, material, and price range.</p>

          <form className="mt-6 space-y-6">
            <fieldset className="rounded-2xl border border-slate-200 p-4">
              <legend className="px-2 text-sm font-semibold text-slate-950">Clothing Type</legend>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                {["Tops", "Shirts", "Outerwear", "Pants", "Dresses", "Accessories"].map((label) => (
                  <label key={label} className="flex items-center gap-3">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-slate-200 p-4">
              <legend className="px-2 text-sm font-semibold text-slate-950">Size</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                  <button key={size} type="button" className="focus-ring rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700" aria-label={`Filter products by size ${size}`}>
                    {size}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-slate-200 p-4">
              <legend className="px-2 text-sm font-semibold text-slate-950">Color</legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {[
                  ["Sage Green", "bg-green-300"],
                  ["Ochre", "bg-amber-400"],
                  ["Ink", "bg-slate-800"],
                  ["Cloud", "bg-slate-100"],
                  ["Clay", "bg-orange-300"],
                ].map(([name, colorClass]) => (
                  <button key={name} type="button" className="focus-ring flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700" aria-label={`Filter products by ${name}`}>
                    <span className={`inline-block h-4 w-4 rounded-full border border-slate-300 ${colorClass}`} aria-hidden="true" />
                    {name}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-slate-200 p-4">
              <legend className="px-2 text-sm font-semibold text-slate-950">Material</legend>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                {["All", "Organic Cotton", "Recycled Polyester"].map((material) => (
                  <label key={material} className="flex items-center gap-3">
                    <input type="radio" name="material" checked={selectedMaterial === material} onChange={() => setSelectedMaterial(material)} className="h-4 w-4 border-slate-300 text-teal-700 focus:ring-teal-700" />
                    <span>{material}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-slate-200 p-4">
              <legend className="px-2 text-sm font-semibold text-slate-950">Price Range</legend>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                {["All", "Under 75", "75 to 120", "Over 120"].map((range) => (
                  <label key={range} className="flex items-center gap-3">
                    <input type="radio" name="price" checked={priceRange === range} onChange={() => setPriceRange(range)} className="h-4 w-4 border-slate-300 text-teal-700 focus:ring-teal-700" />
                    <span>{range}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-slate-200 p-4">
              <legend className="px-2 text-sm font-semibold text-slate-950">Style Match</legend>
              <label className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-700">
                <span>Show curated outfits as complete sets</span>
                <input type="checkbox" checked={styleMatch} onChange={(event) => setStyleMatch(event.target.checked)} className="h-5 w-5 rounded border-slate-300 text-teal-700 focus:ring-teal-700" aria-describedby="style-match-note" />
              </label>
              <p id="style-match-note" className="mt-2 text-sm text-slate-500">Adds set styling callouts to compatible items.</p>
            </fieldset>
          </form>
        </aside>

        <section aria-labelledby="products-heading">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="products-heading" className="text-2xl font-semibold text-slate-950">All products</h2>
              <p id="results-live-region" aria-live="polite" className="mt-2 text-sm text-slate-600">{items.length} products shown.</p>
            </div>
            <fieldset className="rounded-full border border-slate-200 px-4 py-2">
              <legend className="px-1 text-sm font-semibold text-slate-950">Sort</legend>
              <label className="text-sm text-slate-700">
                <span className="sr-only">Sort products</span>
                <select className="focus-ring rounded-full bg-transparent px-2 py-1 text-sm text-slate-700" aria-label="Sort products">
                  <option>Newest first</option>
                  <option>Price low to high</option>
                  <option>Price high to low</option>
                  <option>Most loved</option>
                </select>
              </label>
            </fieldset>
          </div>

          {styleMatch ? (
            <section aria-labelledby="sets-heading" className="mt-8 rounded-[2rem] border border-lime-300 bg-lime-50 p-6">
              <h3 id="sets-heading" className="text-xl font-semibold text-slate-950">Style Match sets</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">Curated outfits pair the featured piece with tonal layers, bags, and accessories. Open any product to see the full set breakdown.</p>
            </section>
          ) : null}

          <div className="mt-8 grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} href="./product.html" />
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ProductsPage />);

