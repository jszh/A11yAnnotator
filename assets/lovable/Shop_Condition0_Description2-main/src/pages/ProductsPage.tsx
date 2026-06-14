import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/ecommerce/Layout";
import ProductCard from "@/components/ecommerce/ProductCard";
import { products } from "@/data/products";
import { SlidersHorizontal, X } from "lucide-react";

const categories = ["All", "Tops", "Bottoms", "Outerwear", "Accessories"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const materials = ["All", "Organic Cotton", "Recycled Polyester"];
const colorSwatches = [
  { name: "All", hex: "" },
  { name: "Sage Green", hex: "#8B9F7B" },
  { name: "Off White", hex: "#F5F0E8" },
  { name: "Terracotta", hex: "#C85A3A" },
  { name: "Olive", hex: "#556B2F" },
  { name: "Rust", hex: "#A0522D" },
  { name: "Sand", hex: "#C2B280" },
  { name: "Indigo", hex: "#3F5277" },
  { name: "Oat", hex: "#D4C5A9" },
  { name: "Natural", hex: "#E8DCC8" },
];

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get("category") || "All";

  const [category, setCategory] = useState(urlCategory);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState("All");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [styleMatch, setStyleMatch] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (selectedSize && !p.sizes.includes(selectedSize)) return false;
      if (selectedColor && p.color !== selectedColor) return false;
      if (selectedMaterial !== "All" && p.material !== selectedMaterial) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      return true;
    });
  }, [category, selectedSize, selectedColor, selectedMaterial, priceRange]);

  const clearFilters = () => {
    setCategory("All");
    setSelectedSize(null);
    setSelectedColor(null);
    setSelectedMaterial("All");
    setPriceRange([0, 200]);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="section-heading">Shop All</h1>
            <p className="text-muted-foreground mt-1">{filtered.length} products</p>
          </div>
          <button
            className="md:hidden flex items-center gap-2 text-sm font-medium tracking-wide uppercase"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`${filtersOpen ? 'fixed inset-0 z-50 bg-background p-6 overflow-y-auto' : 'hidden'} md:block md:relative md:w-64 md:shrink-0`}>
            <div className="flex items-center justify-between md:hidden mb-6">
              <h2 className="font-display text-xl font-semibold">Filters</h2>
              <button onClick={() => setFiltersOpen(false)}><X size={20} /></button>
            </div>

            {/* Category */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Category</h3>
              <div className="flex flex-col gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`text-left text-sm py-1 transition-colors ${category === c ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Size</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(selectedSize === s ? null : s)}
                    className={`px-3 py-1.5 text-xs border rounded-sm transition-colors ${selectedSize === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Color</h3>
              <div className="flex flex-wrap gap-2">
                {colorSwatches.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(selectedColor === c.name ? null : (c.name === "All" ? null : c.name))}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${selectedColor === c.name ? "border-foreground scale-110" : "border-border hover:border-foreground"} ${c.name === "All" ? "bg-gradient-to-br from-primary to-accent" : ""}`}
                    style={c.hex ? { backgroundColor: c.hex } : undefined}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Material */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Material</h3>
              <div className="flex flex-col gap-2">
                {materials.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMaterial(m)}
                    className={`text-left text-sm py-1 transition-colors ${selectedMaterial === m ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Price Range</h3>
              <input
                type="range"
                min={0}
                max={200}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>$0</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>

            {/* Style Match */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Style Match</h3>
                <button
                  onClick={() => setStyleMatch(!styleMatch)}
                  className={`w-10 h-5 rounded-full transition-colors ${styleMatch ? "bg-primary" : "bg-border"} relative`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-background transition-transform ${styleMatch ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Show curated outfit sets</p>
            </div>

            <button onClick={clearFilters} className="text-xs text-muted-foreground underline">Clear all filters</button>

            <button onClick={() => setFiltersOpen(false)} className="md:hidden btn-primary w-full mt-6">
              Show {filtered.length} Results
            </button>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">No products match your filters.</p>
                <button onClick={clearFilters} className="btn-outline mt-4">Clear Filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductsPage;
