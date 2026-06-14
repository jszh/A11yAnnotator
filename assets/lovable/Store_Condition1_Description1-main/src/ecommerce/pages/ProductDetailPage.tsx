import { useParams, Link } from "react-router-dom";
import { Star, ShoppingCart, Zap, ChevronRight } from "lucide-react";
import { useState } from "react";
import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";
import { Button } from "@/components/ui/button";
import { products } from "../data/products";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";

const ProductDetailPage = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === Number(id)) || products[0];
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState("description");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const [quantity, setQuantity] = useState(1);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const categoryEmoji: Record<string, string> = {
    electronics: "🎧",
    kitchen: "🍳",
    clothing: "👕",
    sports: "⚽",
  };

  const specs = product.specs || {
    Brand: product.brand,
    Category: product.category.charAt(0).toUpperCase() + product.category.slice(1),
    Rating: `${product.rating}/5`,
    Reviews: product.reviews.toLocaleString(),
    Availability: product.inStock ? "In Stock" : "Out of Stock",
  };

  const mockReviews = [
    { name: "Alex M.", rating: 5, date: "2 weeks ago", text: "Absolutely love this product! Quality is outstanding and it arrived quickly." },
    { name: "Sarah K.", rating: 4, date: "1 month ago", text: "Great value for the price. Minor issue with packaging but the product itself is perfect." },
    { name: "James R.", rating: 5, date: "3 weeks ago", text: "Best purchase I've made this year. Highly recommend to everyone." },
  ];

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="container py-4">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/products" className="hover:text-foreground transition-colors">Products</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/products?category=${product.category}`} className="hover:text-foreground transition-colors capitalize">
            {product.category}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      {/* Product detail */}
      <div className="container pb-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="bg-secondary/50 rounded-xl flex items-center justify-center aspect-square text-8xl border border-border">
            <span className="opacity-50">{categoryEmoji[product.category] || "📦"}</span>
          </div>

          {/* Info */}
          <div>
            {product.badge && (
              <span className="inline-block bg-badge-sale text-badge-sale-foreground text-xs font-bold px-2.5 py-1 rounded-md mb-3">
                {product.badge}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-star text-star" : "text-muted"}`} />
                ))}
              </div>
              <span className="text-sm text-accent font-medium">{product.rating}</span>
              <span className="text-sm text-muted-foreground">({product.reviews.toLocaleString()} reviews)</span>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold font-display text-foreground">${product.price}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">${product.originalPrice}</span>
                  <span className="text-sm font-bold text-accent">Save {discount}%</span>
                </>
              )}
            </div>

            {/* Color selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-foreground mb-2">Color: <span className="text-muted-foreground">{selectedColor}</span></p>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 text-sm rounded-md border transition-all ${selectedColor === color ? "border-accent bg-accent/10 text-accent font-medium" : "border-border text-muted-foreground hover:border-foreground"}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <p className="text-sm font-medium text-foreground mb-2">Quantity</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>–</Button>
                <span className="w-12 text-center font-medium text-foreground">{quantity}</span>
                <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>+</Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-6">
              <Button
                variant="accent"
                size="lg"
                className="flex-1 gap-2"
                onClick={() => {
                  for (let i = 0; i < quantity; i++) addItem(product);
                  toast.success(`${quantity}x ${product.name} added to cart`);
                }}
                disabled={!product.inStock}
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </Button>
              <Button size="lg" className="flex-1 gap-2" disabled={!product.inStock}>
                <Zap className="h-4 w-4" /> Buy Now
              </Button>
            </div>

            {product.inStock ? (
              <p className="text-sm text-success font-medium">✓ In Stock — Ships in 1-2 business days</p>
            ) : (
              <p className="text-sm text-destructive font-medium">✕ Currently Out of Stock</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="flex gap-6 border-b border-border mb-6">
            {["description", "specs", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 ${activeTab === tab ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "description" && (
            <div className="prose max-w-none text-foreground">
              <p className="text-muted-foreground leading-relaxed">
                {product.description || `The ${product.name} is a premium product from ${product.brand}, designed with quality and performance in mind. This product offers exceptional value with top-tier materials, innovative features, and a design that stands the test of time. Perfect for everyday use, it combines functionality with style to deliver an outstanding experience.`}
              </p>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(specs).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2.5 px-3 bg-secondary/50 rounded-md">
                  <span className="text-sm font-medium text-foreground">{key}</span>
                  <span className="text-sm text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-4">
              {mockReviews.map((review, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`h-3.5 w-3.5 ${j < review.rating ? "fill-star text-star" : "text-muted"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-foreground">{review.name}</span>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold font-display text-foreground mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetailPage;
