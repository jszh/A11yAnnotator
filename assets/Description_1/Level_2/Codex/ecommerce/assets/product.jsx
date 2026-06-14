function ProductPage() {
  const product = window.NovaMartData.products.find((item) => item.id === "sony-wh1000xm5");
  const related = window.NovaMartData.related;
  const [activeImage, setActiveImage] = useState(product.gallery[0]);
  const [activeColor, setActiveColor] = useState(product.colors[0]);
  const [activeSize, setActiveSize] = useState(product.sizes[0]);
  const [activeTab, setActiveTab] = useState("description");
  const [liveMessage, setLiveMessage] = useState("");

  const tabContent = {
    description: product.description,
    specs: product.specs.join(" • "),
    reviews: "Customers praise the balanced sound, comfort during long listening sessions, and excellent active noise canceling for travel and work."
  };

  return (
    <PageLayout currentPage="product" liveMessage={liveMessage}>
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h1 className="text-4xl font-semibold text-slate-950">{product.name} - {formatPrice(product.price)}</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{product.description}</p>

          <section className="mt-8" aria-labelledby="product-gallery-heading">
            <h2 id="product-gallery-heading" className="text-2xl font-semibold text-slate-900">Image Gallery</h2>
            <div className="mt-4 overflow-hidden rounded-[2rem] bg-white shadow-sm">
              <img src={activeImage} alt={`${product.name} product view`} className="product-image w-full" />
            </div>
            <div className="mt-4 flex gap-3" role="list" aria-label={`${product.name} image gallery thumbnails`}>
              {product.gallery.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(image)}
                  className={`focus-ring overflow-hidden rounded-2xl border ${activeImage === image ? "border-slate-950" : "border-slate-200"}`}
                  aria-label={`Show image ${index + 1} for ${product.name}`}
                >
                  <img src={image} alt={`${product.name} thumbnail ${index + 1}`} className="h-20 w-20 object-cover" />
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="glass-panel rounded-[2rem] border border-white/70 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{product.brand}</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-3xl font-semibold text-slate-950">{formatPrice(product.price)}</span>
            <span className="text-base text-slate-400 line-through">{formatPrice(product.oldPrice)}</span>
            <span className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white">{product.discount}% off</span>
          </div>
          <div className="mt-4">
            <RatingStars rating={product.rating} labelId="product-rating" />
          </div>
          <p className="mt-4 text-sm font-medium text-emerald-700">{product.availability}</p>

          <fieldset className="mt-8">
            <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Color</legend>
            <div className="mt-4 flex flex-wrap gap-3">
              {product.colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setActiveColor(color)}
                  aria-pressed={activeColor === color}
                  className={`focus-ring rounded-full border px-4 py-2 text-sm ${activeColor === color ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 text-slate-700"}`}
                  aria-label={`Choose ${color} color for ${product.name}`}
                >
                  {color}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Size</legend>
            <div className="mt-4 flex flex-wrap gap-3">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setActiveSize(size)}
                  aria-pressed={activeSize === size}
                  className={`focus-ring rounded-full border px-4 py-2 text-sm ${activeSize === size ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 text-slate-700"}`}
                  aria-label={`Choose ${size} size for ${product.name}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setLiveMessage(`Added ${product.name} in ${activeColor} to cart.`)}
              className="focus-ring rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              aria-label={`Add ${product.name} in ${activeColor} size ${activeSize} to cart`}
            >
              Add to Cart
            </button>
            <button
              type="button"
              onClick={() => setLiveMessage(`Buy now selected for ${product.name}.`)}
              className="focus-ring rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white"
              aria-label={`Buy ${product.name} now`}
            >
              Buy Now
            </button>
          </div>

          <section className="mt-10" aria-labelledby="product-tabs-heading">
            <h2 id="product-tabs-heading" className="text-2xl font-semibold text-slate-900">Product Details</h2>
            <div className="mt-4 flex flex-wrap gap-3" role="tablist" aria-label="Product information tabs">
              {[
                ["description", "Description"],
                ["specs", "Specs"],
                ["reviews", "Reviews"]
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`tab-${key}`}
                  aria-controls={`panel-${key}`}
                  aria-selected={activeTab === key}
                  onClick={() => setActiveTab(key)}
                  className="tab-button focus-ring rounded-full px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300"
                >
                  {label}
                </button>
              ))}
            </div>
            {Object.entries(tabContent).map(([key, content]) => (
              <div
                key={key}
                id={`panel-${key}`}
                role="tabpanel"
                aria-labelledby={`tab-${key}`}
                hidden={activeTab !== key}
                className="mt-4 rounded-[1.5rem] bg-slate-50 p-5 text-sm leading-7 text-slate-700"
              >
                {content}
              </div>
            ))}
          </section>
        </aside>
      </section>

      <section className="mt-12" aria-labelledby="related-products-heading">
        <h2 id="related-products-heading" className="text-2xl font-semibold text-slate-900">Related Products</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} liveAnnounce={setLiveMessage} compact />
          ))}
        </div>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ProductPage />);
