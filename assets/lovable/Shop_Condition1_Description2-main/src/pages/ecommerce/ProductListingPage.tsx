import { useState, useMemo } from "react";
import Layout from "@/components/ecommerce/Layout";
import ProductCard from "@/components/ecommerce/ProductCard";
import { products } from "@/data/products";
import { SlidersHorizontal, X } from "lucide-react";

const categories = ["All", "Tops", "Bottoms", "Dresses", "Outerwear", "Accessories"];
const materialOptions = ["Organic Cotton", "Recycled Polyester", "Linen", "Hemp Blend", "Tencel"];
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
const colorSwatches = [
  { name: "Sage Green", hex: "#8BA888" },
  { name: "Off White", hex: "#F5F0E8" },
  { name: "Terracotta", hex: "#C2654A" },
  { name: "Charcoal", hex: "#3A3632" },
  { name: "Dusty Rose", hex: "#C4A4A0" },
  { name: "Slate Blue", hex: "#7A8B99" },
];

export default function ProductListingPage() {
  const [category, setCategory] = useState("All");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 250]);
  const [showFilters, setShowFilters] = useState(false);
  const [styleMatch, setStyleMatch] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (selectedColors.length && !selectedColors.includes(p.color)) return false;
      if (selectedMaterials.length && !selectedMaterials.includes(p.material)) return false;
      if (selectedSizes.length && !selectedSizes.some((s) => p.sizes.includes(s))) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      return true;
    });
  }, [category, selectedColors, selectedMaterials, selectedSizes, priceRange]);

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const activeFilterCount = selectedColors.length + selectedMaterials.length + selectedSizes.length + (category !== "All" ? 1 : 0);

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold">Shop All</h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} pieces</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Style Match toggle */}
            <label className="hidden md:flex items-center gap-2 text-sm cursor-pointer">
              <span className="text-muted-foreground">Style Match</span>
              <button
                role="switch"
                aria-checked={styleMatch}
                onClick={() => setStyleMatch(!styleMatch)}
                className={`w-10 h-5 rounded-full transition-colors relative ${styleMatch ? "bg-accent" : "bg-border"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-background rounded-full transition-transform ${styleMatch ? "translate-x-5" : ""}`} />
              </button>
            </label>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium border border-border px-4 py-2 rounded-md hover:bg-secondary transition-colors"
              aria-expanded={showFilters}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-accent text-accent-foreground text-xs rounded-full px-1.5 py-0.5 font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2" role="tablist" aria-label="Product categories">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={category === cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-8">
          {/* Filters sidebar */}
          {showFilters && (
            <aside className="hidden md:block w-64 shrink-0 space-y-8" aria-label="Product filters">
              {/* Colors */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Color</h3>
                <div className="flex flex-wrap gap-2">
                  {colorSwatches.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => toggleFilter(selectedColors, c.name, setSelectedColors)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColors.includes(c.name) ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      aria-label={`Filter by ${c.name}`}
                      aria-pressed={selectedColors.includes(c.name)}
                    />
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleFilter(selectedSizes, s, setSelectedSizes)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        selectedSizes.includes(s)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-foreground"
                      }`}
                      aria-pressed={selectedSizes.includes(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Material */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Material</h3>
                <div className="space-y-2">
                  {materialOptions.map((m) => (
                    <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMaterials.includes(m)}
                        onChange={() => toggleFilter(selectedMaterials, m, setSelectedMaterials)}
                        className="rounded border-border h-4 w-4 accent-accent"
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Price Range</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={250}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full accent-accent"
                    aria-label="Maximum price"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setSelectedColors([]);
                    setSelectedMaterials([]);
                    setSelectedSizes([]);
                    setPriceRange([0, 250]);
                    setCategory("All");
                  }}
                  className="flex items-center gap-1 text-sm text-terracotta hover:underline"
                >
                  <X className="h-3.5 w-3.5" /> Clear all filters
                </button>
              )}
            </aside>
          )}

          {/* Product grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-20">No products match your filters.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6" role="list" aria-label="Products">
                {filtered.map((product) => (
                  <div key={product.id} role="listitem">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
