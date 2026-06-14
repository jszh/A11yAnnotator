import { useState, useRef } from "react";
import Layout from "@/components/mass-media/Layout";
import { Check, ArrowRight } from "lucide-react";

const tiers = [
  {
    name: "Free Reader",
    price: "$0",
    period: "",
    description: "Stay informed with access to our published investigations.",
    features: ["All published stories", "Weekly newsletter", "Comment on articles"],
    cta: "Sign Up Free",
    highlighted: false,
  },
  {
    name: "Supporter",
    price: "$7",
    period: "/mo",
    description: "Help fund the reporting that holds power accountable.",
    features: ["Everything in Free", "Supporter badge", "Early access to investigations", "Monthly behind-the-scenes updates"],
    cta: "Become a Supporter",
    highlighted: true,
  },
  {
    name: "Investigator",
    price: "$20",
    period: "/mo",
    description: "Full access to our data, tools, and reporting process.",
    features: ["Everything in Supporter", "Exclusive data newsletter", "Raw dataset access", "Invite to annual briefing", "Direct line to reporters"],
    cta: "Join as Investigator",
    highlighted: false,
  },
];

const impacts = [
  { value: "1,200+", label: "hours of investigative reporting funded by readers last year" },
  { value: "23", label: "major investigations published with reader support" },
  { value: "4,800+", label: "supporters keeping Groundwork independent" },
];

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "onetime">("monthly");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const name = (form.elements.namedItem("fullname") as HTMLInputElement).value;
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.fullname = "Please enter your name.";
    if (!email.trim()) errors.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address.";

    setFormErrors(errors);
    if (Object.keys(errors).length === 0) {
      setSubmitted(true);
    }
  };

  return (
    <Layout title="Support Groundwork">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="font-serif font-bold text-3xl md:text-4xl mb-3">Keep Groundwork Independent</h1>
          <p className="font-sans text-muted-foreground max-w-xl mx-auto">
            We take no corporate funding. Every investigation is powered by readers like you.
            Choose how you'd like to support independent journalism.
          </p>
        </header>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-10" role="group" aria-label="Billing frequency">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 text-sm font-sans font-medium rounded-sm transition-colors ${
              billingCycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            aria-pressed={billingCycle === "monthly"}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("onetime")}
            className={`px-4 py-2 text-sm font-sans font-medium rounded-sm transition-colors ${
              billingCycle === "onetime" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            aria-pressed={billingCycle === "onetime"}
          >
            One-Time
          </button>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {tiers.map((tier) => {
            const isSelected = selectedTier === tier.name;
            return (
              <div
                key={tier.name}
                className={`rounded-sm border p-6 transition-all cursor-pointer ${
                  tier.highlighted
                    ? "border-accent bg-accent/5 ring-2 ring-accent"
                    : isSelected
                    ? "border-primary ring-2 ring-primary"
                    : "border-border hover:border-muted-foreground/30"
                }`}
                onClick={() => setSelectedTier(tier.name)}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${tier.name} plan: ${tier.price}${tier.period}`}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setSelectedTier(tier.name); } }}
              >
                {tier.highlighted && (
                  <span className="inline-block px-2 py-0.5 text-[10px] font-sans font-bold uppercase tracking-wider bg-accent text-accent-foreground rounded-sm mb-3">
                    Most Popular
                  </span>
                )}
                <h2 className="font-serif font-bold text-xl mb-1">{tier.name}</h2>
                <p className="mb-3">
                  <span className="font-sans font-bold text-3xl">{tier.price}</span>
                  {tier.period && <span className="text-sm font-sans text-muted-foreground">{tier.period}</span>}
                </p>
                <p className="text-sm font-sans text-muted-foreground mb-5">{tier.description}</p>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm font-sans">
                      <Check size={15} className="shrink-0 text-primary mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-2.5 text-sm font-sans font-semibold rounded-sm transition-colors ${
                    tier.highlighted
                      ? "bg-accent text-accent-foreground hover:opacity-90"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                  onClick={(e) => { e.stopPropagation(); setSelectedTier(tier.name); }}
                >
                  {tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Impact Metrics */}
        <section className="bg-gw-surface border border-border rounded-sm p-8 mb-16" aria-labelledby="impact-heading">
          <h2 id="impact-heading" className="font-serif font-bold text-xl text-center mb-8">
            Your Support in Action
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {impacts.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-serif font-bold text-3xl text-primary mb-1">{stat.value}</p>
                <p className="text-sm font-sans text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Form */}
        <section className="max-w-md mx-auto mb-16" aria-labelledby="payment-heading">
          <h2 id="payment-heading" className="font-serif font-bold text-xl text-center mb-6">
            Secure Payment
          </h2>

          {submitted ? (
            <div ref={confirmRef} className="text-center p-8 bg-gw-surface border border-border rounded-sm" role="status" aria-live="polite">
              <p className="font-serif font-bold text-xl mb-2">Thank you for your support!</p>
              <p className="text-sm font-sans text-muted-foreground">
                You'll receive a confirmation email shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="fullname" className="block text-sm font-sans font-medium mb-1">
                  Full Name <span className="text-destructive" aria-hidden="true">*</span>
                </label>
                <input
                  id="fullname"
                  name="fullname"
                  type="text"
                  className="w-full px-3 py-2 text-sm font-sans border border-border rounded-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-required="true"
                  aria-invalid={!!formErrors.fullname}
                  aria-describedby={formErrors.fullname ? "fullname-error" : undefined}
                />
                {formErrors.fullname && (
                  <p id="fullname-error" className="text-xs font-sans text-destructive mt-1" role="alert">
                    {formErrors.fullname}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-sans font-medium mb-1">
                  Email <span className="text-destructive" aria-hidden="true">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="w-full px-3 py-2 text-sm font-sans border border-border rounded-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-required="true"
                  aria-invalid={!!formErrors.email}
                  aria-describedby={formErrors.email ? "email-error" : undefined}
                />
                {formErrors.email && (
                  <p id="email-error" className="text-xs font-sans text-destructive mt-1" role="alert">
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="card" className="block text-sm font-sans font-medium mb-1">Card Number</label>
                <input
                  id="card"
                  name="card"
                  type="text"
                  placeholder="•••• •••• •••• ••••"
                  className="w-full px-3 py-2 text-sm font-sans border border-border rounded-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiry" className="block text-sm font-sans font-medium mb-1">Expiry</label>
                  <input
                    id="expiry"
                    name="expiry"
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 text-sm font-sans border border-border rounded-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label htmlFor="cvc" className="block text-sm font-sans font-medium mb-1">CVC</label>
                  <input
                    id="cvc"
                    name="cvc"
                    type="text"
                    placeholder="•••"
                    className="w-full px-3 py-2 text-sm font-sans border border-border rounded-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 text-sm font-sans font-semibold bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Complete Payment <ArrowRight size={16} />
              </button>

              <p className="text-xs font-sans text-muted-foreground text-center">
                Your payment is encrypted and secure. Cancel anytime.
              </p>
            </form>
          )}
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto pb-12" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-serif font-bold text-xl text-center mb-6">
            Frequently Asked Questions
          </h2>
          <FAQAccordion />
        </section>
      </div>
    </Layout>
  );
}

function FAQAccordion() {
  const faqs = [
    { q: "Is my contribution tax-deductible?", a: "Groundwork is a registered 501(c)(3) nonprofit. All contributions are tax-deductible to the extent allowed by law." },
    { q: "Can I cancel my recurring support?", a: "Yes, you can cancel at any time from your account settings. You'll retain access through the end of your billing period." },
    { q: "How is my support used?", a: "100% of reader contributions go directly to funding investigations. We publish an annual transparency report detailing how funds are allocated." },
    { q: "Do you accept corporate sponsorships?", a: "No. Groundwork is 100% reader-funded to maintain editorial independence. We do not accept corporate advertising or sponsorship." },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-0 border border-border rounded-sm divide-y divide-border">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-sans font-medium hover:bg-muted transition-colors"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
            aria-controls={`faq-panel-${i}`}
            id={`faq-button-${i}`}
          >
            {faq.q}
            <span className="shrink-0 ml-4 text-muted-foreground" aria-hidden="true">
              {openIndex === i ? "−" : "+"}
            </span>
          </button>
          <div
            id={`faq-panel-${i}`}
            role="region"
            aria-labelledby={`faq-button-${i}`}
            className={`overflow-hidden transition-all ${openIndex === i ? "max-h-40 pb-4" : "max-h-0"}`}
          >
            <p className="px-5 text-sm font-sans text-muted-foreground leading-relaxed">
              {faq.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}