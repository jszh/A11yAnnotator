function ContactPage() {
  const { departments } = window.LakewoodPortalData;
  const [liveMessage, setLiveMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors = {};

    if (!formData.get("name")?.trim()) nextErrors.name = "Enter your name.";
    if (!formData.get("email")?.trim()) nextErrors.email = "Enter your email address.";
    if (!formData.get("department")) nextErrors.department = "Select a department.";
    if (!formData.get("message")?.trim()) nextErrors.message = "Enter a message for the department.";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      setSubmitted(true);
      setLiveMessage("Inquiry submitted successfully.");
    } else {
      setLiveMessage("Inquiry form errors are shown.");
    }
  };

  return (
    <PageLayout
      currentPage="contact"
      breadcrumbItems={[{ label: "Home", href: "./index.html" }, { label: "Contact" }]}
      liveMessage={liveMessage}
    >
      <section>
        <h1 className="text-4xl font-semibold text-slate-950">Contact the City</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Reach the right department, send an inquiry, or get directions to City Hall.
        </p>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="panel rounded-[2rem] border border-white/70 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Department Directory</h2>
          <ul className="mt-6 space-y-4">
            {departments.map((department) => (
              <li key={department.name} className="rounded-[1.5rem] bg-slate-50 p-4">
                <h3 className="text-lg font-semibold text-slate-900">{department.name}</h3>
                <p className="mt-2 text-sm text-slate-600">Phone: {department.phone}</p>
                <p className="mt-1 text-sm text-slate-600">Hours: {department.hours}</p>
              </li>
            ))}
          </ul>
        </aside>

        <section className="panel rounded-[2rem] border border-white/70 p-6 shadow-sm" aria-labelledby="inquiry-heading">
          <h2 id="inquiry-heading" className="text-2xl font-semibold text-slate-950">Inquiry Form</h2>
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit} noValidate>
            <label className="text-sm font-medium text-slate-800">
              Name *
              <input
                name="name"
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                aria-required="true"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "contact-name-error" : undefined}
              />
              {errors.name && <span id="contact-name-error" className="mt-2 block text-sm text-rose-700">{errors.name}</span>}
            </label>

            <label className="text-sm font-medium text-slate-800">
              Email *
              <input
                name="email"
                type="email"
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                aria-required="true"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "contact-email-error" : undefined}
              />
              {errors.email && <span id="contact-email-error" className="mt-2 block text-sm text-rose-700">{errors.email}</span>}
            </label>

            <label className="text-sm font-medium text-slate-800">
              Department *
              <select
                name="department"
                defaultValue=""
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                aria-required="true"
                aria-invalid={Boolean(errors.department)}
                aria-describedby={errors.department ? "contact-department-error" : undefined}
              >
                <option value="" disabled>Select a department</option>
                {departments.map((department) => (
                  <option key={department.name}>{department.name}</option>
                ))}
              </select>
              {errors.department && <span id="contact-department-error" className="mt-2 block text-sm text-rose-700">{errors.department}</span>}
            </label>

            <label className="text-sm font-medium text-slate-800">
              Message *
              <textarea
                name="message"
                rows="5"
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
                aria-required="true"
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "contact-message-error" : undefined}
              />
              {errors.message && <span id="contact-message-error" className="mt-2 block text-sm text-rose-700">{errors.message}</span>}
            </label>

            <button
              type="submit"
              className="focus-ring rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              aria-label="Submit contact inquiry"
            >
              Submit Inquiry
            </button>
          </form>

          {submitted && (
            <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              Your message has been routed to the selected department. Expect a reply within two business days.
            </div>
          )}
        </section>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        <section className="panel rounded-[2rem] border border-white/70 p-6 shadow-sm" aria-labelledby="map-heading">
          <h2 id="map-heading" className="text-2xl font-semibold text-slate-950">City Hall Location</h2>
          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-100 p-8 text-center">
            <p className="text-base font-medium text-slate-800">Embedded Map Placeholder</p>
            <p className="mt-2 text-sm text-slate-600">City Hall, 500 Civic Center Drive, Lakewood, WA 98499</p>
          </div>
          <a
            href="https://maps.google.com/?q=500+Civic+Center+Drive+Lakewood+WA+98499"
            className="focus-ring mt-4 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            aria-label="Open keyboard accessible map directions to Lakewood City Hall"
          >
            Open Directions
          </a>
        </section>

        <aside id="social-links" className="panel rounded-[2rem] border border-white/70 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Social Media</h2>
          <ul className="mt-6 space-y-3 text-sm text-slate-700">
            <li><a href="#" className="focus-ring rounded" aria-label="Visit City of Lakewood Facebook page">Facebook</a></li>
            <li><a href="#" className="focus-ring rounded" aria-label="Visit City of Lakewood X profile">X / Twitter</a></li>
            <li><a href="#" className="focus-ring rounded" aria-label="Visit City of Lakewood Instagram profile">Instagram</a></li>
          </ul>
        </aside>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ContactPage />);
