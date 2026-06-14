import FoliaLayout from "@/components/social-media/FoliaLayout";
import Composer from "@/components/social-media/Composer";
import FeedToggle from "@/components/social-media/FeedToggle";
import PostCard, { PostData } from "@/components/social-media/PostCard";
import post1 from "@/assets/social-media/post1.jpg";
import post2 from "@/assets/social-media/post2.jpg";
import post3 from "@/assets/social-media/post3.jpg";
import post4 from "@/assets/social-media/post4.jpg";
import post5 from "@/assets/social-media/post5.jpg";
import post6 from "@/assets/social-media/post6.jpg";
import { TrendingUp, Sparkles } from "lucide-react";

const posts: PostData[] = [
  {
    id: "1",
    author: "Maya Chen",
    handle: "@mayapaints",
    avatar: "M",
    discipline: "Digital Art",
    caption: "Solstice III — exploring warmth and light through layered gradients. This piece took 3 weeks of iteration.",
    image: post1,
    appreciateCount: 342,
    commentCount: 28,
    tags: ["illustration", "procreate", "landscape"],
    timeAgo: "2h",
  },
  {
    id: "2",
    author: "Leo Kraft",
    handle: "@leokraft",
    avatar: "L",
    discipline: "Graphic Design",
    caption: "Material studies — playing with bold geometric shapes and metallic textures.",
    image: post2,
    appreciateCount: 189,
    commentCount: 14,
    tags: ["graphicdesign", "geometry", "color"],
    timeAgo: "4h",
  },
  {
    id: "3",
    author: "Hana Kim",
    handle: "@hanafilm",
    avatar: "H",
    discipline: "Photography",
    caption: "From my latest film photography series. Shot on Ilford HP5+ with natural window light.",
    image: post3,
    appreciateCount: 521,
    commentCount: 45,
    tags: ["filmphotography", "portrait", "blackandwhite"],
    timeAgo: "6h",
  },
  {
    id: "4",
    author: "Priya Sharma",
    handle: "@priyaletters",
    avatar: "P",
    discipline: "Typography",
    caption: "Watercolor lettering practice — trying to capture the feeling of spring. 🌸",
    image: post4,
    appreciateCount: 276,
    commentCount: 31,
    tags: ["handlettering", "watercolor", "typography"],
    timeAgo: "8h",
  },
  {
    id: "5",
    author: "Aiden Park",
    handle: "@aiden3d",
    avatar: "A",
    discipline: "3D Art",
    caption: "Iridescent form studies — exploring how light interacts with complex surfaces in Blender.",
    image: post5,
    appreciateCount: 403,
    commentCount: 22,
    tags: ["3dart", "blender", "abstract"],
    timeAgo: "12h",
  },
  {
    id: "6",
    author: "Sofia Reyes",
    handle: "@sofiadrawing",
    avatar: "S",
    discipline: "Illustration",
    caption: "Botanical illustration for a children's book project. Watercolor on cold-pressed paper.",
    image: post6,
    appreciateCount: 198,
    commentCount: 17,
    tags: ["botanical", "watercolor", "illustration"],
    timeAgo: "1d",
  },
];

const trendingCreators = [
  { name: "Yuki Tanaka", handle: "@yukitype", discipline: "Typography" },
  { name: "Carlos Mendez", handle: "@carlosmotion", discipline: "Motion" },
  { name: "Ava Li", handle: "@avali3d", discipline: "3D Art" },
];

export default function FoliaFeed() {
  return (
    <FoliaLayout title="Feed | Folia">
      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main feed */}
          <div className="flex-1 max-w-2xl space-y-6">
            <h1 className="text-2xl font-display text-foreground">Your Feed</h1>
            <FeedToggle />
            <Composer />
            <div className="space-y-5" role="feed" aria-label="Creative posts">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="hidden lg:block w-72 space-y-5 flex-shrink-0" aria-label="Trending and suggestions">
            {/* Trending Creators */}
            <div className="folia-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Rising Creators</h2>
              </div>
              <div className="space-y-3">
                {trendingCreators.map((c) => (
                  <div key={c.handle} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.discipline}</p>
                      </div>
                    </div>
                    <button className="text-xs px-3 py-1 rounded-full border border-border hover:bg-secondary text-foreground transition-colors font-medium">
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Palettes */}
            <div className="folia-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Trending Palettes</h2>
              </div>
              <div className="space-y-2.5">
                {[
                  ["#E8927C", "#F2C078", "#9DC88D", "#4A7C59"],
                  ["#2D3047", "#E84855", "#F9DC5C", "#3185FC"],
                  ["#F4ACB7", "#D8E2DC", "#FFE5D9", "#9D8189"],
                ].map((palette, i) => (
                  <div key={i} className="flex gap-1.5">
                    {palette.map((color) => (
                      <div
                        key={color}
                        className="w-10 h-10 rounded-lg"
                        style={{ backgroundColor: color }}
                        aria-label={`Color ${color}`}
                        role="img"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </FoliaLayout>
  );
}
