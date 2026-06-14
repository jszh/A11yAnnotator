/* ============================================================
   THE PULSE — components.js
   All shared React components for the news-portal.
   Loaded by every page via <script type="text/babel" src="...">.
   All components are exported onto `window` so page scripts
   can reference them after this file is evaluated by Babel.
   ============================================================ */

/* ── Utilities ─────────────────────────────────────────────── */

// Resolve a root-relative path using the per-page BASE_PATH variable.
// index.html sets window.BASE_PATH = ''
// Sub-pages set window.BASE_PATH = '../'
const R = (path) => (window.BASE_PATH || '') + path;

/* ── Static data ────────────────────────────────────────────── */

const SITE_NAME = 'THE PULSE';
const SITE_TAGLINE = 'News That Matters';

const NAV_CATEGORIES = [
  { id: 'news',          label: 'News',          path: 'index.html' },
  { id: 'world',         label: 'World',         path: 'world/world.html' },
  { id: 'politics',      label: 'Politics',      path: 'politics/politics.html' },
  { id: 'business',      label: 'Business',      path: 'business/business.html' },
  { id: 'tech',          label: 'Tech',          path: 'tech/tech.html' },
  { id: 'culture',       label: 'Culture',       path: 'culture/culture.html' },
  { id: 'opinion',       label: 'Opinion',       path: 'opinion/opinion.html' },
  { id: 'video',         label: 'Video',         path: 'video/video.html' },
];

const BREAKING_ITEMS = [
  { id: 1, label: 'BREAKING', text: 'Senate passes landmark $2T climate and infrastructure bill in 58-42 vote' },
  { id: 2, label: 'LIVE',     text: 'UN Security Council convenes emergency session on Middle East ceasefire talks' },
  { id: 3, label: 'BREAKING', text: 'Federal Reserve signals potential rate cut amid slowing inflation data' },
  { id: 4, label: 'TRENDING', text: 'SpaceX successfully launches first crewed Mars habitat test mission' },
  { id: 5, label: 'LIVE',     text: 'Hurricane Della makes landfall on Gulf Coast as Category 3 storm' },
  { id: 6, label: 'BREAKING', text: 'Major cyberattack disrupts critical infrastructure across three NATO members' },
];

const MARKET_DATA = [
  { symbol: 'S&P 500', value: '5,842.12', change: '+0.74%', up: true },
  { symbol: 'NASDAQ',  value: '18,430.55', change: '+1.12%', up: true },
  { symbol: 'DOW',     value: '43,210.08', change: '-0.28%', up: false },
  { symbol: 'BTC',     value: '$94,320',   change: '+3.41%', up: true },
  { symbol: 'EUR/USD', value: '1.0842',    change: '-0.15%', up: false },
];

// Comprehensive story dataset shared across all pages
const ALL_STORIES = [
  {
    id: 1, category: 'politics', categoryLabel: 'Politics',
    title: 'Senate Democrats Unveil $2 Trillion Climate and Infrastructure Package',
    summary: 'The sweeping legislation aims to decarbonize the power sector by 2035 and rebuild crumbling road and bridge infrastructure across the nation.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/politics1/800/450',
    author: 'Sarah Mitchell', publishTime: '2h ago', readLength: '6 min read',
    tags: ['senate', 'climate', 'infrastructure'], isBreaking: true, isLive: false,
    engagementMetrics: { views: '148K', comments: 923, shares: 3200 }
  },
  {
    id: 2, category: 'world', categoryLabel: 'World',
    title: 'UN Emergency Session Convenes as Ceasefire Talks Collapse in Middle East',
    summary: 'Diplomats from 12 nations gathered in Geneva as ground fighting intensified for the fourth consecutive day.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/world1/800/450',
    author: 'James Okafor', publishTime: '3h ago', readLength: '5 min read',
    tags: ['un', 'ceasefire', 'diplomacy'], isBreaking: true, isLive: true,
    engagementMetrics: { views: '211K', comments: 1540, shares: 5800 }
  },
  {
    id: 3, category: 'business', categoryLabel: 'Business',
    title: 'Fed Signals Three Rate Cuts in 2025 as Inflation Cools to 2.1%',
    summary: 'Markets surged following the Federal Reserve chairperson\'s statement pointing to a more accommodative monetary policy.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/business1/800/450',
    author: 'Diana Chen', publishTime: '4h ago', readLength: '4 min read',
    tags: ['federal reserve', 'interest rates', 'inflation'],
    engagementMetrics: { views: '93K', comments: 642, shares: 1900 }
  },
  {
    id: 4, category: 'tech', categoryLabel: 'Tech',
    title: 'OpenAI Releases GPT-6: \'Human-Level Reasoning Across All Domains\'',
    summary: 'The company claims its latest model achieves expert-level performance on every professional benchmark, raising fresh questions about AI governance.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/tech1/800/450',
    author: 'Alex Rivera', publishTime: '5h ago', readLength: '7 min read',
    tags: ['openai', 'AI', 'GPT-6'],
    engagementMetrics: { views: '325K', comments: 2100, shares: 8700 }
  },
  {
    id: 5, category: 'culture', categoryLabel: 'Culture',
    title: 'The Resurgence of Long-Form Journalism in the Age of Short Attention Spans',
    summary: 'Contra every prediction, readers are spending more time—not less—with deeply reported 5,000-word investigations.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/culture1/800/450',
    author: 'Maya Thompson', publishTime: '6h ago', readLength: '8 min read',
    tags: ['journalism', 'media', 'culture'],
    engagementMetrics: { views: '67K', comments: 421, shares: 1200 }
  },
  {
    id: 6, category: 'world', categoryLabel: 'World',
    title: 'China and India Sign Historic Border Agreement After 60 Years of Dispute',
    summary: 'The Himalayan border pact—brokered quietly over 18 months of back-channel diplomacy—ends the longest territorial dispute between two nuclear states.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/world2/800/450',
    author: 'Priya Sharma', publishTime: '7h ago', readLength: '5 min read',
    tags: ['china', 'india', 'diplomacy'],
    engagementMetrics: { views: '189K', comments: 1100, shares: 4500 }
  },
  {
    id: 7, category: 'business', categoryLabel: 'Business',
    title: 'Apple\'s Market Cap Crosses $4 Trillion, First Company to Reach Milestone',
    summary: 'Shares of the iPhone maker rose 4.2% on Thursday, driven by strong iPhone 16 Pro demand and an unexpected surge in Apple Intelligence subscriptions.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/business2/800/450',
    author: 'Tom Walsh', publishTime: '8h ago', readLength: '3 min read',
    tags: ['apple', 'markets', 'tech'],
    engagementMetrics: { views: '254K', comments: 1830, shares: 6100 }
  },
  {
    id: 8, category: 'tech', categoryLabel: 'Tech',
    title: 'EU\'s AI Act Enters Full Force: What Every Tech Company Must Now Do',
    summary: 'The world\'s most comprehensive AI regulation now requires mandatory risk assessments, transparency logs, and human oversight for high-stakes deployments.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/tech2/800/450',
    author: 'Elena Kovacs', publishTime: '9h ago', readLength: '6 min read',
    tags: ['EU', 'AI regulation', 'compliance'],
    engagementMetrics: { views: '112K', comments: 785, shares: 2900 }
  },
  {
    id: 9, category: 'politics', categoryLabel: 'Politics',
    title: 'Supreme Court Hears Arguments Over AI-Generated Disinformation and Free Speech',
    summary: 'Justices grappled with how First Amendment protections apply to algorithmically generated political content during heated oral arguments.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/politics2/800/450',
    author: 'Rachel Brooks', publishTime: '10h ago', readLength: '5 min read',
    tags: ['supreme court', 'AI', 'first amendment'],
    engagementMetrics: { views: '178K', comments: 1290, shares: 4200 }
  },
  {
    id: 10, category: 'culture', categoryLabel: 'Culture',
    title: 'Beyoncé\'s \'Renaissance III\' Breaks All-Time Streaming Record in 24 Hours',
    summary: 'The surprise drop shattered Spotify\'s single-day record with 1.2 billion streams, combining country, gospel, and afrobeat in a genre-defying opus.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/culture2/800/450',
    author: 'Marcus Lee', publishTime: '11h ago', readLength: '3 min read',
    tags: ['beyonce', 'music', 'streaming'],
    engagementMetrics: { views: '890K', comments: 7200, shares: 22000 }
  },
  {
    id: 11, category: 'world', categoryLabel: 'World',
    title: 'Amazon Deforestation Plummets 89% as Monitoring Satellites Deploy AI Detection',
    summary: 'Satellite operators report near-real-time illegal logging alerts have allowed Brazilian authorities to respond in hours instead of weeks.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/world3/800/450',
    author: 'Carlos Mendez', publishTime: '12h ago', readLength: '4 min read',
    tags: ['amazon', 'environment', 'AI'],
    engagementMetrics: { views: '134K', comments: 940, shares: 3700 }
  },
  {
    id: 12, category: 'opinion', categoryLabel: 'Opinion',
    title: 'The Coming Reckoning: Why Democracy\'s Guardrails Are Failing in the Algorithmic Age',
    summary: 'We built institutions for a world of slow information. The speed of social media has outpaced every mechanism we have for collective sense-making.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/opinion1/800/450',
    author: 'Dr. Lena Vogel', publishTime: '1d ago', readLength: '10 min read',
    tags: ['democracy', 'technology', 'opinion'],
    engagementMetrics: { views: '245K', comments: 3100, shares: 9800 }
  },
  {
    id: 13, category: 'tech', categoryLabel: 'Tech',
    title: 'Tesla\'s Robotaxi Network Reaches 10 Million Rides Without a Single Incident',
    summary: 'The milestone comes as rivals Waymo and Cruise are still in limited regional rollouts, putting Tesla\'s fully autonomous fleet months ahead of competitors.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/tech3/800/450',
    author: 'Nina Patel', publishTime: '14h ago', readLength: '5 min read',
    tags: ['tesla', 'autonomous vehicles', 'robotaxi'],
    engagementMetrics: { views: '203K', comments: 1670, shares: 5300 }
  },
  {
    id: 14, category: 'business', categoryLabel: 'Business',
    title: 'Goldman Sachs Report: Automation Will Eliminate 300 Million Jobs by 2030',
    summary: 'But the bank\'s economists also project the creation of 170 million new roles—a net loss that will require unprecedented workforce reskilling.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/business3/800/450',
    author: 'Patrick Nguyen', publishTime: '1d ago', readLength: '6 min read',
    tags: ['automation', 'jobs', 'economy'],
    engagementMetrics: { views: '318K', comments: 2800, shares: 11200 }
  },
  {
    id: 15, category: 'video', categoryLabel: 'Video',
    title: 'Inside the Bunker: Exclusive Access to Ukraine\'s Underground Command Network',
    summary: 'A 45-minute documentary filmed inside the fortified command infrastructure that coordinates Ukraine\'s defense operations.',
    mediaType: 'video', mediaUrl: 'https://picsum.photos/seed/video1/800/450',
    author: 'The Pulse Docs', publishTime: '2d ago', readLength: '45 min watch',
    tags: ['ukraine', 'documentary', 'exclusive'], isLive: false,
    engagementMetrics: { views: '1.2M', comments: 5400, shares: 18000 }
  },
  {
    id: 16, category: 'world', categoryLabel: 'World',
    title: 'Europe\'s Largest Solar Farm Opens in Spain, Powers 2 Million Homes',
    summary: 'The 5,000-hectare installation in Extremadura represents the EU\'s biggest single renewable energy investment.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/world4/800/450',
    author: 'Sofia Brandt', publishTime: '2d ago', readLength: '4 min read',
    tags: ['solar', 'energy', 'europe'],
    engagementMetrics: { views: '88K', comments: 560, shares: 2200 }
  },
  {
    id: 17, category: 'culture', categoryLabel: 'Culture',
    title: 'The Architecture Issue: How Cities Are Rethinking Public Space After COVID',
    summary: 'From pop-up parks to car-free corridors, urban designers are reshaping how millions experience their cities.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/culture3/800/450',
    author: 'Hannah Kim', publishTime: '2d ago', readLength: '7 min read',
    tags: ['architecture', 'urban design', 'cities'],
    engagementMetrics: { views: '72K', comments: 430, shares: 1800 }
  },
  {
    id: 18, category: 'opinion', categoryLabel: 'Opinion',
    title: 'Stop Calling It \'AI Hallucination\'—It\'s Lying, and We Should Say So',
    summary: 'The euphemism sanitizes a fundamental flaw in large language models that has real consequences for science, law, and journalism.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/opinion2/800/450',
    author: 'Prof. James Wright', publishTime: '3d ago', readLength: '8 min read',
    tags: ['AI', 'opinion', 'language'],
    engagementMetrics: { views: '189K', comments: 2100, shares: 7600 }
  },
  {
    id: 19, category: 'business', categoryLabel: 'Business',
    title: 'The Warehouse Workers Organizing Against Amazon Algorithms',
    summary: 'A landmark union drive is challenging productivity surveillance systems that workers say treat humans like robots.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/business4/800/450',
    author: 'Ana Reyes', publishTime: '3d ago', readLength: '8 min read',
    tags: ['amazon', 'labor', 'unions'],
    engagementMetrics: { views: '156K', comments: 1890, shares: 6400 }
  },
  {
    id: 20, category: 'tech', categoryLabel: 'Tech',
    title: 'Quantum Computing Breakthrough: Microsoft Achieves \'Error-Free\' Qubit at Room Temperature',
    summary: 'The advance could accelerate timelines for practical quantum computers from decades to years.',
    mediaType: 'image', mediaUrl: 'https://picsum.photos/seed/tech4/800/450',
    author: 'Dr. Kevin Liu', publishTime: '4d ago', readLength: '5 min read',
    tags: ['quantum computing', 'microsoft', 'breakthrough'],
    engagementMetrics: { views: '278K', comments: 1400, shares: 5900 }
  },
];

/* ── Icon helpers ───────────────────────────────────────────── */
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconMenu = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconPlay = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IconChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconShare = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const IconBookmark = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconTrendingUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);


/* ══════════════════════════════════════════════════════════════
   COMPONENT: GlobalUtilityBar
   ══════════════════════════════════════════════════════════════ */
const GlobalUtilityBar = () => {
  const [tickerPaused, setTickerPaused] = React.useState(false);
  const doubled = [...BREAKING_ITEMS, ...BREAKING_ITEMS]; // seamless loop

  return (
    <div className="utility-bar" role="banner" aria-label="Global utility bar">
      <div className="max-w-screen-2xl mx-auto px-4 h-full flex items-center justify-between gap-4">

        {/* Left: edition + language */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <label className="sr-only" htmlFor="edition-select">Edition</label>
          <select id="edition-select" defaultValue="us" aria-label="Select edition">
            <option value="us">🇺🇸 US</option>
            <option value="uk">🇬🇧 UK</option>
            <option value="eu">🇪🇺 Europe</option>
            <option value="global">🌐 Global</option>
          </select>
          <span className="text-slate-700" aria-hidden="true">|</span>
          <label className="sr-only" htmlFor="lang-select">Language</label>
          <select id="lang-select" defaultValue="en" aria-label="Select language">
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="fr">FR</option>
            <option value="de">DE</option>
          </select>
        </div>

        {/* Center: breaking news ticker */}
        <div
          className="hidden md:flex items-center gap-3 overflow-hidden flex-1 min-w-0"
          aria-live="polite"
          aria-label="Breaking news ticker"
        >
          <div
            className="ticker-track"
            style={{ animationPlayState: tickerPaused ? 'paused' : 'running' }}
            onMouseEnter={() => setTickerPaused(true)}
            onMouseLeave={() => setTickerPaused(false)}
          >
            {doubled.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className={item.label === 'LIVE' || item.label === 'BREAKING' ? 'badge-breaking' : 'badge-trending'}>
                  {item.label}
                </span>
                <span className="text-slate-300 text-xs">{item.text}</span>
                <span className="text-slate-600 mx-2" aria-hidden="true">•</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right: market data (desktop) + auth */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden xl:flex items-center gap-4 text-xs">
            {MARKET_DATA.slice(0, 3).map((m) => (
              <span key={m.symbol} className="flex items-center gap-1">
                <span className="text-slate-400 font-medium">{m.symbol}</span>
                <span className="text-slate-200 font-semibold">{m.value}</span>
                <span className={m.up ? 'market-up' : 'market-down'}>{m.change}</span>
              </span>
            ))}
          </div>
          <a href={R('account/account.html')}
            className="text-slate-300 hover:text-white transition-colors text-xs font-medium"
            aria-label="Sign in to your account">
            Sign In
          </a>
          <a href={R('subscribe/subscribe.html')}
            className="btn-subscribe hidden sm:inline-block"
            aria-label="Subscribe to The Pulse">
            Subscribe
          </a>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT: BrandHeader
   ══════════════════════════════════════════════════════════════ */
const BrandHeader = ({ currentCategory }) => {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const searchInputRef = React.useRef(null);

  React.useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileNavOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <nav className={`mobile-nav-panel open`} aria-label="Main navigation">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <a href={R('index.html')} className="brand-logo" aria-label="The Pulse homepage">
                THE <span>PULSE</span>
              </a>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="text-white p-2"
                aria-label="Close navigation menu">
                <IconClose />
              </button>
            </div>
            <ul className="p-4 space-y-1" role="list">
              {NAV_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <a
                    href={R(cat.path)}
                    className={`block px-4 py-3 rounded text-sm font-semibold transition-colors ${
                      currentCategory === cat.id
                        ? 'bg-red-600 text-white'
                        : 'text-slate-200 hover:bg-slate-700'
                    }`}
                    aria-current={currentCategory === cat.id ? 'page' : undefined}
                  >
                    {cat.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="p-4 border-t border-slate-700 space-y-3">
              <a href={R('account/account.html')} className="block w-full btn btn-ghost text-white border border-slate-600 py-2">
                Sign In
              </a>
              <a href={R('subscribe/subscribe.html')} className="block w-full btn btn-primary py-2 text-center">
                Subscribe
              </a>
            </div>
          </nav>
          <button
            className="mobile-nav-backdrop"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
          />
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search">
          <div className="w-full max-w-3xl mx-auto px-4">
            <label htmlFor="site-search" className="block text-slate-400 text-sm mb-4 uppercase tracking-widest font-semibold">
              Search The Pulse
            </label>
            <input
              id="site-search"
              ref={searchInputRef}
              type="search"
              placeholder="Search stories, topics, authors…"
              className="search-overlay-input"
              aria-label="Search the site"
            />
            <div className="mt-6 text-slate-500 text-sm">
              Trending: <span className="text-slate-300 cursor-pointer hover:underline mx-2">Climate Bill</span>
              <span className="text-slate-300 cursor-pointer hover:underline mx-2">AI Regulation</span>
              <span className="text-slate-300 cursor-pointer hover:underline mx-2">Federal Reserve</span>
            </div>
            <button
              onClick={() => setSearchOpen(false)}
              className="mt-8 text-slate-400 hover:text-white flex items-center gap-2 text-sm"
              aria-label="Close search">
              <IconClose /> Close Search (Esc)
            </button>
          </div>
        </div>
      )}

      <header className="brand-header" role="banner">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* Left: hamburger + logo */}
            <div className="flex items-center gap-3">
              <button
                className="md:hidden btn btn-ghost p-2"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileNavOpen}>
                <IconMenu />
              </button>
              <a href={R('index.html')} className="brand-logo" aria-label="The Pulse — homepage">
                THE <span>PULSE</span>
              </a>
            </div>

            {/* Center: date (desktop) */}
            <div className="hidden lg:block text-center">
              <p className="text-xs text-slate-400 font-medium">{todayStr}</p>
              <p className="text-xs text-slate-500 italic">{SITE_TAGLINE}</p>
            </div>

            {/* Right: search + subscribe + account */}
            <div className="flex items-center gap-2">
              <button
                className="btn btn-ghost p-2"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                aria-expanded={searchOpen}>
                <IconSearch />
              </button>
              <a href={R('account/account.html')}
                className="hidden md:flex btn btn-ghost p-2 items-center gap-1.5 text-sm"
                aria-label="My account">
                <IconUser />
                <span className="hidden lg:inline">Account</span>
              </a>
              <a href={R('subscribe/subscribe.html')}
                className="btn-subscribe"
                aria-label="Subscribe to The Pulse">
                Subscribe
              </a>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT: CategoryNav
   ══════════════════════════════════════════════════════════════ */
const CategoryNav = ({ currentCategory }) => (
  <nav className="category-nav" aria-label="Content categories" role="navigation">
    <div className="max-w-screen-2xl mx-auto px-4">
      <div className="flex" role="list">
        {NAV_CATEGORIES.map((cat) => (
          <a
            key={cat.id}
            href={R(cat.path)}
            className={`category-nav-link ${currentCategory === cat.id ? 'active' : ''}`}
            aria-current={currentCategory === cat.id ? 'page' : undefined}
            role="listitem"
          >
            {cat.label}
          </a>
        ))}
      </div>
    </div>
  </nav>
);

/* ══════════════════════════════════════════════════════════════
   COMPONENT: LiveTicker  (section-level breaking ribbon)
   ══════════════════════════════════════════════════════════════ */
const LiveTicker = () => {
  const [paused, setPaused] = React.useState(false);
  const doubled = [...BREAKING_ITEMS, ...BREAKING_ITEMS];
  return (
    <section
      className="bg-slate-900 py-2 overflow-hidden"
      aria-label="Breaking news ticker"
      aria-live="polite"
    >
      <div className="max-w-screen-2xl mx-auto px-4 flex items-center gap-4">
        <span className="badge-live flex-shrink-0">LIVE</span>
        <div
          className="overflow-hidden flex-1"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="ticker-track"
            style={{ animationPlayState: paused ? 'paused' : 'running' }}
          >
            {doubled.map((item, i) => (
              <a
                key={i}
                href={R('article/article.html')}
                className="flex items-center gap-2 text-white hover:underline"
                tabIndex={i >= BREAKING_ITEMS.length ? -1 : 0}
                aria-hidden={i >= BREAKING_ITEMS.length}
              >
                <span className={item.label === 'TRENDING' ? 'badge-trending' : 'badge-breaking'}>
                  {item.label}
                </span>
                <span className="text-sm text-slate-200">{item.text}</span>
                <span className="text-slate-600 mx-4" aria-hidden="true">·</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT: StoryCard  (generic reusable card)
   Props: story, layout ('vertical'|'horizontal'|'minimal'), size
   ══════════════════════════════════════════════════════════════ */
const StoryCard = ({ story, layout = 'vertical', size = 'md', showSummary = false }) => {
  const isHorizontal = layout === 'horizontal';
  const isMinimal = layout === 'minimal';

  if (isMinimal) {
    return (
      <article className="flex gap-3 py-3 border-b border-slate-100 last:border-0">
        <div className="w-20 h-16 flex-shrink-0 overflow-hidden rounded bg-slate-100">
          <img src={story.mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`cat-label cat-${story.category}`}>{story.categoryLabel}</span>
          <a href={R('article/article.html')}>
            <h4 className="mt-1 text-sm font-semibold leading-snug text-slate-800 hover:text-red-600 transition-colors line-clamp-2">
              {story.title}
            </h4>
          </a>
          <p className="text-xs text-slate-400 mt-1">{story.publishTime}</p>
        </div>
      </article>
    );
  }

  if (isHorizontal) {
    return (
      <article className="story-card flex-row flex" style={{ flexDirection: 'row' }}>
        <div className="w-36 h-28 flex-shrink-0 overflow-hidden bg-slate-100">
          <img src={story.mediaUrl} alt="" className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy" />
        </div>
        <div className="p-3 flex flex-col justify-between flex-1 min-w-0">
          <div>
            <span className={`cat-label cat-${story.category}`}>{story.categoryLabel}</span>
            <a href={R('article/article.html')}>
              <h3 className={`mt-1.5 font-serif font-semibold leading-snug hover:text-red-600 transition-colors ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
                {story.title}
              </h3>
            </a>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
            <span>{story.author}</span>
            <span aria-hidden="true">·</span>
            <span>{story.publishTime}</span>
            <span aria-hidden="true">·</span>
            <span>{story.readLength}</span>
          </div>
        </div>
      </article>
    );
  }

  // Vertical (default)
  return (
    <article className="story-card">
      <div className="story-card-img relative">
        {story.mediaType === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <button className="play-btn" aria-label={`Play video: ${story.title}`}>
              <IconPlay />
            </button>
          </div>
        )}
        {(story.isLive || story.isBreaking) && (
          <div className="absolute top-3 left-3 z-10">
            {story.isLive ? <span className="badge-live">LIVE</span> : <span className="badge-breaking">BREAKING</span>}
          </div>
        )}
        <a href={R('article/article.html')} tabIndex="-1" aria-hidden="true">
          <img src={story.mediaUrl} alt="" loading="lazy" />
        </a>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`cat-label cat-${story.category}`}>{story.categoryLabel}</span>
        </div>
        <a href={R('article/article.html')}>
          <h3 className={`font-serif font-semibold leading-snug hover:text-red-600 transition-colors mb-2 ${size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-base' : 'text-lg'}`}>
            {story.title}
          </h3>
        </a>
        {showSummary && story.summary && (
          <p className="text-sm text-slate-500 leading-relaxed mb-3 line-clamp-2">{story.summary}</p>
        )}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-slate-600">{story.author}</span>
            <span aria-hidden="true">·</span>
            <time>{story.publishTime}</time>
            <span aria-hidden="true">·</span>
            <span>{story.readLength}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-slate-400 hover:text-slate-700 transition-colors" aria-label="Bookmark story">
              <IconBookmark />
            </button>
            <button className="text-slate-400 hover:text-slate-700 transition-colors" aria-label="Share story">
              <IconShare />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT: StoryGrid
   ══════════════════════════════════════════════════════════════ */
const StoryGrid = ({ stories, columns = 3, showSummary = false, size = 'md' }) => {
  const colClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${colClasses} gap-6`} role="list" aria-label="Story grid">
      {stories.map((story) => (
        <div key={story.id} role="listitem">
          <StoryCard story={story} showSummary={showSummary} size={size} />
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT: HeroEditorial
   variant: 'A' (large media hero), 'B' (split editorial), 'C' (card grid)
   ══════════════════════════════════════════════════════════════ */
const HeroEditorial = ({ variant = 'A', stories }) => {
  const [main, ...rest] = stories || ALL_STORIES.slice(0, 5);

  /* ── Variant A: Large media hero (CNN style) ── */
  if (variant === 'A') {
    return (
      <section aria-label="Featured story" className="relative overflow-hidden rounded-none" style={{ minHeight: '480px' }}>
        <div className="hero-overlay" style={{ height: '520px' }}>
          <img
            src={main.mediaUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          <div className="hero-overlay-content">
            <div className="max-w-screen-2xl mx-auto px-4">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-3">
                  {main.isLive && <span className="badge-live">LIVE</span>}
                  {main.isBreaking && !main.isLive && <span className="badge-breaking">BREAKING</span>}
                  <span className={`cat-label cat-${main.category}`}>{main.categoryLabel}</span>
                </div>
                <a href={R('article/article.html')}>
                  <h1 className="headline-xl text-white hover:text-red-200 transition-colors">
                    {main.title}
                  </h1>
                </a>
                <p className="body-lg text-slate-200 mt-3 line-clamp-2">{main.summary}</p>
                <div className="flex items-center gap-3 mt-4 text-sm text-slate-300">
                  <span>{main.author}</span>
                  <span aria-hidden="true">·</span>
                  <time>{main.publishTime}</time>
                  <span aria-hidden="true">·</span>
                  <span>{main.readLength}</span>
                </div>
                {main.mediaType === 'video' && (
                  <button className="play-btn mt-4" aria-label={`Play video: ${main.title}`}>
                    <IconPlay />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Side story stack */}
        {rest.length > 0 && (
          <aside className="hidden xl:block absolute right-0 top-0 bottom-0 w-72 bg-white border-l border-slate-100 overflow-y-auto p-4"
            aria-label="More top stories">
            <h2 className="section-header-title text-slate-700 mb-3 px-1">More Top Stories</h2>
            {rest.slice(0, 4).map((story) => (
              <StoryCard key={story.id} story={story} layout="minimal" />
            ))}
          </aside>
        )}
      </section>
    );
  }

  /* ── Variant B: Editorial split (NYT style) ── */
  if (variant === 'B') {
    const [left, center, ...sidePack] = stories || ALL_STORIES.slice(0, 5);
    return (
      <section className="max-w-screen-2xl mx-auto px-4 py-8" aria-label="Featured stories">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: headline + summary stack */}
          <div className="lg:col-span-3 flex flex-col justify-center gap-6 border-r border-slate-200 pr-8">
            {[left].concat(sidePack.slice(0, 2)).map((story) => (
              <article key={story.id} className="border-b border-slate-100 pb-4 last:border-0">
                <span className={`cat-label cat-${story.category}`}>{story.categoryLabel}</span>
                <a href={R('article/article.html')}>
                  <h3 className="headline-sm mt-2 hover:text-red-600 transition-colors">{story.title}</h3>
                </a>
                <p className="body-sm text-slate-500 mt-1 line-clamp-2">{story.summary}</p>
                <p className="text-xs text-slate-400 mt-2">{story.publishTime} · {story.readLength}</p>
              </article>
            ))}
          </div>

          {/* Center: large media */}
          <div className="lg:col-span-6">
            {center && (
              <article>
                <a href={R('article/article.html')} className="block overflow-hidden rounded-lg">
                  <img src={center.mediaUrl} alt="" className="w-full aspect-video object-cover hover:opacity-95 transition-opacity" loading="eager" />
                </a>
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    {center.isLive && <span className="badge-live">LIVE</span>}
                    <span className={`cat-label cat-${center.category}`}>{center.categoryLabel}</span>
                  </div>
                  <a href={R('article/article.html')}>
                    <h2 className="headline-lg hover:text-red-600 transition-colors">{center.title}</h2>
                  </a>
                  <p className="body-base text-slate-500 mt-2">{center.summary}</p>
                  <p className="text-sm text-slate-400 mt-3">{center.author} · {center.publishTime}</p>
                </div>
              </article>
            )}
          </div>

          {/* Right: supporting stack */}
          <div className="lg:col-span-3 flex flex-col gap-4 border-l border-slate-200 pl-8">
            {sidePack.slice(2, 5).map((story) => (
              <article key={story.id} className="border-b border-slate-100 pb-4 last:border-0">
                <span className={`cat-label cat-${story.category}`}>{story.categoryLabel}</span>
                <a href={R('article/article.html')}>
                  <h3 className="headline-xs mt-1.5 hover:text-red-600 transition-colors">{story.title}</h3>
                </a>
                <p className="text-xs text-slate-400 mt-2">{story.publishTime}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ── Variant C: Visual card grid (Verge / BuzzFeed style) ── */
  if (variant === 'C') {
    const featured = (stories || ALL_STORIES).slice(0, 5);
    return (
      <section className="max-w-screen-2xl mx-auto px-4 py-8" aria-label="Featured stories">
        <div className="grid grid-cols-12 gap-4">
          {/* Large main card */}
          <article className="col-span-12 md:col-span-7 relative overflow-hidden rounded-xl" style={{ minHeight: '400px' }}>
            <img src={featured[0]?.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
              <span className={`cat-label cat-${featured[0]?.category}`}>{featured[0]?.categoryLabel}</span>
              <a href={R('article/article.html')}>
                <h2 className="headline-lg text-white mt-2 hover:text-red-200 transition-colors">{featured[0]?.title}</h2>
              </a>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-300">
                <span>{featured[0]?.engagementMetrics?.views} views</span>
                <span aria-hidden="true">·</span>
                <span>{featured[0]?.publishTime}</span>
              </div>
            </div>
          </article>

          {/* Right column 2 cards */}
          <div className="col-span-12 md:col-span-5 grid grid-rows-2 gap-4">
            {featured.slice(1, 3).map((story) => (
              <article key={story.id} className="relative overflow-hidden rounded-xl" style={{ minHeight: '190px' }}>
                <img src={story.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
                  <span className={`cat-label cat-${story.category}`}>{story.categoryLabel}</span>
                  <a href={R('article/article.html')}>
                    <h3 className="text-base font-bold text-white mt-1 hover:text-red-200 transition-colors leading-snug">{story.title}</h3>
                  </a>
                </div>
              </article>
            ))}
          </div>

          {/* Bottom 3 equal cards */}
          {featured.slice(3, 6).map((story) => (
            <article key={story.id} className="col-span-12 md:col-span-4 relative overflow-hidden rounded-xl" style={{ minHeight: '200px' }}>
              <img src={story.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
                <span className={`cat-label cat-${story.category}`}>{story.categoryLabel}</span>
                <a href={R('article/article.html')}>
                  <h3 className="text-sm font-bold text-white mt-1 hover:text-red-200 transition-colors">{story.title}</h3>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return null;
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT: EditorialSection
   ══════════════════════════════════════════════════════════════ */
const EditorialSection = ({ title, stories, columns = 3, layout = 'grid', accentColor = 'red', showSummary = false }) => (
  <section className="max-w-screen-2xl mx-auto px-4 py-8" aria-labelledby={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}>
    <div className="section-header">
      <span className="section-header-accent" style={{ background: accentColor === 'blue' ? '#3B82F6' : accentColor === 'gold' ? '#F59E0B' : '#EF4444' }} />
      <h2 id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`} className="section-header-title">{title}</h2>
      <a href={R('index.html')} className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-red-600 transition-colors font-semibold" aria-label={`See all ${title} stories`}>
        See All <IconChevronRight />
      </a>
    </div>
    {layout === 'scroll' ? (
      <div className="scroll-row">
        {stories.map((story) => (
          <div key={story.id} style={{ width: '280px' }}>
            <StoryCard story={story} showSummary={showSummary} />
          </div>
        ))}
      </div>
    ) : (
      <StoryGrid stories={stories} columns={columns} showSummary={showSummary} />
    )}
  </section>
);

/* ══════════════════════════════════════════════════════════════
   COMPONENT: SidebarModule
   type: 'trending' | 'newsletter' | 'live-blog' | 'video' | 'ad'
   ══════════════════════════════════════════════════════════════ */
const SidebarModule = ({ type = 'trending', stories, title }) => {
  if (type === 'trending') {
    const items = stories || ALL_STORIES.slice(4, 9);
    return (
      <aside className="sidebar-widget" aria-label="Trending stories">
        <div className="sidebar-widget-header">
          <span className="flex items-center gap-2"><IconTrendingUp /> {title || 'Trending Now'}</span>
        </div>
        <div className="sidebar-widget-body">
          <ol aria-label="Trending stories list">
            {items.map((story, i) => (
              <li key={story.id} className="numbered-item">
                <span className="numbered-item-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <span className={`cat-label cat-${story.category}`}>{story.categoryLabel}</span>
                  <a href={R('article/article.html')}>
                    <h4 className="text-sm font-semibold mt-1 leading-snug hover:text-red-600 transition-colors">{story.title}</h4>
                  </a>
                  <p className="text-xs text-slate-400 mt-1">{story.engagementMetrics?.views} views · {story.publishTime}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    );
  }

  if (type === 'newsletter') {
    return (
      <aside className="sidebar-widget" aria-label="Newsletter signup">
        <div className="sidebar-widget-header">Daily Briefing</div>
        <div className="sidebar-widget-body">
          <p className="text-sm text-slate-600 mb-3">Get the day's most important stories in your inbox each morning.</p>
          <form onSubmit={(e) => e.preventDefault()} aria-label="Newsletter sign up form">
            <label htmlFor="newsletter-email" className="sr-only">Your email address</label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="your@email.com"
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              required
            />
            <button type="submit" className="w-full btn btn-primary text-sm py-2">
              Subscribe Free
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-2">No spam. Unsubscribe anytime.</p>
        </div>
      </aside>
    );
  }

  if (type === 'live-blog') {
    const updates = [
      { time: '14:32', text: 'UN Secretary-General calls for immediate cessation of hostilities.' },
      { time: '13:58', text: 'Emergency Resolution drafted by France and Germany circulated to council members.' },
      { time: '13:22', text: 'US Ambassador arrives at Security Council chambers.' },
      { time: '12:44', text: 'Russia calls for procedural vote to delay emergency session.' },
    ];
    return (
      <aside className="sidebar-widget" aria-label="Live blog updates">
        <div className="sidebar-widget-header flex items-center gap-2">
          <span className="badge-live">LIVE</span> Live Updates
        </div>
        <div className="sidebar-widget-body p-0">
          <ol className="divide-y divide-slate-100" aria-label="Live blog timeline">
            {updates.map((u, i) => (
              <li key={i} className="p-3 flex gap-3">
                <time className="text-xs font-mono text-red-500 font-bold flex-shrink-0 pt-0.5">{u.time}</time>
                <p className="text-xs text-slate-700 leading-relaxed">{u.text}</p>
              </li>
            ))}
          </ol>
          <div className="p-3 border-t border-slate-100">
            <a href={R('article/article.html')} className="text-xs text-blue-600 hover:underline font-semibold">
              Full live coverage →
            </a>
          </div>
        </div>
      </aside>
    );
  }

  if (type === 'video') {
    const videos = stories || ALL_STORIES.filter((s) => s.mediaType === 'video').slice(0, 3).concat(ALL_STORIES.slice(14, 16));
    return (
      <aside className="sidebar-widget" aria-label="Videos">
        <div className="sidebar-widget-header">Must Watch</div>
        <div className="sidebar-widget-body p-0">
          {videos.slice(0, 3).map((v) => (
            <a key={v.id} href={R('video/video.html')} className="flex gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
              <div className="w-20 h-14 relative flex-shrink-0 overflow-hidden rounded bg-slate-100">
                <img src={v.mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center" aria-hidden="true">
                    <IconPlay />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold leading-snug text-slate-800 line-clamp-2">{v.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{v.readLength}</p>
              </div>
            </a>
          ))}
        </div>
      </aside>
    );
  }

  if (type === 'ad') {
    return (
      <aside aria-label="Advertisement">
        <div className="ad-placeholder" style={{ minHeight: '250px' }}>
          <div className="text-center p-4">
            <p className="sponsored-label mb-2">Advertisement</p>
            <p className="text-xs text-slate-400">300×250</p>
          </div>
        </div>
      </aside>
    );
  }

  return null;
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT: FeatureBanner
   ══════════════════════════════════════════════════════════════ */
const FeatureBanner = ({ story, theme = 'dark' }) => {
  const s = story || ALL_STORIES[11];
  return (
    <section className="max-w-screen-2xl mx-auto px-4 py-8" aria-label="Feature banner">
      <div className="feature-banner" style={{ minHeight: '340px' }}>
        <img src={s.mediaUrl} alt="" aria-hidden="true" />
        <div className="feature-banner-overlay" />
        <div className="feature-banner-content">
          <div className="flex items-center gap-3 mb-3">
            <span className="badge-exclusive">Exclusive</span>
            <span className={`cat-label cat-${s.category}`}>{s.categoryLabel}</span>
          </div>
          <a href={R('article/article.html')}>
            <h2 className="headline-lg text-white hover:text-red-200 transition-colors max-w-2xl">{s.title}</h2>
          </a>
          <p className="body-base text-slate-300 mt-3 max-w-xl line-clamp-2">{s.summary}</p>
          <div className="flex items-center gap-4 mt-5">
            <a href={R('article/article.html')} className="btn btn-primary">
              Read Full Story <IconChevronRight />
            </a>
            <div className="text-sm text-slate-300">
              <span>{s.author}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>{s.readLength}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT: SubscriptionModule
   ══════════════════════════════════════════════════════════════ */
const SubscriptionModule = ({ variant = 'full' }) => {
  if (variant === 'inline') {
    return (
      <section className="bg-slate-50 border border-slate-200 rounded-xl p-8 my-8 max-w-screen-2xl mx-auto" aria-label="Subscribe to The Pulse">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h2 className="headline-sm">Unlimited access to quality journalism</h2>
            <p className="body-sm text-slate-500 mt-1">Join 2 million readers. Cancel anytime.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <a href={R('subscribe/subscribe.html')} className="btn btn-primary">
              Start Free Trial
            </a>
            <a href={R('subscribe/subscribe.html')} className="btn btn-secondary">
              See Plans
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="subscription-module max-w-screen-2xl mx-auto" aria-label="Subscribe to The Pulse">
      <div className="px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
          <div>
            <span className="badge-exclusive mb-4 inline-block">Limited Offer</span>
            <h2 className="headline-lg text-white">Independent journalism, built to last.</h2>
            <p className="body-base text-slate-300 mt-4">
              The Pulse is reader-supported. No algorithms. No clickbait. Just deeply reported, fact-checked news that matters.
            </p>
            <ul className="mt-6 space-y-3">
              {['Unlimited access to all articles', 'Daily morning briefing newsletter', 'Ad-free reading experience', 'Exclusive subscriber podcasts', 'Cancel anytime'].map((f) => (
                <li key={f} className="flex items-center gap-3 text-slate-200 text-sm">
                  <span className="text-green-400 font-bold" aria-hidden="true">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-8">
            <p className="text-slate-300 text-sm mb-6">Choose your plan:</p>
            {[
              { label: 'Monthly', price: '$9.99 / mo', desc: 'Billed monthly' },
              { label: 'Annual', price: '$79 / yr', desc: 'Save 34% — most popular', highlight: true },
              { label: 'Student', price: '$4.99 / mo', desc: 'With valid .edu email' },
            ].map((plan) => (
              <label key={plan.label}
                className={`flex items-center justify-between p-3 rounded-lg mb-3 cursor-pointer border transition-colors ${plan.highlight ? 'border-red-500 bg-red-500/10' : 'border-white/20 hover:border-white/40'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="plan" defaultChecked={plan.highlight} className="accent-red-500" aria-label={`${plan.label} plan`} />
                  <div>
                    <p className="text-white font-semibold text-sm">{plan.label}</p>
                    <p className="text-slate-400 text-xs">{plan.desc}</p>
                  </div>
                </div>
                <span className={`font-bold ${plan.highlight ? 'text-red-400' : 'text-white'}`}>{plan.price}</span>
              </label>
            ))}
            <a href={R('subscribe/subscribe.html')} className="btn btn-primary w-full text-center mt-4 py-3 text-base">
              Start 7-Day Free Trial
            </a>
            <p className="text-xs text-slate-400 text-center mt-3">No payment required to start. Cancel anytime.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT: Footer
   ══════════════════════════════════════════════════════════════ */
const Footer = () => {
  const cols = [
    {
      heading: 'The Pulse',
      links: [
        { label: 'About Us', href: '#' },
        { label: 'Our Journalism', href: '#' },
        { label: 'Masthead', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Press Room', href: '#' },
        { label: 'Advertise', href: '#' },
      ],
    },
    {
      heading: 'News Sections',
      links: NAV_CATEGORIES.map((c) => ({ label: c.label, href: R(c.path) })),
    },
    {
      heading: 'Services',
      links: [
        { label: 'Subscribe', href: R('subscribe/subscribe.html') },
        { label: 'My Account', href: R('account/account.html') },
        { label: 'Daily Newsletter', href: '#' },
        { label: 'The Pulse App', href: '#' },
        { label: 'Podcasts', href: '#' },
        { label: 'RSS Feeds', href: '#' },
      ],
    },
    {
      heading: 'Follow Us',
      links: [
        { label: 'Twitter / X', href: '#' },
        { label: 'Instagram', href: '#' },
        { label: 'Facebook', href: '#' },
        { label: 'YouTube', href: '#' },
        { label: 'LinkedIn', href: '#' },
        { label: 'TikTok', href: '#' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Cookie Settings', href: '#' },
        { label: 'Corrections', href: '#' },
        { label: 'Accessibility', href: '#' },
      ],
    },
  ];

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="max-w-screen-2xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800">
          {cols.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-widest">{col.heading}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="footer-link">{link.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <a href={R('index.html')} className="brand-logo text-white">
            THE <span className="text-red-500">PULSE</span>
          </a>
          <p className="text-xs text-slate-500 text-center">
            © {new Date().getFullYear()} The Pulse Media Group. All rights reserved.
            Independent journalism since 2010.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <a href="#" className="footer-link">Privacy</a>
            <a href="#" className="footer-link">Terms</a>
            <a href="#" className="footer-link">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT: PageLayout  (wraps skip link + header + nav + main + footer)
   ══════════════════════════════════════════════════════════════ */
const PageLayout = ({ currentCategory, children }) => (
  <>
    <a href="#main-content" className="skip-link">Skip to main content</a>
    <GlobalUtilityBar />
    <BrandHeader currentCategory={currentCategory} />
    <CategoryNav currentCategory={currentCategory} />
    <main id="main-content" tabIndex="-1">
      {children}
    </main>
    <Footer />
  </>
);

/* ── Export all to window ───────────────────────────────────── */
window.GlobalUtilityBar  = GlobalUtilityBar;
window.BrandHeader       = BrandHeader;
window.CategoryNav       = CategoryNav;
window.LiveTicker        = LiveTicker;
window.HeroEditorial     = HeroEditorial;
window.StoryCard         = StoryCard;
window.StoryGrid         = StoryGrid;
window.SidebarModule     = SidebarModule;
window.EditorialSection  = EditorialSection;
window.FeatureBanner     = FeatureBanner;
window.SubscriptionModule = SubscriptionModule;
window.Footer            = Footer;
window.PageLayout        = PageLayout;
window.ALL_STORIES       = ALL_STORIES;
window.NAV_CATEGORIES    = NAV_CATEGORIES;
window.R                 = R;
