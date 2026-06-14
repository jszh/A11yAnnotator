import { Search } from "lucide-react";
import { AppLayout } from "@/components/social-media/AppLayout";
import { PostCard } from "@/components/social-media/PostCard";
import { trendingTopics, users, explorePosts } from "@/data/mockData";
import { Button } from "@/components/ui/button";

export default function ExplorePage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <header className="sticky top-0 z-10 pulse-glass px-4 py-3 border-b border-border">
          <h1 className="text-xl font-bold text-foreground mb-3">Explore</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="explore-search" className="sr-only">Search Pulse</label>
            <input
              id="explore-search"
              type="search"
              placeholder="Search Pulse..."
              className="pulse-input pl-10"
            />
          </div>
        </header>

        <div className="p-4 space-y-6">
          {/* Trending hashtags */}
          <section aria-labelledby="trending-tags-heading">
            <h2 id="trending-tags-heading" className="text-lg font-bold text-foreground mb-3">
              Trending Now
            </h2>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map((topic) => (
                <span key={topic.tag} className="pulse-hashtag">
                  {topic.tag}
                  <span className="ml-1.5 opacity-70 text-xs">{topic.posts}</span>
                </span>
              ))}
            </div>
          </section>

          {/* Suggested users */}
          <section aria-labelledby="suggested-heading">
            <h2 id="suggested-heading" className="text-lg font-bold text-foreground mb-3">
              Suggested for You
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {users.slice(0, 4).map((user) => (
                <div key={user.id} className="pulse-card p-4 flex flex-col items-center text-center">
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="pulse-avatar w-14 h-14 mb-2"
                  />
                  <p className="text-sm font-semibold text-foreground truncate w-full">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">@{user.handle}</p>
                  <Button size="sm" className="rounded-full w-full text-xs">
                    Follow
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Popular posts grid */}
          <section aria-labelledby="popular-heading">
            <h2 id="popular-heading" className="text-lg font-bold text-foreground mb-3">
              Popular
            </h2>
            <div className="columns-1 sm:columns-2 gap-4 space-y-4">
              {explorePosts.map((post) => (
                <div key={post.id} className="break-inside-avoid">
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
