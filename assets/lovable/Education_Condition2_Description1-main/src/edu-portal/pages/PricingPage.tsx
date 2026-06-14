import { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { Button } from "@/components/ui/button";
import { Check, X, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with limited access",
    features: [
      { text: "Access to 50+ free courses", included: true },
      { text: "Community forums", included: true },
      { text: "Basic progress tracking", included: true },
      { text: "Full course library", included: false },
      { text: "Certificates", included: false },
      { text: "Offline downloads", included: false },
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "Full access for serious learners",
    features: [
      { text: "Access to full course library", included: true },
      { text: "Certificates of completion", included: true },
      { text: "Offline downloads", included: true },
      { text: "Priority Q&A support", included: true },
      { text: "Learning paths & roadmaps", included: true },
      { text: "Admin dashboard", included: false },
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Teams",
    price: "$49",
    period: "/seat/month",
    description: "For organizations and teams",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Admin dashboard & analytics", included: true },
      { text: "Team progress reports", included: true },
      { text: "Custom learning paths", included: true },
      { text: "SSO integration", included: true },
      { text: "Dedicated support", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const faqs = [
  { q: "Can I cancel my subscription anytime?", a: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period." },
  { q: "Is there a free trial for Pro?", a: "Yes! We offer a 7-day free trial for the Pro plan. No credit card required to start." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, PayPal, and bank transfers for annual plans." },
  { q: "Can I switch between plans?", a: "Absolutely. You can upgrade or downgrade your plan at any time from your account settings." },
  { q: "Do you offer student discounts?", a: "Yes, we offer 50% off Pro plans for verified students. Contact support with your student ID." },
];

const testimonials = [
  { name: "Sarah K.", role: "Software Developer", text: "LearnPath Pro transformed my career. The courses are incredibly well-structured." },
  { name: "David M.", role: "Team Lead", text: "The Teams plan is perfect for our engineering team. Great analytics and admin features." },
  { name: "Lisa T.", role: "UX Designer", text: "I've tried many platforms — LearnPath has the best content quality by far." },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Pricing & Plans | LearnPath";
  }, []);

  return (
    <Layout>
      <section className="py-16 text-center" aria-labelledby="pricing-heading">
        <div className="edu-container">
          <h1 id="pricing-heading" className="text-3xl md:text-4xl font-display text-foreground">Choose Your Learning Plan</h1>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">Start for free or unlock everything with Pro. Every plan includes our core learning experience.</p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-16" aria-label="Pricing plans">
        <div className="edu-container grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`edu-card p-6 flex flex-col relative ${plan.popular ? "ring-2 ring-accent" : ""}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 edu-badge bg-accent text-accent-foreground px-3 py-1 text-xs font-semibold">
                  Most Popular
                </span>
              )}
              <h2 className="text-lg font-display text-foreground">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-4">
                <span className="text-3xl font-bold font-display text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </p>
              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {feat.included ? (
                      <Check className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 shrink-0" aria-hidden="true" />
                    )}
                    <span className={feat.included ? "text-foreground" : "text-muted-foreground/60"}>{feat.text}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.popular ? "accent" : "outline"}
                className="mt-6 w-full"
                asChild
              >
                <Link to={plan.name === "Teams" ? "/" : "/dashboard"}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Guarantee */}
      <section className="py-10 bg-accent/5 border-y" aria-label="Money-back guarantee">
        <div className="edu-container flex items-center justify-center gap-4 text-center">
          <Shield className="h-8 w-8 text-accent" aria-hidden="true" />
          <div>
            <p className="font-semibold text-foreground">30-Day Money-Back Guarantee</p>
            <p className="text-sm text-muted-foreground">Not satisfied? Get a full refund within 30 days, no questions asked.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16" aria-labelledby="testimonials-heading">
        <div className="edu-container">
          <h2 id="testimonials-heading" className="text-2xl font-display text-foreground text-center mb-10">What Our Learners Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <blockquote key={i} className="edu-card p-6">
                <p className="text-sm text-foreground italic leading-relaxed">"{t.text}"</p>
                <footer className="mt-4">
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/50" aria-labelledby="faq-heading">
        <div className="edu-container max-w-2xl mx-auto">
          <h2 id="faq-heading" className="text-2xl font-display text-foreground text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border rounded-lg bg-card">
                <h3>
                  <button
                    className="w-full flex items-center justify-between p-4 text-left text-sm font-medium text-foreground edu-focus-ring rounded"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-${i}`}
                  >
                    {faq.q}
                    {openFaq === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                  </button>
                </h3>
                {openFaq === i && (
                  <div id={`faq-${i}`} className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
