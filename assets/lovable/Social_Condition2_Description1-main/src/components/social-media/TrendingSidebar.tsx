import { trendingTopics, users } from "@/data/mockData";
import { Button } from "@/components/ui/button";

export function TrendingSidebar() {
  return (
    <aside
      className="hidden xl:block w-80 h-screen sticky top-0 p-4 space-y-4 overflow-y-auto"
      aria-label="Trending and suggestions"
    >
      {/* Trending */}
      <section className="pulse-card p-4" aria-labelledby="trending-heading">
        <h2 id="trending-heading" className="text-lg font-bold text-foreground mb-4">
          🔥 Trending
        </h2>
        <div className="space-y-3">
          {trendingTopics.map((topic) => (
            <div key={topic.tag} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{topic.tag}</p>
                <p className="text-xs text-muted-foreground">{topic.posts} posts</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who to follow */}
      <section className="pulse-card p-4" aria-labelledby="suggestions-heading">
        <h2 id="suggestions-heading" className="text-lg font-bold text-foreground mb-4">
          Who to follow
        </h2>
        <div className="space-y-3">
          {users.slice(0, 3).map((user) => (
            <div key={user.id} className="flex items-center gap-3">
              <img
                src={user.avatar}
                alt={user.displayName}
                className="pulse-avatar w-10 h-10"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate">@{user.handle}</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-full text-xs px-3">
                Follow
              </Button>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
