const { useEffect, useMemo, useRef, useState } = React;
const html = htm.bind(React.createElement);

const Folia = (() => {
  const toToken = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const navLinks = [
    { href: "./index.html", label: "Feed", shortLabel: "Feed" },
    { href: "./explore.html", label: "Explore", shortLabel: "Explore" },
    { href: "./notifications.html", label: "Notifications", shortLabel: "Alerts" },
    { href: "./messages.html", label: "Messages", shortLabel: "Inbox" },
    { href: "./profile.html", label: "Profile", shortLabel: "Profile" },
    { href: "./settings.html", label: "Settings", shortLabel: "Settings" },
  ];

  const posts = [
    {
      id: "solstice",
      creator: "Maya Lin",
      handle: "@mayadraws",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
      discipline: "Illustration",
      title: "Solstice III",
      caption: "Color roughs for a summer poster series. I’m pressure-testing grain textures before I commit to finals.",
      image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80",
      alt: "Painterly orange and teal illustration drafts pinned to a studio wall",
      tags: ["#illustration", "#procreate", "#posterdesign"],
      appreciates: 42,
      comments: 11,
      shares: 5,
      collections: 19,
      views: "18.4K",
      time: "12m ago",
      followState: false,
    },
    {
      id: "quiet-frame",
      creator: "Noah Vega",
      handle: "@noahvega",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
      discipline: "Photography",
      title: "Quiet Frame Study",
      caption: "Pulling contrast back so the signage glow feels earned. Curious whether the crop should stay asymmetrical.",
      image: "https://images.unsplash.com/photo-1494256997604-768d1f608cac?auto=format&fit=crop&w=1200&q=80",
      alt: "Nighttime street photograph with neon signage and a cyclist passing by",
      tags: ["#photography", "#street", "#colorgrading"],
      appreciates: 67,
      comments: 23,
      shares: 9,
      collections: 31,
      views: "24.9K",
      time: "39m ago",
      followState: true,
    },
    {
      id: "kinetic-loop",
      creator: "Taro West",
      handle: "@tarowest",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80",
      discipline: "Motion",
      title: "Kinetic Type Loop",
      caption: "Muted motion test for a title card package. Playback stays subtle to avoid aggressive flashing.",
      video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      poster: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      alt: "Preview still of abstract petals used as a motion background",
      tags: ["#motion", "#typography", "#aftereffects"],
      appreciates: 28,
      comments: 8,
      shares: 4,
      collections: 12,
      views: "9.2K",
      time: "1h ago",
      followState: false,
    },
  ];

  const exploreTiles = [
    { medium: "Digital Art", creator: "Lena Ortiz", appreciates: 210, image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80" },
    { medium: "Photography", creator: "Rin Park", appreciates: 184, image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80" },
    { medium: "Typography", creator: "Milo Hayes", appreciates: 143, image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80" },
    { medium: "3D", creator: "Ari Bloom", appreciates: 126, image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=80" },
    { medium: "Motion", creator: "Sachi Yu", appreciates: 171, image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80" },
    { medium: "Digital Art", creator: "Hana Seo", appreciates: 198, image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=80" },
  ];

  const risingCreators = [
    { name: "Hana Seo", specialty: "Editorial collage", badge: "14.2K appreciations this week" },
    { name: "Dev Malik", specialty: "Analog portraiture", badge: "Booked 3 collaborations" },
    { name: "Tess Mora", specialty: "Type systems", badge: "Featured in 6 collections" },
  ];

  const palettes = [
    ["#20394d", "#3e6b72", "#f0ba8f", "#f6e7d8"],
    ["#2d1e2f", "#88536f", "#d7a39d", "#f6dccb"],
    ["#1f4336", "#4f7f72", "#d1b783", "#f0ece3"],
  ];

  const notificationGroups = {
    Activity: [
      { text: "Hana appreciated your piece 'Solstice III' · 4h", thumb: posts[0].image },
      { text: "Noah collected 'Quiet Frame Study' into Night Walks · 7h", thumb: posts[1].image },
      { text: "Taro followed your typography board · 1d", thumb: posts[2].poster },
    ],
    "Feedback Requests": [
      { text: "Dev asked for crop feedback on 'Metro Echoes' · 2h", thumb: posts[1].image },
      { text: "Rin requested notes on color balance for 'After Rain' · 9h", thumb: posts[0].image },
    ],
    Collections: [
      { text: "'Solstice III' was added to Warm Futures · 5h", thumb: posts[0].image },
      { text: "'Quiet Frame Study' was saved to Low Light Studies · 12h", thumb: posts[1].image },
    ],
  };

  const threads = [
    {
      id: "studio-sprint",
      name: "Studio Sprint",
      preview: "Palette pass looks stronger with the muted coral.",
      unread: 2,
      participants: "Maya, Hana, Tess",
      messages: [
        { id: 1, author: "Hana", time: "9:14 AM", text: "Uploaded the revised crop with more breathing room on the right edge." },
        { id: 2, author: "You", time: "9:18 AM", text: "The spacing helps. I’d keep the coral in the secondary type only." },
        { id: 3, author: "Hana", time: "9:20 AM", image: posts[0].image, alt: "Shared work in progress collage titled Solstice III" },
      ],
      readReceipt: "Seen by Hana 2m ago",
    },
    {
      id: "noah-dm",
      name: "Noah Vega",
      preview: "Want to trade notes on the night series?",
      unread: 1,
      participants: "Direct message",
      messages: [
        { id: 1, author: "Noah", time: "Yesterday", text: "Want to trade notes on the night series?" },
        { id: 2, author: "You", time: "Yesterday", text: "Yes. Send the newest crop and I’ll annotate it tonight." },
      ],
      readReceipt: "Delivered",
    },
  ];

  const featuredWorks = [
    { title: "Solstice III", views: "18.4K", appreciates: 842, image: posts[0].image },
    { title: "Paper Garden", views: "11.2K", appreciates: 654, image: "https://images.unsplash.com/photo-1515405295579-ba7b45403062?auto=format&fit=crop&w=1200&q=80" },
    { title: "Low Light Notes", views: "9.8K", appreciates: 491, image: posts[1].image },
  ];

  function announce(message, politeness = "polite") {
    const region = document.getElementById("global-live-region");
    if (!region) return;
    region.setAttribute("aria-live", politeness);
    region.textContent = "";
    window.setTimeout(() => {
      region.textContent = message;
    }, 40);
  }

  function useDialog(open, onClose) {
    const dialogRef = useRef(null);
    const lastFocused = useRef(null);

    useEffect(() => {
      if (!open) return undefined;
      lastFocused.current = document.activeElement;
      const node = dialogRef.current;
      if (!node) return undefined;
      const focusable = node.querySelectorAll('button,[href],input,textarea,select,[tabindex]:not([tabindex="-1"])');
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

        if (event.key === "Tab" && focusable.length) {
          const items = Array.from(focusable);
          const first = items[0];
          const last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      };

      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        if (lastFocused.current && typeof lastFocused.current.focus === "function") {
          lastFocused.current.focus();
        }
      };
    }, [open, onClose]);

    return dialogRef;
  }

  function Modal({ open, title, description, onClose, children }) {
    const dialogRef = useDialog(open, onClose);
    if (!open) return null;

    return html`
      <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0" onClick=${onClose} aria-hidden="true"></div>
        <div ref=${dialogRef} role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description" tabIndex="-1" className="glass-panel relative z-10 w-full max-w-lg rounded-[2rem] border border-white/60 p-6 shadow-2xl shadow-slate-900/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="dialog-title" className="text-2xl font-semibold text-slate-950">${title}</h2>
              <p id="dialog-description" className="mt-2 text-sm leading-6 text-slate-600">${description}</p>
            </div>
            <button type="button" className="focus-ring rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700" onClick=${onClose} aria-label=${`Close ${title} dialog`}>
              Close
            </button>
          </div>
          <div className="mt-6">${children}</div>
        </div>
      </div>
    `;
  }

  function Header({ currentPath }) {
    return html`
      <header className="glass-panel sticky top-0 z-40 border-b border-white/70">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-4 lg:px-8">
          <a href="./index.html" className="focus-ring flex items-center gap-3 rounded-full border border-white/80 bg-white/90 px-4 py-2" aria-label="Folia home">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900 text-sm font-semibold tracking-[0.2em] text-white">FO</span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.3em] text-emerald-800">Folia</span>
              <span className="block text-sm text-slate-600">Creative community</span>
            </span>
          </a>
          <div className="hidden flex-1 lg:flex">
            <label className="relative ml-6 block w-full max-w-xl">
              <span className="sr-only">Search Folia posts and creators</span>
              <input type="search" className="focus-ring w-full rounded-full border border-white/80 bg-white/85 px-5 py-3 text-sm text-slate-900 placeholder:text-slate-500" placeholder="Search sketches, palettes, creators, tools..." aria-label="Search Folia posts and creators" />
            </label>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button type="button" className="focus-ring rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700" aria-label="Open quick composer">
              New post
            </button>
            <a href="./profile.html" className="focus-ring rounded-full border border-white/80 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700" aria-label="Open your profile">
              Your folio
            </a>
          </div>
        </div>
        <nav aria-label="Mobile primary" className="border-t border-white/70 px-4 py-3 lg:hidden">
          <ul className="flex flex-wrap gap-2">
            ${navLinks.map((link) => html`
              <li key=${link.href}>
                <a href=${link.href} aria-current=${currentPath === link.href ? "page" : undefined} className=${`focus-ring rounded-full px-3 py-2 text-sm font-medium ${currentPath === link.href ? "bg-slate-900 text-white" : "bg-white/85 text-slate-700"}`}>
                  ${link.shortLabel}
                </a>
              </li>
            `)}
          </ul>
        </nav>
      </header>
    `;
  }

  function SidebarNav({ currentPath }) {
    return html`
      <aside className="sidebar-scroll hidden lg:sticky lg:top-28 lg:block lg:h-[calc(100vh-8rem)]">
        <nav aria-label="Primary" className="glass-panel rounded-[2rem] border border-white/70 p-4 shadow-xl shadow-slate-200/60">
          <ul className="space-y-2">
            ${navLinks.map((link) => html`
              <li key=${link.href}>
                <a href=${link.href} aria-current=${currentPath === link.href ? "page" : undefined} className=${`focus-ring flex items-center justify-between rounded-[1.25rem] px-4 py-3 text-sm font-medium ${currentPath === link.href ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-white/80"}`}>
                  <span>${link.label}</span>
                  <span className=${currentPath === link.href ? "text-emerald-200" : "text-slate-400"}>${currentPath === link.href ? "●" : "○"}</span>
                </a>
              </li>
            `)}
          </ul>
        </nav>
      </aside>
    `;
  }

  function RightRail({ children, title }) {
    return html`
      <aside aria-labelledby="rail-title" className="space-y-6">
        <div className="glass-panel rounded-[2rem] border border-white/70 p-5 shadow-xl shadow-slate-200/60">
          <h2 id="rail-title" className="text-lg font-semibold text-slate-950">${title}</h2>
          <div className="mt-4 space-y-4">${children}</div>
        </div>
      </aside>
    `;
  }

  function PageShell({ currentPath, title, description, kicker, rightRail, children }) {
    return html`
      <div className="page-shell">
        <a href="#main-content" className="focus-ring sr-only rounded bg-white px-4 py-2 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">Skip to main content</a>
        <${Header} currentPath=${currentPath} />
        <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 lg:grid-cols-[250px_minmax(0,1fr)_320px] lg:px-8">
          <${SidebarNav} currentPath=${currentPath} />
          <main id="main-content" className="min-w-0">
            <section className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-800">${kicker}</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 lg:text-5xl">${title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 lg:text-lg">${description}</p>
            </section>
            ${children}
          </main>
          <div className="hidden lg:block">${rightRail}</div>
        </div>
      </div>
    `;
  }

  function FeedTabs() {
    const [active, setActive] = useState("For You");
    return html`
      <div>
        <div role="tablist" aria-label="Feed options" className="inline-flex rounded-full border border-white/80 bg-white/90 p-1 shadow-sm">
          ${["For You", "Following"].map((tab) => {
            const token = toToken(tab);
            return html`
            <button
              key=${tab}
              type="button"
              role="tab"
              id=${`feed-tab-${token}`}
              aria-selected=${active === tab}
              aria-controls=${`feed-panel-${token}`}
              tabIndex=${active === tab ? 0 : -1}
              className=${`focus-ring rounded-full px-4 py-2 text-sm font-medium ${active === tab ? "bg-slate-900 text-white" : "text-slate-600"}`}
              onClick=${() => setActive(tab)}
            >
              ${tab}
            </button>
          `})}
        </div>
        <p id=${`feed-panel-${toToken(active)}`} role="tabpanel" aria-labelledby=${`feed-tab-${toToken(active)}`} className="mt-3 text-sm text-slate-500">
          ${active === "For You" ? "Fresh work-in-progress from creators aligned with your saved mediums." : "Latest updates from the artists and studios you follow."}
        </p>
      </div>
    `;
  }

  function Composer() {
    const [caption, setCaption] = useState("");
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState("🎨");
    const limit = 280;
    const warningId = "composer-warning";

    useEffect(() => {
      if (limit - caption.length <= 30) {
        announce(`${limit - caption.length} characters remaining in caption composer.`);
      }
    }, [caption.length]);

    return html`
      <section aria-labelledby="composer-heading" className="glass-panel rounded-[2rem] border border-white/70 p-5 shadow-xl shadow-slate-200/60">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="composer-heading" className="text-2xl font-semibold text-slate-950">Share Your Work</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Post roughs, color studies, or in-progress frames and invite critique from your Folia circle.</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-900">WIP friendly</span>
        </div>
        <div className="mt-5 grid gap-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Caption</span>
            <textarea
              value=${caption}
              onInput=${(event) => setCaption(event.target.value)}
              maxLength=${limit}
              aria-describedby=${warningId}
              className="focus-ring min-h-[132px] w-full rounded-[1.5rem] border border-slate-200 bg-white/90 px-4 py-3 text-sm leading-6 text-slate-900 placeholder:text-slate-500"
              placeholder="What are you exploring in this draft?"
            />
          </label>
          <div id=${warningId} aria-live="polite" className="text-sm text-slate-500">
            ${limit - caption.length <= 30 ? `${limit - caption.length} characters remaining.` : `Up to ${limit} characters.`}
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Add skills</span>
            <input type="text" defaultValue="#illustration #procreate" className="focus-ring w-full rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900" aria-label="Add skills tags for your post" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
              <input type="file" className="sr-only" aria-label="Upload media for your post" />
              <span>Upload media</span>
            </label>
            <div className="relative">
              <button type="button" className="focus-ring rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700" aria-expanded=${emojiOpen} aria-controls="emoji-menu" onClick=${() => setEmojiOpen((value) => !value)}>
                ${selectedEmoji} Emoji
              </button>
              ${emojiOpen ? html`
                <div id="emoji-menu" role="menu" className="absolute left-0 top-[calc(100%+0.5rem)] z-20 flex gap-2 rounded-2xl border border-white/80 bg-white p-3 shadow-xl">
                  ${["🎨", "📷", "✨"].map((emoji) => html`
                    <button
                      key=${emoji}
                      type="button"
                      role="menuitem"
                      className="focus-ring rounded-xl bg-slate-100 px-3 py-2 text-xl"
                      onClick=${() => {
                        setSelectedEmoji(emoji);
                        setEmojiOpen(false);
                      }}
                      aria-label=${`Insert ${emoji} emoji into composer`}
                    >
                      ${emoji}
                    </button>
                  `)}
                </div>
              ` : null}
            </div>
            <button type="button" className="focus-ring rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white" onClick=${() => announce("Draft shared to your Folia feed.")}>
              Publish draft
            </button>
          </div>
        </div>
      </section>
    `;
  }

  function PostCard({ post }) {
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [following, setFollowing] = useState(post.followState);
    const [menuOpen, setMenuOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
      if (!menuOpen) return undefined;
      const onClick = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setMenuOpen(false);
        }
      };
      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          setMenuOpen(false);
        }
      };
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("mousedown", onClick);
        document.removeEventListener("keydown", onKeyDown);
      };
    }, [menuOpen]);

    const detailId = `post-${post.id}-heading`;

    return html`
      <article className="glass-panel rounded-[2rem] border border-white/70 shadow-xl shadow-slate-200/60">
        <div className="flex items-start justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <img src=${post.avatar} alt=${`${post.creator} avatar`} className="h-12 w-12 rounded-full object-cover" />
            <div>
              <p className="text-sm font-semibold text-slate-950">${post.creator}</p>
              <p className="text-sm text-slate-500">${post.handle} · ${post.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">${post.discipline}</span>
            <button
              type="button"
              className="focus-ring rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              aria-pressed=${following}
              aria-label=${`${following ? "Following" : "Follow"} ${post.creator}`}
              onClick=${() => {
                const next = !following;
                setFollowing(next);
                announce(`${next ? "Following" : "Unfollowed"} ${post.creator}.`);
              }}
            >
              ${following ? "Following" : "Follow"}
            </button>
            <div className="relative" ref=${menuRef}>
              <button
                type="button"
                className="focus-ring rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                aria-haspopup="menu"
                aria-expanded=${menuOpen}
                aria-controls=${`post-menu-${post.id}`}
                onClick=${() => setMenuOpen((value) => !value)}
                onKeyDown=${(event) => {
                  if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setMenuOpen(true);
                  }
                }}
                aria-label=${`Open options for post by ${post.handle}`}
              >
                ...
              </button>
              ${menuOpen ? html`
                <div id=${`post-menu-${post.id}`} role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-48 rounded-2xl border border-white/80 bg-white p-2 shadow-xl">
                  <button type="button" role="menuitem" className="focus-ring block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" onClick=${() => {
                    setDetailOpen(true);
                    setMenuOpen(false);
                  }}>
                    Open detail
                  </button>
                  <button type="button" role="menuitem" className="focus-ring block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" onClick=${() => {
                    setReportOpen(true);
                    setMenuOpen(false);
                  }}>
                    Report user
                  </button>
                  <button type="button" role="menuitem" className="focus-ring block w-full rounded-xl px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50" onClick=${() => {
                    setDeleteOpen(true);
                    setMenuOpen(false);
                  }}>
                    Delete saved draft
                  </button>
                </div>
              ` : null}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5">
          <h2 id=${detailId} className="text-2xl font-semibold text-slate-950">${post.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">${post.caption}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            ${post.tags.map((tag) => html`<span key=${tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">${tag}</span>`)}
          </div>
        </div>
        <div className="overflow-hidden">
          <button type="button" className="focus-ring block w-full text-left" onClick=${() => setDetailOpen(true)} aria-label=${`Open detail for ${post.title} by ${post.handle}`}>
          ${post.video ? html`
            <video src=${post.video} poster=${post.poster} muted autoPlay loop controls className="h-[420px] w-full object-cover" aria-label=${`${post.title} motion preview by ${post.creator}`}></video>
          ` : html`
            <img src=${post.image} alt=${post.alt} className="h-[420px] w-full object-cover" />
          `}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              aria-pressed=${liked}
              aria-label=${`${liked ? "Unlike" : "Like"} post by ${post.handle} currently ${post.appreciates + (liked ? 1 : 0)} likes`}
              onClick=${() => {
                const next = !liked;
                setLiked(next);
                announce(`${next ? "Appreciated" : "Removed appreciation from"} ${post.title}.`);
              }}
            >
              Appreciate ${post.appreciates + (liked ? 1 : 0)}
            </button>
            <button type="button" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" aria-label=${`Comment on post by ${post.handle} with ${post.comments} comments`} onClick=${() => announce(`Comment field for ${post.title} would open here.`)}>
              Comment ${post.comments}
            </button>
            <button type="button" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" aria-label=${`Share post by ${post.handle} with ${post.shares} shares`} onClick=${() => announce(`${post.title} copied to your share clipboard.`)}>
              Share ${post.shares}
            </button>
            <button
              type="button"
              className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              aria-pressed=${saved}
              aria-label=${`${saved ? "Remove" : "Bookmark"} post by ${post.handle} currently collected ${post.collections} times`}
              onClick=${() => {
                const next = !saved;
                setSaved(next);
                announce(`${post.title} ${next ? "saved to" : "removed from"} your collection.`);
              }}
            >
              Collect ${post.collections + (saved ? 1 : 0)}
            </button>
          </div>
          <p className="text-sm text-slate-500">${post.views} views</p>
        </div>
        <${Modal}
          open=${detailOpen}
          title=${post.title}
          description=${`Post detail for ${post.creator}. Focus moves here when opened and returns to the trigger on close.`}
          onClose=${() => setDetailOpen(false)}
        >
          <div className="space-y-4">
            ${post.video ? html`<video src=${post.video} poster=${post.poster} muted controls className="w-full rounded-[1.5rem]" aria-label=${`${post.title} playback in detail dialog`}></video>` : html`<img src=${post.image} alt=${post.alt} className="w-full rounded-[1.5rem] object-cover" />`}
            <p className="text-sm leading-7 text-slate-600">${post.caption}</p>
            <button type="button" className="focus-ring rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick=${() => setDetailOpen(false)}>
              Close detail
            </button>
          </div>
        <//>
        <${Modal}
          open=${reportOpen}
          title="Report user"
          description=${`Report ${post.creator} if this post violates community guidelines.`}
          onClose=${() => setReportOpen(false)}
        >
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Reason
              <select className="focus-ring mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                <option>Spam or misleading promotion</option>
                <option>Harassment</option>
                <option>Inappropriate content</option>
              </select>
            </label>
            <div className="flex gap-3">
              <button type="button" className="focus-ring rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick=${() => {
                announce(`Report submitted for ${post.creator}.`);
                setReportOpen(false);
              }}>
                Submit report
              </button>
              <button type="button" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" onClick=${() => setReportOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        <//>
        <${Modal}
          open=${deleteOpen}
          title="Delete post draft"
          description="This removes the draft from your saved queue."
          onClose=${() => setDeleteOpen(false)}
        >
          <div className="flex gap-3">
            <button type="button" className="focus-ring rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white" onClick=${() => {
              announce(`${post.title} draft deleted.`);
              setDeleteOpen(false);
            }}>
              Delete draft
            </button>
            <button type="button" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" onClick=${() => setDeleteOpen(false)}>
              Cancel
            </button>
          </div>
        <//>
      </article>
    `;
  }

  function NotificationTabs() {
    const labels = Object.keys(notificationGroups);
    const [active, setActive] = useState(labels[0]);
    const [counts, setCounts] = useState(
      Object.fromEntries(labels.map((label) => [label, notificationGroups[label].length]))
    );
    const items = notificationGroups[active].slice(0, counts[active]);
    return html`
      <section aria-labelledby="notifications-heading" className="glass-panel rounded-[2rem] border border-white/70 p-5 shadow-xl shadow-slate-200/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="notifications-heading" className="text-2xl font-semibold text-slate-950">Notification Stream</h2>
          <button
            type="button"
            className="focus-ring rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            onClick=${() => {
              const nextCount = 0;
              setCounts((value) => ({ ...value, [active]: nextCount }));
              announce(`${active} notifications cleared. ${nextCount} unread remaining.`);
            }}
          >
            Mark ${active} read
          </button>
        </div>
        <div role="tablist" aria-label="Notification categories" className="mt-5 flex flex-wrap gap-2">
          ${labels.map((label) => {
            const token = toToken(label);
            return html`
            <button
              key=${label}
              type="button"
              role="tab"
              id=${`tab-${token}`}
              aria-selected=${active === label}
              aria-controls=${`panel-${token}`}
              tabIndex=${active === label ? 0 : -1}
              className=${`focus-ring rounded-full px-4 py-2 text-sm font-medium ${active === label ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
              onClick=${() => setActive(label)}
            >
              ${label} (${counts[label]})
            </button>
          `})}
        </div>
        <div id=${`panel-${toToken(active)}`} role="tabpanel" aria-labelledby=${`tab-${toToken(active)}`} className="mt-5 space-y-3">
          ${items.length ? items.map((item) => html`
            <article key=${item.text} className="flex items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-white/90 p-4">
              <img src=${item.thumb} alt="" className="h-16 w-16 rounded-2xl object-cover" />
              <p className="text-sm leading-6 text-slate-700">${item.text}</p>
            </article>
          `) : html`
            <p className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-500">
              No unread ${active.toLowerCase()} notifications.
            </p>
          `}
        </div>
      </section>
    `;
  }

  return {
    html,
    announce,
    navLinks,
    posts,
    exploreTiles,
    risingCreators,
    palettes,
    threads,
    featuredWorks,
    PageShell,
    RightRail,
    FeedTabs,
    Composer,
    PostCard,
    NotificationTabs,
  };
})();

window.Folia = Folia;
