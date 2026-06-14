const {
  Modal,
  PageShell,
  announce,
  useRef,
  useState,
} = window.GovPortal;

function LicenseRenewalPage() {
  const [step, setStep] = useState(0);
  const [eligibility, setEligibility] = useState({ age: "", residency: "", current: "" });
  const [schedule, setSchedule] = useState({ date: "", time: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const headingsRef = [useRef(null), useRef(null), useRef(null)];

  const moveToStep = (nextStep) => {
    setStep(nextStep);
    window.setTimeout(() => {
      headingsRef[nextStep]?.current?.focus();
    }, 0);
  };

  const validateStepOne = () => {
    const nextErrors = {};
    if (!eligibility.age) nextErrors.age = "Select whether you are age 18 or older.";
    if (!eligibility.residency) nextErrors.residency = "Select whether your Vermont address is current.";
    if (!eligibility.current) nextErrors.current = "Select whether your license is valid or expired less than one year.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      announce("Eligibility form has errors. Review the highlighted fields.");
      return false;
    }
    announce("Eligibility confirmed. Moving to the document checklist.");
    return true;
  };

  const validateSchedule = () => {
    const nextErrors = {};
    if (!schedule.date) nextErrors.date = "Choose an appointment day.";
    if (!schedule.time) nextErrors.time = "Choose an appointment time.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      announce("Appointment selection has errors. Choose a date and time.");
      return false;
    }
    return true;
  };

  const feeRows = [
    { label: "Standard renewal fee", value: "$32.00" },
    { label: "Digital credential access", value: "$3.00" },
    { label: "Total due", value: "$35.00" },
  ];

  return (
    <PageShell
      currentPath="./license-renewal.html"
      eyebrow="Detailed service"
      title="Renew a driver's license"
      description="Check eligibility, prepare documents, and reserve a DMV appointment with clear confirmation before submission."
      breadcrumbs={[
        { label: "Home", href: "./index.html" },
        { label: "Services", href: "./services.html" },
        { label: "Driver's License Renewal" },
      ]}
      aside={
        <section className="rounded-[2rem] border border-pine-100 bg-white p-6 shadow-civic" aria-labelledby="fee-heading">
          <h2 id="fee-heading" className="text-lg font-semibold text-slate-950">Fee breakdown</h2>
          <ul className="mt-4 space-y-3" aria-label="Driver's license renewal fee breakdown">
            {feeRows.map((row) => (
              <li key={row.label} className="flex items-center justify-between text-sm text-slate-700">
                <span>{row.label}</span>
                <span className="font-semibold text-slate-950">{row.value}</span>
              </li>
            ))}
          </ul>
        </section>
      }
    >
      <section className="mt-10 rounded-[2rem] border border-pine-100 bg-white p-6 shadow-sm" aria-labelledby="wizard-heading">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 id="wizard-heading" className="text-2xl font-semibold text-slate-950">Renewal steps</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Progress moves in a logical reading order. Each step heading receives focus when advanced.</p>
          </div>
          <ol className="flex flex-wrap gap-2" aria-label="Driver's license renewal progress">
            {["Eligibility", "Documents", "Appointment"].map((label, index) => (
              <li key={label}>
                <span className={`rounded-full px-4 py-2 text-sm font-semibold ${step === index ? "bg-pine-700 text-white" : "bg-pine-50 text-pine-800"}`}>
                  {index + 1}. {label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          {step === 0 ? (
            <section aria-labelledby="step-one-heading">
              <h2 id="step-one-heading" ref={headingsRef[0]} tabIndex="-1" className="text-2xl font-semibold text-slate-950">Step 1. Eligibility checker</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Confirm the standard online renewal requirements.</p>
              <form className="mt-6 space-y-5">
                <div>
                  <label htmlFor="age" className="block text-sm font-semibold text-slate-900">Age requirement <span aria-hidden="true">*</span></label>
                  <select
                    id="age"
                    value={eligibility.age}
                    onChange={(event) => setEligibility({ ...eligibility, age: event.target.value })}
                    aria-required="true"
                    aria-describedby={errors.age ? "age-error" : undefined}
                    className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="">Select an option</option>
                    <option value="yes">I am age 18 or older</option>
                    <option value="no">I am under 18</option>
                  </select>
                  {errors.age ? <p id="age-error" className="mt-2 text-sm font-medium text-red-700">{errors.age}</p> : null}
                </div>
                <div>
                  <label htmlFor="residency" className="block text-sm font-semibold text-slate-900">Current Vermont address <span aria-hidden="true">*</span></label>
                  <select
                    id="residency"
                    value={eligibility.residency}
                    onChange={(event) => setEligibility({ ...eligibility, residency: event.target.value })}
                    aria-required="true"
                    aria-describedby={errors.residency ? "residency-error" : undefined}
                    className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="">Select an option</option>
                    <option value="yes">My address is current</option>
                    <option value="no">I need to update my address</option>
                  </select>
                  {errors.residency ? <p id="residency-error" className="mt-2 text-sm font-medium text-red-700">{errors.residency}</p> : null}
                </div>
                <div>
                  <label htmlFor="current" className="block text-sm font-semibold text-slate-900">License status <span aria-hidden="true">*</span></label>
                  <select
                    id="current"
                    value={eligibility.current}
                    onChange={(event) => setEligibility({ ...eligibility, current: event.target.value })}
                    aria-required="true"
                    aria-describedby={errors.current ? "current-error" : undefined}
                    className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="">Select an option</option>
                    <option value="yes">Valid or expired less than one year</option>
                    <option value="no">Expired more than one year</option>
                  </select>
                  {errors.current ? <p id="current-error" className="mt-2 text-sm font-medium text-red-700">{errors.current}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStepOne()) moveToStep(1);
                  }}
                  className="focus-ring rounded-full bg-pine-700 px-6 py-3 text-sm font-semibold text-white"
                  aria-label="Continue to required documents"
                >
                  Continue to required documents
                </button>
              </form>
            </section>
          ) : null}

          {step === 1 ? (
            <section aria-labelledby="step-two-heading">
              <h2 id="step-two-heading" ref={headingsRef[1]} tabIndex="-1" className="text-2xl font-semibold text-slate-950">Step 2. Required documents checklist</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Bring or prepare the documents below before you confirm an appointment.</p>
              <ul className="mt-6 space-y-3" aria-label="Required documents checklist">
                {[
                  "Current driver's license or permit number",
                  "Two proofs of Vermont residency",
                  "Payment card for the $35 renewal fee",
                  "Corrective lens documentation if your status changed",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-3xl border border-pine-100 bg-pine-50 px-4 py-4">
                    <input type="checkbox" className="focus-ring mt-1 h-4 w-4 rounded border-slate-300" aria-label={item} />
                    <span className="text-sm leading-6 text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => moveToStep(0)} className="focus-ring rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700" aria-label="Go back to eligibility checker">
                  Back
                </button>
                <button type="button" onClick={() => moveToStep(2)} className="focus-ring rounded-full bg-pine-700 px-5 py-3 text-sm font-semibold text-white" aria-label="Continue to appointment scheduler">
                  Continue to appointment scheduler
                </button>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section aria-labelledby="step-three-heading">
              <h2 id="step-three-heading" ref={headingsRef[2]} tabIndex="-1" className="text-2xl font-semibold text-slate-950">Step 3. Appointment scheduler</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Select an in-person DMV timeslot. A keyboard-accessible list is provided instead of a pointer-only calendar.</p>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <fieldset>
                  <legend className="text-sm font-semibold text-slate-900">Choose a day <span aria-hidden="true">*</span></legend>
                  <div className="mt-3 grid gap-3">
                    {["Monday, April 8", "Wednesday, April 10", "Friday, April 12"].map((date) => (
                      <label key={date} className={`focus-within:ring-2 focus-within:ring-blue-600 flex cursor-pointer items-center justify-between rounded-3xl border px-4 py-4 ${schedule.date === date ? "border-pine-700 bg-pine-50" : "border-slate-200 bg-white"}`}>
                        <span className="text-sm font-medium text-slate-800">{date}</span>
                        <input
                          type="radio"
                          name="appointment-date"
                          value={date}
                          checked={schedule.date === date}
                          onChange={(event) => setSchedule({ ...schedule, date: event.target.value })}
                          aria-required="true"
                          aria-describedby={errors.date ? "date-error" : undefined}
                        />
                      </label>
                    ))}
                  </div>
                  {errors.date ? <p id="date-error" className="mt-2 text-sm font-medium text-red-700">{errors.date}</p> : null}
                </fieldset>
                <fieldset>
                  <legend className="text-sm font-semibold text-slate-900">Choose a time <span aria-hidden="true">*</span></legend>
                  <div className="mt-3 grid gap-3">
                    {["9:00 AM", "11:30 AM", "2:15 PM"].map((time) => (
                      <label key={time} className={`focus-within:ring-2 focus-within:ring-blue-600 flex cursor-pointer items-center justify-between rounded-3xl border px-4 py-4 ${schedule.time === time ? "border-pine-700 bg-pine-50" : "border-slate-200 bg-white"}`}>
                        <span className="text-sm font-medium text-slate-800">{time}</span>
                        <input
                          type="radio"
                          name="appointment-time"
                          value={time}
                          checked={schedule.time === time}
                          onChange={(event) => setSchedule({ ...schedule, time: event.target.value })}
                          aria-required="true"
                          aria-describedby={errors.time ? "time-error" : undefined}
                        />
                      </label>
                    ))}
                  </div>
                  {errors.time ? <p id="time-error" className="mt-2 text-sm font-medium text-red-700">{errors.time}</p> : null}
                </fieldset>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => moveToStep(1)} className="focus-ring rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700" aria-label="Go back to required documents">
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!validateSchedule()) return;
                    setSubmitted(true);
                    setModalOpen(true);
                    announce(`Appointment scheduled for ${schedule.date} at ${schedule.time}.`);
                  }}
                  className="focus-ring rounded-full bg-pine-700 px-5 py-3 text-sm font-semibold text-white"
                  aria-label="Submit license renewal appointment"
                >
                  Submit renewal appointment
                </button>
              </div>
              <div aria-live="polite" className="mt-4 text-sm font-medium text-pine-800">
                {submitted ? `Confirmation email summary ready for ${schedule.date} at ${schedule.time}.` : "No appointment selected yet."}
              </div>
            </section>
          ) : null}
        </article>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="confirmation-heading">
            <h2 id="confirmation-heading" className="text-xl font-semibold text-slate-950">Confirmation email summary</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">After you submit, the portal sends a summary with the appointment time, office location, and fee due.</p>
            <div className="mt-4 rounded-3xl bg-pine-50 p-4 text-sm leading-6 text-slate-700">
              <p><strong>Subject:</strong> Vermont DMV renewal appointment confirmation</p>
              <p className="mt-2"><strong>Includes:</strong> appointment date and time, Burlington DMV office details, and a reminder to bring residency documents.</p>
            </div>
          </section>
        </aside>
      </section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Renewal appointment confirmed"
        description="This confirmation dialog traps focus and returns focus to the submit button when closed."
      >
        <div className="space-y-4 text-sm leading-7 text-slate-700">
          <p>Your driver's license renewal appointment is reserved for <strong>{schedule.date}</strong> at <strong>{schedule.time}</strong>.</p>
          <p>Confirmation email summary: Bring your current license, two proofs of residency, and payment for the <strong>$35</strong> total fee.</p>
          <button type="button" onClick={() => setModalOpen(false)} className="focus-ring rounded-full bg-pine-700 px-5 py-3 font-semibold text-white" aria-label="Close renewal appointment confirmation">
            Return to renewal page
          </button>
        </div>
      </Modal>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<LicenseRenewalPage />);
