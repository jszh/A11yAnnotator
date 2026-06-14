const { useState } = React;
const { html, PageShell, AccreditationBadge, announce } = window.SkillForge;

function PricingPage() {
  const [income, setIncome] = useState(349);
  const estimate = Math.max(29, Math.round(income / 3));

  return html`
    <${PageShell}
      eyebrow="Tuition and support"
      title="Flexible enrollment plans for individuals, employers, and public partners"
      description="Compare pricing tracks, estimate monthly payments, and access scholarships, reimbursement support, and accredited learning signals in one place."
    >
      <section className="grid gap-6 lg:grid-cols-3">
        ${[
          {
            name: "Individual enrollment",
            price: "$349-$465",
            detail: "Best for career changers paying directly or using payment plans.",
          },
          {
            name: "Employer sponsorship",
            price: "Custom cohort pricing",
            detail: "Manager dashboards, seat allocation, reporting, and reimbursement docs.",
          },
          {
            name: "Non-profit / Government",
            price: "Reduced-seat agreements",
            detail: "Workforce grants, scholarship coordination, and case management support.",
          },
        ].map((plan) => html`
          <article key=${plan.name} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">${plan.name}</h2>
            <p className="mt-3 text-3xl font-semibold text-blue-700">${plan.price}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">${plan.detail}</p>
            <a href="./course-detail.html" className="focus-ring mt-5 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Start Learning</a>
          </article>
        `)}
      </section>

      <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <h2 className="text-3xl font-semibold text-slate-950">Financing calculator</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Estimate a monthly plan for the featured medical administration cohort.</p>
          <label htmlFor="tuition-range" className="mt-6 block text-sm font-semibold text-slate-950">Program tuition</label>
          <input
            id="tuition-range"
            type="range"
            min="0"
            max="900"
            step="25"
            value=${income}
            onInput=${(event) => setIncome(Number(event.target.value))}
            className="focus-ring mt-3 w-full"
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Selected tuition</p>
              <p className="mt-2 text-2xl font-semibold text-blue-700">${income === 0 ? "Free" : `$${income}`}</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white">
              <p className="text-sm font-semibold">Estimated monthly payment</p>
              <p className="mt-2 text-2xl font-semibold">$${estimate}/mo</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="focus-ring rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick=${() => announce("Advisor chat opened.")}>Talk to an Advisor</button>
            <a href="./pricing.html" className="focus-ring rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Scholarship application</a>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <h2 className="text-3xl font-semibold text-slate-950">Accreditation and funding trust signals</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <${AccreditationBadge} label="Continuing education aligned" />
            <${AccreditationBadge} label="Workforce board partner" />
            <${AccreditationBadge} label="Employer reporting ready" />
            <${AccreditationBadge} label="Career coaching included" />
          </div>
          <div className="mt-8 rounded-[1.5rem] bg-blue-50 p-5">
            <h3 className="text-xl font-semibold text-slate-950">Scholarship and reimbursement support</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">Upload employer tuition policies, WIOA paperwork, or non-profit sponsorship documents and SkillForge advisors will map the right funding path before your cohort start date.</p>
          </div>
        </div>
      </section>
    <//>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${PricingPage} />`);
