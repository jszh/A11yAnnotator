const {
  PageShell,
  departmentDirectory,
} = window.GovPortal;

function AboutPage() {
  return (
    <PageShell
      currentPath="./about.html"
      eyebrow="About the portal"
      title="How Vermont organizes digital resident services"
      description="Learn how state agencies contribute to this portal, review open data and transparency resources, and access accessibility commitments."
      breadcrumbs={[
        { label: "Home", href: "./index.html" },
        { label: "About" },
      ]}
      aside={
        <section className="rounded-[2rem] border border-pine-100 bg-white p-6 shadow-civic" aria-labelledby="compliance-heading">
          <h2 id="compliance-heading" className="text-lg font-semibold text-slate-950">Accessibility compliance</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">This mock portal follows semantic landmarks, descriptive names, visible focus states, live region announcements, and keyboard-accessible controls.</p>
        </section>
      }
    >
      <section className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80"
            alt="Portrait of the governor welcoming residents to the online portal"
            className="h-full max-h-[420px] w-full rounded-[1.5rem] object-cover"
          />
        </aside>
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="welcome-heading">
          <h2 id="welcome-heading" className="text-3xl font-semibold text-slate-950">Governor's welcome</h2>
          <p className="mt-4 text-base leading-8 text-slate-600">Welcome to the State of Vermont's resident services portal. Our goal is straightforward: make essential public services easier to find, easier to understand, and easier to complete online. This platform brings together agencies that serve families, students, workers, and seniors so residents spend less time searching and more time getting help.</p>
        </article>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="directory-heading">
          <h2 id="directory-heading" className="text-2xl font-semibold text-slate-950">State agency directory</h2>
          <ul className="mt-6 space-y-4" aria-label="State agency directory">
            {departmentDirectory.map((item) => (
              <li key={item.name} className="rounded-3xl border border-pine-100 bg-pine-50 p-4">
                <h3 className="text-lg font-semibold text-slate-950">{item.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-pine-800">{item.contact}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="data-heading">
          <h2 id="data-heading" className="text-2xl font-semibold text-slate-950">Open data and transparency reports</h2>
          <ul className="mt-6 space-y-4" aria-label="Open data and transparency reports">
            {[
              "Quarterly portal usage dashboard",
              "Agency response time report",
              "Open data catalog for health, education, and workforce services",
            ].map((item) => (
              <li key={item} className="rounded-3xl border border-slate-200 px-4 py-4 text-sm text-slate-700">{item}</li>
            ))}
          </ul>
          <h3 className="mt-8 text-xl font-semibold text-slate-950">Legislative news</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">Recent legislative updates include digital service modernization funding, multilingual support expansion, and resident privacy safeguards for online applications.</p>
        </article>
      </section>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AboutPage />);
