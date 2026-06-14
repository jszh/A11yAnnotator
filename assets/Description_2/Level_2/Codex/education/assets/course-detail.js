const { useState } = React;
const {
  html,
  PageShell,
  courseDetail,
  announce,
  Modal,
  CurriculumAccordion,
  AccreditationBadge,
} = window.SkillForge;

function CourseDetailPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState({});

  const submitEnrollment = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = "Enter your full name to reserve a seat.";
    if (!formData.email.trim()) nextErrors.email = "Enter your email so we can send your cohort access details.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setIsOpen(false);
    const message = "Enrollment confirmed for Medical Administrative Assistant Certificate.";
    setConfirmation(message);
    announce(message);
  };

  return html`
    <${PageShell}
      eyebrow="Featured certificate"
      title=${`${courseDetail.title} — 8 weeks · Cohort · $349`}
      description="See the weekly structure, instructor credentials, financing options, and job placement outcomes before you enroll."
    >
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <img src=${courseDetail.image} alt="Instructor-led medical administration cohort in a collaborative classroom" className="h-72 w-full object-cover" />
            <div className="space-y-5 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-800">${courseDetail.format}</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-900" aria-label="Certificate credential badge">${courseDetail.credential}</span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-900">Next start ${courseDetail.nextStart}</span>
              </div>
              <h2 className="text-2xl font-semibold text-slate-950">What you will learn</h2>
              <ul className="space-y-3">
                ${courseDetail.outcomes.map((outcome) => html`
                  <li key=${outcome} className="flex gap-3 text-sm leading-6 text-slate-600">
                    <span className="mt-1 text-blue-700" aria-hidden="true">•</span>
                    <span>${outcome}</span>
                  </li>
                `)}
              </ul>
            </div>
          </section>

          <section aria-labelledby="curriculum-heading">
            <h2 id="curriculum-heading" className="text-3xl font-semibold text-slate-950">Curriculum</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Each module combines live teaching, guided practice, and practical tasks modeled on clinic workflows.</p>
            <div className="mt-6">
              <${CurriculumAccordion} sections=${courseDetail.schedule} />
            </div>
          </section>

          <section aria-labelledby="instructor-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 id="instructor-heading" className="text-3xl font-semibold text-slate-950">Instructor profile</h2>
            <div className="mt-5 grid gap-6 md:grid-cols-[0.3fr_0.7fr]">
              <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80" alt="Portrait of Dr. Lena Ortiz" className="h-44 w-full rounded-[1.5rem] object-cover" />
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Dr. Lena Ortiz, RHIA</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Former ambulatory care operations lead with 14 years of experience in health information administration, patient access systems, and frontline training.</p>
                <p className="mt-3 text-sm font-medium text-slate-500">Credentials: RHIA, Lean Healthcare Foundations, former Epic implementation trainer</p>
              </div>
            </div>
          </section>

          <section id="qa-sessions" aria-labelledby="qa-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 id="qa-heading" className="text-3xl font-semibold text-slate-950">Live Q&A session schedule</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              ${courseDetail.qaSessions.map((session) => html`
                <li key=${session} className="rounded-3xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">${session}</li>
              `)}
            </ul>
          </section>
        </div>

        <aside className="floating-progress lg:sticky lg:self-start">
          <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Enrollment snapshot</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">${courseDetail.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">8 weeks · Cohort · $349</p>
            </div>
            <dl className="grid grid-cols-2 gap-4 rounded-[1.5rem] bg-slate-50 p-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-950">Outcome</dt>
                <dd className="mt-1 text-slate-600">92% job placement within 3 months</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-950">Schedule</dt>
                <dd className="mt-1 text-slate-600">2 live sessions weekly</dd>
              </div>
            </dl>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Required materials</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                ${courseDetail.materials.map((item) => html`<li key=${item}>${item}</li>`)}
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Financing options</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>Payment plan: $117 monthly for 3 months</li>
                <li>Employer reimbursement documentation included</li>
                <li>Scholarship review available through partner non-profits</li>
              </ul>
            </div>
            <button type="button" className="focus-ring w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick=${() => setIsOpen(true)}>Enroll Now</button>
            <a href="./pricing.html" className="focus-ring inline-flex w-full justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">View plans and aid</a>
            <div className="grid gap-3">
              <${AccreditationBadge} label="ACE-ready coursework" />
              <${AccreditationBadge} label="Employer advisory reviewed" />
            </div>
          </div>
        </aside>
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">${confirmation}</div>

      <${Modal}
        open=${isOpen}
        onClose=${() => setIsOpen(false)}
        title="Reserve your seat"
        description="Submit your details to hold one of the remaining seats in the March 3 cohort."
      >
        <form className="space-y-4" onSubmit=${submitEnrollment} noValidate>
          <div>
            <label htmlFor="enroll-name" className="text-sm font-semibold text-slate-950">Full name</label>
            <input
              id="enroll-name"
              type="text"
              value=${formData.name}
              aria-required="true"
              aria-describedby=${errors.name ? "enroll-name-error" : undefined}
              onInput=${(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
              className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
            ${errors.name ? html`<p id="enroll-name-error" className="mt-2 text-sm text-red-700">${errors.name}</p>` : null}
          </div>
          <div>
            <label htmlFor="enroll-email" className="text-sm font-semibold text-slate-950">Email</label>
            <input
              id="enroll-email"
              type="email"
              value=${formData.email}
              aria-required="true"
              aria-describedby=${errors.email ? "enroll-email-error" : undefined}
              onInput=${(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
              className="focus-ring mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
            ${errors.email ? html`<p id="enroll-email-error" className="mt-2 text-sm text-red-700">${errors.email}</p>` : null}
          </div>
          <button type="submit" className="focus-ring rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Confirm enrollment</button>
        </form>
      <//>
    <//>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${CourseDetailPage} />`);
