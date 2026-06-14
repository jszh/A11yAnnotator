function CheckoutModal({ isOpen, onClose, triggerRef, announce }) {
  const modalRef = useRef(null);
  const [errors, setErrors] = useState({});
  useFocusTrap(isOpen, modalRef, onClose, triggerRef);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = {};

    if (!formData.get("fullName")?.trim()) {
      nextErrors.fullName = "Enter the full name for delivery.";
    }
    if (!formData.get("address")?.trim()) {
      nextErrors.address = "Enter a shipping address.";
    }
    if (!formData.get("cardNumber")?.trim()) {
      nextErrors.cardNumber = "Enter a card number to continue.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      announce("Checkout ready. Demo order review completed.");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-16">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        className="glass-panel w-full max-w-2xl rounded-[2rem] border border-white/70 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="checkout-title" className="text-2xl font-semibold text-slate-900">Checkout Overlay</h2>
            <p className="mt-2 text-sm text-slate-600">Required fields include clear instructions and linked error messages.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium"
            aria-label="Close checkout overlay"
          >
            Close
          </button>
        </div>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit} noValidate>
          <label className="text-sm font-medium text-slate-800">
            Full name *
            <input
              name="fullName"
              aria-required="true"
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
            {errors.fullName && <span id="fullName-error" className="mt-2 block text-sm text-rose-700">{errors.fullName}</span>}
          </label>

          <label className="text-sm font-medium text-slate-800">
            Shipping address *
            <input
              name="address"
              aria-required="true"
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? "address-error" : undefined}
              className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
            {errors.address && <span id="address-error" className="mt-2 block text-sm text-rose-700">{errors.address}</span>}
          </label>

          <label className="text-sm font-medium text-slate-800">
            Card number *
            <input
              name="cardNumber"
              inputMode="numeric"
              aria-required="true"
              aria-invalid={Boolean(errors.cardNumber)}
              aria-describedby={errors.cardNumber ? "cardNumber-error" : undefined}
              className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
            {errors.cardNumber && <span id="cardNumber-error" className="mt-2 block text-sm text-rose-700">{errors.cardNumber}</span>}
          </label>

          <button type="submit" className="focus-ring mt-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
            Review Order
          </button>
        </form>
      </div>
    </div>
  );
}

function CartPage() {
  const [liveMessage, setLiveMessage] = useState("");
  const checkoutTriggerRef = useRef(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [items, setItems] = useState([
    { ...window.NovaMartData.products.find((item) => item.id === "sony-wh1000xm5"), quantity: 1 },
    { ...window.NovaMartData.products.find((item) => item.id === "nova-air-fryer"), quantity: 1 },
    { ...window.NovaMartData.products.find((item) => item.id === "metro-backpack"), quantity: 2 }
  ]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 150 ? 0 : 14.99;
  const total = subtotal + shipping;

  const updateQuantity = (id, nextQuantity) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, nextQuantity) } : item
      )
    );
    const item = items.find((entry) => entry.id === id);
    if (item) {
      setLiveMessage(`Updated quantity for ${item.name} to ${Math.max(1, nextQuantity)}.`);
    }
  };

  const removeItem = (id) => {
    const item = items.find((entry) => entry.id === id);
    setItems((currentItems) => currentItems.filter((entry) => entry.id !== id));
    if (item) {
      setLiveMessage(`Removed ${item.name} from cart.`);
    }
  };

  const handlePromoSubmit = (event) => {
    event.preventDefault();
    const promoCode = new FormData(event.currentTarget).get("promoCode")?.trim();
    if (promoCode !== "NOVA10") {
      setPromoError("Promo code not recognized. Try NOVA10 for this mockup.");
      setLiveMessage("Promo code error shown.");
      return;
    }
    setPromoError("");
    setLiveMessage("Promo code NOVA10 applied. Demo discount preview only.");
  };

  return (
    <PageLayout currentPage="cart" liveMessage={liveMessage}>
      <section>
        <h1 className="text-4xl font-semibold text-slate-950">Your Cart</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Review quantities, remove items, and continue with checkout when you&apos;re ready.
        </p>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          {items.map((item) => (
            <article key={item.id} className="glass-panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
              <div className="flex flex-col gap-5 md:flex-row">
                <img src={item.image} alt={item.name} className="h-36 w-36 rounded-[1.5rem] object-cover" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-900">{item.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">{item.shortDescription}</p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">{formatPrice(item.price)}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2" aria-label={`Quantity controls for ${item.name}`}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="focus-ring rounded-full border border-slate-300 px-3 py-2"
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        -
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="focus-ring rounded-full border border-slate-300 px-3 py-2"
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      Remove item
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="glass-panel h-fit rounded-[2rem] border border-white/70 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Order Summary</h2>
          <dl className="mt-6 space-y-3 text-sm text-slate-700">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Shipping estimate</dt><dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
          </dl>

          <section className="mt-8" aria-labelledby="promo-heading">
            <h3 id="promo-heading" className="text-lg font-semibold text-slate-900">Promo Code</h3>
            <form className="mt-3 space-y-3" onSubmit={handlePromoSubmit} noValidate>
              <label className="block text-sm font-medium text-slate-800">
                Enter promo code
                <input
                  name="promoCode"
                  className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                  aria-invalid={Boolean(promoError)}
                  aria-describedby={promoError ? "promo-error" : "promo-help"}
                />
              </label>
              <p id="promo-help" className="text-sm text-slate-500">Use NOVA10 in this demo to preview a valid code flow.</p>
              {promoError && <p id="promo-error" className="text-sm text-rose-700">{promoError}</p>}
              <button type="submit" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                Apply Code
              </button>
            </form>
          </section>

          <button
            ref={checkoutTriggerRef}
            type="button"
            onClick={() => setCheckoutOpen(true)}
            className="focus-ring mt-8 w-full rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white"
            aria-label="Proceed to checkout"
          >
            Proceed to Checkout
          </button>
        </aside>
      </section>

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        triggerRef={checkoutTriggerRef}
        announce={setLiveMessage}
      />
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<CartPage />);
