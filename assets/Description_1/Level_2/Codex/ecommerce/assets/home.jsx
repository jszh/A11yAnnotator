function HomePage() {
  const { categories, deals } = window.NovaMartData;
  const slides = [
    {
      eyebrow: "Flash Sale",
      title: "Up to 50% off Electronics",
      text: "Shop noise-canceling audio, smart home picks, and portable tech with limited-time markdowns.",
      cta: "Browse electronics deals"
    },
    {
      eyebrow: "Weekend Refresh",
      title: "Home upgrades for every room",
      text: "Layer in lighting, bedding, and storage solutions designed for clean, calm spaces.",
      cta: "Explore home goods"
    },
    {
      eyebrow: "Active Picks",
      title: "Move smarter with sports essentials",
      text: "Fitness trackers, trail-ready footwear, and recovery tools curated for your next workout.",
      cta: "Shop sports gear"
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");

  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCurrentSlide((value) => (value + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [isPaused, slides.length]);

  const activeSlide = slides[currentSlide];

  return (
    <PageLayout currentPage="home" liveMessage={liveMessage}>
      <section className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="hero-slide rounded-[2rem] p-8 text-white shadow-xl shadow-sky-100">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-200">{activeSlide.eyebrow}</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
            {activeSlide.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-100">{activeSlide.text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="./products.html"
              className="focus-ring rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
              aria-label="Browse flash sale products"
            >
              {activeSlide.cta}
            </a>
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              className="focus-ring rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white"
              aria-pressed={isPaused}
              aria-label={isPaused ? "Resume hero rotation" : "Pause hero rotation"}
            >
              {isPaused ? "Resume banner" : "Pause banner"}
            </button>
          </div>
          <div className="mt-8 flex gap-3" aria-label="Hero banner slides">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setCurrentSlide(index)}
                className={`focus-ring h-3 w-12 rounded-full ${index === currentSlide ? "bg-white" : "bg-white/35"}`}
                aria-label={`Show banner: ${slide.title}`}
                aria-pressed={index === currentSlide}
              />
            ))}
          </div>
        </div>

        <aside className="glass-panel rounded-[2rem] border border-white/70 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Fast delivery perks</h2>
          <ul className="mt-6 space-y-4 text-sm text-slate-700">
            <li className="rounded-2xl bg-slate-50 p-4">Free shipping over $50 on eligible orders.</li>
            <li className="rounded-2xl bg-slate-50 p-4">Member deals updated every day at midnight.</li>
            <li className="rounded-2xl bg-slate-50 p-4">Easy returns with label-free drop off on select items.</li>
          </ul>
        </aside>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-slate-900">Trending Categories</h2>
        <p className="mt-2 text-sm text-slate-600">Quick links to the departments customers are browsing most right now.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <a
              key={category.name}
              href={category.href}
              className="focus-ring glass-panel rounded-[2rem] border border-white/70 p-6 shadow-sm transition hover:-translate-y-1"
              aria-label={`Browse ${category.name} products`}
            >
              <h3 className="text-xl font-semibold text-slate-900">{category.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{category.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Today&apos;s Deals</h2>
            <p className="mt-2 text-sm text-slate-600">Handpicked markdowns across NovaMart’s most popular departments.</p>
          </div>
          <a href="./products.html" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            View all deals
          </a>
        </div>
        <div className="hide-scrollbar mt-6 flex gap-5 overflow-x-auto pb-4" role="list" aria-label="Today's deals product list">
          {deals.map((product) => (
            <div key={product.id} role="listitem" className="min-w-[18rem] max-w-[18rem] flex-none">
              <ProductCard product={product} liveAnnounce={setLiveMessage} compact />
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<HomePage />);
