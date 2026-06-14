import { useState } from "react";
import { FoliaLayout } from "@/components/social-media/FoliaLayout";
import { Heart, MessageCircle, Share2, Bookmark, ImagePlus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import post1 from "@/assets/post-1.jpg";
import post2 from "@/assets/post-2.jpg";
import post3 from "@/assets/post-3.jpg";
import post4 from "@/assets/post-4.jpg";

const feedPosts = [
  {
    id: 1,
    creator: "Mika Chen",
    discipline: "Digital Art",
    caption: "Exploring organic forms and warm palettes in this new series. Letting the shapes flow naturally without too much control.",
    tags: ["#digitalart", "#procreate", "#organic"],
    image: post1,
    appreciations: 342,
    comments: 28,
    timeAgo: "2h",
    avatar: "MC",
  },
  {
    id: 2,
    creator: "Leo Sato",
    discipline: "Illustration",
    caption: "Solstice III — part of my mountain dreamscape series. Playing with layered gradients and atmospheric perspective.",
    tags: ["#illustration", "#landscape", "#gradient"],
    image: post2,
    appreciations: 891,
    comments: 64,
    timeAgo: "4h",
    avatar: "LS",
  },
  {
    id: 3,
    creator: "Ada Moreau",
    discipline: "Typography",
    caption: "Experimenting with negative space in serif letterforms. Less is more, but the details matter.",
    tags: ["#typography", "#graphicdesign", "#minimal"],
    image: post3,
    appreciations: 567,
    comments: 41,
    timeAgo: "6h",
    avatar: "AM",
  },
  {
    id: 4,
    creator: "Yuki Tanaka",
    discipline: "Photography",
    caption: "Golden hour portraits with film grain. Shot on Portra 400, natural light only.",
    tags: ["#photography", "#film", "#portrait"],
    image: post4,
    appreciations: 1203,
    comments: 89,
    timeAgo: "8h",
    avatar: "YT",
  },
];

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");
  const [composerText, setComposerText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState<Set<number>>(new Set());

  const toggleLike = (id: number) => {
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSave = (id: number) => {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <FoliaLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-8">
          Your Feed
        </h1>

        {/* Feed Toggle */}
        <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1" role="tablist" aria-label="Feed filter">
          {(["foryou", "following"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "foryou" ? "For You" : "Following"}
            </button>
          ))}
        </div>

        {/* Composer */}
        <section className="bg-card rounded-2xl border border-border p-5 mb-8 shadow-sm" aria-label="Create a post">
          <h2 className="font-display text-lg text-foreground mb-3">Share Your Work</h2>
          <label htmlFor="composer-caption" className="sr-only">Caption</label>
          <textarea
            id="composer-caption"
            placeholder="What are you working on?"
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            className="w-full bg-muted rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20 border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                aria-label="Upload image"
              >
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                <span>Image</span>
              </button>
              <div className="flex items-center gap-1">
                <label htmlFor="tag-input" className="sr-only">Add tags</label>
                <input
                  id="tag-input"
                  type="text"
                  placeholder="Add skills: #illustration"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/60 border-0 focus:outline-none w-44"
                />
              </div>
            </div>
            <button
              className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              disabled={!composerText.trim()}
              aria-label="Post your work"
            >
              Post
            </button>
          </div>
        </section>

        {/* Posts */}
        <div className="space-y-6" role="feed" aria-label="Creative feed">
          <AnimatePresence>
            {feedPosts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
                aria-label={`Post by ${post.creator}`}
              >
                {/* Header */}
                <div className="flex items-center gap-3 p-4 pb-2">
                  <div
                    className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0"
                    aria-hidden="true"
                  >
                    {post.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{post.creator}</p>
                    <p className="text-xs text-muted-foreground">
                      {post.discipline} · {post.timeAgo}
                    </p>
                  </div>
                </div>

                {/* Image */}
                <img
                  src={post.image}
                  alt={`${post.caption} — artwork by ${post.creator}`}
                  className="w-full aspect-[4/3] object-cover"
                  loading="lazy"
                  width={800}
                  height={600}
                />

                {/* Content */}
                <div className="p-4">
                  <p className="text-sm text-foreground leading-relaxed mb-2">
                    {post.caption}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-primary bg-primary/8 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Engagement */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleLike(post.id)}
                        className={`flex items-center gap-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                          liked.has(post.id)
                            ? "text-primary"
                            : "text-muted-foreground hover:text-primary"
                        }`}
                        aria-label={liked.has(post.id) ? "Remove appreciation" : "Appreciate this work"}
                        aria-pressed={liked.has(post.id)}
                      >
                        <Heart
                          className={`h-4 w-4 ${liked.has(post.id) ? "fill-current" : ""}`}
                          aria-hidden="true"
                        />
                        <span>{post.appreciations + (liked.has(post.id) ? 1 : 0)}</span>
                      </button>
                      <button
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                        aria-label={`${post.comments} comments`}
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        <span>{post.comments}</span>
                      </button>
                      <button
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                        aria-label="Share this post"
                      >
                        <Share2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      onClick={() => toggleSave(post.id)}
                      className={`transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                        saved.has(post.id)
                          ? "text-folia-gold"
                          : "text-muted-foreground hover:text-folia-gold"
                      }`}
                      aria-label={saved.has(post.id) ? "Remove from collection" : "Collect this work"}
                      aria-pressed={saved.has(post.id)}
                    >
                      <Bookmark
                        className={`h-4 w-4 ${saved.has(post.id) ? "fill-current" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </FoliaLayout>
  );
}
