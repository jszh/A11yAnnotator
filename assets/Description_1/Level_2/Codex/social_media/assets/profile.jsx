function ProfilePage() {
  const { posts } = window.PulseData;
  const [activeTab, setActiveTab] = useState("Posts");
  const [liveMessage, setLiveMessage] = useState("");
  const tabs = ["Posts", "Replies", "Media", "Likes"];

  return (
    <PageLayout currentPage="profile" liveMessage={liveMessage}>
      <section className="cover-gradient overflow-hidden rounded-[2rem] text-white shadow-xl">
        <div className="h-44" />
        <div className="bg-white px-6 pb-6 pt-0 text-slate-900">
          <div className="-mt-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80" alt="Alex Rivera avatar" className="h-24 w-24 rounded-full border-4 border-white object-cover" />
              <h1 className="mt-4 text-4xl font-semibold">Alex Rivera</h1>
              <p className="mt-1 text-sm text-slate-500">@alexr</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Writer covering internet culture, civic systems, and design-heavy social products.</p>
              <p className="mt-3 text-sm text-slate-600">12.4K followers · 845 following</p>
            </div>
            <button type="button" className="focus-ring rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" aria-label="Edit Pulse profile">
              Edit Profile
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="profile-tabs-heading">
        <h2 id="profile-tabs-heading" className="text-2xl font-semibold text-slate-950">Profile Content</h2>
        <div role="tablist" aria-label="Profile sections" className="mt-5 flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => {
                setActiveTab(tab);
                setLiveMessage(`Showing ${tab.toLowerCase()} tab.`);
              }}
              className="tab-button focus-ring rounded-full px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300"
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={`${activeTab}-${post.id}`} post={post} onAnnounce={setLiveMessage} />
          ))}
        </div>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ProfilePage />);
