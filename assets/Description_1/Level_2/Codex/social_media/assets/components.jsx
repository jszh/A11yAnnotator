const { useEffect, useMemo, useRef, useState } = React;

function useFocusTrap(isOpen, containerRef, onClose, triggerRef) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      return undefined;
    }

    const node = containerRef.current;
    const selector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    const getFocusable = () => Array.from(node.querySelectorAll(selector));
    const previous = document.activeElement;

    window.requestAnimationFrame(() => {
      const focusable = getFocusable();
      if (focusable[0]) focusable[0].focus();
    });

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusable();
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      const restore = triggerRef?.current || previous;
      if (restore && typeof restore.focus === "function") {
        restore.focus();
      }
    };
  }, [isOpen, containerRef, onClose, triggerRef]);
}

function ReportModal({ isOpen, onClose, triggerRef }) {
  const modalRef = useRef(null);
  useFocusTrap(isOpen, modalRef, onClose, triggerRef);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-20">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-heading"
        className="panel w-full max-w-lg rounded-[2rem] border border-white/70 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="report-dialog-heading" className="text-2xl font-semibold text-slate-950">Report Post</h2>
            <p className="mt-2 text-sm text-slate-600">Choose a reason or close the dialog to return to the feed.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            aria-label="Close report post dialog"
          >
            Close
          </button>
        </div>
        <div className="mt-6 space-y-3">
          {["Spam", "Harassment", "Misinformation"].map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={onClose}
              className="focus-ring block w-full rounded-2xl border border-slate-300 px-4 py-3 text-left text-sm font-medium text-slate-700"
              aria-label={`Report post for ${reason}`}
            >
              {reason}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Composer({ onPost, remaining, setRemaining }) {
  const [message, setMessage] = useState("");
  const [liveMessage, setLiveMessage] = useState("");

  const updateMessage = (value) => {
    const clipped = value.slice(0, 280);
    setMessage(clipped);
    const charsLeft = 280 - clipped.length;
    setRemaining(charsLeft);
    if (charsLeft <= 40) {
      setLiveMessage(`${charsLeft} characters remaining.`);
    } else {
      setLiveMessage("");
    }
  };

  return (
    <section className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="composer-heading">
      <div className="sr-live" aria-live="polite" aria-atomic="true">{liveMessage}</div>
      <h2 id="composer-heading" className="text-2xl font-semibold text-slate-950">Share an update</h2>
      <label className="mt-4 block text-sm font-medium text-slate-800">
        <span>What&apos;s on your mind, Alex?</span>
        <textarea
          value={message}
          onChange={(event) => updateMessage(event.target.value)}
          rows="4"
          className="focus-ring mt-2 w-full rounded-[1.5rem] border border-slate-300 px-4 py-3"
          aria-describedby="composer-help composer-count"
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" aria-label="Add photo to post">
          Add Photo
        </button>
        <button type="button" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" aria-label="Open emoji picker">
          Emoji Picker
        </button>
        <p id="composer-help" className="text-sm text-slate-500">Keep posts under 280 characters.</p>
        <p id="composer-count" className="ml-auto text-sm font-medium text-slate-600">{remaining} characters left</p>
      </div>
      <button
        type="button"
        onClick={() => {
          onPost(message || "Draft posted to your followers.");
          setMessage("");
          setRemaining(280);
        }}
        className="focus-ring mt-4 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        aria-label="Publish new post to your feed"
      >
        Post to Pulse
      </button>
    </section>
  );
}

function PostCard({ post, onAnnounce }) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(post.bookmarked);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const menuButtonRef = useRef(null);

  const likeCount = post.likes + (liked ? 1 : 0);

  return (
    <article className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <img src={post.avatar} alt={`${post.displayName} avatar`} className="h-12 w-12 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{post.displayName}</h3>
              <p className="text-sm text-slate-500">{post.handle} · {post.timestamp}</p>
            </div>
            <div className="relative">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setMenuOpen(false);
                }}
                className="focus-ring rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                aria-label={`Open post options for ${post.handle}`}
                aria-expanded={menuOpen}
              >
                ...
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setReportOpen(true);
                    }}
                    className="focus-ring block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700"
                    aria-label={`Report post by ${post.handle}`}
                  >
                    Report post
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-700">{post.text}</p>
          {post.image && (
            <img src={post.image} alt={`Post by ${post.displayName}`} className="mt-4 w-full rounded-[1.5rem] object-cover" />
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => {
                setLiked((value) => !value);
                onAnnounce(`${liked ? "Removed like from" : "Liked"} post by ${post.handle}.`);
              }}
              aria-pressed={liked}
              className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-slate-700"
              aria-label={`${liked ? "Unlike" : "Like"} post by ${post.handle} — currently ${likeCount} likes`}
            >
              Like {likeCount}
            </button>
            <button
              type="button"
              className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-slate-700"
              aria-label={`Comment on post by ${post.handle} — currently ${post.comments} comments`}
            >
              Comment {post.comments}
            </button>
            <button
              type="button"
              className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-slate-700"
              aria-label={`Share post by ${post.handle} — currently ${post.shares} shares`}
            >
              Share
            </button>
            <button
              type="button"
              onClick={() => {
                setBookmarked((value) => !value);
                onAnnounce(`${bookmarked ? "Removed bookmark from" : "Bookmarked"} post by ${post.handle}.`);
              }}
              aria-pressed={bookmarked}
              className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-slate-700"
              aria-label={`${bookmarked ? "Remove bookmark from" : "Bookmark"} post by ${post.handle}`}
            >
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </button>
          </div>
        </div>
      </div>
      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} triggerRef={menuButtonRef} />
    </article>
  );
}

function Sidebar({ currentPage }) {
  const links = [
    { key: "feed", label: "Feed", href: "./index.html" },
    { key: "explore", label: "Explore", href: "./explore.html" },
    { key: "notifications", label: "Notifications", href: "./notifications.html" },
    { key: "messages", label: "Messages", href: "./messages.html" },
    { key: "profile", label: "Profile", href: "./profile.html" },
    { key: "settings", label: "Settings", href: "./settings.html" }
  ];

  return (
    <aside className="hidden lg:block lg:w-64">
      <nav aria-label="Sidebar navigation" className="sticky top-28 space-y-2">
        {links.map((link) => (
          <a
            key={link.key}
            href={link.href}
            aria-current={currentPage === link.key ? "page" : undefined}
            className={`focus-ring block rounded-2xl px-4 py-3 text-sm font-medium ${
              currentPage === link.key ? "bg-slate-950 text-white" : "panel border border-white/70 text-slate-700"
            }`}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

function TopNav({ currentPage }) {
  const links = [
    { key: "feed", label: "Feed", href: "./index.html" },
    { key: "explore", label: "Explore", href: "./explore.html" },
    { key: "notifications", label: "Notifications", href: "./notifications.html" },
    { key: "messages", label: "Messages", href: "./messages.html" },
    { key: "profile", label: "Profile", href: "./profile.html" },
    { key: "settings", label: "Settings", href: "./settings.html" }
  ];

  return (
    <>
      <a href="#main-content" className="skip-link focus-ring">Skip to main content</a>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-slate-50/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 lg:px-8">
          <a href="./index.html" className="focus-ring rounded-full bg-slate-950 px-4 py-3 text-lg font-semibold text-white">
            Pulse
          </a>
          <nav aria-label="Primary mobile navigation" className="flex flex-wrap gap-2 lg:hidden">
            {links.map((link) => (
              <a
                key={link.key}
                href={link.href}
                aria-current={currentPage === link.key ? "page" : undefined}
                className={`focus-ring rounded-full px-3 py-2 text-sm ${currentPage === link.key ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}

function PageLayout({ currentPage, liveMessage, children, sidebar }) {
  return (
    <div>
      <div className="sr-live" aria-live="polite" aria-atomic="true">{liveMessage}</div>
      <TopNav currentPage={currentPage} />
      <main id="main-content" className="page-main mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="flex gap-8">
          <Sidebar currentPage={currentPage} />
          <div className="min-w-0 flex-1">{children}</div>
          {sidebar ? <aside className="hidden xl:block xl:w-80">{sidebar}</aside> : null}
        </div>
      </main>
    </div>
  );
}
