import { useState } from "react";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free Reader",
    price: "$0",
    period: "",
    description: "Stay informed with full access to all published investigations and data.",
    features: [
      "Unlimited article access",
      "Weekly newsletter",
      "Comment on investigations",
    ],
    cta: "Sign Up Free",
    highlight: false,
  },
  {
    name: "Supporter",
    price: "$7",
    period: "/mo",
    description: "Fund the journalism that holds power accountable. Your support directly funds reporting.",
    features: [
      "Everything in Free Reader",
      "Ad-free experience",
      "Supporter badge on comments",
      "Monthly behind-the-scenes briefing",
      "Early access to investigations",
    ],
    cta: "Become a Supporter",
    highlight: true,
  },
  {
    name: "Investigator",
    price: "$20",
    period: "/mo",
    description: "Get deep access to our data, methodology, and reporting process.",
    features: [
      "Everything in Supporter",
      "Exclusive data newsletter",
      "Access to raw datasets & source documents",
      "Quarterly Q&A with reporters",
      "Annual impact report",
      "Invitation to editorial roundtables",
    ],
    cta: "Join as Investigator",
    highlight: false,
  },
];

const impactStats = [
  { number: "2,400+", label: "Hours of investigative reporting funded by readers in 2025" },
  { number: "14", label: "Major investigations published last year" },
  { number: "3", label: "Policy changes directly influenced by our reporting" },
];

export default function SubscribePage() {
  const [recurring, setRecurring] = useState(true);

  return (
    <div>
      {/* Hero */}
      <section className="gw-surface-dark py-16 md:py-20">
        <div className="gw-section text-center max-w-2xl mx-auto">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Keep Groundwork Independent
          </h1>
          <p className="font-sans text-base md:text-lg opacity-80 leading-relaxed">
            We don't answer to advertisers or corporate owners. Groundwork is funded entirely by
            readers who believe investigative environmental journalism is essential. Join them.
          </p>
        </div>
      </section>

      {/* Impact */}
      <section className="gw-surface-warm py-12">
        <div className="gw-section">
          <h2 className="gw-meta text-center mb-8">Your Support in Action</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {impactStats.map((stat) => (
              <div key={stat.number} className="text-center">
                <div className="gw-stat-number text-4xl md:text-5xl mb-2">{stat.number}</div>
                <p className="font-sans text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Toggle */}
      <section className="gw-section py-12 md:py-16">
        <div className="flex items-center justify-center gap-4 mb-10">
          <button
            onClick={() => setRecurring(true)}
            className={`font-sans text-sm font-semibold px-4 py-2 rounded transition-all ${
              recurring ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setRecurring(false)}
            className={`font-sans text-sm font-semibold px-4 py-2 rounded transition-all ${
              !recurring ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            One-Time
          </button>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-sm p-6 flex flex-col ${
                tier.highlight
                  ? "border-2 ring-2 ring-primary/20 relative"
                  : "border gw-rule"
              }`}
              style={tier.highlight ? { borderColor: "hsl(var(--primary))" } : {}}
            >
              {tier.highlight && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full"
                  style={{ background: "hsl(var(--gw-highlight))", color: "hsl(0 0% 100%)" }}
                >
                  Most Popular
                </span>
              )}
              <h3 className="font-sans text-lg font-bold mb-1">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-sans text-3xl font-extrabold">{tier.price}</span>
                {tier.period && <span className="text-sm text-muted-foreground">{recurring ? tier.period : ""}</span>}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{tier.description}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded font-sans text-sm font-bold transition-opacity hover:opacity-90 ${
                  tier.highlight
                    ? "text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
                style={tier.highlight ? { background: "hsl(var(--primary))" } : {}}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Payment form */}
      <section className="gw-section pb-16 max-w-md mx-auto">
        <div className="border gw-rule rounded-sm p-6">
          <h3 className="font-sans text-lg font-bold mb-4">Secure Payment</h3>
          <div className="space-y-4">
            <div>
              <label className="font-sans text-sm font-medium block mb-1">Full Name</label>
              <input className="w-full border gw-rule rounded px-3 py-2 text-sm bg-background" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="font-sans text-sm font-medium block mb-1">Email</label>
              <input className="w-full border gw-rule rounded px-3 py-2 text-sm bg-background" placeholder="jane@example.com" type="email" />
            </div>
            <div>
              <label className="font-sans text-sm font-medium block mb-1">Card Number</label>
              <input className="w-full border gw-rule rounded px-3 py-2 text-sm bg-background" placeholder="4242 4242 4242 4242" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-sans text-sm font-medium block mb-1">Expiry</label>
                <input className="w-full border gw-rule rounded px-3 py-2 text-sm bg-background" placeholder="MM / YY" />
              </div>
              <div>
                <label className="font-sans text-sm font-medium block mb-1">CVC</label>
                <input className="w-full border gw-rule rounded px-3 py-2 text-sm bg-background" placeholder="123" />
              </div>
            </div>
            <button
              className="w-full py-3 rounded font-sans text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              style={{ background: "hsl(var(--primary))" }}
            >
              Complete Payment
            </button>
            <p className="text-[11px] text-muted-foreground text-center">
              🔒 Payments processed securely. Cancel anytime.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
