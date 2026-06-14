import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import Layout from "@/components/ecommerce/Layout";
import ProductCard from "@/components/ecommerce/ProductCard";
import { products } from "@/data/products";
import { Minus, Plus, Heart, ChevronRight, Star, X } from "lucide-react";

const tabs = ["Description", "Material & Care", "Reviews"];

export default function ProductDetailPage() {
  const { id } = useParams();
  const product = products.find((p) => p.id === id) || products[0];
  const [selectedSize, setSelectedSize] = useState("");
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("Description");
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  return (
    <Layout>
      {/* Breadcrumb */}
      <nav className="container pt-6 pb-2" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 text-sm text-muted-foreground">
          <li><Link to="/" className="hover:text-foreground">Home</Link></li>
          <li><ChevronRight className="h-3.5 w-3.5" /></li>
          <li><Link to="/products" className="hover:text-foreground">Shop</Link></li>
          <li><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="text-foreground font-medium" aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className="container pb-20">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-md overflow-hidden bg-secondary">
                <img
                  src={product.image}
                  alt={`${product.name} - view ${i + 1}`}
                  loading={i === 0 ? undefined : "lazy"}
                  width={640}
                  height={800}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <h1 className="font-display text-2xl md:text-3xl font-semibold">{product.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{product.color}</p>
            <p className="text-2xl font-semibold mt-4">${product.price.toFixed(2)}</p>

            {/* Color */}
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Color: {product.color}</p>
              <div
                className="w-8 h-8 rounded-full border-2 border-foreground"
                style={{ backgroundColor: product.colorHex }}
                aria-label={product.color}
              />
            </div>

            {/* Size */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Size</p>
                <button
                  onClick={() => setSizeGuideOpen(true)}
                  className="text-xs text-accent hover:underline font-medium"
                >
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select size">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    role="radio"
                    aria-checked={selectedSize === s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                      selectedSize === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Quantity</p>
              <div className="inline-flex items-center border border-border rounded-md">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-2 hover:bg-secondary transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 text-sm font-medium min-w-[2rem] text-center" aria-live="polite">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="p-2 hover:bg-secondary transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 flex gap-3">
              <button className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-md font-medium text-sm hover:opacity-90 transition-opacity">
                Add to Cart
              </button>
              <button
                className="p-3.5 border border-border rounded-md hover:bg-secondary transition-colors"
                aria-label="Add to wishlist"
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-3">Free shipping on orders over $100. Estimated delivery: 5-7 business days.</p>

            {/* Tabs */}
            <div className="mt-10 border-t border-border pt-8">
              <div className="flex gap-6 border-b border-border" role="tablist">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                      activeTab === tab ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="py-6 text-sm leading-relaxed text-muted-foreground" role="tabpanel">
                {activeTab === "Description" && <p>{product.description}</p>}
                {activeTab === "Material & Care" && (
                  <div className="space-y-3">
                    <p><strong className="text-foreground">Material:</strong> {product.material}</p>
                    <p><strong className="text-foreground">Care:</strong> Machine wash cold, hang dry. Do not bleach.</p>
                    <p><strong className="text-foreground">Origin:</strong> Ethically made in Portugal</p>
                  </div>
                )}
                {activeTab === "Reviews" && (
                  <div className="space-y-6">
                    {[
                      { name: "Sarah M.", rating: 5, text: "Love the quality and fit! True to size and so comfortable.", date: "March 2026" },
                      { name: "Jamie K.", rating: 4, text: "Great piece, slightly longer than expected but still love it.", date: "February 2026" },
                    ].map((review, i) => (
                      <div key={i} className="border-b border-border pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex" aria-label={`${review.rating} out of 5 stars`}>
                            {[...Array(5)].map((_, j) => (
                              <Star key={j} className={`h-3.5 w-3.5 ${j < review.rating ? "fill-terracotta text-terracotta" : "text-border"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{review.date}</span>
                        </div>
                        <p className="text-foreground font-medium text-sm">{review.name}</p>
                        <p className="mt-1">{review.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Complete the Look */}
        {related.length > 0 && (
          <section className="mt-20" aria-labelledby="complete-heading">
            <h2 id="complete-heading" className="font-display text-2xl md:text-3xl font-semibold mb-8">Complete the Look</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50" role="dialog" aria-modal="true" aria-label="Size guide">
          <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4 relative">
            <button onClick={() => setSizeGuideOpen(false)} className="absolute top-4 right-4 p-1" aria-label="Close size guide">
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-display text-xl font-semibold mb-6">Size Guide</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium">Size</th>
                  <th className="text-left py-2 font-medium">Chest (in)</th>
                  <th className="text-left py-2 font-medium">Waist (in)</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[["XS","32-34","24-26"],["S","34-36","26-28"],["M","36-38","28-30"],["L","38-40","30-32"],["XL","40-42","32-34"],["XXL","42-44","34-36"]].map(([s,c,w])=>(
                  <tr key={s} className="border-b border-border last:border-0">
                    <td className="py-2 text-foreground font-medium">{s}</td>
                    <td className="py-2">{c}</td>
                    <td className="py-2">{w}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
