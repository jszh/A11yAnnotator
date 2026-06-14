import { useState } from "react";
import { Heart, ArrowRight, CheckCircle2 } from "lucide-react";
import Layout from "@/components/government/Layout";

interface FormData {
  householdSize: string;
  income: string;
  employment: string;
}

const programs = [
  { name: "SNAP (Food Assistance)", desc: "Monthly food assistance for qualifying households.", eligible: (d: FormData) => parseInt(d.income) < 40000 },
  { name: "Medicaid", desc: "Free or low-cost health coverage for eligible residents.", eligible: (d: FormData) => parseInt(d.income) < 50000 },
  { name: "Heating Assistance (LIHEAP)", desc: "Help paying heating bills during cold months.", eligible: (d: FormData) => parseInt(d.income) < 35000 },
  { name: "Child Care Financial Assistance", desc: "Subsidized child care for working families.", eligible: (d: FormData) => parseInt(d.householdSize) >= 3 && parseInt(d.income) < 55000 },
];

const BenefitsPage = () => {
  const [formData, setFormData] = useState<FormData>({ householdSize: "", income: "", employment: "" });
  const [showResults, setShowResults] = useState(false);

  const qualifying = programs.filter((p) => p.eligible(formData));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(true);
  };

  return (
    <Layout>
      <section className="bg-primary">
        <div className="container py-10">
          <h1 className="font-heading text-3xl font-bold text-primary-foreground mb-2">Apply for Benefits</h1>
          <p className="text-primary-foreground/80 font-body">Check your eligibility for state assistance programs.</p>
        </div>
      </section>

      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          {!showResults ? (
            <div className="bg-card border border-border rounded-xl p-6 md:p-8">
              <h2 className="font-heading text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Heart size={20} className="text-secondary" /> Benefit Eligibility Screener
              </h2>
              <p className="text-muted-foreground font-body text-sm mb-6">
                Answer a few questions to see which programs you may qualify for. This is not an application.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-body font-semibold text-foreground mb-2">Household Size</label>
                  <select
                    value={formData.householdSize}
                    onChange={(e) => setFormData({ ...formData, householdSize: e.target.value })}
                    required
                    className="w-full border border-border rounded-md px-3 py-2 font-body text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select...</option>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-body font-semibold text-foreground mb-2">Annual Household Income</label>
                  <select
                    value={formData.income}
                    onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                    required
                    className="w-full border border-border rounded-md px-3 py-2 font-body text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select range...</option>
                    <option value="15000">Under $15,000</option>
                    <option value="25000">$15,000 – $30,000</option>
                    <option value="35000">$30,000 – $45,000</option>
                    <option value="50000">$45,000 – $60,000</option>
                    <option value="70000">$60,000 – $80,000</option>
                    <option value="90000">Over $80,000</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-body font-semibold text-foreground mb-2">Employment Status</label>
                  <select
                    value={formData.employment}
                    onChange={(e) => setFormData({ ...formData, employment: e.target.value })}
                    required
                    className="w-full border border-border rounded-md px-3 py-2 font-body text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select...</option>
                    <option value="employed">Employed Full-Time</option>
                    <option value="part-time">Employed Part-Time</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="retired">Retired</option>
                    <option value="self-employed">Self-Employed</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-md bg-primary text-primary-foreground font-body font-semibold hover:opacity-90 transition-opacity"
                >
                  Check Eligibility
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <button onClick={() => setShowResults(false)} className="text-sm text-primary font-body font-semibold hover:underline">
                  ← Back to Screener
                </button>
              </div>

              <h2 className="font-heading text-xl font-bold text-foreground mb-2">Your Results</h2>
              <p className="text-muted-foreground font-body text-sm mb-6">
                Based on your responses, you may qualify for <strong>{qualifying.length}</strong> program{qualifying.length !== 1 && "s"}.
              </p>

              {qualifying.length > 0 ? (
                <div className="space-y-4">
                  {qualifying.map((p) => (
                    <div key={p.name} className="bg-card border border-border rounded-xl p-6">
                      <div className="flex items-start gap-3 mb-3">
                        <CheckCircle2 className="text-secondary shrink-0 mt-0.5" size={20} />
                        <div>
                          <h3 className="font-heading font-bold text-foreground">{p.name}</h3>
                          <p className="text-sm text-muted-foreground font-body mt-1">{p.desc}</p>
                        </div>
                      </div>
                      <button className="flex items-center gap-2 text-sm font-body font-semibold text-primary hover:underline mt-2">
                        Start Application <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted rounded-xl p-8 text-center">
                  <p className="font-body text-muted-foreground">Based on the information provided, you may not qualify for these programs. Please contact us at (802) 828-1110 for more options.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BenefitsPage;
