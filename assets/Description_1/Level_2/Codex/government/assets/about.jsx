function AboutPage() {
  const { leaders } = window.LakewoodPortalData;

  return (
    <PageLayout
      currentPage="about"
      breadcrumbItems={[{ label: "Home", href: "./index.html" }, { label: "About" }]}
      liveMessage=""
    >
      <section className="hero-panel rounded-[2rem] p-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-200">About Lakewood</p>
        <h1 className="mt-4 text-4xl font-semibold">Serving a growing city of 160,000 residents</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-100">
          Lakewood combines strong neighborhood services, resilient infrastructure, and transparent local government.
        </p>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <article className="panel rounded-[2rem] border border-white/70 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">City History</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Lakewood was incorporated in 1954 and has grown from a postwar residential community into a regional center for public parks, local business, and multimodal transportation.
          </p>
          <h2 className="mt-8 text-2xl font-semibold text-slate-950">Mission Statement</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            The City of Lakewood delivers reliable services, supports safe neighborhoods, and makes civic participation simple, clear, and accessible.
          </p>
          <a
            href="#annual-report"
            className="focus-ring mt-8 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            aria-label="Download the annual report"
          >
            Download Annual Report
          </a>
        </article>

        <section className="panel rounded-[2rem] border border-white/70 p-6 shadow-sm" aria-labelledby="leadership-heading">
          <h2 id="leadership-heading" className="text-2xl font-semibold text-slate-950">Leadership Team</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {leaders.map((leader) => (
              <article key={leader.name} className="rounded-[1.5rem] bg-slate-50 p-4">
                <img src={leader.image} alt={`${leader.name}, ${leader.title}`} className="leader-image w-full rounded-[1.25rem]" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{leader.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{leader.title}</p>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section id="annual-report" className="mt-12 panel rounded-[2rem] border border-white/70 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">Annual Report</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Fiscal priorities, performance highlights, infrastructure projects, and community outcomes are summarized in the current annual report.
        </p>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AboutPage />);
