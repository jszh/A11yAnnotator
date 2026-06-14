import { useState } from "react";
import { FoliaLayout } from "@/components/social-media/FoliaLayout";
import { motion } from "framer-motion";
import { Heart, TrendingUp } from "lucide-react";
import post1 from "@/assets/post-1.jpg";
import post2 from "@/assets/post-2.jpg";
import post3 from "@/assets/post-3.jpg";
import post4 from "@/assets/post-4.jpg";
import post5 from "@/assets/post-5.jpg";

const categories = ["All", "Digital Art", "Photography", "Typography", "3D", "Motion"];

const exploreItems = [
  { id: 1, image: post1, creator: "Mika Chen", appreciations: 342, category: "Digital Art" },
  { id: 2, image: post2, creator: "Leo Sato", appreciations: 891, category: "Digital Art" },
  { id: 3, image: post3, creator: "Ada Moreau", appreciations: 567, category: "Typography" },
  { id: 4, image: post4, creator: "Yuki Tanaka", appreciations: 1203, category: "Photography" },
  { id: 5, image: post5, creator: "Ravi Patel", appreciations: 445, category: "3D" },
  { id: 6, image: post1, creator: "Zoe Lin", appreciations: 678, category: "Motion" },
  { id: 7, image: post2, creator: "Felix Brandt", appreciations: 923, category: "Photography" },
  { id: 8, image: post3, creator: "Nia Okafor", appreciations: 312, category: "Typography" },
  { id: 9, image: post5, creator: "Sam Rivera", appreciations: 756, category: "3D" },
];

const risingCreators = [
  { name: "Hana Kowalski", discipline: "Illustrator", avatar: "HK", followers: 2340 },
  { name: "Jin Park", discipline: "3D Artist", avatar: "JP", followers: 1890 },
  { name: "Ella Moss", discipline: "Photographer", avatar: "EM", followers: 3120 },
  { name: "Dante Cruz", discipline: "Motion Designer", avatar: "DC", followers: 1560 },
];

const trendingPalettes = [
  { name: "Desert Bloom", colors: ["#C2703E", "#E8A87C", "#D4A373", "#FEFAE0", "#CCD5AE"] },
  { name: "Midnight Garden", colors: ["#2D3436", "#636E72", "#B2BEC3", "#DFE6E9", "#55A3A4"] },
  { name: "Golden Hour", colors: ["#F7DC6F", "#F0B27A", "#E74C3C", "#8E44AD", "#2C3E50"] },
  { name: "Moss & Stone", colors: ["#606C38", "#283618", "#FEFAE0", "#DDA15E", "#BC6C25"] },
];

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const filtered = activeCategory === "All"
    ? exploreItems
    : exploreItems.filter((item) => item.category === activeCategory);

  return (
    <FoliaLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-2">
          Explore
        </h1>
        <p className="text-muted-foreground mb-8">Discover inspiring work from the creative community</p>

        {/* Category Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2" role="tablist" aria-label="Filter by medium">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Discovery Grid */}
        <section aria-label="Discovery grid">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="relative rounded-xl overflow-hidden aspect-square cursor-pointer group"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(item.id)}
                onBlur={() => setHoveredId(null)}
                tabIndex={0}
                role="article"
                aria-label={`${item.category} by ${item.creator}, ${item.appreciations} appreciations`}
              >
                <img
                  src={item.image}
                  alt={`${item.category} artwork by ${item.creator}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  width={400}
                  height={400}
                />
                <div
                  className={`absolute inset-0 bg-foreground/60 flex flex-col justify-end p-3 transition-opacity duration-300 ${
                    hoveredId === item.id ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden={hoveredId !== item.id}
                >
                  <p className="text-sm font-medium text-primary-foreground">{item.creator}</p>
                  <div className="flex items-center gap-1 text-xs text-primary-foreground/80">
                    <Heart className="h-3 w-3" aria-hidden="true" />
                    <span>{item.appreciations}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Rising Creators */}
        <section aria-label="Rising creators">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="font-display text-xl text-foreground">Rising Creators</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
            {risingCreators.map((creator) => (
              <div
                key={creator.name}
                className="bg-card rounded-xl border border-border p-4 text-center hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary mx-auto mb-3" aria-hidden="true">
                  {creator.avatar}
                </div>
                <p className="text-sm font-medium text-foreground">{creator.name}</p>
                <p className="text-xs text-muted-foreground">{creator.discipline}</p>
                <p className="text-xs text-primary mt-1">{creator.followers.toLocaleString()} followers</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trending Palettes */}
        <section aria-label="Trending color palettes">
          <h2 className="font-display text-xl text-foreground mb-4">Trending Palettes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trendingPalettes.map((palette) => (
              <div key={palette.name} className="bg-card rounded-xl border border-border p-4">
                <p className="text-sm font-medium text-foreground mb-3">{palette.name}</p>
                <div className="flex gap-1.5 h-10" role="img" aria-label={`Color palette: ${palette.name}`}>
                  {palette.colors.map((color) => (
                    <div
                      key={color}
                      className="flex-1 rounded-lg"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </FoliaLayout>
  );
}
