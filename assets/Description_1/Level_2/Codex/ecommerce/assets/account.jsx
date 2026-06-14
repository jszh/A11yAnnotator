function AccountPage() {
  const [liveMessage, setLiveMessage] = useState("");
  const [wishlist, setWishlist] = useState([
    { name: "Sony WH-1000XM5 Headphones", saved: true },
    { name: "TrailFlex Running Shoes", saved: true },
    { name: "Aurora Smart Table Lamp", saved: false }
  ]);

  const toggleWishlist = (name) => {
    setWishlist((items) =>
      items.map((item) => item.name === name ? { ...item, saved: !item.saved } : item)
    );
    const item = wishlist.find((entry) => entry.name === name);
    if (item) {
      setLiveMessage(item.saved ? `${name} removed from wishlist.` : `${name} saved to wishlist.`);
    }
  };

  const sections = [
    {
      id: "orders",
      title: "Order History",
      content: "Recent orders include the Summit Fitness Watch Pro, Harbor Cotton Sheet Set, and Arc Wireless Mouse."
    },
    {
      id: "addresses",
      title: "Saved Addresses",
      content: "Home: 241 Market Street, San Francisco, CA. Office: 18 Howard Street, Suite 500."
    },
    {
      id: "payments",
      title: "Payment Methods",
      content: "Visa ending in 2048 and NovaMart Store Card are available for checkout."
    },
    {
      id: "settings",
      title: "Account Settings",
      content: "Manage email preferences, password updates, two-factor authentication, and notification alerts."
    }
  ];

  return (
    <PageLayout currentPage="account" liveMessage={liveMessage}>
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hero-slide rounded-[2rem] p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-200">Account Dashboard</p>
          <h1 className="mt-4 text-4xl font-semibold">Welcome back, Maya</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-100">
            Keep orders, saved payment methods, shipping details, and your wishlist in one place.
          </p>
        </div>

        <section className="glass-panel rounded-[2rem] border border-white/70 p-6 shadow-sm" aria-labelledby="wishlist-heading">
          <h2 id="wishlist-heading" className="text-2xl font-semibold text-slate-900">Wishlist</h2>
          <ul className="mt-6 space-y-4" id="wishlist">
            {wishlist.map((item) => (
              <li key={item.name} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-slate-50 p-4">
                <span className="text-sm font-medium text-slate-800">{item.name}</span>
                <button
                  type="button"
                  onClick={() => toggleWishlist(item.name)}
                  aria-pressed={item.saved}
                  className={`focus-ring rounded-full px-4 py-2 text-sm font-medium ${item.saved ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700"}`}
                  aria-label={`${item.saved ? "Remove" : "Save"} ${item.name} ${item.saved ? "from" : "to"} wishlist`}
                >
                  {item.saved ? "Saved" : "Save item"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-2">
        {sections.map((section) => (
          <article key={section.id} id={section.id} className="glass-panel rounded-[2rem] border border-white/70 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{section.content}</p>
          </article>
        ))}
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AccountPage />);
