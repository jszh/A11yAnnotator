(function () {
  const products = [
    {
      id: 1,
      slug: "sony-wh-1000xm5-headphones",
      name: "Sony WH-1000XM5 Headphones",
      category: "Electronics",
      brand: "Sony",
      price: 279.99,
      originalPrice: 349.99,
      rating: 4.8,
      reviews: 2184,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
      alt: "Sony WH-1000XM5 noise-cancelling headphones in black on a neutral background",
      badge: "20% Off"
    },
    {
      id: 2,
      slug: "nova-air-fryer-xl",
      name: "Nova Air Fryer XL",
      category: "Kitchen",
      brand: "NovaHome",
      price: 119.99,
      originalPrice: 159.99,
      rating: 4.6,
      reviews: 864,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=900&q=80",
      alt: "Large black countertop air fryer with digital controls",
      badge: "Hot Deal"
    },
    {
      id: 3,
      slug: "arc-runner-sneakers",
      name: "Arc Runner Sneakers",
      category: "Clothing",
      brand: "Stride",
      price: 74.99,
      originalPrice: 99.99,
      rating: 4.4,
      reviews: 522,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
      alt: "Pair of orange and gray running sneakers placed on a studio backdrop",
      badge: "New"
    },
    {
      id: 4,
      slug: "trailblaze-camp-pack",
      name: "TrailBlaze Camp Pack",
      category: "Sports",
      brand: "PeakTrail",
      price: 89.99,
      originalPrice: 119.99,
      rating: 4.7,
      reviews: 612,
      availability: "Limited Stock",
      image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      alt: "Outdoor backpack with hiking gear arranged beside it",
      badge: "Top Rated"
    },
    {
      id: 5,
      slug: "lumen-4k-smart-tv",
      name: "Lumen 55-inch 4K Smart TV",
      category: "Electronics",
      brand: "Lumen",
      price: 429.99,
      originalPrice: 549.99,
      rating: 4.5,
      reviews: 936,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=900&q=80",
      alt: "Large flat-screen television displaying a colorful mountain landscape",
      badge: "Flash Sale"
    },
    {
      id: 6,
      slug: "harbor-linen-sheet-set",
      name: "Harbor Linen Sheet Set",
      category: "Home Goods",
      brand: "Harbor",
      price: 64.99,
      originalPrice: 84.99,
      rating: 4.3,
      reviews: 310,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      alt: "Neatly styled bed with light-colored linen sheets and pillows",
      badge: "Best Seller"
    },
    {
      id: 7,
      slug: "pulse-fitness-watch",
      name: "Pulse Fitness Watch",
      category: "Electronics",
      brand: "Pulse",
      price: 149.99,
      originalPrice: 189.99,
      rating: 4.2,
      reviews: 1281,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
      alt: "Modern fitness smartwatch shown on a clean white background",
      badge: "Trending"
    },
    {
      id: 8,
      slug: "terra-ceramic-cookware-set",
      name: "Terra Ceramic Cookware Set",
      category: "Kitchen",
      brand: "Terra",
      price: 199.99,
      originalPrice: 249.99,
      rating: 4.7,
      reviews: 445,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1584990347449-a28fef6c1e0d?auto=format&fit=crop&w=900&q=80",
      alt: "Cream ceramic pots and pans stacked on a kitchen counter",
      badge: "Editor Pick"
    },
    {
      id: 9,
      slug: "studio-denim-jacket",
      name: "Studio Denim Jacket",
      category: "Clothing",
      brand: "Northline",
      price: 84.99,
      originalPrice: 104.99,
      rating: 4.1,
      reviews: 289,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
      alt: "Blue denim jacket hanging in a well-lit studio",
      badge: "Seasonal"
    },
    {
      id: 10,
      slug: "glide-electric-scooter",
      name: "Glide Electric Scooter",
      category: "Sports",
      brand: "Glide",
      price: 319.99,
      originalPrice: 399.99,
      rating: 4.5,
      reviews: 741,
      availability: "Limited Stock",
      image: "https://images.unsplash.com/photo-1608854337221-4cf9fa96059c?auto=format&fit=crop&w=900&q=80",
      alt: "Foldable electric scooter parked on an urban sidewalk",
      badge: "Limited"
    },
    {
      id: 11,
      slug: "atlas-office-chair",
      name: "Atlas Ergonomic Office Chair",
      category: "Home Goods",
      brand: "Atlas",
      price: 229.99,
      originalPrice: 289.99,
      rating: 4.6,
      reviews: 501,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?auto=format&fit=crop&w=900&q=80",
      alt: "Black ergonomic office chair in a bright home office",
      badge: "Staff Pick"
    },
    {
      id: 12,
      slug: "halo-bluetooth-speaker",
      name: "Halo Bluetooth Speaker",
      category: "Electronics",
      brand: "Halo",
      price: 59.99,
      originalPrice: 79.99,
      rating: 4.4,
      reviews: 1122,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
      alt: "Compact portable Bluetooth speaker with textured fabric covering",
      badge: "Deal"
    },
    {
      id: 13,
      slug: "vista-laptop-stand",
      name: "Vista Aluminum Laptop Stand",
      category: "Electronics",
      brand: "Vista",
      price: 34.99,
      originalPrice: 44.99,
      rating: 4.8,
      reviews: 1920,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
      alt: "Aluminum laptop stand supporting a laptop on a desk",
      badge: "Top Seller"
    },
    {
      id: 14,
      slug: "aurora-floor-lamp",
      name: "Aurora Floor Lamp",
      category: "Home Goods",
      brand: "Aurora",
      price: 94.99,
      originalPrice: 129.99,
      rating: 4.5,
      reviews: 378,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      alt: "Tall modern floor lamp placed beside a sofa",
      badge: "Fresh Pick"
    },
    {
      id: 15,
      slug: "swift-dry-performance-tee",
      name: "SwiftDry Performance Tee",
      category: "Clothing",
      brand: "Motion",
      price: 29.99,
      originalPrice: 39.99,
      rating: 4.3,
      reviews: 670,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
      alt: "Athletic performance T-shirt folded on a wooden surface",
      badge: "2 for 1"
    },
    {
      id: 16,
      slug: "summit-yoga-mat",
      name: "Summit Yoga Mat",
      category: "Sports",
      brand: "Summit",
      price: 39.99,
      originalPrice: 54.99,
      rating: 4.7,
      reviews: 850,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
      alt: "Rolled yoga mat with exercise accessories on a studio floor",
      badge: "Wellness"
    },
    {
      id: 17,
      slug: "cafe-espresso-machine",
      name: "Cafe Compact Espresso Machine",
      category: "Kitchen",
      brand: "Cafe",
      price: 249.99,
      originalPrice: 319.99,
      rating: 4.6,
      reviews: 402,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=900&q=80",
      alt: "Stainless steel espresso machine brewing coffee on a kitchen counter",
      badge: "Popular"
    },
    {
      id: 18,
      slug: "orbit-gaming-mouse",
      name: "Orbit RGB Gaming Mouse",
      category: "Electronics",
      brand: "Orbit",
      price: 49.99,
      originalPrice: 69.99,
      rating: 4.4,
      reviews: 1420,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80",
      alt: "RGB gaming mouse glowing on a dark desk surface",
      badge: "Gaming"
    },
    {
      id: 19,
      slug: "harbor-storage-baskets",
      name: "Harbor Woven Storage Baskets",
      category: "Home Goods",
      brand: "Harbor",
      price: 54.99,
      originalPrice: 74.99,
      rating: 4.2,
      reviews: 210,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
      alt: "Set of woven storage baskets placed under a console table",
      badge: "Bundle"
    },
    {
      id: 20,
      slug: "northline-hoodie",
      name: "Northline Everyday Hoodie",
      category: "Clothing",
      brand: "Northline",
      price: 49.99,
      originalPrice: 64.99,
      rating: 4.5,
      reviews: 988,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80",
      alt: "Soft gray hoodie laid flat on a neutral backdrop",
      badge: "Cozy Edit"
    },
    {
      id: 21,
      slug: "peaktrail-water-bottle",
      name: "PeakTrail Insulated Bottle",
      category: "Sports",
      brand: "PeakTrail",
      price: 24.99,
      originalPrice: 34.99,
      rating: 4.8,
      reviews: 1332,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80",
      alt: "Insulated metal water bottle standing upright outdoors",
      badge: "Eco Pick"
    },
    {
      id: 22,
      slug: "terra-knife-block-set",
      name: "Terra Knife Block Set",
      category: "Kitchen",
      brand: "Terra",
      price: 89.99,
      originalPrice: 119.99,
      rating: 4.4,
      reviews: 295,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=900&q=80",
      alt: "Wooden knife block with stainless steel kitchen knives",
      badge: "Chef Choice"
    },
    {
      id: 23,
      slug: "pulse-wireless-earbuds",
      name: "Pulse Wireless Earbuds",
      category: "Electronics",
      brand: "Pulse",
      price: 89.99,
      originalPrice: 129.99,
      rating: 4.1,
      reviews: 1550,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=900&q=80",
      alt: "Wireless earbuds and charging case displayed on a tabletop",
      badge: "Save 30%"
    },
    {
      id: 24,
      slug: "nova-soft-throw-blanket",
      name: "Nova Soft Throw Blanket",
      category: "Home Goods",
      brand: "NovaHome",
      price: 44.99,
      originalPrice: 59.99,
      rating: 4.9,
      reviews: 621,
      availability: "In Stock",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      alt: "Folded soft knit throw blanket draped over a chair",
      badge: "Comfort Pick"
    }
  ];

  const navLinks = [
    { href: "index.html", label: "Home" },
    { href: "products.html", label: "Shop" },
    { href: "product.html", label: "Featured Product" },
    { href: "cart.html", label: "Cart" },
    { href: "account.html", label: "Account" }
  ];

  const categories = [
    { name: "Electronics", description: "Audio, displays, laptops, and mobile essentials." },
    { name: "Kitchen", description: "Cookware, coffee gear, and prep tools for daily cooking." },
    { name: "Clothing", description: "Layering staples, activewear, and everyday style." },
    { name: "Sports", description: "Outdoor, training, and recovery gear for active routines." }
  ];

  function formatPrice(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  }

  function renderStars(rating) {
    const fullStars = Math.round(rating);
    return "★★★★★".slice(0, fullStars) + "☆☆☆☆☆".slice(0, 5 - fullStars);
  }

  function productBySlug(slug) {
    return products.find((product) => product.slug === slug);
  }

  function Header(props) {
    const React = window.React;
    const activePath = props.activePath;
    const searchLabel = props.searchLabel || "Search products";
    return React.createElement(
      "header",
      { className: "sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl" },
      React.createElement(
        "div",
        { className: "mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:px-6" },
        React.createElement(
          "div",
          { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" },
          React.createElement(
            "a",
            {
              href: "index.html",
              className: "inline-flex items-center gap-3 rounded-full text-slate-950 no-underline focus-visible:ring-0"
            },
            React.createElement("span", { className: "inline-flex h-11 w-11 items-center justify-center rounded-full bg-orange-600 text-lg font-bold text-white" }, "N"),
            React.createElement(
              "span",
              null,
              React.createElement("span", { className: "brand-wordmark block text-2xl font-extrabold" }, "NovaMart"),
              React.createElement("span", { className: "block text-sm text-slate-600" }, "Marketplace deals for every room and routine")
            )
          ),
          React.createElement(
            "form",
            { className: "flex w-full max-w-2xl items-center gap-2", role: "search" },
            React.createElement("label", { className: "sr-only", htmlFor: "site-search" }, searchLabel),
            React.createElement("input", {
              id: "site-search",
              type: "search",
              placeholder: "Search electronics, home goods, and apparel",
              className: "w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-500",
              "aria-label": searchLabel
            }),
            React.createElement(
              "button",
              {
                type: "submit",
                className: "rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              },
              "Search"
            )
          ),
          React.createElement(
            "div",
            { className: "flex items-center gap-3" },
            React.createElement(
              "a",
              {
                href: "account.html",
                className: "rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 no-underline hover:border-slate-400 hover:bg-slate-50"
              },
              "Sign In"
            ),
            React.createElement(
              "a",
              {
                href: "cart.html",
                className: "rounded-full bg-orange-600 px-4 py-3 text-sm font-semibold text-white no-underline hover:bg-orange-700"
              },
              "Cart (3)"
            )
          )
        ),
        React.createElement(
          "nav",
          { className: "flex flex-wrap items-center gap-2", "aria-label": "Primary" },
          navLinks.map(function (link) {
            const isActive = link.href === activePath;
            return React.createElement(
              "a",
              {
                key: link.href,
                href: link.href,
                "aria-current": isActive ? "page" : undefined,
                className:
                  "rounded-full px-4 py-2 text-sm font-medium no-underline " +
                  (isActive
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950")
              },
              link.label
            );
          })
        )
      )
    );
  }

  function Footer() {
    const React = window.React;
    return React.createElement(
      "footer",
      { className: "mt-16 border-t border-slate-200 bg-slate-950 text-slate-100" },
      React.createElement(
        "div",
        { className: "mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-4 lg:px-6" },
        React.createElement(
          "div",
          { className: "space-y-3" },
          React.createElement("h2", { className: "text-xl font-bold" }, "NovaMart"),
          React.createElement(
            "p",
            { className: "text-sm leading-6 text-slate-300" },
            "A modern general merchandise marketplace for tech, home, and everyday essentials."
          )
        ),
        React.createElement(
          "div",
          { className: "space-y-3" },
          React.createElement("h2", { className: "text-sm font-semibold uppercase tracking-[0.2em] text-slate-400" }, "Shop"),
          navLinks.slice(0, 3).map(function (link) {
            return React.createElement(
              "a",
              {
                key: link.href,
                href: link.href,
                className: "block text-sm text-slate-200 no-underline hover:text-white"
              },
              link.label
            );
          })
        ),
        React.createElement(
          "div",
          { className: "space-y-3" },
          React.createElement("h2", { className: "text-sm font-semibold uppercase tracking-[0.2em] text-slate-400" }, "Support"),
          ["Shipping & Returns", "Accessibility", "Gift Cards"].map(function (item) {
            return React.createElement("p", { key: item, className: "text-sm text-slate-200" }, item);
          })
        ),
        React.createElement(
          "div",
          { className: "space-y-3" },
          React.createElement("h2", { className: "text-sm font-semibold uppercase tracking-[0.2em] text-slate-400" }, "Stay in the loop"),
          React.createElement("label", { className: "sr-only", htmlFor: "newsletter-email" }, "Email address"),
          React.createElement(
            "div",
            { className: "flex gap-2" },
            React.createElement("input", {
              id: "newsletter-email",
              type: "email",
              className: "w-full rounded-full border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-400",
              placeholder: "Email address"
            }),
            React.createElement(
              "button",
              {
                className: "rounded-full bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700",
                type: "button"
              },
              "Join"
            )
          )
        )
      ),
      React.createElement(
        "div",
        { className: "border-t border-slate-800 px-4 py-4 text-center text-sm text-slate-400" },
        "© 2025 NovaMart. Built for mock shopping experiences."
      )
    );
  }

  window.NovaMartShared = {
    products: products,
    categories: categories,
    formatPrice: formatPrice,
    renderStars: renderStars,
    productBySlug: productBySlug,
    Header: Header,
    Footer: Footer
  };
})();
