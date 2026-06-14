const NAV_ITEMS = [
  { href: "index.html", key: "feed", label: "Main Feed", short: "Feed" },
  { href: "explore.html", key: "explore", label: "Explore", short: "Explore" },
  { href: "notifications.html", key: "notifications", label: "Notifications", short: "Alerts" },
  { href: "messages.html", key: "messages", label: "Messages", short: "Messages" },
  { href: "profile.html", key: "profile", label: "Profile", short: "Profile" },
  { href: "settings.html", key: "settings", label: "Settings", short: "Settings" }
];

const POSTS = [
  {
    author: "Aria Chen",
    handle: "@aria.design",
    time: "12m",
    content:
      "Shipped a fresh dashboard interaction pattern today. Tiny motion + clear hierarchy made completion rates jump.",
    stats: { like: 128, comment: 24, share: 9 }
  },
  {
    author: "Leo Patel",
    handle: "@buildwithleo",
    time: "43m",
    content:
      "Daily reminder: write the shortest function that still makes intent obvious. Future you is the main customer.",
    stats: { like: 94, comment: 17, share: 13 }
  },
  {
    author: "Nora Kim",
    handle: "@norawrites",
    time: "1h",
    content:
      "Testing out a creator challenge this week: one useful post every morning before standup. Who wants in?",
    stats: { like: 201, comment: 35, share: 19 }
  }
];

function Sidebar({ active }) {
  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <a href="index.html" className="block rounded-xl bg-slate-900 px-4 py-3 text-lg font-bold tracking-tight text-white">
          PulseNet
        </a>
        <nav className="mt-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={`block rounded-xl px-4 py-3 text-sm font-semibold ${
                active === item.key ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function MobileNav({ active }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="index.html" className="text-xl font-extrabold tracking-tight text-slate-900">
          PulseNet
        </a>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{NAV_ITEMS.find((n) => n.key === active)?.short}</span>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-3">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.key}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${
              active === item.key ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {item.short}
          </a>
        ))}
      </nav>
    </header>
  );
}

function Composer() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Content Composer</h2>
      <textarea
        className="mt-3 h-28 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-brand/40 transition focus:ring"
        placeholder="Share an update, insight, or question with your network..."
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 text-xs font-semibold text-slate-500">
          <button className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-slate-200">Photo</button>
          <button className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-slate-200">Poll</button>
          <button className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-slate-200">Link</button>
        </div>
        <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Post</button>
      </div>
    </section>
  );
}

function PostCard({ post }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-slate-900">{post.author}</h3>
          <p className="text-xs text-slate-500">
            {post.handle} · {post.time}
          </p>
        </div>
        <button className="text-xs font-semibold text-slate-500 hover:text-slate-800">Follow</button>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{post.content}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        <button className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200">Like {post.stats.like}</button>
        <button className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200">Comment {post.stats.comment}</button>
        <button className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200">Share {post.stats.share}</button>
      </div>
    </article>
  );
}

function RightRail() {
  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Trending</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="rounded-lg bg-slate-50 px-3 py-2">#designsystems</li>
          <li className="rounded-lg bg-slate-50 px-3 py-2">#buildinpublic</li>
          <li className="rounded-lg bg-slate-50 px-3 py-2">#frontendtips</li>
        </ul>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Suggested People</h3>
        <ul className="mt-3 space-y-3 text-sm text-slate-700">
          <li className="flex items-center justify-between">
            <span>Priya Sharma</span>
            <button className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white">Follow</button>
          </li>
          <li className="flex items-center justify-between">
            <span>Owen Ross</span>
            <button className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white">Follow</button>
          </li>
        </ul>
      </section>
    </aside>
  );
}

function FeedPage() {
  return (
    <div className="space-y-4">
      <Composer />
      {POSTS.map((post) => (
        <PostCard key={post.author + post.time} post={post} />
      ))}
    </div>
  );
}

function ExplorePage() {
  const cards = [
    "AI Product Design",
    "Remote Work Rituals",
    "Growth Tactics",
    "Engineering Leadership",
    "Creator Economy",
    "Startup Finance"
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Explore</h1>
      <p className="mt-1 text-sm text-slate-600">Discover curated discussions and communities.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {cards.map((item) => (
          <a key={item} href="index.html" className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-brand hover:bg-white">
            <h2 className="font-semibold text-slate-900">{item}</h2>
            <p className="mt-1 text-xs text-slate-500">Join the conversation</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function NotificationsPage() {
  const notifications = [
    "Aria Chen liked your post about onboarding checklists.",
    "Nora Kim mentioned you in a thread: \"shipping habits\".",
    "Leo Patel reshared your post to 2.1k followers.",
    "Your weekly analytics report is ready to view."
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
      <ul className="mt-4 divide-y divide-slate-100">
        {notifications.map((item) => (
          <li key={item} className="py-3 text-sm text-slate-700">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function MessagesPage() {
  const threads = ["Product Crew", "Aria Chen", "Nora Kim", "Leo Patel"];

  return (
    <section className="grid gap-4 lg:grid-cols-[260px,1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <h1 className="text-lg font-bold text-slate-900">Messages</h1>
        <ul className="mt-3 space-y-2 text-sm">
          {threads.map((thread, idx) => (
            <li key={thread} className={`rounded-lg px-3 py-2 ${idx === 0 ? "bg-brand text-white" : "bg-slate-50 text-slate-700"}`}>
              {thread}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <p className="text-sm text-slate-500">Product Crew · Active now</p>
        <div className="mt-4 space-y-3 text-sm">
          <div className="max-w-md rounded-xl bg-slate-100 px-3 py-2 text-slate-700">Can we review the launch checklist before 3 PM?</div>
          <div className="ml-auto max-w-md rounded-xl bg-brand px-3 py-2 text-white">Yes, I left comments in the doc and posted a summary in the feed.</div>
          <div className="max-w-md rounded-xl bg-slate-100 px-3 py-2 text-slate-700">Perfect. Let us ship it.</div>
        </div>
        <div className="mt-4 flex gap-2">
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-brand/40 focus:ring" placeholder="Write a message..." />
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Send</button>
        </div>
      </div>
    </section>
  );
}

function ProfilePage() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Profile</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Meng Qi Shi</h1>
        <p className="mt-1 text-sm text-slate-600">Product-minded engineer sharing design and growth experiments.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">1.8k Followers</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">412 Following</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">67 Posts</span>
        </div>
      </div>
      <PostCard post={POSTS[0]} />
      <PostCard post={POSTS[2]} />
    </section>
  );
}

function SettingsPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          Display Name
          <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none ring-brand/40 focus:ring" defaultValue="Meng Qi Shi" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Email
          <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal outline-none ring-brand/40 focus:ring" defaultValue="meng@example.com" />
        </label>
      </div>
      <div className="mt-6 space-y-3 text-sm">
        <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
          <span>Push notifications</span>
          <input type="checkbox" defaultChecked />
        </label>
        <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
          <span>Weekly digest emails</span>
          <input type="checkbox" defaultChecked />
        </label>
        <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
          <span>Profile visibility: Public</span>
          <input type="checkbox" defaultChecked />
        </label>
      </div>
      <button className="mt-6 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Save changes</button>
    </section>
  );
}

function PageContent({ page }) {
  if (page === "explore") return <ExplorePage />;
  if (page === "notifications") return <NotificationsPage />;
  if (page === "messages") return <MessagesPage />;
  if (page === "profile") return <ProfilePage />;
  if (page === "settings") return <SettingsPage />;
  return <FeedPage />;
}

function App() {
  const page = document.getElementById("root")?.dataset.page || "feed";

  return (
    <>
      <MobileNav active={page} />
      <main className="mx-auto flex max-w-6xl gap-6 px-4 py-6 sm:px-6">
        <Sidebar active={page} />
        <section className="min-w-0 flex-1">
          <PageContent page={page} />
        </section>
        <section className="hidden w-72 shrink-0 xl:block">
          <RightRail />
        </section>
      </main>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
