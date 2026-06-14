import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PostData {
  id: string;
  user: { name: string; handle: string; avatar: string };
  timestamp: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  liked?: boolean;
  bookmarked?: boolean;
}

const feedPosts: PostData[] = [
  {
    id: "1",
    user: { name: "Maya Chen", handle: "@mayachen", avatar: "Maya" },
    timestamp: "2h",
    content: "Just finished building my first AI-powered app! The future of development is wild. Who else is experimenting with LLMs in production? 🚀",
    likes: 234,
    comments: 45,
    liked: true,
  },
  {
    id: "2",
    user: { name: "Jordan Lee", handle: "@jordanlee", avatar: "Jordan" },
    timestamp: "4h",
    content: "Golden hour at Joshua Tree never disappoints. Sometimes you just need to disconnect to reconnect.",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop",
    likes: 891,
    comments: 67,
  },
  {
    id: "3",
    user: { name: "Sam Rivera", handle: "@samrivera", avatar: "Sam" },
    timestamp: "5h",
    content: "Hot take: the best code is the code you don't write. Spent the day deleting 2000 lines and the app is faster than ever. Less is truly more.",
    likes: 567,
    comments: 112,
    liked: true,
  },
  {
    id: "4",
    user: { name: "Priya Patel", handle: "@priyapatel", avatar: "Priya" },
    timestamp: "8h",
    content: "Climate tech is the most important sector of the decade. Just joined an amazing startup working on carbon capture. Let's build a better future 🌍",
    likes: 1203,
    comments: 89,
    bookmarked: true,
  },
  {
    id: "5",
    user: { name: "Leo Martinez", handle: "@leomartinez", avatar: "Leo" },
    timestamp: "12h",
    content: "Street photography in Tokyo hits different. Every corner is a composition waiting to happen.",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop",
    likes: 2341,
    comments: 156,
  },
];

const trendingTopics = [
  { tag: "#ClimateWeek", posts: "84K" },
  { tag: "#TechLayoffs", posts: "62K" },
  { tag: "#WorldCup2026", posts: "121K" },
  { tag: "#AIArt", posts: "45K" },
  { tag: "#SpaceX", posts: "33K" },
];

function PostCard({ post }: { post: PostData }) {
  return (
    <div className="pulse-card p-4 animate-slide-up">
      <div className="flex gap-3">
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.avatar}`}
          alt={post.user.name}
          className="w-10 h-10 rounded-full bg-secondary flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-sm text-foreground truncate">{post.user.name}</span>
              <span className="text-muted-foreground text-sm">{post.user.handle}</span>
              <span className="text-muted-foreground text-sm">· {post.timestamp}</span>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-foreground mt-1 leading-relaxed">{post.content}</p>
          {post.image && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border">
              <img src={post.image} alt="Post" className="w-full h-auto object-cover max-h-80" />
            </div>
          )}
          <div className="flex items-center gap-6 mt-3">
            <button className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked ? "text-pulse-rose" : "text-muted-foreground hover:text-pulse-rose"}`}>
              <Heart className={`w-4 h-4 ${post.liked ? "fill-current" : ""}`} />
              <span>{post.likes}</span>
            </button>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span>{post.comments}</span>
            </button>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-pulse-success transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button className={`ml-auto text-sm transition-colors ${post.bookmarked ? "text-pulse-amber" : "text-muted-foreground hover:text-pulse-amber"}`}>
              <Bookmark className={`w-4 h-4 ${post.bookmarked ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <div className="max-w-3xl mx-auto lg:max-w-none lg:flex gap-6 px-4 py-6">
      {/* Main Feed */}
      <div className="flex-1 max-w-2xl mx-auto lg:mx-0 space-y-4">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">Feed</h1>

        {/* Composer */}
        <div className="pulse-card p-4">
          <div className="flex gap-3">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
              alt="You"
              className="w-10 h-10 rounded-full bg-secondary flex-shrink-0"
            />
            <div className="flex-1">
              <textarea
                placeholder="What's on your mind, Alex?"
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none min-h-[60px]"
                rows={2}
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                <div className="flex gap-2">
                  <button className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-secondary">
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>
                <Button size="sm" className="rounded-full px-5 font-display text-xs font-semibold">
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        {feedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Trending Sidebar (desktop) */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-6 space-y-4">
          <div className="pulse-card p-4">
            <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              🔥 Trending
            </h2>
            <div className="space-y-3">
              {trendingTopics.map((topic) => (
                <button
                  key={topic.tag}
                  className="block w-full text-left hover:bg-secondary/50 -mx-2 px-2 py-1.5 rounded-md transition-colors"
                >
                  <p className="text-sm font-semibold text-primary">{topic.tag}</p>
                  <p className="text-xs text-muted-foreground">{topic.posts} posts</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pulse-card p-4">
            <h2 className="font-display font-semibold text-foreground mb-3">Who to follow</h2>
            <div className="space-y-3">
              {["Kai Tanaka", "Nina Rossi", "Dev Sharma"].map((name) => (
                <div key={name} className="flex items-center gap-2.5">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(" ", "")}`}
                    alt={name}
                    className="w-8 h-8 rounded-full bg-secondary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">@{name.toLowerCase().replace(" ", "")}</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-7 rounded-full px-3">
                    Follow
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
