const { useEffect, useMemo, useRef, useState } = React;
const html = htm.bind(React.createElement);

const Groundwork = (() => {
  const navLinks = [
    { href: "./index.html", label: "Home" },
    { href: "./climate.html", label: "Climate" },
    { href: "./article.html", label: "Feature" },
    { href: "./perspectives.html", label: "Perspectives" },
    { href: "./support.html", label: "Support" },
  ];

  const topicLinks = ["Climate", "Energy", "Policy", "Science", "Data"];

  const latestInvestigations = [
    {
      tag: "Water",
      title: "Inland aquifers are dropping faster than federal forecasts predicted",
      summary: "Satellite records and county pump logs show severe groundwater loss spreading beyond legacy drought basins.",
      href: "./article.html",
      meta: "8 min read",
    },
    {
      tag: "Energy",
      title: "Utilities promised methane cuts. Their own filings show emissions climbing.",
      summary: "State audits reviewed by Groundwork reveal leaking infrastructure plans delayed for years.",
      href: "./climate.html",
      meta: "11 min read",
    },
    {
      tag: "Policy",
      title: "How flood buyout maps can erase frontline neighborhoods from recovery funds",
      summary: "Residents and planners say the data rules steering aid still miss informal housing and tribal land.",
      href: "./perspectives.html",
      meta: "6 min read",
    },
  ];

  const climateStories = [
    {
      tag: "Sea Level",
      title: "Louisiana parish records show retreat plans already reshaping tax bases",
      summary: "Public finance documents reveal where adaptation money is landing and who gets left behind.",
      reporter: "Nina Patel",
      readTime: "9 min read",
      href: "./article.html",
    },
    {
      tag: "Wildfire",
      title: "The insurers leaving California counted on risk models that ignored home hardening",
      summary: "A review of carrier filings suggests mitigation work is being undercounted in pricing models.",
      reporter: "Owen Clarke",
      readTime: "7 min read",
      href: "./article.html",
    },
    {
      tag: "Carbon Markets",
      title: "Offset registries approved millions of credits from forests already under protection",
      summary: "Groundwork and university researchers traced the paperwork trail behind high-value projects.",
      reporter: "Maria Alvarez",
      readTime: "10 min read",
      href: "./article.html",
    },
    {
      tag: "Water",
      title: "A hidden network of farm wells is draining small-town drinking water reserves",
      summary: "Monitoring wells in three western states show municipal systems dipping below resilience targets.",
      reporter: "Nina Patel",
      readTime: "12 min read",
      href: "./article.html",
    },
  ];

  const opinionPieces = [
    {
      title: "What wildfire smoke policy misses about migrant field labor",
      author: "Dr. Leah Moreno",
      role: "Pulmonary scientist, University of New Mexico",
      date: "April 18, 2025",
      bio: "Moreno studies how prolonged smoke exposure changes respiratory outcomes for agricultural workers.",
      href: "./article.html",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
    },
    {
      title: "A mayor's case for climate adaptation budgets that outlast election cycles",
      author: "Thomas Bell",
      role: "Former mayor of Duluth, Minnesota",
      date: "April 16, 2025",
      bio: "Bell led municipal infrastructure planning after repeated inland flooding and winter storm failures.",
      href: "./article.html",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
    },
    {
      title: "Community air monitors should be treated like public health infrastructure",
      author: "Yara Jefferson",
      role: "Gulf Coast organizer, Clean Ports Collective",
      date: "April 11, 2025",
      bio: "Jefferson works with fence-line communities tracking petrochemical emissions and emergency alerts.",
      href: "./article.html",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=240&q=80",
    },
  ];

  const keyDocuments = [
    { label: "Colorado Pumping District Audit (PDF)", href: "#", note: "Annotated public filing" },
    { label: "Bureau of Reclamation Reservoir Model (PDF)", href: "#", note: "Methodology appendix" },
    { label: "County Well Permitting Database (CSV)", href: "#", note: "Source data excerpt" },
  ];

  function announce(message, politeness = "polite") {
    const region = document.getElementById("global-live-region");
    if (!region) return;
    region.setAttribute("aria-live", politeness);
    region.textContent = "";
    window.setTimeout(() => {
      region.textContent = message;
    }, 30);
  }

  function useDialog(open, onClose) {
    const dialogRef = useRef(null);
    const lastFocused = useRef(null);

    useEffect(() => {
      if (!open) return undefined;
      lastFocused.current = document.activeElement;
      const node = dialogRef.current;
      if (!node) return undefined;
      const getFocusable = () => Array.from(node.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter((item) => !item.hasAttribute("disabled"));
      const focusable = getFocusable();
      if (focusable.length) {
        focusable[0].focus();
      } else {
        node.focus();
      }

      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
          return;
        }

        if (event.key !== "Tab") return;
        const items = getFocusable();
        if (!items.length) {
          event.preventDefault();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };

      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", onKeyDown);
        if (lastFocused.current && typeof lastFocused.current.focus === "function") {
          lastFocused.current.focus();
        }
      };
    }, [open, onClose]);

    return dialogRef;
  }

  function SupportModal({ open, onClose }) {
    const dialogRef = useDialog(open, onClose);
    if (!open) return null;
    return html`
      <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0" onClick=${onClose} aria-hidden="true"></div>
        <div ref=${dialogRef} role="dialog" aria-modal="true" aria-labelledby="support-modal-title" aria-describedby="support-modal-copy" tabIndex="-1" className="relative z-10 w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rust">Reader support</p>
              <h2 id="support-modal-title" className="mt-3 text-3xl font-serif text-ink">Back the next investigation</h2>
              <p id="support-modal-copy" className="mt-3 text-sm leading-7 text-slate-600">Groundwork accepts monthly and one-time contributions that fund records requests, satellite analysis, and local reporting partnerships.</p>
            </div>
            <button type="button" onClick=${onClose} className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" aria-label="Close support dialog">Close</button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            ${[7, 20, 50].map((amount) => html`
              <button type="button" key=${amount} onClick=${() => announce(`Selected ${amount} dollar support option.`)} className="focus-ring rounded-[1.5rem] border border-slate-200 p-4 text-left">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-moss">Suggested</span>
                <span className="mt-2 block text-2xl font-serif text-ink">$${amount}</span>
                <span className="mt-2 block text-sm text-slate-600">Supports document review and field reporting.</span>
              </button>
            `)}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="./support.html" className="focus-ring rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">Go to support page</a>
            <button type="button" onClick=${onClose} className="focus-ring rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Keep reading</button>
          </div>
        </div>
      </div>
    `;
  }

  function CookieBanner() {
    const [visible, setVisible] = useState(true);
    if (!visible) return null;
    return html`
      <div className="cookie-banner fixed bottom-4 left-4 right-4 z-40 rounded-[1.75rem] text-white shadow-2xl lg:left-auto lg:max-w-xl">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Cookie choices</h2>
            <p className="mt-2 text-sm leading-6 text-slate-200">We use analytics to understand how readers move through investigations. Essential reading access works whether you accept or dismiss this banner.</p>
          </div>
          <div className="flex gap-3">
            <button type="button" className="focus-ring rounded-full border border-white/30 px-4 py-2 text-sm font-semibold" onClick=${() => {
              setVisible(false);
              announce("Cookie banner dismissed.");
            }}>Dismiss</button>
            <button type="button" className="focus-ring rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink" onClick=${() => {
              setVisible(false);
              announce("Analytics cookies accepted.");
            }}>Accept</button>
          </div>
        </div>
      </div>
    `;
  }

  function Header({ currentPath }) {
    const [paused, setPaused] = useState(false);
    const items = [
      "Breaking: EPA memo shows drought aid backlog in seven western states",
      "New: Satellite imagery expands Groundwork aquifer loss map to 112 counties",
      "Live briefing at 4 PM ET: Carbon market oversight hearing",
    ];

    return html`
      <div className="sticky-shell border-b border-[rgba(15,23,32,0.08)] bg-white/95 backdrop-blur-xl">
        <div className="news-band border-b border-[rgba(15,23,32,0.08)]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:px-8">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-rust px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">Breaking</span>
              <button
                type="button"
                aria-pressed=${paused}
                aria-label=${paused ? "Resume breaking news ticker" : "Pause breaking news ticker"}
                onClick=${() => {
                  const next = !paused;
                  setPaused(next);
                  announce(`Breaking news ticker ${next ? "paused" : "resumed"}.`);
                }}
                className="focus-ring rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
              >
                ${paused ? "Resume" : "Pause"}
              </button>
            </div>
            <div className="overflow-hidden" aria-label="Breaking news headlines">
              <div className=${`ticker-track ${paused ? "paused" : ""}`}>
                ${items.concat(items).map((item, index) => html`<span key=${`${item}-${index}`} className="text-sm font-medium text-slate-700">${item}</span>`)}
              </div>
              ${paused ? html`<p className="mt-2 text-sm text-slate-600">Ticker paused. Headlines remain available as static text.</p>` : null}
            </div>
          </div>
        </div>
        <header className="mx-auto max-w-7xl px-4 py-5 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <a href="./index.html" className="focus-ring rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3" aria-label="Groundwork home">
                <span className="block text-xs font-extrabold uppercase tracking-[0.34em] text-rust">Groundwork</span>
                <span className="mt-1 block text-sm text-slate-600">Investigative climate reporting</span>
              </a>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">Data-driven investigations into climate risk, environmental policy, and the public systems shaping who bears the cost.</p>
            </div>
            <a href="./support.html" className="focus-ring inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">Support our work</a>
          </div>
          <nav aria-label="Primary" className="mt-5 overflow-x-auto">
            <ul className="flex min-w-max items-center gap-2">
              ${navLinks.map((link) => {
                const active = currentPath === link.href;
                return html`
                  <li key=${link.href}>
                    <a href=${link.href} aria-current=${active ? "page" : undefined} className=${`focus-ring inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${active ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-slate-700"}`}>
                      ${link.label}
                    </a>
                  </li>
                `;
              })}
            </ul>
          </nav>
        </header>
      </div>
    `;
  }

  function Footer() {
    return html`
      <footer className="mt-16 border-t border-[rgba(15,23,32,0.08)] bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
          <section aria-labelledby="footer-brand">
            <h2 id="footer-brand" className="text-2xl font-serif">Groundwork</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">Independent journalism focused on climate science, environmental accountability, and the records behind public decisions.</p>
          </section>
          <nav aria-label="Footer navigation">
            <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">Sections</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              ${navLinks.map((link) => html`<li key=${link.href}><a href=${link.href} className="focus-ring rounded hover:text-white">${link.label}</a></li>`)}
            </ul>
          </nav>
          <section aria-labelledby="footer-contact">
            <h2 id="footer-contact" className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">Editorial note</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">Groundwork publishes methodologies, document trails, and contributor disclosures to make every investigation easier to interrogate.</p>
          </section>
        </div>
      </footer>
    `;
  }

  function PageShell({ currentPath, eyebrow, title, description, children }) {
    const [supportOpen, setSupportOpen] = useState(false);
    return html`
      <div className="page-shell">
        <a href="#main-content" className="skip-link focus-ring rounded bg-white px-4 py-2 text-sm font-semibold text-slate-900">Skip to main content</a>
        <${Header} currentPath=${currentPath} />
        <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <section className="grid gap-6 border-b border-[rgba(15,23,32,0.08)] pb-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.34em] text-rust">${eyebrow}</p>
              <h1 className="mt-4 text-4xl font-serif leading-tight text-ink lg:text-6xl">${title}</h1>
            </div>
            <div className="flex flex-col gap-4 lg:items-start">
              <p className="max-w-2xl text-base leading-8 text-slate-600 lg:text-lg">${description}</p>
              <button type="button" onClick=${() => setSupportOpen(true)} className="focus-ring rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">Open support prompt</button>
            </div>
          </section>
          ${children}
        </main>
        <${Footer} />
        <${SupportModal} open=${supportOpen} onClose=${() => setSupportOpen(false)} />
        <${CookieBanner} />
      </div>
    `;
  }

  function TopicNav() {
    return html`
      <nav aria-label="Topic navigation" className="mt-6 overflow-x-auto">
        <ul className="flex min-w-max items-center gap-3">
          ${topicLinks.map((topic) => html`
            <li key=${topic}>
              <a href=${topic === "Climate" ? "./climate.html" : "./index.html"} className="focus-ring rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">${topic}</a>
            </li>
          `)}
        </ul>
      </nav>
    `;
  }

  function StoryCard({ story }) {
    return html`
      <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-moss">${story.tag}</p>
        <h3 className="mt-3 text-2xl font-serif leading-tight text-ink">
          <a href=${story.href} className="focus-ring rounded">${story.title}</a>
        </h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">${story.summary}</p>
        <p className="mt-4 text-sm font-medium text-slate-500">${story.meta || `${story.reporter} · ${story.readTime}`}</p>
      </article>
    `;
  }

  return {
    html,
    announce,
    PageShell,
    StoryCard,
    TopicNav,
    latestInvestigations,
    climateStories,
    opinionPieces,
    keyDocuments,
  };
})();

window.Groundwork = Groundwork;
