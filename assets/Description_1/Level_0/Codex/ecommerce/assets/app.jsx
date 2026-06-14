const { useMemo, useState } = React;

const navItems = [
  { label: "Home", href: "index.html" },
  { label: "Shop", href: "products.html" },
  { label: "Deals", href: "products.html#deals" },
  { label: "Cart", href: "cart.html" },
  { label: "Account", href: "account.html" },
];

const categories = [
  { name: "Electronics", icon: "Devices", accent: "from-sky-500 to-cyan-400" },
  { name: "Kitchen", icon: "Kitchen", accent: "from-orange-500 to-amber-400" },
  { name: "Clothing", icon: "Style", accent: "from-emerald-500 to-lime-400" },
  { name: "Sports", icon: "Active", accent: "from-violet-500 to-fuchsia-400" },
];

const products = [
  {
    id: 1,
    name: "Sony WH-1000XM5 Headphones",
    price: 279.99,
    originalPrice: 349.99,
    rating: 4.8,
    reviews: 1842,
    badge: "20% off",
    brand: "Sony",
    category: "Electronics",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    name: "Samsung 55\" Crystal UHD Smart TV",
    price: 429.99,
    originalPrice: 599.99,
    rating: 4.6,
    reviews: 913,
    badge: "Flash sale",
    brand: "Samsung",
    category: "Electronics",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    name: "Dyson V8 Cordless Vacuum",
    price: 319.99,
    originalPrice: 399.99,
    rating: 4.7,
    reviews: 678,
    badge: "Best seller",
    brand: "Dyson",
    category: "Home",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    name: "KitchenAid Artisan Stand Mixer",
    price: 379.99,
    originalPrice: 449.99,
    rating: 4.9,
    reviews: 2560,
    badge: "Top rated",
    brand: "KitchenAid",
    category: "Kitchen",
    availability: "Low Stock",
    image: "https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 5,
    name: "Nike Air Zoom Pegasus 40",
    price: 109.99,
    originalPrice: 139.99,
    rating: 4.5,
    reviews: 532,
    badge: "New arrival",
    brand: "Nike",
    category: "Sports",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 6,
    name: "Levi's Original Trucker Jacket",
    price: 74.99,
    originalPrice: 98.0,
    rating: 4.4,
    reviews: 326,
    badge: "15% off",
    brand: "Levi's",
    category: "Clothing",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 7,
    name: "Apple Watch Series 9 GPS",
    price: 369.99,
    originalPrice: 399.99,
    rating: 4.8,
    reviews: 1210,
    badge: "Popular",
    brand: "Apple",
    category: "Electronics",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1579586337278-3f436f25d4d6?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 8,
    name: "Instant Pot Duo 7-in-1 Cooker",
    price: 89.99,
    originalPrice: 119.99,
    rating: 4.7,
    reviews: 2441,
    badge: "Deal",
    brand: "Instant Pot",
    category: "Kitchen",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1585515656973-9e8549fc2d0b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 9,
    name: "Adidas Essentials Fleece Hoodie",
    price: 49.99,
    originalPrice: 65.0,
    rating: 4.3,
    reviews: 211,
    badge: "Wardrobe pick",
    brand: "Adidas",
    category: "Clothing",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 10,
    name: "YETI Rambler Travel Mug",
    price: 34.99,
    originalPrice: 39.99,
    rating: 4.9,
    reviews: 842,
    badge: "Hot pick",
    brand: "YETI",
    category: "Home",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 11,
    name: "Canon EOS R50 Mirrorless Camera",
    price: 799.99,
    originalPrice: 899.99,
    rating: 4.7,
    reviews: 419,
    badge: "Creator favorite",
    brand: "Canon",
    category: "Electronics",
    availability: "Low Stock",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 12,
    name: "Bose SoundLink Flex Speaker",
    price: 129.99,
    originalPrice: 149.99,
    rating: 4.6,
    reviews: 624,
    badge: "Outdoor ready",
    brand: "Bose",
    category: "Electronics",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 13,
    name: "Shark Air Purifier Max",
    price: 219.99,
    originalPrice: 269.99,
    rating: 4.5,
    reviews: 388,
    badge: "Healthy home",
    brand: "Shark",
    category: "Home",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 14,
    name: "Ninja Professional Blender",
    price: 99.99,
    originalPrice: 129.99,
    rating: 4.7,
    reviews: 1472,
    badge: "Kitchen deal",
    brand: "Ninja",
    category: "Kitchen",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 15,
    name: "North Face Borealis Backpack",
    price: 89.99,
    originalPrice: 109.99,
    rating: 4.8,
    reviews: 901,
    badge: "Traveler pick",
    brand: "The North Face",
    category: "Sports",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 16,
    name: "LG UltraWide 34\" Monitor",
    price: 499.99,
    originalPrice: 649.99,
    rating: 4.6,
    reviews: 733,
    badge: "Work setup",
    brand: "LG",
    category: "Electronics",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 17,
    name: "Hydro Flask 32oz Bottle",
    price: 39.99,
    originalPrice: 44.99,
    rating: 4.8,
    reviews: 1107,
    badge: "Daily carry",
    brand: "Hydro Flask",
    category: "Sports",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 18,
    name: "Breville Barista Express",
    price: 649.99,
    originalPrice: 749.99,
    rating: 4.9,
    reviews: 981,
    badge: "Premium",
    brand: "Breville",
    category: "Kitchen",
    availability: "Low Stock",
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 19,
    name: "Patagonia Nano Puff Jacket",
    price: 188.99,
    originalPrice: 229.0,
    rating: 4.7,
    reviews: 477,
    badge: "Outdoor edit",
    brand: "Patagonia",
    category: "Clothing",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 20,
    name: "Fitbit Charge 6 Tracker",
    price: 139.99,
    originalPrice: 159.99,
    rating: 4.4,
    reviews: 550,
    badge: "Fitness",
    brand: "Fitbit",
    category: "Sports",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 21,
    name: "HP Envy 14 Laptop",
    price: 899.99,
    originalPrice: 1049.99,
    rating: 4.5,
    reviews: 290,
    badge: "Laptop week",
    brand: "HP",
    category: "Electronics",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 22,
    name: "T-fal Ceramic Cookware Set",
    price: 129.99,
    originalPrice: 179.99,
    rating: 4.3,
    reviews: 365,
    badge: "Bundle",
    brand: "T-fal",
    category: "Kitchen",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1584990347449-a71f3cd43482?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 23,
    name: "Puma Everyday Training Tee",
    price: 24.99,
    originalPrice: 34.99,
    rating: 4.2,
    reviews: 158,
    badge: "Gym basics",
    brand: "Puma",
    category: "Clothing",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 24,
    name: "Anker 3-in-1 Charging Cube",
    price: 89.99,
    originalPrice: 109.99,
    rating: 4.8,
    reviews: 706,
    badge: "Travel tech",
    brand: "Anker",
    category: "Electronics",
    availability: "In Stock",
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80",
  },
];

const cartItems = [
  { ...products[0], quantity: 1, ship: "Free delivery tomorrow" },
  { ...products[7], quantity: 2, ship: "Delivery by Friday" },
  { ...products[19], quantity: 1, ship: "Free pickup available" },
];

function currency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function stars(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function Logo() {
  return (
    <a href="index.html" className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-300">
        N
      </div>
      <div>
        <div className="text-lg font-black tracking-tight text-slate-950">NovaMart</div>
        <div className="text-xs text-slate-500">Marketplace for everyday upgrades</div>
      </div>
    </a>
  );
}

function Header({ currentPage }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="hidden flex-1 items-center gap-3 lg:flex">
          <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner shadow-white">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-400">Search for headphones, cookware, style, and more</span>
              <span className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                Search
              </span>
            </div>
          </div>
        </div>
        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const active = currentPage === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <a href="account.html" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
            Sign In
          </a>
          <a href="cart.html" className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-200">
            Cart (3)
          </a>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/80">
        <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-3 text-sm text-slate-600 sm:px-6 lg:px-8">
          <span className="font-semibold text-slate-950">Browse:</span>
          <span>Electronics</span>
          <span>Home & Kitchen</span>
          <span>Fashion</span>
          <span>Sports & Outdoors</span>
          <span>New Arrivals</span>
          <span>Gift Cards</span>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="text-xl font-black text-white">NovaMart</div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            A modern online marketplace for electronics, home essentials, apparel, and everyday upgrades.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Shop</div>
          <div className="mt-4 space-y-3 text-sm">
            <a href="products.html" className="block hover:text-white">All Products</a>
            <a href="products.html#deals" className="block hover:text-white">Today's Deals</a>
            <a href="product.html" className="block hover:text-white">Featured Product</a>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Support</div>
          <div className="mt-4 space-y-3 text-sm">
            <a href="account.html" className="block hover:text-white">Your Account</a>
            <a href="cart.html" className="block hover:text-white">Shipping & Returns</a>
            <a href="account.html" className="block hover:text-white">Contact Support</a>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Promotions</div>
          <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-base font-semibold text-white">Member perks</div>
            <p className="mt-2 text-sm text-slate-400">Save extra on flash sales, track orders, and unlock weekly member-only drops.</p>
            <a href="account.html" className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">
              Join Nova+
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function PageShell({ currentPage, children }) {
  return (
    <div className="min-h-screen">
      <Header currentPage={currentPage} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function Rating({ rating, reviews }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-semibold text-amber-500">{stars(rating)}</span>
      <span className="font-semibold text-slate-700">{rating}</span>
      <span className="text-slate-400">({reviews})</span>
    </div>
  );
}

function ProductCard({ product, compact = false }) {
  return (
    <article className="product-card rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`overflow-hidden rounded-[24px] bg-slate-100 ${compact ? "aspect-square" : "aspect-[4/3]"}`}>
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">{product.badge}</span>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{product.brand}</span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-base font-semibold text-slate-950">{product.name}</h3>
        <div className="mt-2">
          <Rating rating={product.rating} reviews={product.reviews} />
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-xl font-black tracking-tight text-slate-950">{currency(product.price)}</div>
            <div className="text-sm text-slate-400 line-through">{currency(product.originalPrice)}</div>
          </div>
          <a href="product.html" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            View
          </a>
        </div>
      </div>
    </article>
  );
}

function HomePage() {
  const deals = products.slice(0, 8);

  return (
    <PageShell currentPage="index.html">
      <section className="mx-auto mt-8 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.4fr_0.8fr] lg:px-8">
        <div className="hero-glow rounded-[36px] bg-gradient-to-br from-slate-950 via-sky-900 to-cyan-500 p-8 text-white shadow-2xl shadow-sky-100 sm:p-10">
          <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
            Flash Sale: Up to 50% off Electronics
          </div>
          <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
            Upgrade your daily setup with better tech, better home, and better style.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-sky-50/90">
            Explore curated deals from trusted brands across electronics, kitchen, clothing, and sports. Fresh markdowns go live every hour.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="products.html" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">
              Shop Deals
            </a>
            <a href="product.html" className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white">
              View Featured Product
            </a>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["1.2M+", "Monthly shoppers"],
              ["48h", "Fastest delivery window"],
              ["8,000+", "Items across categories"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <div className="text-2xl font-black">{value}</div>
                <div className="mt-1 text-sm text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Trending Search</div>
            <div className="mt-3 text-2xl font-black text-slate-950">Noise-cancelling headphones</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Save on premium audio, daily carry tech, and work-from-home essentials.
            </p>
            <a href="product.html" className="mt-5 inline-flex rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
              Shop Featured Audio
            </a>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Order with confidence</div>
                <div className="mt-2 text-2xl font-black text-slate-950">Free returns on most items</div>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">30-day returns</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Trending Categories</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Shop by what you need now</h2>
          </div>
          <a href="products.html" className="text-sm font-semibold text-slate-600">Browse all products</a>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <a key={category.name} href="products.html" className={`rounded-[32px] bg-gradient-to-br ${category.accent} p-6 text-white shadow-lg`}>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/75">{category.icon}</div>
              <div className="mt-12 text-2xl font-black tracking-tight">{category.name}</div>
              <div className="mt-2 text-sm text-white/80">Explore top picks and weekly promotions.</div>
            </a>
          ))}
        </div>
      </section>

      <section id="deals" className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Today's Deals</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Limited-time offers moving fast</h2>
          </div>
          <a href="products.html" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            View all deals
          </a>
        </div>
        <div className="mt-6 flex gap-5 overflow-x-auto pb-4">
          {deals.map((product) => (
            <div key={product.id} className="min-w-[280px] max-w-[280px] flex-none">
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function ProductListingPage() {
  const [sort, setSort] = useState("Best Match");
  const sortedProducts = useMemo(() => {
    const copy = [...products];
    if (sort === "Price: Low to High") {
      copy.sort((a, b) => a.price - b.price);
    } else if (sort === "Customer Rating") {
      copy.sort((a, b) => b.rating - a.rating);
    }
    return copy;
  }, [sort]);

  return (
    <PageShell currentPage="products.html">
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Product Listing</div>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Marketplace picks across tech, home, and everyday style</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Browse curated inventory from NovaMart sellers. Compare customer-favorite products, sort by value, and filter by fit.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-100 px-5 py-4 text-sm text-slate-600">
              Showing <span className="font-bold text-slate-950">{sortedProducts.length}</span> products
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">Filters</h2>
            <button className="text-sm font-semibold text-slate-500">Reset</button>
          </div>
          {[
            ["Brand", ["Sony", "Samsung", "Apple", "Nike", "Dyson"]],
            ["Price Range", ["Under $50", "$50 to $150", "$150 to $300", "$300+"]],
            ["Rating", ["4 stars & up", "3 stars & up", "2 stars & up"]],
            ["Availability", ["In Stock", "Low Stock", "Free Shipping"]],
          ].map(([title, items]) => (
            <div key={title} className="mt-8">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</div>
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <label key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-slate-950" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <div>
          <div className="flex flex-col gap-4 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2 text-sm">
              {["Best Match", "Price: Low to High", "Customer Rating"].map((option) => (
                <button
                  key={option}
                  onClick={() => setSort(option)}
                  className={`rounded-full px-4 py-2 font-semibold ${
                    sort === option ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <a href="cart.html" className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
              Review Cart
            </a>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function ProductDetailPage() {
  const product = products[0];
  const [tab, setTab] = useState("Description");
  const related = products.slice(1, 5);

  return (
    <PageShell currentPage="product.html">
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-[110px_minmax(0,1fr)]">
              <div className="grid grid-cols-4 gap-3 md:grid-cols-1">
                {[product.image, products[11].image, products[23].image, products[1].image].map((image, index) => (
                  <div key={index} className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="overflow-hidden rounded-[28px] bg-slate-100">
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              </div>
            </div>
          </div>

          <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="inline-flex rounded-full bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
              Featured deal
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">{product.name}</h1>
            <div className="mt-4">
              <Rating rating={product.rating} reviews={product.reviews} />
            </div>
            <div className="mt-6 flex items-end gap-4">
              <div className="text-4xl font-black tracking-tight text-slate-950">{currency(product.price)}</div>
              <div className="pb-1 text-lg text-slate-400 line-through">{currency(product.originalPrice)}</div>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-500">
              Industry-leading noise cancellation, all-day battery life, plush comfort, and crystal-clear calling for work, travel, and focus sessions.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Color</div>
                <div className="mt-3 flex gap-3">
                  {["Black", "Silver", "Midnight Blue"].map((color, index) => (
                    <button key={color} className={`rounded-full border px-4 py-2 text-sm font-semibold ${index === 0 ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 text-slate-700"}`}>
                      {color}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Size</div>
                <div className="mt-3 flex gap-3">
                  {["Standard", "Travel Kit", "Bundle"].map((size, index) => (
                    <button key={size} className={`rounded-full border px-4 py-2 text-sm font-semibold ${index === 0 ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 text-slate-700"}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <a href="cart.html" className="rounded-full bg-orange-500 px-5 py-4 text-center text-sm font-bold text-white shadow-lg shadow-orange-200">
                Add to Cart
              </a>
              <a href="cart.html" className="rounded-full bg-slate-950 px-5 py-4 text-center text-sm font-bold text-white">
                Buy Now
              </a>
            </div>

            <div className="mt-6 rounded-[28px] bg-slate-50 p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["Free shipping", "On orders over $35"],
                  ["Return policy", "30 days hassle-free"],
                  ["Pickup", "Available at select hubs"],
                ].map(([title, copy]) => (
                  <div key={title}>
                    <div className="text-sm font-semibold text-slate-950">{title}</div>
                    <div className="mt-1 text-sm text-slate-500">{copy}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-4">
            {["Description", "Specs", "Reviews"].map((label) => (
              <button
                key={label}
                onClick={() => setTab(label)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${tab === label ? "tab-active" : "border-transparent bg-slate-100 text-slate-600"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-6">
            {tab === "Description" && (
              <p className="max-w-4xl text-sm leading-7 text-slate-600">
                The Sony WH-1000XM5 blends premium sound, adaptive ANC, and all-day comfort in a lightweight over-ear design. Ideal for commuting, remote work, and focused listening, it automatically optimizes noise cancellation based on your surroundings.
              </p>
            )}
            {tab === "Specs" && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Battery Life", "Up to 30 hours"],
                  ["Connectivity", "Bluetooth 5.2, 3.5mm"],
                  ["Weight", "250 grams"],
                  ["Included", "Case, cable, adapter"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-3xl bg-slate-50 p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
                    <div className="mt-3 text-base font-semibold text-slate-950">{value}</div>
                  </div>
                ))}
              </div>
            )}
            {tab === "Reviews" && (
              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  ["A. Patel", "Excellent sound quality and noticeably better ANC than my previous pair."],
                  ["J. Kim", "Comfortable for long flights and battery life easily lasts a full workweek."],
                  ["M. Rivera", "Premium feel, strong mic performance, and super fast device switching."],
                ].map(([name, copy]) => (
                  <div key={name} className="rounded-3xl bg-slate-50 p-5">
                    <div className="font-semibold text-slate-950">{name}</div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Related Products</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Customers also viewed</h2>
          </div>
          <a href="products.html" className="text-sm font-semibold text-slate-600">View more</a>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} compact />
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function CartPage() {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 14.99;
  const total = subtotal + shipping;

  return (
    <PageShell currentPage="cart.html">
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Cart</div>
                  <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Review your items before checkout</h1>
                </div>
                <a href="products.html" className="text-sm font-semibold text-slate-600">Continue shopping</a>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {cartItems.map((item) => (
                <article key={item.id} className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-5 sm:flex-row">
                    <div className="h-32 w-full overflow-hidden rounded-[24px] bg-slate-100 sm:w-32">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-slate-950">{item.name}</h2>
                          <p className="mt-2 text-sm text-slate-500">{item.ship}</p>
                          <div className="mt-3 text-sm font-medium text-emerald-600">{item.availability}</div>
                        </div>
                        <div className="text-2xl font-black text-slate-950">{currency(item.price)}</div>
                      </div>
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                          <button className="h-9 w-9 rounded-full text-lg font-semibold text-slate-600">-</button>
                          <span className="min-w-[2rem] text-center text-sm font-semibold text-slate-950">{item.quantity}</span>
                          <button className="h-9 w-9 rounded-full text-lg font-semibold text-slate-600">+</button>
                        </div>
                        <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Remove</button>
                        <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Save for later</button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Order Summary</div>
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-950">{currency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Shipping estimate</span>
                <span className="font-semibold text-slate-950">{currency(shipping)}</span>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Promo Code</div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="NOVA20"
                    className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  />
                  <button className="rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Apply</button>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-base">
                <span className="font-semibold text-slate-950">Total</span>
                <span className="text-2xl font-black text-slate-950">{currency(total)}</span>
              </div>
            </div>
            <a href="account.html" className="mt-6 block rounded-full bg-orange-500 px-5 py-4 text-center text-sm font-bold text-white shadow-lg shadow-orange-200">
              Proceed to Checkout
            </a>
            <p className="mt-4 text-xs leading-6 text-slate-400">Taxes, discounts, and final shipping rates are calculated during checkout.</p>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

function AccountPage() {
  return (
    <PageShell currentPage="account.html">
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-slate-200 bg-gradient-to-r from-slate-950 via-sky-900 to-cyan-500 p-8 text-white shadow-2xl shadow-sky-100">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Account Dashboard</div>
              <h1 className="mt-2 text-4xl font-black tracking-tight">Welcome back, Maya</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
                Track orders, manage saved payment details, review wishlisted items, and keep your shopping preferences up to date.
              </p>
            </div>
            <a href="products.html" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">
              Continue Shopping
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        {[
          {
            title: "Order History",
            body: "3 recent orders, including a kitchen bundle arriving Friday and a delivered headphone order.",
            action: "View all orders",
          },
          {
            title: "Saved Addresses",
            body: "Home, office, and gifting addresses are ready for faster checkout.",
            action: "Manage addresses",
          },
          {
            title: "Payment Methods",
            body: "Visa ending in 2288, Amex ending in 9102, and NovaMart store credit available.",
            action: "Update payments",
          },
          {
            title: "Wishlist",
            body: "8 saved items, including a smart TV, mirrorless camera, and outerwear picks.",
            action: "Open wishlist",
          },
          {
            title: "Account Settings",
            body: "Manage your profile, communication preferences, sign-in security, and member perks.",
            action: "Edit settings",
          },
        ].map((section) => (
          <article key={section.title} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{section.title}</div>
            <p className="mt-4 text-base leading-7 text-slate-600">{section.body}</p>
            <a href="products.html" className="mt-6 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              {section.action}
            </a>
          </article>
        ))}
        <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Member Activity</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              ["14", "Orders placed"],
              ["8", "Items wishlisted"],
              ["$62", "Rewards balance"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-3xl bg-slate-50 p-5">
                <div className="text-3xl font-black text-slate-950">{value}</div>
                <div className="mt-2 text-sm text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </PageShell>
  );
}

function AppRouter() {
  const page = document.body.dataset.page;

  if (page === "home") return <HomePage />;
  if (page === "products") return <ProductListingPage />;
  if (page === "product") return <ProductDetailPage />;
  if (page === "cart") return <CartPage />;
  if (page === "account") return <AccountPage />;
  return <HomePage />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppRouter />);
