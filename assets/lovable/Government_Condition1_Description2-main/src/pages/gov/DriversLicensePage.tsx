import { useState } from "react";
import { Check, ChevronRight, FileText, DollarSign, Calendar, Mail } from "lucide-react";
import Layout from "@/components/gov/Layout";

const steps = ["Eligibility", "Documents", "Fees", "Schedule", "Confirm"];

const requiredDocs = [
  "Current Vermont driver's license",
  "Proof of identity (passport or birth certificate)",
  "Proof of Vermont residency (utility bill, bank statement)",
  "Social Security card or W-2",
];

const DriversLicensePage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<boolean[]>(new Array(requiredDocs.length).fill(false));
  const [selectedDate, setSelectedDate] = useState("");

  const toggleDoc = (i: number) => {
    const next = [...checkedDocs];
    next[i] = !next[i];
    setCheckedDocs(next);
  };

  const canProceed = () => {
    if (currentStep === 0) return eligible === true;
    if (currentStep === 1) return checkedDocs.every(Boolean);
    if (currentStep === 3) return selectedDate !== "";
    return true;
  };

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-10">
        <div className="container">
          <p className="text-sm opacity-70 mb-1">Services → Driver's License</p>
          <h1 className="font-display text-3xl font-bold">Driver's License Renewal</h1>
          <p className="mt-2 opacity-80">Renew your Vermont driver's license online in about 10 minutes.</p>
        </div>
      </section>

      {/* Progress steps */}
      <div className="border-b border-border bg-card">
        <div className="container">
          <nav aria-label="Renewal progress" className="flex overflow-x-auto">
            {steps.map((step, i) => (
              <button
                key={step}
                onClick={() => i <= currentStep && setCurrentStep(i)}
                disabled={i > currentStep}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                  i === currentStep
                    ? "border-gov-green text-gov-green"
                    : i < currentStep
                    ? "border-transparent text-foreground cursor-pointer hover:text-gov-green"
                    : "border-transparent text-muted-foreground cursor-not-allowed"
                }`}
                aria-current={i === currentStep ? "step" : undefined}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  i < currentStep ? "bg-gov-green text-accent-foreground" : i === currentStep ? "bg-gov-green/10 text-gov-green" : "bg-muted text-muted-foreground"
                }`}>
                  {i < currentStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{step}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <section className="py-10 md:py-14">
        <div className="container max-w-2xl">
          {/* Step 0: Eligibility */}
          {currentStep === 0 && (
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gov-green" aria-hidden="true" /> Eligibility Check
              </h2>
              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <p className="text-sm text-foreground">You may renew online if:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Your license expires within 12 months or has expired less than 3 years ago</li>
                  <li>You are a Vermont resident</li>
                  <li>You have no outstanding suspensions</li>
                </ul>
                <fieldset>
                  <legend className="text-sm font-semibold text-foreground mb-2">Do you meet all criteria above?</legend>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEligible(true)}
                      className={`rounded-lg border px-6 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                        eligible === true ? "border-gov-green bg-gov-green/10 text-gov-green" : "border-border hover:bg-muted"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setEligible(false)}
                      className={`rounded-lg border px-6 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                        eligible === false ? "border-destructive bg-destructive/10 text-destructive" : "border-border hover:bg-muted"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </fieldset>
                {eligible === false && (
                  <p className="text-sm text-destructive" role="alert">You may need to visit a DMV office in person. Call (802) 828-2000 for assistance.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Documents */}
          {currentStep === 1 && (
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gov-green" aria-hidden="true" /> Required Documents
              </h2>
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground mb-4">Please confirm you have the following documents ready:</p>
                <ul className="space-y-3" role="list">
                  {requiredDocs.map((doc, i) => (
                    <li key={i}>
                      <label className="flex items-center gap-3 cursor-pointer text-sm text-foreground">
                        <input
                          type="checkbox"
                          checked={checkedDocs[i]}
                          onChange={() => toggleDoc(i)}
                          className="h-4 w-4 rounded border-border text-gov-green focus:ring-2 focus:ring-ring"
                        />
                        {doc}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Fees */}
          {currentStep === 2 && (
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gov-green" aria-hidden="true" /> Fee Breakdown
              </h2>
              <div className="rounded-lg border border-border bg-card p-6 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">License renewal fee</span><span className="text-foreground font-medium">$32.00</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Online processing fee</span><span className="text-foreground font-medium">$3.00</span></div>
                <div className="border-t border-border pt-3 flex justify-between text-sm font-bold"><span>Total</span><span>$35.00</span></div>
                <p className="text-xs text-muted-foreground">Payment accepted: credit/debit card or ACH bank transfer.</p>
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {currentStep === 3 && (
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gov-green" aria-hidden="true" /> Schedule Appointment (Optional)
              </h2>
              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  If your renewal requires a new photo, select a DMV office visit date. Otherwise, skip this step.
                </p>
                <div>
                  <label htmlFor="appt-date" className="text-sm font-medium text-foreground block mb-1">Preferred date</label>
                  <input
                    id="appt-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-lg border border-border px-4 py-2.5 text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring w-full max-w-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-gov-green" aria-hidden="true" /> Confirmation
              </h2>
              <div className="rounded-lg border border-gov-green bg-gov-green/5 p-6 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gov-green text-accent-foreground">
                  <Check className="h-7 w-7" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">Renewal Submitted!</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  A confirmation email has been sent to your registered email address. Your new license will arrive by mail within 7–10 business days.
                </p>
                <div className="text-sm text-foreground">
                  <strong>Confirmation #:</strong> VT-DL-2026-04821
                </div>
                {selectedDate && (
                  <div className="text-sm text-foreground">
                    <strong>DMV Appointment:</strong> {selectedDate}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Back
            </button>
            {currentStep < steps.length - 1 && (
              <button
                onClick={() => canProceed() && setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="rounded-lg bg-gov-green px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-gov-green-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2"
              >
                Continue <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default DriversLicensePage;
