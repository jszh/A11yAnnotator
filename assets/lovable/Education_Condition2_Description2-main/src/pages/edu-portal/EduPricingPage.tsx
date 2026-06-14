import { Link } from "react-router-dom";
import { EduLayout } from "@/components/edu-portal/EduLayout";
import { Check, MessageSquare, Award, Calculator, ArrowRight } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Individual Enrollment",
    price: "From $199",
    period: "per program",
    description: "For self-motivated learners investing in their own career growth.",
    features: [
      "Access to any single program",
      "Instructor-led or self-paced options",
      "Industry-recognized credential",
      "Career services support",
      "3-month payment plans available",
      "30-day money-back guarantee",
    ],
    cta: "Enroll Now",
    highlighted: false,
  },
  {
    name: "Employer Sponsorship",
    price: "Custom",
    period: "per employee",
    description: "Upskill your workforce with bulk enrollment and dedicated support.",
    features: [
      "Everything in Individual, plus:",
      "Volume pricing (5+ employees)",
      "Dedicated account manager",
      "Progress reporting dashboard",
      "Custom program scheduling",
      "Tax-deductible training expense",
      "Priority cohort placement",
    ],
    cta: "Contact Sales",
    highlighted: true,
  },
  {
    name: "Nonprofit & Government",
    price: "Subsidized",
    period: "grant-eligible",
    description: "Workforce development partnerships for community organizations.",
    features: [
      "Everything in Employer, plus:",
      "Grant-eligible pricing",
      "WIOA & WIA aligned programs",
      "Cohort-based community training",
      "Outcome tracking and reporting",
      "Scholarship allocation tools",
      "Accreditation documentation",
    ],
    cta: "Partner With Us",
    highlighted: false,
  },
];

const accreditations = [
  "DEAC Accredited",
  "DOL Registered",
  "IACET CEU Provider",
  "CompTIA Authorized",
];

export default function EduPricingPage() {
  const [monthlyAmount, setMonthlyAmount] = useState(349);
  const [months, setMonths] = useState(3);
  const monthly = Math.ceil(monthlyAmount / months);

  return (
    <EduLayout title="Pricing & Financial Aid">
      {/* Header */}
      <section className="bg-edu-navy py-12" aria-labelledby="pricing-heading">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h1 id="pricing-heading" className="text-3xl font-bold text-primary-foreground lg:text-4xl">
            Pricing & Financial Aid
          </h1>
          <p className="mt-2 text-primary-foreground/70 max-w-xl mx-auto">
            Flexible options for individuals, employers, and organizations. Scholarships and payment plans available.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-14" aria-labelledby="plans-heading">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 id="plans-heading" className="sr-only">Pricing Plans</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-xl border p-6 flex flex-col ${
                  plan.highlighted
                    ? "border-edu-amber bg-card shadow-lg ring-2 ring-edu-amber/20"
                    : "border-border bg-card shadow-sm"
                }`}
              >
                {plan.highlighted && (
                  <span className="mb-3 inline-block self-start rounded-full bg-edu-amber/10 px-3 py-0.5 text-xs font-semibold text-edu-amber">
                    Most Popular
                  </span>
                )}
                <h3 className="font-body text-lg font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">/ {plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                <ul className="mt-5 space-y-2 flex-1" role="list">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-edu-teal shrink-0 mt-0.5" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/edu-portal/courses"
                  className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-opacity hover:opacity-90 ${
                    plan.highlighted
                      ? "bg-edu-amber text-edu-navy"
                      : "bg-edu-navy text-primary-foreground"
                  }`}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Financing calculator */}
      <section className="bg-edu-surface py-14" aria-labelledby="calc-heading">
        <div className="container mx-auto px-4 lg:px-8 max-w-lg">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5 text-edu-amber" aria-hidden="true" />
              <h2 id="calc-heading" className="font-body text-lg font-bold text-foreground">Payment Calculator</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="total-cost" className="text-sm font-medium text-foreground block mb-1">
                  Program Cost ($)
                </label>
                <input
                  id="total-cost"
                  type="number"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-edu-navy"
                  min={0}
                  aria-required="true"
                />
              </div>
              <fieldset>
                <legend className="text-sm font-medium text-foreground mb-1.5">Payment Period</legend>
                <div className="flex gap-2">
                  {[3, 6, 12].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMonths(m)}
                      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                        months === m
                          ? "bg-edu-navy text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      aria-pressed={months === m}
                    >
                      {m} months
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="rounded-lg bg-edu-surface-alt p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Estimated monthly payment</p>
                <p className="text-3xl font-bold text-foreground">${monthly}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <p className="text-xs text-muted-foreground mt-1">0% APR · No hidden fees</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accreditation & support */}
      <section className="py-14" aria-labelledby="accreditation-heading">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 id="accreditation-heading" className="text-2xl font-bold text-foreground mb-4">Accreditation & Recognition</h2>
              <div className="flex flex-wrap gap-3">
                {accreditations.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground">
                    <Award className="h-4 w-4 text-edu-teal" aria-hidden="true" />
                    {a}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                SkillForge programs are nationally accredited and aligned with industry certification requirements. Our credentials are recognized by over 500 employers nationwide.
              </p>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <MessageSquare className="h-6 w-6 text-edu-amber mb-2" aria-hidden="true" />
                <h3 className="font-body font-semibold text-foreground">Talk to an Advisor</h3>
                <p className="text-sm text-muted-foreground mt-1">Get personalized guidance on program selection and financing.</p>
                <button className="mt-3 rounded-lg bg-edu-amber px-4 py-2 text-sm font-semibold text-edu-navy hover:opacity-90 transition-opacity">
                  Start Live Chat
                </button>
              </div>
              <Link
                to="/edu-portal"
                className="flex items-center justify-between rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow group"
              >
                <div>
                  <h3 className="font-body font-semibold text-foreground">Apply for a Scholarship</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Need-based and merit-based options available.</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-edu-amber transition-colors" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </EduLayout>
  );
}
