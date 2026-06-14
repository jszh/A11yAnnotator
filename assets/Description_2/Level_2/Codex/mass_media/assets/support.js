const { html, PageShell, announce } = window.Groundwork;

function FAQItem({ item, isOpen, onToggle }) {
  return html`
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <h3>
        <button
          type="button"
          className="focus-ring flex w-full items-center justify-between gap-4 rounded text-left text-lg font-semibold text-ink"
          aria-expanded=${isOpen}
          aria-controls=${item.id}
          onClick=${onToggle}
        >
          <span>${item.question}</span>
          <span aria-hidden="true">${isOpen ? "−" : "+"}</span>
        </button>
      </h3>
      ${isOpen ? html`<p id=${item.id} className="mt-4 text-sm leading-7 text-slate-600">${item.answer}</p>` : null}
    </div>
  `;
}

function SupportPage() {
  const [billingMode, setBillingMode] = React.useState("recurring");
  const [selectedPlan, setSelectedPlan] = React.useState("supporter");
  const [newsletterStatus, setNewsletterStatus] = React.useState("");
  const [form, setForm] = React.useState({ name: "", email: "", card: "" });
  const [errors, setErrors] = React.useState({});
  const [faqOpen, setFaqOpen] = React.useState("faq-1");

  const plans = [
    { id: "free", name: "Free Reader", price: "$0", detail: "Access to free investigations and public newsletters." },
    { id: "supporter", name: "Supporter", price: "$7/mo", detail: "Monthly support for field reporting and accountability coverage." },
    { id: "investigator", name: "Investigator", price: "$20/mo", detail: "Includes newsletter briefings and data access previews." },
  ];

  const faqs = [
    { id: "faq-1", question: "Can I give one time instead of monthly?", answer: "Yes. Use the billing toggle to switch to one-time support before submitting payment." },
    { id: "faq-2", question: "What does Investigator access include?", answer: "Investigator members receive early access to select data notes, methodology updates, and the climate accountability newsletter." },
    { id: "faq-3", question: "Is payment handled securely?", answer: "This mockup presents a secure payment form pattern with labeled fields, keyboard navigation, and linked error messaging." },
  ];

  const impact = React.useMemo(() => {
    if (selectedPlan === "investigator") return "Your support funds about 11 hours of reporting each month.";
    if (selectedPlan === "supporter") return "Your support funds about 4 hours of reporting each month.";
    return "Free readers still expand Groundwork's reach and tip pipeline.";
  }, [selectedPlan]);

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Enter the name that should appear on the membership.";
    if (!form.email.trim()) {
      nextErrors.email = "Enter an email address for receipts and newsletters.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = "Enter a valid email address, such as name@example.com.";
    }
    if (!form.card.trim()) nextErrors.card = "Enter a card number to complete the contribution.";
    return nextErrors;
  };

  return html`
    <${PageShell}
      currentPath="./support.html"
      eyebrow="Reader Support"
      title="Keep Groundwork Independent"
      description="Support Groundwork through monthly membership or one-time giving. Reader funding keeps climate investigations free, documented, and accountable."
    >
      <section aria-labelledby="support-tiers" className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 id="support-tiers" className="text-3xl font-serif text-ink">Membership Tiers</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">Choose a plan and billing mode to support Groundwork's reporting.</p>
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1" role="group" aria-label="Billing frequency">
            ${[
              { id: "recurring", label: "Recurring" },
              { id: "one-time", label: "One-Time" },
            ].map((mode) => html`
              <button
                key=${mode.id}
                type="button"
                aria-pressed=${billingMode === mode.id}
                onClick=${() => {
                  setBillingMode(mode.id);
                  announce(`${mode.label} billing selected.`);
                }}
                className=${`focus-ring rounded-full px-4 py-2 text-sm font-semibold ${billingMode === mode.id ? "bg-ink text-white" : "text-slate-700"}`}
              >
                ${mode.label}
              </button>
            `)}
          </div>

          <div className="mt-6 grid gap-5">
            ${plans.map((plan) => html`
              <article key=${plan.id} className=${`rounded-[1.75rem] border p-6 ${selectedPlan === plan.id ? "border-ink bg-white shadow-sm" : "border-slate-200 bg-fog"}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-serif text-ink">${plan.name}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">${plan.detail}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-3xl font-serif text-ink">${billingMode === "one-time" && plan.id !== "free" ? plan.price.replace("/mo", "") : plan.price}</p>
                    <button
                      type="button"
                      aria-pressed=${selectedPlan === plan.id}
                      onClick=${() => {
                        setSelectedPlan(plan.id);
                        announce(`${plan.name} selected.`);
                      }}
                      className="focus-ring mt-3 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      ${selectedPlan === plan.id ? "Selected" : "Choose plan"}
                    </button>
                  </div>
                </div>
              </article>
            `)}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-serif text-ink">Impact Metrics</h2>
          <p className="mt-4 text-base leading-8 text-slate-600">${impact}</p>
          <div className="mt-6 grid gap-4">
            <div className="rounded-[1.5rem] bg-fog p-5">
              <p className="text-4xl font-serif text-ink">182</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">public records requests funded by readers last year</p>
            </div>
            <div className="rounded-[1.5rem] bg-fog p-5">
              <p className="text-4xl font-serif text-ink">64</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">local experts reviewed methodologies before publication</p>
            </div>
          </div>
        </aside>
      </section>

      <section aria-labelledby="newsletter-heading" className="mt-16 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-fog p-6">
          <h2 id="newsletter-heading" className="text-3xl font-serif text-ink">Newsletter Access</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">Subscribe for weekly document-driven updates from the Groundwork newsroom.</p>
          <label htmlFor="newsletter-email" className="mt-5 block text-sm font-semibold text-ink">Email address <span aria-hidden="true">*</span></label>
          <input id="newsletter-email" type="email" className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" aria-required="true" />
          <button type="button" onClick=${() => {
            setNewsletterStatus("Newsletter sign-up submitted. Confirmation sent.");
            announce("Newsletter sign-up confirmation announced.");
          }} className="focus-ring mt-4 rounded-full bg-moss px-5 py-3 text-sm font-semibold text-white">Sign up</button>
          <div className="sr-only" aria-live="polite">${newsletterStatus}</div>
          <p className="mt-3 text-sm text-slate-500">${newsletterStatus}</p>
        </div>

        <form
          noValidate
          onSubmit=${(event) => {
            event.preventDefault();
            const nextErrors = validate();
            setErrors(nextErrors);
            if (Object.keys(nextErrors).length) {
              announce("Please correct the subscription form errors.", "assertive");
              return;
            }
            announce("Support form submitted.");
          }}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-3xl font-serif text-ink">Secure Payment Form</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">All fields are keyboard-accessible and required fields are marked clearly.</p>

          <label htmlFor="member-name" className="mt-6 block text-sm font-semibold text-ink">Full name <span aria-hidden="true">*</span></label>
          <input
            id="member-name"
            value=${form.name}
            onInput=${(event) => setForm({ ...form, name: event.target.value })}
            aria-required="true"
            aria-describedby=${errors.name ? "member-name-error" : undefined}
            className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
          />
          ${errors.name ? html`<p id="member-name-error" className="mt-2 text-sm text-rust">${errors.name}</p>` : null}

          <label htmlFor="member-email" className="mt-5 block text-sm font-semibold text-ink">Email <span aria-hidden="true">*</span></label>
          <input
            id="member-email"
            type="email"
            value=${form.email}
            onInput=${(event) => setForm({ ...form, email: event.target.value })}
            aria-required="true"
            aria-describedby=${errors.email ? "member-email-error" : undefined}
            className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
          />
          ${errors.email ? html`<p id="member-email-error" className="mt-2 text-sm text-rust">${errors.email}</p>` : null}

          <label htmlFor="member-card" className="mt-5 block text-sm font-semibold text-ink">Card number <span aria-hidden="true">*</span></label>
          <input
            id="member-card"
            inputMode="numeric"
            value=${form.card}
            onInput=${(event) => setForm({ ...form, card: event.target.value })}
            aria-required="true"
            aria-describedby=${errors.card ? "member-card-error" : undefined}
            className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
          />
          ${errors.card ? html`<p id="member-card-error" className="mt-2 text-sm text-rust">${errors.card}</p>` : null}

          <button type="submit" className="focus-ring mt-6 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">Complete support</button>
        </form>
      </section>

      <section aria-labelledby="faq-heading" className="mt-16">
        <h2 id="faq-heading" className="text-3xl font-serif text-ink">Frequently Asked Questions</h2>
        <div className="mt-8 grid gap-4">
          ${faqs.map((item) => html`
            <${FAQItem}
              key=${item.id}
              item=${item}
              isOpen=${faqOpen === item.id}
              onToggle=${() => {
                const nextOpen = faqOpen === item.id ? "" : item.id;
                setFaqOpen(nextOpen);
                announce(`${item.question} ${nextOpen ? "expanded" : "collapsed"}.`);
              }}
            />
          `)}
        </div>
      </section>
    </${PageShell}>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${SupportPage} />`);
