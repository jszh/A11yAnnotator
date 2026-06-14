import { useState, useRef } from "react";
import GovBreadcrumb from "@/components/government/Breadcrumb";
import { CheckCircle2, CreditCard, Building2, Search } from "lucide-react";

type Step = "lookup" | "payment" | "confirmation";

const GovPayBill = () => {
  const [step, setStep] = useState<Step>("lookup");
  const [accountNumber, setAccountNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "bank">("credit");
  const [lookupError, setLookupError] = useState("");
  const stepRef = useRef<HTMLHeadingElement>(null);

  const advanceTo = (next: Step) => {
    setStep(next);
    setTimeout(() => stepRef.current?.focus(), 100);
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) {
      setLookupError("Please enter your account number.");
      return;
    }
    setLookupError("");
    advanceTo("payment");
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    advanceTo("confirmation");
  };

  return (
    <>
      <GovBreadcrumb items={[{ label: "Services", path: "/government/services" }, { label: "Pay a Bill" }]} />

      <section aria-labelledby="paybill-heading" className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 id="paybill-heading" className="font-serif text-3xl font-bold text-foreground mb-2">Pay a Bill</h1>
          <p className="font-sans text-muted-foreground mb-8">Pay your utility bills online quickly and securely.</p>

          {/* Step indicator */}
          <nav aria-label="Payment progress" className="mb-8">
            <ol className="flex items-center gap-0">
              {[
                { label: "Look Up Account", key: "lookup" },
                { label: "Make Payment", key: "payment" },
                { label: "Confirmation", key: "confirmation" },
              ].map((s, i, arr) => {
                const stepOrder = ["lookup", "payment", "confirmation"];
                const currentIdx = stepOrder.indexOf(step);
                const sIdx = stepOrder.indexOf(s.key);
                const isComplete = sIdx < currentIdx;
                const isCurrent = sIdx === currentIdx;
                return (
                  <li key={s.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1 text-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-sans font-bold ${
                        isComplete ? "bg-gov-success text-primary-foreground" :
                        isCurrent ? "bg-primary text-primary-foreground" :
                        "bg-muted text-muted-foreground"
                      }`} aria-label={`Step ${i + 1}: ${s.label}${isComplete ? " (complete)" : isCurrent ? " (current)" : ""}`}>
                        {isComplete ? "✓" : i + 1}
                      </div>
                      <span className={`text-xs font-sans mt-1.5 ${isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                    </div>
                    {i < arr.length - 1 && <div className={`h-0.5 flex-1 ${isComplete ? "bg-gov-success" : "bg-border"}`} aria-hidden="true" />}
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Lookup */}
          {step === "lookup" && (
            <section aria-labelledby="lookup-heading" className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 id="lookup-heading" ref={stepRef} tabIndex={-1} className="font-serif text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-accent" aria-hidden="true" />
                Account Lookup
              </h2>
              <form onSubmit={handleLookup} noValidate>
                <label htmlFor="account-number" className="block font-sans text-sm font-medium text-foreground mb-1">
                  Account Number <span aria-hidden="true" className="text-gov-alert">*</span>
                </label>
                <input
                  id="account-number"
                  type="text"
                  required
                  aria-required="true"
                  aria-invalid={!!lookupError}
                  aria-describedby={lookupError ? "lookup-error" : "account-hint"}
                  placeholder="e.g., 1234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded border border-input bg-background px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p id="account-hint" className="text-xs text-muted-foreground font-sans mt-1">Found on your utility bill statement.</p>
                {lookupError && <p id="lookup-error" className="text-sm text-gov-alert font-sans mt-1" role="alert">{lookupError}</p>}
                <button type="submit" className="mt-4 rounded bg-primary px-6 py-2.5 font-sans font-semibold text-sm text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  Look Up Account
                </button>
              </form>
            </section>
          )}

          {/* Payment */}
          {step === "payment" && (
            <section aria-labelledby="payment-heading" className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 id="payment-heading" ref={stepRef} tabIndex={-1} className="font-serif text-xl font-bold text-foreground mb-4">Account Details & Payment</h2>

              {/* Balance display */}
              <div className="rounded-lg bg-gov-info p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-sans text-sm text-muted-foreground">Account #: {accountNumber}</p>
                    <p className="font-sans text-sm text-muted-foreground">Name: Jane M. Resident</p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-xs text-muted-foreground uppercase tracking-wide">Current Balance</p>
                    <p className="font-serif text-2xl font-bold text-foreground">$147.52</p>
                    <p className="font-sans text-xs text-muted-foreground">Due: Dec 15, 2024</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePayment}>
                {/* Payment method */}
                <fieldset>
                  <legend className="font-sans text-sm font-medium text-foreground mb-3">Payment Method</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${paymentMethod === "credit" ? "border-primary bg-gov-info" : "border-border hover:border-primary/30"}`}>
                      <input type="radio" name="payment-method" value="credit" checked={paymentMethod === "credit"} onChange={() => setPaymentMethod("credit")} className="h-4 w-4 accent-primary" />
                      <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
                      <span className="font-sans text-sm font-medium text-foreground">Credit/Debit Card</span>
                    </label>
                    <label className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${paymentMethod === "bank" ? "border-primary bg-gov-info" : "border-border hover:border-primary/30"}`}>
                      <input type="radio" name="payment-method" value="bank" checked={paymentMethod === "bank"} onChange={() => setPaymentMethod("bank")} className="h-4 w-4 accent-primary" />
                      <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
                      <span className="font-sans text-sm font-medium text-foreground">Bank Transfer (ACH)</span>
                    </label>
                  </div>
                </fieldset>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setStep("lookup")} className="rounded border border-border bg-secondary px-4 py-2.5 font-sans text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    Back
                  </button>
                  <button type="submit" className="rounded bg-primary px-6 py-2.5 font-sans font-semibold text-sm text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    Pay $147.52
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Confirmation */}
          {step === "confirmation" && (
            <section aria-labelledby="confirm-heading" className="rounded-lg border-2 border-gov-success bg-gov-success-bg p-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-gov-success mx-auto mb-4" aria-hidden="true" />
              <h2 id="confirm-heading" ref={stepRef} tabIndex={-1} className="font-serif text-2xl font-bold text-foreground mb-2">Payment Successful</h2>
              <div aria-live="polite">
                <p className="font-sans text-muted-foreground mb-1">Your payment of <strong className="text-foreground">$147.52</strong> has been processed.</p>
                <p className="font-sans text-sm text-muted-foreground mb-6">Confirmation #: <strong className="text-foreground">PAY-2024-119847</strong></p>
              </div>
              <button onClick={() => { setStep("lookup"); setAccountNumber(""); }} className="rounded bg-primary px-6 py-2.5 font-sans font-semibold text-sm text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                Make Another Payment
              </button>
            </section>
          )}
        </div>
      </section>
    </>
  );
};

export default GovPayBill;
