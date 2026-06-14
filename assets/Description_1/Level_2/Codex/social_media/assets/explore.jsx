function ExplorePage() {
  const { trending, suggestedUsers, posts } = window.PulseData;
  const [liveMessage, setLiveMessage] = useState("");
  const [following, setFollowing] = useState({});

  return (
    <PageLayout currentPage="explore" liveMessage={liveMessage}>
      <section>
        <h1 className="text-4xl font-semibold text-slate-950">Explore Pulse</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">Search live conversations, browse hashtags, and discover people worth following.</p>
      </section>

      <section className="mt-8 panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="explore-search-heading">
        <h2 id="explore-search-heading" className="text-2xl font-semibold text-slate-950">Search and Trends</h2>
        <label className="mt-4 block text-sm font-medium text-slate-800">
          Search Pulse
          <input
            type="search"
            className="focus-ring mt-2 w-full rounded-[1.5rem] border border-slate-300 px-4 py-3"
            aria-label="Search trending posts, people, and hashtags"
          />
        </label>
        <div className="mt-5 flex flex-wrap gap-3">
          {trending.map((topic) => (
            <button key={topic} type="button" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700" aria-label={`Search topic ${topic}`}>
              {topic}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="suggested-heading">
        <h2 id="suggested-heading" className="text-2xl font-semibold text-slate-950">Suggested for You</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {suggestedUsers.map((user) => {
            const isFollowing = Boolean(following[user.handle]);
            return (
              <article key={user.handle} className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
                <img src={user.avatar} alt={`${user.displayName} avatar`} className="h-16 w-16 rounded-full object-cover" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{user.displayName}</h3>
                <p className="text-sm text-slate-500">{user.handle}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{user.bio}</p>
                <button
                  type="button"
                  onClick={() => {
                    setFollowing((current) => ({ ...current, [user.handle]: !current[user.handle] }));
                    setLiveMessage(`${isFollowing ? "Unfollowed" : "Following"} ${user.handle}.`);
                  }}
                  aria-pressed={isFollowing}
                  className={`focus-ring mt-4 rounded-full px-4 py-2 text-sm font-medium ${isFollowing ? "border border-slate-300 text-slate-700" : "bg-slate-950 text-white"}`}
                  aria-label={`${isFollowing ? "Following" : "Follow"} ${user.handle}`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="popular-posts-heading">
        <h2 id="popular-posts-heading" className="text-2xl font-semibold text-slate-950">Popular Posts</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onAnnounce={setLiveMessage} />
          ))}
        </div>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ExplorePage />);
