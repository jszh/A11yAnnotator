const { useState } = React;

const navItems = [
  { label: "Feed", href: "index.html" },
  { label: "Explore", href: "explore.html" },
  { label: "Notifications", href: "notifications.html" },
  { label: "Messages", href: "messages.html" },
  { label: "Profile", href: "profile.html" },
  { label: "Settings", href: "settings.html" },
];

const trendingTopics = [
  "🔥 #ClimateWeek — 84K posts",
  "#TechLayoffs",
  "#WorldCup2026",
  "#DesignSystems",
];

const posts = [
  {
    id: 1,
    name: "Maya Chen",
    handle: "@maya.codes",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    time: "18m",
    text: "Spent the morning rebuilding our onboarding flow. Small copy changes, but the experience feels dramatically calmer now. Shipping thoughtful details still matters.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    likes: 284,
    comments: 31,
    shares: 12,
    bookmarks: 49,
  },
  {
    id: 2,
    name: "Jules Rivera",
    handle: "@julesphoto",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    time: "42m",
    text: "Golden hour in Lower Manhattan. Pulse still feels like the only place where people slow down long enough to actually talk about the photo and not just the gear.",
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
    likes: 912,
    comments: 84,
    shares: 20,
    bookmarks: 133,
  },
  {
    id: 3,
    name: "Nia Roberts",
    handle: "@niasays",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
    time: "1h",
    text: "A lot of product conversations are really change-management conversations in disguise. Teams want new habits without admitting they need new habits.",
    image: "",
    likes: 376,
    comments: 59,
    shares: 44,
    bookmarks: 88,
  },
  {
    id: 4,
    name: "Theo Martinez",
    handle: "@theotravel",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
    time: "2h",
    text: "Weekend reminder: you do not need a productivity framework for a walk, a coffee, and a notebook. Sometimes the reset is the work.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    likes: 640,
    comments: 41,
    shares: 18,
    bookmarks: 96,
  },
];

const suggestedUsers = [
  {
    name: "Aria Patel",
    handle: "@ariadraws",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Owen Brooks",
    handle: "@owenbuilds",
    avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Sofia Kim",
    handle: "@sofiamedia",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Luca Green",
    handle: "@luca.notes",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
  },
];

const notificationItems = [
  { avatar: posts[0].avatar, category: "All", text: "Maya liked your post · 2h", snippet: "That thread about better meeting notes deserved more love." },
  { avatar: posts[1].avatar, category: "Mentions", text: "Jules mentioned you in a comment · 4h", snippet: "@alex this framing made me think of your Brooklyn shots." },
  { avatar: posts[2].avatar, category: "Follows", text: "Nia started following you · 7h", snippet: "View profile and see what you're both discussing." },
  { avatar: posts[3].avatar, category: "Likes", text: "Theo liked your reply · 9h", snippet: "Agreed. Offline time makes online work better." },
];

const conversations = [
  { name: "Maya Chen", handle: "@maya.codes", preview: "Can you send the draft before standup?", time: "9:12 AM", unread: 2, avatar: posts[0].avatar },
  { name: "Jules Rivera", handle: "@julesphoto", preview: "That photo essay was excellent.", time: "Yesterday", unread: 0, avatar: posts[1].avatar },
  { name: "Nia Roberts", handle: "@niasays", preview: "Let’s post the panel recap tonight.", time: "Yesterday", unread: 1, avatar: posts[2].avatar },
];

function Logo() {
  return (
    <a href="index.html" className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-extrabold text-white shadow-lg shadow-slate-300">
        P
      </div>
      <div>
        <div className="text-lg font-extrabold tracking-tight text-slate-950">Pulse</div>
        <div className="text-xs text-slate-500">Real-time culture, photos, and conversations</div>
      </div>
    </a>
  );
}

function MobileHeader({ currentPage }) {
  return (
    <header className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Logo />
        <a href={currentPage === "messages.html" ? "index.html" : "messages.html"} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          {currentPage === "messages.html" ? "Back to Feed" : "Messages"}
        </a>
      </div>
    </header>
  );
}

function SidebarNav({ currentPage }) {
  return (
    <aside className="hidden lg:block lg:w-[260px]">
      <div className="sticky top-6 space-y-5">
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <Logo />
          <nav className="mt-6 space-y-2">
            {navItems.map((item) => {
              const active = currentPage === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Trending</div>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {trendingTopics.map((topic) => (
              <a key={topic} href="explore.html" className="block rounded-2xl bg-slate-50 px-4 py-3 font-semibold">
                {topic}
              </a>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>Pulse social platform mockup</div>
        <div className="flex flex-wrap gap-4">
          <a href="explore.html" className="hover:text-slate-900">Explore</a>
          <a href="profile.html" className="hover:text-slate-900">Profile</a>
          <a href="settings.html" className="hover:text-slate-900">Settings</a>
        </div>
      </div>
    </footer>
  );
}

function PageShell({ currentPage, rightRail, children }) {
  return (
    <div className="min-h-screen">
      <MobileHeader currentPage={currentPage} />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <SidebarNav currentPage={currentPage} />
        <main className="min-w-0 flex-1">{children}</main>
        {rightRail && <aside className="hidden xl:block xl:w-[320px]">{rightRail}</aside>}
      </div>
      <Footer />
    </div>
  );
}

function Composer() {
  return (
    <section className="surface-card rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80" alt="Alex" className="h-12 w-12 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-400">
            What's on your mind, Alex?
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-2">Photo</span>
              <span className="rounded-full bg-slate-100 px-3 py-2">GIF</span>
              <span className="rounded-full bg-slate-100 px-3 py-2">Topic</span>
            </div>
            <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Post</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PostCard({ post }) {
  return (
    <article className="post-card rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <img src={post.avatar} alt={post.name} className="h-12 w-12 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold text-slate-950">{post.name}</span>
            <span className="text-slate-500">{post.handle}</span>
            <span className="text-slate-400">· {post.time}</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-700">{post.text}</p>
          {post.image && (
            <div className="mt-4 overflow-hidden rounded-[24px] bg-slate-100">
              <img src={post.image} alt={post.name} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-2">Like {post.likes}</span>
            <span className="rounded-full bg-slate-100 px-3 py-2">Comment {post.comments}</span>
            <span className="rounded-full bg-slate-100 px-3 py-2">Share {post.shares}</span>
            <span className="rounded-full bg-slate-100 px-3 py-2">Bookmark {post.bookmarks}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function FeedRail() {
  return (
    <div className="sticky top-6 space-y-5">
      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Trending Topics</div>
        <div className="mt-4 space-y-3">
          {trendingTopics.map((topic) => (
            <a key={topic} href="explore.html" className="block rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
              {topic}
            </a>
          ))}
        </div>
      </div>
      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Suggested for You</div>
        <div className="mt-4 space-y-3">
          {suggestedUsers.slice(0, 3).map((user) => (
            <div key={user.handle} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-950">{user.name}</div>
                <div className="truncate text-xs text-slate-500">{user.handle}</div>
              </div>
              <button className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Follow</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeedPage() {
  return (
    <PageShell currentPage="index.html" rightRail={<FeedRail />}>
      <div className="space-y-5">
        <Composer />
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </PageShell>
  );
}

function ExplorePage() {
  return (
    <PageShell currentPage="explore.html" rightRail={<FeedRail />}>
      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-400">
          Search Pulse topics, creators, and discussions
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["#ClimateWeek", "#TechLayoffs", "#WorldCup2026", "#CreativeWork", "#AIArt"].map((tag) => (
            <a key={tag} href="explore.html" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {tag}
            </a>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Suggested for You</div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {suggestedUsers.map((user) => (
            <div key={user.handle} className="surface-card rounded-[28px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <img src={user.avatar} alt={user.name} className="h-12 w-12 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-slate-950">{user.name}</div>
                  <div className="truncate text-sm text-slate-500">{user.handle}</div>
                </div>
              </div>
              <button className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Follow</button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Popular Posts</div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {posts.concat(posts.slice(0, 2)).map((post, index) => (
            <article key={`${post.id}-${index}`} className="surface-card overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
              {post.image && <img src={post.image} alt={post.name} className="h-52 w-full object-cover" />}
              <div className="p-4">
                <div className="text-sm font-bold text-slate-950">{post.name}</div>
                <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-600">{post.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function NotificationsPage() {
  const [tab, setTab] = useState("All");
  const items = notificationItems.filter((item) => tab === "All" || item.category === tab);

  return (
    <PageShell currentPage="notifications.html" rightRail={<FeedRail />}>
      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-2xl font-extrabold text-slate-950">Notifications</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["All", "Mentions", "Likes", "Follows"].map((label) => (
            <button
              key={label}
              onClick={() => setTab(label)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${tab === label ? "tab-active" : "border-slate-200 bg-white text-slate-600"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {items.map((item, index) => (
            <article key={`${item.text}-${index}`} className="surface-card rounded-[28px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex gap-3">
                <img src={item.avatar} alt="" className="h-11 w-11 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-950">{item.text}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">{item.snippet}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function MessagesPage() {
  return (
    <PageShell currentPage="messages.html">
      <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-2xl font-extrabold text-slate-950">Messages</div>
          <div className="mt-5 space-y-3">
            {conversations.map((chat) => (
              <div key={chat.handle} className="surface-card rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <img src={chat.avatar} alt={chat.name} className="h-11 w-11 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate font-bold text-slate-950">{chat.name}</div>
                      <div className="text-xs text-slate-400">{chat.time}</div>
                    </div>
                    <div className="truncate text-sm text-slate-500">{chat.preview}</div>
                  </div>
                  {chat.unread > 0 && (
                    <div className="rounded-full bg-slate-950 px-2 py-1 text-xs font-semibold text-white">{chat.unread}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <div className="text-lg font-bold text-slate-950">Maya Chen</div>
            <div className="text-sm text-slate-500">@maya.codes</div>
          </div>
          <div className="space-y-4 py-5">
            <div className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Today · 9:05 AM</div>
            <div className="flex justify-start">
              <div className="chat-bubble-in max-w-[80%] rounded-[22px] px-4 py-3 text-sm leading-7">
                Morning. Are you still posting the thread about creator tools after lunch?
              </div>
            </div>
            <div className="flex justify-end">
              <div className="chat-bubble-out max-w-[80%] rounded-[22px] px-4 py-3 text-sm leading-7">
                Yes. Finishing the screenshots now. I’ll send the draft here in 20.
              </div>
            </div>
            <div className="flex justify-start">
              <div className="chat-bubble-in max-w-[80%] rounded-[22px] px-4 py-3 text-sm leading-7">
                Perfect. Can you include the side-by-side comparison card too?
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <div className="flex gap-3">
              <button className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">😊</button>
              <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-400">
                Write a message
              </div>
              <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Send</button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function ProfilePage() {
  const [tab, setTab] = useState("Posts");

  return (
    <PageShell currentPage="profile.html" rightRail={<FeedRail />}>
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="h-44 bg-[linear-gradient(135deg,_#0f172a,_#2563eb,_#f472b6)]"></div>
        <div className="p-5">
          <div className="-mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80"
                alt="Alex"
                className="h-28 w-28 rounded-[28px] border-4 border-white object-cover"
              />
              <div className="pb-2">
                <div className="text-2xl font-extrabold text-slate-950">Alex Morgan</div>
                <div className="text-sm text-slate-500">@alexwrites</div>
              </div>
            </div>
            <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Edit Profile</button>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Writing about products, internet culture, and how teams communicate online. Based in Brooklyn.
          </p>
          <div className="mt-4 flex flex-wrap gap-5 text-sm font-semibold text-slate-600">
            <span><strong className="text-slate-950">12.4K</strong> Followers</span>
            <span><strong className="text-slate-950">582</strong> Following</span>
            <span><strong className="text-slate-950">214</strong> Posts</span>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {["Posts", "Replies", "Media", "Likes"].map((label) => (
            <button
              key={label}
              onClick={() => setTab(label)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${tab === label ? "tab-active" : "border-slate-200 bg-white text-slate-600"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {(tab === "Media" ? posts.filter((post) => post.image) : posts).map((post) => (
            <article key={`${tab}-${post.id}`} className="surface-card rounded-[28px] border border-slate-200 bg-slate-50 p-4">
              {post.image && <img src={post.image} alt={post.name} className="mb-4 h-48 w-full rounded-[20px] object-cover" />}
              <div className="text-sm font-bold text-slate-950">{post.name}</div>
              <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-600">{post.text}</p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function SettingsPage() {
  return (
    <PageShell currentPage="settings.html" rightRail={<FeedRail />}>
      <section className="space-y-5">
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-2xl font-extrabold text-slate-950">Settings</div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-lg font-bold text-slate-950">Account</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input type="text" value="alexwrites" readOnly className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <input type="email" value="alex@pulse.app" readOnly className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <input type="password" value="password" readOnly className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2" />
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-lg font-bold text-slate-950">Privacy</div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 px-4 py-4">Who can see posts: Everyone</div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4">DM permissions: Followers you follow back</div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-lg font-bold text-slate-950">Notifications</div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
              <span>Email notifications</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">On</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
              <span>Push notifications</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">On</span>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-lg font-bold text-slate-950">Appearance</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="tab-active rounded-full border px-4 py-2 text-sm font-semibold">Light Mode</button>
            <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Dark Mode</button>
          </div>
        </div>

        <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <div className="text-lg font-bold text-slate-950">Danger Zone</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-700">Deactivate Account</button>
            <button className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Delete Account</button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function AppRouter() {
  const page = document.body.dataset.page;

  if (page === "feed") return <FeedPage />;
  if (page === "explore") return <ExplorePage />;
  if (page === "notifications") return <NotificationsPage />;
  if (page === "messages") return <MessagesPage />;
  if (page === "profile") return <ProfilePage />;
  if (page === "settings") return <SettingsPage />;
  return <FeedPage />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppRouter />);
