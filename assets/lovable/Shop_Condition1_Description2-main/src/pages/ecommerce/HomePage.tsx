import Layout from "@/components/ecommerce/Layout";
import ProductCard from "@/components/ecommerce/ProductCard";
import { products } from "@/data/products";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-spring.jpg";
import moodMinimalist from "@/assets/mood-minimalist.jpg";
import moodStreetwear from "@/assets/mood-streetwear.jpg";
import moodWorkwear from "@/assets/mood-workwear.jpg";
import moodWeekend from "@/assets/mood-weekend.jpg";

const moods = [
  { name: "Minimalist", image: moodMinimalist },
  { name: "Streetwear", image: moodStreetwear },
  { name: "Workwear", image: moodWorkwear },
  { name: "Weekend", image: moodWeekend },
];

const newArrivals = products.filter((p) => p.badge === "New" || p.badge === "Low Stock").concat(products.slice(3, 10));

export default function HomePage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[85vh] min-h-[500px] flex items-end" aria-label="Spring collection hero">
        <img
          src={heroImage}
          alt="Model wearing sustainable spring collection in a greenhouse"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/20 to-transparent" />
        <div className="relative container pb-16 md:pb-24 text-primary-foreground">
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold max-w-2xl leading-[1.1] mb-4 animate-fade-in">
            Wear What You Stand For
          </h1>
          <p className="text-lg md:text-xl opacity-80 mb-8 max-w-md animate-fade-in" style={{ animationDelay: "0.15s" }}>
            New Spring Collection — Sustainably crafted, independently designed.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-terracotta text-terracotta-foreground px-8 py-3.5 rounded-md font-medium text-sm hover:opacity-90 transition-opacity animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            Shop the Collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Shop by Mood */}
      <section className="container py-20" aria-labelledby="mood-heading">
        <h2 id="mood-heading" className="font-display text-3xl md:text-4xl font-semibold text-center mb-12">
          Shop by Mood
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {moods.map((mood) => (
            <Link
              to="/products"
              key={mood.name}
              className="group relative aspect-square rounded-lg overflow-hidden"
              aria-label={`Shop ${mood.name} style`}
            >
              <img
                src={mood.image}
                alt={`${mood.name} fashion mood`}
                loading="lazy"
                width={640}
                height={640}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-primary/30 group-hover:bg-primary/40 transition-colors" />
              <span className="absolute bottom-4 left-4 text-primary-foreground font-display text-lg md:text-xl font-semibold">
                {mood.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container pb-20" aria-labelledby="arrivals-heading">
        <div className="flex items-center justify-between mb-8">
          <h2 id="arrivals-heading" className="font-display text-3xl md:text-4xl font-semibold">New Arrivals</h2>
          <Link
            to="/products"
            className="text-sm font-medium text-accent hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" role="list" aria-label="New arrival products">
          {newArrivals.map((product) => (
            <div key={product.id} className="snap-start shrink-0 w-56 md:w-64" role="listitem">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      {/* Brand Story */}
      <section className="bg-sage-light" aria-labelledby="mission-heading">
        <div className="container py-20 text-center max-w-2xl mx-auto">
          <h2 id="mission-heading" className="font-display text-3xl md:text-4xl font-semibold mb-6">
            Fashion With Purpose
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            ThreadHouse partners with independent designers who prioritize sustainability,
            fair labor, and timeless design. Every piece tells a story — from the organic
            cotton fields to your wardrobe.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 border-2 border-foreground text-foreground px-8 py-3 rounded-md font-medium text-sm hover:bg-foreground hover:text-background transition-colors"
          >
            Our Mission <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
