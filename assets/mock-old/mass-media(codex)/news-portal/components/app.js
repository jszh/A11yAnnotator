const PAGE_KEYS = {
  home: "homepage",
  world: "world",
  politics: "politics",
  business: "business",
  tech: "tech",
  culture: "culture",
  opinion: "opinion",
  video: "video",
  article: "article",
  account: "account",
  subscribe: "subscribe"
};

const stories = [
  {
    id: 1,
    title: "Summit talks extend into second night as delegates seek climate financing deal",
    category: "World",
    summary: "Negotiators from 38 countries have narrowed the remaining points to adaptation funding and timeline enforcement.",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    author: "Ava Harper",
    publishTime: "2h ago",
    readLength: "6 min read",
    tags: ["climate", "summit"],
    engagementMetrics: { views: "18.2K", comments: 214 }
  },
  {
    id: 2,
    title: "Senate budget draft raises pressure on infrastructure timeline",
    category: "Politics",
    summary: "Committee leaders propose a shorter negotiation window and mandatory public progress reports.",
    mediaType: "video",
    mediaUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80",
    author: "Marco Reyes",
    publishTime: "48m ago",
    readLength: "5 min read",
    tags: ["senate", "budget"],
    engagementMetrics: { views: "9.7K", comments: 89 }
  },
  {
    id: 3,
    title: "Chip startup secures manufacturing partner after export rule changes",
    category: "Business",
    summary: "The multi-year agreement includes regional assembly and workforce expansion in three states.",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    author: "Priya Menon",
    publishTime: "3h ago",
    readLength: "4 min read",
    tags: ["semiconductors", "markets"],
    engagementMetrics: { views: "14.9K", comments: 63 }
  },
  {
    id: 4,
    title: "Inside the race to ship practical AI copilots for frontline workers",
    category: "Tech",
    summary: "Vendors are shifting from flashy demos to low-latency workflows in logistics and retail.",
    mediaType: "gallery",
    mediaUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    author: "Noah Lin",
    publishTime: "1h ago",
    readLength: "7 min read",
    tags: ["ai", "enterprise"],
    engagementMetrics: { views: "22.1K", comments: 305 }
  },
  {
    id: 5,
    title: "Streaming studios pivot to mini-series as ad markets stabilize",
    category: "Culture",
    summary: "Executives cite lower completion fatigue and stronger sponsor alignment in pilot data.",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    author: "Lena Stone",
    publishTime: "5h ago",
    readLength: "5 min read",
    tags: ["entertainment", "streaming"],
    engagementMetrics: { views: "11.4K", comments: 45 }
  },
  {
    id: 6,
    title: "Opinion: Why local reporting is still the strongest trust signal",
    category: "Opinion",
    summary: "Audience research shows neighborhood-level accountability reporting drives repeat readership.",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1200&q=80",
    author: "Riley Quinn",
    publishTime: "6h ago",
    readLength: "8 min read",
    tags: ["media", "editorial"],
    engagementMetrics: { views: "7.1K", comments: 112 }
  }
];

const tickerItems = [
  "LIVE: Coastal storm response briefings underway",
  "BREAKING: Central bank signals rate hold",
  "TRENDING: Space launch webcast draws record audience",
  "EVENT: Election town hall starts at 8:00 PM ET"
];

function makeLinks(base) {
  return [
    { label: "News", href: `${base}/index.html` },
    { label: "World", href: `${base}/world/world.html` },
    { label: "Politics", href: `${base}/politics/politics.html` },
    { label: "Business", href: `${base}/business/business.html` },
    { label: "Tech", href: `${base}/tech/tech.html` },
    { label: "Culture", href: `${base}/culture/culture.html` },
    { label: "Entertainment", href: `${base}/culture/culture.html` },
    { label: "Science", href: `${base}/tech/tech.html` },
    { label: "Opinion", href: `${base}/opinion/opinion.html` },
    { label: "Video", href: `${base}/video/video.html` },
    { label: "Audio", href: `${base}/video/video.html` }
  ];
}

function pageConfig(page) {
  const configs = {
    homepage: {
      title: "Top Stories",
      heroVariant: "A",
      lead: stories[0],
      intro: "Global developments, accountability reporting, and digital-first storytelling in one unified front page."
    },
    world: {
      title: "World Coverage",
      heroVariant: "B",
      lead: stories[0],
      intro: "Regional briefings, conflict analysis, diplomacy, and global climate coverage from correspondents."
    },
    politics: {
      title: "Politics Desk",
      heroVariant: "B",
      lead: stories[1],
      intro: "Campaign strategy, policy deep dives, and daily governance updates from Washington and state capitals."
    },
    business: {
      title: "Business & Markets",
      heroVariant: "A",
      lead: stories[2],
      intro: "Markets, labor, energy, and boardroom decisions shaping the economy."
    },
    tech: {
      title: "Technology",
      heroVariant: "C",
      lead: stories[3],
      intro: "AI, hardware, startups, and internet culture through product, policy, and impact reporting."
    },
    culture: {
      title: "Culture",
      heroVariant: "C",
      lead: stories[4],
      intro: "Entertainment, lifestyle, and media trends with an editorial and creator-focused lens."
    },
    opinion: {
      title: "Opinion",
      heroVariant: "B",
      lead: stories[5],
      intro: "Columns, analysis, and debate across policy, society, and media accountability."
    },
    video: {
      title: "Video",
      heroVariant: "A",
      lead: stories[1],
      intro: "Watch live coverage, documentary shorts, and explainer segments with caption-ready modules."
    },
    article: {
      title: "Article Detail",
      heroVariant: "B",
      lead: stories[3],
      intro: "Single story view with metadata, related reporting, and contextual side modules."
    },
    account: {
      title: "Account",
      heroVariant: "C",
      lead: stories[5],
      intro: "Manage profile, saved stories, alerts, and newsletter preferences."
    },
    subscribe: {
      title: "Subscribe",
      heroVariant: "A",
      lead: stories[0],
      intro: "Digital plans, trial access, and member benefits for newsroom support."
    }
  };
  return configs[page] || configs.homepage;
}

function GlobalUtilityBar({ base }) {
  return (
    <div className="bg-slate-900 text-slate-100 text-sm" role="region" aria-label="Global utility bar">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1" htmlFor="edition">Edition
            <select id="edition" className="bg-slate-800 border border-slate-600 px-2 py-1" aria-label="Select edition">
              <option>US</option>
              <option>Global</option>
              <option>Europe</option>
            </select>
          </label>
          <label className="flex items-center gap-1" htmlFor="language">Language
            <select id="language" className="bg-slate-800 border border-slate-600 px-2 py-1" aria-label="Select language">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </label>
        </div>
        <div className="utility-marquee flex-1 min-w-[200px] text-slate-200" aria-live="polite">
          DOW +0.42% | NASDAQ +0.68% | BTC +1.2% | Breaking: Emergency budget session continues
        </div>
        <div className="flex items-center gap-2">
          <a href={`${base}/subscribe/subscribe.html`} className="px-2 py-1 bg-amber-400 text-slate-900 font-semibold">Subscribe</a>
          <a href={`${base}/account/account.html`} className="px-2 py-1 border border-slate-400">Account</a>
        </div>
      </div>
    </div>
  );
}

function BrandHeader({ base }) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-300" role="banner">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <button className="px-3 py-2 border border-slate-300" aria-label="Open menu">☰</button>
        <a href={`${base}/index.html`} className="brand-mark text-2xl font-bold tracking-tight">Mass Media Ledger</a>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 border border-slate-300" aria-label="Search stories">Search</button>
          <a href={`${base}/subscribe/subscribe.html`} className="px-3 py-2 bg-rose-700 text-white font-semibold">Subscribe</a>
          <a href={`${base}/account/account.html`} className="px-3 py-2 border border-slate-300">Sign in</a>
        </div>
      </div>
    </header>
  );
}

function CategoryNav({ links }) {
  return (
    <nav className="bg-white border-b border-slate-300" aria-label="Primary categories">
      <div className="max-w-7xl mx-auto px-4 py-2 overflow-x-auto">
        <ul className="flex items-center gap-2 min-w-max">
          {links.map((item) => (
            <li key={item.label}>
              <a className="px-3 py-2 text-sm font-semibold hover:bg-slate-100" href={item.href}>{item.label}</a>
            </li>
          ))}
          <li>
            <details className="mega-summary px-3 py-2 text-sm">
              <summary className="cursor-pointer font-semibold">Sections</summary>
              <div className="mt-2 text-slate-600 max-w-sm">Hover/tap reveal ready mega-menu area for featured picks and previews.</div>
            </details>
          </li>
        </ul>
      </div>
    </nav>
  );
}

function LiveTicker() {
  return (
    <section className="bg-slate-950 text-slate-100" aria-label="Live and breaking updates">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <span className="px-2 py-1 bg-red-600 text-xs font-bold">LIVE</span>
        <div className="ticker-track" role="list">
          {tickerItems.map((item) => (
            <a key={item} href="#" className="text-sm whitespace-nowrap" role="listitem">{item}</a>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroEditorial({ variant, lead, title, intro, base }) {
  if (variant === "B") {
    return (
      <section className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-3 gap-4" aria-label="Editorial split hero">
        <article className="bg-white p-4 border border-slate-300 module-shadow">
          <span className="text-xs font-bold text-rose-700">{lead.category}</span>
          <h1 className="text-3xl mt-2">{title}</h1>
          <p className="mt-3 text-slate-700">{intro}</p>
          <a href={`${base}/article/article.html`} className="inline-block mt-3 font-semibold underline">Read lead analysis</a>
        </article>
        <article className="lg:col-span-1 relative overflow-hidden rounded bg-slate-900 text-white">
          <img className="story-image opacity-80" src={lead.mediaUrl} alt="Lead visual" />
          <div className="absolute inset-0 hero-gradient p-4 flex flex-col justify-end">
            <h2 className="text-xl">{lead.title}</h2>
            <p className="text-sm mt-1">{lead.publishTime} • {lead.readLength}</p>
          </div>
        </article>
        <aside className="bg-white p-4 border border-slate-300">
          <h2 className="font-bold">Supporting stories</h2>
          <ul className="mt-2 space-y-3">
            {stories.slice(1, 4).map((s) => (
              <li key={s.id}>
                <a href={`${base}/article/article.html`} className="text-sm font-semibold hover:underline">{s.title}</a>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    );
  }

  if (variant === "C") {
    return (
      <section className="max-w-7xl mx-auto px-4 py-6" aria-label="Visual card hero">
        <h1 className="text-3xl mb-2">{title}</h1>
        <p className="text-slate-700 mb-4">{intro}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stories.slice(0, 4).map((s) => (
            <article key={s.id} className="relative rounded overflow-hidden card-lift">
              <img src={s.mediaUrl} className="story-image" alt={s.title} />
              <a href={`${base}/article/article.html`} className="absolute inset-0 hero-gradient text-white p-3 flex flex-col justify-end">
                <span className="text-xs uppercase tracking-wide">{s.category}</span>
                <h2 className="font-semibold leading-tight">{s.title}</h2>
                <span className="text-xs mt-1">{s.engagementMetrics.views} views</span>
              </a>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-6" aria-label="Large media hero">
      <article className="relative rounded overflow-hidden bg-black text-white">
        <img src={lead.mediaUrl} alt={lead.title} className="story-image opacity-80" />
        <div className="absolute inset-0 hero-gradient p-5 flex flex-col justify-end">
          <span className="w-fit px-2 py-1 text-xs font-bold bg-red-600">LIVE COVERAGE</span>
          <h1 className="text-3xl mt-2 max-w-3xl">{lead.title}</h1>
          <p className="max-w-2xl mt-2 text-slate-200">{intro}</p>
          <div className="flex items-center gap-2 mt-3">
            <a href={`${base}/video/video.html`} className="px-3 py-2 bg-white text-slate-900 font-semibold">Play segment</a>
            <a href={`${base}/article/article.html`} className="px-3 py-2 border border-slate-200">Open article</a>
          </div>
        </div>
      </article>
    </section>
  );
}

function StoryCard({ story, base }) {
  return (
    <article className="bg-white border border-slate-300 rounded overflow-hidden module-shadow card-lift">
      <img className="story-image" src={story.mediaUrl} alt={story.title} />
      <div className="p-3">
        <span className="text-xs uppercase text-rose-700 font-bold">{story.category}</span>
        <h3 className="mt-1 text-lg leading-snug"><a href={`${base}/article/article.html`} className="hover:underline">{story.title}</a></h3>
        <p className="mt-1 text-sm text-slate-700">{story.summary}</p>
        <p className="mt-2 text-xs text-slate-500">{story.author} • {story.publishTime} • {story.readLength}</p>
      </div>
    </article>
  );
}

function StoryGrid({ items, base }) {
  return (
    <section aria-label="Secondary story grid">
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((story) => <StoryCard key={story.id} story={story} base={base} />)}
      </div>
    </section>
  );
}

function SidebarModule({ title, children }) {
  return (
    <section className="bg-white border border-slate-300 p-3 module-shadow" aria-label={title}>
      <h3 className="font-bold text-sm tracking-wide uppercase">{title}</h3>
      <div className="mt-2 text-sm text-slate-700">{children}</div>
    </section>
  );
}

function EditorialSection({ title, items, base }) {
  return (
    <section className="mt-6" aria-label={title}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl">{title}</h2>
        <a href={`${base}/article/article.html`} className="text-sm font-semibold underline">View all</a>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {items.map((story) => (
          <article key={`${title}-${story.id}`} className="bg-white border border-slate-300 p-3 card-lift">
            <span className="text-xs font-bold text-rose-700">{story.category}</span>
            <h3 className="mt-1 font-semibold leading-snug"><a href={`${base}/article/article.html`} className="hover:underline">{story.title}</a></h3>
            <p className="text-xs mt-2 text-slate-500">{story.publishTime} • {story.readLength}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FeatureBanner({ base }) {
  return (
    <section className="mt-6 rounded overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-teal-800 text-white p-6" aria-label="Visual feature banner">
      <p className="text-xs uppercase tracking-[0.2em]">Special Feature</p>
      <h2 className="text-3xl mt-2">The New Attention Economy</h2>
      <p className="mt-2 max-w-2xl">A magazine-style longform package on how short-form video is reshaping politics, publishing, and culture.</p>
      <a className="inline-block mt-3 px-4 py-2 bg-emerald-400 text-slate-900 font-semibold" href={`${base}/article/article.html`}>Read the package</a>
    </section>
  );
}

function SubscriptionModule({ base }) {
  return (
    <section className="mt-6 bg-amber-50 border border-amber-300 p-5" aria-label="Subscription module">
      <h2 className="text-2xl">Support independent journalism</h2>
      <p className="mt-2 text-slate-700">Get unlimited articles, member newsletters, and ad-light reading with caption-first video explainers.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={`${base}/subscribe/subscribe.html`} className="px-4 py-2 bg-rose-700 text-white font-semibold">Start trial</a>
        <a href={`${base}/account/account.html`} className="px-4 py-2 border border-slate-400">Manage account</a>
      </div>
    </section>
  );
}

function Footer({ base }) {
  return (
    <footer className="mt-10 bg-slate-950 text-slate-200" aria-label="Footer">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="footer-grid">
          <section>
            <h2 className="font-bold">Mass Media Ledger</h2>
            <p className="text-sm mt-2">Fast reporting with deep context across world, politics, business, tech, and culture.</p>
          </section>
          <section>
            <h2 className="font-bold">Navigate</h2>
            <ul className="text-sm mt-2 space-y-1">
              <li><a href={`${base}/index.html`}>Home</a></li>
              <li><a href={`${base}/article/article.html`}>Article</a></li>
              <li><a href={`${base}/video/video.html`}>Video</a></li>
            </ul>
          </section>
          <section>
            <h2 className="font-bold">Membership</h2>
            <ul className="text-sm mt-2 space-y-1">
              <li><a href={`${base}/subscribe/subscribe.html`}>Subscribe</a></li>
              <li><a href={`${base}/account/account.html`}>Account</a></li>
            </ul>
          </section>
          <section>
            <h2 className="font-bold">Legal</h2>
            <ul className="text-sm mt-2 space-y-1">
              <li><a href="#">Terms</a></li>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Accessibility</a></li>
            </ul>
          </section>
        </div>
        <p className="text-xs text-slate-400 mt-6">© 2026 Mass Media Ledger. Mock editorial website for layout demonstration.</p>
      </div>
    </footer>
  );
}

function NumberedList({ base }) {
  return (
    <section className="mt-6 bg-white border border-slate-300 p-4" aria-label="Numbered story list">
      <h2 className="text-2xl">Trending Now</h2>
      <ol className="mt-3 space-y-2">
        {stories.slice(0, 5).map((s, idx) => (
          <li key={s.id} className="flex gap-3">
            <span className="text-2xl font-bold text-slate-400">{idx + 1}</span>
            <a href={`${base}/article/article.html`} className="font-semibold hover:underline">{s.title}</a>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ArticleBody({ base }) {
  return (
    <article className="bg-white border border-slate-300 p-5" aria-label="Article content">
      <h1 className="text-4xl">Inside the race to ship practical AI copilots for frontline workers</h1>
      <p className="mt-2 text-sm text-slate-500">By Noah Lin • Updated today • 7 min read</p>
      <img src={stories[3].mediaUrl} className="story-image mt-4" alt="People working with technology" />
      <p className="mt-4 leading-7 text-slate-800">Enterprise AI moved from prototype theater to measurable workflow gains. Retail and logistics teams now prioritize speed-to-answer, multilingual support, and tool reliability over novelty features. Product leaders say success depends on clear escalation paths, high-quality data grounding, and transparent model behavior in customer-facing environments.</p>
      <p className="mt-3 leading-7 text-slate-800">Across deployments, two metrics dominate: resolution time and handoff quality. Teams that pair copilots with editor-reviewed knowledge bases report lower error rates and stronger agent confidence. Analysts expect the next cycle to focus on cost controls and stronger compliance observability.</p>
      <div className="mt-4 p-3 bg-slate-100 border border-slate-300" role="note">Inline ad zone: Sponsored by Atlas Cloud - scalable inference for newsroom workflows.</div>
      <a href={`${base}/index.html`} className="inline-block mt-4 font-semibold underline">Back to homepage</a>
    </article>
  );
}

function AccountPanel() {
  return (
    <section className="bg-white border border-slate-300 p-5" aria-label="Account management">
      <h1 className="text-3xl">Your Account</h1>
      <form className="mt-4 grid md:grid-cols-2 gap-4">
        <label className="block">Name
          <input className="w-full mt-1 border border-slate-400 px-3 py-2" type="text" placeholder="Reader name" />
        </label>
        <label className="block">Email
          <input className="w-full mt-1 border border-slate-400 px-3 py-2" type="email" placeholder="reader@example.com" />
        </label>
        <label className="block">Newsletter preference
          <select className="w-full mt-1 border border-slate-400 px-3 py-2">
            <option>Daily Briefing</option>
            <option>Politics AM</option>
            <option>Tech Weekly</option>
          </select>
        </label>
        <label className="block">Alerts
          <select className="w-full mt-1 border border-slate-400 px-3 py-2">
            <option>Breaking only</option>
            <option>Breaking + Top stories</option>
            <option>All alerts</option>
          </select>
        </label>
        <button className="px-4 py-2 bg-slate-900 text-white w-fit" type="submit">Save settings</button>
      </form>
    </section>
  );
}

function SubscribePanel() {
  return (
    <section className="bg-white border border-slate-300 p-5" aria-label="Subscription plans">
      <h1 className="text-3xl">Choose your plan</h1>
      <div className="mt-4 grid md:grid-cols-3 gap-4">
        {[
          ["Basic", "$1/week", "Unlimited articles"],
          ["Plus", "$3/week", "Articles + newsletters"],
          ["All Access", "$5/week", "All access + events"]
        ].map((plan) => (
          <article key={plan[0]} className="border border-slate-400 p-4">
            <h2 className="text-xl">{plan[0]}</h2>
            <p className="text-2xl mt-1 font-bold">{plan[1]}</p>
            <p className="mt-2 text-sm text-slate-700">{plan[2]}</p>
            <button className="mt-3 px-4 py-2 bg-rose-700 text-white">Select plan</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function VideoModule() {
  return (
    <section className="bg-white border border-slate-300 p-4" aria-label="Video module">
      <h2 className="text-2xl">Watch</h2>
      <div className="mt-3 bg-slate-900 text-white p-4 rounded">
        <p className="font-semibold">Live newsroom briefing</p>
        <p className="text-sm mt-1">Captions available • Runtime 12:40</p>
        <button className="mt-3 px-3 py-2 bg-white text-slate-900 font-semibold">Play video</button>
      </div>
    </section>
  );
}

function MainPage({ page, base }) {
  const config = pageConfig(page);

  return (
    <>
      <GlobalUtilityBar base={base} />
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <BrandHeader base={base} />
      <CategoryNav links={makeLinks(base)} />
      <LiveTicker />
      <HeroEditorial variant={config.heroVariant} lead={config.lead} title={config.title} intro={config.intro} base={base} />
      <main id="main-content" className="max-w-7xl mx-auto px-4 py-4 grid lg:grid-cols-[1fr_320px] gap-4">
        <section>
          {page === "article" ? <ArticleBody base={base} /> : null}
          {page === "account" ? <AccountPanel /> : null}
          {page === "subscribe" ? <SubscribePanel /> : null}
          {page === "video" ? <VideoModule /> : null}
          {page !== "article" && page !== "account" && page !== "subscribe" && page !== "video" ? (
            <StoryGrid items={stories} base={base} />
          ) : null}

          <EditorialSection title="Editors Picks" items={stories.slice(0, 4)} base={base} />
          <EditorialSection title="Topic Collections" items={stories.slice(2, 6)} base={base} />
          <FeatureBanner base={base} />
          <NumberedList base={base} />
          <SubscriptionModule base={base} />
        </section>

        <aside className="space-y-4 lg:sticky lg:top-28 h-fit" aria-label="Sidebar modules">
          <SidebarModule title="Live Commentary">
            <ul className="space-y-2">
              <li><a href={`${base}/article/article.html`} className="hover:underline">13:02 ET - Committee enters closed-door budget debate</a></li>
              <li><a href={`${base}/article/article.html`} className="hover:underline">12:38 ET - Markets react to rate guidance update</a></li>
              <li><a href={`${base}/article/article.html`} className="hover:underline">12:10 ET - Correspondents report transport disruptions</a></li>
            </ul>
          </SidebarModule>
          <SidebarModule title="Trending Stories">
            <ol className="space-y-1 list-decimal list-inside">
              <li><a href={`${base}/article/article.html`} className="hover:underline">Election map shifts in three battleground states</a></li>
              <li><a href={`${base}/article/article.html`} className="hover:underline">What new chip subsidies mean for US jobs</a></li>
              <li><a href={`${base}/article/article.html`} className="hover:underline">Creator economy platform updates monetization split</a></li>
            </ol>
          </SidebarModule>
          <SidebarModule title="Watch Now">
            <a href={`${base}/video/video.html`} className="inline-block px-3 py-2 bg-slate-900 text-white">Open video hub</a>
            <p className="mt-2">Caption-ready clips and live segments from the newsroom desk.</p>
          </SidebarModule>
          <SidebarModule title="Sponsored">
            <p>Native partner spotlight: secure enterprise messaging for distributed editorial teams.</p>
          </SidebarModule>
        </aside>
      </main>
      <Footer base={base} />
    </>
  );
}

const pageKey = document.body.dataset.page || "homepage";
const base = document.body.dataset.base || ".";
ReactDOM.createRoot(document.getElementById("app")).render(<MainPage page={pageKey} base={base} />);
