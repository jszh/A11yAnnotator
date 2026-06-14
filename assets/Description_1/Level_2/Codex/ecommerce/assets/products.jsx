function ProductsPage() {
  const { products } = window.NovaMartData;
  const [liveMessage, setLiveMessage] = useState("");
  const [brandFilters, setBrandFilters] = useState([]);
  const [ratingFilter, setRatingFilter] = useState("0");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("best");

  const brands = [...new Set(products.map((product) => product.brand))].sort();

  const filteredProducts = useMemo(() => {
    let nextProducts = [...products];

    if (brandFilters.length > 0) {
      nextProducts = nextProducts.filter((product) => brandFilters.includes(product.brand));
    }

    if (Number(ratingFilter) > 0) {
      nextProducts = nextProducts.filter((product) => product.rating >= Number(ratingFilter));
    }

    if (availabilityFilter !== "all") {
      nextProducts = nextProducts.filter((product) => product.availability === availabilityFilter);
    }

    if (priceFilter === "under50") {
      nextProducts = nextProducts.filter((product) => product.price < 50);
    } else if (priceFilter === "50to100") {
      nextProducts = nextProducts.filter((product) => product.price >= 50 && product.price <= 100);
    } else if (priceFilter === "over100") {
      nextProducts = nextProducts.filter((product) => product.price > 100);
    }

    if (sortBy === "price-low") {
      nextProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === "rating") {
      nextProducts.sort((a, b) => b.rating - a.rating);
    } else {
      nextProducts.sort((a, b) => b.discount - a.discount);
    }

    return nextProducts;
  }, [availabilityFilter, brandFilters, priceFilter, products, ratingFilter, sortBy]);

  useEffect(() => {
    setLiveMessage(`${filteredProducts.length} products shown.`);
  }, [filteredProducts.length]);

  const toggleBrand = (brand) => {
    setBrandFilters((current) =>
      current.includes(brand) ? current.filter((item) => item !== brand) : [...current, brand]
    );
  };

  return (
    <PageLayout currentPage="products" liveMessage={liveMessage}>
      <section>
        <h1 className="text-4xl font-semibold text-slate-950">Browse NovaMart Marketplace</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Explore electronics, home goods, kitchen tools, and apparel with filters built for fast comparisons.
        </p>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="glass-panel h-fit rounded-[2rem] border border-white/70 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Filters</h2>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Brand</legend>
            <div className="mt-4 space-y-3">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-slate-950"
                    checked={brandFilters.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Price Range</legend>
            <div className="mt-4 space-y-3">
              {[
                ["all", "All prices"],
                ["under50", "Under $50"],
                ["50to100", "$50 to $100"],
                ["over100", "Over $100"]
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="price-range"
                    checked={priceFilter === value}
                    onChange={() => setPriceFilter(value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Rating</legend>
            <label className="mt-4 block text-sm text-slate-700">
              <span className="mb-2 block">Minimum customer rating</span>
              <select
                value={ratingFilter}
                onChange={(event) => setRatingFilter(event.target.value)}
                className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3"
                aria-label="Filter products by customer rating"
              >
                <option value="0">Any rating</option>
                <option value="4">4 stars and up</option>
                <option value="4.5">4.5 stars and up</option>
              </select>
            </label>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Availability</legend>
            <div className="mt-4 space-y-3">
              {["all", "In Stock", "Limited Stock"].map((value) => (
                <label key={value} className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="availability"
                    checked={availabilityFilter === value}
                    onChange={() => setAvailabilityFilter(value)}
                  />
                  <span>{value === "all" ? "All availability" : value}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </aside>

        <section aria-labelledby="products-grid-heading">
          <div className="glass-panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 id="products-grid-heading" className="text-2xl font-semibold text-slate-900">Product Listing</h2>
                <p className="mt-1 text-sm text-slate-600">{filteredProducts.length} items available now.</p>
              </div>
              <fieldset className="flex items-center gap-3">
                <legend className="text-sm font-semibold text-slate-700">Sort controls</legend>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="focus-ring rounded-full border border-slate-300 px-4 py-3 text-sm"
                  aria-label="Sort products"
                >
                  <option value="best">Best Match</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </fieldset>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} liveAnnounce={setLiveMessage} />
            ))}
          </div>
        </section>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ProductsPage />);
