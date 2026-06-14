const { PageShell } = window.ThreadHouse;

function CartPage() {
  const [giftWrap, setGiftWrap] = React.useState(false);
  const [quantities, setQuantities] = React.useState({ 1: 1, 2: 1, 3: 1 });
  const [promo, setPromo] = React.useState("");
  const [promoError, setPromoError] = React.useState("");
  const baseItems = [
    { id: 1, name: "Oversized Linen Shirt", variant: "Size M · Sage Green", price: 89, image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80" },
    { id: 2, name: "Wide-Leg Hemp Trousers", variant: "Size 30 · Sand", price: 112, image: "https://images.unsplash.com/photo-1506629905607-d9c297d15d0a?auto=format&fit=crop&w=900&q=80" },
    { id: 3, name: "Canvas Crossbody", variant: "Ochre", price: 58, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80" },
  ];

  const subtotal = baseItems.reduce((sum, item) => sum + item.price * quantities[item.id], 0);
  const total = subtotal + (giftWrap ? 5 : 0);

  const setQuantity = (id, next) => {
    setQuantities((current) => ({ ...current, [id]: Math.max(1, next) }));
    const region = document.getElementById("cart-live-region");
    if (region) {
      region.textContent = `Updated quantity for item ${id}. Cart total is now $${total}.`;
    }
  };

  const applyPromo = (event) => {
    event.preventDefault();
    if (!promo.trim()) {
      setPromoError("Enter a promo code before applying.");
      return;
    }
    if (promo.trim().toUpperCase() !== "THREAD10") {
      setPromoError("Promo code not recognized. Try THREAD10.");
      return;
    }
    setPromoError("");
    const region = document.getElementById("cart-live-region");
    if (region) {
      region.textContent = "Promo code THREAD10 accepted. Discount will apply at checkout.";
    }
  };

  return (
    <PageShell
      eyebrow="Shopping cart"
      title="Review your ThreadHouse bag"
      description="Double-check sizes, add gift wrapping, and head to checkout with a clear view of timing, rewards, and delivery."
    >
      <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
        <section aria-labelledby="cart-items-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id="cart-items-heading" className="text-2xl font-semibold text-slate-950">Items in your cart</h2>
            <p id="cart-live-region" aria-live="polite" className="text-sm text-slate-500">3 items ready for checkout.</p>
          </div>
          <div className="mt-6 space-y-5">
            {baseItems.map((item) => (
              <article key={item.id} className="grid gap-4 rounded-[2rem] border border-slate-200 p-4 md:grid-cols-[120px_1fr_auto] md:items-center">
                <img src={item.image} alt={`${item.name} selected in cart`} className="h-32 w-full rounded-[1.5rem] object-cover" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{item.variant}</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">Estimated delivery: April 24, 2025</p>
                </div>
                <div className="space-y-3">
                  <p className="text-lg font-semibold text-slate-950">${item.price}.00</p>
                  <div className="flex items-center gap-2" aria-label={`Quantity controls for ${item.name}`}>
                    <button type="button" onClick={() => setQuantity(item.id, quantities[item.id] - 1)} className="focus-ring rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700" aria-label={`Decrease quantity for ${item.name}`}>-</button>
                    <span aria-live="polite" className="min-w-8 text-center text-sm font-medium text-slate-700">{quantities[item.id]}</span>
                    <button type="button" onClick={() => setQuantity(item.id, quantities[item.id] + 1)} className="focus-ring rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700" aria-label={`Increase quantity for ${item.name}`}>+</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="summary-heading" className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
            <h2 id="summary-heading" className="text-2xl font-semibold">Order summary</h2>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>${subtotal}.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Gift wrap</span>
                <span>{giftWrap ? "$5.00" : "$0.00"}</span>
              </div>
              <div className="border-t border-white/20 pt-3 text-base font-semibold">
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span>${total}.00</span>
                </div>
              </div>
            </div>

            <label className="mt-6 flex items-start gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 text-sm">
              <input type="checkbox" checked={giftWrap} onChange={(event) => setGiftWrap(event.target.checked)} className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent text-lime-300 focus:ring-lime-300" aria-describedby="gift-note" />
              <span>
                Add gift wrapping (+$5)
                <span id="gift-note" className="mt-1 block text-slate-300">Recycled tissue wrap and a handwritten ThreadHouse note.</span>
              </span>
            </label>

            <div className="mt-6 rounded-[1.5rem] bg-white/10 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">Rewards</h3>
              <p className="mt-3 text-sm text-slate-100">You're 120 points away from a free tote.</p>
              <div className="mt-3 h-3 rounded-full bg-white/10" aria-hidden="true">
                <div className="h-3 w-2/3 rounded-full bg-lime-300" />
              </div>
            </div>

            <button type="button" className="focus-ring mt-6 w-full rounded-full bg-lime-300 px-6 py-3 text-sm font-semibold text-slate-950" aria-label="Proceed to checkout">
              Continue to checkout
            </button>
          </section>

          <section aria-labelledby="promo-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 id="promo-heading" className="text-2xl font-semibold text-slate-950">Promo code</h2>
            <form className="mt-4 space-y-4" onSubmit={applyPromo} noValidate>
              <div>
                <label htmlFor="promo-code" className="text-sm font-medium text-slate-700">Promo code <span aria-hidden="true">*</span></label>
                <input
                  id="promo-code"
                  type="text"
                  value={promo}
                  onChange={(event) => setPromo(event.target.value)}
                  className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
                  aria-required="true"
                  aria-invalid={promoError ? "true" : "false"}
                  aria-describedby={promoError ? "promo-error" : "promo-help"}
                />
                <p id="promo-help" className="mt-2 text-sm text-slate-500">Try <strong>THREAD10</strong> for this mock experience.</p>
                {promoError ? <p id="promo-error" className="mt-2 text-sm font-medium text-red-700">{promoError}</p> : null}
              </div>
              <button type="submit" className="focus-ring rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800" aria-label="Apply promo code">
                Apply code
              </button>
            </form>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<CartPage />);

