import { Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const trendingTags = ["#ClimateWeek", "#AIArt", "#WorldCup2026", "#TechLayoffs", "#SpaceX", "#Crypto", "#Fitness", "#Travel"];

const suggestedUsers = [
  { name: "Kai Tanaka", handle: "@kaitanaka", bio: "Product designer & creator", avatar: "KaiTanaka" },
  { name: "Nina Rossi", handle: "@ninarossi", bio: "Travel photographer", avatar: "NinaRossi" },
  { name: "Dev Sharma", handle: "@devsharma", bio: "Full-stack developer", avatar: "DevSharma" },
  { name: "Aisha Obi", handle: "@aishaobi", bio: "Climate activist & writer", avatar: "AishaObi" },
  { name: "Luca Moretti", handle: "@lucamoretti", bio: "Startup founder", avatar: "LucaMoretti" },
  { name: "Zara Kim", handle: "@zarakim", bio: "UI/UX at a fintech", avatar: "ZaraKim" },
];

const popularPosts = [
  { image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=400&fit=crop", likes: "2.3K" },
  { image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop", likes: "1.8K" },
  { image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop", likes: "3.1K" },
  { image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=400&fit=crop", likes: "956" },
  { image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop", likes: "1.4K" },
  { image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop", likes: "2.7K" },
];

export default function ExplorePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Explore</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search Pulse..."
          className="pulse-input w-full pl-10"
        />
      </div>

      {/* Trending Tags */}
      <div>
        <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Trending Topics
        </h2>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((tag) => (
            <button
              key={tag}
              className="pulse-badge bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer px-3 py-1.5 text-sm"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Users */}
      <div>
        <h2 className="font-display font-semibold text-foreground mb-3">Suggested for You</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {suggestedUsers.map((user) => (
            <div key={user.handle} className="pulse-card p-4 flex flex-col items-center text-center">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`}
                alt={user.name}
                className="w-14 h-14 rounded-full bg-secondary mb-2"
              />
              <p className="font-semibold text-sm text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground mb-1">{user.handle}</p>
              <p className="text-xs text-secondary-foreground mb-3">{user.bio}</p>
              <Button size="sm" className="rounded-full px-4 text-xs w-full">Follow</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Posts Grid */}
      <div>
        <h2 className="font-display font-semibold text-foreground mb-3">Popular Posts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {popularPosts.map((post, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border border-border aspect-square cursor-pointer">
              <img src={post.image} alt="Popular post" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-sm font-semibold text-foreground">❤️ {post.likes}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
