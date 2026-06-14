import { useState } from "react";
import Layout from "../components/Layout";
import ArticleCard from "../components/ArticleCard";
import { articles } from "../data";

const regions = ["All", "Asia", "Europe", "Americas", "Middle East", "Africa"];

const worldArticles = articles.filter((a) => a.category === "World");

// Assign regions for filtering
const regionMap: Record<string, string> = {
  "un-emergency-session-red-sea": "Middle East",
  "shipping-crisis-red-sea": "Middle East",
  "climate-protest-global-march": "Europe",
  "african-union-trade-deal": "Africa",
};

export default function WorldPage() {
  const [activeRegion, setActiveRegion] = useState("All");

  const filtered = activeRegion === "All"
    ? worldArticles
    : worldArticles.filter((a) => regionMap[a.slug] === activeRegion);

  const leadArticle = filtered[0];
  const gridArticles = filtered.slice(1);

  return (
    <Layout title="World News | The Meridian">
      <div className="container mt-6">
        <div className="editorial-rule mb-4" />
        <h1 className="headline-xl mb-2">World</h1>
        <p className="font-sans text-muted-foreground mb-6">
          Global affairs, international diplomacy, and cross-border stories that shape our world.
        </p>

        {/* Topic filter bar */}
        <div role="group" aria-label="Filter by region" className="flex flex-wrap gap-2 mb-8">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              aria-pressed={activeRegion === region}
              className={`px-4 py-2 text-sm font-sans font-semibold uppercase tracking-wider border transition-colors ${
                activeRegion === region
                  ? "bg-foreground text-primary-foreground border-foreground"
                  : "bg-card text-foreground border-border hover:border-foreground"
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Lead story */}
        {leadArticle && (
          <section aria-label="Lead story" className="mb-10">
            <ArticleCard article={leadArticle} size="large" />
          </section>
        )}

        {/* Story grid */}
        {gridArticles.length > 0 && (
          <section aria-label="More world stories">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridArticles.map((a) => (
                <ArticleCard key={a.slug} article={a} size="medium" />
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <p className="font-sans text-muted-foreground text-center py-12">
            No stories found for this region. Check back soon.
          </p>
        )}
      </div>
    </Layout>
  );
}
