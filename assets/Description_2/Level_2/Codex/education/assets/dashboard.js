const { html, PageShell, dashboardData, TabGroup, ProgressTag, announce } = window.SkillForge;

function DashboardPage() {
  const tabs = [
    {
      label: "In Progress",
      content: html`
        <section aria-labelledby="in-progress-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <h2 id="in-progress-heading" className="text-3xl font-semibold text-slate-950">Your Program: Medical Admin Certificate — Week 3 of 8</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Projected completion: April 18. Stay on pace by attending the next live session and submitting your billing worksheet.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <${ProgressTag} value="43% complete" label="Program progress 43 percent" />
            <a href="./classroom.html" className="focus-ring rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Join classroom</a>
          </div>
        </section>
      `,
    },
    {
      label: "Recommended",
      content: html`
        <section aria-labelledby="recommended-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <h2 id="recommended-heading" className="text-3xl font-semibold text-slate-950">Recommended next steps</h2>
          <ul className="mt-5 space-y-3 text-sm text-slate-700">
            ${dashboardData.recommendations.map((item) => html`<li key=${item} className="rounded-2xl bg-slate-50 px-4 py-4">${item}</li>`)}
          </ul>
        </section>
      `,
    },
    {
      label: "Achievements",
      content: html`
        <section aria-labelledby="achievements-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <h2 id="achievements-heading" className="text-3xl font-semibold text-slate-950">Achievements</h2>
          <ul className="mt-5 space-y-3 text-sm text-slate-700">
            ${dashboardData.achievements.map((item) => html`<li key=${item} className="badge-pulse rounded-2xl bg-emerald-50 px-4 py-4">${item}</li>`)}
          </ul>
        </section>
      `,
    },
  ];

  return html`
    <${PageShell}
      eyebrow="Learner dashboard"
      title="A structured home base for your weekly progress, cohort activity, and next actions"
      description="Review your in-progress program, upcoming live session, due dates, cohort connections, and certificate timeline in a meaningful reading order."
    >
      <section aria-labelledby="greeting-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="greeting-heading" className="text-3xl font-semibold text-slate-950">Welcome back, Camille</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Your Program: Medical Admin Certificate — Week 3 of 8</p>
          </div>
          <a href="./classroom.html" className="focus-ring rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Join next session</a>
        </div>
      </section>

      <div className="mt-8 space-y-8">
        <section aria-labelledby="tab-overview-heading">
          <h2 id="tab-overview-heading" className="sr-only">Dashboard tabs</h2>
          <${TabGroup} tabs=${tabs} label="dashboard sections" />
        </section>

        <section aria-labelledby="session-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 id="session-heading" className="text-3xl font-semibold text-slate-950">Upcoming live session reminder</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Thursday, March 14 at 7:00 PM ET · Claims status workflows lab</p>
            </div>
            <a href="./classroom.html" className="focus-ring rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Join link</a>
          </div>
        </section>

        <section aria-labelledby="calendar-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <h2 id="calendar-heading" className="text-3xl font-semibold text-slate-950">Assignment due dates</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            ${dashboardData.dueDates.map((item) => html`
              <article key=${item.day} className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-3xl font-semibold text-blue-700">${item.day}</p>
                <p className="mt-2 text-sm font-medium text-slate-700">${item.label}</p>
              </article>
            `)}
          </div>
        </section>

        <section aria-labelledby="cohort-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 id="cohort-heading" className="text-3xl font-semibold text-slate-950">Peer cohort members</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Stay visible to your accountability circle and reach out before the next office hour.</p>
            </div>
            <button type="button" className="focus-ring rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick=${() => announce("Office hours booking opened.")}>Book instructor office hours</button>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            ${dashboardData.cohort.map((name) => html`
              <div key=${name} className="flex items-center gap-3 rounded-full bg-slate-50 px-4 py-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-800">${name.charAt(0)}</span>
                <span className="text-sm font-medium text-slate-700">${name}</span>
              </div>
            `)}
          </div>
        </section>

        <section aria-labelledby="certificate-heading" className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <h2 id="certificate-heading" className="text-3xl font-semibold text-slate-950">Certificate preview</h2>
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-blue-300 bg-blue-50 p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">Projected completion: April 18</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950">Medical Administrative Assistant Certificate</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">Complete the remaining five weeks to unlock your final certificate and placement portfolio review.</p>
          </div>
        </section>
      </div>
    <//>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${DashboardPage} />`);
