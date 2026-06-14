const { createElement: h, useState } = React;
const root = ReactDOM.createRoot(document.getElementById("root"));
const currentPage = window.GROUNDWORK_PAGE || "home";

const navItems = [
  { key: "home", label: "Home", href: "./index.html" },
  { key: "climate", label: "Climate", href: "./climate.html" },
  { key: "article", label: "Investigation", href: "./article.html" },
  { key: "opinion", label: "Perspectives", href: "./opinion.html" },
  { key: "support", label: "Support", href: "./support.html" },
];

const topicLinks = ["Climate", "Energy", "Policy", "Science", "Data"];

const latestInvestigations = [
  {
    title: "The Insurance Retreat Leaving Gulf Coast Towns Exposed",
    blurb: "Regulators promised resilience. Public records show risk models were never updated for today’s flood losses.",
    href: "./article.html",
  },
  {
    title: "Inside the Permitting Rush for Carbon Pipeline Corridors",
    blurb: "County maps, land filings, and pipeline briefings reveal who is carrying the risk and who is collecting subsidies.",
    href: "./climate.html",
  },
  {
    title: "Why Heat Pump Rebates Still Miss Rural Households",
    blurb: "A county-by-county analysis found the lowest adoption where utility burdens and repair costs are highest.",
    href: "./support.html",
  },
];

const climateStories = [
  { tag: "Sea Level", title: "Ports are quietly redrawing flood maps after repeated king-tide shutdowns.", readTime: "9 min read", reporter: "Rae Holloway" },
  { tag: "Wildfire", title: "Forest thinning contracts expanded faster than federal oversight capacity.", readTime: "7 min read", reporter: "Jon Mercer" },
  { tag: "Carbon Markets", title: "Offset registries approved projects that auditors had already flagged for reversal risk.", readTime: "11 min read", reporter: "Mina Solis" },
  { tag: "Water", title: "Farm districts are drilling deeper while aquifers lose decades of recharge.", readTime: "8 min read", reporter: "Theo Bennett" },
];

const keyDocs = [
  "Colorado Basin Subsidence Briefing.pdf",
  "USGS Groundwater Storage Memo.pdf",
  "State Pumping Permit Ledger.pdf",
  "County Canal Repair Audit.pdf",
];

const relatedInvestigations = [
  "After the Burn Scar: The Counties Rebuilding Into Flash-Flood Zones",
  "Tracking Methane Leaks Across a Fragmented Federal Database",
  "When Desalination Becomes the Last Budget Option",
];

const perspectives = [
  {
    title: "A Climate Model Is Not a Community Plan",
    author: "Dr. Imani Okafor",
    role: "Atmospheric scientist",
    date: "April 18, 2025",
    bio: "Okafor studies compound heat and smoke exposure and advises municipal adaptation teams.",
    excerpt: "The public hears certainty when scientists offer a probability range. Communities hear a deadline. Journalism can close that translation gap without flattening the uncertainty.",
  },
  {
    title: "Permitting Reform Cannot Mean Local Silence",
    author: "Luis Estrada",
    role: "Former state energy commissioner",
    date: "April 14, 2025",
    bio: "Estrada served on regional transmission planning boards and now researches public utility accountability.",
    excerpt: "Speed matters, but so does legitimacy. Fast-tracked projects that shortchange frontline testimony tend to face longer legal fights later.",
  },
  {
    title: "What Data Misses About Tribal Water Stewardship",
    author: "Nina Redbird",
    role: "Community organizer and watershed monitor",
    date: "April 10, 2025",
    bio: "Redbird coordinates local monitoring efforts across watershed restoration projects in the Southwest.",
    excerpt: "The datasets count acre-feet, depletion curves, and compliance dates. They rarely capture what it means when a spring that held ceremony water stops flowing.",
  },
];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function NavLink({ item }) {
  const active = item.key === currentPage;
  return h(
    "a",
    {
      href: item.href,
      "aria-current": active ? "page" : undefined,
      className: cx(
        "focus-ring rounded-full px-4 py-2 text-sm font-semibold transition",
        active ? "bg-ink text-paper" : "text-ink hover:bg-white/70"
      ),
    },
    item.label
  );
}

function Header() {
  return h(
    "header",
    { className: "border-b border-ink/10" },
    h(
      "div",
      { className: "mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8" },
      h(
        "div",
        { className: "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" },
        h(
          "div",
          null,
          h("a", { href: "./index.html", className: "focus-ring inline-block rounded-sm" },
            h("p", { className: "text-xs font-extrabold uppercase tracking-[0.32em] text-clay" }, "Groundwork"),
            h("p", { className: "font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl" }, "Investigative reporting for a hotter world")
          ),
          h("p", { className: "mt-2 max-w-2xl text-sm leading-6 text-ink/75" }, "Climate, science, and environmental policy reported with source documents, public records, and data.")
        ),
        h(
          "div",
          { className: "flex flex-wrap items-center gap-3" },
          h("div", { className: "rounded-full border border-ink/15 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-storm" }, "Updated April 2025"),
          h("a", { href: "./support.html", className: "focus-ring rounded-full bg-clay px-5 py-3 text-sm font-bold text-white" }, "Donate"),
          h("a", { href: "./support.html#payment-form", className: "focus-ring rounded-full border border-ink/15 bg-white/80 px-5 py-3 text-sm font-bold text-ink" }, "Subscribe")
        )
      ),
      h(
        "div",
        { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between" },
        h("nav", { "aria-label": "Primary", className: "flex flex-wrap gap-2" }, navItems.map((item) => h(NavLink, { key: item.key, item }))),
        h(
          "nav",
          { "aria-label": "Topic navigation", className: "flex flex-wrap gap-2" },
          topicLinks.map((topic) =>
            h("a", { key: topic, href: "./climate.html", className: "focus-ring rounded-full border border-ink/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-ink hover:bg-white/70" }, topic)
          )
        )
      )
    )
  );
}

function Footer() {
  return h(
    "footer",
    { className: "mt-16 border-t border-ink/10 bg-ink text-paper" },
    h(
      "div",
      { className: "mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8" },
      h(
        "div",
        null,
        h("p", { className: "text-xs font-extrabold uppercase tracking-[0.32em] text-clay" }, "Groundwork"),
        h("h2", { className: "font-display mt-3 text-3xl font-semibold" }, "Independent reporting with public consequence"),
        h("p", { className: "mt-3 max-w-xl text-sm leading-7 text-paper/75" }, "Groundwork is a fictional editorial prototype modeled on reader-supported investigative journalism focused on climate, science, and accountability.")
      ),
      h(
        "div",
        null,
        h("h3", { className: "text-sm font-bold uppercase tracking-[0.22em] text-paper/80" }, "Sections"),
        h("ul", { className: "mt-4 space-y-3 text-sm" },
          navItems.map((item) => h("li", { key: item.key }, h("a", { href: item.href, className: "focus-ring rounded-sm text-paper/80 hover:text-white" }, item.label)))
        )
      ),
      h(
        "div",
        null,
        h("h3", { className: "text-sm font-bold uppercase tracking-[0.22em] text-paper/80" }, "Contact"),
        h("p", { className: "mt-4 text-sm leading-7 text-paper/75" }, "tips@groundwork.news"),
        h("p", { className: "text-sm leading-7 text-paper/75" }, "Encrypted source intake available on request"),
        h("a", { href: "./support.html", className: "focus-ring mt-4 inline-flex rounded-full border border-paper/20 px-4 py-2 text-sm font-semibold text-paper" }, "Support this reporting")
      )
    )
  );
}

function BreakingBanner() {
  return h(
    "section",
    { "aria-label": "Breaking news", className: "border-b border-clay/20 bg-clay/10" },
    h(
      "div",
      { className: "mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 text-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8" },
      h("p", { className: "font-bold uppercase tracking-[0.18em] text-clay" }, "Breaking"),
      h("p", { className: "max-w-4xl text-ink/85" }, "New records request reveals three Western groundwater districts delayed land-subsidence warnings for more than a year."),
      h("a", { href: "./article.html", className: "focus-ring rounded-full border border-clay/25 bg-white/80 px-4 py-2 font-semibold text-ink" }, "Read the investigation")
    )
  );
}

function StoryCard({ title, blurb, href }) {
  return h(
    "article",
    { className: "story-card paper-panel rounded-[1.75rem] p-6" },
    h("p", { className: "text-xs font-extrabold uppercase tracking-[0.2em] text-storm" }, "Investigation"),
    h("h3", { className: "font-display mt-3 text-3xl font-semibold leading-tight text-ink" }, title),
    h("p", { className: "mt-3 text-sm leading-7 text-ink/75" }, blurb),
    h(
      "a",
      { href, className: "focus-ring mt-6 inline-flex items-center gap-2 rounded-full border border-ink/10 px-4 py-2 text-sm font-bold text-ink" },
      "Open story",
      h("span", { className: "story-arrow", "aria-hidden": "true" }, "->")
    )
  );
}

function HomePage() {
  return h(
    "main",
    { id: "main-content", className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" },
    h(
      "section",
      { className: "grid gap-6 lg:grid-cols-[1.35fr_0.65fr]", "aria-labelledby": "home-hero-title" },
      h(
        "article",
        { className: "hero-photo overflow-hidden rounded-[2rem] border border-white/10 p-8 text-white sm:p-10 lg:min-h-[42rem] lg:p-12" },
        h("p", { className: "text-xs font-extrabold uppercase tracking-[0.24em] text-white/80" }, "Feature investigation"),
        h("h1", { id: "home-hero-title", className: "font-display mt-6 max-w-4xl text-5xl font-semibold leading-none sm:text-6xl" }, "The Invisible Flood: How Groundwater Collapse Is Reshaping the American West"),
        h("p", { className: "mt-6 max-w-2xl text-base leading-8 text-white/85 sm:text-lg" }, "Groundwater is not disappearing in a single catastrophe. It is draining through budget decisions, emergency exemptions, and a monitoring system built for a different century."),
        h("div", { className: "mt-8 flex flex-wrap items-center gap-4 text-sm font-semibold text-white/85" },
          h("span", null, "By Mara Lin and Theo Bennett"),
          h("span", { "aria-hidden": "true" }, "•"),
          h("span", null, "18 min read"),
          h("span", { "aria-hidden": "true" }, "•"),
          h("span", null, "Data + field reporting")
        ),
        h("div", { className: "mt-10 flex flex-wrap gap-3" },
          h("a", { href: "./article.html", className: "focus-ring rounded-full bg-white px-6 py-3 text-sm font-extrabold text-ink" }, "Start reading"),
          h("a", { href: "./climate.html", className: "focus-ring rounded-full border border-white/30 px-6 py-3 text-sm font-extrabold text-white" }, "Explore climate desk")
        )
      ),
      h(
        "aside",
        { className: "space-y-6" },
        h(
          "section",
          { className: "paper-panel rounded-[2rem] p-6", "aria-labelledby": "latest-title" },
          h("p", { className: "text-xs font-extrabold uppercase tracking-[0.22em] text-clay" }, "Field notes"),
          h("h2", { id: "latest-title", className: "font-display mt-3 text-3xl font-semibold text-ink" }, "Latest investigations"),
          h("div", { className: "mt-6 space-y-4" }, latestInvestigations.map((story) => h(StoryCard, { key: story.title, ...story })))
        ),
        h(
          "section",
          { className: "paper-panel rounded-[2rem] p-6", "aria-labelledby": "newsletter-title" },
          h("p", { className: "text-xs font-extrabold uppercase tracking-[0.22em] text-storm" }, "Newsletter"),
          h("h2", { id: "newsletter-title", className: "font-display mt-3 text-2xl font-semibold text-ink" }, "Watchdog brief"),
          h("p", { className: "mt-3 text-sm leading-7 text-ink/75" }, "Every Friday: a roundup of climate accountability stories, source documents, and reporting notes."),
          h("form", { className: "mt-5 space-y-3" },
            h("div", null,
              h("label", { htmlFor: "watchdog-email", className: "mb-2 block text-sm font-semibold text-ink" }, "Email address"),
              h("input", { id: "watchdog-email", type: "email", placeholder: "reader@example.com", className: "focus-ring h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-sm text-ink" })
            ),
            h("button", { type: "submit", className: "focus-ring w-full rounded-full bg-ink px-4 py-3 text-sm font-bold text-paper" }, "Join the brief")
          )
        )
      )
    ),
    h(
      "section",
      { className: "mt-8 paper-panel rounded-[2rem] p-6 sm:p-8", "aria-labelledby": "numbers-title" },
      h("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between" },
        h("div", null,
          h("p", { className: "text-xs font-extrabold uppercase tracking-[0.22em] text-clay" }, "By the numbers"),
          h("h2", { id: "numbers-title", className: "font-display mt-3 text-4xl font-semibold text-ink" }, "Key metrics from our groundwater reporting")
        ),
        h("p", { className: "max-w-2xl text-sm leading-7 text-ink/75" }, "Groundwork analyzed district filings, satellite displacement readings, and state pumping ledgers across the Southwest.")
      ),
      h("div", { className: "mt-8 grid gap-4 md:grid-cols-3" },
        [
          { stat: "1,240", label: "square miles showing measurable subsidence since 2015" },
          { stat: "37%", label: "increase in emergency pumping waivers across the basin" },
          { stat: "86", label: "public records requests used in this reporting package" },
        ].map((item) =>
          h("article", { key: item.label, className: "rounded-[1.75rem] border border-ink/10 bg-white/75 p-6" },
            h("p", { className: "font-display text-6xl font-semibold leading-none text-clay" }, item.stat),
            h("p", { className: "mt-3 text-sm leading-7 text-ink/75" }, item.label)
          )
        )
      )
    ),
    h(
      "section",
      { className: "mt-8 rounded-[2rem] bg-moss px-6 py-8 text-paper sm:px-8", "aria-labelledby": "donation-banner-title" },
      h("p", { className: "text-xs font-extrabold uppercase tracking-[0.22em] text-paper/70" }, "Reader-supported"),
      h("div", { className: "mt-3 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between" },
        h("div", null,
          h("h2", { id: "donation-banner-title", className: "font-display text-4xl font-semibold" }, "This reporting stays independent because readers fund it."),
          h("p", { className: "mt-3 max-w-2xl text-sm leading-7 text-paper/80" }, "Membership and one-time donations pay for records requests, travel to affected communities, and public-interest data analysis.")
        ),
        h("div", { className: "flex flex-wrap gap-3" },
          h("a", { href: "./support.html", className: "focus-ring rounded-full bg-paper px-6 py-3 text-sm font-extrabold text-ink" }, "Support Groundwork"),
          h("a", { href: "./article.html", className: "focus-ring rounded-full border border-paper/30 px-6 py-3 text-sm font-extrabold text-paper" }, "See impact")
        )
      )
    )
  );
}

function ClimatePage() {
  return h(
    "main",
    { id: "main-content", className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" },
    h(
      "section",
      { className: "grid gap-6 xl:grid-cols-[1.15fr_0.85fr]", "aria-labelledby": "climate-title" },
      h(
        "article",
        { className: "climate-photo rounded-[2rem] p-8 text-white sm:p-10" },
        h("p", { className: "text-xs font-extrabold uppercase tracking-[0.22em] text-white/75" }, "Climate desk"),
        h("h1", { id: "climate-title", className: "font-display mt-4 max-w-3xl text-5xl font-semibold leading-none" }, "Where risk models fail, communities inherit the cost."),
        h("p", { className: "mt-5 max-w-2xl text-base leading-8 text-white/85" }, "Investigations into sea-level rise, wildfire recovery, carbon accounting, and the public systems that determine who gets warned, protected, or left behind."),
        h("div", { className: "mt-8 rounded-[1.75rem] bg-white/12 p-5 backdrop-blur-sm" },
          h("p", { className: "text-xs font-extrabold uppercase tracking-[0.18em] text-white/70" }, "Lead investigation"),
          h("h2", { className: "font-display mt-3 text-3xl font-semibold" }, "The Levees That Passed Inspection Before They Failed"),
          h("p", { className: "mt-3 text-sm leading-7 text-white/85" }, "By Rae Holloway • 14 min read"),
          h("p", { className: "mt-3 text-sm leading-7 text-white/85" }, "Inspection reports praised routine maintenance while erosion maps and contractor memos pointed to structural exposure."),
          h("a", { href: "./article.html", className: "focus-ring mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-ink" }, "Open investigation")
        )
      ),
      h(
        "aside",
        { className: "space-y-6" },
        h(
          "section",
          { className: "paper-panel rounded-[2rem] p-6", "aria-labelledby": "documents-title" },
          h("p", { className: "text-xs font-extrabold uppercase tracking-[0.22em] text-clay" }, "Source library"),
          h("h2", { id: "documents-title", className: "font-display mt-3 text-3xl font-semibold text-ink" }, "Key documents"),
          h("ul", { className: "mt-5 space-y-3" },
            keyDocs.map((doc) =>
              h("li", { key: doc },
                h("a", { href: "#", className: "focus-ring flex items-center justify-between rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink" },
                  h("span", null, doc),
                  h("span", { "aria-hidden": "true" }, "PDF")
                )
              )
            )
          )
        ),
        h(
          "section",
          { className: "paper-panel rounded-[2rem] p-6", "aria-labelledby": "embed-title" },
          h("p", { className: "text-xs font-extrabold uppercase tracking-[0.22em] text-storm" }, "Data visualization"),
          h("h2", { id: "embed-title", className: "font-display mt-3 text-2xl font-semibold text-ink" }, "Aquifer decline monitor"),
          h("div", { className: "dataviz-grid mt-5 rounded-[1.75rem] border border-ink/10 bg-white p-5" },
            h("div", { className: "chart-bars flex h-40 items-end gap-3" },
              [45, 64, 81, 96, 118, 142].map((height, index) =>
                h("span", { key: index, style: { height: `${height}px`, width: "calc(16.66% - 0.6rem)" }, "aria-label": `Year ${index + 1} decline bar` })
              )
            )
          ),
          h("p", { className: "mt-4 text-sm leading-7 text-ink/75" }, "Preview of county-level groundwater loss paired with land-subsidence alerts and enforcement actions."),
          h("a", { href: "./article.html", className: "focus-ring mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-paper" }, "View full report")
        )
      )
    ),
    h(
      "section",
      { className: "mt-8 paper-panel rounded-[2rem] p-6 sm:p-8", "aria-labelledby": "story-list-title" },
      h("p", { className: "text-xs font-extrabold uppercase tracking-[0.22em] text-clay" }, "Recent reporting"),
      h("h2", { id: "story-list-title", className: "font-display mt-3 text-4xl font-semibold text-ink" }, "Climate investigations"),
      h("div", { className: "mt-8 grid gap-4" },
        climateStories.map((story) =>
          h("article", { key: story.title, className: "rounded-[1.75rem] border border-ink/10 bg-white/80 p-5" },
            h("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" },
              h("div", null,
                h("span", { className: "rounded-full bg-fog px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-storm" }, story.tag),
                h("h3", { className: "font-display mt-3 text-3xl font-semibold leading-tight text-ink" }, story.title),
                h("p", { className: "mt-3 text-sm text-ink/70" }, `${story.reporter} • ${story.readTime}`)
              ),
              h("a", { href: "./article.html", className: "focus-ring rounded-full border border-ink/10 px-5 py-3 text-sm font-bold text-ink" }, "Read story")
            )
          )
        )
      )
    )
  );
}

function ArticlePage() {
  return h(
    "main",
    { id: "main-content", className: "mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8" },
    h(
      "article",
      { className: "paper-panel rounded-[2rem] p-6 sm:p-8 lg:p-10" },
      h("p", { className: "text-xs font-extrabold uppercase tracking-[0.22em] text-clay" }, "Investigation"),
      h("h1", { className: "font-display mt-4 text-5xl font-semibold leading-none text-ink sm:text-6xl" }, "The Invisible Flood: How Groundwater Collapse Is Reshaping the American West"),
      h("p", { className: "mt-5 max-w-4xl text-lg leading-8 text-ink/80" }, "As aquifers fall, the land above them sinks. Groundwork traced how delayed warnings, fragmented oversight, and aggressive pumping are turning a hidden water crisis into an infrastructure emergency."),
      h("div", { className: "mt-6 flex flex-wrap gap-3 text-sm font-semibold text-ink/70" },
        h("span", null, "By Mara Lin and Theo Bennett"),
        h("span", { "aria-hidden": "true" }, "•"),
        h("time", { dateTime: "2025-04-22" }, "April 22, 2025"),
        h("span", { "aria-hidden": "true" }, "•"),
        h("span", null, "18 min read")
      ),
      h("div", { className: "mt-8 grid gap-8 lg:grid-cols-[0.72fr_0.28fr]" },
        h("div", { className: "space-y-8" },
          h("img", {
            src: "https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=1500&q=80",
            alt: "Dry agricultural basin with irrigation geometry and hazy mountains in the distance",
            className: "h-[25rem] w-full rounded-[2rem] object-cover"
          }),
          h("section", { "aria-labelledby": "methodology-title", className: "rounded-[1.75rem] border border-ink/10 bg-fog/50 p-6" },
            h("p", { className: "text-xs font-extrabold uppercase tracking-[0.18em] text-storm" }, "How we reported this"),
            h("h2", { id: "methodology-title", className: "font-display mt-3 text-3xl font-semibold text-ink" }, "Methodology note"),
            h("p", { className: "mt-3 text-sm leading-7 text-ink/80" }, "Reporters analyzed seven years of state pumping records, reviewed satellite interferometry measuring land movement, and interviewed hydrologists, irrigation managers, and residents across Arizona, California, and New Mexico.")
          ),
          h("section", { className: "space-y-6 text-[1.05rem] leading-8 text-ink/85" },
            h("p", null, "On paper, the warning signs arrived as numbers: millimeters of vertical change, emergency permit counts, repair estimates for cracked canals. In farming towns across the West, they arrived as doors that no longer closed cleanly, roads that dipped after each irrigation season, and pipes that began to shear under the soil."),
            h("p", null, "Groundwater collapse is hard to cover because it is both everywhere and mostly invisible. The aquifers do not announce themselves as they drain. The land settles slowly, then all at once in the places where monitoring is weakest and extraction pressure is strongest."),
            h("blockquote", { className: "border-l-4 border-clay pl-5 font-display text-3xl font-semibold leading-tight text-ink" }, "“We built water policy around what we could pump, not what the land could survive.”"),
            h("p", null, "County officials repeatedly described subsidence as a technical issue. Internal memos told a different story. Engineers warned that rail beds, canal linings, and flood-control structures were already absorbing the cost of delayed restrictions."),
            h("div", { className: "rounded-[1.75rem] border border-ink/10 bg-white p-6" },
              h("p", { className: "text-xs font-extrabold uppercase tracking-[0.18em] text-storm" }, "Embedded chart"),
              h("h2", { className: "font-display mt-3 text-3xl font-semibold text-ink" }, "Annual subsidence vs. emergency pumping waivers"),
              h("div", { className: "dataviz-grid mt-5 rounded-[1.5rem] border border-ink/10 bg-fog/50 p-5" },
                h("div", { className: "chart-bars flex h-48 items-end gap-4" },
                  [52, 78, 95, 122, 150].map((height, index) =>
                    h("span", { key: index, style: { height: `${height}px`, width: "18%" }, "aria-label": `Subsidence bar ${index + 1}` })
                  )
                )
              )
            ),
            h("p", null, "The same agencies that approved emergency pumping expansions often had no requirement to issue public-facing subsidence notices. Residents could see the cracks, but not the internal threshold reports showing when the land had crossed into infrastructure risk."),
            h("div", { className: "map-card rounded-[1.75rem] border border-ink/10 p-6" },
              h("p", { className: "text-xs font-extrabold uppercase tracking-[0.18em] text-storm" }, "Map embed"),
              h("h2", { className: "font-display mt-3 text-3xl font-semibold text-ink" }, "Counties with overlapping aquifer loss and canal damage"),
              h("p", { className: "mt-3 max-w-2xl text-sm leading-7 text-ink/80" }, "Prototype map area showing hotspots where irrigation districts reported repeat repair work alongside accelerating groundwater decline.")
            ),
            h("p", null, "By the time state officials discussed basinwide intervention, local repair budgets had already normalized failure. Canal patching, rail shimming, and emergency road resurfacing were treated as maintenance rather than evidence of a system sliding out of equilibrium."),
            h("section", { "aria-labelledby": "footnotes-title", className: "rounded-[1.75rem] border border-ink/10 bg-white p-6" },
              h("h2", { id: "footnotes-title", className: "font-display text-3xl font-semibold text-ink" }, "Footnotes"),
              h("ol", { className: "mt-4 space-y-3 text-sm leading-7 text-ink/75" },
                h("li", null, "[1] State Water Resources Department pumping permit database, queried February 2025."),
                h("li", null, "[2] USGS InSAR land-motion series for Central Valley and lower Colorado sub-basins."),
                h("li", null, "[3] County infrastructure repair budgets and bid records obtained through public records requests.")
              )
            )
          ),
          h("section", { className: "rounded-[2rem] bg-moss p-6 text-paper", "aria-labelledby": "support-widget-title" },
            h("p", { className: "text-xs font-extrabold uppercase tracking-[0.18em] text-paper/70" }, "Support this reporting"),
            h("h2", { id: "support-widget-title", className: "font-display mt-3 text-3xl font-semibold" }, "Public-interest investigations take time, travel, and records fees."),
            h("p", { className: "mt-3 max-w-2xl text-sm leading-7 text-paper/80" }, "Groundwork does not use a paywall for accountability reporting. Reader support keeps these stories free and helps fund the next records request."),
            h("div", { className: "mt-5 flex flex-wrap gap-3" },
              h("a", { href: "./support.html", className: "focus-ring rounded-full bg-paper px-5 py-3 text-sm font-bold text-ink" }, "Give monthly"),
              h("a", { href: "./support.html#payment-form", className: "focus-ring rounded-full border border-paper/30 px-5 py-3 text-sm font-bold text-paper" }, "Give once")
            )
          )
        ),
        h("aside", { className: "space-y-6" },
          h("section", { className: "rounded-[1.75rem] border border-ink/10 bg-white/80 p-6" },
            h("p", { className: "text-xs font-extrabold uppercase tracking-[0.18em] text-clay" }, "Reporter note"),
            h("p", { className: "mt-3 text-sm leading-7 text-ink/80" }, "If you have documents related to groundwater enforcement, irrigation district planning, or land subsidence, contact the newsroom securely.")
          ),
          h("section", { className: "rounded-[1.75rem] border border-ink/10 bg-white/80 p-6", "aria-labelledby": "related-title" },
            h("p", { className: "text-xs font-extrabold uppercase tracking-[0.18em] text-storm" }, "More to read"),
            h("h2", { id: "related-title", className: "font-display mt-3 text-3xl font-semibold text-ink" }, "Related investigations"),
            h("ul", { className: "mt-5 space-y-4" },
              relatedInvestigations.map((story) =>
                h("li", { key: story },
                  h("a", { href: "./climate.html", className: "focus-ring block rounded-2xl border border-ink/10 bg-fog/40 px-4 py-4 text-sm font-semibold leading-6 text-ink" }, story)
                )
              )
            )
          )
        )
      )
    )
  );
}

function OpinionPage() {
  return h(
    "main",
    { id: "main-content", className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" },
    h(
      "section",
      { className: "paper-panel rounded-[2rem] p-6 sm:p-8", "aria-labelledby": "perspectives-title" },
      h("p", { className: "text-xs font-extrabold uppercase tracking-[0.22em] text-clay" }, "Opinion"),
      h("h1", { id: "perspectives-title", className: "font-display mt-3 text-5xl font-semibold text-ink sm:text-6xl" }, "Perspectives"),
      h("p", { className: "mt-4 max-w-3xl text-base leading-8 text-ink/78" }, "Essays from scientists, policymakers, and community voices who live inside the systems Groundwork covers."),
      h("div", { className: "mt-8 grid gap-5 lg:grid-cols-3" },
        perspectives.map((piece) =>
          h("article", { key: piece.title, className: "rounded-[1.75rem] border border-ink/10 bg-white/80 p-6" },
            h("p", { className: "text-xs font-extrabold uppercase tracking-[0.18em] text-storm" }, piece.date),
            h("h2", { className: "font-display mt-3 text-3xl font-semibold leading-tight text-ink" }, piece.title),
            h("p", { className: "mt-4 text-sm leading-7 text-ink/78" }, piece.excerpt),
            h("div", { className: "mt-6 rounded-[1.5rem] border border-ink/10 bg-fog/40 p-4" },
              h("p", { className: "text-sm font-extrabold text-ink" }, piece.author),
              h("p", { className: "text-sm text-storm" }, piece.role),
              h("p", { className: "mt-2 text-sm leading-6 text-ink/75" }, piece.bio)
            ),
            h("a", { href: "mailto:letters@groundwork.news?subject=Response%20to%20Perspective", className: "focus-ring mt-6 inline-flex rounded-full border border-ink/10 px-4 py-2 text-sm font-bold text-ink" }, "Respond to this piece")
          )
        )
      )
    )
  );
}

function SupportPage() {
  const [billing, setBilling] = useState("recurring");
  const tiers = [
    { name: "Free Reader", price: "$0", note: "Access to free reporting and the weekly watchdog brief." },
    { name: "Supporter", price: billing === "recurring" ? "$7/mo" : "$84 once", note: "Sustain field reporting and receive member updates." },
    { name: "Investigator", price: billing === "recurring" ? "$20/mo" : "$240 once", note: "Includes newsletter perks, newsroom briefings, and data access previews." },
  ];

  return h(
    "main",
    { id: "main-content", className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" },
    h(
      "section",
      { className: "grid gap-6 xl:grid-cols-[0.95fr_1.05fr]" },
      h(
        "div",
        { className: "rounded-[2rem] bg-ink p-8 text-paper sm:p-10" },
        h("p", { className: "text-xs font-extrabold uppercase tracking-[0.22em] text-clay" }, "Reader support"),
        h("h1", { className: "font-display mt-4 text-5xl font-semibold leading-none sm:text-6xl" }, "Keep Groundwork Independent"),
        h("p", { className: "mt-5 max-w-2xl text-base leading-8 text-paper/80" }, "Groundwork stays accessible because readers underwrite reporting trips, records requests, data analysis, and the time required to verify public-interest investigations."),
        h("div", { className: "mt-8 grid gap-4 sm:grid-cols-3" },
          [
            { stat: "12", label: "hours of reporting funded by a monthly Supporter each year" },
            { stat: "31", label: "records requests filed in the last investigation package" },
            { stat: "4", label: "states covered by the current groundwater reporting team" },
          ].map((item) =>
            h("div", { key: item.label, className: "rounded-[1.5rem] border border-paper/10 bg-white/5 p-4" },
              h("p", { className: "font-display text-5xl font-semibold text-paper" }, item.stat),
              h("p", { className: "mt-2 text-sm leading-6 text-paper/75" }, item.label)
            )
          )
        )
      ),
      h(
        "section",
        { className: "paper-panel rounded-[2rem] p-6 sm:p-8", "aria-labelledby": "tiers-title" },
        h("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" },
          h("div", null,
            h("p", { className: "text-xs font-extrabold uppercase tracking-[0.22em] text-clay" }, "Membership"),
            h("h2", { id: "tiers-title", className: "font-display mt-3 text-4xl font-semibold text-ink" }, "Choose your level of support")
          ),
          h("div", { className: "inline-flex rounded-full border border-ink/10 bg-fog/50 p-1", role: "group", "aria-label": "Billing frequency toggle" },
            h("button", { type: "button", className: "focus-ring toggle-pill rounded-full px-4 py-2 text-sm font-bold text-ink", "aria-pressed": billing === "recurring", onClick: () => setBilling("recurring") }, "Recurring"),
            h("button", { type: "button", className: "focus-ring toggle-pill rounded-full px-4 py-2 text-sm font-bold text-ink", "aria-pressed": billing === "one-time", onClick: () => setBilling("one-time") }, "One-time")
          )
        ),
        h("div", { className: "mt-8 grid gap-4 md:grid-cols-3" },
          tiers.map((tier, index) =>
            h("article", { key: tier.name, className: cx("rounded-[1.75rem] border p-5", index === 1 ? "border-clay bg-clay/5" : "border-ink/10 bg-white/80") },
              h("h3", { className: "font-display text-3xl font-semibold text-ink" }, tier.name),
              h("p", { className: "mt-3 text-4xl font-extrabold text-ink" }, tier.price),
              h("p", { className: "mt-3 text-sm leading-7 text-ink/75" }, tier.note)
            )
          )
        ),
        h("form", { id: "payment-form", className: "mt-8 grid gap-5 rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 lg:grid-cols-2", "aria-label": "Secure payment form" },
          h("div", { className: "lg:col-span-2" },
            h("p", { className: "text-xs font-extrabold uppercase tracking-[0.18em] text-storm" }, "Secure checkout"),
            h("p", { className: "mt-2 text-sm leading-7 text-ink/75" }, "Payments are encrypted. This is a static prototype form for the mockup.")
          ),
          h("div", null,
            h("label", { htmlFor: "full-name", className: "mb-2 block text-sm font-semibold text-ink" }, "Full name"),
            h("input", { id: "full-name", type: "text", className: "focus-ring h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-sm text-ink" })
          ),
          h("div", null,
            h("label", { htmlFor: "email", className: "mb-2 block text-sm font-semibold text-ink" }, "Email address"),
            h("input", { id: "email", type: "email", className: "focus-ring h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-sm text-ink" })
          ),
          h("div", null,
            h("label", { htmlFor: "tier", className: "mb-2 block text-sm font-semibold text-ink" }, "Membership tier"),
            h("select", { id: "tier", className: "focus-ring h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-sm text-ink" },
              h("option", null, "Free Reader"),
              h("option", null, "Supporter"),
              h("option", null, "Investigator")
            )
          ),
          h("div", null,
            h("label", { htmlFor: "card-number", className: "mb-2 block text-sm font-semibold text-ink" }, "Card number"),
            h("input", { id: "card-number", inputMode: "numeric", type: "text", className: "focus-ring h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-sm text-ink", placeholder: "1234 5678 9012 3456" })
          ),
          h("div", null,
            h("label", { htmlFor: "expiry", className: "mb-2 block text-sm font-semibold text-ink" }, "Expiry"),
            h("input", { id: "expiry", type: "text", className: "focus-ring h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-sm text-ink", placeholder: "MM/YY" })
          ),
          h("div", null,
            h("label", { htmlFor: "cvc", className: "mb-2 block text-sm font-semibold text-ink" }, "CVC"),
            h("input", { id: "cvc", inputMode: "numeric", type: "text", className: "focus-ring h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-sm text-ink", placeholder: "123" })
          ),
          h("div", { className: "lg:col-span-2" },
            h("label", { htmlFor: "comments", className: "mb-2 block text-sm font-semibold text-ink" }, "Why are you supporting Groundwork?"),
            h("textarea", { id: "comments", rows: "4", className: "focus-ring w-full rounded-[1.5rem] border border-ink/15 bg-white px-4 py-3 text-sm text-ink", placeholder: "Optional note to the newsroom" })
          ),
          h("div", { className: "lg:col-span-2 flex flex-wrap items-center justify-between gap-4" },
            h("p", { className: "text-sm leading-7 text-ink/75" }, `Selected billing: ${billing === "recurring" ? "Recurring support" : "One-time support"}`),
            h("button", { type: "submit", className: "focus-ring rounded-full bg-ink px-6 py-3 text-sm font-bold text-paper" }, "Complete secure payment")
          )
        )
      )
    )
  );
}

function App() {
  const pages = {
    home: h(HomePage),
    climate: h(ClimatePage),
    article: h(ArticlePage),
    opinion: h(OpinionPage),
    support: h(SupportPage),
  };

  return h(
    "div",
    { className: "page-shell site-frame min-h-screen" },
    h("a", { href: "#main-content", className: "focus-ring sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper" }, "Skip to main content"),
    h(BreakingBanner),
    h(Header),
    pages[currentPage] || pages.home,
    h(Footer)
  );
}

root.render(h(App));
