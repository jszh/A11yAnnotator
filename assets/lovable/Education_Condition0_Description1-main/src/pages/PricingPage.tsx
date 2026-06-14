import { Layout } from "@/components/edu/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Shield, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Get started with limited access to courses",
    cta: "Get Started",
    featured: false,
    features: [
      { label: "Access to free courses", included: true },
      { label: "Community forums", included: true },
      { label: "Basic progress tracking", included: true },
      { label: "Full course library", included: false },
      { label: "Certificates", included: false },
      { label: "Offline downloads", included: false },
      { label: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    desc: "Full access to the entire learning library",
    cta: "Start Free Trial",
    featured: true,
    features: [
      { label: "Access to free courses", included: true },
      { label: "Community forums", included: true },
      { label: "Advanced progress tracking", included: true },
      { label: "Full course library (1,200+)", included: true },
      { label: "Certificates of completion", included: true },
      { label: "Offline downloads", included: true },
      { label: "Priority support", included: false },
    ],
  },
  {
    name: "Teams",
    price: "$49",
    period: "/seat/month",
    desc: "For organizations and team learning",
    cta: "Contact Sales",
    featured: false,
    features: [
      { label: "Everything in Pro", included: true },
      { label: "Admin dashboard", included: true },
      { label: "Team analytics", included: true },
      { label: "Custom learning paths", included: true },
      { label: "SSO integration", included: true },
      { label: "Dedicated account manager", included: true },
      { label: "Priority support", included: true },
    ],
  },
];

const faqs = [
  { q: "Can I cancel my subscription anytime?", a: "Yes, you can cancel anytime. Your access continues until the end of your billing period." },
  { q: "Is there a free trial for Pro?", a: "Yes! We offer a 7-day free trial for the Pro plan. No credit card required to start." },
  { q: "Do certificates have value?", a: "Our certificates are recognized by many employers and can be shared on LinkedIn and your resume." },
  { q: "Can I switch between plans?", a: "Absolutely. You can upgrade or downgrade your plan at any time from your account settings." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, PayPal, and bank transfers for team plans." },
];

const testimonials = [
  { name: "Sarah K.", role: "Software Engineer", text: "LearnPath Pro was the best investment in my career. I completed 12 courses in 6 months." },
  { name: "Mark R.", role: "Product Manager", text: "The Teams plan made it easy to upskill our entire department. Highly recommend." },
  { name: "Priya M.", role: "Data Analyst", text: "The quality of courses rivals university programs at a fraction of the cost." },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <Layout>
      <section className="edu-hero-gradient py-16">
        <div className="edu-container text-center">
          <h1 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-2 text-primary-foreground/70">Choose the plan that fits your learning goals</p>
        </div>
      </section>

      <section className="edu-section bg-background">
        <div className="edu-container">
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 ${
                  plan.featured
                    ? "border-secondary bg-card edu-glow scale-[1.02]"
                    : "border-border bg-card edu-card"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-4 py-1 text-xs font-semibold text-secondary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display text-lg font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                <Button
                  className={`mt-6 w-full font-semibold ${
                    plan.featured
                      ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      : ""
                  }`}
                  variant={plan.featured ? "default" : "outline"}
                  size="lg"
                >
                  {plan.cta}
                </Button>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-center gap-2 text-sm">
                      {f.included ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-secondary" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-border" />
                      )}
                      <span className={f.included ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Guarantee */}
          <div className="mt-12 flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
            <Shield className="h-8 w-8 text-secondary" />
            <div className="text-left">
              <span className="font-display text-sm font-bold text-foreground">30-Day Money-Back Guarantee</span>
              <p className="text-xs text-muted-foreground">Not satisfied? Get a full refund within 30 days, no questions asked.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="edu-section bg-muted/50">
        <div className="edu-container">
          <h2 className="mb-8 text-center font-display text-2xl font-bold text-foreground">What Our Learners Say</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-card p-6 edu-card">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-accent text-accent" />)}
                </div>
                <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
                <div className="mt-4 border-t border-border pt-3">
                  <span className="text-sm font-semibold text-foreground">{t.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="edu-section bg-background">
        <div className="edu-container max-w-2xl">
          <h2 className="mb-8 text-center font-display text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-lg border border-border bg-card">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-foreground"
                >
                  {faq.q}
                  {openFaq === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {openFaq === i && (
                  <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
