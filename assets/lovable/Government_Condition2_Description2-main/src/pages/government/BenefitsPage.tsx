import { useState } from "react";
import { HeartPulse, ArrowRight, CheckCircle2 } from "lucide-react";
import GovLayout from "@/components/government/GovLayout";
import Breadcrumbs from "@/components/government/Breadcrumbs";
import { Button } from "@/components/ui/button";

interface ScreenerData {
  householdSize: string;
  income: string;
  employment: string;
}

const programs = [
  { name: "3SquaresVT (SNAP)", desc: "Supplemental nutrition assistance for eligible households.", eligible: (d: ScreenerData) => parseInt(d.income) < 40000 },
  { name: "Vermont Medicaid", desc: "Health coverage for low-income individuals and families.", eligible: (d: ScreenerData) => parseInt(d.income) < 50000 },
  { name: "Heating Assistance (LIHEAP)", desc: "Help with heating costs during cold months.", eligible: (d: ScreenerData) => parseInt(d.income) < 45000 },
  { name: "Reach Up", desc: "Financial assistance and case management for families with children.", eligible: (d: ScreenerData) => parseInt(d.income) < 30000 && parseInt(d.householdSize) >= 2 },
];

export default function BenefitsPage() {
  const [step, setStep] = useState<"form" | "results">("form");
  const [formData, setFormData] = useState<ScreenerData>({ householdSize: "", income: "", employment: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.householdSize) errs.householdSize = "Please select your household size.";
    if (!formData.income) errs.income = "Please select your income range.";
    if (!formData.employment) errs.employment = "Please select your employment status.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) setStep("results");
  };

  const qualifyingPrograms = programs.filter((p) => p.eligible(formData));

  return (
    <GovLayout title="Apply for Benefits">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Services", to: "/services" }, { label: "Apply for Benefits" }]} />

      <section className="gov-container gov-section" aria-labelledby="benefits-heading">
        <h1 id="benefits-heading" className="text-3xl font-serif font-bold mb-2">Apply for Benefits</h1>
        <p className="text-muted-foreground text-lg mb-10">
          Answer a few questions to see which Vermont benefit programs you may qualify for.
        </p>

        {step === "form" && (
          <form onSubmit={handleSubmit} className="max-w-xl space-y-6" noValidate>
            {/* Household Size */}
            <div>
              <label htmlFor="householdSize" className="block text-sm font-semibold text-foreground mb-2">
                Household Size <span className="text-destructive" aria-label="required">*</span>
              </label>
              <select
                id="householdSize"
                value={formData.householdSize}
                onChange={(e) => setFormData({ ...formData, householdSize: e.target.value })}
                className="w-full rounded-md border bg-card px-4 py-3 text-card-foreground focus-ring"
                aria-required="true"
                aria-describedby={errors.householdSize ? "hs-error" : undefined}
                aria-invalid={!!errors.householdSize}
              >
                <option value="">Select household size</option>
                <option value="1">1 person</option>
                <option value="2">2 people</option>
                <option value="3">3 people</option>
                <option value="4">4 people</option>
                <option value="5">5+ people</option>
              </select>
              {errors.householdSize && (
                <p id="hs-error" className="text-sm text-destructive mt-1" role="alert">{errors.householdSize}</p>
              )}
            </div>

            {/* Income */}
            <div>
              <label htmlFor="income" className="block text-sm font-semibold text-foreground mb-2">
                Annual Household Income <span className="text-destructive" aria-label="required">*</span>
              </label>
              <select
                id="income"
                value={formData.income}
                onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                className="w-full rounded-md border bg-card px-4 py-3 text-card-foreground focus-ring"
                aria-required="true"
                aria-describedby={errors.income ? "inc-error" : undefined}
                aria-invalid={!!errors.income}
              >
                <option value="">Select income range</option>
                <option value="15000">Under $15,000</option>
                <option value="25000">$15,000 – $30,000</option>
                <option value="35000">$30,000 – $45,000</option>
                <option value="55000">$45,000 – $60,000</option>
                <option value="75000">Over $60,000</option>
              </select>
              {errors.income && (
                <p id="inc-error" className="text-sm text-destructive mt-1" role="alert">{errors.income}</p>
              )}
            </div>

            {/* Employment */}
            <div>
              <label htmlFor="employment" className="block text-sm font-semibold text-foreground mb-2">
                Employment Status <span className="text-destructive" aria-label="required">*</span>
              </label>
              <select
                id="employment"
                value={formData.employment}
                onChange={(e) => setFormData({ ...formData, employment: e.target.value })}
                className="w-full rounded-md border bg-card px-4 py-3 text-card-foreground focus-ring"
                aria-required="true"
                aria-describedby={errors.employment ? "emp-error" : undefined}
                aria-invalid={!!errors.employment}
              >
                <option value="">Select employment status</option>
                <option value="employed">Employed full-time</option>
                <option value="part-time">Employed part-time</option>
                <option value="unemployed">Unemployed</option>
                <option value="retired">Retired</option>
                <option value="student">Student</option>
              </select>
              {errors.employment && (
                <p id="emp-error" className="text-sm text-destructive mt-1" role="alert">{errors.employment}</p>
              )}
            </div>

            <Button type="submit" className="w-full sm:w-auto" aria-label="Check benefit eligibility">
              Check Eligibility <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Button>
          </form>
        )}

        {step === "results" && (
          <div aria-live="polite">
            <div className="mb-8 rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">
              <strong>Your answers:</strong> Household of {formData.householdSize}, income ~${parseInt(formData.income).toLocaleString()}, {formData.employment}
              <Button variant="link" className="ml-2 text-sm p-0 h-auto" onClick={() => setStep("form")} aria-label="Edit your answers">
                Edit
              </Button>
            </div>

            {qualifyingPrograms.length > 0 ? (
              <>
                <h2 className="text-xl font-serif font-bold mb-4">
                  You may qualify for {qualifyingPrograms.length} program{qualifyingPrograms.length > 1 ? "s" : ""}
                </h2>
                <ul className="space-y-4" role="list">
                  {qualifyingPrograms.map((prog) => (
                    <li key={prog.name} className="rounded-lg border bg-card p-6">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-gov-success mt-0.5 shrink-0" aria-hidden="true" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-card-foreground text-lg">{prog.name}</h3>
                          <p className="text-muted-foreground text-sm mt-1">{prog.desc}</p>
                          <Button className="mt-4" aria-label={`Start application for ${prog.name}`}>
                            Start Application <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="rounded-lg border bg-card p-6 text-center">
                <HeartPulse className="h-10 w-10 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
                <h2 className="font-serif font-bold text-lg text-card-foreground mb-2">No Programs Matched</h2>
                <p className="text-muted-foreground text-sm">
                  Based on your answers, you may not qualify for the programs listed. Contact us at 1-800-VT-HELP1 for personalized assistance.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </GovLayout>
  );
}
