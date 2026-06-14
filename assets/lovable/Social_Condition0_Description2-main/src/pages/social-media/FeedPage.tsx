import { useState } from "react";
import { FoliaLayout } from "@/components/social-media/FoliaLayout";
import { Heart, MessageCircle, Bookmark, Share2, Image, Hash, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const posts = [
  {
    id: 1,
    author: "Maya Chen",
    handle: "@mayachen",
    avatar: "MC",
    discipline: "Digital Illustration",
    title: "Solstice III — Golden Hour Series",
    caption: "Exploring warm light through layered textures. Part 3 of my solstice series — this one took about 12 hours in Procreate.",
    tags: ["#illustration", "#procreate", "#goldenlight"],
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop",
    appreciations: 342,
    comments: 28,
    collections: 67,
    time: "2h ago",
  },
  {
    id: 2,
    author: "Tomás Rivera",
    handle: "@tomasrivera",
    avatar: "TR",
    discipline: "Photography",
    title: "Abandoned Greenhouse, Lisbon",
    caption: "Found this gem on a morning walk through Belém. Shot on Fuji X-T4 with the 23mm f/1.4. Natural light only.",
    tags: ["#photography", "#fujifilm", "#lisbon"],
    image: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=800&h=600&fit=crop",
    appreciations: 518,
    comments: 45,
    collections: 102,
    time: "4h ago",
  },
  {
    id: 3,
    author: "Aisha Patel",
    handle: "@aishacreates",
    avatar: "AP",
    discipline: "Typography",
    title: "Variable Font Explorations",
    caption: "Playing with weight axes on a custom serif I've been developing. Feedback welcome on the contrast ratios!",
    tags: ["#typography", "#typedesign", "#variablefonts"],
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=500&fit=crop",
    appreciations: 189,
    comments: 34,
    collections: 41,
    time: "6h ago",
  },
];

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");

  return (
    <FoliaLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Composer */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-5 mb-6"
        >
          <h3 className="font-display text-lg text-foreground mb-3">Share Your Work</h3>
          <div className="border border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center mb-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
            <Image className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Drop images here or click to upload</span>
          </div>
          <textarea
            placeholder="Tell the story behind your work..."
            className="w-full bg-transparent border-none resize-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none mb-3"
            rows={2}
          />
          <div className="flex items-center gap-2 mb-3">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Add skills: #illustration #procreate"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <div className="flex justify-end">
            <Button className="bg-folia-coral text-primary-foreground hover:bg-folia-coral/90 font-semibold gap-2">
              <Send className="h-4 w-4" /> Share
            </Button>
          </div>
        </motion.div>

        {/* Feed Toggle */}
        <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1">
          {(["foryou", "following"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "foryou" ? "For You" : "Following"}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-5">
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-folia-coral/15 text-folia-coral flex items-center justify-center font-semibold text-sm">
                  {post.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{post.author}</p>
                  <p className="text-xs text-muted-foreground">{post.discipline} · {post.time}</p>
                </div>
              </div>
              <img
                src={post.image}
                alt={post.title}
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="p-4">
                <h4 className="font-display text-base text-foreground mb-1">{post.title}</h4>
                <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{post.caption}</p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-xs text-folia-teal font-medium">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-folia-coral transition-colors">
                    <Heart className="h-4 w-4" /> {post.appreciations}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-folia-teal transition-colors">
                    <Bookmark className="h-4 w-4" /> {post.collections}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <MessageCircle className="h-4 w-4" /> {post.comments}
                  </button>
                  <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </FoliaLayout>
  );
}
