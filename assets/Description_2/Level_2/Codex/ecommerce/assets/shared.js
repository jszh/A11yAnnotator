const { useEffect, useRef, useState } = React;
const html = htm.bind(React.createElement);

const ThreadHouse = (() => {
  const navLinks = [
    { href: "./index.html", label: "Home" },
    { href: "./products.html", label: "Shop" },
    { href: "./product.html", label: "Featured Product" },
    { href: "./cart.html", label: "Cart" },
    { href: "./account.html", label: "Account" },
  ];

  const productCatalog = [
    { id: 1, name: "Oversized Linen Shirt", category: "Shirts", price: 89, color: "Sage Green", material: "Organic Cotton", stock: "Low Stock", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80" },
    { id: 2, name: "Boxy Utility Jacket", category: "Outerwear", price: 148, color: "Clay", material: "Recycled Polyester", stock: "New", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80" },
    { id: 3, name: "Wide-Leg Hemp Trousers", category: "Pants", price: 112, color: "Sand", material: "Organic Cotton", stock: "Low Stock", image: "https://images.unsplash.com/photo-1506629905607-d9c297d15d0a?auto=format&fit=crop&w=800&q=80" },
    { id: 4, name: "Ribbed Tank Dress", category: "Dresses", price: 76, color: "Ink", material: "Organic Cotton", stock: "Best Seller", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80" },
    { id: 5, name: "Canvas Crossbody", category: "Accessories", price: 58, color: "Ochre", material: "Recycled Polyester", stock: "Low Stock", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80" },
    { id: 6, name: "Soft Structure Blazer", category: "Outerwear", price: 154, color: "Moss", material: "Organic Cotton", stock: "New", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80" },
    { id: 7, name: "Everyday Jersey Tee", category: "Tops", price: 42, color: "Cloud", material: "Organic Cotton", stock: "Low Stock", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80" },
    { id: 8, name: "Modular Cargo Skirt", category: "Skirts", price: 94, color: "Olive", material: "Recycled Polyester", stock: "New", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80" },
    { id: 9, name: "Lightweight Knit Polo", category: "Tops", price: 68, color: "Stone", material: "Organic Cotton", stock: "Best Seller", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80" },
    { id: 10, name: "Panelled Denim Set", category: "Sets", price: 167, color: "Indigo", material: "Organic Cotton", stock: "Low Stock", image: "https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=800&q=80" },
    { id: 11, name: "Slip Midi Dress", category: "Dresses", price: 120, color: "Cocoa", material: "Recycled Polyester", stock: "New", image: "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&w=800&q=80" },
    { id: 12, name: "Structured Tote", category: "Accessories", price: 84, color: "Black", material: "Recycled Polyester", stock: "Best Seller", image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80" },
    { id: 13, name: "Reversible Bomber", category: "Outerwear", price: 174, color: "Forest", material: "Recycled Polyester", stock: "Low Stock", image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80" },
    { id: 14, name: "Pleated Resort Shirt", category: "Shirts", price: 96, color: "Shell", material: "Organic Cotton", stock: "New", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80" },
    { id: 15, name: "Tailored Shorts", category: "Pants", price: 73, color: "Slate", material: "Organic Cotton", stock: "Best Seller", image: "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=800&q=80" },
    { id: 16, name: "Layering Mesh Top", category: "Tops", price: 54, color: "Rose", material: "Recycled Polyester", stock: "New", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80" },
    { id: 17, name: "Relaxed Pleat Pants", category: "Pants", price: 110, color: "Espresso", material: "Organic Cotton", stock: "Low Stock", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80" },
    { id: 18, name: "Patchwork Cardigan", category: "Knitwear", price: 132, color: "Berry", material: "Organic Cotton", stock: "New", image: "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=800&q=80" },
    { id: 19, name: "Studio Track Jacket", category: "Outerwear", price: 118, color: "Navy", material: "Recycled Polyester", stock: "Low Stock", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80" },
    { id: 20, name: "Organic Cotton Hoodie", category: "Tops", price: 88, color: "Mist", material: "Organic Cotton", stock: "Best Seller", image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=800&q=80" },
    { id: 21, name: "Minimalist Hoop Set", category: "Accessories", price: 39, color: "Gold", material: "Recycled Polyester", stock: "New", image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=80" },
    { id: 22, name: "Workwear Jumpsuit", category: "Sets", price: 156, color: "Charcoal", material: "Organic Cotton", stock: "Low Stock", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80" },
    { id: 23, name: "Weekend Knit Shorts", category: "Pants", price: 61, color: "Sunwash", material: "Organic Cotton", stock: "New", image: "https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=800&q=80" },
    { id: 24, name: "Convertible Bucket Bag", category: "Accessories", price: 102, color: "Plum", material: "Recycled Polyester", stock: "Low Stock", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80" },
  ];

  const moodTiles = [
    { title: "Minimalist", description: "Neutral layers with clean lines and polished textures.", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80" },
    { title: "Streetwear", description: "Volume, utility shapes, and statement accessories.", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80" },
    { title: "Workwear", description: "Tailored separates made for studio-to-office days.", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80" },
    { title: "Weekend", description: "Soft essentials and off-duty staples with a relaxed fit.", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80" },
  ];

  function announce(message) {
    const region = document.getElementById("global-live-region");
    if (!region) return;
    region.textContent = "";
    window.setTimeout(() => {
      region.textContent = message;
    }, 50);
  }

  function Header() {
    return html`
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 lg:px-8">
          <a href="./index.html" className="focus-ring flex shrink-0 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold tracking-[0.2em] text-slate-900" aria-label="ThreadHouse home">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-white">TH</span>
            <span>THREADHOUSE</span>
          </a>
          <nav aria-label="Primary" className="hidden flex-1 items-center justify-center lg:flex">
            <ul className="flex items-center gap-2">
              ${navLinks.map((link) => html`
                <li key=${link.href}>
                  <a href=${link.href} className="focus-ring rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950">
                    ${link.label}
                  </a>
                </li>
              `)}
            </ul>
          </nav>
          <form className="hidden flex-1 justify-end md:flex" role="search" aria-label="Search products">
            <label className="relative block w-full max-w-sm">
              <span className="sr-only">Search ThreadHouse products</span>
              <input type="search" placeholder="Search sustainable fits, bags, sets..." className="focus-ring w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-900 placeholder:text-slate-500" aria-label="Search ThreadHouse products" />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <a href="./products.html" className="focus-ring rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Shop</a>
            <a href="./cart.html" className="focus-ring rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white" aria-label="View shopping cart">Cart</a>
          </div>
        </div>
        <nav aria-label="Mobile primary" className="border-t border-slate-200/80 bg-white/95 px-4 py-3 lg:hidden">
          <ul className="flex flex-wrap gap-2">
            ${navLinks.map((link) => html`
              <li key=${`mobile-${link.href}`}>
                <a href=${link.href} className="focus-ring rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                  ${link.label}
                </a>
              </li>
            `)}
          </ul>
        </nav>
      </header>
    `;
  }

  function Footer() {
    return html`
      <footer className="border-t border-slate-200 bg-slate-950 text-slate-200">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-4 lg:px-8">
          <section aria-labelledby="footer-brand">
            <h2 id="footer-brand" className="text-lg font-semibold text-white">ThreadHouse</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Independent fashion, transparent sourcing, and conscious design for the next generation of wardrobes.</p>
          </section>
          <section aria-labelledby="footer-shop">
            <h2 id="footer-shop" className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Shop</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="./products.html" className="focus-ring rounded text-slate-300 hover:text-white">New arrivals</a></li>
              <li><a href="./product.html" className="focus-ring rounded text-slate-300 hover:text-white">Featured look</a></li>
              <li><a href="./cart.html" className="focus-ring rounded text-slate-300 hover:text-white">Cart</a></li>
            </ul>
          </section>
          <section aria-labelledby="footer-service">
            <h2 id="footer-service" className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Support</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="./account.html" className="focus-ring rounded text-slate-300 hover:text-white">Account center</a></li>
              <li><a href="./account.html#orders" className="focus-ring rounded text-slate-300 hover:text-white">Order tracking</a></li>
              <li><a href="./account.html#rewards" className="focus-ring rounded text-slate-300 hover:text-white">Rewards</a></li>
            </ul>
          </section>
          <section aria-labelledby="footer-note">
            <h2 id="footer-note" className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Values</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">All editorial content is curated to highlight low-impact fibers, maker transparency, and seasonless styling.</p>
          </section>
        </div>
      </footer>
    `;
  }

  function PageShell({ title, eyebrow, description, children }) {
    return html`
      <div className="page-shell text-slate-900">
        <a href="#main-content" className="focus-ring sr-only rounded bg-white px-4 py-2 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">Skip to main content</a>
        <${Header} />
        <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <section className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700">${eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 lg:text-5xl">${title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 lg:text-lg">${description}</p>
          </section>
          ${children}
        </main>
        <${Footer} />
      </div>
    `;
  }

  function ProductCard({ product, actionLabel = "Add to cart", showWishlist = true, href = "./product.html" }) {
    const [saved, setSaved] = useState(false);

    return html`
      <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        <a href=${href} className="focus-ring block" aria-label=${`View details for ${product.name}`}>
          <img src=${product.image} alt=${`${product.name} in ${product.color}`} className="h-72 w-full object-cover" />
        </a>
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">${product.category}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">${product.name}</h3>
              <p className="mt-1 text-sm text-slate-500">${product.color} · ${product.material}</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">${product.stock}</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-slate-950">$${product.price}.00</p>
            <div className="flex items-center gap-2">
              ${showWishlist ? html`
                <button
                  type="button"
                  className="focus-ring rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                  aria-pressed=${saved}
                  aria-label=${`${saved ? "Remove" : "Save"} ${product.name} ${saved ? "from" : "to"} wishlist`}
                  onClick=${() => {
                    const next = !saved;
                    setSaved(next);
                    announce(`${product.name} ${next ? "saved to" : "removed from"} wishlist.`);
                  }}
                >
                  ${saved ? "Saved" : "Save"}
                </button>
              ` : null}
              <button
                type="button"
                className="focus-ring rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white"
                aria-label=${`${actionLabel} ${product.name}`}
                onClick=${() => announce(`${product.name} added to cart.`)}
              >
                ${actionLabel}
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function Modal({ open, title, children, onClose }) {
    const dialogRef = useRef(null);
    const lastFocused = useRef(null);

    useEffect(() => {
      if (!open) return undefined;
      lastFocused.current = document.activeElement;
      const node = dialogRef.current;
      const focusable = node.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
      if (focusable.length) {
        focusable[0].focus();
      }

      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
          return;
        }
        if (event.key !== "Tab") return;
        const current = Array.from(focusable).filter((item) => !item.hasAttribute("disabled"));
        if (!current.length) {
          event.preventDefault();
          return;
        }
        const first = current[0];
        const last = current[current.length - 1];
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
        if (lastFocused.current && typeof lastFocused.current.focus === "function") {
          lastFocused.current.focus();
        }
      };
    }, [open, onClose]);

    if (!open) return null;

    return html`
      <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
        <div ref=${dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <h2 id="modal-title" className="text-2xl font-semibold text-slate-950">${title}</h2>
            <button type="button" onClick=${onClose} className="focus-ring rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700" aria-label=${`Close ${title}`}>
              Close
            </button>
          </div>
          <div className="mt-6">${children}</div>
        </div>
      </div>
    `;
  }

  function Tabs({ tabs }) {
    const [active, setActive] = useState(tabs[0].id);
    const activeTab = tabs.find((tab) => tab.id === active);

    return html`
      <section aria-labelledby="details-tabs-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <h2 id="details-tabs-heading" className="text-2xl font-semibold text-slate-950">Material and care</h2>
        <div role="tablist" aria-label="Product detail tabs" className="mt-4 flex flex-wrap gap-3">
          ${tabs.map((tab) => html`
            <button
              key=${tab.id}
              id=${`${tab.id}-tab`}
              role="tab"
              type="button"
              aria-selected=${active === tab.id}
              aria-controls=${`${tab.id}-panel`}
              className=${`focus-ring rounded-full px-4 py-2 text-sm font-medium ${active === tab.id ? "bg-slate-950 text-white" : "border border-slate-200 text-slate-700"}`}
              onClick=${() => setActive(tab.id)}
            >
              ${tab.label}
            </button>
          `)}
        </div>
        <div id=${`${activeTab.id}-panel`} role="tabpanel" aria-labelledby=${`${activeTab.id}-tab`} className="mt-6 text-sm leading-7 text-slate-600">
          ${activeTab.content}
        </div>
      </section>
    `;
  }

  return {
    html,
    announce,
    PageShell,
    ProductCard,
    Modal,
    Tabs,
    productCatalog,
    moodTiles,
  };
})();

window.ThreadHouse = ThreadHouse;

