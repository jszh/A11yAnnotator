import { useParams, Link } from "react-router-dom";
import Layout from "@/components/ecommerce/Layout";
import ProductCard from "@/components/ecommerce/ProductCard";
import { products } from "@/data/products";
import { useState } from "react";
import { Heart, Minus, Plus, Star, Truck, Leaf, Ruler } from "lucide-react";

const tabs = ["Details", "Materials & Care", "Reviews"];

const ProductDetailPage = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === Number(id)) || products[0];
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("Details");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  const productImages = [product.image, product.image, product.image, product.image];

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-foreground">Shop</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      {/* Product */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-[4/5] rounded-sm overflow-hidden bg-muted">
              <img src={productImages[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {productImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`aspect-square rounded-sm overflow-hidden border-2 transition-colors ${selectedImage === i ? "border-foreground" : "border-transparent"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {product.badge && <span className="badge-low-stock self-start mb-3">{product.badge}</span>}
            <h1 className="font-display text-3xl md:text-4xl font-medium text-foreground">{product.name}</h1>
            <p className="text-lg text-muted-foreground mt-1">{product.color}</p>
            <p className="text-2xl font-semibold text-foreground mt-4">${product.price}.00</p>

            <div className="flex items-center gap-1 mt-3">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={14} className={s <= 4 ? "fill-accent text-accent" : "text-border"} />
              ))}
              <span className="text-xs text-muted-foreground ml-2">4.2 (38 reviews)</span>
            </div>

            {/* Size */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold tracking-widest uppercase">Size</h3>
                <button onClick={() => setShowSizeGuide(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <Ruler size={12} /> Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-5 py-2.5 text-sm border rounded-sm transition-colors ${selectedSize === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center border border-border rounded-sm">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-muted transition-colors"><Minus size={14} /></button>
                <span className="px-4 text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-muted transition-colors"><Plus size={14} /></button>
              </div>
              <button className="btn-primary flex-1">Add to Bag</button>
              <button className="p-3 border border-border rounded-sm hover:bg-muted transition-colors">
                <Heart size={18} />
              </button>
            </div>

            {/* Info pills */}
            <div className="mt-8 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Truck size={16} /> Free shipping on orders over $150
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Leaf size={16} /> Made with {product.material}
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-10 border-t border-border pt-8">
              <div className="flex gap-6 border-b border-border">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="pt-6 text-sm text-muted-foreground leading-relaxed">
                {activeTab === "Details" && (
                  <p>{product.description || `The ${product.name} is a sustainably crafted piece designed for everyday wear. Features a relaxed fit with thoughtful details that prioritize both comfort and style. Available in ${product.color}.`}</p>
                )}
                {activeTab === "Materials & Care" && (
                  <div>
                    <p className="mb-3"><strong className="text-foreground">Material:</strong> {product.material}</p>
                    <p className="mb-3"><strong className="text-foreground">Care:</strong> Machine wash cold, tumble dry low. Iron on low heat if needed.</p>
                    <p><strong className="text-foreground">Sustainability:</strong> This product is made using ethically sourced materials with a reduced carbon footprint.</p>
                  </div>
                )}
                {activeTab === "Reviews" && (
                  <div className="space-y-6">
                    {[
                      { name: "Alex M.", rating: 5, text: "Perfect fit and the color is exactly as shown. Love the sustainable approach!" },
                      { name: "Jordan K.", rating: 4, text: "Great quality fabric. Runs slightly large — I'd recommend sizing down." },
                      { name: "Sam R.", rating: 4, text: "Beautiful piece. Second purchase from ThreadHouse and won't be my last." },
                    ].map((review, i) => (
                      <div key={i} className="pb-4 border-b border-border last:border-none">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} size={12} className={s <= review.rating ? "fill-accent text-accent" : "text-border"} />
                            ))}
                          </div>
                          <span className="text-xs font-medium text-foreground">{review.name}</span>
                        </div>
                        <p>{review.text}</p>
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
          <div className="mt-20">
            <h2 className="section-heading mb-8">Complete the Look</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4" onClick={() => setShowSizeGuide(false)}>
          <div className="bg-background rounded-sm p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-2xl font-semibold mb-6">Size Guide</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2">Size</th><th className="pb-2">Chest</th><th className="pb-2">Waist</th><th className="pb-2">Length</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[["XS","32\"","26\"","27\""],["S","34\"","28\"","28\""],["M","38\"","32\"","29\""],["L","42\"","36\"","30\""],["XL","46\"","40\"","31\""],["XXL","50\"","44\"","32\""]].map(([size, chest, waist, length]) => (
                  <tr key={size} className="border-b border-border">
                    <td className="py-2 font-medium text-foreground">{size}</td>
                    <td className="py-2">{chest}</td><td className="py-2">{waist}</td><td className="py-2">{length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setShowSizeGuide(false)} className="btn-outline w-full mt-6">Close</button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProductDetailPage;
