import { useState } from "react";
import MediaLayout from "@/components/mass-media/MediaLayout";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Essential news coverage",
    features: [
      "5 articles per month",
      "Daily headlines email",
      "Breaking news alerts",
    ],
    missing: [
      "Full article archive",
      "Opinion & analysis",
      "Ad-free experience",
      "Exclusive newsletters",
      "Print edition access",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Digital",
    price: "$9.99",
    period: "/mo",
    description: "Complete digital access",
    features: [
      "Unlimited articles",
      "Full archive access",
      "Opinion & analysis",
      "Ad-free experience",
      "Exclusive newsletters",
    ],
    missing: [
      "Print edition access",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "All-Access",
    price: "$19.99",
    period: "/mo",
    description: "The complete Meridian experience",
    features: [
      "Everything in Digital",
      "Weekly print edition",
      "Exclusive events access",
      "Early access to features",
      "Gift articles (10/mo)",
      "Print edition access",
    ],
    missing: [],
    cta: "Start Free Trial",
    highlighted: false,
  },
];

const testimonials = [
  { name: "Sarah M.", role: "University Professor", text: "The Meridian's depth of analysis is unmatched. It's become essential reading for my political science courses." },
  { name: "James K.", role: "Business Consultant", text: "In a world of clickbait, The Meridian stands out for its commitment to nuanced, well-researched journalism." },
  { name: "Priya R.", role: "Software Engineer", text: "The tech coverage is exceptional — thoughtful analysis rather than hype. Worth every penny." },
];

const faqs = [
  { q: "Can I cancel anytime?", a: "Yes. You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your current billing period." },
  { q: "Is there a student discount?", a: "Yes! We offer a 50% discount for students with a valid .edu email address. Contact our support team to activate your student pricing." },
  { q: "Do you offer gift subscriptions?", a: "Absolutely. Gift subscriptions are available for all tiers and can be purchased for 3, 6, or 12-month periods." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, PayPal, and Apple Pay. Annual subscriptions can also be paid by bank transfer." },
];

const SubscribePage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <MediaLayout>
      {/* Hero */}
      <section className="bg-primary">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="headline-xl text-primary-foreground">
            Support Independent Journalism
          </h1>
          <p className="text-primary-foreground/70 font-sans text-lg mt-4 max-w-2xl mx-auto">
            The Meridian is reader-funded. Your subscription powers fearless reporting 
            on the stories that matter most.
          </p>
        </div>
      </section>

      {/* Pricing tiers */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`bg-card p-8 flex flex-col ${tier.highlighted ? "ring-2 ring-accent relative" : "border border-border"}`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 text-xs font-sans font-bold uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <h3 className="font-serif text-2xl font-bold">{tier.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-serif font-bold">{tier.price}</span>
                  <span className="text-muted-foreground font-sans text-sm">{tier.period}</span>
                </div>
                <p className="text-muted-foreground font-sans text-sm mt-2">{tier.description}</p>

                <ul className="mt-6 space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 font-sans text-sm">
                      <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {tier.missing.map((f) => (
                    <li key={f} className="flex items-start gap-2 font-sans text-sm text-muted-foreground/50">
                      <span className="w-4 h-4 shrink-0 mt-0.5 text-center">—</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`mt-8 w-full py-3 font-sans text-sm font-bold uppercase tracking-wider transition-colors ${
                    tier.highlighted
                      ? "bg-accent text-accent-foreground hover:bg-amber-light"
                      : "bg-primary text-primary-foreground hover:bg-navy-light"
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature comparison */}
      <section className="bg-card border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <h2 className="headline-lg text-center mb-8">Compare Plans</h2>
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="border-b-2 border-accent">
                  <th className="text-left py-3 font-semibold">Feature</th>
                  <th className="text-center py-3 font-semibold">Free</th>
                  <th className="text-center py-3 font-semibold">Digital</th>
                  <th className="text-center py-3 font-semibold">All-Access</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Monthly articles", "5", "Unlimited", "Unlimited"],
                  ["Breaking news", "✓", "✓", "✓"],
                  ["Full archive", "—", "✓", "✓"],
                  ["Opinion & analysis", "—", "✓", "✓"],
                  ["Ad-free", "—", "✓", "✓"],
                  ["Exclusive newsletters", "—", "✓", "✓"],
                  ["Print edition", "—", "—", "✓"],
                  ["Exclusive events", "—", "—", "✓"],
                  ["Gift articles", "—", "—", "10/mo"],
                ].map(([feature, ...values], i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 font-medium">{feature}</td>
                    {values.map((v, j) => (
                      <td key={j} className="text-center py-3 text-muted-foreground">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-12">
          <h2 className="headline-lg text-center mb-8">What Readers Say</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-card p-6 border-l-2 border-accent">
                <p className="font-sans text-sm text-foreground leading-relaxed italic">"{t.text}"</p>
                <div className="mt-4">
                  <p className="font-sans text-sm font-bold">{t.name}</p>
                  <p className="font-sans text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-card border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <h2 className="headline-lg text-center mb-8">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border">
                <button
                  className="w-full text-left px-6 py-4 font-sans font-semibold flex justify-between items-center hover:bg-secondary/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <span className="text-muted-foreground">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="font-sans text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sign-up form */}
      <section className="bg-primary">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <h2 className="headline-lg text-primary-foreground">Ready to Subscribe?</h2>
            <p className="text-primary-foreground/60 font-sans text-sm mt-2 mb-8">
              Start your 14-day free trial. Cancel anytime.
            </p>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Full name"
                className="w-full bg-primary-foreground/10 border border-primary-foreground/20 px-4 py-3 text-sm font-sans text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-accent"
              />
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-primary-foreground/10 border border-primary-foreground/20 px-4 py-3 text-sm font-sans text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-accent"
              />
              <button className="w-full bg-accent text-accent-foreground py-3 font-sans text-sm font-bold uppercase tracking-wider hover:bg-amber-light transition-colors">
                Start Free Trial
              </button>
            </form>
          </div>
        </div>
      </section>
    </MediaLayout>
  );
};

export default SubscribePage;
