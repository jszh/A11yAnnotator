import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2, Shield, MessageCircle, Calculator, Award } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Individual Enrollment",
    description: "Self-funded learners and career changers",
    price: "From $199",
    period: "per program",
    highlight: false,
    features: [
      "Full access to program content",
      "Live instructor-led sessions",
      "Certificate upon completion",
      "3-month payment plans available",
      "Career coaching session included",
      "Alumni network access",
    ],
  },
  {
    name: "Employer Sponsorship",
    description: "Companies investing in workforce development",
    price: "Custom",
    period: "per employee",
    highlight: true,
    features: [
      "Everything in Individual, plus:",
      "Bulk enrollment discounts (10%–25%)",
      "Dedicated account manager",
      "Progress reporting dashboard",
      "Custom program scheduling",
      "Tax credit documentation (WOTC)",
      "Invoice billing (NET 30)",
    ],
  },
  {
    name: "Non-Profit & Government",
    description: "Workforce boards, non-profits, and agencies",
    price: "Subsidized",
    period: "grant-eligible",
    highlight: false,
    features: [
      "Everything in Employer, plus:",
      "WIOA-eligible program alignment",
      "Scholarship pool management",
      "Outcome tracking & reporting",
      "Community partnership support",
      "Custom cohort scheduling",
    ],
  },
];

const accreditations = ["DEAC Accredited", "DOL Registered", "CompTIA Authorized", "NAHP Recognized"];

const EduPricing = () => {
  const [monthlyPayment, setMonthlyPayment] = useState(349);

  const monthly3 = Math.ceil(monthlyPayment / 3);
  const monthly6 = Math.ceil(monthlyPayment / 6);

  return (
    <div className="bg-background">
      {/* Header */}
      <section className="bg-primary py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
            Invest in Your Future
          </h1>
          <p className="mt-3 text-primary-foreground/70 max-w-2xl mx-auto">
            Flexible pricing for individuals, employers, and organizations. Every program includes instructor support and a recognized credential.
          </p>
        </div>
      </section>

      {/* Plans */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 sm:p-8 flex flex-col ${
                plan.highlight
                  ? "border-edu-gold bg-edu-gold/5 shadow-lg relative"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-edu-gold px-4 py-1 text-xs font-semibold text-edu-navy">
                  Most Popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              <div className="mt-5 mb-6">
                <span className="font-display text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground ml-2">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-edu-emerald shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? "hero" : "outline"}
                size="lg"
                className="mt-6 w-full"
                asChild
              >
                <Link to="/edu-portal/courses">
                  {plan.highlight ? "Contact Sales" : "Get Started"}
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Financing Calculator */}
        <section className="mt-16 rounded-xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Calculator className="h-6 w-6 text-edu-gold" /> Financing Calculator
          </h2>
          <p className="text-sm text-muted-foreground mb-6">Estimate your monthly payment based on program cost.</p>
          <div className="max-w-md">
            <label className="text-sm font-medium text-foreground block mb-2">
              Program Cost: ${monthlyPayment}
            </label>
            <input
              type="range"
              min={199}
              max={999}
              step={10}
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(Number(e.target.value))}
              className="w-full accent-edu-gold"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>$199</span>
              <span>$999</span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">3-Month Plan</p>
                <p className="font-display text-2xl font-bold text-foreground">${monthly3}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">6-Month Plan</p>
                <p className="font-display text-2xl font-bold text-foreground">${monthly6}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* Scholarship + Advisor */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <MessageCircle className="h-10 w-10 text-edu-gold mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold text-foreground">Talk to an Advisor</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Not sure which program is right for you? Chat with an enrollment advisor — no pressure, just guidance.
            </p>
            <Button variant="hero" size="sm" className="mt-4">Start Live Chat</Button>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <Award className="h-10 w-10 text-edu-emerald mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold text-foreground">Scholarship Program</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Need-based scholarships available for qualifying learners. Apply in under 10 minutes.
            </p>
            <Button variant="emerald" size="sm" className="mt-4">Apply for Scholarship</Button>
          </div>
        </div>

        {/* Accreditations */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-edu-navy" />
            <h3 className="font-semibold text-foreground">Accreditation & Recognition</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {accreditations.map((a) => (
              <span key={a} className="rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground">
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EduPricing;
