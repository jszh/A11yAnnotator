import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";
import { Button } from "@/components/ui/button";
import { products, brands, categories } from "../data/products";

const ProductListingPage = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1500]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("best-match");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...products];

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }
    return result;
  }, [selectedCategory, selectedBrands, priceRange, minRating, sortBy]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="font-display font-semibold text-sm mb-3 text-foreground">Category</h3>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory("")}
            className={`block text-sm w-full text-left px-2 py-1 rounded-md transition-colors ${!selectedCategory ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`block text-sm w-full text-left px-2 py-1 rounded-md transition-colors ${selectedCategory === cat.slug ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div>
        <h3 className="font-display font-semibold text-sm mb-3 text-foreground">Brand</h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2 text-sm cursor-pointer text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="rounded border-border text-accent focus:ring-accent"
              />
              {brand}
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="font-display font-semibold text-sm mb-3 text-foreground">Price Range</h3>
        <div className="space-y-2">
          {[
            [0, 50, "Under $50"],
            [50, 100, "$50 – $100"],
            [100, 250, "$100 – $250"],
            [250, 500, "$250 – $500"],
            [500, 1500, "$500+"],
          ].map(([min, max, label]) => (
            <button
              key={String(label)}
              onClick={() => setPriceRange([min as number, max as number])}
              className={`block text-sm w-full text-left px-2 py-1 rounded-md transition-colors ${priceRange[0] === min && priceRange[1] === max ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label as string}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-display font-semibold text-sm mb-3 text-foreground">Minimum Rating</h3>
        <div className="space-y-1.5">
          {[4, 3, 2, 0].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={`block text-sm w-full text-left px-2 py-1 rounded-md transition-colors ${minRating === r ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              {r > 0 ? `${r}★ & up` : "All ratings"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="container py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">
              {selectedCategory
                ? categories.find((c) => c.slug === selectedCategory)?.name || "Products"
                : "All Products"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} results</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-1" /> Filters
            </Button>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 pl-3 pr-8 rounded-md border border-border bg-card text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="best-match">Best Match</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar filters - desktop */}
          <aside className="hidden lg:block w-56 shrink-0">
            <FilterPanel />
          </aside>

          {/* Mobile filters */}
          {showFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-foreground/40" onClick={() => setShowFilters(false)} />
              <div className="absolute left-0 top-0 h-full w-72 bg-card p-6 overflow-y-auto shadow-elevated">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display font-bold text-foreground">Filters</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>✕</Button>
                </div>
                <FilterPanel />
              </div>
            </div>
          )}

          {/* Product grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">No products match your filters.</p>
                <Button
                  variant="accent"
                  className="mt-4"
                  onClick={() => {
                    setSelectedCategory("");
                    setSelectedBrands([]);
                    setPriceRange([0, 1500]);
                    setMinRating(0);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductListingPage;
