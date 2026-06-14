function PaymentModal({ isOpen, onClose, triggerRef, status, amount }) {
  const modalRef = useRef(null);
  useFocusTrap(isOpen, modalRef, onClose, triggerRef);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-20">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-confirmation-heading"
        className="panel w-full max-w-xl rounded-[2rem] border border-white/70 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="payment-confirmation-heading" className="text-2xl font-semibold text-slate-950">Payment Confirmation</h2>
            <p className="mt-2 text-sm text-slate-600">
              {status === "processing" ? "Processing your payment securely." : `Payment received for ${amount}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            aria-label="Close payment confirmation dialog"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function PayBillPage() {
  const [liveMessage, setLiveMessage] = useState("");
  const [accountFound, setAccountFound] = useState(false);
  const [processingState, setProcessingState] = useState("idle");
  const [method, setMethod] = useState("credit");
  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const confirmationTriggerRef = useRef(null);
  const confirmationHeadingRef = useRef(null);

  const balance = "$142.76";

  const lookupAccount = (event) => {
    event.preventDefault();
    setAccountFound(true);
    setLiveMessage("Account found. Current utility balance is 142 dollars and 76 cents.");
  };

  const submitPayment = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = {};

    if (!formData.get("paymentAmount")?.trim()) nextErrors.paymentAmount = "Enter a payment amount.";
    if (!formData.get("accountHolder")?.trim()) nextErrors.accountHolder = "Enter the account holder name.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setLiveMessage("Payment form errors are shown.");
      return;
    }

    setProcessingState("processing");
    setShowModal(true);
    setLiveMessage("Payment processing started.");

    window.setTimeout(() => {
      setProcessingState("success");
      setLiveMessage("Payment completed successfully.");
      window.requestAnimationFrame(() => {
        if (confirmationHeadingRef.current) {
          confirmationHeadingRef.current.focus();
        }
      });
    }, 900);
  };

  return (
    <PageLayout
      currentPage="services"
      breadcrumbItems={[
        { label: "Home", href: "./index.html" },
        { label: "Services", href: "./services.html" },
        { label: "Pay a Bill" }
      ]}
      liveMessage={liveMessage}
    >
      <section>
        <h1 className="text-4xl font-semibold text-slate-950">Pay a Utility Bill</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Look up your account, review the current balance, choose a payment method, and confirm the transaction online.
        </p>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="panel rounded-[2rem] border border-white/70 p-6 shadow-sm" aria-labelledby="lookup-heading">
          <h2 id="lookup-heading" className="text-2xl font-semibold text-slate-950">Account Lookup</h2>
          <form className="mt-6 space-y-4" onSubmit={lookupAccount}>
            <label className="block text-sm font-medium text-slate-800">
              Utility Account Number
              <input
                name="accountNumber"
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                aria-label="Enter utility account number"
              />
            </label>
            <button
              type="submit"
              className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              aria-label="Look up utility account balance"
            >
              Look Up Account
            </button>
          </form>

          {accountFound && (
            <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-900">Current Balance</h3>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{balance}</p>
            </div>
          )}
        </section>

        <section className="panel rounded-[2rem] border border-white/70 p-6 shadow-sm" aria-labelledby="payment-flow-heading">
          <h2 id="payment-flow-heading" className="text-2xl font-semibold text-slate-950">Payment Flow</h2>
          <p
            ref={confirmationHeadingRef}
            tabIndex="-1"
            className="mt-3 text-sm leading-6 text-slate-600"
            aria-live="polite"
            aria-busy={processingState === "processing"}
          >
            {processingState === "processing"
              ? "Processing payment."
              : processingState === "success"
                ? "Payment complete."
                : "Enter payment details to continue."}
          </p>

          <form className="mt-6 grid gap-4" onSubmit={submitPayment} noValidate>
            <label className="text-sm font-medium text-slate-800">
              Payment Amount *
              <input
                name="paymentAmount"
                defaultValue={balance}
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                aria-required="true"
                aria-invalid={Boolean(errors.paymentAmount)}
                aria-describedby={errors.paymentAmount ? "payment-amount-error" : undefined}
              />
              {errors.paymentAmount && <span id="payment-amount-error" className="mt-2 block text-sm text-rose-700">{errors.paymentAmount}</span>}
            </label>

            <fieldset>
              <legend className="text-sm font-medium text-slate-800">Payment Method</legend>
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm">
                  <input type="radio" name="paymentMethod" checked={method === "credit"} onChange={() => setMethod("credit")} />
                  <span>Credit Card</span>
                </label>
                <label className="flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm">
                  <input type="radio" name="paymentMethod" checked={method === "bank"} onChange={() => setMethod("bank")} />
                  <span>Bank Transfer</span>
                </label>
              </div>
            </fieldset>

            <label className="text-sm font-medium text-slate-800">
              Account Holder Name *
              <input
                name="accountHolder"
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                aria-required="true"
                aria-invalid={Boolean(errors.accountHolder)}
                aria-describedby={errors.accountHolder ? "account-holder-error" : undefined}
              />
              {errors.accountHolder && <span id="account-holder-error" className="mt-2 block text-sm text-rose-700">{errors.accountHolder}</span>}
            </label>

            <button
              ref={confirmationTriggerRef}
              type="submit"
              className="focus-ring rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              aria-label="Submit utility bill payment"
            >
              Submit Payment
            </button>
          </form>
        </section>
      </section>

      <section className="mt-10 panel rounded-[2rem] border border-white/70 p-6 shadow-sm" aria-labelledby="payment-confirmation-screen-heading">
        <h2 id="payment-confirmation-screen-heading" className="text-2xl font-semibold text-slate-950">Payment Confirmation Screen</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          When payment succeeds, residents receive a receipt number, posted date, and confirmation email notice.
        </p>
      </section>

      <PaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        triggerRef={confirmationTriggerRef}
        status={processingState}
        amount={balance}
      />
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<PayBillPage />);
