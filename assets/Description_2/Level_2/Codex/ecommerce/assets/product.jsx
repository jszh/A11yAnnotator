const { Modal, PageShell, ProductCard, Tabs, productCatalog } = window.ThreadHouse;

function ProductPage() {
  const product = productCatalog[0];
  const [open, setOpen] = React.useState(false);
  const [selectedSize, setSelectedSize] = React.useState("M");
  const [selectedImage, setSelectedImage] = React.useState(0);
  const gallery = [
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80",
  ];
  const suggestions = productCatalog.slice(4, 8);

  const detailTabs = [
    {
      id: "materials",
      label: "Materials",
      content: <p>55% linen, 45% organic cotton. The yarn is garment washed for softness and sourced from mills using closed-loop dye systems.</p>,
    },
    {
      id: "care",
      label: "Care instructions",
      content: <p>Cold gentle wash, line dry in shade, and steam lightly to keep the oversized drape. Avoid bleach and high-heat tumble cycles.</p>,
    },
    {
      id: "fit",
      label: "Fit notes",
      content: <p>Designed with dropped shoulders and a relaxed torso. Choose your usual size for an easy oversized look or size down for a closer fit.</p>,
    },
  ];

  const announce = (message) => {
    const region = document.getElementById("global-live-region");
    if (!region) return;
    region.textContent = "";
    window.setTimeout(() => {
      region.textContent = message;
    }, 60);
  };

  return (
    <PageShell
      eyebrow="Featured product"
      title="Oversized Linen Shirt — Sage Green – $89.00"
      description="A breathable hero layer with a soft washed finish, built for versatile spring styling and year-round layering."
    >
      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <section aria-labelledby="gallery-heading">
          <h2 id="gallery-heading" className="text-2xl font-semibold text-slate-950">Lifestyle gallery</h2>
          <div className="image-grid mt-6 grid gap-4 md:grid-cols-2">
            {gallery.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => setSelectedImage(index)}
                className={`focus-ring overflow-hidden rounded-[2rem] border ${selectedImage === index ? "border-teal-700" : "border-slate-200"} text-left`}
                aria-label={`View lifestyle photo ${index + 1} of Oversized Linen Shirt`}
              >
                <img src={src} alt={`Oversized Linen Shirt shown in lifestyle photo ${index + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="purchase-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 id="purchase-heading" className="text-2xl font-semibold text-slate-950">Product details</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">Relaxed fit, sage green garment dye, corozo buttons, and a soft collar line that works open or buttoned.</p>
            <p className="mt-5 text-3xl font-semibold text-slate-950">$89.00</p>

            <fieldset className="mt-6 rounded-2xl border border-slate-200 p-4">
              <legend className="px-2 text-sm font-semibold text-slate-950">Choose size</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {["XS", "S", "M", "L", "XL"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`focus-ring rounded-full px-4 py-2 text-sm font-medium ${selectedSize === size ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700"}`}
                    aria-pressed={selectedSize === size}
                    aria-label={`Select size ${size} for Oversized Linen Shirt`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => announce(`Oversized Linen Shirt in size ${selectedSize} added to cart.`)} className="focus-ring rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white" aria-label={`Add Oversized Linen Shirt size ${selectedSize} to cart`}>
                Add to cart
              </button>
              <button type="button" onClick={() => setOpen(true)} className="focus-ring rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700" aria-haspopup="dialog" aria-expanded={open}>
                Open size guide
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-500">Free exchanges within 30 days. Low stock in XS and XL.</p>
          </section>

          <Tabs tabs={detailTabs} />
        </aside>
      </div>

      <section aria-labelledby="complete-look-heading" className="mt-16">
        <h2 id="complete-look-heading" className="text-3xl font-semibold text-slate-950">Complete the Look</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">Pair the featured shirt with tonal separates and utility accessories for an easy studio-to-street set.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {suggestions.map((item) => (
            <ProductCard key={item.id} product={item} href="./product.html" actionLabel="Add to cart" />
          ))}
        </div>
      </section>

      <section aria-labelledby="review-heading" className="mt-16 rounded-[2rem] border border-slate-200 bg-white p-8">
        <h2 id="review-heading" className="text-3xl font-semibold text-slate-950">Customer photo reviews</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {[
            ["Avery, Portland", "Wore this open over a tank on a weekend trip. The drape feels premium and the color is even better in daylight."],
            ["Jordan, Toronto", "Sized down for a sharper office fit. The fabric breathes well and still looks polished after a full day."],
            ["Rin, Seoul", "Love the oversized cut with wide-leg pants. I appreciate the care notes and material transparency."],
          ].map(([name, quote], index) => (
            <article key={name} className="rounded-[2rem] border border-slate-200 p-5">
              <img src={gallery[index]} alt={`${name} wearing the Oversized Linen Shirt`} className="h-64 w-full rounded-[1.5rem] object-cover" />
              <h3 className="mt-4 text-lg font-semibold text-slate-950">{name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{quote}</p>
            </article>
          ))}
        </div>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="Size guide">
        <p className="text-sm leading-7 text-slate-600">Measure across your shoulder line and chest, then compare with the chart below. All measurements are in inches.</p>
        <table className="mt-6 w-full border-collapse text-left text-sm">
          <caption className="sr-only">Oversized Linen Shirt size chart</caption>
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-3">Size</th>
              <th className="py-3">Chest</th>
              <th className="py-3">Length</th>
              <th className="py-3">Sleeve</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["XS", "41", "27", "22.5"],
              ["S", "43", "27.5", "23"],
              ["M", "45", "28", "23.5"],
              ["L", "47", "28.5", "24"],
              ["XL", "49", "29", "24.5"],
            ].map((row) => (
              <tr key={row[0]} className="border-b border-slate-100">
                {row.map((value) => (
                  <td key={value} className="py-3">{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ProductPage />);

