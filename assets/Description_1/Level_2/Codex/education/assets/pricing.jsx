function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState("Pro");
  const [openFaq, setOpenFaq] = useState("Can I cancel anytime?");
  const [liveMessage, setLiveMessage] = useState("");
  const plans = [
    { name: "Free", price: "$0", details: "Limited course access and saved progress." },
    { name: "Pro", price: "$19/mo", details: "Full library, certificates, and offline access." },
    { name: "Teams", price: "$49/seat/mo", details: "Admin dashboard, reporting, and team pathways." }
  ];

  return (
    <PageLayout currentPage="pricing" liveMessage={liveMessage}>
      <section>
        <h1 className="text-5xl font-semibold text-slate-950">Plans for every stage of learning</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">Start free, upgrade for the full catalog, or roll out structured learning across your team.</p>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className={`panel rounded-[2rem] border p-5 shadow-sm ${selectedPlan === plan.name ? "border-slate-950" : "border-white/70"}`}>
            <h2 className="text-3xl font-semibold text-slate-950">{plan.name}</h2>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{plan.price}</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">{plan.details}</p>
            <button
              type="button"
              onClick={() => {
                setSelectedPlan(plan.name);
                setLiveMessage(`${plan.name} plan selected.`);
              }}
              aria-pressed={selectedPlan === plan.name}
              className={`focus-ring mt-5 rounded-full px-4 py-2 text-sm font-medium ${selectedPlan === plan.name ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700"}`}
              aria-label={`Choose ${plan.name} plan`}
            >
              {selectedPlan === plan.name ? "Selected" : "Choose Plan"}
            </button>
          </article>
        ))}
      </section>

      <section className="mt-10 panel rounded-[2rem] border border-white/70 p-5 shadow-sm overflow-x-auto">
        <h2 className="text-3xl font-semibold text-slate-950">Feature Comparison</h2>
        <table className="mt-5 min-w-full text-left text-sm text-slate-700">
          <thead><tr className="border-b border-slate-200"><th className="px-4 py-3">Feature</th><th className="px-4 py-3">Free</th><th className="px-4 py-3">Pro</th><th className="px-4 py-3">Teams</th></tr></thead>
          <tbody>
            <tr className="border-b border-slate-100"><td className="px-4 py-3">Course library</td><td className="px-4 py-3">Limited</td><td className="px-4 py-3">Full</td><td className="px-4 py-3">Full</td></tr>
            <tr className="border-b border-slate-100"><td className="px-4 py-3">Certificates</td><td className="px-4 py-3">No</td><td className="px-4 py-3">Yes</td><td className="px-4 py-3">Yes</td></tr>
            <tr><td className="px-4 py-3">Admin tools</td><td className="px-4 py-3">No</td><td className="px-4 py-3">No</td><td className="px-4 py-3">Yes</td></tr>
          </tbody>
        </table>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
          <h2 className="text-3xl font-semibold text-slate-950">Money-back guarantee</h2>
          <p className="mt-4 rounded-full bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" aria-label="30 day money back guarantee badge">30-day money-back guarantee</p>
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
            <p>“LearnPath made it easy to build a weekly study rhythm while working full time.”</p>
            <p>“Our team onboarding time dropped because the learning paths were structured and measurable.”</p>
          </div>
        </section>

        <section className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
          <h2 className="text-3xl font-semibold text-slate-950">FAQ</h2>
          <div className="mt-5 space-y-3">
            {[
              ["Can I cancel anytime?", "Yes. Plans are billed monthly and can be canceled at any time."],
              ["Do you offer certificates?", "Pro and Teams plans include certificates of completion."],
              ["Is there a team dashboard?", "Yes. Teams includes seat management and reporting tools."]
            ].map(([question, answer]) => (
              <div key={question}>
                <button
                  type="button"
                  onClick={() => setOpenFaq((current) => current === question ? "" : question)}
                  aria-expanded={openFaq === question}
                  className="accordion-button focus-ring flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-800 ring-1 ring-slate-300"
                >
                  <span>{question}</span>
                  <span aria-hidden="true">{openFaq === question ? "−" : "+"}</span>
                </button>
                <div hidden={openFaq !== question} className="px-4 py-3 text-sm leading-7 text-slate-600">{answer}</div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<PricingPage />);
