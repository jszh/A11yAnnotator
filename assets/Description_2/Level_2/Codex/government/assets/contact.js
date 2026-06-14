const {
  PageShell,
  announce,
  departmentDirectory,
  useState,
} = window.GovPortal;

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", feedback: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name) nextErrors.name = "Enter your name.";
    if (!form.email) nextErrors.email = "Enter your email address.";
    if (!form.feedback) nextErrors.feedback = "Enter your website improvement suggestion.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      announce("Feedback form contains errors. Review required fields.");
      setSubmitted(false);
      return;
    }
    setSubmitted(true);
    announce("Website feedback submitted successfully.");
  };

  return (
    <PageShell
      currentPath="./contact.html"
      eyebrow="Contact and support"
      title="Get help from the right department"
      description="Use live chat, department helplines, multilingual support, or the website feedback form to connect with Vermont resident services."
      breadcrumbs={[
        { label: "Home", href: "./index.html" },
        { label: "Contact" },
      ]}
      aside={
        <section className="rounded-[2rem] border border-pine-100 bg-white p-6 shadow-civic" aria-labelledby="language-support-heading">
          <h2 id="language-support-heading" className="text-lg font-semibold text-slate-950">Multilingual support</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Interpreter support is available in English, Spanish, and French for service applications and helpline calls.</p>
        </section>
      }
    >
      <section className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="chat-heading">
            <h2 id="chat-heading" className="text-2xl font-semibold text-slate-950">Live chat</h2>
            <div className="mt-4 rounded-[1.5rem] border border-pine-100 bg-pine-50 p-5">
              <p className="text-base font-semibold text-slate-950">Chat with a representative - Mon-Fri 8am-5pm</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Average wait time: less than 4 minutes.</p>
              <button type="button" className="focus-ring mt-4 rounded-full bg-pine-700 px-5 py-3 text-sm font-semibold text-white" aria-label="Start live chat with a representative">
                Start live chat
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="helpline-heading">
            <h2 id="helpline-heading" className="text-2xl font-semibold text-slate-950">Helpline numbers by department</h2>
            <ul className="mt-6 space-y-4" aria-label="Department helpline numbers">
              {departmentDirectory.map((department) => (
                <li key={department.name} className="rounded-3xl border border-pine-100 bg-pine-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-950">{department.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">{department.label}</p>
                  <p className="mt-2 text-sm font-semibold text-pine-800">{department.contact}</p>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="feedback-heading">
          <h2 id="feedback-heading" className="text-2xl font-semibold text-slate-950">Website feedback form</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Tell the portal team how we can improve clarity, navigation, or accessibility.</p>
          <form className="mt-6 space-y-5" onSubmit={onSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-900">Name <span aria-hidden="true">*</span></label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                aria-required="true"
                aria-describedby={errors.name ? "name-error" : undefined}
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
              {errors.name ? <p id="name-error" className="mt-2 text-sm font-medium text-red-700">{errors.name}</p> : null}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-900">Email <span aria-hidden="true">*</span></label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                aria-required="true"
                aria-describedby={errors.email ? "email-error" : undefined}
                className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
              {errors.email ? <p id="email-error" className="mt-2 text-sm font-medium text-red-700">{errors.email}</p> : null}
            </div>
            <div>
              <label htmlFor="feedback" className="block text-sm font-semibold text-slate-900">Improvement suggestion <span aria-hidden="true">*</span></label>
              <textarea
                id="feedback"
                value={form.feedback}
                onChange={(event) => setForm({ ...form, feedback: event.target.value })}
                aria-required="true"
                aria-describedby={errors.feedback ? "feedback-error" : undefined}
                className="focus-ring mt-2 min-h-[180px] w-full rounded-[1.5rem] border border-slate-300 px-4 py-3"
              />
              {errors.feedback ? <p id="feedback-error" className="mt-2 text-sm font-medium text-red-700">{errors.feedback}</p> : null}
            </div>
            <button type="submit" className="focus-ring rounded-full bg-pine-700 px-6 py-3 text-sm font-semibold text-white" aria-label="Submit website feedback">
              Submit website feedback
            </button>
          </form>
          <div aria-live="polite" className="mt-4 text-sm font-medium text-pine-800">
            {submitted ? "Feedback sent successfully. The web team will review your suggestion." : "Submission status will appear here."}
          </div>
        </article>
      </section>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ContactPage />);
