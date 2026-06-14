const {
  PageShell,
  announce,
  useMemo,
  useState,
} = window.GovPortal;

function BenefitsPage() {
  const [form, setForm] = useState({ household: "", income: "", employment: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const results = useMemo(() => {
    if (!submitted) return [];
    const matches = [];
    if (form.income === "low" || form.household === "4+") matches.push({ name: "SNAP", note: "Food support for eligible households." });
    if (form.income !== "high" && form.employment !== "full-time") matches.push({ name: "Medicaid", note: "Health coverage support for eligible residents." });
    if (form.income !== "high") matches.push({ name: "Heating Assistance", note: "Seasonal utility support for qualifying households." });
    return matches;
  }, [form, submitted]);

  const onSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.household) nextErrors.household = "Select a household size.";
    if (!form.income) nextErrors.income = "Select an income range.";
    if (!form.employment) nextErrors.employment = "Select an employment status.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      announce("Benefits screener has errors. Review required fields.");
      setSubmitted(false);
      return;
    }
    const nextMatches = [];
    if (form.income === "low" || form.household === "4+") nextMatches.push("SNAP");
    if (form.income !== "high" && form.employment !== "full-time") nextMatches.push("Medicaid");
    if (form.income !== "high") nextMatches.push("Heating Assistance");
    setSubmitted(true);
    announce(`Benefits results updated. ${nextMatches.length} programs may match your household.`);
  };

  return (
    <PageShell
      currentPath="./benefits.html"
      eyebrow="Detailed service"
      title="Apply for benefits"
      description="Use the eligibility screener to see which core programs may fit your household, then start an application for the program you need."
      breadcrumbs={[
        { label: "Home", href: "./index.html" },
        { label: "Services", href: "./services.html" },
        { label: "Apply for Benefits" },
      ]}
      aside={
        <section className="rounded-[2rem] border border-pine-100 bg-white p-6 shadow-civic" aria-labelledby="benefits-tip-heading">
          <h2 id="benefits-tip-heading" className="text-lg font-semibold text-slate-950">Before you begin</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Gather your household count, income estimate, and employment status. The screener is informational and does not replace a full application.</p>
        </section>
      }
    >
      <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="screener-heading">
          <h2 id="screener-heading" className="text-2xl font-semibold text-slate-950">Benefit eligibility screener</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Complete all required fields to view likely qualifying programs.</p>
          <form className="mt-6 space-y-5" onSubmit={onSubmit}>
            <div>
              <label htmlFor="household" className="block text-sm font-semibold text-slate-900">Household size <span aria-hidden="true">*</span></label>
              <select
                id="household"
                value={form.household}
                onChange={(event) => setForm({ ...form, household: event.target.value })}
                aria-required="true"
                aria-describedby={errors.household ? "household-error" : undefined}
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="">Select household size</option>
                <option value="1">1 person</option>
                <option value="2-3">2 to 3 people</option>
                <option value="4+">4 or more people</option>
              </select>
              {errors.household ? <p id="household-error" className="mt-2 text-sm font-medium text-red-700">{errors.household}</p> : null}
            </div>
            <div>
              <label htmlFor="income" className="block text-sm font-semibold text-slate-900">Income range <span aria-hidden="true">*</span></label>
              <select
                id="income"
                value={form.income}
                onChange={(event) => setForm({ ...form, income: event.target.value })}
                aria-required="true"
                aria-describedby={errors.income ? "income-error" : undefined}
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="">Select income range</option>
                <option value="low">Below state median</option>
                <option value="mid">Near state median</option>
                <option value="high">Above state median</option>
              </select>
              {errors.income ? <p id="income-error" className="mt-2 text-sm font-medium text-red-700">{errors.income}</p> : null}
            </div>
            <div>
              <label htmlFor="employment" className="block text-sm font-semibold text-slate-900">Employment status <span aria-hidden="true">*</span></label>
              <select
                id="employment"
                value={form.employment}
                onChange={(event) => setForm({ ...form, employment: event.target.value })}
                aria-required="true"
                aria-describedby={errors.employment ? "employment-error" : undefined}
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="">Select employment status</option>
                <option value="full-time">Full-time employed</option>
                <option value="part-time">Part-time employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="retired">Retired</option>
              </select>
              {errors.employment ? <p id="employment-error" className="mt-2 text-sm font-medium text-red-700">{errors.employment}</p> : null}
            </div>
            <button type="submit" className="focus-ring rounded-full bg-pine-700 px-6 py-3 text-sm font-semibold text-white" aria-label="Check benefit eligibility results">
              Check eligibility results
            </button>
          </form>
          <div aria-live="polite" className="mt-4 text-sm font-medium text-pine-800">
            {submitted ? `Results updated. ${results.length} program options shown.` : "Results will appear after form submission."}
          </div>
        </article>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-2xl font-semibold text-slate-950">Screening results</h2>
          {!submitted ? (
            <p className="mt-4 text-sm leading-6 text-slate-600">Submit the screener to see likely program matches for your household.</p>
          ) : (
            <ul className="mt-6 space-y-4" aria-label="Qualifying benefits programs">
              {results.map((program) => (
                <li key={program.name} className="rounded-3xl border border-pine-100 bg-pine-50 p-5">
                  <article aria-labelledby={`${program.name}-heading`}>
                    <h3 id={`${program.name}-heading`} className="text-xl font-semibold text-slate-950">{program.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{program.note}</p>
                    <button type="button" className="focus-ring mt-4 rounded-full bg-pine-700 px-5 py-3 text-sm font-semibold text-white" aria-label={`Start application for ${program.name}`}>
                      Start Application
                    </button>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<BenefitsPage />);
