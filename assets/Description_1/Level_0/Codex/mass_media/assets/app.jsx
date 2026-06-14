const { useState } = React;

const navItems = [
  { label: "Home", href: "index.html" },
  { label: "World", href: "world.html" },
  { label: "Article", href: "article.html" },
  { label: "Opinion", href: "opinion.html" },
  { label: "Subscribe", href: "subscribe.html" },
];

const mostRead = [
  "How Red Sea shipping risks are redrawing diplomatic strategy",
  "The slow politics of rebuilding industrial policy",
  "Inside the next phase of AI copyright disputes",
  "Why youth culture is reshaping election media",
  "The city that became a climate adaptation test case",
];

const stories = [
  {
    id: 1,
    section: "World",
    title: "UN emergency session called as Red Sea tensions widen into a broader shipping crisis",
    byline: "By Elena Morris",
    time: "12 min read",
    timestamp: "18 minutes ago",
    summary: "Diplomats described a fragile effort to contain regional escalation as insurers, cargo operators, and governments scrambled to assess the fallout.",
    image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: 2,
    section: "Politics",
    title: "Lawmakers reopen budget talks with transportation funding at the center of negotiations",
    byline: "By Daniel Price",
    time: "8 min read",
    timestamp: "42 minutes ago",
    summary: "A late-night framework revived stalled talks, but core disputes over rail, ports, and defense logistics remain unresolved.",
    image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    section: "Tech",
    title: "Startups are quietly abandoning all-purpose AI products in favor of narrower tools",
    byline: "By Rina Shah",
    time: "6 min read",
    timestamp: "1 hour ago",
    summary: "Investors are pushing founders toward less theatrical, more practical software tied to measurable business outcomes.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 4,
    section: "Culture",
    title: "Why the prestige TV boom gave way to a new age of personality-driven media",
    byline: "By Simone Hart",
    time: "7 min read",
    timestamp: "2 hours ago",
    summary: "Audiences are seeking intimacy and directness, even as platforms struggle to turn attention into durable subscriptions.",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 5,
    section: "World",
    title: "In Nairobi, climate finance talks turn toward local infrastructure instead of abstract pledges",
    byline: "By Samuel Oduro",
    time: "5 min read",
    timestamp: "3 hours ago",
    summary: "Officials and planners argued that credibility now depends on visible projects with measurable public benefit.",
    image: "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 6,
    section: "World",
    title: "Europe’s border debate is becoming a referendum on labor, not only migration",
    byline: "By Clara Weiss",
    time: "9 min read",
    timestamp: "5 hours ago",
    summary: "Business groups and labor unions have converged on a more pragmatic conversation about demographic pressure.",
    image: "https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 7,
    section: "World",
    title: "Latin American cities test coordinated heat plans ahead of another severe summer",
    byline: "By Mateo Álvarez",
    time: "4 min read",
    timestamp: "7 hours ago",
    summary: "Municipal governments are pairing public health alerts with new cooling and transit measures.",
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 8,
    section: "World",
    title: "African lenders gain influence as development finance priorities shift",
    byline: "By Amina Dlamini",
    time: "6 min read",
    timestamp: "9 hours ago",
    summary: "Regional institutions are playing a larger role in projects once dominated by Washington and Brussels.",
    image: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80",
  },
];

const opinionPieces = [
  {
    name: "Leah Everett",
    role: "Columnist",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    title: "The politics of competence has become more persuasive than the politics of charisma",
  },
  {
    name: "Marcus Hall",
    role: "Tech Critic",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    title: "AI policy still treats labor disruption as an abstract future problem",
  },
  {
    name: "Priya Desai",
    role: "Contributing Writer",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
    title: "Culture coverage needs fewer trend reports and more institutional memory",
  },
];

const articleBody = [
  "The United Nations Security Council is preparing an emergency session as maritime tensions in the Red Sea continue to unsettle a shipping corridor central to global trade. Diplomats described a mix of public alarm and private uncertainty, with multiple governments pressing for a narrower path to de-escalation before regional actors harden their positions.",
  "The immediate challenge is commercial as much as military. Carriers have rerouted vessels, insurance premiums have climbed, and exporters are recalculating delivery schedules with little confidence about how long disruption might last. Officials in Brussels and Washington said the diplomatic cost of delay now extends well beyond the region itself.",
  "Several representatives at the UN argued that the crisis exposes how dependent the global economy remains on a small number of vulnerable chokepoints. Others cautioned that every attempt to stabilize one part of the route risks widening the political perimeter of the dispute.",
  "For governments already facing inflation fatigue at home, the timing is especially difficult. Energy markets have not panicked, but traders and policy advisers are closely watching freight indicators that often move faster than official statements. One senior diplomat described the mood as 'tense, procedural, and more brittle than public messaging suggests.'",
  "The emergency session is unlikely to produce a comprehensive settlement. It may, however, create a framework for maritime coordination and a diplomatic sequence that lets regional powers step back without appearing to retreat. For now, shipping firms are operating on the assumption that risk will remain elevated through the next cycle of negotiations.",
];

function Logo() {
  return (
    <a href="index.html" className="flex items-end gap-3">
      <div className="text-3xl font-black leading-none text-red-700">M</div>
      <div>
        <div className="font-editorial text-3xl font-bold leading-none text-slate-950">The Meridian</div>
        <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">Independent Global Journalism</div>
      </div>
    </a>
  );
}

function Header({ currentPage }) {
  return (
    <header className="border-b border-slate-200 bg-[#f8f7f3]/95 backdrop-blur-xl">
      <div className="border-b border-red-200 bg-red-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="font-semibold text-red-800">BREAKING: UN Emergency Session Called Over Red Sea Tensions</div>
          <a href="article.html" className="font-semibold text-red-700 hover:underline">Read the latest</a>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <Logo />
        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const active = currentPage === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white hover:text-slate-950"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 py-3 text-sm text-slate-600 sm:px-6 lg:px-8">
          <span className="font-semibold text-slate-950">Sections</span>
          <a href="world.html" className="whitespace-nowrap hover:text-slate-950">World</a>
          <a href="world.html" className="whitespace-nowrap hover:text-slate-950">Politics</a>
          <a href="index.html" className="whitespace-nowrap hover:text-slate-950">Tech</a>
          <a href="index.html" className="whitespace-nowrap hover:text-slate-950">Culture</a>
          <a href="opinion.html" className="whitespace-nowrap hover:text-slate-950">Opinion</a>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr_0.9fr] lg:px-8">
        <div>
          <div className="font-editorial text-3xl font-bold text-slate-950">The Meridian</div>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
            Independent reporting and commentary on global affairs, politics, technology, and culture.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Navigate</div>
          <div className="mt-4 space-y-3 text-sm">
            <a href="world.html" className="block hover:text-slate-950">World coverage</a>
            <a href="opinion.html" className="block hover:text-slate-950">Opinion essays</a>
            <a href="subscribe.html" className="block hover:text-slate-950">Subscribe</a>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Newsletter</div>
          <div className="mt-4 rounded-[28px] border border-slate-200 bg-[#f8f7f3] p-5">
            <div className="font-editorial text-2xl font-semibold text-slate-950">Get the morning briefing</div>
            <div className="mt-2 text-sm leading-7 text-slate-600">Analysis, headlines, and must-read essays delivered each weekday.</div>
            <div className="mt-4 flex gap-2">
              <div className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">Email address</div>
              <button className="rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function PageShell({ currentPage, children }) {
  return (
    <div className="min-h-screen">
      <Header currentPage={currentPage} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function StoryCard({ story, compact = false }) {
  return (
    <article className="story-card rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`overflow-hidden rounded-[22px] bg-slate-100 ${compact ? "aspect-[4/3]" : "aspect-[16/10]"}`}>
        <img src={story.image} alt={story.title} className="h-full w-full object-cover" />
      </div>
      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">{story.section}</div>
        <h3 className="font-editorial mt-2 text-2xl font-semibold leading-tight text-slate-950">{story.title}</h3>
        <div className="mt-3 text-sm text-slate-500">{story.byline} · {story.timestamp}</div>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{story.summary}</p>
        <a href="article.html" className="mt-4 inline-flex text-sm font-semibold text-slate-950 hover:text-red-700">
          Read story
        </a>
      </div>
    </article>
  );
}

function HomePage() {
  return (
    <PageShell currentPage="index.html">
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <article className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-sm">
            <div className="aspect-[16/9] bg-slate-100">
              <img src={stories[0].image} alt={stories[0].title} className="h-full w-full object-cover" />
            </div>
            <div className="p-6 sm:p-8">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-red-700">{stories[0].section}</div>
              <h1 className="font-editorial mt-3 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
                {stories[0].title}
              </h1>
              <div className="mt-4 text-sm text-slate-500">{stories[0].byline} · {stories[0].timestamp} · {stories[0].time}</div>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">{stories[0].summary}</p>
              <a href="article.html" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                Read Full Story
              </a>
            </div>
          </article>

          <aside className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Most Read</div>
            <div className="mt-5 space-y-4">
              {mostRead.map((item, index) => (
                <a key={item} href="article.html" className="block rounded-[22px] bg-[#f8f7f3] px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">0{index + 1}</div>
                  <div className="font-editorial mt-2 text-xl font-semibold leading-tight text-slate-950">{item}</div>
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {stories.slice(1, 5).map((story) => (
            <StoryCard key={story.id} story={story} compact />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {["World", "Politics", "Tech", "Culture"].map((section, index) => (
            <div key={section} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-red-700">{section}</div>
              <div className="mt-4 space-y-4">
                {stories.filter((story) => story.section === section || (section === "Politics" && story.section === "Politics")).slice(0, 2).map((story) => (
                  <a key={`${section}-${story.id}`} href={section === "World" ? "world.html" : "article.html"} className="block">
                    <div className="font-editorial text-xl font-semibold leading-tight text-slate-950">{story.title}</div>
                    <div className="mt-2 text-sm text-slate-500">{story.byline}</div>
                  </a>
                ))}
                {index > 1 && (
                  <a href="article.html" className="block">
                    <div className="font-editorial text-xl font-semibold leading-tight text-slate-950">Editors are rethinking how institutions explain change to the public</div>
                    <div className="mt-2 text-sm text-slate-500">By The Meridian Staff</div>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function WorldPage() {
  const [filter, setFilter] = useState("All");

  return (
    <PageShell currentPage="world.html">
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-red-700">World</div>
          <h1 className="font-editorial mt-2 text-5xl font-semibold text-slate-950">Global reporting and analysis</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Coverage of diplomacy, conflict, climate, migration, and the economic forces shaping the international order.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {["All", "Asia", "Europe", "Americas", "Middle East", "Africa"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${filter === item ? "tab-active" : "border-slate-200 bg-white text-slate-600"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <StoryCard story={stories[5]} />
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {stories.filter((story) => story.section === "World").map((story) => (
            <StoryCard key={story.id} story={story} compact />
          ))}
          {[
            ["Asia", "Election-year trade disputes are reshaping manufacturing alliances", "By Wen Liu", "11 hours ago"],
            ["Middle East", "Aid agencies warn that logistics bottlenecks are compounding displacement risks", "By Farah Nasser", "12 hours ago"],
            ["Africa", "Regional power grids are attracting a new class of infrastructure investors", "By Josephine Adeyemi", "13 hours ago"],
          ].map(([section, title, byline, timestamp]) => (
            <article key={title} className="story-card rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">{section}</div>
              <h3 className="font-editorial mt-3 text-2xl font-semibold leading-tight text-slate-950">{title}</h3>
              <div className="mt-3 text-sm text-slate-500">{byline} · {timestamp}</div>
              <a href="article.html" className="mt-4 inline-flex text-sm font-semibold text-slate-950">Read story</a>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function ArticlePage() {
  return (
    <PageShell currentPage="article.html">
      <article className="mx-auto mt-8 max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-red-700">World</div>
        <h1 className="font-editorial mt-3 text-5xl font-semibold leading-tight text-slate-950">
          UN emergency session called as Red Sea tensions widen into a broader shipping crisis
        </h1>
        <p className="mt-4 text-xl leading-8 text-slate-600">
          Diplomats are scrambling to prevent the maritime confrontation from hardening into a more durable geopolitical rupture.
        </p>
        <div className="mt-5 text-sm text-slate-500">By Elena Morris · November 14, 2025 · 12 min read</div>

        <div className="mt-8 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <img src={stories[0].image} alt={stories[0].title} className="h-full w-full object-cover" />
          <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
            Commercial traffic near the Bab el-Mandeb strait has slowed as insurers reassess regional risk exposure.
          </div>
        </div>

        <div className="prose-article mt-8 text-base">
          {articleBody.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          <blockquote className="font-editorial my-8 border-l-4 border-red-700 pl-5 text-3xl font-semibold leading-tight text-slate-950">
            “The market response is not panic yet, but it is already a form of diplomacy by other means.”
          </blockquote>
          <p>
            Analysts say the commercial response will be one of the clearest indicators of whether diplomatic outreach is working. If freight diversions continue to mount, the economic pressure on negotiators will rise accordingly.
          </p>
        </div>

        <div className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Related reporting</div>
          <div className="mt-4 space-y-3">
            <a href="world.html" className="block font-editorial text-2xl font-semibold text-slate-950">
              Europe’s border debate is becoming a referendum on labor, not only migration
            </a>
            <a href="world.html" className="block font-editorial text-2xl font-semibold text-slate-950">
              African lenders gain influence as development finance priorities shift
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {["Red Sea", "United Nations", "Global Trade", "Diplomacy"].map((tag) => (
            <span key={tag} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-10 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="font-editorial text-3xl font-semibold text-slate-950">Comments</div>
          <div className="mt-5 space-y-4">
            {[
              ["L. Warren", "A clear explanation of the supply-chain implications, not just the diplomatic theater."],
              ["J. Patel", "Would like to see more reporting on insurance and freight pricing next."],
            ].map(([name, comment]) => (
              <div key={name} className="rounded-[22px] bg-[#f8f7f3] px-4 py-4">
                <div className="font-semibold text-slate-950">{name}</div>
                <div className="mt-2 text-sm leading-7 text-slate-600">{comment}</div>
              </div>
            ))}
          </div>
        </div>
      </article>

      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">More from World</div>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {stories.filter((story) => story.section === "World").slice(1, 4).map((story) => (
            <StoryCard key={story.id} story={story} compact />
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function OpinionPage() {
  return (
    <PageShell currentPage="opinion.html">
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-red-700">Opinion</div>
            <h1 className="font-editorial mt-3 text-5xl font-semibold leading-tight text-slate-950">
              The politics of competence has become more persuasive than the politics of charisma
            </h1>
            <div className="mt-5 flex items-center gap-4">
              <img src={opinionPieces[0].avatar} alt={opinionPieces[0].name} className="h-16 w-16 rounded-2xl object-cover" />
              <div>
                <div className="font-editorial text-2xl font-semibold text-slate-950">{opinionPieces[0].name}</div>
                <div className="text-sm text-slate-500">{opinionPieces[0].role}</div>
              </div>
            </div>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700">
              Voters appear less enchanted by spectacle than by evidence that institutions can still deliver ordinary competence under stress.
            </p>
            <a href="article.html" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
              Read Essay
            </a>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Columnists</div>
            <div className="mt-5 space-y-4">
              {opinionPieces.map((piece) => (
                <div key={piece.name} className="flex gap-4 rounded-[24px] bg-[#f8f7f3] p-4">
                  <img src={piece.avatar} alt={piece.name} className="h-14 w-14 rounded-2xl object-cover" />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-950">{piece.name}</div>
                    <div className="text-sm text-slate-500">{piece.role}</div>
                    <div className="font-editorial mt-2 text-xl font-semibold leading-tight text-slate-950">{piece.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {opinionPieces.concat(opinionPieces).map((piece, index) => (
            <article key={`${piece.name}-${index}`} className="surface-card rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <img src={piece.avatar} alt={piece.name} className="h-12 w-12 rounded-2xl object-cover" />
                <div>
                  <div className="font-semibold text-slate-950">{piece.name}</div>
                  <div className="text-sm text-slate-500">{piece.role}</div>
                </div>
              </div>
              <div className="font-editorial mt-4 text-2xl font-semibold leading-tight text-slate-950">{piece.title}</div>
              <a href="article.html" className="mt-4 inline-flex text-sm font-semibold text-slate-950">Read opinion</a>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="font-editorial text-3xl font-semibold text-slate-950">Letters to the Editor</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              "Readers respond to our coverage of migration policy, arguing for more attention to local labor systems.",
              "A subscriber from Toronto writes that media institutions underestimate the appetite for long-form analysis.",
            ].map((letter) => (
              <div key={letter} className="rounded-[22px] bg-[#f8f7f3] px-4 py-4 text-sm leading-7 text-slate-600">
                {letter}
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function SubscribePage() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <PageShell currentPage="subscribe.html">
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-red-700">Subscription</div>
          <h1 className="font-editorial mt-3 text-5xl font-semibold leading-tight text-slate-950">Support independent reporting</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">
            Choose a plan that fits how you read, and help sustain deeply reported journalism across world affairs, politics, technology, and culture.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            ["Free", "$0", "A curated selection of articles and newsletters."],
            ["Digital", "$9.99/mo", "Unlimited articles, newsletters, and comment access."],
            ["All-Access", "$19.99/mo", "Everything in Digital plus events, archive access, and print edition."],
          ].map(([name, price, copy], index) => (
            <article key={name} className={`rounded-[32px] border p-6 shadow-sm ${index === 1 ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{name}</div>
              <div className="font-editorial mt-3 text-4xl font-semibold text-slate-950">{price}</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                {[
                  "Morning briefing newsletter",
                  index > 0 ? "Unlimited reading" : "Metered article access",
                  index === 2 ? "Archive and member events" : "Mobile and desktop reading",
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-white/80 px-4 py-3 font-semibold text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
              <button className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Choose Plan</button>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Comparison</div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-4 pr-6 font-semibold">Feature</th>
                  <th className="pb-4 pr-6 font-semibold">Free</th>
                  <th className="pb-4 pr-6 font-semibold">Digital</th>
                  <th className="pb-4 font-semibold">All-Access</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {[
                  ["Unlimited articles", "No", "Yes", "Yes"],
                  ["Newsletter access", "Some", "Full", "Full"],
                  ["Comments", "No", "Yes", "Yes"],
                  ["Archive access", "No", "No", "Yes"],
                  ["Events and print edition", "No", "No", "Yes"],
                ].map((row) => (
                  <tr key={row[0]} className="border-t border-slate-100">
                    <td className="py-4 pr-6 font-semibold text-slate-950">{row[0]}</td>
                    <td className="py-4 pr-6">{row[1]}</td>
                    <td className="py-4 pr-6">{row[2]}</td>
                    <td className="py-4">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="font-editorial text-3xl font-semibold text-slate-950">What subscribers say</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                "The Meridian feels edited with intention. It respects the reader’s time without flattening complexity.",
                "I subscribed for the world coverage and stayed for the essays. The writing feels sharp without being theatrical.",
              ].map((quote) => (
                <div key={quote} className="rounded-[22px] bg-[#f8f7f3] px-4 py-4 text-sm leading-7 text-slate-600">
                  {quote}
                </div>
              ))}
            </div>

            <div className="mt-8">
              <div className="font-editorial text-3xl font-semibold text-slate-950">FAQ</div>
              <div className="mt-4 space-y-3">
                {[
                  ["Can I cancel at any time?", "Yes. Subscriptions can be canceled from your account settings at any time."],
                  ["Does Digital include newsletters?", "Yes. Digital includes full newsletter access, including the morning briefing and weekend essays."],
                  ["What is included in All-Access?", "All-Access includes archive access, events, and the print edition in addition to Digital benefits."],
                ].map(([question, answer], index) => {
                  const open = openFaq === index;
                  return (
                    <div key={question} className="rounded-[22px] border border-slate-200">
                      <button onClick={() => setOpenFaq(open ? -1 : index)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                        <span className="font-semibold text-slate-950">{question}</span>
                        <span className="text-sm font-semibold text-red-700">{open ? "Hide" : "Open"}</span>
                      </button>
                      {open && <div className="border-t border-slate-200 px-5 py-4 text-sm leading-7 text-slate-600">{answer}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="font-editorial text-3xl font-semibold text-slate-950">Create your account</div>
            <div className="mt-5 space-y-4">
              <input type="text" placeholder="Full name" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <input type="email" placeholder="Email address" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <input type="password" placeholder="Password" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Start Subscription</button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function AppRouter() {
  const page = document.body.dataset.page;

  if (page === "home") return <HomePage />;
  if (page === "world") return <WorldPage />;
  if (page === "article") return <ArticlePage />;
  if (page === "opinion") return <OpinionPage />;
  if (page === "subscribe") return <SubscribePage />;
  return <HomePage />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppRouter />);
