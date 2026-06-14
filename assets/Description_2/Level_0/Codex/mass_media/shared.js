window.Groundwork = (() => {
  const html = window.htm.bind(window.React.createElement);
  const { useMemo, useState } = window.React;

  const navItems = [
    { label: "Home", href: "./index.html" },
    { label: "Climate", href: "./climate.html" },
    { label: "Investigation", href: "./article.html" },
    { label: "Perspectives", href: "./perspectives.html" },
    { label: "Support", href: "./support.html" },
  ];

  const topicNav = ["Climate", "Energy", "Policy", "Science", "Data"];

  const latestInvestigations = [
    {
      title: "Who Owns the Water Beneath Lithium Country?",
      category: "Energy",
      blurb: "Corporate drilling records reveal an expanding competition over aquifers already under stress.",
      meta: "8 min read",
      mood: "alt-a",
      href: "./article.html",
    },
    {
      title: "The Insurance Retreat Has Already Begun on the Gulf",
      category: "Policy",
      blurb: "Actuarial filings show how climate risk is rewriting entire housing markets.",
      meta: "11 min read",
      mood: "alt-b",
      href: "./article.html",
    },
    {
      title: "A Satellite Map of the Nation's Disappearing Wetlands",
      category: "Data",
      blurb: "Groundwork paired federal imagery with local reporting to chart losses county by county.",
      meta: "Interactive",
      mood: "alt-c",
      href: "./climate.html",
    },
  ];

  const climateStories = [
    {
      title: "Sea Walls, Private Capital, and the Unequal Coast",
      tag: "Sea Level",
      reporter: "Ari Mendoza",
      readTime: "12 min read",
      summary: "Cities are racing to fund shoreline defenses, but protective infrastructure is tilting toward wealthy districts.",
    },
    {
      title: "Inside the Federal Wildfire Modeling Gap",
      tag: "Wildfire",
      reporter: "Leah Kim",
      readTime: "9 min read",
      summary: "State planners still rely on outdated assumptions that miss compound heat and smoke exposure.",
    },
    {
      title: "The Offset Market's Methane Math Problem",
      tag: "Carbon Markets",
      reporter: "Noah Price",
      readTime: "10 min read",
      summary: "Project audits show repeated over-crediting in landfill gas programs sold as climate solutions.",
    },
  ];

  const documents = [
    { title: "Interior Basin Subsidence Memo", type: "PDF · 2.4 MB" },
    { title: "USGS Well Failure Dataset", type: "CSV · 490 KB" },
    { title: "County Pumping Permit Audit", type: "PDF · 1.1 MB" },
  ];

  const articleCharts = [
    { label: "Aquifer decline since 2003", value: "-22 ft", note: "Median drop across surveyed wells" },
    { label: "Irrigated acres at severe risk", value: "4.8M", note: "Projected by 2040 under current pumping" },
    { label: "Communities with emergency trucking", value: "61", note: "Across Arizona, California, and New Mexico" },
  ];

  const relatedInvestigations = [
    "The County-by-County Cost of Dry Wells",
    "How Farm Credit Is Quietly Pricing Climate Collapse",
    "Tracing the Lobbyists Behind State Drought Exemptions",
  ];

  const perspectiveEssays = [
    {
      title: "What Climate Models Still Miss About Farmworker Heat Exposure",
      author: "Dr. Sahana Patel",
      role: "Atmospheric scientist",
      date: "July 10, 2025",
      bio: "Patel leads applied heat risk research focused on outdoor labor and regional climate adaptation.",
    },
    {
      title: "Community Relocation Needs More Than Federal Buyouts",
      author: "Mayor Elena Ruiz",
      role: "Coastal policymaker",
      date: "July 7, 2025",
      bio: "Ruiz is mayor of a flood-prone Gulf municipality negotiating voluntary retreat and rebuilding policy.",
    },
    {
      title: "Living Next to a Refinery Means Tracking Every Wind Shift",
      author: "Marlon Hayes",
      role: "Community organizer",
      date: "July 3, 2025",
      bio: "Hayes organizes neighborhood air monitoring campaigns in communities adjacent to petrochemical corridors.",
    },
  ];

  const supportTiers = [
    {
      name: "Free Reader",
      price: "$0",
      detail: "Access major investigations and weekly headlines.",
      perks: ["Weekly digest", "Limited article access", "Public events"],
    },
    {
      name: "Supporter",
      price: "$7/mo",
      detail: "Help fund accountability reporting and receive member briefings.",
      perks: ["Unlimited articles", "Member newsletter", "Early event registration"],
      featured: true,
    },
    {
      name: "Investigator",
      price: "$20/mo",
      detail: "Full newsroom support with specialized data access.",
      perks: ["Everything in Supporter", "Data access", "Quarterly reporting briefings"],
    },
  ];

  function Logo() {
    return html`
      <a href="./index.html" className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-stone-300 bg-stone-100 text-[11px] font-bold uppercase tracking-[0.35em] text-stone-700">
          Gw
        </div>
        <div>
          <p className="serif-display text-3xl font-semibold leading-none text-slate-900">Groundwork</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">Climate Investigations</p>
        </div>
      </a>
    `;
  }

  function Header({ current }) {
    return html`
      <header className="shell-card sticky top-0 z-50 border-b border-stone-300/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <${Logo} />
            <div className="hidden items-center gap-3 md:flex">
              <a href="./support.html" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Donate</a>
              <a href="./support.html" className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white">Subscribe</a>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <nav className="hide-scrollbar flex gap-2 overflow-x-auto">
              ${navItems.map(
                (item) => html`
                  <a
                    key=${item.href}
                    href=${item.href}
                    className=${`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                      current === item.href ? "bg-slate-900 text-white" : "bg-white/80 text-slate-700 hover:bg-stone-200"
                    }`}
                  >
                    ${item.label}
                  </a>
                `
              )}
            </nav>
            <div className="hide-scrollbar flex gap-2 overflow-x-auto text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              ${topicNav.map((topic) => html`<span key=${topic} className="rounded-full border border-stone-300 px-3 py-2">${topic}</span>`)}
            </div>
          </div>
        </div>
      </header>
    `;
  }

  function Footer() {
    return html`
      <footer className="mt-16 border-t border-stone-300 bg-[#e8e0d2]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
          <div>
            <p className="serif-display text-3xl text-slate-900">Groundwork</p>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-700">
              Data-driven investigative reporting on climate, science, and environmental policy.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Sections</p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              ${navItems.map((item) => html`<a key=${item.href} href=${item.href} className="block hover:text-slate-950">${item.label}</a>`)}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Contact</p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>tips@groundwork.news</p>
              <p>Source protection available for whistleblowers and confidential submissions.</p>
              <a href="./support.html" className="inline-flex rounded-full bg-slate-900 px-4 py-2 font-semibold text-white">Support the newsroom</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  function PageShell({ current, children }) {
    return html`
      <div className="groundwork-page min-h-screen">
        <${Header} current=${current} />
        <main>${children}</main>
        <${Footer} />
      </div>
    `;
  }

  function BreakingBanner() {
    return html`
      <div className="editorial-panel border-y border-slate-950/20 text-stone-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-950">Breaking</span>
            <p className="text-sm">New federal records detail emergency water hauling in 61 Western communities.</p>
          </div>
          <a href="./article.html" className="text-sm font-semibold text-amber-200">Read the investigation</a>
        </div>
      </div>
    `;
  }

  function SectionHeading({ eyebrow, title, blurb, action }) {
    return html`
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          ${eyebrow ? html`<p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">${eyebrow}</p>` : null}
          <h2 className="serif-display mt-2 text-4xl leading-none text-slate-900 md:text-5xl">${title}</h2>
          ${blurb ? html`<p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">${blurb}</p>` : null}
        </div>
        ${action ? html`<a href=${action.href} className="text-sm font-semibold text-slate-900">${action.label}</a>` : null}
      </div>
    `;
  }

  function StoryCard({ story, compact = false }) {
    return html`
      <article className="shell-card overflow-hidden rounded-[1.75rem] border border-stone-300/80 shadow-[0_22px_60px_rgba(18,32,40,0.08)]">
        <div className=${`story-photo relative h-48 ${story.mood || ""}`}></div>
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-800">${story.category || story.tag}</p>
          <h3 className=${`serif-display mt-3 text-slate-900 ${compact ? "text-3xl" : "text-[2.1rem] leading-8"}`}>
            ${story.href ? html`<a href=${story.href} className="hover:text-teal-900">${story.title}</a>` : story.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-700">${story.blurb || story.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            ${story.reporter ? html`<span>${story.reporter}</span>` : null}
            ${story.readTime || story.meta ? html`<span>${story.readTime || story.meta}</span>` : null}
          </div>
          ${story.href ? html`<a href=${story.href} className="mt-4 inline-flex text-sm font-semibold text-slate-900">Open story</a>` : null}
        </div>
      </article>
    `;
  }

  function DonationBanner() {
    return html`
      <section className="editorial-panel mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-slate-950/10 px-6 py-8 text-stone-100 shadow-[0_28px_80px_rgba(18,32,40,0.12)] md:px-8">
        <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200">Reader supported</p>
            <h3 className="serif-display mt-3 text-4xl leading-none md:text-5xl">Independent reporting takes time, records requests, and stubbornness.</h3>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-200">
              Your support funds document review, public-interest data analysis, and local reporting partnerships across climate front lines.
            </p>
          </div>
          <div className="rounded-[1.75rem] bg-white/10 p-5">
            <p className="text-sm uppercase tracking-[0.28em] text-stone-300">This month</p>
            <p className="mt-3 text-5xl font-bold text-white">184</p>
            <p className="mt-2 text-sm text-stone-200">records requests filed and tracked by Groundwork reporters</p>
            <a href="./support.html" className="mt-5 inline-flex rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950">Support Groundwork</a>
          </div>
        </div>
      </section>
    `;
  }

  function DataHighlight({ value, label, note }) {
    return html`
      <div className="shell-card rounded-[1.75rem] border border-stone-300/80 p-5">
        <p className="serif-display text-5xl leading-none text-slate-900 md:text-6xl">${value}</p>
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">${label}</p>
        <p className="mt-3 text-sm leading-6 text-slate-700">${note}</p>
      </div>
    `;
  }

  function DocumentList() {
    return html`
      <div className="shell-card rounded-[1.75rem] border border-stone-300/80 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Key Documents</p>
        <div className="mt-5 space-y-4">
          ${documents.map(
            (doc) => html`
              <a key=${doc.title} href="#" className="block rounded-2xl border border-stone-300 bg-white/70 p-4 hover:bg-stone-100">
                <p className="font-semibold text-slate-900">${doc.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">${doc.type}</p>
              </a>
            `
          )}
        </div>
      </div>
    `;
  }

  function VizPreview() {
    return html`
      <section className="editorial-panel overflow-hidden rounded-[1.75rem] border border-slate-950/10 p-5 text-stone-100">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-300">Data Visualization Preview</p>
        <div className="chart-grid mt-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="flex h-56 items-end gap-4">
            ${[32, 48, 42, 66, 71, 84, 79].map(
              (height, index) => html`
                <div key=${index} className="flex-1 rounded-t-2xl bg-gradient-to-t from-amber-400 to-teal-300" style=${{ height: `${height}%` }}></div>
              `
            )}
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-stone-200">County-level groundwater loss accelerated sharply after 2014, with the steepest decline in heavily irrigated basins.</p>
        <a href="./article.html" className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">View Full Report</a>
      </section>
    `;
  }

  function SupportWidget() {
    return html`
      <div className="rounded-[1.75rem] border border-amber-300 bg-amber-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-900">Support This Reporting</p>
        <p className="serif-display mt-3 text-4xl text-slate-900">$7 funds 1 hour of records review.</p>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Donations sustain travel, source protection, and the analysis behind Groundwork investigations.
        </p>
        <a href="./support.html" className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Contribute now</a>
      </div>
    `;
  }

  function SupportForm() {
    const [billing, setBilling] = useState("recurring");
    const [selectedTier, setSelectedTier] = useState("Supporter");
    const selectedPlan = useMemo(() => supportTiers.find((tier) => tier.name === selectedTier), [selectedTier]);

    return html`
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="shell-card rounded-[1.75rem] border border-stone-300/80 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Choose your support</p>
            <div className="mt-5 inline-flex rounded-full border border-stone-300 bg-white p-1">
              <button
                onClick=${() => setBilling("recurring")}
                className=${`rounded-full px-4 py-2 text-sm font-semibold ${billing === "recurring" ? "bg-slate-900 text-white" : "text-slate-600"}`}
              >
                Recurring
              </button>
              <button
                onClick=${() => setBilling("one-time")}
                className=${`rounded-full px-4 py-2 text-sm font-semibold ${billing === "one-time" ? "bg-slate-900 text-white" : "text-slate-600"}`}
              >
                One-time
              </button>
            </div>
            <div className="mt-6 space-y-4">
              ${supportTiers.map(
                (tier) => html`
                  <button
                    key=${tier.name}
                    onClick=${() => setSelectedTier(tier.name)}
                    className=${`block w-full rounded-[1.5rem] border p-5 text-left ${
                      selectedTier === tier.name ? "border-slate-900 bg-slate-900 text-white" : "border-stone-300 bg-white/70 text-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xl font-semibold">${tier.name}</p>
                        <p className=${`mt-2 text-sm ${selectedTier === tier.name ? "text-stone-200" : "text-slate-600"}`}>${tier.detail}</p>
                      </div>
                      <p className="serif-display text-4xl">${billing === "one-time" && tier.name !== "Free Reader" ? tier.price.replace("/mo", "") : tier.price}</p>
                    </div>
                    <div className=${`mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.22em] ${selectedTier === tier.name ? "text-stone-300" : "text-slate-500"}`}>
                      ${tier.perks.map((perk) => html`<span key=${perk} className="rounded-full border border-current/20 px-3 py-2">${perk}</span>`)}
                    </div>
                  </button>
                `
              )}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <${DataHighlight} value="42 hrs" label="Reporting funded" note="Average field reporting unlocked by every 100 Supporter memberships." />
            <${DataHighlight} value="18" label="Partner newsrooms" note="Local outlets we share data and co-publish with each quarter." />
            <${DataHighlight} value="91%" label="Source retention" note="Returning confidential sources who trust Groundwork's process." />
          </div>
        </div>
        <div className="shell-card rounded-[1.75rem] border border-stone-300/80 p-6 shadow-[0_22px_60px_rgba(18,32,40,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Secure payment</p>
          <h3 className="serif-display mt-3 text-4xl text-slate-900">${selectedPlan.name}</h3>
          <p className="mt-2 text-sm text-slate-700">${billing === "recurring" ? "Billed monthly. Cancel anytime." : "Single contribution."}</p>
          <form className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span>
              <input className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none" placeholder="Alex Reporter" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
              <input className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none" placeholder="alex@example.com" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Card number</span>
              <input className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none" placeholder="4242 4242 4242 4242" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Expiration</span>
                <input className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none" placeholder="MM/YY" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">CVC</span>
                <input className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none" placeholder="123" />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Postal code</span>
              <input className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none" placeholder="10001" />
            </label>
            <button type="button" className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Complete secure payment</button>
          </form>
        </div>
      </div>
    `;
  }

  return {
    html,
    navItems,
    topicNav,
    latestInvestigations,
    climateStories,
    articleCharts,
    relatedInvestigations,
    perspectiveEssays,
    PageShell,
    BreakingBanner,
    SectionHeading,
    StoryCard,
    DataHighlight,
    DonationBanner,
    DocumentList,
    VizPreview,
    SupportWidget,
    SupportForm,
  };
})();
