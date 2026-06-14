import { useState } from "react";
import { Check, ChevronRight, Calendar, FileText, DollarSign, Mail } from "lucide-react";
import Layout from "@/components/government/Layout";

const steps = ["Eligibility", "Documents", "Fees", "Appointment", "Confirmation"];

const requiredDocs = [
  "Current Vermont Driver's License",
  "Proof of Vermont residency (utility bill, lease agreement)",
  "Social Security Number",
  "Proof of legal presence (passport or birth certificate)",
];

const fees = [
  { item: "License Renewal Fee", amount: "$35.00" },
  { item: "REAL ID Upgrade (optional)", amount: "$12.00" },
  { item: "Online Processing Fee", amount: "$2.50" },
];

const appointmentSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM",
];

const DriversLicensePage = () => {
  const [step, setStep] = useState(0);
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const toggleDoc = (doc: string) => {
    setCheckedDocs((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
  };

  const canProceed = () => {
    if (step === 0) return eligible === true;
    if (step === 1) return checkedDocs.length === requiredDocs.length;
    if (step === 2) return true;
    if (step === 3) return selectedDate && selectedTime;
    return false;
  };

  return (
    <Layout>
      <section className="bg-primary">
        <div className="container py-10">
          <h1 className="font-heading text-3xl font-bold text-primary-foreground mb-2">Driver's License Renewal</h1>
          <p className="text-primary-foreground/80 font-body">Complete your renewal online in approximately 10 minutes.</p>
        </div>
      </section>

      {/* Step indicator */}
      <div className="container py-6">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-body font-semibold ${
                i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <Check size={14} /> : <span>{i + 1}</span>}
                <span className="hidden sm:inline">{s}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight size={16} className="text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <div className="container pb-16">
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-6 md:p-8">
          {/* Step 0: Eligibility */}
          {step === 0 && (
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText size={20} className="text-secondary" /> Eligibility Check
              </h2>
              <p className="text-muted-foreground font-body mb-6">You may renew your license online if you meet the following criteria:</p>
              <ul className="space-y-2 text-sm font-body text-foreground mb-6">
                <li>• Your current license is not expired by more than 3 years</li>
                <li>• You are a Vermont resident aged 21–75</li>
                <li>• You have no outstanding violations or suspensions</li>
                <li>• Your name and address have not changed</li>
              </ul>
              <p className="font-body font-semibold text-foreground mb-3">Do you meet all the criteria above?</p>
              <div className="flex gap-3">
                <button onClick={() => setEligible(true)} className={`px-6 py-2 rounded-md font-body font-semibold text-sm border transition-colors ${eligible === true ? "bg-secondary text-secondary-foreground border-secondary" : "border-border text-foreground hover:bg-muted"}`}>Yes, I'm Eligible</button>
                <button onClick={() => setEligible(false)} className={`px-6 py-2 rounded-md font-body font-semibold text-sm border transition-colors ${eligible === false ? "bg-destructive text-destructive-foreground border-destructive" : "border-border text-foreground hover:bg-muted"}`}>No</button>
              </div>
              {eligible === false && (
                <p className="mt-4 text-destructive font-body text-sm">You may need to renew in person at a DMV office. Call (802) 828-2000 for assistance.</p>
              )}
            </div>
          )}

          {/* Step 1: Documents */}
          {step === 1 && (
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText size={20} className="text-secondary" /> Required Documents
              </h2>
              <p className="text-muted-foreground font-body mb-6">Please confirm you have the following documents ready:</p>
              <div className="space-y-3">
                {requiredDocs.map((doc) => (
                  <label key={doc} className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={checkedDocs.includes(doc)}
                      onChange={() => toggleDoc(doc)}
                      className="mt-0.5 w-4 h-4 rounded border-border text-primary accent-primary"
                    />
                    <span className="font-body text-sm text-foreground">{doc}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Fees */}
          {step === 2 && (
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-secondary" /> Fee Breakdown
              </h2>
              <div className="border border-border rounded-lg overflow-hidden mb-4">
                {fees.map((f, i) => (
                  <div key={i} className={`flex justify-between px-4 py-3 font-body text-sm ${i % 2 === 0 ? "bg-card" : "bg-muted/50"}`}>
                    <span className="text-foreground">{f.item}</span>
                    <span className="font-semibold text-foreground">{f.amount}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3 bg-primary text-primary-foreground font-body font-bold">
                  <span>Total</span>
                  <span>$49.50</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-body">Payment accepted: Credit/Debit Card, ACH Transfer. Fees are non-refundable.</p>
            </div>
          )}

          {/* Step 3: Appointment */}
          {step === 3 && (
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-secondary" /> Schedule Appointment
              </h2>
              <p className="text-muted-foreground font-body mb-4">Select a date and time at your nearest DMV office.</p>
              <div className="mb-4">
                <label className="block text-sm font-body font-semibold text-foreground mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 font-body text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {selectedDate && (
                <div>
                  <label className="block text-sm font-body font-semibold text-foreground mb-2">Available Times</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {appointmentSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`px-3 py-2 text-sm rounded-md font-body font-semibold border transition-colors ${
                          selectedTime === slot
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-secondary-foreground" size={28} />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-3">Renewal Submitted!</h2>
              <p className="text-muted-foreground font-body mb-6 max-w-md mx-auto">
                A confirmation email has been sent to your registered email address. Your appointment is scheduled
                for <strong>{selectedDate}</strong> at <strong>{selectedTime}</strong>.
              </p>
              <div className="bg-muted rounded-lg p-4 max-w-sm mx-auto text-left text-sm font-body space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Confirmation #</span><span className="font-semibold text-foreground">VT-2026-04892</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="font-semibold text-foreground">$49.50</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-semibold text-secondary">Processing</span></div>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="px-5 py-2 rounded-md font-body font-semibold text-sm border border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-5 py-2 rounded-md font-body font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {step === 3 ? "Submit Renewal" : "Continue"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DriversLicensePage;
