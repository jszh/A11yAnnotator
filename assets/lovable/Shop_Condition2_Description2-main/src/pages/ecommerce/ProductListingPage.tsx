import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { products, categories, materials, sizes, colorOptions, moods } from "@/data/products";
import ProductCard from "@/components/ecommerce/ProductCard";
import { SlidersHorizontal, X } from "lucide-react";

export default function ProductListingPage() {
  const [searchParams] = useSearchParams();
  const initialMood = searchParams.get("mood") || "";

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [selectedMood, setSelectedMood] = useState(initialMood);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300]);
  const [styleMatch, setStyleMatch] = useState(false);
  const [sortBy, setSortBy] = useState("featured");

  const toggleSize = (s: string) => setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleColor = (c: string) => setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const filtered = useMemo(() => {
    let result = products;
    if (selectedCategory) result = result.filter(p => p.category === selectedCategory);
    if (selectedSizes.length) result = result.filter(p => p.size.some(s => selectedSizes.includes(s)));
    if (selectedColors.length) result = result.filter(p => selectedColors.includes(p.colorHex));
    if (selectedMaterial) result = result.filter(p => p.material === selectedMaterial);
    if (selectedMood) result = result.filter(p => p.mood === selectedMood);
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (sortBy === "price-low") result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") result = [...result].sort((a, b) => b.price - a.price);
    if (sortBy === "rating") result = [...result].sort((a, b) => b.rating - a.rating);
    return result;
  }, [selectedCategory, selectedSizes, selectedColors, selectedMaterial, selectedMood, priceRange, sortBy]);

  const clearFilters = () => {
    setSelectedCategory(""); setSelectedSizes([]); setSelectedColors([]);
    setSelectedMaterial(""); setSelectedMood(""); setPriceRange([0, 300]);
  };

  const hasFilters = selectedCategory || selectedSizes.length || selectedColors.length || selectedMaterial || selectedMood || priceRange[0] > 0 || priceRange[1] < 300;

  return (
    <main id="main-content" className="container py-8">
      <section aria-labelledby="shop-heading">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 id="shop-heading" className="font-display text-3xl font-bold">
              {selectedMood ? `${selectedMood} Style` : "Shop All"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1" aria-live="polite">{filtered.length} products</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-sm text-muted-foreground">Sort:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-sm border border-input rounded-md px-3 py-1.5 bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-input rounded-md hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-expanded={filtersOpen}
              aria-controls="filter-panel"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filter Panel */}
          {filtersOpen && (
            <aside
              id="filter-panel"
              className="w-64 flex-shrink-0 space-y-6"
              aria-label="Product filters"
            >
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                  <X className="h-3 w-3" aria-hidden="true" /> Clear all filters
                </button>
              )}

              {/* Mood */}
              <fieldset>
                <legend className="text-sm font-semibold mb-3">Style Mood</legend>
                <div className="space-y-2">
                  {moods.map(mood => (
                    <label key={mood} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="mood"
                        checked={selectedMood === mood}
                        onChange={() => setSelectedMood(selectedMood === mood ? "" : mood)}
                        className="accent-primary focus:ring-2 focus:ring-ring"
                      />
                      {mood}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Category */}
              <fieldset>
                <legend className="text-sm font-semibold mb-3">Clothing Type</legend>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                        className="accent-primary focus:ring-2 focus:ring-ring"
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Size */}
              <fieldset>
                <legend className="text-sm font-semibold mb-3">Size</legend>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        selectedSizes.includes(size) ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted"
                      }`}
                      aria-pressed={selectedSizes.includes(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Color */}
              <fieldset>
                <legend className="text-sm font-semibold mb-3">Color</legend>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.slice(0, 12).map(color => (
                    <button
                      key={color.hex}
                      onClick={() => toggleColor(color.hex)}
                      className={`h-7 w-7 rounded-full border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        selectedColors.includes(color.hex) ? "border-primary scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={`Filter by ${color.name}`}
                      aria-pressed={selectedColors.includes(color.hex)}
                      title={color.name}
                    />
                  ))}
                </div>
              </fieldset>

              {/* Material */}
              <fieldset>
                <legend className="text-sm font-semibold mb-3">Material</legend>
                <div className="space-y-2">
                  {materials.map(mat => (
                    <label key={mat} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="material"
                        checked={selectedMaterial === mat}
                        onChange={() => setSelectedMaterial(selectedMaterial === mat ? "" : mat)}
                        className="accent-primary focus:ring-2 focus:ring-ring"
                      />
                      {mat}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Price Range */}
              <fieldset>
                <legend className="text-sm font-semibold mb-3">Price Range</legend>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>—</span>
                    <span>${priceRange[1]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={300}
                    value={priceRange[1]}
                    onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full accent-primary"
                    aria-label="Maximum price"
                  />
                </div>
              </fieldset>

              {/* Style Match Toggle */}
              <div className="flex items-center justify-between">
                <label htmlFor="style-match" className="text-sm font-semibold">Style Match</label>
                <button
                  id="style-match"
                  role="switch"
                  aria-checked={styleMatch}
                  onClick={() => setStyleMatch(!styleMatch)}
                  className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    styleMatch ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-background shadow transition-transform ${styleMatch ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </aside>
          )}

          {/* Product Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg font-display">No products found</p>
                <p className="text-sm mt-2">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
