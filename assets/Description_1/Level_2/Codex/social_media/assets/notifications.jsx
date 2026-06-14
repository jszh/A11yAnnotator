function NotificationsPage() {
  const { notifications } = window.PulseData;
  const [activeTab, setActiveTab] = useState("All");
  const [liveMessage, setLiveMessage] = useState("4 unread notifications.");
  const tabs = ["All", "Mentions", "Likes", "Follows"];

  const visibleNotifications = notifications.filter((item) => activeTab === "All" || item.type === activeTab);

  return (
    <PageLayout currentPage="notifications" liveMessage={liveMessage}>
      <section>
        <h1 className="text-4xl font-semibold text-slate-950">Notifications</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">Track mentions, likes, follows, and recent activity around your posts.</p>
      </section>

      <section className="mt-8 panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="notifications-tabs-heading">
        <h2 id="notifications-tabs-heading" className="text-2xl font-semibold text-slate-950">Activity Filters</h2>
        <div role="tablist" aria-label="Notification categories" className="mt-5 flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => {
                setActiveTab(tab);
                setLiveMessage(`Showing ${tab} notifications.`);
              }}
              className="tab-button focus-ring rounded-full px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300"
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="notification-list-heading">
        <h2 id="notification-list-heading" className="text-2xl font-semibold text-slate-950">Recent Alerts</h2>
        <div className="mt-5 space-y-4">
          {visibleNotifications.map((item) => (
            <article key={`${item.handle}-${item.time}`} className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
              <div className="flex gap-4">
                <img src={item.avatar} alt={`${item.displayName} avatar`} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.displayName}</h3>
                  <p className="text-sm text-slate-500">{item.handle}</p>
                  <p className="mt-2 text-sm text-slate-700">{item.displayName} {item.action} · {item.time}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.snippet}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<NotificationsPage />);
