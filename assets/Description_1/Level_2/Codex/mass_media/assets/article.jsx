function ArticlePage() {
  const { heroStory, worldStories } = window.MeridianData;

  return (
    <PageLayout currentPage="article" liveMessage="">
      <article>
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">World</p>
          <h1 className="font-editorial mt-3 max-w-5xl text-5xl font-semibold leading-tight text-slate-950">{heroStory.title}</h1>
          <p className="mt-4 max-w-4xl text-xl leading-8 text-slate-600">{heroStory.dek}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>{heroStory.byline}</span>
            <span>{heroStory.time}</span>
            <span>8 min read</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700" aria-label={`Share ${heroStory.title} on X`}>
              Share on X
            </button>
            <button type="button" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700" aria-label={`Share ${heroStory.title} on Facebook`}>
              Share on Facebook
            </button>
            <button type="button" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700" aria-label={`Share ${heroStory.title} by email`}>
              Share by Email
            </button>
          </div>
        </header>

        <figure className="mt-8">
          <img src={heroStory.image} alt="" className="w-full rounded-[2rem] object-cover" />
          <figcaption className="mt-3 text-sm text-slate-500">{heroStory.caption}</figcaption>
        </figure>

        <div className="mt-10 max-w-3xl space-y-8 text-lg leading-8 text-slate-700">
          <p>In maritime capitals from London to Singapore, shipping executives spent the day re-routing vessels, revising insurance assumptions, and calling diplomats who rarely hear from the private sector this often. The result was a frantic blend of market anxiety and emergency statecraft.</p>
          <p>Officials familiar with the talks said the session at the United Nations was intended not only to calm markets, but also to signal to regional actors that commercial corridors remain a red line for a wide range of governments. The challenge is that each actor defines deterrence differently.</p>
          <blockquote className="border-l-4 border-teal-700 pl-5 font-editorial text-3xl font-semibold text-slate-950">
            “The market is reacting not just to violence, but to uncertainty about who is willing to absorb the costs of keeping trade routes open.”
          </blockquote>
          <h2 className="font-editorial text-3xl font-semibold text-slate-950">Why the stakes extend beyond energy</h2>
          <p>Food importers in East Africa and consumer-goods companies in Europe are already assessing whether transit delays will feed into inflation during a politically volatile winter. Analysts say the danger is less about one dramatic spike and more about a prolonged period of higher friction in global logistics.</p>
          <p>That is why related debates over naval patrols, insurance backstops, and convoy coordination now sit alongside humanitarian questions. The core policy question is whether governments can build a deterrence framework without widening the conflict they are trying to contain.</p>
          <p>For readers tracking adjacent developments, see <a href="./world.html" className="focus-ring rounded text-teal-700 underline">our wider world coverage</a> and the latest <a href="./opinion.html" className="focus-ring rounded text-teal-700 underline">analysis from Meridian columnists</a>.</p>
        </div>

        <section className="mt-10 max-w-3xl" aria-labelledby="article-tags-heading">
          <h2 id="article-tags-heading" className="font-editorial text-3xl font-semibold text-slate-950">Tags</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {["Red Sea", "UN", "Shipping", "Diplomacy"].map((tag) => (
              <a key={tag} href="./world.html" className="focus-ring rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700">
                {tag}
              </a>
            ))}
          </div>
        </section>

        <section className="mt-10 max-w-3xl" aria-labelledby="comments-heading">
          <h2 id="comments-heading" className="font-editorial text-3xl font-semibold text-slate-950">Comments</h2>
          <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
            Comments are moderated in this mockup. Readers can discuss the article after signing in as subscribers.
          </div>
        </section>
      </article>

      <section className="mt-14" aria-labelledby="more-world-heading">
        <h2 id="more-world-heading" className="font-editorial text-3xl font-semibold text-slate-950">More from World</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {worldStories.slice(1, 4).map((story) => (
            <StoryCard key={story.title} story={story} href="./article.html" />
          ))}
        </div>
      </section>
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ArticlePage />);
