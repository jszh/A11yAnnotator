import { Link } from 'react-router-dom';

function HeroBanner() {
  return (
    <section className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-blue-700 to-blue-400 text-white">
      <button
        className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-blue-900"
        aria-label="Previous slide"
        type="button"
      >
        ‹
      </button>
      <div className="grid grid-cols-1 items-center gap-6 px-8 py-10 md:grid-cols-[1.1fr_1fr] md:px-14">
        <div>
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">Big Deals. Fast Delivery. Everyday Essentials.</h1>
          <p className="mt-4 max-w-xl">
            Discover top brands, trending picks, and exclusive savings curated for your home, work, and lifestyle.
          </p>
          <Link
            to="/products"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 font-bold text-slate-900 hover:bg-amber-500"
          >
            Shop Now
          </Link>
        </div>
        <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-white/20 bg-white/10 text-lg">
          Lifestyle / Product Placeholder
        </div>
      </div>
      <button
        className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-blue-900"
        aria-label="Next slide"
        type="button"
      >
        ›
      </button>
    </section>
  );
}

export default HeroBanner;
