import Layout from "../components/Layout";
import { columnists, opinionArticles } from "../data";
import { Link } from "react-router-dom";

export default function OpinionPage() {
  const featured = opinionArticles.find((a) => a.featured);
  const rest = opinionArticles.filter((a) => !a.featured);

  return (
    <Layout title="Opinion | The Meridian">
      <div className="container mt-6">
        <div className="editorial-rule mb-4" />
        <h1 className="headline-xl mb-6">Opinion</h1>

        {/* Featured opinion */}
        {featured && (
          <section aria-label="Featured opinion" className="mb-12">
            <article className="grid md:grid-cols-3 gap-6 border-b border-border pb-8">
              <div className="md:col-span-2">
                <span className="section-label">Featured Essay</span>
                <h2 className="headline-lg mt-2 mb-3">
                  <Link
                    to={`/mass-media/article/${featured.slug}`}
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    {featured.headline}
                  </Link>
                </h2>
                <p className="font-sans text-lg text-muted-foreground mb-4">{featured.summary}</p>
                <p className="byline">{featured.date} · {featured.readTime}</p>
              </div>
              <div className="flex items-center gap-4 md:flex-col md:items-start md:justify-center">
                <img
                  src={featured.columnist.image}
                  alt={`Portrait of ${featured.columnist.name}`}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                  <p className="font-serif text-lg font-bold text-foreground">{featured.columnist.name}</p>
                  <p className="font-sans text-sm text-muted-foreground">{featured.columnist.title}</p>
                </div>
              </div>
            </article>
          </section>
        )}

        {/* Columnists grid */}
        <section aria-labelledby="columnists-heading" className="mb-12">
          <div className="editorial-rule mb-4" />
          <h2 id="columnists-heading" className="headline-md mb-6">Our Columnists</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {columnists.map((c) => (
              <li key={c.name} className="text-center">
                <img
                  src={c.image}
                  alt={`Portrait of ${c.name}`}
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-3"
                />
                <h3 className="font-serif text-lg font-bold text-foreground">{c.name}</h3>
                <p className="font-sans text-sm text-accent font-semibold">{c.title}</p>
                <p className="font-sans text-sm text-muted-foreground mt-2">{c.bio}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Recent opinions */}
        <section aria-labelledby="recent-opinions-heading" className="mb-12">
          <div className="editorial-rule mb-4" />
          <h2 id="recent-opinions-heading" className="headline-md mb-6">Recent Opinion Pieces</h2>
          <ul className="space-y-6">
            {rest.map((op) => (
              <li key={op.slug}>
                <article className="grid md:grid-cols-4 gap-4 border-b border-border pb-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={op.columnist.image}
                      alt={`Portrait of ${op.columnist.name}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-sans text-sm font-semibold text-foreground">{op.columnist.name}</p>
                      <p className="font-sans text-xs text-muted-foreground">{op.columnist.title}</p>
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <h3 className="headline-sm">
                      <Link
                        to={`/mass-media/article/${op.slug}`}
                        className="text-foreground hover:text-accent transition-colors"
                      >
                        {op.headline}
                      </Link>
                    </h3>
                    <p className="font-sans text-sm text-muted-foreground mt-1">{op.summary}</p>
                    <p className="byline mt-2">{op.date} · {op.readTime}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>

        {/* Letters to the Editor */}
        <section aria-labelledby="letters-heading">
          <div className="editorial-rule mb-4" />
          <h2 id="letters-heading" className="headline-md mb-6">Letters to the Editor</h2>
          <div className="space-y-6">
            {[
              {
                author: "Dr. Sarah Mitchell, Oxford",
                text: "The Meridian's coverage of the Red Sea crisis has been exemplary in its nuance and depth. However, I believe more attention should be paid to the humanitarian impact on coastal communities who depend on fishing rights in the affected waters.",
              },
              {
                author: "Carlos Rivera, São Paulo",
                text: "Ms. Okafor's essay on the global art renaissance was a breath of fresh air. For too long, the art world has operated under assumptions that excellence originates exclusively from established Western institutions. The evidence suggests otherwise.",
              },
              {
                author: "Prof. Aisha Patel, Mumbai",
                text: "Regarding the editorial on AI regulation: while the concerns about democratic integrity are valid, we must be careful not to conflate regulation with prohibition. Innovation requires space to breathe, even as we establish guardrails.",
              },
            ].map((letter, i) => (
              <article key={i} className="border-b border-border pb-4">
                <p className="font-sans text-foreground italic">"{letter.text}"</p>
                <p className="font-sans text-sm text-muted-foreground mt-2 font-semibold">— {letter.author}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
