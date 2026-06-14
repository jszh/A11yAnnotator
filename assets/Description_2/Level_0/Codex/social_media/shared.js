window.Folia = (() => {
  const html = window.htm.bind(window.React.createElement);

  const navItems = [
    { label: "Feed", href: "./index.html", icon: "Home" },
    { label: "Explore", href: "./explore.html", icon: "Compass" },
    { label: "Notifications", href: "./notifications.html", icon: "Bell" },
    { label: "Messages", href: "./messages.html", icon: "Inbox" },
    { label: "Profile", href: "./profile.html", icon: "Portfolio" },
    { label: "Settings", href: "./settings.html", icon: "Controls" },
  ];

  const posts = [
    {
      creator: "Mira Sol",
      handle: "@mirasol",
      discipline: "Illustration",
      title: "Solstice III",
      caption: "Pushing lighting on this editorial portrait before I lock the final color script. Looking for feedback on whether the warm edge light is carrying enough depth.",
      tags: ["#illustration", "#procreate", "#editorial"],
      stats: { appreciate: 284, collect: 73, comment: 31 },
      mood: "alt-a",
      time: "18m ago",
    },
    {
      creator: "Jun Park",
      handle: "@junparkframes",
      discipline: "Photography",
      title: "Night Market Notes",
      caption: "Shot a contact-sheet inspired series on 35mm and rebuilt the sequencing digitally. Curious if the pacing lands or feels too dense.",
      tags: ["#filmphotography", "#sequencing", "#street"],
      stats: { appreciate: 198, collect: 44, comment: 18 },
      mood: "alt-b",
      time: "1h ago",
    },
    {
      creator: "Rae Ito",
      handle: "@raeforms",
      discipline: "Typography",
      title: "Signal Type Study",
      caption: "Testing condensed display letterforms for a speculative festival identity. The counters are intentionally tight but I may have pushed legibility too far.",
      tags: ["#typography", "#branding", "#figma"],
      stats: { appreciate: 162, collect: 38, comment: 22 },
      mood: "alt-c",
      time: "3h ago",
    },
  ];

  const exploreTiles = [
    { medium: "Digital Art", creator: "Lina Grove", appreciate: 814, size: "md:col-span-2 md:row-span-2", mood: "" },
    { medium: "Photography", creator: "Owen Vale", appreciate: 602, size: "", mood: "alt-b" },
    { medium: "Typography", creator: "Pia North", appreciate: 431, size: "", mood: "alt-c" },
    { medium: "3D", creator: "Theo Wren", appreciate: 729, size: "md:col-span-2", mood: "alt-a" },
    { medium: "Motion", creator: "Sora Lin", appreciate: 558, size: "", mood: "" },
    { medium: "Collage", creator: "Niko Star", appreciate: 396, size: "", mood: "alt-b" },
  ];

  const risingCreators = [
    { name: "Hana Voss", focus: "Painterly concept art", streak: "12-day feedback streak" },
    { name: "Marco Bell", focus: "Architectural photography", streak: "Featured in 3 collections" },
    { name: "Tess Aki", focus: "Editorial motion loops", streak: "168% monthly growth" },
  ];

  const palettes = [
    ["Dawn Clay", ["#2b2d42", "#ef8354", "#f6bd60", "#f7ede2"]],
    ["Cinder Bloom", ["#0f172a", "#be123c", "#fb7185", "#fde68a"]],
    ["Coastline UI", ["#082f49", "#0ea5e9", "#67e8f9", "#ecfeff"]],
  ];

  const notifications = {
    activity: [
      { text: "Hana appreciated your piece 'Solstice III' · 4h", note: "Saved to her warm-light studies board" },
      { text: "Theo commented on 'Signal Type Study' · 6h", note: "\"The vertical rhythm feels great on mobile.\"" },
      { text: "Studio Circuit followed your portfolio · 9h", note: "They curate independent visual identities." },
    ],
    feedback: [
      { text: "Jun requested feedback on 'Night Market Notes' · 2h", note: "Looking for sequencing critique on frame 4-8." },
      { text: "Rae invited you into a critique thread · 5h", note: "Topic: typographic contrast for event posters." },
      { text: "Mila asked for color notes on 'Sunroom Draft' · 1d", note: "Palette leaning too cool after export." },
    ],
    collections: [
      { text: "Your project was added to 'Editorial Portrait Moods' · 3h", note: "Curated by Aster Studio" },
      { text: "Two collectors saved 'Signal Type Study' · 11h", note: "Now in 48 public collections" },
      { text: "Portfolio highlight picked up by 'New on Folia' · 1d", note: "1.8k views from homepage feature" },
    ],
  };

  const threads = [
    { name: "Northlight Zine", meta: "Collab board · 3 unread", active: true },
    { name: "Hana Voss", meta: "DM · shared a palette", active: false },
    { name: "Studio Circuit", meta: "Commission inquiry", active: false },
    { name: "Jun Park", meta: "Photo sequencing feedback", active: false },
  ];

  const featuredWorks = [
    { title: "Solstice III", views: "14.2k views", stats: "2.4k appreciates" },
    { title: "Field Notes Poster", views: "8.1k views", stats: "980 appreciates" },
    { title: "Quiet Transit", views: "6.8k views", stats: "712 appreciates" },
  ];

  const projectGrid = [
    { title: "Archive 01", views: "4.2k", appreciates: "384" },
    { title: "Tidal Type", views: "5.6k", appreciates: "522" },
    { title: "Paper Bloom", views: "3.1k", appreciates: "248" },
    { title: "Afterlight", views: "7.4k", appreciates: "901" },
    { title: "Study Frames", views: "2.8k", appreciates: "205" },
    { title: "Signal Draft", views: "4.9k", appreciates: "417" },
  ];

  function Logo() {
    return html`
      <a href="./index.html" className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold uppercase tracking-[0.28em] text-amber-300">Fo</div>
        <div>
          <p className="text-lg font-bold tracking-tight text-slate-950">Folia</p>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Creative Community</p>
        </div>
      </a>
    `;
  }

  function Sidebar({ current }) {
    return html`
      <aside className="glass-card hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-[2rem] border border-white/70 p-5 shadow-[0_28px_70px_rgba(15,23,42,0.08)] lg:flex">
        <${Logo} />
        <div className="mt-8 space-y-2">
          ${navItems.map(
            (item) => html`
              <a
                key=${item.href}
                href=${item.href}
                className=${`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  current === item.href ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"
                }`}
              >
                <span>${item.label}</span>
                <span className=${current === item.href ? "text-amber-300" : "text-slate-400"}>${item.icon}</span>
              </a>
            `
          )}
        </div>
        <div className="hero-wash mt-8 rounded-[1.75rem] p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">Weekly Prompt</p>
          <p className="mt-3 text-xl font-semibold">Show one unfinished thing.</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">Folia members are sharing rough frames, contact sheets, and process clips today.</p>
        </div>
        <div className="mt-auto rounded-[1.75rem] bg-slate-950 px-5 py-4 text-white">
          <p className="text-sm font-semibold">Mira Sol</p>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Illustration + Art Direction</p>
        </div>
      </aside>
    `;
  }

  function MobileNav({ current }) {
    return html`
      <div className="glass-card sticky top-0 z-40 mb-4 rounded-[1.75rem] border border-white/70 px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <${Logo} />
          <a href="./messages.html" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Inbox</a>
        </div>
        <div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto">
          ${navItems.map(
            (item) => html`
              <a
                key=${item.href}
                href=${item.href}
                className=${`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                  current === item.href ? "bg-slate-950 text-white" : "bg-white text-slate-600"
                }`}
              >
                ${item.label}
              </a>
            `
          )}
        </div>
      </div>
    `;
  }

  function TopBar({ title, subtitle, actionLabel, actionHref }) {
    return html`
      <div className="glass-card flex flex-col gap-4 rounded-[2rem] border border-white/70 px-5 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-2xl font-bold tracking-tight text-slate-950">${title}</p>
          <p className="mt-1 text-sm text-slate-500">${subtitle}</p>
        </div>
        ${actionLabel
          ? html`<a href=${actionHref || "./index.html"} className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">${actionLabel}</a>`
          : null}
      </div>
    `;
  }

  function AppShell({ current, title, subtitle, actionLabel, actionHref, children, aside }) {
    return html`
      <div className="folia-grid min-h-screen p-4 md:p-6">
        <div className="mx-auto flex max-w-[1500px] gap-6">
          <${Sidebar} current=${current} />
          <div className="min-w-0 flex-1">
            <${MobileNav} current=${current} />
            <${TopBar} title=${title} subtitle=${subtitle} actionLabel=${actionLabel} actionHref=${actionHref} />
            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 space-y-6">${children}</div>
              <div className="space-y-6">${aside}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function Card({ children, className = "" }) {
    return html`<section className=${`glass-card rounded-[2rem] border border-white/70 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ${className}`}>${children}</section>`;
  }

  function ComposerCard() {
    return html`
      <${Card}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-sm font-bold text-amber-700">MS</div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <p className="text-lg font-semibold text-slate-950">Share Your Work</p>
              <p className="text-sm text-slate-500">Drop in a WIP, ask for critique, or post a detail crop from your latest project.</p>
            </div>
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 p-5">
              <p className="text-sm font-semibold text-slate-700">Image Upload</p>
              <p className="mt-1 text-sm text-slate-500">Drag a render, mockup, scan, or contact sheet here</p>
            </div>
            <textarea className="h-28 w-full rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 outline-none" defaultValue="Testing a warmer grade and softer skin texture pass. Would love notes on whether the framing still feels intimate." />
            <div className="rounded-[1.25rem] bg-amber-50 px-4 py-3 text-sm text-amber-900">Add skills: #illustration #procreate</div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-2">Feedback welcome</span>
                <span className="rounded-full bg-slate-100 px-3 py-2">Process</span>
                <span className="rounded-full bg-slate-100 px-3 py-2">Portfolio draft</span>
              </div>
              <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Publish to Folia</button>
            </div>
          </div>
        </div>
      </${Card}>
    `;
  }

  function FeedToggle() {
    return html`
      <${Card} className="p-3">
        <div className="flex gap-2">
          <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">For You</button>
          <button className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-600">Following</button>
        </div>
      </${Card}>
    `;
  }

  function PostCard({ post }) {
    return html`
      <${Card}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">${post.creator.split(" ").map((part) => part[0]).join("")}</div>
            <div>
              <p className="font-semibold text-slate-950">${post.creator}</p>
              <p className="text-sm text-slate-500">${post.handle} · ${post.discipline} · ${post.time}</p>
            </div>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900">${post.discipline}</span>
        </div>
        <div className="mt-5">
          <p className="text-2xl font-semibold tracking-tight text-slate-950">${post.title}</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">${post.caption}</p>
        </div>
        <div className=${`artwork-panel ${post.mood} relative mt-5 aspect-[4/3] overflow-hidden rounded-[1.75rem]`}></div>
        <div className="mt-4 flex flex-wrap gap-2">
          ${post.tags.map((tag) => html`<span key=${tag} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">${tag}</span>`)}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button className="rounded-[1.25rem] bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-700">Appreciate <span className="ml-2 text-slate-500">${post.stats.appreciate}</span></button>
          <button className="rounded-[1.25rem] bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-700">Collect <span className="ml-2 text-slate-500">${post.stats.collect}</span></button>
          <button className="rounded-[1.25rem] bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-700">Comment <span className="ml-2 text-slate-500">${post.stats.comment}</span></button>
        </div>
      </${Card}>
    `;
  }

  function RightRail() {
    return html`
      <${Card}>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Critique Queue</p>
        <div className="mt-4 space-y-4">
          <div className="rounded-[1.5rem] bg-slate-100 p-4">
            <p className="font-semibold text-slate-900">2 feedback requests</p>
            <p className="mt-1 text-sm text-slate-500">A photographer wants pacing notes. A type designer needs legibility feedback.</p>
          </div>
          <div className="rounded-[1.5rem] bg-amber-50 p-4">
            <p className="font-semibold text-amber-950">Prompt of the day</p>
            <p className="mt-1 text-sm text-amber-900">Share one crop from your current project that still feels unresolved.</p>
          </div>
        </div>
      </${Card}>
    `;
  }

  return {
    html,
    navItems,
    posts,
    exploreTiles,
    risingCreators,
    palettes,
    notifications,
    threads,
    featuredWorks,
    projectGrid,
    AppShell,
    Card,
    ComposerCard,
    FeedToggle,
    PostCard,
    RightRail,
  };
})();
