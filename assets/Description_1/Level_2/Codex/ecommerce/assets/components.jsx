const { useEffect, useId, useMemo, useRef, useState } = React;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

const formatPrice = (value) => currency.format(value);

function useFocusTrap(isOpen, containerRef, onClose, triggerRef) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      return undefined;
    }

    const node = containerRef.current;
    const selector = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    const getFocusable = () => Array.from(node.querySelectorAll(selector));
    const focusable = getFocusable();
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const previous = document.activeElement;

    window.requestAnimationFrame(() => {
      if (first) {
        first.focus();
      }
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) {
        return;
      }

      const currentFocusable = getFocusable();
      const currentFirst = currentFocusable[0];
      const currentLast = currentFocusable[currentFocusable.length - 1];

      if (event.shiftKey && document.activeElement === currentFirst) {
        event.preventDefault();
        currentLast.focus();
      } else if (!event.shiftKey && document.activeElement === currentLast) {
        event.preventDefault();
        currentFirst.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      const restoreTarget = triggerRef?.current || previous;
      if (restoreTarget && typeof restoreTarget.focus === "function") {
        restoreTarget.focus();
      }
    };
  }, [isOpen, containerRef, onClose, triggerRef]);
}

function RatingStars({ rating, labelId }) {
  const stars = Array.from({ length: 5 }, (_, index) => index + 1);
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <div aria-hidden="true" className="flex text-amber-400">
        {stars.map((star) => (
          <span key={star}>{star <= Math.round(rating) ? "★" : "☆"}</span>
        ))}
      </div>
      <span id={labelId}>{rating.toFixed(1)} out of 5 stars</span>
    </div>
  );
}

function SearchDialog({ isOpen, onClose, triggerRef }) {
  const dialogRef = useRef(null);
  useFocusTrap(isOpen, dialogRef, onClose, triggerRef);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 p-4 pt-20">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-dialog-title"
        className="glass-panel w-full max-w-2xl rounded-[2rem] border border-white/70 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="search-dialog-title" className="text-2xl font-semibold text-slate-900">
              Search NovaMart
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Search is a static demo in this mockup. Use the category links to browse featured departments.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            aria-label="Close search dialog"
          >
            Close
          </button>
        </div>
        <form className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-800">Search for products</span>
            <input
              type="search"
              className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
              placeholder="Try headphones, cookware, or travel gear"
              aria-describedby="search-help"
            />
          </label>
          <p id="search-help" className="text-sm text-slate-500">
            Press Tab to move through the dialog and Escape to close it.
          </p>
        </form>
      </div>
    </div>
  );
}

function SiteHeader({ currentPage }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTriggerRef = useRef(null);

  const links = [
    { href: "./index.html", label: "Home", key: "home" },
    { href: "./products.html", label: "Shop", key: "products" },
    { href: "./product.html", label: "Featured Product", key: "product" },
    { href: "./cart.html", label: "Cart", key: "cart" },
    { href: "./account.html", label: "Account", key: "account" }
  ];

  return (
    <>
      <a href="#main-content" className="skip-link focus-ring">
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <a href="./index.html" className="focus-ring rounded-full bg-slate-950 px-4 py-3 text-lg font-semibold tracking-tight text-white">
              NovaMart
            </a>
            <form className="min-w-[16rem] flex-1" role="search" aria-label="Site search">
              <div className="flex rounded-full border border-slate-300 bg-white shadow-sm">
                <input
                  type="search"
                  placeholder="Search electronics, home goods, apparel, and more"
                  className="focus-ring min-w-0 flex-1 rounded-l-full px-4 py-3 text-sm text-slate-900"
                  aria-label="Search products"
                />
                <button
                  ref={searchTriggerRef}
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="focus-ring rounded-r-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white"
                  aria-label="Open search help dialog"
                >
                  Search
                </button>
              </div>
            </form>
            <div className="ml-auto flex items-center gap-3">
              <a href="./cart.html" className="focus-ring rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                View Cart
              </a>
              <a href="./account.html" className="focus-ring rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                Sign In
              </a>
            </div>
          </div>
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-2">
            {links.map((link) => {
              const active = link.key === currentPage;
              return (
                <a
                  key={link.key}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`focus-ring rounded-full px-4 py-2 text-sm font-medium ${
                    active ? "bg-slate-950 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>
        </div>
      </header>
      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} triggerRef={searchTriggerRef} />
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <h2 className="text-xl font-semibold text-white">NovaMart</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
            Everyday marketplace picks across electronics, home goods, kitchen essentials, and apparel.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Shop</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li><a href="./products.html" className="focus-ring rounded text-slate-200">All products</a></li>
            <li><a href="./product.html" className="focus-ring rounded text-slate-200">Featured product</a></li>
            <li><a href="./cart.html" className="focus-ring rounded text-slate-200">Cart</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Account</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li><a href="./account.html" className="focus-ring rounded text-slate-200">Dashboard</a></li>
            <li><a href="./account.html#wishlist" className="focus-ring rounded text-slate-200">Wishlist</a></li>
            <li><a href="./account.html#settings" className="focus-ring rounded text-slate-200">Settings</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

function PageLayout({ currentPage, children, liveMessage }) {
  return (
    <div className="site-shell text-slate-900">
      <div className="sr-only-live" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
      <SiteHeader currentPage={currentPage} />
      <main id="main-content" className="page-main mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

function ProductCard({ product, liveAnnounce, compact = false }) {
  const ratingId = useId();
  return (
    <article className="glass-panel flex h-full flex-col rounded-[2rem] border border-white/70 p-4 shadow-sm shadow-slate-200/50">
      <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-100">
        <img src={product.image} alt={product.name} className="product-image w-full" />
        <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white">
          {product.discount}% off
        </span>
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{product.category}</p>
        <h3 className={`mt-2 font-semibold text-slate-900 ${compact ? "text-base" : "text-lg"}`}>{product.name}</h3>
        <p className="mt-2 text-sm text-slate-600">{product.shortDescription}</p>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xl font-semibold text-slate-950">{formatPrice(product.price)}</span>
          <span className="text-sm text-slate-400 line-through">{formatPrice(product.oldPrice)}</span>
        </div>
        <div className="mt-3">
          <RatingStars rating={product.rating} labelId={ratingId} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="./product.html"
            className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            aria-label={`View details for ${product.name}`}
          >
            View details
          </a>
          <button
            type="button"
            onClick={() => liveAnnounce(`Added ${product.name} to cart.`)}
            className="focus-ring rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            aria-label={`Add ${product.name} to cart`}
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
