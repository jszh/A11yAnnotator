import { Link } from "react-router-dom";
import { ArrowRight, Truck, Shield, RotateCcw, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";
import { Button } from "@/components/ui/button";
import { products, categories } from "../data/products";

const HomePage = () => {
  const deals = products.filter((p) => p.originalPrice).slice(0, 8);
  const bestSellers = products.filter((p) => p.badge === "Best Seller");

  return (
    <Layout>
      {/* Hero */}
      <section className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
        <div className="container relative py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="inline-block bg-accent text-accent-foreground text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              ⚡ FLASH SALE — LIMITED TIME
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground leading-tight mb-4">
              Up to <span className="text-accent">50% off</span> Electronics
            </h1>
            <p className="text-lg text-primary-foreground/70 mb-8 max-w-lg">
              Shop the biggest deals of the season on headphones, TVs, tablets, and more. Free shipping on orders over $50.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products?category=electronics">
                <Button variant="accent" size="lg" className="gap-2">
                  Shop Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="accent-outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  Browse All
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: Truck, label: "Free Shipping", sub: "Orders $50+" },
              { icon: Shield, label: "Secure Checkout", sub: "256-bit SSL" },
              { icon: RotateCcw, label: "Easy Returns", sub: "30-day policy" },
              { icon: Headphones, label: "24/7 Support", sub: "Always here" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center justify-center gap-2">
                <Icon className="h-5 w-5 text-accent shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12">
        <h2 className="text-2xl font-bold font-display mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/products?category=${cat.slug}`}
              className="group bg-card rounded-lg p-6 text-center shadow-card hover:shadow-card-hover transition-all duration-300 border border-border hover:border-accent"
            >
              <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform">{cat.icon}</span>
              <h3 className="font-display font-semibold text-foreground">{cat.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {products.filter((p) => p.category === cat.slug).length} products
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Today's Deals */}
      <section className="container pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-display">Today's Deals</h2>
          <Link to="/products" className="text-sm text-accent hover:underline font-medium flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {deals.map((product) => (
            <div key={product.id} className="min-w-[200px] max-w-[200px] shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="bg-secondary/50 py-12">
        <div className="container">
          <h2 className="text-2xl font-bold font-display mb-6">Best Sellers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="container py-16">
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-display text-primary-foreground mb-3">
            Don't Miss Out on Deals
          </h2>
          <p className="text-primary-foreground/70 mb-6 max-w-md mx-auto">
            Subscribe to our newsletter and get exclusive offers delivered to your inbox.
          </p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 h-11 px-4 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <Button variant="accent" size="lg">Subscribe</Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;
