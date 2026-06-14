import { useState } from "react";
import { Heart, ArrowRight, CheckCircle } from "lucide-react";
import Layout from "@/components/gov/Layout";

const programs = [
  { name: "SNAP (Food Assistance)", description: "Monthly benefits for groceries and food items for eligible households.", eligible: true },
  { name: "Medicaid", description: "Free or low-cost health coverage for qualifying individuals and families.", eligible: true },
  { name: "Heating Assistance (LIHEAP)", description: "Seasonal assistance with home heating costs for income-eligible households.", eligible: true },
  { name: "Childcare Subsidy", description: "Financial help with childcare costs for working families.", eligible: false },
];

const BenefitsPage = () => {
  const [step, setStep] = useState<"form" | "results">("form");
  const [household, setHousehold] = useState("");
  const [income, setIncome] = useState("");
  const [employment, setEmployment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("results");
  };

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-10">
        <div className="container">
          <p className="text-sm opacity-70 mb-1">Services → Benefits</p>
          <h1 className="font-display text-3xl font-bold">Apply for Benefits</h1>
          <p className="mt-2 opacity-80">Check your eligibility for Vermont assistance programs.</p>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container max-w-2xl">
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                <Heart className="h-5 w-5 text-gov-green" aria-hidden="true" /> Eligibility Screener
              </h2>
              <div className="rounded-lg border border-border bg-card p-6 space-y-5">
                <div>
                  <label htmlFor="household" className="block text-sm font-medium text-foreground mb-1">Household size</label>
                  <select
                    id="household"
                    value={household}
                    onChange={(e) => setHousehold(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select…</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="income" className="block text-sm font-medium text-foreground mb-1">Annual household income</label>
                  <select
                    id="income"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select…</option>
                    <option value="under-20k">Under $20,000</option>
                    <option value="20k-35k">$20,000 – $35,000</option>
                    <option value="35k-50k">$35,000 – $50,000</option>
                    <option value="50k-75k">$50,000 – $75,000</option>
                    <option value="over-75k">Over $75,000</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="employment" className="block text-sm font-medium text-foreground mb-1">Employment status</label>
                  <select
                    id="employment"
                    value={employment}
                    onChange={(e) => setEmployment(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select…</option>
                    <option value="employed">Employed full-time</option>
                    <option value="part-time">Employed part-time</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="retired">Retired</option>
                    <option value="student">Student</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="rounded-lg bg-gov-green px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-gov-green-light transition-colors focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2"
              >
                Check Eligibility <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          )}

          {step === "results" && (
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">Your Results</h2>
              <p className="text-sm text-muted-foreground mb-6">Based on your responses, you may qualify for the following programs:</p>
              <div className="space-y-4">
                {programs.map((prog) => (
                  <div
                    key={prog.name}
                    className={`rounded-lg border p-5 ${
                      prog.eligible ? "border-gov-green bg-gov-green/5" : "border-border bg-card opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          {prog.eligible && <CheckCircle className="h-4 w-4 text-gov-green" aria-hidden="true" />}
                          {prog.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{prog.description}</p>
                      </div>
                      {prog.eligible && (
                        <button className="shrink-0 rounded-lg bg-gov-green px-4 py-2 text-xs font-semibold text-accent-foreground hover:bg-gov-green-light transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
                          Start Application
                        </button>
                      )}
                    </div>
                    {!prog.eligible && <p className="text-xs text-muted-foreground mt-2">You may not qualify based on current information.</p>}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep("form")}
                className="mt-6 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default BenefitsPage;
