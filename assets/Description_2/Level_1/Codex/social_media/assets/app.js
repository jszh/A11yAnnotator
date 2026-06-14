const { createElement: h, Fragment } = React;
const root = ReactDOM.createRoot(document.getElementById("root"));
const currentPage = window.FOLIA_PAGE || "feed";

const navItems = [
  { key: "feed", label: "Feed", href: "./index.html", icon: "home" },
  { key: "explore", label: "Explore", href: "./explore.html", icon: "compass" },
  { key: "notifications", label: "Notifications", href: "./notifications.html", icon: "bell" },
  { key: "messages", label: "Messages", href: "./messages.html", icon: "message" },
  { key: "profile", label: "Profile", href: "./profile.html", icon: "user" },
  { key: "settings", label: "Settings", href: "./settings.html", icon: "settings" },
];

const feedPosts = [
  {
    creator: "Lina Vale",
    handle: "@linavale",
    discipline: "Illustration",
    time: "18m ago",
    title: "Solstice III",
    copy: "Pushing the lighting on this poster series before I lock the final print palette. Looking for feedback on the warmth around the shadow edges.",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80",
    alt: "Warm-toned abstract illustration with layered sun shapes and textured gradients",
    appreciate: 184,
    collect: 62,
    comment: 19,
  },
  {
    creator: "Mika Ren",
    handle: "@mikaren",
    discipline: "Photography",
    time: "52m ago",
    title: "Rain Study, Contact Sheet",
    copy: "Shot on 35mm during last night's storm walk. I kept the frame edges rough to preserve the feeling of movement through the city.",
    image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80",
    alt: "Photographic study of a rainy street with reflective pavement and blurred lights",
    appreciate: 231,
    collect: 88,
    comment: 27,
  },
  {
    creator: "Tomo Faye",
    handle: "@tomofaye",
    discipline: "Typography",
    time: "1h ago",
    title: "Atlas Wordmark Iterations",
    copy: "Trying to balance the wide counters with a calmer rhythm on the tail. Which direction feels strongest for an editorial identity?",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    alt: "Typography sketchbook with black-and-white wordmark iterations and pencil annotations",
    appreciate: 142,
    collect: 41,
    comment: 33,
  },
];

const exploreTiles = [
  { medium: "Digital Art", creator: "Nia Soto", appreciates: 312, image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80", alt: "Digital painting workspace on a tablet with stylus and color tools" },
  { medium: "Photography", creator: "Ari Mendoza", appreciates: 267, image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80", alt: "Portrait photography composition with camera and printed contact sheets" },
  { medium: "Typography", creator: "Elle Thorn", appreciates: 198, image: "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=900&q=80", alt: "Desktop layout with typographic posters and letterform studies" },
  { medium: "3D", creator: "Kenji Lo", appreciates: 354, image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80", alt: "3D modeling scene displayed on dual monitors in a creative studio" },
  { medium: "Motion", creator: "Sahar Bloom", appreciates: 176, image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80", alt: "Motion design timeline and animated frame previews on a laptop screen" },
  { medium: "Photography", creator: "Jun Park", appreciates: 224, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80", alt: "Landscape photography scene with layered mountains during golden hour" },
];

const risingCreators = [
  { name: "Hana Noor", field: "Mixed Media", stat: "4.8k appreciations this week" },
  { name: "Dev Aster", field: "3D Environments", stat: "12 collections on latest process dump" },
  { name: "Sumi Hall", field: "Editorial Photography", stat: "Featured in 3 Folia roundups" },
];

const palettes = [
  { name: "After Rain", colors: ["#173753", "#2F6690", "#7EA8BE", "#D9E6F2"] },
  { name: "Studio Clay", colors: ["#4B2E2B", "#8D5B4C", "#C58C6D", "#F2D7C9"] },
  { name: "Moss Light", colors: ["#1F3C34", "#567C5E", "#94B49F", "#E4EFE7"] },
];

const notifications = {
  activity: [
    { text: "Hana appreciated your piece 'Solstice III'", time: "4h", thumb: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=300&q=80", alt: "Thumbnail of abstract illustration with layered sun shapes" },
    { text: "Ari commented on 'Rain Study, Contact Sheet'", time: "7h", thumb: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=300&q=80", alt: "Thumbnail of rainy street photography study" },
    { text: "Your process post was saved to 12 collections", time: "1d", thumb: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=300&q=80", alt: "Thumbnail of typography sketchbook layout" },
  ],
  feedback: [
    { text: "Kei requested paintover feedback on 'Harbor Night'", time: "38m", thumb: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=300&q=80", alt: "Thumbnail of painterly harbor scene at night" },
    { text: "Studio Orbit invited you into a critique circle", time: "3h", thumb: "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=300&q=80", alt: "Thumbnail of design review boards with type studies" },
  ],
  collections: [
    { text: "Your photo essay was added to 'Quiet Color References'", time: "2h", thumb: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=80", alt: "Thumbnail of atmospheric mountain landscape" },
    { text: "Jun collected 'Atlas Wordmark Iterations'", time: "9h", thumb: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=300&q=80", alt: "Thumbnail of wordmark exploration on paper" },
  ],
};

const threads = [
  { name: "Northlight Zine", type: "Collaboration", preview: "Can you drop the latest spread mockup here?", unread: 2 },
  { name: "Hana Noor", type: "Direct Message", preview: "I loved the texture pass on slide 3.", unread: 0 },
  { name: "Palette Club", type: "Group", preview: "Weekly swatch prompt goes live at 6 PM.", unread: 5 },
  { name: "Ari Mendoza", type: "Direct Message", preview: "Shared a new frame reference.", unread: 1 },
];

const conversation = [
  { from: "Hana Noor", side: "left", text: "That new contrast pass fixed the focal point. Did you settle on the print texture?" },
  { from: "You", side: "right", text: "Almost. I uploaded the rough export with grain applied at 18%. Curious if it still feels too digital." },
  { from: "You", side: "right", image: "https://images.unsplash.com/photo-1513364776144-60967b0c78f?auto=format&fit=crop&w=900&q=80", alt: "Preview image of poster artwork with warm gradients and grain texture" },
  { from: "Hana Noor", side: "left", text: "The grain sits well. I'd just soften the inner orange halo a bit. Seen at 2:14 PM." },
];

const profileProjects = [
  { title: "Solstice III", views: "12.4k", appreciates: 841, image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80", alt: "Abstract illustration poster with warm geometric shapes" },
  { title: "Station Notes", views: "8.1k", appreciates: 492, image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80", alt: "Moody street photograph with reflected neon lights" },
  { title: "Atlas", views: "10.7k", appreciates: 617, image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80", alt: "Typography experiments on a notebook page" },
  { title: "Signal Forms", views: "6.2k", appreciates: 388, image: "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=900&q=80", alt: "Design board featuring modular type and editorial compositions" },
  { title: "Quiet Field", views: "7.5k", appreciates: 455, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80", alt: "Landscape photo with layered mountains and soft mist" },
  { title: "Depth Pass", views: "5.8k", appreciates: 301, image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80", alt: "3D scene development shown on a monitor in a dark studio" },
];

function icon(name, className = "h-5 w-5") {
  const common = { "aria-hidden": "true", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "strokeWidth": "1.8", className };
  const paths = {
    home: [h("path", { d: "M3 10.5 12 3l9 7.5" }), h("path", { d: "M5 9.5V21h14V9.5" })],
    compass: [h("circle", { cx: "12", cy: "12", r: "8" }), h("path", { d: "m10 14 4-4-1 5-5 1 2-2Z" })],
    bell: [h("path", { d: "M6 10a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7" }), h("path", { d: "M10 20a2 2 0 0 0 4 0" })],
    message: [h("path", { d: "M4 6h16v10H8l-4 4V6Z" })],
    user: [h("circle", { cx: "12", cy: "8", r: "4" }), h("path", { d: "M5 20a7 7 0 0 1 14 0" })],
    settings: [h("path", { d: "M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z" }), h("path", { d: "M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" })],
    spark: [h("path", { d: "m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" })],
    upload: [h("path", { d: "M12 16V6" }), h("path", { d: "m8 10 4-4 4 4" }), h("path", { d: "M4 18v2h16v-2" })],
    search: [h("circle", { cx: "11", cy: "11", r: "7" }), h("path", { d: "m20 20-3.5-3.5" })],
    heart: [h("path", { d: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" })],
    bookmark: [h("path", { d: "M7 4h10v16l-5-3-5 3V4Z" })],
    comment: [h("path", { d: "M5 6h14v9H9l-4 4V6Z" })],
    send: [h("path", { d: "M3 11.5 20 4l-4.5 16-4-5-5 1.5L3 11.5Z" })],
  };
  return h("svg", common, paths[name]);
}

function NavLink({ item, compact = false }) {
  const active = item.key === currentPage;
  return h(
    "a",
    {
      href: item.href,
      "aria-current": active ? "page" : undefined,
      className: `focus-ring ${active ? "nav-active" : "text-slate-700 hover:bg-white"} ${compact ? "flex min-w-[4.5rem] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold" : "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold"}`
    },
    icon(item.icon, compact ? "h-5 w-5" : "h-5 w-5"),
    h("span", null, item.label)
  );
}

function Sidebar() {
  return h(
    "aside",
    { className: "glass-panel soft-shadow hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-[2rem] border border-white/70 p-6 lg:flex" },
    h("a", { href: "./index.html", className: "focus-ring rounded-2xl" },
      h("div", { className: "flex items-center gap-4" },
        h("div", { className: "flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white" }, "F"),
        h("div", null,
          h("p", { className: "font-display text-2xl font-semibold text-slate-950" }, "Folia"),
          h("p", { className: "text-sm text-slate-600" }, "Creative community platform")
        )
      )
    ),
    h("nav", { "aria-label": "Primary", className: "mt-8 flex flex-col gap-2" }, navItems.map((item) => h(NavLink, { key: item.key, item }))),
    h("section", { className: "mt-8 rounded-[1.75rem] bg-slate-950 p-5 text-white" },
      h("div", { className: "flex items-center gap-2 text-teal-300" }, icon("spark"), h("p", { className: "text-sm font-semibold uppercase tracking-[0.18em]" }, "Creative Prompt")),
      h("p", { className: "mt-4 text-lg font-semibold" }, "Document one unfinished detail before you publish today."),
      h("a", { href: "./explore.html", className: "focus-ring mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950" }, "See inspiration")
    ),
    h("section", { className: "mt-6 rounded-[1.75rem] border border-slate-200 bg-white/80 p-5" },
      h("p", { className: "text-sm font-semibold text-slate-500" }, "Current moodboard"),
      h("p", { className: "mt-2 text-xl font-semibold text-slate-900" }, "Quiet Grain"),
      h("p", { className: "mt-2 text-sm text-slate-600" }, "Saved references from illustration, still life, and contact-sheet photography.")
    )
  );
}

function MobileNav() {
  return h(
    "nav",
    { "aria-label": "Mobile primary", className: "glass-panel mobile-nav-safe fixed inset-x-3 bottom-3 z-40 rounded-[1.75rem] border border-white/70 px-3 py-2 shadow-2xl lg:hidden" },
    h("div", { className: "flex items-center justify-between gap-1 overflow-x-auto" }, navItems.map((item) => h(NavLink, { key: item.key, item, compact: true })))
  );
}

function TopBar({ title, subtitle, actions }) {
  return h(
    "header",
    { className: "glass-panel soft-shadow rounded-[2rem] border border-white/70 px-5 py-5 sm:px-6" },
    h("div", { className: "flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between" },
      h("div", null,
        h("p", { className: "text-sm font-semibold uppercase tracking-[0.2em] text-teal-700" }, "Folia network"),
        h("h1", { className: "font-display mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl" }, title),
        h("p", { className: "mt-2 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base" }, subtitle)
      ),
      actions ? h("div", { className: "flex flex-wrap gap-3" }, actions) : null
    )
  );
}

function ComposerCard() {
  return h(
    "section",
    { className: "glass-panel soft-shadow rounded-[2rem] border border-white/70 p-5 sm:p-6", "aria-labelledby": "composer-title" },
    h("div", { className: "flex items-center justify-between gap-3" },
      h("div", null,
        h("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-teal-700" }, "New post"),
        h("h2", { id: "composer-title", className: "font-display mt-2 text-2xl font-semibold text-slate-950" }, "Share Your Work")
      ),
      h("button", { type: "button", className: "focus-ring rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700" }, "Save draft")
    ),
    h("form", { className: "mt-6 space-y-5" },
      h("div", { className: "grid gap-5 xl:grid-cols-[1.15fr_0.85fr]" },
        h("div", { className: "space-y-5" },
          h("div", null,
            h("label", { htmlFor: "caption", className: "mb-2 block text-sm font-semibold text-slate-800" }, "Caption"),
            h("textarea", { id: "caption", rows: "5", defaultValue: "Late-stage lighting pass for a poster exploring summer heat and paper grain. Looking for notes on depth and whether the orange feels too dominant.", className: "focus-ring min-h-[9rem] w-full rounded-[1.5rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" })
          ),
          h("div", null,
            h("label", { htmlFor: "skills", className: "mb-2 block text-sm font-semibold text-slate-800" }, "Add skills"),
            h("input", { id: "skills", type: "text", defaultValue: "#illustration #procreate #posterdesign", className: "focus-ring h-12 w-full rounded-[1.5rem] border border-slate-300 bg-white px-4 text-sm text-slate-900" })
          )
        ),
        h("div", { className: "composer-dropzone rounded-[1.75rem] border border-dashed border-teal-300 p-5" },
          h("label", { htmlFor: "image-upload", className: "block cursor-pointer rounded-[1.5rem] bg-white/80 p-5" },
            h("div", { className: "flex items-center gap-3 text-teal-700" }, icon("upload"), h("span", { className: "font-semibold" }, "Upload project images")),
            h("p", { className: "mt-3 text-sm leading-6 text-slate-600" }, "Drop progress shots, detail crops, or mockup exports. Best for JPG, PNG, or PDF covers."),
            h("span", { className: "mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" }, "Choose files")
          ),
          h("input", { id: "image-upload", type: "file", className: "sr-only" }),
          h("img", { src: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80", alt: "Preview of uploaded poster artwork with warm geometric gradients", className: "mt-4 h-52 w-full rounded-[1.5rem] object-cover" })
        )
      ),
      h("div", { className: "flex flex-wrap items-center justify-between gap-3" },
        h("div", { className: "flex flex-wrap gap-2 text-sm text-slate-600" },
          h("span", { className: "rounded-full bg-slate-100 px-3 py-2" }, "Visibility: Public portfolio"),
          h("span", { className: "rounded-full bg-slate-100 px-3 py-2" }, "Feedback: Open to critique")
        ),
        h("button", { type: "submit", className: "focus-ring rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white" }, "Publish to Folia")
      )
    )
  );
}

function PostCard({ post }) {
  return h(
    "article",
    { className: "glass-panel soft-shadow overflow-hidden rounded-[2rem] border border-white/70" },
    h("div", { className: "flex items-start justify-between gap-4 p-5 sm:p-6" },
      h("div", { className: "flex items-center gap-4" },
        h("div", { className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white" }, post.creator.split(" ").map((part) => part[0]).join("")),
        h("div", null,
          h("div", { className: "flex flex-wrap items-center gap-2" },
            h("h3", { className: "text-base font-semibold text-slate-950" }, post.creator),
            h("span", { className: "rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800" }, post.discipline)
          ),
          h("p", { className: "text-sm text-slate-500" }, `${post.handle} · ${post.time}`)
        )
      ),
      h("button", { type: "button", className: "focus-ring rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700" }, "Follow")
    ),
    h("div", { className: "px-5 pb-5 sm:px-6" },
      h("h4", { className: "font-display text-2xl font-semibold text-slate-950" }, post.title),
      h("p", { className: "mt-3 text-sm leading-7 text-slate-600 sm:text-base" }, post.copy)
    ),
    h("img", { src: post.image, alt: post.alt, className: "h-[22rem] w-full object-cover sm:h-[28rem]" }),
    h("div", { className: "flex flex-wrap items-center gap-3 p-5 sm:p-6" },
      [
        { label: `Appreciate ${post.title}`, iconName: "heart", text: `Appreciate · ${post.appreciate}` },
        { label: `Collect ${post.title}`, iconName: "bookmark", text: `Collect · ${post.collect}` },
        { label: `Comment on ${post.title}`, iconName: "comment", text: `Comment · ${post.comment}` },
      ].map((action) =>
        h("button", { key: action.text, type: "button", "aria-label": action.label, className: "focus-ring inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700" }, icon(action.iconName, "h-4 w-4"), h("span", null, action.text))
      )
    )
  );
}

function FeedPage() {
  return h(Fragment, null,
    h(TopBar, {
      title: "Your creative feed",
      subtitle: "Track works-in-progress from illustrators, photographers, and designers you follow, plus fresh references recommended for your current practice.",
      actions: [
        h("div", { key: "toggle", className: "inline-flex rounded-full border border-slate-300 bg-white p-1", role: "tablist", "aria-label": "Feed view" },
          h("button", { type: "button", role: "tab", "aria-selected": "true", className: "focus-ring rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" }, "For You"),
          h("button", { type: "button", role: "tab", "aria-selected": "false", className: "focus-ring rounded-full px-4 py-2 text-sm font-semibold text-slate-700" }, "Following")
        ),
        h("a", { key: "explore", href: "./explore.html", className: "focus-ring inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white" }, icon("spark", "h-4 w-4"), "Find inspiration"),
      ]
    }),
    h("div", { className: "mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_21rem]" },
      h("div", { className: "space-y-6" },
        h(ComposerCard),
        feedPosts.map((post) => h(PostCard, { key: post.title, post }))
      ),
      h("aside", { className: "space-y-6", "aria-label": "Feed sidebar" },
        h("section", { className: "glass-panel soft-shadow rounded-[2rem] border border-white/70 p-5" },
          h("h2", { className: "font-display text-2xl font-semibold text-slate-950" }, "Critique requests"),
          h("ul", { className: "mt-4 space-y-3" },
            ["Layout pacing for a photo zine", "Color separation on risograph poster", "3D material pass for ceramic renders"].map((item) =>
              h("li", { key: item, className: "rounded-[1.5rem] bg-slate-50 px-4 py-3 text-sm text-slate-700" }, item)
            )
          ),
          h("a", { href: "./messages.html", className: "focus-ring mt-4 inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700" }, "Open messages")
        ),
        h("section", { className: "glass-panel soft-shadow rounded-[2rem] border border-white/70 p-5" },
          h("h2", { className: "font-display text-2xl font-semibold text-slate-950" }, "Trending tags"),
          h("div", { className: "mt-4 flex flex-wrap gap-2" }, ["#editorialdesign", "#pleinair", "#colorgrading", "#motiontests", "#lettering"].map((tag) =>
            h("a", { key: tag, href: "./explore.html", className: "focus-ring rounded-full bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800" }, tag)
          ))
        )
      )
    )
  );
}

function ExplorePage() {
  return h(Fragment, null,
    h(TopBar, {
      title: "Explore medium-first discovery",
      subtitle: "Browse visual work sorted by discipline, scan emerging creators, and collect color systems shaping the community this week.",
      actions: [
        h("label", { key: "search", className: "flex h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm text-slate-500" }, icon("search", "h-4 w-4"), h("span", { className: "sr-only" }, "Search media"), h("input", { type: "search", placeholder: "Search by medium or creator", className: "focus-ring w-44 border-none bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400" }))
      ]
    }),
    h("section", { className: "mt-6 glass-panel soft-shadow rounded-[2rem] border border-white/70 p-5 sm:p-6", "aria-labelledby": "explore-grid-title" },
      h("div", { className: "flex items-center justify-between gap-3" },
        h("div", null,
          h("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-teal-700" }, "Discover"),
          h("h2", { id: "explore-grid-title", className: "font-display mt-2 text-2xl font-semibold text-slate-950" }, "Browse by medium")
        ),
        h("div", { className: "flex flex-wrap gap-2" }, ["Digital Art", "Photography", "Typography", "3D", "Motion"].map((tab, index) =>
          h("button", { key: tab, type: "button", className: `focus-ring rounded-full px-4 py-2 text-sm font-semibold ${index === 0 ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}` }, tab)
        ))
      ),
      h("div", { className: "masonry-scroll mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" },
        exploreTiles.map((tile) =>
          h("article", { key: `${tile.creator}-${tile.medium}`, className: "group relative overflow-hidden rounded-[1.75rem] border border-white/70" },
            h("img", { src: tile.image, alt: tile.alt, className: "h-72 w-full object-cover transition duration-300 group-hover:scale-[1.03]" }),
            h("div", { className: "tile-reveal absolute inset-0 flex items-end p-5" },
              h("div", { className: "w-full rounded-[1.25rem] bg-black/25 p-4 text-white" },
                h("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-teal-200" }, tile.medium),
                h("div", { className: "mt-2 flex items-center justify-between gap-3" },
                  h("p", { className: "text-lg font-semibold" }, tile.creator),
                  h("p", { className: "text-sm" }, `${tile.appreciates} appreciates`)
                )
              )
            )
          )
        )
      )
    ),
    h("div", { className: "mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]" },
      h("section", { className: "glass-panel soft-shadow rounded-[2rem] border border-white/70 p-5 sm:p-6", "aria-labelledby": "rising-title" },
        h("h2", { id: "rising-title", className: "font-display text-2xl font-semibold text-slate-950" }, "Rising Creators"),
        h("div", { className: "mt-5 grid gap-4 md:grid-cols-3" }, risingCreators.map((creator) =>
          h("article", { key: creator.name, className: "rounded-[1.5rem] bg-slate-950 p-5 text-white" },
            h("p", { className: "text-sm uppercase tracking-[0.16em] text-teal-300" }, creator.field),
            h("h3", { className: "mt-3 text-xl font-semibold" }, creator.name),
            h("p", { className: "mt-2 text-sm text-slate-300" }, creator.stat),
            h("a", { href: "./profile.html", className: "focus-ring mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950" }, "View profile")
          )
        ))
      ),
      h("section", { className: "glass-panel soft-shadow rounded-[2rem] border border-white/70 p-5 sm:p-6", "aria-labelledby": "palette-title" },
        h("h2", { id: "palette-title", className: "font-display text-2xl font-semibold text-slate-950" }, "Trending Palettes"),
        h("div", { className: "mt-5 space-y-4" }, palettes.map((palette) =>
          h("article", { key: palette.name, className: "rounded-[1.5rem] bg-slate-50 p-4" },
            h("div", { className: "flex items-center justify-between gap-3" },
              h("h3", { className: "text-base font-semibold text-slate-900" }, palette.name),
              h("button", { type: "button", className: "focus-ring rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700" }, "Collect")
            ),
            h("div", { className: "mt-4 grid grid-cols-4 gap-2" }, palette.colors.map((color) =>
              h("div", { key: color, className: "palette-swatch rounded-2xl p-3 text-center text-xs font-semibold text-white", style: { backgroundColor: color } }, color)
            ))
          )
        ))
      )
    )
  );
}

function NotificationPage() {
  const sections = [
    { title: "Activity", key: "activity", items: notifications.activity },
    { title: "Feedback Requests", key: "feedback", items: notifications.feedback },
    { title: "Collections", key: "collections", items: notifications.collections },
  ];
  return h(Fragment, null,
    h(TopBar, {
      title: "Notifications",
      subtitle: "Review reactions to your work, reply to critique requests, and see where your pieces are being collected across Folia.",
      actions: [
        h("button", { key: "mark", type: "button", className: "focus-ring rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" }, "Mark all as read")
      ]
    }),
    h("section", { className: "mt-6 glass-panel soft-shadow rounded-[2rem] border border-white/70 p-5 sm:p-6" },
      h("div", { className: "flex flex-wrap gap-2", role: "tablist", "aria-label": "Notification categories" }, sections.map((section, index) =>
        h("button", { key: section.key, type: "button", role: "tab", "aria-selected": index === 0 ? "true" : "false", className: `focus-ring rounded-full px-4 py-2 text-sm font-semibold ${index === 0 ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-700"}` }, section.title)
      )),
      h("div", { className: "mt-6 grid gap-6 xl:grid-cols-3" }, sections.map((section) =>
        h("section", { key: section.key, "aria-labelledby": `${section.key}-title`, className: "rounded-[1.75rem] bg-slate-50 p-4 sm:p-5" },
          h("h2", { id: `${section.key}-title`, className: "font-display text-xl font-semibold text-slate-950" }, section.title),
          h("ul", { className: "mt-4 space-y-3" }, section.items.map((item) =>
            h("li", { key: `${section.key}-${item.text}`, className: "rounded-[1.25rem] border border-slate-200 bg-white p-3" },
              h("div", { className: "flex items-start gap-3" },
                h("img", { src: item.thumb, alt: item.alt, className: "h-14 w-14 rounded-2xl object-cover" }),
                h("div", { className: "min-w-0 flex-1" },
                  h("p", { className: "text-sm leading-6 text-slate-700" }, `${item.text} · ${item.time}`),
                  h("a", { href: "./profile.html", className: "focus-ring mt-2 inline-flex text-sm font-semibold text-teal-700" }, "Open referenced work")
                )
              )
            )
          ))
        )
      ))
    )
  );
}

function MessagesPage() {
  return h(Fragment, null,
    h(TopBar, {
      title: "Messages",
      subtitle: "Stay on top of active collaborations and direct messages without leaving your creative workflow.",
      actions: [
        h("button", { key: "share", type: "button", className: "focus-ring inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white" }, icon("send", "h-4 w-4"), "New message")
      ]
    }),
    h("section", { className: "mt-6 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]" },
      h("aside", { className: "glass-panel soft-shadow thread-list rounded-[2rem] border border-white/70 p-5", "aria-labelledby": "threads-title" },
        h("div", { className: "flex items-center justify-between gap-3" },
          h("h2", { id: "threads-title", className: "font-display text-2xl font-semibold text-slate-950" }, "Threads"),
          h("label", { className: "flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-500" }, icon("search", "h-4 w-4"), h("span", { className: "sr-only" }, "Search threads"), h("input", { type: "search", placeholder: "Search", className: "focus-ring w-24 border-none bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400" }))
        ),
        h("ul", { className: "mt-5 space-y-3" }, threads.map((thread, index) =>
          h("li", { key: thread.name },
            h("button", { type: "button", className: `focus-ring w-full rounded-[1.5rem] border p-4 text-left ${index === 1 ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white"}` },
              h("div", { className: "flex items-start justify-between gap-3" },
                h("div", null,
                  h("p", { className: "text-sm font-semibold uppercase tracking-[0.14em] text-slate-500" }, thread.type),
                  h("h3", { className: "mt-1 text-base font-semibold text-slate-900" }, thread.name),
                  h("p", { className: "mt-2 text-sm text-slate-600" }, thread.preview)
                ),
                thread.unread ? h("span", { className: "rounded-full bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white" }, thread.unread) : null
              )
            )
          )
        ))
      ),
      h("section", { className: "glass-panel soft-shadow rounded-[2rem] border border-white/70 p-5 sm:p-6", "aria-labelledby": "conversation-title" },
        h("div", { className: "flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between" },
          h("div", null,
            h("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-teal-700" }, "Active conversation"),
            h("h2", { id: "conversation-title", className: "font-display mt-2 text-2xl font-semibold text-slate-950" }, "Hana Noor"),
            h("p", { className: "mt-1 text-sm text-slate-600" }, "Mixed media illustrator · online now")
          ),
          h("button", { type: "button", className: "focus-ring rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" }, "Share a Project")
        ),
        h("div", { className: "mt-6 space-y-4" }, conversation.map((entry, index) =>
          h("div", { key: `${entry.from}-${index}`, className: `flex ${entry.side === "right" ? "justify-end" : "justify-start"}` },
            h("article", { className: `${entry.side === "right" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-800"} max-w-xl rounded-[1.5rem] px-4 py-3` },
              h("p", { className: "text-xs font-semibold uppercase tracking-[0.14em] opacity-70" }, entry.from),
              entry.image ? h("img", { src: entry.image, alt: entry.alt, className: "mt-3 h-56 w-full rounded-[1.25rem] object-cover" }) : h("p", { className: "mt-2 text-sm leading-7" }, entry.text)
            )
          )
        )),
        h("form", { className: "mt-6 border-t border-slate-200 pt-5" },
          h("label", { htmlFor: "message-body", className: "mb-2 block text-sm font-semibold text-slate-800" }, "Message Hana"),
          h("textarea", { id: "message-body", rows: "4", placeholder: "Reply with notes, attach a reference, or share a project update.", className: "focus-ring w-full rounded-[1.5rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400" }),
          h("div", { className: "mt-4 flex flex-wrap items-center justify-between gap-3" },
            h("label", { htmlFor: "inline-image", className: "focus-ring inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700" }, icon("upload", "h-4 w-4"), "Share image"),
            h("input", { id: "inline-image", type: "file", className: "sr-only" }),
            h("div", { className: "flex items-center gap-3" },
              h("span", { className: "text-sm text-slate-500" }, "Read receipt: Seen 2:14 PM"),
              h("button", { type: "submit", className: "focus-ring rounded-full bg-teal-700 px-5 py-2 text-sm font-semibold text-white" }, "Send")
            )
          )
        )
      )
    )
  );
}

function ProfilePage() {
  return h(Fragment, null,
    h("section", { className: "glass-panel soft-shadow overflow-hidden rounded-[2rem] border border-white/70" },
      h("img", { src: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1600&q=80", alt: "Creative studio desk with sketches, color swatches, and monitors showing design process", className: "h-56 w-full object-cover sm:h-72" }),
      h("div", { className: "p-5 sm:p-6" },
        h("div", { className: "flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between" },
          h("div", null,
            h("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-teal-700" }, "Creator profile"),
            h("h1", { className: "font-display mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl" }, "Mara Ives"),
            h("p", { className: "mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base" }, "Illustrator and editorial designer building tactile posters, process notes, and reference collections around light, texture, and print rhythm."),
            h("p", { className: "mt-3 text-sm font-medium text-slate-700" }, "Works in: Procreate, Figma, Film Photography")
          ),
          h("div", { className: "flex flex-wrap gap-3" },
            h("button", { type: "button", className: "focus-ring rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" }, "Edit portfolio"),
            h("a", { href: "./settings.html", className: "focus-ring rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700" }, "Settings")
          )
        ),
        h("div", { className: "mt-5 flex flex-wrap gap-3 text-sm text-slate-600" },
          ["24.8k followers", "189 projects", "Open for Work"].map((item) => h("span", { key: item, className: "rounded-full bg-slate-100 px-3 py-2" }, item))
        )
      )
    ),
    h("div", { className: "mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]" },
      h("section", { className: "glass-panel soft-shadow rounded-[2rem] border border-white/70 p-5 sm:p-6", "aria-labelledby": "featured-title" },
        h("div", { className: "flex items-center justify-between gap-3" },
          h("h2", { id: "featured-title", className: "font-display text-2xl font-semibold text-slate-950" }, "Featured Work"),
          h("span", { className: "rounded-full bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800" }, "Pinned")
        ),
        h("img", { src: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80", alt: "Pinned featured poster artwork titled Solstice III with warm gradients", className: "mt-5 h-72 w-full rounded-[1.75rem] object-cover" }),
        h("h3", { className: "mt-5 text-xl font-semibold text-slate-900" }, "Solstice III"),
        h("p", { className: "mt-2 text-sm leading-7 text-slate-600" }, "A print-led poster exploration combining scanned grain, overlaid gradients, and atmospheric typography studies."),
        h("div", { className: "mt-4 flex flex-wrap gap-2" }, ["841 appreciations", "214 collections", "47 critique notes"].map((stat) => h("span", { key: stat, className: "rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700" }, stat)))
      ),
      h("section", { className: "glass-panel soft-shadow rounded-[2rem] border border-white/70 p-5 sm:p-6", "aria-labelledby": "projects-title" },
        h("div", { className: "flex items-center justify-between gap-3" },
          h("h2", { id: "projects-title", className: "font-display text-2xl font-semibold text-slate-950" }, "Project Grid"),
          h("button", { type: "button", className: "focus-ring rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700" }, "Sort by recent")
        ),
        h("div", { className: "project-grid-scroll mt-5 grid max-h-[48rem] gap-4 overflow-y-auto md:grid-cols-2" },
          profileProjects.map((project) =>
            h("article", { key: project.title, className: "overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white" },
              h("img", { src: project.image, alt: project.alt, className: "h-44 w-full object-cover" }),
              h("div", { className: "p-4" },
                h("h3", { className: "text-lg font-semibold text-slate-900" }, project.title),
                h("div", { className: "mt-3 flex flex-wrap gap-2 text-sm text-slate-600" },
                  h("span", { className: "rounded-full bg-slate-100 px-3 py-1.5" }, `${project.views} views`),
                  h("span", { className: "rounded-full bg-slate-100 px-3 py-1.5" }, `${project.appreciates} appreciations`)
                )
              )
            )
          )
        )
      )
    )
  );
}

function SettingsPage() {
  const blocks = [
    { title: "Profile & Portfolio", body: "Display name, bio, featured work, links, and portfolio cover image." },
    { title: "Creative Tools", body: "List your skills, preferred mediums, software, and equipment for discovery filters." },
    { title: "Visibility", body: "Choose whether your portfolio is public, private, or visible only to collaborators." },
    { title: "Commission Status", body: "Show an Open for Work badge and specify booking windows or preferred project types." },
    { title: "Notifications", body: "Control comment alerts, critique invites, weekly digests, and collection activity." },
    { title: "Account Security", body: "Review password strength, session history, and two-factor authentication." },
  ];
  return h(Fragment, null,
    h(TopBar, {
      title: "Settings",
      subtitle: "Tune how your portfolio appears, how collaborators can reach you, and how Folia handles your creative workflow preferences.",
      actions: [
        h("button", { key: "save", type: "button", className: "focus-ring rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white" }, "Save changes")
      ]
    }),
    h("form", { className: "mt-6 space-y-6" },
      h("div", { className: "grid gap-6 xl:grid-cols-2" },
        blocks.map((block) =>
          h("section", { key: block.title, className: "glass-panel soft-shadow rounded-[2rem] border border-white/70 p-5 sm:p-6", "aria-labelledby": block.title.toLowerCase().replace(/[^a-z]+/g, "-") },
            h("h2", { id: block.title.toLowerCase().replace(/[^a-z]+/g, "-"), className: "font-display text-2xl font-semibold text-slate-950" }, block.title),
            h("p", { className: "mt-2 text-sm leading-7 text-slate-600" }, block.body),
            block.title === "Profile & Portfolio" ? h(Fragment, null,
              h("label", { htmlFor: "display-name", className: "mt-5 block text-sm font-semibold text-slate-800" }, "Display name"),
              h("input", { id: "display-name", type: "text", defaultValue: "Mara Ives", className: "focus-ring mt-2 h-12 w-full rounded-[1.25rem] border border-slate-300 bg-white px-4 text-sm text-slate-900" }),
              h("label", { htmlFor: "bio", className: "mt-4 block text-sm font-semibold text-slate-800" }, "Bio"),
              h("textarea", { id: "bio", rows: "4", defaultValue: "Illustrator and editorial designer exploring tactile light, grain, and poster systems.", className: "focus-ring mt-2 w-full rounded-[1.25rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" })
            ) : null,
            block.title === "Creative Tools" ? h(Fragment, null,
              h("label", { htmlFor: "tools", className: "mt-5 block text-sm font-semibold text-slate-800" }, "Listed tools and skills"),
              h("input", { id: "tools", type: "text", defaultValue: "Procreate, Figma, Film Photography, Editorial Layout, Poster Design", className: "focus-ring mt-2 h-12 w-full rounded-[1.25rem] border border-slate-300 bg-white px-4 text-sm text-slate-900" })
            ) : null,
            block.title === "Visibility" ? h("fieldset", { className: "mt-5 space-y-3" },
              h("legend", { className: "text-sm font-semibold text-slate-800" }, "Portfolio visibility"),
              ["Public portfolio", "Private portfolio"].map((item, index) =>
                h("label", { key: item, className: "flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700" },
                  h("input", { type: "radio", name: "visibility", defaultChecked: index === 0, className: "h-4 w-4 accent-teal-700" }),
                  item
                )
              )
            ) : null,
            block.title === "Commission Status" ? h("label", { className: "mt-5 flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3" },
              h("span", { className: "text-sm font-semibold text-slate-800" }, "Open for Work badge"),
              h("input", { type: "checkbox", defaultChecked: true, className: "h-5 w-5 accent-teal-700" })
            ) : null,
            block.title === "Notifications" ? h("div", { className: "mt-5 space-y-3" },
              ["Comment alerts", "Feedback requests", "Collection updates", "Weekly digest"].map((item, index) =>
                h("label", { key: item, className: "flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3" },
                  h("span", { className: "text-sm font-medium text-slate-800" }, item),
                  h("input", { type: "checkbox", defaultChecked: index !== 3, className: "h-5 w-5 accent-teal-700" })
                )
              )
            ) : null,
            block.title === "Account Security" ? h(Fragment, null,
              h("label", { htmlFor: "password", className: "mt-5 block text-sm font-semibold text-slate-800" }, "Password"),
              h("input", { id: "password", type: "password", value: "creativepassphrase", readOnly: true, className: "focus-ring mt-2 h-12 w-full rounded-[1.25rem] border border-slate-300 bg-white px-4 text-sm text-slate-900" }),
              h("button", { type: "button", className: "focus-ring mt-4 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700" }, "Enable two-factor authentication")
            ) : null
          )
        )
      )
    )
  );
}

function PageContent() {
  switch (currentPage) {
    case "explore":
      return h(ExplorePage);
    case "notifications":
      return h(NotificationPage);
    case "messages":
      return h(MessagesPage);
    case "profile":
      return h(ProfilePage);
    case "settings":
      return h(SettingsPage);
    case "feed":
    default:
      return h(FeedPage);
  }
}

function App() {
  return h(
    Fragment,
    null,
    h("a", { href: "#main-content", className: "focus-ring sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900" }, "Skip to main content"),
    h("div", { className: "app-shell relative min-h-screen p-3 sm:p-5" },
      h("div", { className: "mx-auto flex max-w-[96rem] gap-5" },
        h(Sidebar),
        h("div", { className: "min-w-0 flex-1 pb-28 lg:pb-8" },
          h("main", { id: "main-content", className: "space-y-6" }, h(PageContent))
        )
      )
    ),
    h(MobileNav)
  );
}

root.render(h(App));
