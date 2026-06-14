import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import ArticleCard from "../components/ArticleCard";
import { articles } from "../data";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = articles.find((a) => a.slug === slug) || articles[0];
  const related = articles.filter((a) => a.category === article.category && a.slug !== article.slug).slice(0, 3);

  return (
    <Layout title={`${article.headline} | The Meridian`}>
      <article className="container mt-6" aria-label={article.headline}>
        {/* Headline */}
        <div className="max-w-3xl mx-auto">
          <div className="editorial-rule mb-4" />
          <span className="section-label">{article.category}</span>
          <h1 className="headline-xl mt-2 mb-3">{article.headline}</h1>
          <p className="font-sans text-xl text-muted-foreground mb-4">{article.summary}</p>

          {/* Byline */}
          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
            <div>
              <p className="font-sans font-semibold text-foreground">{article.author}</p>
              <p className="byline">{article.date} · {article.readTime}</p>
            </div>
          </div>
        </div>

        {/* Hero image */}
        <figure className="max-w-4xl mx-auto mb-8">
          <img
            src={article.image}
            alt={article.imageAlt}
            className="w-full aspect-[16/9] object-cover"
          />
          <figcaption className="mt-2 text-sm font-sans text-muted-foreground italic">
            {article.imageAlt}. Photo: The Meridian / Staff
          </figcaption>
        </figure>

        {/* Article body */}
        <div className="max-w-3xl mx-auto">
          <div className="body-text space-y-6 text-foreground">
            <p>
              The international community watched with growing alarm as tensions in the Red Sea
              corridor reached levels not seen since the height of the shipping crisis in early 2024.
              Multiple cargo vessels reported coming under fire in a concentrated 48-hour window,
              prompting emergency consultations among the world's leading maritime nations.
            </p>
            <p>
              "We are at a critical juncture," said UN Secretary-General in a hastily arranged press
              conference. "The disruption to global trade routes is not merely an economic concern —
              it represents a fundamental threat to international order and the rules-based system
              that has maintained relative stability for decades."
            </p>

            <blockquote className="pull-quote">
              "The disruption to global trade routes represents a fundamental threat to
              international order and the rules-based system."
            </blockquote>

            <p>
              Insurance premiums for vessels transiting the Bab el-Mandeb strait have tripled in the
              past month alone, with several major underwriters declining coverage altogether for
              certain vessel categories. The ripple effects are being felt in consumer markets
              worldwide, with shipping analysts predicting price increases of 15–20% on goods
              typically routed through the Suez Canal.
            </p>
            <p>
              Regional analysts point to a complex web of geopolitical factors driving the
              escalation, including proxy conflicts, energy politics, and long-standing territorial
              disputes that have been exacerbated by shifting great power dynamics. The situation
              has drawn comparisons to historical blockades, though experts caution against
              oversimplification.
            </p>

            <h2 className="headline-md mt-8 mb-4">Diplomatic Efforts Intensify</h2>

            <p>
              Behind the scenes, diplomatic channels that had gone quiet in recent months have been
              reactivated. Multiple shuttle diplomacy efforts are underway, with envoys from the
              European Union, United States, and regional powers engaged in parallel negotiations
              aimed at de-escalating the situation before it spirals further.
            </p>
            <p>
              The emergency Security Council session, called under Article 99 provisions, is
              expected to debate a resolution calling for an immediate ceasefire in the maritime
              corridor and the establishment of a protected shipping lane under international
              naval escort. However, consensus remains elusive, with several permanent members
              signaling reservations about the proposed enforcement mechanisms.
            </p>
          </div>

          {/* Tags */}
          <div className="mt-8 pt-4 border-t border-border">
            <h2 className="font-sans text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Topics
            </h2>
            <div className="flex flex-wrap gap-2">
              {["Red Sea", "UN Security Council", "Global Trade", "Maritime Security", "Geopolitics"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm font-sans bg-secondary text-secondary-foreground border border-border"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Share */}
          <div className="mt-6 flex gap-3">
            {["Twitter", "Facebook", "LinkedIn"].map((platform) => (
              <button
                key={platform}
                aria-label={`Share "${article.headline}" on ${platform}`}
                className="px-4 py-2 text-sm font-sans font-semibold border border-border text-foreground hover:bg-secondary transition-colors"
              >
                {platform}
              </button>
            ))}
          </div>

          {/* Comments section */}
          <section aria-labelledby="comments-heading" className="mt-12">
            <div className="editorial-rule mb-4" />
            <h2 id="comments-heading" className="headline-md mb-4">Comments</h2>
            <div className="bg-secondary p-6 border border-border">
              <p className="font-sans text-muted-foreground mb-4">
                Join the conversation. Please be respectful and follow our community guidelines.
              </p>
              <label htmlFor="comment-input" className="sr-only">Write a comment</label>
              <textarea
                id="comment-input"
                rows={4}
                placeholder="Share your thoughts..."
                className="w-full p-3 font-sans text-foreground bg-card border border-border focus:outline-none focus:ring-2 focus:ring-accent mb-3"
                aria-required="true"
              />
              <button className="px-6 py-2 bg-foreground text-primary-foreground font-sans font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity">
                Post Comment
              </button>
            </div>
          </section>
        </div>
      </article>

      {/* More from category */}
      <section aria-labelledby="more-from-heading" className="container mt-12">
        <div className="editorial-rule mb-4" />
        <h2 id="more-from-heading" className="headline-md mb-6">
          More from {article.category}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {related.map((a) => (
            <ArticleCard key={a.slug} article={a} size="medium" />
          ))}
        </div>
      </section>
    </Layout>
  );
}
