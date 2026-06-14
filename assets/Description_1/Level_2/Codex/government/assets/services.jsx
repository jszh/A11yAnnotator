function ServicesPage() {
  const { serviceCategories } = window.LakewoodPortalData;

  return (
    <PageLayout
      currentPage="services"
      breadcrumbItems={[{ label: "Home", href: "./index.html" }, { label: "Services" }]}
      liveMessage=""
    >
      <section>
        <h1 className="text-4xl font-semibold text-slate-950">City Services Directory</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Start with a service category to find online forms, payment options, application guidance, and department contacts.
        </p>
      </section>

      <section className="mt-10">
        <nav aria-label="Service category navigation">
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {serviceCategories.map((category) => (
              <li key={category.id}>
                <a
                  href={category.href}
                  className="focus-ring panel block rounded-[2rem] border border-white/70 p-6 shadow-sm"
                  aria-label={`Open ${category.name} services. ${category.description}`}
                >
                  <h2 className="text-2xl font-semibold text-slate-900">{category.name}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{category.description}</p>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ServicesPage />);
