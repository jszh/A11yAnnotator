import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";
import { products, categories } from "../data/products";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const banners = [
  { title: "Flash Sale: Up to 50% off Electronics", subtitle: "Limited time deals on headphones, TVs, cameras and more", cta: "Shop Electronics", link: "/products?category=Electronics", bg: "from-foreground to-foreground/80" },
  { title: "New Season, New Style", subtitle: "Explore the latest arrivals in apparel and footwear", cta: "Shop Clothing", link: "/products?category=Clothing", bg: "from-primary/90 to-primary/60" },
  { title: "Kitchen Essentials Sale", subtitle: "Save big on top-rated kitchen appliances", cta: "Shop Kitchen", link: "/products?category=Kitchen", bg: "from-nova-charcoal to-foreground/70" },
];

export default function HomePage() {
  const [bannerIndex, setBannerIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const todaysDeals = products.filter(p => p.badge === "sale").slice(0, 8);
  const trending = products.filter(p => p.rating >= 4.5).slice(0, 4);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setBannerIndex(i => (i + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [paused]);

  const banner = banners[bannerIndex];

  return (
    <Layout>
      {/* Hero Banner */}
      <section aria-label="Promotional banners" className="relative">
        <div className={`bg-gradient-to-r ${banner.bg} text-background`}>
          <div className="container py-16 md:py-24">
            <div className="max-w-xl animate-fade-in" key={bannerIndex}>
              <h1 className="text-3xl md:text-5xl font-display font-bold leading-tight mb-4">{banner.title}</h1>
              <p className="text-lg opacity-80 mb-6">{banner.subtitle}</p>
              <Link
                to={banner.link}
                className="inline-block px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                {banner.cta}
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <button
            onClick={() => setBannerIndex(i => (i - 1 + banners.length) % banners.length)}
            aria-label="Previous banner"
            className="p-1 rounded-full bg-background/30 hover:bg-background/50 text-background"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setBannerIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === bannerIndex ? "bg-background w-6" : "bg-background/40"}`}
              aria-label={`Go to banner ${i + 1}`}
              aria-current={i === bannerIndex ? "true" : undefined}
            />
          ))}
          <button
            onClick={() => setBannerIndex(i => (i + 1) % banners.length)}
            aria-label="Next banner"
            className="p-1 rounded-full bg-background/30 hover:bg-background/50 text-background"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPaused(!paused)}
            className="ml-2 p-1 rounded-full bg-background/30 hover:bg-background/50 text-background text-xs font-bold"
            aria-label={paused ? "Play banner rotation" : "Pause banner rotation"}
          >
            {paused ? "▶" : "⏸"}
          </button>
        </div>
      </section>

      {/* Categories */}
      <section aria-labelledby="categories-heading" className="container py-12">
        <h2 id="categories-heading" className="text-2xl font-display font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.name}
              to={`/products?category=${cat.name}`}
              className="flex flex-col items-center gap-2 p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
            >
              <span className="text-4xl" aria-hidden="true">{cat.icon}</span>
              <span className="text-sm font-semibold">{cat.name}</span>
              <span className="text-xs text-muted-foreground">{cat.count.toLocaleString()} items</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Today's Deals */}
      <section aria-labelledby="deals-heading" className="container pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 id="deals-heading" className="text-2xl font-display font-bold">Today's Deals</h2>
          <Link to="/products?sort=sale" className="text-sm font-semibold text-primary hover:underline">View all →</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin" role="list">
          {todaysDeals.map(product => (
            <div key={product.id} className="min-w-[240px] max-w-[240px] snap-start" role="listitem">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section aria-labelledby="trending-heading" className="container pb-12">
        <h2 id="trending-heading" className="text-2xl font-display font-bold mb-6">Trending Now</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trending.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </Layout>
  );
}
