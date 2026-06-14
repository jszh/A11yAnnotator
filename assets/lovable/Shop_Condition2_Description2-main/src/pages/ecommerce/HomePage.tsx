import { Link } from "react-router-dom";
import { products, moods } from "@/data/products";
import ProductCard from "@/components/ecommerce/ProductCard";
import heroImage from "@/assets/hero-spring.jpg";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";

const moodImages: Record<string, string> = {
  Minimalist: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=400&fit=crop",
  Streetwear: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=600&h=400&fit=crop",
  Workwear: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop",
  Weekend: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop",
};

export default function HomePage() {
  const newArrivals = products.filter(p => p.badge === "New" || p.badge === "Low Stock").slice(0, 10);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <main id="main-content">
      {/* Hero */}
      <section className="relative h-[85vh] min-h-[500px] flex items-center" aria-labelledby="hero-heading">
        <img
          src={heroImage}
          alt="Model wearing sustainable spring collection linen clothing"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/40" aria-hidden="true" />
        <div className="container relative z-10 text-primary-foreground">
          <h1 id="hero-heading" className="font-display text-4xl md:text-6xl lg:text-7xl font-bold max-w-2xl leading-tight">
            Wear What You Stand For
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-lg opacity-90 font-body">
            New Spring Collection — Sustainably made, independently designed.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-accent text-accent-foreground font-semibold rounded-md hover:bg-accent/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-sm"
          >
            Shop the Collection <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Shop by Mood */}
      <section className="container py-20" aria-labelledby="mood-heading">
        <h2 id="mood-heading" className="font-display text-3xl font-bold text-center mb-12">Shop by Mood</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {moods.map(mood => (
            <Link
              key={mood}
              to={`/shop?mood=${mood}`}
              className="relative rounded-lg overflow-hidden aspect-[3/2] group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Shop ${mood} style`}
            >
              <img src={moodImages[mood]} alt={`${mood} style`} loading="lazy" width={600} height={400} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-foreground/30 group-hover:bg-foreground/40 transition-colors" aria-hidden="true" />
              <span className="absolute bottom-4 left-4 font-display text-xl font-bold text-primary-foreground">{mood}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container py-16" aria-labelledby="arrivals-heading">
        <div className="flex items-center justify-between mb-8">
          <h2 id="arrivals-heading" className="font-display text-3xl font-bold">New Arrivals</h2>
          <Link to="/shop" className="text-sm font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            View All <ArrowRight className="inline h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          role="region"
          aria-label="New arrivals carousel"
          tabIndex={0}
        >
          {newArrivals.map(product => (
            <div key={product.id} className="snap-start">
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>
      </section>

      {/* Brand Story */}
      <section className="bg-secondary py-20" aria-labelledby="mission-heading">
        <div className="container max-w-3xl text-center">
          <h2 id="mission-heading" className="font-display text-3xl font-bold mb-6">Fashion That Gives Back</h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            At ThreadHouse, every piece tells a story. We partner with independent designers and sustainable manufacturers to create clothing that looks good and does good. From organic cotton to recycled denim, every material is chosen with intention. 2% of every purchase goes to environmental restoration projects.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary font-semibold rounded-md hover:bg-primary hover:text-primary-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
          >
            Our Mission <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
