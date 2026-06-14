import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";
import StarRating from "../components/StarRating";
import { products, reviews } from "../data/products";
import { useCart } from "../context/CartContext";
import { Minus, Plus, ChevronRight } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const product = products.find(p => p.id === id);
  const { addItem } = useCart();

  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] ?? "");
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">("description");

  if (!product) {
    return (
      <Layout title="Product Not Found">
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-display font-bold">Product not found</h1>
          <Link to="/products" className="mt-4 inline-block text-primary hover:underline">Browse all products</Link>
        </div>
      </Layout>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const tabs = [
    { id: "description" as const, label: "Description" },
    { id: "specs" as const, label: "Specifications" },
    { id: "reviews" as const, label: `Reviews (${reviews.length})` },
  ];

  return (
    <Layout title={product.name}>
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
            <li><Link to={`/products?category=${product.category}`} className="hover:text-foreground">{product.category}</Link></li>
            <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
            <li aria-current="page" className="text-foreground font-medium truncate max-w-[200px]">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <section aria-label="Product images">
            <div className="aspect-square rounded-xl overflow-hidden bg-secondary border border-border">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
          </section>

          {/* Info */}
          <section aria-label="Product information">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">{product.brand}</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold leading-tight mb-3">{product.name}</h1>
            <div className="mb-4">
              <StarRating rating={product.rating} count={product.reviewCount} size="md" />
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-display font-bold">${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
                  <span className="px-2 py-0.5 text-xs font-bold bg-nova-badge-sale text-nova-badge-sale-foreground rounded-md">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>

            <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

            {/* Color selector */}
            {product.colors && product.colors.length > 0 && (
              <fieldset className="mb-4">
                <legend className="text-sm font-semibold mb-2">Color: <span className="font-normal text-muted-foreground">{selectedColor}</span></legend>
                <div className="flex gap-2">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${selectedColor === color ? "border-primary bg-accent font-semibold" : "border-input hover:border-foreground/30"}`}
                      aria-pressed={selectedColor === color}
                      aria-label={`Color: ${color}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* Size selector */}
            {product.sizes && product.sizes.length > 0 && (
              <fieldset className="mb-6">
                <legend className="text-sm font-semibold mb-2">Size: <span className="font-normal text-muted-foreground">{selectedSize}</span></legend>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-10 text-sm rounded-lg border transition-colors ${selectedSize === size ? "border-primary bg-accent font-semibold" : "border-input hover:border-foreground/30"}`}
                      aria-pressed={selectedSize === size}
                      aria-label={`Size ${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex items-center border border-input rounded-lg">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-3 hover:bg-secondary rounded-l-lg transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <label className="sr-only" htmlFor="quantity-input">Quantity</label>
                <input
                  id="quantity-input"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center text-sm font-semibold bg-transparent border-x border-input focus:outline-none"
                  aria-label="Quantity"
                />
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="p-3 hover:bg-secondary rounded-r-lg transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => addItem(product, quantity, selectedColor, selectedSize)}
                className="flex-1 py-3 px-6 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors text-sm"
                aria-label={`Add ${product.name} to cart`}
              >
                Add to Cart
              </button>
              <Link
                to="/cart"
                onClick={() => addItem(product, quantity, selectedColor, selectedSize)}
                className="py-3 px-6 bg-foreground text-background font-semibold rounded-lg hover:bg-foreground/90 transition-colors text-sm text-center"
              >
                Buy Now
              </Link>
            </div>

            {/* Stock status */}
            <p className={`text-sm font-medium ${product.inStock ? "text-nova-success" : "text-destructive"}`}>
              {product.inStock ? "✓ In Stock" : "✗ Out of Stock"}
            </p>
          </section>
        </div>

        {/* Tabs */}
        <section className="mt-12" aria-label="Product details tabs">
          <div role="tablist" className="flex border-b border-border">
            {tabs.map(tab => (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${activeTab === tab.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="py-6"
          >
            {activeTab === "description" && (
              <p className="text-muted-foreground leading-relaxed max-w-2xl">{product.description}</p>
            )}
            {activeTab === "specs" && (
              <div className="max-w-lg">
                <dl>
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="flex py-3 border-b border-border last:border-0">
                      <dt className="w-40 text-sm font-medium">{key}</dt>
                      <dd className="text-sm text-muted-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="space-y-6 max-w-2xl">
                {reviews.map(review => (
                  <article key={review.id} className="border-b border-border pb-6 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <StarRating rating={review.rating} />
                      <span className="text-sm font-semibold">{review.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      By {review.author} on {review.date}
                      {review.verified && <span className="ml-2 text-nova-success font-medium">✓ Verified Purchase</span>}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-12">
            <h2 id="related-heading" className="text-2xl font-display font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
