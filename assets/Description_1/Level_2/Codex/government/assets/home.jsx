function HomePage() {
  const { quickServices, announcements, events } = window.LakewoodPortalData;
  const [liveMessage] = useState("");

  return (
    <PageLayout
      currentPage="home"
      breadcrumbItems={[{ label: "Home" }]}
      liveMessage={liveMessage}
    >
      <section className="hero-panel rounded-[2rem] p-8 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-200">Resident Services</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
          How Can We Help You?
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-100">
          Access city services, review announcements, and find the right department for your next task.
        </p>
        <form className="mt-8 max-w-3xl" role="search" aria-label="Task search">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-100">Search city services</span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                className="focus-ring min-w-0 flex-1 rounded-2xl px-4 py-3 text-slate-900"
                placeholder="Try parking permit, utility payment, or park reservation"
                aria-label="Search for city tasks and services"
              />
              <a
                href="./services.html"
                className="focus-ring rounded-2xl bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950"
                aria-label="Browse service directory"
              >
                Browse Services
              </a>
            </div>
          </label>
        </form>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-slate-950">Quick Access Services</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {quickServices.map((service) => (
            <a
              key={service.name}
              href={service.href}
              className="focus-ring panel rounded-[2rem] border border-white/70 p-6 shadow-sm"
              aria-label={`${service.name}. ${service.description}`}
            >
              <h3 className="text-xl font-semibold text-slate-900">{service.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="panel rounded-[2rem] border border-white/70 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">News & Announcements</h2>
          <div className="mt-6 space-y-4">
            {announcements.map((announcement) => (
              <article key={announcement.title} className="rounded-[1.5rem] bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{announcement.date}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{announcement.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{announcement.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="panel rounded-[2rem] border border-white/70 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Upcoming City Events</h2>
          <ul className="mt-6 space-y-4">
            {events.map((event) => (
              <li key={event.title} className="rounded-[1.5rem] bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{event.date}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{event.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{event.details}</p>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<HomePage />);
