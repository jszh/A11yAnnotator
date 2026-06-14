import { useState } from "react";
import { Check, ChevronRight, Calendar, FileText, DollarSign, Mail } from "lucide-react";
import GovLayout from "@/components/government/GovLayout";
import Breadcrumbs from "@/components/government/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const steps = ["Eligibility", "Documents", "Fees", "Schedule", "Confirm"];

const documents = [
  { name: "Current Vermont Driver's License", required: true },
  { name: "Proof of Vermont Residency", required: true },
  { name: "Social Security Card or W-2", required: true },
  { name: "Proof of Legal Name Change (if applicable)", required: false },
];

export default function DriversLicensePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [confirmed, setConfirmed] = useState(false);

  const handleDocToggle = (doc: string) => {
    setCheckedDocs((prev) => {
      const next = new Set(prev);
      next.has(doc) ? next.delete(doc) : next.add(doc);
      return next;
    });
  };

  const canProceed = () => {
    if (currentStep === 0) return eligible === true;
    if (currentStep === 1) return documents.filter((d) => d.required).every((d) => checkedDocs.has(d.name));
    if (currentStep === 3) return !!selectedDate;
    return true;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    if (currentStep === steps.length - 2) setConfirmed(true);
  };

  return (
    <GovLayout title="Driver's License Renewal">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Services", to: "/services" }, { label: "Driver's License Renewal" }]} />

      <section className="gov-container gov-section" aria-labelledby="dl-heading">
        <h1 id="dl-heading" className="text-3xl font-serif font-bold mb-2">Driver's License Renewal</h1>
        <p className="text-muted-foreground text-lg mb-10">Complete the steps below to renew your Vermont driver's license online.</p>

        {/* Step indicator */}
        <nav aria-label="Renewal progress" className="mb-10">
          <ol className="flex items-center gap-2 overflow-x-auto" role="list">
            {steps.map((step, i) => (
              <li key={step} className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => i < currentStep && setCurrentStep(i)}
                  disabled={i > currentStep}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-ring",
                    i === currentStep && "bg-primary text-primary-foreground",
                    i < currentStep && "bg-gov-success text-gov-success-foreground cursor-pointer",
                    i > currentStep && "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                  aria-current={i === currentStep ? "step" : undefined}
                  aria-label={`Step ${i + 1}: ${step}${i < currentStep ? " (completed)" : ""}`}
                >
                  {i < currentStep ? <Check className="h-4 w-4" aria-hidden="true" /> : <span>{i + 1}</span>}
                  <span className="hidden sm:inline">{step}</span>
                </button>
                {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </nav>

        {/* Step content */}
        <div className="max-w-2xl" aria-live="polite">
          {currentStep === 0 && (
            <section aria-labelledby="eligibility-heading">
              <h2 id="eligibility-heading" className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" aria-hidden="true" /> Eligibility Check
              </h2>
              <div className="rounded-lg border bg-card p-6 space-y-4">
                <p className="text-card-foreground">To renew online, you must meet the following requirements:</p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-card-foreground" role="list">
                  <li>Be a current Vermont resident</li>
                  <li>Have a valid (not suspended) Vermont driver's license</li>
                  <li>Be at least 18 years old</li>
                  <li>Not require a vision or medical exam</li>
                </ul>
                <fieldset>
                  <legend className="font-semibold mb-2 text-card-foreground">Do you meet all of these requirements?</legend>
                  <div className="flex gap-3">
                    <Button
                      variant={eligible === true ? "default" : "outline"}
                      onClick={() => setEligible(true)}
                      aria-pressed={eligible === true}
                    >
                      Yes, I'm eligible
                    </Button>
                    <Button
                      variant={eligible === false ? "destructive" : "outline"}
                      onClick={() => setEligible(false)}
                      aria-pressed={eligible === false}
                    >
                      No
                    </Button>
                  </div>
                </fieldset>
                {eligible === false && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive" role="alert">
                    You may need to visit a DMV office in person. Please call 1-800-VT-HELP1 for assistance.
                  </div>
                )}
              </div>
            </section>
          )}

          {currentStep === 1 && (
            <section aria-labelledby="docs-heading">
              <h2 id="docs-heading" className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" aria-hidden="true" /> Required Documents
              </h2>
              <div className="rounded-lg border bg-card p-6">
                <p className="text-card-foreground mb-4">Please confirm you have the following documents ready:</p>
                <ul className="space-y-3" role="list">
                  {documents.map((doc) => (
                    <li key={doc.name}>
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-md hover:bg-muted/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={checkedDocs.has(doc.name)}
                          onChange={() => handleDocToggle(doc.name)}
                          className="h-5 w-5 rounded border-input text-primary focus-ring"
                          aria-required={doc.required}
                        />
                        <span className="text-sm text-card-foreground">
                          {doc.name}
                          {doc.required && <span className="text-destructive ml-1" aria-label="required">*</span>}
                          {!doc.required && <span className="text-muted-foreground ml-1">(optional)</span>}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {currentStep === 2 && (
            <section aria-labelledby="fees-heading">
              <h2 id="fees-heading" className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" aria-hidden="true" /> Fee Breakdown
              </h2>
              <div className="rounded-lg border bg-card p-6">
                <table className="w-full text-sm" aria-label="Renewal fee breakdown">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-semibold text-card-foreground">Item</th>
                      <th className="text-right py-3 font-semibold text-card-foreground">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 text-card-foreground">License Renewal Fee</td>
                      <td className="py-3 text-right text-card-foreground">$30.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 text-card-foreground">Online Processing Fee</td>
                      <td className="py-3 text-right text-card-foreground">$5.00</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-card-foreground">Total</td>
                      <td className="py-3 text-right font-bold text-primary text-lg">$35.00</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-4">Payments accepted: Credit card, debit card, or electronic check.</p>
              </div>
            </section>
          )}

          {currentStep === 3 && (
            <section aria-labelledby="schedule-heading">
              <h2 id="schedule-heading" className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" aria-hidden="true" /> Schedule Appointment
              </h2>
              <div className="rounded-lg border bg-card p-6">
                <p className="text-card-foreground mb-4">Select a preferred date for photo verification (if required):</p>
                <CalendarUI
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                  className="rounded-md border pointer-events-auto mx-auto"
                  aria-label="Select appointment date"
                />
                {selectedDate && (
                  <p className="mt-4 text-sm text-gov-success font-medium" aria-live="polite">
                    ✓ Selected: {selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                )}
              </div>
            </section>
          )}

          {currentStep === 4 && (
            <section aria-labelledby="confirm-heading">
              <h2 id="confirm-heading" className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" aria-hidden="true" /> Confirmation
              </h2>
              <div className="rounded-lg border bg-gov-success/5 border-gov-success/20 p-6" role="status" aria-live="polite">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gov-success text-gov-success-foreground">
                    <Check className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-foreground">Renewal Submitted Successfully!</h3>
                </div>
                <div className="space-y-2 text-sm text-foreground">
                  <p>Your driver's license renewal has been submitted. Here's a summary:</p>
                  <ul className="list-disc pl-5 space-y-1" role="list">
                    <li>Fee paid: <strong>$35.00</strong></li>
                    {selectedDate && (
                      <li>Appointment: <strong>{selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</strong></li>
                    )}
                    <li>Confirmation number: <strong>VT-DL-2026-{Math.random().toString(36).substr(2, 8).toUpperCase()}</strong></li>
                  </ul>
                  <p className="mt-4 text-muted-foreground">A confirmation email has been sent to your registered email address.</p>
                </div>
              </div>
            </section>
          )}

          {/* Navigation buttons */}
          {currentStep < steps.length - 1 && (
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                aria-label="Go to previous step"
              >
                Back
              </Button>
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                aria-label={`Proceed to ${steps[currentStep + 1]}`}
              >
                {currentStep === steps.length - 2 ? "Submit Renewal" : "Continue"}
                <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </section>
    </GovLayout>
  );
}
