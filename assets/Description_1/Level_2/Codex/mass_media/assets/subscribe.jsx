function SubscribePage() {
  const { faq } = window.MeridianData;
  const [selectedPlan, setSelectedPlan] = useState("Digital");
  const [openFaq, setOpenFaq] = useState(faq[0].q);
  const [liveMessage, setLiveMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const modalTriggerRef = useRef(null);

  const plans = [
    { name: "Free", price: "$0", details: "Limited monthly articles, newsletters, and bookmarks." },
    { name: "Digital", price: "$9.99/mo", details: "Unlimited articles, app access, and audio stories." },
    { name: "All-Access", price: "$19.99/mo", details: "Everything in Digital plus events, archives, and gift subscriptions." }
  ];

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = {};
    if (!formData.get("fullName")?.trim()) nextErrors.fullName = "Enter your full name.";
    if (!formData.get("email")?.trim() || !String(formData.get("email")).includes("@")) nextErrors.email = "Enter a valid email address.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setLiveMessage("Subscription form errors are shown.");
      return;
    }
    setLiveMessage(`Selected ${selectedPlan} plan.`);
    setModalOpen(true);
  };

  return (
    <PageLayout currentPage="subscribe" liveMessage={liveMessage}>
      <section>
        <h1 className="font-editorial text-5xl font-semibold text-slate-950">Support independent journalism</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">Choose a Meridian plan to unlock reporting, commentary, archives, and newsletters built for readers who want depth over noise.</p>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className={`panel rounded-[2rem] border p-5 shadow-sm ${selectedPlan === plan.name ? "border-slate-950" : "border-white/70"}`}>
            <h2 className="font-editorial text-3xl font-semibold text-slate-950">{plan.name}</h2>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{plan.price}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{plan.details}</p>
            <button
              type="button"
              onClick={() => {
                setSelectedPlan(plan.name);
                setLiveMessage(`${plan.name} plan selected.`);
              }}
              aria-pressed={selectedPlan === plan.name}
              className={`focus-ring mt-5 rounded-full px-4 py-2 text-sm font-medium ${selectedPlan === plan.name ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700"}`}
              aria-label={`Select ${plan.name} subscription plan`}
            >
              {selectedPlan === plan.name ? "Selected" : "Choose Plan"}
            </button>
          </article>
        ))}
      </section>

      <section className="mt-10 panel rounded-[2rem] border border-white/70 p-5 shadow-sm overflow-x-auto" aria-labelledby="comparison-heading">
        <h2 id="comparison-heading" className="font-editorial text-3xl font-semibold text-slate-950">Feature Comparison</h2>
        <table className="mt-5 min-w-full text-left text-sm text-slate-700">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3">Feature</th>
              <th className="px-4 py-3">Free</th>
              <th className="px-4 py-3">Digital</th>
              <th className="px-4 py-3">All-Access</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100"><td className="px-4 py-3">Monthly articles</td><td className="px-4 py-3">5</td><td className="px-4 py-3">Unlimited</td><td className="px-4 py-3">Unlimited</td></tr>
            <tr className="border-b border-slate-100"><td className="px-4 py-3">Audio stories</td><td className="px-4 py-3">No</td><td className="px-4 py-3">Yes</td><td className="px-4 py-3">Yes</td></tr>
            <tr><td className="px-4 py-3">Events & archives</td><td className="px-4 py-3">No</td><td className="px-4 py-3">No</td><td className="px-4 py-3">Yes</td></tr>
          </tbody>
        </table>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
          <h2 className="font-editorial text-3xl font-semibold text-slate-950">Testimonials</h2>
          <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
            <p>“Meridian’s global coverage is consistently sharper than outlets twice its size.”</p>
            <p>“The app, audio features, and archives make the subscription feel essential.”</p>
          </div>
        </section>

        <section className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="signup-heading">
          <h2 id="signup-heading" className="font-editorial text-3xl font-semibold text-slate-950">Create Your Account</h2>
          <form className="mt-5 grid gap-4" onSubmit={handleSubmit} noValidate>
            <label className="text-sm font-medium text-slate-800">
              Full Name *
              <input
                name="fullName"
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                aria-required="true"
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? "subscribe-name-error" : undefined}
              />
              {errors.fullName && <span id="subscribe-name-error" className="mt-2 block text-sm text-rose-700">{errors.fullName}</span>}
            </label>
            <label className="text-sm font-medium text-slate-800">
              Email *
              <input
                name="email"
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                aria-required="true"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "subscribe-email-error" : undefined}
              />
              {errors.email && <span id="subscribe-email-error" className="mt-2 block text-sm text-rose-700">{errors.email}</span>}
            </label>
            <button
              ref={modalTriggerRef}
              type="submit"
              className="focus-ring rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              aria-label="Submit subscription sign up form"
            >
              Continue to Checkout
            </button>
          </form>
        </section>
      </section>

      <section className="mt-10 panel rounded-[2rem] border border-white/70 p-5 shadow-sm" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="font-editorial text-3xl font-semibold text-slate-950">FAQ</h2>
        <div className="mt-5 space-y-3">
          {faq.map((item) => (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpenFaq((current) => current === item.q ? "" : item.q)}
                aria-expanded={openFaq === item.q}
                aria-controls={`faq-${item.q}`}
                className="faq-button focus-ring flex w-full items-center justify-between rounded-2xl border border-slate-300 px-4 py-3 text-left text-sm font-medium text-slate-800"
              >
                <span>{item.q}</span>
                <span aria-hidden="true">{openFaq === item.q ? "−" : "+"}</span>
              </button>
              <div id={`faq-${item.q}`} hidden={openFaq !== item.q} className="px-4 py-3 text-sm leading-7 text-slate-600">
                {item.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      <SubscribeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} triggerRef={modalTriggerRef} />
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<SubscribePage />);
