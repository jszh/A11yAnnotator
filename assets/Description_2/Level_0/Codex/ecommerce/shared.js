window.ThreadHouse = (() => {
  const html = window.htm.bind(window.React.createElement);

  const navItems = [
    { label: "Home", href: "./index.html" },
    { label: "Shop", href: "./products.html" },
    { label: "Product", href: "./product-detail.html" },
    { label: "Cart", href: "./cart.html" },
    { label: "Account", href: "./account.html" },
  ];

  const newArrivals = [
    { name: "Sage Column Tee", price: "$44.00", stock: "Low Stock", tone: "bg-stone-200" },
    { name: "Reclaimed Denim Set", price: "$128.00", stock: "Low Stock", tone: "bg-slate-200" },
    { name: "Cloudline Knit Vest", price: "$62.00", stock: "Low Stock", tone: "bg-amber-100" },
    { name: "Transit Utility Tote", price: "$58.00", stock: "Low Stock", tone: "bg-emerald-100" },
    { name: "Weekend Pleated Trouser", price: "$96.00", stock: "Low Stock", tone: "bg-zinc-200" },
  ];

  const productCatalog = [
    ["Oversized Linen Shirt", "$89.00", "Clothing", "Sage", "Organic Cotton"],
    ["Contour Rib Tank", "$38.00", "Clothing", "Ivory", "Organic Cotton"],
    ["Dune Wrap Skirt", "$74.00", "Clothing", "Clay", "Organic Cotton"],
    ["Patch Pocket Jacket", "$142.00", "Outerwear", "Stone", "Recycled Polyester"],
    ["Soft Form Hoodie", "$84.00", "Clothing", "Forest", "Organic Cotton"],
    ["Shift Cargo Pant", "$95.00", "Clothing", "Black", "Recycled Polyester"],
    ["Studio Poplin Shirt", "$79.00", "Clothing", "Blue", "Organic Cotton"],
    ["Relaxed Knit Polo", "$68.00", "Clothing", "Oat", "Organic Cotton"],
    ["Tapered Work Pant", "$88.00", "Clothing", "Espresso", "Recycled Polyester"],
    ["Boxy Graphic Tee", "$42.00", "Clothing", "White", "Organic Cotton"],
    ["Weekend Windbreaker", "$118.00", "Outerwear", "Olive", "Recycled Polyester"],
    ["Contour Dress", "$102.00", "Clothing", "Fig", "Organic Cotton"],
    ["Canvas Market Bag", "$52.00", "Accessories", "Natural", "Organic Cotton"],
    ["Layered Mesh Top", "$64.00", "Clothing", "Smoke", "Recycled Polyester"],
    ["Textured Lounge Short", "$48.00", "Clothing", "Sand", "Organic Cotton"],
    ["Modular Crossbody", "$76.00", "Accessories", "Black", "Recycled Polyester"],
    ["Cityline Trench", "$164.00", "Outerwear", "Moss", "Recycled Polyester"],
    ["Waffle Henley", "$57.00", "Clothing", "Ash", "Organic Cotton"],
    ["Sculpted Mini Dress", "$91.00", "Clothing", "Cocoa", "Organic Cotton"],
    ["Transit Pleated Short", "$61.00", "Clothing", "Navy", "Recycled Polyester"],
    ["Soft Structure Blazer", "$136.00", "Outerwear", "Pebble", "Recycled Polyester"],
    ["Everyday Hoop Set", "$34.00", "Accessories", "Gold", "Recycled Polyester"],
    ["Cargo Midi Skirt", "$83.00", "Clothing", "Charcoal", "Organic Cotton"],
    ["Mod Crew Sweatshirt", "$72.00", "Clothing", "Rose", "Organic Cotton"],
  ].map((item, index) => ({
    id: index + 1,
    name: item[0],
    price: item[1],
    category: item[2],
    color: item[3],
    material: item[4],
  }));

  const colorSwatches = ["#d6c7b5", "#4e6b5c", "#101828", "#b65e46", "#5b7c9d", "#f2f4f7"];

  const moodTiles = [
    { title: "Minimalist", copy: "Crisp lines, muted palettes, easy layers." },
    { title: "Streetwear", copy: "Bold proportions with an art-school edge." },
    { title: "Workwear", copy: "Utility tailoring for sharp everyday dressing." },
    { title: "Weekend", copy: "Soft textures and travel-light essentials." },
  ];

  function Logo() {
    return html`
      <a href="./index.html" className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold uppercase tracking-[0.28em] text-stone-50">
          TH
        </div>
        <div>
          <p className="text-lg font-semibold tracking-[0.18em] text-slate-900">ThreadHouse</p>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Marketplace</p>
        </div>
      </a>
    `;
  }

  function Header({ current }) {
    return html`
      <header className="sticky top-0 z-40 border-b border-white/50 bg-stone-50/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <${Logo} />
          <div className="hidden flex-1 items-center gap-2 rounded-full bg-white/80 px-4 py-3 shadow-sm ring-1 ring-slate-200 lg:flex">
            <span className="text-slate-400">Search sustainable fits, brands, and looks</span>
          </div>
          <nav className="ml-auto hidden items-center gap-2 lg:flex">
            ${navItems.map(
              (item) => html`
                <a
                  key=${item.href}
                  href=${item.href}
                  className=${`rounded-full px-4 py-2 text-sm font-medium transition ${
                    current === item.href ? "bg-slate-900 text-stone-50" : "text-slate-600 hover:bg-white"
                  }`}
                >
                  ${item.label}
                </a>
              `
            )}
          </nav>
        </div>
        <div className="border-t border-white/50 px-4 py-3 lg:hidden">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            ${navItems.map(
              (item) => html`
                <a
                  key=${item.href}
                  href=${item.href}
                  className=${`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                    current === item.href ? "bg-slate-900 text-stone-50" : "bg-white text-slate-600"
                  }`}
                >
                  ${item.label}
                </a>
              `
            )}
          </div>
        </div>
      </header>
    `;
  }

  function Footer() {
    return html`
      <footer className="mt-20 border-t border-slate-200/80 bg-slate-950 text-stone-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_repeat(3,1fr)] lg:px-8">
          <div className="space-y-4">
            <p className="text-xl font-semibold tracking-[0.14em]">ThreadHouse</p>
            <p className="max-w-sm text-sm text-stone-300">
              Sustainable fashion from independent designers. Built for expressive wardrobes and slower buying habits.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">Shop</p>
            <div className="space-y-2 text-sm text-stone-300">
              <a className="block" href="./products.html">New Arrivals</a>
              <a className="block" href="./products.html">Curated Sets</a>
              <a className="block" href="./product-detail.html">Featured Product</a>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">Support</p>
            <div className="space-y-2 text-sm text-stone-300">
              <a className="block" href="./cart.html">Shipping</a>
              <a className="block" href="./account.html">Returns</a>
              <a className="block" href="./account.html">Rewards</a>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">Visit</p>
            <p className="text-sm text-stone-300">Editorial drops every Thursday</p>
            <p className="mt-2 text-sm text-stone-300">hello@threadhouse.mock</p>
          </div>
        </div>
      </footer>
    `;
  }

  function Shell({ current, children }) {
    return html`
      <div>
        <${Header} current=${current} />
        <main>${children}</main>
        <${Footer} />
      </div>
    `;
  }

  function ProductCard({ product, detailHref = "./product-detail.html", badge }) {
    return html`
      <article className="overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
        <div className="product-shot photo-frame relative p-5">
          ${badge
            ? html`<span className="absolute left-5 top-5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">${badge}</span>`
            : null}
          <div className="h-full rounded-[1.2rem] border border-white/50 bg-white/30"></div>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-900">${product.name}</p>
              <p className="text-sm text-slate-500">${product.category} / ${product.color}</p>
            </div>
            <p className="text-sm font-semibold text-slate-900">${product.price}</p>
          </div>
          <a
            href=${detailHref}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-slate-700"
          >
            View Product
          </a>
        </div>
      </article>
    `;
  }

  function SectionTitle({ eyebrow, title, copy }) {
    return html`
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">${eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">${title}</h2>
        </div>
        ${copy ? html`<p className="max-w-2xl text-sm leading-6 text-slate-600">${copy}</p>` : null}
      </div>
    `;
  }

  return {
    html,
    Header,
    Footer,
    Shell,
    ProductCard,
    SectionTitle,
    navItems,
    newArrivals,
    productCatalog,
    colorSwatches,
    moodTiles,
  };
})();
