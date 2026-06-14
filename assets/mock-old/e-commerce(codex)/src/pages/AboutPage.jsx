function AboutPage() {
  return (
    <section className="py-6">
      <article className="card-shell">
        <h1 className="text-3xl font-bold">About MarketHub</h1>
        <p className="mt-4 text-slate-700">
          MarketHub is a modern online marketplace concept focused on speed, assortment, and a frictionless shopping experience.
        </p>
        <p className="mt-4 text-slate-700">
          This React + Tailwind implementation demonstrates a componentized architecture inspired by large marketplace platforms.
        </p>
      </article>

      <article className="card-shell mt-4">
        <h2 className="text-2xl font-semibold">Why customers choose us</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
          <li>Fast, reliable shipping windows</li>
          <li>Millions of products across key categories</li>
          <li>Simple returns and dedicated support</li>
          <li>Member benefits and exclusive offers</li>
        </ul>
      </article>
    </section>
  );
}

export default AboutPage;
