import { useParams, Link } from "react-router-dom";
import { products } from "@/data/products";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/ecommerce/ProductCard";
import { useState, useRef, useEffect } from "react";
import { Star, ChevronLeft, X } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams();
  const product = products.find(p => p.id === id);
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"details" | "care" | "reviews">("details");
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Focus trap for size guide modal
  useEffect(() => {
    if (!sizeGuideOpen) return;
    const modal = modalRef.current;
    if (!modal) return;
    const focusable = modal.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setSizeGuideOpen(false); triggerRef.current?.focus(); }
      if (e.key !== "Tab") return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [sizeGuideOpen]);

  if (!product) return (
    <main className="container py-20 text-center">
      <h1 className="font-display text-2xl">Product not found</h1>
      <Link to="/shop" className="text-primary hover:underline mt-4 inline-block">Back to shop</Link>
    </main>
  );

  const suggestions = products.filter(p => p.mood === product.mood && p.id !== product.id).slice(0, 4);

  const reviews = [
    { name: "Alex M.", rating: 5, text: "Love the quality! Fits perfectly and the color is even better in person.", date: "2 weeks ago" },
    { name: "Jordan K.", rating: 4, text: "Great piece, runs slightly large. I'd recommend sizing down if you want a more fitted look.", date: "1 month ago" },
    { name: "Sam T.", rating: 5, text: "This is my third purchase from ThreadHouse. Consistently amazing quality and ethical production.", date: "3 weeks ago" },
  ];

  return (
    <main id="main-content" className="container py-8">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li><Link to="/" className="hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link to="/shop" className="hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">Shop</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground font-medium">{product.name}</li>
        </ol>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Images */}
        <section aria-label="Product images">
          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted mb-4">
            <img src={product.images[selectedImage]} alt={`${product.name} — view ${selectedImage + 1}`} width={800} height={1000} className="h-full w-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`aspect-[3/4] rounded-md overflow-hidden border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selectedImage === i ? "border-primary" : "border-transparent"
                }`}
                aria-label={`View photo ${i + 1} of ${product.name}`}
                aria-current={selectedImage === i ? "true" : undefined}
              >
                <img src={img} alt="" loading="lazy" width={200} height={250} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </section>

        {/* Product Info */}
        <section aria-labelledby="product-name">
          <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back to shop
          </Link>
          <h1 id="product-name" className="font-display text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground mt-1">{product.color}</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-2xl font-bold font-body">${product.price.toFixed(2)}</span>
            {product.originalPrice && <span className="text-lg text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>}
          </div>
          <div className="flex items-center gap-1 mt-2" aria-label={`Rating: ${product.rating} out of 5, ${product.reviewCount} reviews`}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-loyalty text-loyalty" : "text-muted"}`} aria-hidden="true" />
            ))}
            <span className="text-sm text-muted-foreground ml-2">{product.reviewCount} reviews</span>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          {/* Size */}
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold mb-3">
              Size
              <button
                ref={triggerRef}
                onClick={() => setSizeGuideOpen(true)}
                className="ml-3 text-xs text-primary underline font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                Size Guide
              </button>
            </legend>
            <div className="flex flex-wrap gap-2">
              {product.size.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`px-4 py-2 text-sm rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selectedSize === s ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted"
                  }`}
                  aria-pressed={selectedSize === s}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            onClick={() => {
              const size = selectedSize || product.size[0];
              addItem(product, size, product.color);
            }}
            className="mt-8 w-full py-4 bg-accent text-accent-foreground font-semibold rounded-md hover:bg-accent/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-sm"
            aria-label={`Add ${product.name} to cart`}
          >
            Add to Cart — ${product.price.toFixed(2)}
          </button>

          <p className="text-xs text-muted-foreground mt-3 text-center">Free shipping on orders over $100</p>

          {/* Tabs */}
          <div className="mt-10 border-t border-border pt-6" role="tablist" aria-label="Product information">
            {(["details", "care", "reviews"] as const).map(tab => (
              <button
                key={tab}
                role="tab"
                id={`tab-${tab}`}
                aria-selected={activeTab === tab}
                aria-controls={`panel-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "details" ? "Material & Details" : tab === "care" ? "Care Instructions" : "Reviews"}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="py-4">
            {activeTab === "details" && (
              <div className="space-y-2 text-sm">
                <p><strong>Material:</strong> {product.material}</p>
                <p><strong>Category:</strong> {product.category}</p>
                <p><strong>Style:</strong> {product.mood}</p>
                <p className="text-muted-foreground mt-2">{product.description}</p>
              </div>
            )}
            {activeTab === "care" && (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {product.careInstructions.map((inst, i) => <li key={i}>• {inst}</li>)}
              </ul>
            )}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                {reviews.map((review, i) => (
                  <article key={i} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="flex" aria-label={`${review.rating} out of 5 stars`}>
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className={`h-3 w-3 ${j < review.rating ? "fill-loyalty text-loyalty" : "text-muted"}`} aria-hidden="true" />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{review.name}</span>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{review.text}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Complete the Look */}
      {suggestions.length > 0 && (
        <section className="mt-20" aria-labelledby="suggestions-heading">
          <h2 id="suggestions-heading" className="font-display text-2xl font-bold mb-8">Complete the Look</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {suggestions.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50" role="dialog" aria-modal="true" aria-label="Size Guide" onClick={() => { setSizeGuideOpen(false); triggerRef.current?.focus(); }}>
          <div ref={modalRef} className="bg-background rounded-lg p-8 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold">Size Guide</h2>
              <button onClick={() => { setSizeGuideOpen(false); triggerRef.current?.focus(); }} className="p-2 hover:bg-muted rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close size guide">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border"><th className="py-2 text-left font-semibold">Size</th><th className="py-2 text-left">Chest (in)</th><th className="py-2 text-left">Waist (in)</th><th className="py-2 text-left">Length (in)</th></tr></thead>
              <tbody>
                {[["XS","32-34","26-28","27"],["S","34-36","28-30","28"],["M","36-38","30-32","29"],["L","38-40","32-34","30"],["XL","40-42","34-36","31"],["XXL","42-44","36-38","32"]].map(row => (
                  <tr key={row[0]} className="border-b border-border"><td className="py-2 font-medium">{row[0]}</td><td className="py-2">{row[1]}</td><td className="py-2">{row[2]}</td><td className="py-2">{row[3]}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
