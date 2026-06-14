const { PageShell } = window.ThreadHouse;

function AccountPage() {
  return (
    <PageShell
      eyebrow="Account center"
      title="Your ThreadHouse profile"
      description="Track orders, manage style preferences, and keep your rewards, referrals, and saved outfits in one place."
    >
      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section id="orders" aria-labelledby="orders-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 id="orders-heading" className="text-2xl font-semibold text-slate-950">My Orders</h2>
            <div className="mt-6 space-y-4">
              {[
                ["TH-20941", "Oversized Linen Shirt", "Out for delivery", "Arrives April 24, 2025"],
                ["TH-20783", "Workwear Jumpsuit", "Delivered", "Delivered April 9, 2025"],
              ].map(([order, item, status, note]) => (
                <article key={order} className="rounded-[1.5rem] border border-slate-200 p-4">
                  <h3 className="text-lg font-semibold text-slate-950">{order}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item}</p>
                  <p className="mt-2 text-sm font-medium text-teal-700">{status}</p>
                  <p className="mt-1 text-sm text-slate-500">{note}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="profile-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 id="profile-heading" className="text-2xl font-semibold text-slate-950">Style Profile</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <article className="rounded-[1.5rem] border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-950">Saved preferences</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Preferred fits: oversized shirts, relaxed trousers, structured outerwear.</p>
              </article>
              <article className="rounded-[1.5rem] border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-950">Favorite materials</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Organic cotton, linen blends, and low-impact technical fabrics.</p>
              </article>
            </div>
          </section>

          <section aria-labelledby="saved-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 id="saved-heading" className="text-2xl font-semibold text-slate-950">Saved Outfits</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                ["Studio Layers", "Sage shirt, pleat pants, ochre crossbody"],
                ["Weekend Minimal", "Cloud tee, tailored shorts, structured tote"],
                ["Night Shift", "Mesh top, cargo skirt, hoop set"],
              ].map(([title, details]) => (
                <article key={title} className="rounded-[1.5rem] border border-slate-200 p-4">
                  <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{details}</p>
                  <a href="./products.html" className="focus-ring mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white" aria-label={`Shop products from saved outfit ${title}`}>
                    Shop this outfit
                  </a>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section id="rewards" aria-labelledby="rewards-heading" className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
            <h2 id="rewards-heading" className="text-2xl font-semibold">Loyalty Rewards</h2>
            <p className="mt-3 text-sm text-slate-200">Current balance: 1,880 points</p>
            <div className="mt-4 h-3 rounded-full bg-white/10" aria-hidden="true">
              <div className="h-3 w-4/5 rounded-full bg-lime-300" />
            </div>
            <p className="mt-3 text-sm text-slate-300">Only 120 points until your next free ThreadHouse tote.</p>
          </section>

          <section aria-labelledby="referral-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 id="referral-heading" className="text-2xl font-semibold text-slate-950">Referral Program</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Invite friends and both of you earn $20 toward your next ThreadHouse order.</p>
            <label htmlFor="referral-link" className="mt-4 block text-sm font-medium text-slate-700">Unique share link</label>
            <input id="referral-link" type="text" readOnly value="https://threadhouse.example/invite/TH-MQ-184" className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" aria-label="Your referral link" />
            <button type="button" className="focus-ring mt-4 rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white" aria-label="Copy your referral link">
              Copy link
            </button>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AccountPage />);

