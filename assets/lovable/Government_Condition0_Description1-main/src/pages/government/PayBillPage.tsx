import { useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Building2, CheckCircle2, Search, DollarSign } from "lucide-react";
import Layout from "@/components/government/Layout";

type Step = "lookup" | "balance" | "payment" | "confirmation";

const PayBillPage = () => {
  const [step, setStep] = useState<Step>("lookup");
  const [accountNumber, setAccountNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("credit");

  const mockAccount = {
    name: "Jane M. Doe",
    address: "1247 Elm Street, Lakewood, CA 90713",
    accountNumber: "LWD-88421-07",
    currentBalance: 142.56,
    dueDate: "December 15, 2026",
    lastPayment: "$128.30 on Oct 28, 2026",
  };

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground">
        <div className="gov-container py-12">
          <nav className="text-sm mb-4 opacity-70">
            <Link to="/">Home</Link> <span className="mx-2">/</span>
            <Link to="/services">Services</Link> <span className="mx-2">/</span>
            <span>Pay a Bill</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Pay Your Utility Bill</h1>
          <p className="text-lg opacity-85 max-w-2xl">
            Look up your account, view your balance, and make a secure payment online.
          </p>
        </div>
      </section>

      <section className="gov-section">
        <div className="gov-container max-w-2xl">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-10">
            {(["lookup", "balance", "payment", "confirmation"] as Step[]).map((s, i) => {
              const labels = ["Account Lookup", "Balance", "Payment", "Confirmation"];
              const isActive = ["lookup", "balance", "payment", "confirmation"].indexOf(step) >= i;
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {labels[i]}
                  </span>
                  {i < 3 && <div className={`flex-1 h-px mx-2 ${isActive ? "bg-primary" : "bg-border"}`} />}
                </div>
              );
            })}
          </div>

          {/* Step 1: Account Lookup */}
          {step === "lookup" && (
            <div className="bg-card border rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <Search className="h-6 w-6 text-accent" />
                <h2 className="text-xl font-serif font-bold text-foreground">Find Your Account</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="e.g. LWD-88421-07"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Found on your utility bill statement</p>
                </div>
                <button
                  onClick={() => setStep("balance")}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
                >
                  Look Up Account
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Balance Display */}
          {step === "balance" && (
            <div className="bg-card border rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="h-6 w-6 text-accent" />
                <h2 className="text-xl font-serif font-bold text-foreground">Account Balance</h2>
              </div>
              <div className="bg-secondary rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Account Holder</span><p className="font-semibold text-foreground">{mockAccount.name}</p></div>
                  <div><span className="text-muted-foreground">Account #</span><p className="font-mono font-semibold text-foreground">{mockAccount.accountNumber}</p></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Service Address</span><p className="font-semibold text-foreground">{mockAccount.address}</p></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-6 bg-accent/10 rounded-lg mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance Due</p>
                  <p className="text-3xl font-bold text-foreground">${mockAccount.currentBalance.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-semibold text-foreground">{mockAccount.dueDate}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-6">Last payment: {mockAccount.lastPayment}</p>
              <button
                onClick={() => setStep("payment")}
                className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
              >
                Pay Now
              </button>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === "payment" && (
            <div className="bg-card border rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="h-6 w-6 text-accent" />
                <h2 className="text-xl font-serif font-bold text-foreground">Payment Method</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Amount: <strong className="text-foreground">${mockAccount.currentBalance.toFixed(2)}</strong></p>

              <div className="space-y-3 mb-6">
                <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "credit" ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"}`}>
                  <input type="radio" name="method" value="credit" checked={paymentMethod === "credit"} onChange={() => setPaymentMethod("credit")} className="accent-primary" />
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div><p className="font-medium text-sm text-foreground">Credit or Debit Card</p><p className="text-xs text-muted-foreground">Visa, Mastercard, Discover</p></div>
                </label>
                <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === "bank" ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"}`}>
                  <input type="radio" name="method" value="bank" checked={paymentMethod === "bank"} onChange={() => setPaymentMethod("bank")} className="accent-primary" />
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div><p className="font-medium text-sm text-foreground">Bank Transfer (ACH)</p><p className="text-xs text-muted-foreground">Direct bank account withdrawal</p></div>
                </label>
              </div>

              {paymentMethod === "credit" && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Card Number</label>
                    <input type="text" className="w-full px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent" placeholder="•••• •••• •••• ••••" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Expiry</label>
                      <input type="text" className="w-full px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent" placeholder="MM/YY" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">CVV</label>
                      <input type="text" className="w-full px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent" placeholder="•••" />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "bank" && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Routing Number</label>
                    <input type="text" className="w-full px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent" placeholder="9 digits" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Account Number</label>
                    <input type="text" className="w-full px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Account number" />
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep("confirmation")}
                className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
              >
                Submit Payment
              </button>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === "confirmation" && (
            <div className="bg-card border border-success/30 rounded-lg p-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-6">
                Your payment of <strong className="text-foreground">${mockAccount.currentBalance.toFixed(2)}</strong> has been processed.
              </p>
              <div className="bg-secondary rounded-lg p-4 text-sm inline-block mb-6">
                <p className="text-muted-foreground">Confirmation Number</p>
                <p className="font-mono font-bold text-lg text-foreground">TXN-2026-114582</p>
              </div>
              <p className="text-xs text-muted-foreground mb-6">A confirmation email has been sent to your registered email address.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setStep("lookup")}
                  className="px-6 py-2 border rounded-md text-sm font-medium text-primary hover:bg-secondary transition-colors"
                >
                  Make Another Payment
                </button>
                <Link
                  to="/"
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Return Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default PayBillPage;
