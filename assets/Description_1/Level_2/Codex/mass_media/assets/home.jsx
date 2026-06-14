function HomePage() {
  const { heroStory, homepageStories, mostRead } = window.MeridianData;

  return (
    <PageLayout currentPage="home" liveMessage="">
      <section className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <StoryCard story={heroStory} large />
        <section className="space-y-5" aria-labelledby="most-read-heading">
          <div className="panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
            <h2 id="most-read-heading" className="font-editorial text-3xl font-semibold text-slate-950">Most Read</h2>
            <ol className="mt-5 space-y-4">
              {mostRead.map((item, index) => (
                <li key={item} className="border-b border-slate-100 pb-4 last:border-b-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">0{index + 1}</p>
                  <a href="./article.html" className="focus-ring mt-2 block rounded font-editorial text-2xl font-semibold text-slate-900">
                    {item}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </section>

      <section className="mt-12" aria-labelledby="top-stories-heading">
        <h2 id="top-stories-heading" className="font-editorial text-3xl font-semibold text-slate-950">Top Stories</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {homepageStories.map((story) => (
            <StoryCard key={story.title} story={story} />
          ))}
        </div>
      </section>

      {[
        ["World", "Dispatches, diplomacy, and the changing shape of global power."],
        ["Politics", "Campaigns, institutions, and the decisions remaking public life."],
        ["Tech", "AI, policy, chips, and the systems behind digital power."],
        ["Culture", "Essays, criticism, and the ideas shaping public conversation."]
      ].map(([label, text]) => (
        <section key={label} className="mt-12 panel rounded-[2rem] border border-white/70 p-5 shadow-sm">
          <h2 className="font-editorial text-3xl font-semibold text-slate-950">{label}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{text}</p>
          <a href={label === "World" ? "./world.html" : "./article.html"} className="focus-ring mt-4 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            Explore {label}
          </a>
        </section>
      ))}
    </PageLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<HomePage />);
