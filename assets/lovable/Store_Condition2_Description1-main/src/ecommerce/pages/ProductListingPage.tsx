import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";
import { products, brands } from "../data/products";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";

const priceRanges = [
  { label: "Under $50", min: 0, max: 50 },
  { label: "$50 – $100", min: 50, max: 100 },
  { label: "$100 – $250", min: 100, max: 250 },
  { label: "$250 – $500", min: 250, max: 500 },
  { label: "$500+", min: 500, max: Infinity },
];

const ratingFilters = [4, 3, 2, 1];

type SortOption = "best" | "price-asc" | "price-desc" | "rating";

export default function ProductListingPage() {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sort, setSort] = useState<SortOption>("best");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({ category: true, brand: true, price: true, rating: true });

  const toggleFilter = (key: string) => setExpandedFilters(prev => ({ ...prev, [key]: !prev[key] }));

  const filtered = useMemo(() => {
    let result = [...products];
    if (selectedCategory) result = result.filter(p => p.category === selectedCategory);
    if (selectedBrands.length) result = result.filter(p => selectedBrands.includes(p.brand));
    if (selectedPriceRange !== null) {
      const range = priceRanges[selectedPriceRange];
      result = result.filter(p => p.price >= range.min && p.price < range.max);
    }
    if (selectedRating !== null) result = result.filter(p => p.rating >= selectedRating);

    switch (sort) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
    }
    return result;
  }, [selectedCategory, selectedBrands, selectedPriceRange, selectedRating, sort]);

  const toggleBrand = (brand: string) =>
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);

  const clearAll = () => {
    setSelectedCategory(null);
    setSelectedBrands([]);
    setSelectedPriceRange(null);
    setSelectedRating(null);
  };

  const hasFilters = selectedCategory || selectedBrands.length || selectedPriceRange !== null || selectedRating !== null;

  const filterPanel = (
    <aside aria-label="Product filters" className="space-y-6">
      {hasFilters && (
        <button onClick={clearAll} className="text-sm font-semibold text-primary hover:underline">
          Clear all filters
        </button>
      )}

      {/* Category filter */}
      <fieldset>
        <legend className="sr-only">Category filter</legend>
        <button onClick={() => toggleFilter("category")} className="flex items-center justify-between w-full text-sm font-semibold mb-2" aria-expanded={expandedFilters.category}>
          Category {expandedFilters.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedFilters.category && (
          <div className="space-y-1.5">
            {["Electronics", "Kitchen", "Clothing", "Sports", "Home"].map(cat => (
              <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === cat}
                  onChange={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className="accent-primary"
                />
                {cat}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {/* Brand filter */}
      <fieldset>
        <legend className="sr-only">Brand filter</legend>
        <button onClick={() => toggleFilter("brand")} className="flex items-center justify-between w-full text-sm font-semibold mb-2" aria-expanded={expandedFilters.brand}>
          Brand {expandedFilters.brand ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedFilters.brand && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {brands.map(brand => (
              <label key={brand} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                  className="accent-primary"
                />
                {brand}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {/* Price Range */}
      <fieldset>
        <legend className="sr-only">Price range filter</legend>
        <button onClick={() => toggleFilter("price")} className="flex items-center justify-between w-full text-sm font-semibold mb-2" aria-expanded={expandedFilters.price}>
          Price Range {expandedFilters.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedFilters.price && (
          <div className="space-y-1.5">
            {priceRanges.map((range, i) => (
              <label key={range.label} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  checked={selectedPriceRange === i}
                  onChange={() => setSelectedPriceRange(selectedPriceRange === i ? null : i)}
                  className="accent-primary"
                />
                {range.label}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {/* Rating */}
      <fieldset>
        <legend className="sr-only">Minimum rating filter</legend>
        <button onClick={() => toggleFilter("rating")} className="flex items-center justify-between w-full text-sm font-semibold mb-2" aria-expanded={expandedFilters.rating}>
          Rating {expandedFilters.rating ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedFilters.rating && (
          <div className="space-y-1.5">
            {ratingFilters.map(r => (
              <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  checked={selectedRating === r}
                  onChange={() => setSelectedRating(selectedRating === r ? null : r)}
                  className="accent-primary"
                />
                {r}+ stars
              </label>
            ))}
          </div>
        )}
      </fieldset>
    </aside>
  );

  return (
    <Layout title={selectedCategory ? `${selectedCategory} Products` : "All Products"}>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold">{selectedCategory || "All Products"}</h1>
            <p className="text-sm text-muted-foreground mt-1" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "product" : "products"} found
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary"
              aria-expanded={filtersOpen}
              aria-controls="filter-panel-mobile"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <fieldset className="flex items-center gap-2">
              <legend className="sr-only">Sort products</legend>
              <label htmlFor="sort-select" className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</label>
              <select
                id="sort-select"
                value={sort}
                onChange={e => setSort(e.target.value as SortOption)}
                className="text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="best">Best Match</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
              </select>
            </fieldset>
          </div>
        </div>

        {/* Mobile filter panel */}
        {filtersOpen && (
          <div id="filter-panel-mobile" className="lg:hidden mb-6 p-4 bg-card border border-border rounded-lg animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <X className="w-5 h-5" />
              </button>
            </div>
            {filterPanel}
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop filters */}
          <div className="hidden lg:block w-60 shrink-0">
            {filterPanel}
          </div>

          {/* Product grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-lg font-semibold text-muted-foreground">No products match your filters</p>
                <button onClick={clearAll} className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold">
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
