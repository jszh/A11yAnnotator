import { Link } from "react-router-dom";
import Layout from "@/components/ecommerce/Layout";
import ProductCard from "@/components/ecommerce/ProductCard";
import { products } from "@/data/products";
import heroImage from "@/assets/hero-spring.jpg";
import moodMinimalist from "@/assets/mood-minimalist.jpg";
import moodStreetwear from "@/assets/mood-streetwear.jpg";
import moodWorkwear from "@/assets/mood-workwear.jpg";
import moodWeekend from "@/assets/mood-weekend.jpg";
import { ArrowRight, Leaf } from "lucide-react";
import { useRef } from "react";

const moods = [
  { name: "Minimalist", image: moodMinimalist },
  { name: "Streetwear", image: moodStreetwear },
  { name: "Workwear", image: moodWorkwear },
  { name: "Weekend", image: moodWeekend },
];

const newArrivals = products.filter(p => p.badge === "New" || p.badge === "Low Stock").slice(0, 8);

const HomePage = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[90vh] overflow-hidden">
        <img src={heroImage} alt="Spring Collection" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-foreground/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-2xl px-4">
            <p className="text-sm tracking-[0.3em] uppercase text-background/80 mb-4">Spring 2026 Collection</p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-medium text-background leading-tight mb-6">
              Wear What You Stand For
            </h1>
            <p className="text-background/80 text-lg mb-8">New Spring Collection</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/products" className="btn-primary bg-background text-foreground hover:bg-background/90">
                Shop Now
              </Link>
              <Link to="/products" className="btn-outline border-background text-background hover:bg-background hover:text-foreground">
                Explore
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Mood */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="section-heading">Shop by Mood</h2>
          <p className="text-muted-foreground mt-3">Find pieces that match your vibe</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {moods.map((mood) => (
            <Link
              key={mood.name}
              to={`/products`}
              className="relative aspect-[3/4] rounded-sm overflow-hidden group cursor-pointer"
            >
              <img src={mood.image} alt={mood.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/40 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-display text-xl md:text-2xl font-medium text-background">{mood.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-heading">New Arrivals</h2>
              <p className="text-muted-foreground mt-2">Fresh drops, ethically made</p>
            </div>
            <Link to="/products" className="hidden md:flex items-center gap-2 text-sm font-medium tracking-wide uppercase text-primary hover:text-foreground transition-colors">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            {newArrivals.map((product) => (
              <div key={product.id} className="min-w-[260px] md:min-w-[280px] snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <Leaf className="mx-auto mb-6 text-primary" size={36} />
          <h2 className="section-heading mb-6">Fashion With a Conscience</h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            At ThreadHouse, every stitch tells a story. We partner with independent designers who share our commitment to sustainable materials, fair wages, and timeless design. Because looking good should never come at the planet's expense.
          </p>
          <Link to="/products" className="btn-outline inline-block">Our Mission</Link>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;
