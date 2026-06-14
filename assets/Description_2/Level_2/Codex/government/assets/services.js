const {
  PageShell,
  lifeStages,
} = window.GovPortal;

function ServicesPage() {
  return (
    <PageShell
      currentPath="./services.html"
      eyebrow="Services overview"
      title="Browse resident services by life stage"
      description="Find services organized around the moments that matter most, from moving to Vermont to raising a family, attending school, or running a business."
      breadcrumbs={[
        { label: "Home", href: "./index.html" },
        { label: "Services" },
      ]}
      aside={
        <section className="rounded-[2rem] border border-pine-100 bg-white p-6 shadow-civic" aria-labelledby="services-summary">
          <h2 id="services-summary" className="text-lg font-semibold text-slate-950">How to use this page</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Each card groups common resident services with a short description and estimated completion time. All links are keyboard accessible and open full service guidance.</p>
        </section>
      }
    >
      <nav aria-label="Life stage service categories" className="mt-10">
        <ul className="grid gap-8 lg:grid-cols-2">
          {lifeStages.map((group) => (
            <li key={group.id} id={group.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <article aria-labelledby={`${group.id}-heading`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-pine-700">Resident group</p>
                    <h2 id={`${group.id}-heading`} className="mt-2 text-2xl font-semibold text-slate-950">{group.title}</h2>
                  </div>
                  <span className="rounded-full bg-pine-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-pine-700">{group.services.length} services</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{group.description}</p>
                <ul className="mt-6 space-y-3" aria-label={`${group.title} services`}>
                  {group.services.map((service) => (
                    <li key={service.name}>
                      <a href={service.href} className="focus-ring flex items-start justify-between gap-4 rounded-3xl border border-pine-100 bg-pine-50/50 px-4 py-4" aria-label={`${service.name}, estimated completion time ${service.time}`}>
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">{service.name}</h3>
                          <p className="mt-1 text-sm text-slate-600">{group.description}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-pine-700">{service.time}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ul>
      </nav>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ServicesPage />);
