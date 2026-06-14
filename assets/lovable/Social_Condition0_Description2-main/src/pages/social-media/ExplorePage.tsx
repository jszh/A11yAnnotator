import { FoliaLayout } from "@/components/social-media/FoliaLayout";
import { motion } from "framer-motion";
import { Heart, TrendingUp } from "lucide-react";

const categories = ["All", "Digital Art", "Photography", "Typography", "3D", "Motion"];

const tiles = [
  { id: 1, title: "Neon Botanicals", creator: "Lena Oort", appreciations: 842, img: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=400&fit=crop", category: "Digital Art" },
  { id: 2, title: "Urban Decay", creator: "Jin Park", appreciations: 631, img: "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=400&h=500&fit=crop", category: "Photography" },
  { id: 3, title: "Serif Explorations", creator: "Ava Moretti", appreciations: 412, img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop", category: "Typography" },
  { id: 4, title: "Glass Forms", creator: "Riku Tanaka", appreciations: 567, img: "https://images.unsplash.com/photo-1633177317976-3f9bc45e1d1d?w=400&h=450&fit=crop", category: "3D" },
  { id: 5, title: "Desert Light", creator: "Sara Novak", appreciations: 723, img: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&h=500&fit=crop", category: "Photography" },
  { id: 6, title: "Motion Study #7", creator: "Kai Hoffman", appreciations: 389, img: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&h=400&fit=crop", category: "Motion" },
];

const risingCreators = [
  { name: "Ines Cortez", discipline: "Ceramics & 3D", followers: "2.1k", avatar: "IC" },
  { name: "Oscar Blume", discipline: "Film Photography", followers: "1.8k", avatar: "OB" },
  { name: "Yuki Sato", discipline: "Motion Design", followers: "3.4k", avatar: "YS" },
  { name: "Priya Nair", discipline: "Digital Painting", followers: "1.2k", avatar: "PN" },
];

const palettes = [
  ["#2D3436", "#636E72", "#DFE6E9", "#FFEAA7", "#FDCB6E"],
  ["#0C2461", "#1E3799", "#4A69BD", "#6A89CC", "#82CCDD"],
  ["#E55039", "#F8C291", "#F6B93B", "#78E08F", "#38ADA9"],
  ["#30336B", "#6C5CE7", "#A29BFE", "#FD79A8", "#FDCB6E"],
];

export default function ExplorePage() {
  return (
    <FoliaLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h2 className="font-display text-2xl text-foreground mb-4">Explore</h2>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`px-4 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                i === 0
                  ? "bg-folia-coral text-primary-foreground font-medium"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="columns-2 md:columns-3 gap-4 mb-10">
          {tiles.map((tile, i) => (
            <motion.div
              key={tile.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="mb-4 break-inside-avoid group relative rounded-xl overflow-hidden cursor-pointer"
            >
              <img src={tile.img} alt={tile.title} className="w-full object-cover rounded-xl" />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/50 transition-all rounded-xl flex items-end p-3 opacity-0 group-hover:opacity-100">
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">{tile.creator}</p>
                  <div className="flex items-center gap-1 text-primary-foreground/80 text-xs">
                    <Heart className="h-3 w-3" /> {tile.appreciations}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Rising Creators */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-folia-coral" />
            <h3 className="font-display text-lg text-foreground">Rising Creators</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {risingCreators.map((c) => (
              <div key={c.name} className="bg-card rounded-xl border border-border p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                <div className="h-12 w-12 rounded-full bg-folia-coral/15 text-folia-coral flex items-center justify-center font-semibold mx-auto mb-2">
                  {c.avatar}
                </div>
                <p className="font-semibold text-sm text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.discipline}</p>
                <p className="text-xs text-folia-teal mt-1">{c.followers} followers</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Palettes */}
        <div>
          <h3 className="font-display text-lg text-foreground mb-4">Trending Palettes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {palettes.map((p, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex rounded-lg overflow-hidden h-16 mb-2">
                  {p.map((color) => (
                    <div key={color} className="flex-1" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.map((c) => c).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FoliaLayout>
  );
}
