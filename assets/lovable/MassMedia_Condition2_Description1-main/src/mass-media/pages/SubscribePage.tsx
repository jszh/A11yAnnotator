import { useState, useRef, useEffect } from "react";
import Layout from "../components/Layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["5 articles per month", "Daily newsletter", "Breaking news alerts"],
    notIncluded: ["Unlimited articles", "Archive access", "Ad-free experience", "Exclusive briefings", "Podcast access"],
  },
  {
    id: "digital",
    name: "Digital",
    price: "$9.99",
    period: "/mo",
    features: ["Unlimited articles", "Daily newsletter", "Breaking news alerts", "Full archive access", "Ad-free experience"],
    notIncluded: ["Exclusive briefings", "Podcast access"],
    popular: true,
  },
  {
    id: "all-access",
    name: "All-Access",
    price: "$19.99",
    period: "/mo",
    features: ["Unlimited articles", "Daily newsletter", "Breaking news alerts", "Full archive access", "Ad-free experience", "Exclusive briefings", "Podcast access"],
    notIncluded: [],
  },
];

const faqs = [
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes. You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your current billing period.",
  },
  {
    q: "Is there a student discount?",
    a: "Yes, we offer a 50% discount for students with a valid .edu email address. Contact our support team to apply.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards, PayPal, and Apple Pay. Enterprise subscriptions can be invoiced.",
  },
  {
    q: "Can I share my subscription with family members?",
    a: "The All-Access plan includes sharing with up to 3 family members at no additional cost. Digital plans are for individual use.",
  },
];

const testimonials = [
  {
    quote: "The Meridian has become my essential morning read. The depth of analysis is unmatched.",
    author: "Rebecca Turner",
    title: "University Professor",
  },
  {
    quote: "Finally, journalism that respects the reader's intelligence. Worth every penny.",
    author: "David Okafor",
    title: "Policy Analyst",
  },
  {
    quote: "The international coverage fills a gap that most outlets have abandoned. Indispensable.",
    author: "Yuki Tanaka",
    title: "Foreign Correspondent",
  },
];

export default function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState("digital");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [showModal, setShowModal] = useState(false);

  // Focus trap for modal
  useEffect(() => {
    if (showModal && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      first?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          closeModal();
          return;
        }
        if (e.key === "Tab") {
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [showModal]);

  const closeModal = () => {
    setShowModal(false);
    triggerRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Please enter your full name.";
    if (!email.trim() || !email.includes("@")) newErrors.email = "Please enter a valid email address.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setSubmitted(true);
    }
  };

  return (
    <Layout title="Subscribe | The Meridian">
      <div className="container mt-6">
        <div className="editorial-rule mb-4" />
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="headline-xl mb-4">Subscribe to The Meridian</h1>
          <p className="font-sans text-lg text-muted-foreground">
            Support independent journalism. Get unlimited access to in-depth reporting,
            expert analysis, and exclusive content.
          </p>
        </div>

        {/* Pricing tiers */}
        <section aria-labelledby="pricing-heading" className="mb-16">
          <h2 id="pricing-heading" className="sr-only">Subscription plans</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative border p-6 transition-all cursor-pointer ${
                  selectedPlan === plan.id
                    ? "border-foreground ring-2 ring-foreground bg-card shadow-lg"
                    : "border-border bg-card hover:border-foreground/50"
                }`}
                onClick={() => setSelectedPlan(plan.id)}
                role="radio"
                aria-checked={selectedPlan === plan.id}
                aria-label={`${plan.name} plan — ${plan.price}${plan.period}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedPlan(plan.id);
                  }
                }}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-sans font-bold uppercase tracking-widest px-3 py-1">
                    Most Popular
                  </span>
                )}
                <h3 className="font-serif text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="mb-4">
                  <span className="font-serif text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="font-sans text-muted-foreground">{plan.period}</span>
                </p>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="font-sans text-sm text-foreground flex items-center gap-2">
                      <span className="text-accent" aria-hidden="true">✓</span> {f}
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li key={f} className="font-sans text-sm text-muted-foreground/50 flex items-center gap-2 line-through">
                      <span aria-hidden="true">—</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Feature comparison */}
        <section aria-labelledby="comparison-heading" className="mb-16 max-w-4xl mx-auto">
          <div className="editorial-rule mb-4" />
          <h2 id="comparison-heading" className="headline-md mb-6">Compare Plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="border-b-2 border-foreground">
                  <th className="text-left py-3 pr-4 font-bold">Feature</th>
                  {plans.map((p) => (
                    <th key={p.id} className="text-center py-3 px-4 font-bold">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["Unlimited articles", "Daily newsletter", "Breaking news alerts", "Full archive access", "Ad-free experience", "Exclusive briefings", "Podcast access"].map((feature) => (
                  <tr key={feature} className="border-b border-border">
                    <td className="py-3 pr-4 text-foreground">{feature}</td>
                    {plans.map((p) => (
                      <td key={p.id} className="text-center py-3 px-4">
                        {p.features.includes(feature) ? (
                          <span className="text-accent font-bold" aria-label="Included">✓</span>
                        ) : (
                          <span className="text-muted-foreground" aria-label="Not included">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Testimonials */}
        <section aria-labelledby="testimonials-heading" className="mb-16 max-w-4xl mx-auto">
          <div className="editorial-rule mb-4" />
          <h2 id="testimonials-heading" className="headline-md mb-6">What Readers Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <blockquote key={i} className="bg-secondary p-6 border border-border">
                <p className="font-serif text-lg italic text-foreground mb-4">"{t.quote}"</p>
                <footer>
                  <cite className="font-sans text-sm not-italic">
                    <span className="font-semibold text-foreground">{t.author}</span>
                    <br />
                    <span className="text-muted-foreground">{t.title}</span>
                  </cite>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="mb-16 max-w-2xl mx-auto">
          <div className="editorial-rule mb-4" />
          <h2 id="faq-heading" className="headline-md mb-6">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible>
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="font-sans text-left text-foreground font-semibold">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="font-sans text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Sign-up form */}
        <section aria-labelledby="signup-heading" className="mb-16 max-w-lg mx-auto">
          <div className="editorial-rule mb-4" />
          <h2 id="signup-heading" className="headline-md mb-6 text-center">Get Started</h2>

          {submitted ? (
            <div role="status" aria-live="polite" className="text-center bg-secondary p-8 border border-border">
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">Welcome aboard!</h3>
              <p className="font-sans text-muted-foreground">
                Check your inbox to complete your {plans.find((p) => p.id === selectedPlan)?.name} subscription.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4 bg-card p-6 border border-border">
              <p className="font-sans text-sm text-muted-foreground mb-4">
                Selected plan: <strong className="text-foreground">{plans.find((p) => p.id === selectedPlan)?.name} — {plans.find((p) => p.id === selectedPlan)?.price}{plans.find((p) => p.id === selectedPlan)?.period}</strong>
              </p>

              <div>
                <label htmlFor="sub-name" className="block font-sans text-sm font-semibold text-foreground mb-1">
                  Full Name <span className="text-accent" aria-hidden="true">*</span>
                </label>
                <input
                  id="sub-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className="w-full px-3 py-2 font-sans text-foreground bg-background border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.name && (
                  <p id="name-error" role="alert" className="text-sm font-sans text-accent mt-1">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="sub-email" className="block font-sans text-sm font-semibold text-foreground mb-1">
                  Email Address <span className="text-accent" aria-hidden="true">*</span>
                </label>
                <input
                  id="sub-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: "" })); }}
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className="w-full px-3 py-2 font-sans text-foreground bg-background border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="text-sm font-sans text-accent mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              <button
                ref={triggerRef}
                type="submit"
                className="w-full py-3 bg-foreground text-primary-foreground font-sans font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Subscribe Now
              </button>
            </form>
          )}
        </section>
      </div>

      {/* Modal (paywall overlay example) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50" role="dialog" aria-modal="true" aria-label="Subscription required">
          <div ref={modalRef} className="bg-card p-8 max-w-md w-full mx-4 border border-border shadow-xl">
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">Subscribe to Continue Reading</h2>
            <p className="font-sans text-muted-foreground mb-6">
              You've reached your free article limit. Subscribe to get unlimited access.
            </p>
            <button
              onClick={closeModal}
              className="w-full py-3 bg-foreground text-primary-foreground font-sans font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
