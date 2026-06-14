(function () {
  const pathMap = {
    home: "index.html",
    explore: "explore/explore.html",
    notifications: "notifications/notifications.html",
    messages: "messages/messages.html",
    bookmarks: "bookmarks/bookmarks.html",
    profile: "profile/profile.html",
    settings: "settings/settings.html"
  };

  const navItems = [
    { key: "home", label: "Home", icon: "🏠" },
    { key: "explore", label: "Explore", icon: "🔎" },
    { key: "notifications", label: "Notifications", icon: "🔔" },
    { key: "messages", label: "Messages", icon: "✉️" },
    { key: "bookmarks", label: "Bookmarks", icon: "🔖" },
    { key: "profile", label: "Profile", icon: "👤" },
    { key: "settings", label: "Settings", icon: "⚙️" }
  ];

  const defaultPosts = [
    {
      user: "Avery Stone",
      handle: "@averystudio",
      time: "2m",
      content:
        "Shipping a cleaner creator workflow today. The best part is instant preview and smoother collaboration with your team.",
      media: "Product Preview",
      stats: { likes: 284, comments: 42, shares: 19, views: "12.4K" }
    },
    {
      user: "Nina Park",
      handle: "@ninapark",
      time: "14m",
      content:
        "Design systems are living products. We just refreshed spacing and interaction patterns across every surface.",
      media: "Design Board",
      stats: { likes: 731, comments: 88, shares: 51, views: "31.1K" }
    },
    {
      user: "Leo Carter",
      handle: "@leocodes",
      time: "38m",
      content:
        "Small accessibility improvements scale faster than people think. Focus rings are now consistent across our whole app.",
      media: "Accessibility Notes",
      stats: { likes: 192, comments: 21, shares: 8, views: "8.7K" }
    }
  ];

  const defaultTrending = [
    { topic: "#WebDesign", posts: "45.2K posts" },
    { topic: "#ProductLaunch", posts: "19.8K posts" },
    { topic: "#AIWorkflows", posts: "87.3K posts" },
    { topic: "#CreatorEconomy", posts: "23.5K posts" }
  ];

  const defaultSuggestions = [
    { name: "Maya Chen", handle: "@mayaui" },
    { name: "Theo Grant", handle: "@theoproduct" },
    { name: "Rina Blake", handle: "@rinastudio" }
  ];

  const defaultNews = [
    "Platform updates improve creator monetization tools",
    "Short-form video engagement rises this quarter",
    "Teams adopt keyboard-first collaboration practices"
  ];

  function resolvePath(basePath, target) {
    if (basePath === ".") {
      return "./" + target;
    }
    return basePath.replace(/\/$/, "") + "/" + target;
  }

  function initials(name) {
    return name
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function TopHeader(props) {
    return (
      <header className="top-header sticky top-0 z-40" role="banner">
        <div className="top-header-inner">
          <a className="brand-link focus-ring" href={resolvePath(props.basePath, pathMap.home)} aria-label="Go to home feed">
            <span className="brand-mark" aria-hidden="true">SF</span>
            <span className="brand-text">SocialFeed</span>
          </a>
          <form className="search-wrap" role="search" aria-label="Search content">
            <label className="sr-only" htmlFor="site-search">Search</label>
            <input id="site-search" className="search-input focus-ring" type="search" placeholder="Search posts, people, and topics" />
          </form>
          <div className="header-actions" aria-label="Quick actions">
            <a className="quick-action focus-ring" href={resolvePath(props.basePath, pathMap.notifications)} aria-label="Open notifications">
              <span aria-hidden="true">🔔</span>
              <span>Alerts</span>
            </a>
            <a className="quick-action focus-ring" href={resolvePath(props.basePath, pathMap.messages)} aria-label="Open messages">
              <span aria-hidden="true">✉️</span>
              <span>Inbox</span>
            </a>
            <a className="quick-action focus-ring" href={resolvePath(props.basePath, pathMap.profile)} aria-label="Open profile">
              <span aria-hidden="true">👤</span>
              <span>Profile</span>
            </a>
            <button type="button" className="primary-btn focus-ring" aria-label="Create a post">✍️ Create Post</button>
          </div>
        </div>
      </header>
    );
  }

  function SidebarNav(props) {
    return (
      <aside className="left-rail" aria-label="Primary navigation">
        <nav className="nav-card" aria-label="Sidebar">
          {navItems.map((item) => {
            const active = props.currentPage === item.key;
            return (
              <a
                key={item.key}
                href={resolvePath(props.basePath, pathMap[item.key])}
                aria-current={active ? "page" : undefined}
                className={"nav-item focus-ring" + (active ? " active" : "")}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            );
          })}
          <button type="button" className="primary-btn nav-cta focus-ring">📝 Create Post</button>
        </nav>
        <section className="profile-mini" aria-label="Current user">
          <div className="avatar-circle" aria-hidden="true">MQ</div>
          <div>
            <p className="mini-name">Meng Qishi</p>
            <p className="mini-handle">@mengqishi</p>
          </div>
        </section>
      </aside>
    );
  }

  function FeedComposer() {
    return (
      <section className="card composer" aria-label="Post composer">
        <h2 className="sr-only">Create a post</h2>
        <div className="composer-row">
          <div className="avatar-circle" aria-hidden="true">MQ</div>
          <label className="sr-only" htmlFor="composer-text">What's happening?</label>
          <textarea id="composer-text" className="composer-input focus-ring" rows="3" placeholder="What's happening?" />
        </div>
        <div className="composer-actions">
          <button type="button" className="ghost-btn focus-ring" aria-label="Add image">🖼️ Image</button>
          <button type="button" className="ghost-btn focus-ring" aria-label="Add video">🎬 Video</button>
          <button type="button" className="ghost-btn focus-ring" aria-label="Add poll">📊 Poll</button>
          <button type="button" className="primary-btn focus-ring" aria-label="Publish post">🚀 Post Now</button>
        </div>
      </section>
    );
  }

  function PostCard(props) {
    const post = props.post;
    return (
      <article className="post-card" aria-label={"Post by " + post.user}>
        <header className="post-head">
          <div className="avatar-circle" aria-hidden="true">{initials(post.user)}</div>
          <div>
            <p className="post-user">{post.user} <span className="post-handle">{post.handle}</span></p>
            <p className="post-time">{post.time} ago</p>
          </div>
        </header>
        <p className="post-text">{post.content}</p>
        <div className="post-media" role="img" aria-label={post.media + " placeholder"}>
          <span>{post.media}</span>
        </div>
        <footer className="post-actions" aria-label="Post actions">
          <button type="button" className="ghost-btn focus-ring" aria-label="Like post">❤️ Like {post.stats.likes}</button>
          <button type="button" className="ghost-btn focus-ring" aria-label="Comment on post">💬 Comment {post.stats.comments}</button>
          <button type="button" className="ghost-btn focus-ring" aria-label="Share post">🔁 Share {post.stats.shares}</button>
          <button type="button" className="ghost-btn focus-ring" aria-label="View post metrics">👁️ Views {post.stats.views}</button>
          <button type="button" className="ghost-btn focus-ring" aria-label="Bookmark post">🔖 Bookmark</button>
        </footer>
      </article>
    );
  }

  function TrendingCard(props) {
    return (
      <section className="card side-card" aria-labelledby="trending-title">
        <h2 id="trending-title" className="side-title">Trending</h2>
        <ul className="side-list">
          {props.items.map((item) => (
            <li key={item.topic}>
              <a className="list-link focus-ring" href="#" onClick={(e) => e.preventDefault()}>
                <span className="topic">{item.topic}</span>
                <span className="meta">{item.posts}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  function SuggestionCard(props) {
    return (
      <section className="card side-card" aria-labelledby="suggestion-title">
        <h2 id="suggestion-title" className="side-title">Who to follow</h2>
        <ul className="side-list">
          {props.items.map((person) => (
            <li key={person.handle} className="suggestion-item">
              <div>
                <p className="suggestion-name">{person.name}</p>
                <p className="meta">{person.handle}</p>
              </div>
              <button type="button" className="ghost-btn focus-ring" aria-label={"Follow " + person.name}>Follow</button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  function RightRail(props) {
    const news = props.news || defaultNews;
    return (
      <aside className="right-rail" aria-label="Contextual information">
        <TrendingCard items={props.trending || defaultTrending} />
        <section className="card side-card" aria-labelledby="news-title">
          <h2 id="news-title" className="side-title">News</h2>
          <ul className="side-list">
            {news.map((item) => (
              <li key={item}>
                <a className="list-link focus-ring" href="#" onClick={(e) => e.preventDefault()}>
                  <span className="topic">{item}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
        <SuggestionCard items={props.suggestions || defaultSuggestions} />
        <section className="card side-card promo" aria-label="Premium promotion">
          <h2 className="side-title">Go Premium</h2>
          <p>Unlock analytics, priority replies, and advanced audience insights.</p>
          <button type="button" className="primary-btn focus-ring">Upgrade</button>
        </section>
        <section className="card side-card" aria-label="Sponsored content">
          <h2 className="side-title">Sponsored</h2>
          <div className="sponsored-box">Your brand campaign could appear here.</div>
        </section>
      </aside>
    );
  }

  function FeedTabs(props) {
    const tabs = ["For You", "Following", "Recommended"];
    return (
      <div className="tabs" role="tablist" aria-label="Feed filters">
        {tabs.map((tab) => {
          const active = (props.activeTab || "For You") === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active ? "true" : "false"}
              className={"tab-btn focus-ring" + (active ? " active" : "")}
            >
              {tab}
            </button>
          );
        })}
      </div>
    );
  }

  function MainContent(props) {
    const posts = props.posts || defaultPosts;
    return (
      <main id="main-content" className="feed" aria-label={props.pageLabel || "Content feed"}>
        <section className="page-intro card">
          <h1>{props.title}</h1>
          <p>{props.subtitle}</p>
        </section>
        <FeedTabs activeTab={props.activeTab} />
        <FeedComposer />
        <section aria-label="Post feed" className="post-stack">
          {posts.concat(posts).map((post, idx) => (
            <PostCard key={post.user + idx} post={post} />
          ))}
        </section>
      </main>
    );
  }

  function MobileNav(props) {
    return (
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 5).map((item) => {
          const active = props.currentPage === item.key;
          return (
            <a
              key={item.key}
              href={resolvePath(props.basePath, pathMap[item.key])}
              className={"mobile-link focus-ring" + (active ? " active" : "")}
              aria-current={active ? "page" : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    );
  }

  function App(props) {
    return (
      <>
        <a href="#main-content" className="skip-link focus-ring">Skip to main content</a>
        <TopHeader basePath={props.basePath} />
        <div className="app-shell">
          <SidebarNav currentPage={props.currentPage} basePath={props.basePath} />
          <MainContent
            title={props.title}
            subtitle={props.subtitle}
            activeTab={props.activeTab}
            posts={props.posts}
            pageLabel={props.pageLabel}
          />
          <RightRail trending={props.trending} suggestions={props.suggestions} news={props.news} />
        </div>
        <MobileNav currentPage={props.currentPage} basePath={props.basePath} />
      </>
    );
  }

  function renderPage(config) {
    const root = document.getElementById("app");
    const appConfig = Object.assign(
      {
        basePath: ".",
        currentPage: "home",
        title: "Welcome back",
        subtitle: "Stay on top of conversations, trends, and stories from your community.",
        activeTab: "For You"
      },
      config || {}
    );
    ReactDOM.createRoot(root).render(<App {...appConfig} />);
  }

  window.SocialFeedApp = {
    renderPage: renderPage
  };
})();
