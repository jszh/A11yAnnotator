function PermitsPage() {
  const [liveMessage, setLiveMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [statusStep, setStatusStep] = useState("submitted");
  const statusHeadingRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = {};

    if (!formData.get("name")?.trim()) nextErrors.name = "Enter the applicant name.";
    if (!formData.get("projectType")) nextErrors.projectType = "Select a project type.";
    if (!formData.get("address")?.trim()) nextErrors.address = "Enter the project address.";
    if (!formData.get("documents")?.name) nextErrors.documents = "Upload at least one supporting document.";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      setSubmitted(true);
      setLiveMessage("Permit application submitted successfully.");
      window.requestAnimationFrame(() => {
        if (statusHeadingRef.current) {
          statusHeadingRef.current.focus();
        }
      });
    }
  };

  const advanceStatus = () => {
    const order = ["submitted", "review", "inspection", "approved"];
    const currentIndex = order.indexOf(statusStep);
    const nextStep = order[Math.min(currentIndex + 1, order.length - 1)];
    setStatusStep(nextStep);
    setLiveMessage(`Application status updated to ${nextStep}.`);
  };

  const labels = {
    submitted: "Application Submitted",
    review: "Under Staff Review",
    inspection: "Inspection Scheduled",
    approved: "Approved"
  };

  return (
    <PageLayout
      currentPage="services"
      breadcrumbItems={[
        { label: "Home", href: "./index.html" },
        { label: "Services", href: "./services.html" },
        { label: "Permits & Licenses" }
      ]}
      liveMessage={liveMessage}
    >
      <section>
        <h1 className="text-4xl font-semibold text-slate-950">Permits & Licenses</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Apply for city permits online and monitor the progress of current applications from one page.
        </p>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel rounded-[2rem] border border-white/70 p-6 shadow-sm" aria-labelledby="permit-form-heading">
          <h2 id="permit-form-heading" className="text-2xl font-semibold text-slate-950">Online Permit Application</h2>
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit} noValidate>
            <label className="text-sm font-medium text-slate-800">
              Applicant Name *
              <input
                name="name"
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                aria-required="true"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "permit-name-error" : undefined}
              />
              {errors.name && <span id="permit-name-error" className="mt-2 block text-sm text-rose-700">{errors.name}</span>}
            </label>

            <label className="text-sm font-medium text-slate-800">
              Project Type *
              <select
                name="projectType"
                defaultValue=""
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                aria-required="true"
                aria-invalid={Boolean(errors.projectType)}
                aria-describedby={errors.projectType ? "project-type-error" : undefined}
              >
                <option value="" disabled>Select a permit type</option>
                <option>Building Permit</option>
                <option>Electrical Permit</option>
                <option>Special Event Permit</option>
                <option>Business License</option>
              </select>
              {errors.projectType && <span id="project-type-error" className="mt-2 block text-sm text-rose-700">{errors.projectType}</span>}
            </label>

            <label className="text-sm font-medium text-slate-800">
              Project Address *
              <input
                name="address"
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                aria-required="true"
                aria-invalid={Boolean(errors.address)}
                aria-describedby={errors.address ? "permit-address-error" : undefined}
              />
              {errors.address && <span id="permit-address-error" className="mt-2 block text-sm text-rose-700">{errors.address}</span>}
            </label>

            <label className="text-sm font-medium text-slate-800">
              Upload Supporting Documents *
              <input
                type="file"
                name="documents"
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                aria-required="true"
                aria-invalid={Boolean(errors.documents)}
                aria-describedby={errors.documents ? "permit-documents-error" : "permit-documents-help"}
              />
              <span id="permit-documents-help" className="mt-2 block text-sm text-slate-500">Accepted formats: PDF, JPG, PNG.</span>
              {errors.documents && <span id="permit-documents-error" className="mt-2 block text-sm text-rose-700">{errors.documents}</span>}
            </label>

            <button
              type="submit"
              className="focus-ring mt-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              aria-label="Submit Permit Application"
            >
              Submit Permit Application
            </button>
          </form>

          {submitted && (
            <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              Your permit application has been received. A confirmation email will be sent within one business day.
            </div>
          )}
        </section>

        <aside className="panel rounded-[2rem] border border-white/70 p-6 shadow-sm" aria-labelledby="tracker-heading">
          <h2
            id="tracker-heading"
            ref={statusHeadingRef}
            tabIndex="-1"
            className="text-2xl font-semibold text-slate-950"
          >
            Existing Application Status
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Current sample status: <strong>{labels[statusStep]}</strong>
          </p>
          <ol className="mt-6 space-y-3" aria-live="polite">
            {Object.entries(labels).map(([key, label]) => (
              <li
                key={key}
                className={`rounded-[1.5rem] p-4 text-sm ${statusStep === key ? "bg-blue-50 text-blue-950 ring-1 ring-blue-200" : "bg-slate-50 text-slate-600"}`}
              >
                {label}
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={advanceStatus}
            className="focus-ring mt-6 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            aria-label="Advance application status tracker"
          >
            Advance Sample Status
          </button>
        </aside>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<PermitsPage />);
