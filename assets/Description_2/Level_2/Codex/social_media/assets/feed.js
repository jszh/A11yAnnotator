const { html, posts, PageShell, RightRail, FeedTabs, Composer, PostCard } = window.Folia;

function FeedPage() {
  const rail = html`
    <${RightRail} title="Studio Pulse">
      <div className="rounded-[1.5rem] bg-white/90 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">Feedback queue</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">3 creators are waiting on your critique for poster layout, sequence edits, and print proofing.</p>
      </div>
      <div className="rounded-[1.5rem] bg-white/90 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">Open calls</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>Editorial collage zine submissions close Friday.</li>
          <li>Typeface lab critiques start at 6 PM.</li>
        </ul>
      </div>
    <//>
  `;

  return html`
    <${PageShell}
      currentPath="./index.html"
      kicker="Creative feed"
      title="Folia Feed"
      description="A feed for artists, illustrators, photographers, and designers sharing drafts, color studies, and visual notes in progress."
      rightRail=${rail}
    >
      <section aria-labelledby="feed-heading" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="feed-heading" className="text-3xl font-semibold text-slate-950">For You Feed</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Curated work-in-progress posts with critique-ready context and generous image space.</p>
          </div>
          <${FeedTabs} />
        </div>
        <${Composer} />
        <div className="feed-scroll space-y-6">
          ${posts.map((post) => html`<${PostCard} key=${post.id} post=${post} />`)}
        </div>
      </section>
    <//>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${FeedPage} />`);
