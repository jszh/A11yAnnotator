import { useState } from "react";
import Layout from "@/components/mass-media/Layout";
import { Check, Shield, Heart } from "lucide-react";

const tiers = [
  {
    name: "Free Reader",
    price: "$0",
    period: "",
    description: "Stay informed with full access to all published investigations.",
    features: [
      "All articles and investigations",
      "Weekly newsletter",
      "Comment on stories",
    ],
    cta: "Sign Up Free",
    highlighted: false,
  },
  {
    name: "Supporter",
    price: "$7",
    period: "/mo",
    description: "Fund independent journalism and get deeper access.",
    features: [
      "Everything in Free Reader",
      "Ad-free reading experience",
      "Early access to investigations",
      "Supporter badge on comments",
      "Monthly behind-the-scenes newsletter",
    ],
    cta: "Become a Supporter",
    highlighted: true,
  },
  {
    name: "Investigator",
    price: "$20",
    period: "/mo",
    description: "Maximum impact. Full access to data, documents, and the team.",
    features: [
      "Everything in Supporter",
      "Access to raw datasets and documents",
      "Quarterly data reports (PDF)",
      "Invitation to editorial briefings",
      "Direct line to our reporters",
    ],
    cta: "Join as Investigator",
    highlighted: false,
  },
];

const impactStats = [
  { number: "1,200+", label: "hours of investigative reporting funded by readers in 2025" },
  { number: "23", label: "policy changes influenced by our investigations" },
  { number: "4.2M", label: "readers reached across all platforms" },
];

const SubscribePage = () => {
  const [billingType, setBillingType] = useState<"recurring" | "one-time">("recurring");

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="text-center mb-12">
          <Heart className="w-10 h-10 text-editorial-amber mx-auto mb-4" />
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">Keep Groundwork Independent</h1>
          <p className="mt-3 font-sans text-muted-foreground max-w-xl mx-auto leading-relaxed">
            No corporate sponsors. No paywalls. No agenda but the truth. Your support makes investigative journalism possible.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-muted rounded-lg p-1" role="radiogroup" aria-label="Billing frequency">
            <button
              role="radio"
              aria-checked={billingType === "recurring"}
              onClick={() => setBillingType("recurring")}
              className={`font-sans text-sm font-medium px-5 py-2 rounded-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                billingType === "recurring" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              role="radio"
              aria-checked={billingType === "one-time"}
              onClick={() => setBillingType("one-time")}
              className={`font-sans text-sm font-medium px-5 py-2 rounded-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                billingType === "one-time" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              One-Time
            </button>
          </div>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border p-6 flex flex-col ${
                tier.highlighted
                  ? "border-editorial-amber bg-card shadow-lg ring-2 ring-editorial-amber/30"
                  : "border-border bg-card"
              }`}
            >
              {tier.highlighted && (
                <span className="font-sans text-xs font-semibold uppercase tracking-wider text-editorial-amber mb-2">Most Popular</span>
              )}
              <h2 className="font-serif text-xl font-bold text-foreground">{tier.name}</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-serif text-3xl font-bold text-foreground">
                  {billingType === "one-time" && tier.price !== "$0"
                    ? tier.price === "$7" ? "$84" : "$240"
                    : tier.price}
                </span>
                {tier.period && (
                  <span className="font-sans text-sm text-muted-foreground">
                    {billingType === "one-time" ? "/year" : tier.period}
                  </span>
                )}
              </div>
              <p className="mt-2 font-sans text-sm text-muted-foreground leading-relaxed">{tier.description}</p>

              <ul className="mt-5 space-y-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 font-sans text-sm text-foreground">
                    <Check className="w-4 h-4 mt-0.5 text-editorial-green-light flex-shrink-0" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`mt-6 w-full font-sans text-sm font-semibold py-3 rounded transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  tier.highlighted
                    ? "bg-editorial-amber text-accent-foreground hover:opacity-90"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Impact metrics */}
        <section className="bg-primary rounded-xl p-8 sm:p-12 mb-16">
          <h2 className="font-serif text-2xl font-bold text-primary-foreground text-center mb-8">Your Impact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {impactStats.map((stat) => (
              <div key={stat.number} className="text-center">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-editorial-amber">{stat.number}</span>
                <p className="mt-2 font-sans text-sm text-primary-foreground opacity-80">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Payment form mockup */}
        <section className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-5 h-5 text-editorial-green-light" aria-hidden="true" />
              <span className="font-sans text-sm font-semibold text-foreground">Secure Payment</span>
            </div>

            <form onSubmit={(e) => e.preventDefault()} noValidate>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block font-sans text-sm font-medium text-foreground mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full border border-input rounded px-3 py-2 font-sans text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="card" className="block font-sans text-sm font-medium text-foreground mb-1">Card Number</label>
                  <input
                    id="card"
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    className="w-full border border-input rounded px-3 py-2 font-sans text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-required="true"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expiry" className="block font-sans text-sm font-medium text-foreground mb-1">Expiry</label>
                    <input
                      id="expiry"
                      type="text"
                      placeholder="MM / YY"
                      className="w-full border border-input rounded px-3 py-2 font-sans text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label htmlFor="cvc" className="block font-sans text-sm font-medium text-foreground mb-1">CVC</label>
                    <input
                      id="cvc"
                      type="text"
                      placeholder="123"
                      className="w-full border border-input rounded px-3 py-2 font-sans text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-required="true"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-sans text-sm font-semibold py-3 rounded hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Complete Donation
                </button>
              </div>
            </form>
            <p className="mt-4 font-sans text-xs text-muted-foreground text-center">
              Your donation is tax-deductible. Groundwork is a 501(c)(3) nonprofit organization.
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default SubscribePage;
