import { AppLayout } from "@/components/social-media/AppLayout";
import { Composer } from "@/components/social-media/Composer";
import { PostCard } from "@/components/social-media/PostCard";
import { TrendingSidebar } from "@/components/social-media/TrendingSidebar";
import { feedPosts } from "@/data/mockData";

export default function FeedPage() {
  return (
    <AppLayout>
      <div className="flex max-w-[1200px] mx-auto">
        {/* Main feed */}
        <div className="flex-1 min-w-0 border-r border-border">
          <header className="sticky top-0 z-10 pulse-glass px-4 py-3 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">Feed</h1>
          </header>

          <div className="p-4 space-y-4">
            <Composer />
            {feedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        <TrendingSidebar />
      </div>
    </AppLayout>
  );
}
