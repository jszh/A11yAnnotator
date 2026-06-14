function FeedPage() {
  const [liveMessage, setLiveMessage] = useState("");
  const [remaining, setRemaining] = useState(280);
  const { posts, trending } = window.PulseData;

  const sidebar = (
    <div className="space-y-5">
      <section className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="trending-heading">
        <h2 id="trending-heading" className="text-2xl font-semibold text-slate-950">Trending Topics</h2>
        <ul className="mt-5 space-y-3">
          {trending.slice(0, 3).map((topic) => (
            <li key={topic} className="rounded-[1.5rem] bg-slate-50 p-4 text-sm font-medium text-slate-700">{topic}</li>
          ))}
        </ul>
      </section>
    </div>
  );

  return (
    <PageLayout currentPage="feed" liveMessage={liveMessage} sidebar={sidebar}>
      <section>
        <h1 className="text-4xl font-semibold text-slate-950">Main Feed</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">Posts from people you follow, trending discussions, and quick reactions from your network.</p>
      </section>

      <div className="mt-8 space-y-5">
        <Composer onPost={(message) => setLiveMessage(`Posted update: ${message}`)} remaining={remaining} setRemaining={setRemaining} />
        <section aria-labelledby="feed-posts-heading">
          <h2 id="feed-posts-heading" className="text-2xl font-semibold text-slate-950">Latest Posts</h2>
          <div className="mt-5 space-y-5">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onAnnounce={setLiveMessage} />
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<FeedPage />);
