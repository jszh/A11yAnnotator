import { useState } from "react";
import FoliaLayout from "@/components/social-media/FoliaLayout";
import { Search, TrendingUp } from "lucide-react";
import post1 from "@/assets/social-media/post1.jpg";
import post2 from "@/assets/social-media/post2.jpg";
import post3 from "@/assets/social-media/post3.jpg";
import post4 from "@/assets/social-media/post4.jpg";
import post5 from "@/assets/social-media/post5.jpg";
import post6 from "@/assets/social-media/post6.jpg";

const categories = ["All", "Digital Art", "Photography", "Typography", "3D", "Motion"];

const exploreItems = [
  { id: "1", image: post1, creator: "Maya Chen", appreciations: 342, category: "Digital Art" },
  { id: "2", image: post2, creator: "Leo Kraft", appreciations: 189, category: "Digital Art" },
  { id: "3", image: post3, creator: "Hana Kim", appreciations: 521, category: "Photography" },
  { id: "4", image: post4, creator: "Priya Sharma", appreciations: 276, category: "Typography" },
  { id: "5", image: post5, creator: "Aiden Park", appreciations: 403, category: "3D" },
  { id: "6", image: post6, creator: "Sofia Reyes", appreciations: 198, category: "Digital Art" },
];

const risingCreators = [
  { name: "Yuki Tanaka", discipline: "Typography", followers: "2.3k" },
  { name: "Carlos Mendez", discipline: "Motion Design", followers: "1.8k" },
  { name: "Ava Li", discipline: "3D Sculpting", followers: "3.1k" },
  { name: "Ravi Patel", discipline: "Photography", followers: "1.5k" },
];

export default function FoliaExplore() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = activeCategory === "All"
    ? exploreItems
    : exploreItems.filter((item) => item.category === activeCategory);

  return (
    <FoliaLayout title="Explore | Folia">
      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-display text-foreground mb-4">Explore</h1>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <label htmlFor="explore-search" className="sr-only">Search creators and work</label>
            <input
              id="explore-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creators, styles, mediums..."
              className="folia-input pl-10"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div role="tablist" aria-label="Medium categories" className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Rising Creators */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-display text-foreground">Rising Creators</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {risingCreators.map((c) => (
              <div key={c.name} className="folia-card p-4 min-w-[180px] flex-shrink-0 text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-lg mx-auto">
                  {c.name[0]}
                </div>
                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.discipline}</p>
                <p className="text-xs text-muted-foreground">{c.followers} followers</p>
                <button className="text-xs px-4 py-1.5 rounded-full border border-border hover:bg-secondary text-foreground transition-colors font-medium w-full">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Trending Palettes */}
        <section>
          <h2 className="text-lg font-display text-foreground mb-4">Trending Palettes</h2>
          <div className="flex gap-4 flex-wrap">
            {[
              { name: "Autumn Glow", colors: ["#E8927C", "#F2C078", "#9DC88D", "#4A7C59", "#2C3E2F"] },
              { name: "Electric Dusk", colors: ["#2D3047", "#E84855", "#F9DC5C", "#3185FC", "#1B1B3A"] },
              { name: "Soft Bloom", colors: ["#F4ACB7", "#D8E2DC", "#FFE5D9", "#9D8189", "#FFCAD4"] },
            ].map((p) => (
              <div key={p.name} className="folia-card p-3 space-y-2">
                <div className="flex gap-1">
                  {p.colors.map((c) => (
                    <div key={c} className="w-10 h-10 rounded-md" style={{ backgroundColor: c }} role="img" aria-label={`Color ${c}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-medium">{p.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Discovery Grid */}
        <section>
          <h2 className="text-lg font-display text-foreground mb-4">Discover</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map((item) => (
              <div key={item.id} className="group relative rounded-xl overflow-hidden aspect-square cursor-pointer">
                <img
                  src={item.image}
                  alt={`Work by ${item.creator}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-end">
                  <div className="p-3 opacity-0 group-hover:opacity-100 transition-opacity w-full">
                    <p className="text-sm font-semibold text-primary-foreground">{item.creator}</p>
                    <p className="text-xs text-primary-foreground/80">♥ {item.appreciations}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </FoliaLayout>
  );
}
