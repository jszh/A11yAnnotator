import { Link } from "react-router-dom";
import { CheckCircle, MessageSquare, Award, Calculator } from "lucide-react";
import { useState } from "react";
import Layout from "../components/Layout";

const plans = [
  {
    name: "Individual Enrollment",
    desc: "Pay per program — perfect for self-motivated learners.",
    price: "From $299",
    period: "per program",
    featured: false,
    features: [
      "Access to any single program",
      "Instructor-led or self-paced options",
      "Industry-recognized certificate",
      "3-month payment plan available",
      "Career services for 6 months",
      "Community peer support",
    ],
  },
  {
    name: "Employer Sponsorship",
    desc: "Upskill your team with bulk pricing and progress tracking.",
    price: "Custom",
    period: "per employee",
    featured: true,
    features: [
      "Everything in Individual",
      "Dedicated account manager",
      "Custom program bundles",
      "Team progress dashboard",
      "Priority scheduling",
      "Tax-deductible training expense",
      "Volume discounts (5+ employees)",
    ],
  },
  {
    name: "Non-Profit / Government",
    desc: "Subsidized access for workforce development programs.",
    price: "Subsidized",
    period: "grant-eligible",
    featured: false,
    features: [
      "Everything in Employer plan",
      "WIOA & grant-eligible programs",
      "Custom reporting for funders",
      "Cohort-based scheduling",
      "Dedicated success coordinator",
      "Community impact metrics",
    ],
  },
];

export default function PricingPage() {
  const [monthlyPayment, setMonthlyPayment] = useState(349);
  const months = 3;

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Plans & Pricing</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Flexible options for individuals, employers, and organizations. Financial aid and scholarships available.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <article key={plan.name} className={`rounded-xl border p-6 flex flex-col ${plan.featured ? "border-accent shadow-lg ring-2 ring-accent/20 bg-card" : "border-border bg-card"}`}>
              {plan.featured && <span className="self-start bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded mb-3">Most Popular</span>}
              <h2 className="font-display text-xl font-bold text-card-foreground">{plan.name}</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-3xl font-display font-bold text-card-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-edu-teal shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-card-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/edu-portal/courses"
                className={`mt-6 block text-center py-3 rounded-lg font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  plan.featured ? "bg-accent text-accent-foreground hover:brightness-110" : "bg-primary text-primary-foreground hover:bg-edu-navy-light"
                }`}
              >
                {plan.price === "Custom" || plan.price === "Subsidized" ? "Talk to an Advisor" : "Get Started"}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Financing Calculator */}
      <section className="bg-edu-warm-bg py-12" aria-labelledby="calculator-heading">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="calculator-heading" className="font-display text-2xl font-bold text-foreground mb-6 text-center flex items-center justify-center gap-2">
            <Calculator className="w-6 h-6 text-edu-teal" aria-hidden="true" /> Payment Estimator
          </h2>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="mb-4">
              <label htmlFor="program-cost" className="block text-sm font-medium text-foreground mb-2">Program Cost ($)</label>
              <input
                id="program-cost"
                type="range"
                min={199}
                max={999}
                step={50}
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>$199</span>
                <span className="font-bold text-foreground text-lg">${monthlyPayment}</span>
                <span>$999</span>
              </div>
            </div>
            <div className="bg-edu-warm-bg rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">3-month payment plan</p>
              <p className="text-2xl font-display font-bold text-edu-teal">${(monthlyPayment / months).toFixed(2)}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
              <p className="text-xs text-muted-foreground mt-1">0% interest · No credit check</p>
            </div>
          </div>
        </div>
      </section>

      {/* Accreditation & Trust */}
      <section className="py-12" aria-labelledby="accred-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="accred-heading" className="font-display text-2xl font-bold text-foreground mb-6">Accreditations & Partnerships</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {["DEAC Accredited", "CompTIA Authorized", "NAHP Partner", "IACET Approved", "WIOA Eligible"].map((badge) => (
              <span key={badge} className="bg-card border border-border px-4 py-2 rounded-lg text-sm font-medium text-card-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-accent" aria-hidden="true" /> {badge}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/edu-portal" className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-lg font-bold hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <MessageSquare className="w-4 h-4" aria-hidden="true" /> Talk to an Advisor
            </Link>
            <Link to="/edu-portal" className="inline-flex items-center gap-2 border-2 border-border px-6 py-3 rounded-lg font-medium text-foreground hover:bg-muted transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              Apply for a Scholarship
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
