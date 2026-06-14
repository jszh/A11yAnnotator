const { html, PageShell, opinionPieces } = window.Groundwork;

function PerspectivesPage() {
  return html`
    <${PageShell}
      currentPath="./perspectives.html"
      eyebrow="Perspectives"
      title="Scientists, policymakers, and communities writing from the front lines"
      description="Groundwork's opinion desk publishes argued, evidence-aware essays from people working closest to climate consequences and policy decisions."
    >
      <section aria-labelledby="perspectives-grid" className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="perspectives-grid" className="text-3xl font-serif text-ink">Recent Essays</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">Each contributor bio card is part of a semantic list so the grid remains coherent for assistive technology.</p>
          </div>
        </div>

        <ul className="mt-8 grid gap-6 lg:grid-cols-3" aria-label="Opinion contributors">
          ${opinionPieces.map((piece) => html`
            <li key=${piece.title}>
              <article className="flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <img src=${piece.avatar} alt=${piece.author} className="h-16 w-16 rounded-full object-cover" />
                  <div>
                    <p className="text-lg font-semibold text-ink">${piece.author}</p>
                    <p className="text-sm leading-6 text-slate-500">${piece.role}</p>
                  </div>
                </div>
                <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.3em] text-rust">${piece.date}</p>
                <h3 className="mt-3 text-2xl font-serif leading-tight text-ink">
                  <a href=${piece.href} className="focus-ring rounded">${piece.title}</a>
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">${piece.bio}</p>
                <div className="mt-auto pt-6">
                  <a href="#respond" className="focus-ring rounded text-sm font-semibold text-moss">Respond to This Piece</a>
                </div>
              </article>
            </li>
          `)}
        </ul>
      </section>

      <section id="respond" aria-labelledby="letters-heading" className="mt-16 rounded-[2rem] border border-slate-200 bg-fog p-8">
        <h2 id="letters-heading" className="text-3xl font-serif text-ink">Letters and Responses</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">Groundwork invites short, evidence-based responses from researchers, residents, and practitioners. Submissions are reviewed for clarity, disclosure, and sourcing.</p>
        <a href="./support.html" className="focus-ring mt-6 inline-flex rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">Submit a letter</a>
      </section>
    </${PageShell}>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${PerspectivesPage} />`);
