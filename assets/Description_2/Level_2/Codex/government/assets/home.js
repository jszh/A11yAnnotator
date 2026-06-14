const {
  IconBadge,
  PageShell,
  announce,
  departmentFeed,
  quickTasks,
  useState,
} = window.GovPortal;

function HomePage() {
  const [language, setLanguage] = useState("EN");

  return (
    <PageShell
      currentPath="./index.html"
      eyebrow="Official state services"
      title="Find resident services and complete common tasks online"
      description="Access trusted Vermont government services for licensing, benefits, education, and resident support through one clear public portal."
      breadcrumbs={[{ label: "Home" }]}
      aside={
        <section className="rounded-[2rem] border border-pine-100 bg-white p-6 shadow-civic" aria-labelledby="language-tools">
          <h2 id="language-tools" className="text-lg font-semibold text-slate-950">Accessibility and language</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Choose a preferred language for navigation labels and service assistance.</p>
          <div className="mt-4 flex flex-wrap gap-3" role="group" aria-label="Language selector">
            {["EN", "ES", "FR"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setLanguage(option);
                  announce(`Language preference set to ${option}.`);
                }}
                className={`focus-ring rounded-full px-4 py-2 text-sm font-semibold ${language === option ? "bg-pine-700 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
                aria-pressed={language === option}
                aria-label={`Set portal language to ${option}`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>
      }
    >
      <section role="alert" aria-live="assertive" className="mt-10 rounded-[2rem] border border-amber-200 bg-amber-50 px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-800">Seasonal reminder</p>
            <h2 className="mt-2 text-2xl font-semibold text-amber-950">Tax Filing Deadline: April 15 - File Online Now</h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">Use secure online filing support, payment plans, and deadline guidance from the Department of Taxes.</p>
          </div>
          <a href="./services.html" className="focus-ring inline-flex rounded-full bg-amber-900 px-5 py-3 text-sm font-semibold text-white" aria-label="View tax filing and resident services">
            View filing services
          </a>
        </div>
      </section>

      <section className="mt-10 overflow-hidden rounded-[2rem] border border-pine-100 bg-white shadow-civic" aria-labelledby="task-search-heading">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
          <div className="surface-mask px-6 py-10 text-white lg:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-pine-100">Resident task center</p>
            <h2 id="task-search-heading" className="mt-3 text-4xl font-semibold tracking-tight">What do you need today?</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-pine-50">Search for a service, or start with a common task below.</p>
            <form className="mt-6" role="search" aria-label="Search resident services">
              <label htmlFor="service-search" className="sr-only">Search resident services</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="service-search"
                  type="search"
                  className="focus-ring min-w-0 flex-1 rounded-full border border-white/30 bg-white px-5 py-4 text-base text-slate-900 placeholder:text-slate-500"
                  placeholder="Search licenses, schools, benefits, and more"
                  aria-label="Search licenses, schools, benefits, and more"
                />
                <button type="button" className="focus-ring rounded-full bg-pine-100 px-6 py-4 text-sm font-semibold text-pine-950" aria-label="Search resident services">
                  Search services
                </button>
              </div>
            </form>
          </div>
          <aside className="bg-pine-50 px-6 py-10 lg:px-8" aria-labelledby="live-updates-heading">
            <h2 id="live-updates-heading" className="text-2xl font-semibold text-slate-950">Live updates</h2>
            <ul className="mt-6 space-y-4" aria-label="Recent updates from state departments">
              {departmentFeed.map((item) => (
                <li key={item.department} className="rounded-3xl border border-pine-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pine-700">{item.department}</p>
                  <p className="mt-2 text-sm font-medium text-slate-500">{item.time}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.message}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="quick-links-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="quick-links-heading" className="text-3xl font-semibold text-slate-950">Quick links</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Start common resident services with clear next steps and estimated effort.</p>
          </div>
          <a href="./services.html" className="focus-ring hidden rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 lg:inline-flex" aria-label="Open the full services overview page">
            View all services
          </a>
        </div>
        <nav aria-label="Task-based quick links" className="mt-8">
          <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {quickTasks.map((task) => (
              <li key={task.title}>
                <a href={task.href} className="focus-ring block rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-civic" aria-label={task.title}>
                  <div className="flex items-center justify-between gap-4">
                    <IconBadge label={task.iconLabel}>
                      <span aria-hidden="true" className="text-xl">+</span>
                    </IconBadge>
                    <span className="rounded-full bg-pine-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-pine-700">Start</span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-950">{task.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{task.description}</p>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<HomePage />);
