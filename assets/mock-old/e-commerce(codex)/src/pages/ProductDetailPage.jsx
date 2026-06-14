function ProductDetailPage() {
  return (
    <section className="py-6">
      <article className="card-shell">
        <h1 className="text-3xl font-bold">Product Detail</h1>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_1fr]">
          <div className="flex min-h-[320px] items-center justify-center rounded-lg bg-slate-200">
            Large Product Placeholder
          </div>
          <div>
            <h2 className="text-2xl font-semibold">ProSound Noise Cancelling Headphones</h2>
            <p className="mt-3 text-slate-700">
              Experience immersive audio, long battery life, and comfortable all-day wear with this premium over-ear headset.
            </p>
            <p className="mt-4 text-3xl font-extrabold">$129.99</p>
            <span className="mt-2 inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-900">Prime eligible</span>
            <p className="mt-3 text-slate-700">In stock. Ships within 24 hours.</p>
            <button type="button" className="mt-3 rounded-full bg-accent px-4 py-2 font-bold text-slate-900 hover:bg-amber-500">
              Add to Cart
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}

export default ProductDetailPage;
