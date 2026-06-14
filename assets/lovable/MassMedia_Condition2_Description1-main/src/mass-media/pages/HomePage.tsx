import Layout from "../components/Layout";
import ArticleCard from "../components/ArticleCard";
import NewsletterSignup from "../components/NewsletterSignup";
import { articles } from "../data";
import { Link } from "react-router-dom";

const sections = [
  { label: "World", articles: articles.filter((a) => a.category === "World") },
  { label: "Politics", articles: articles.filter((a) => a.category === "Politics") },
  { label: "Tech", articles: articles.filter((a) => a.category === "Tech") },
  { label: "Culture", articles: articles.filter((a) => a.category === "Culture") },
];

const mostRead = articles.slice(0, 5);

export default function HomePage() {
  const heroArticle = articles[0];
  const secondaryArticles = articles.slice(1, 4);

  return (
    <Layout title="The Meridian — Independent Global Journalism" showTicker>
      {/* Hero */}
      <section aria-labelledby="hero-heading" className="container mt-6">
        <div className="editorial-rule mb-6" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ArticleCard article={heroArticle} size="large" />
          </div>
          <aside className="space-y-4">
            <h2 id="hero-heading" className="sr-only">Top Stories</h2>
            {secondaryArticles.map((a) => (
              <ArticleCard key={a.slug} article={a} size="small" />
            ))}
          </aside>
        </div>
      </section>

      {/* Main content + sidebar */}
      <div className="container mt-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Section strips */}
          <div className="lg:col-span-2 space-y-12">
            {sections.map((section) => (
              <section key={section.label} aria-labelledby={`section-${section.label}`}>
                <div className="editorial-rule mb-4" />
                <div className="flex items-baseline justify-between mb-4">
                  <h2 id={`section-${section.label}`} className="headline-md">
                    {section.label}
                  </h2>
                  <Link
                    to="/mass-media/world"
                    className="text-sm font-sans font-semibold text-accent hover:underline"
                  >
                    See all →
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  {section.articles.slice(0, 2).map((a) => (
                    <ArticleCard key={a.slug} article={a} size="medium" />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Sidebar — after main content in DOM */}
          <aside className="space-y-8" aria-label="Sidebar">
            {/* Most Read */}
            <section aria-labelledby="most-read-heading">
              <div className="editorial-rule mb-4" />
              <h2 id="most-read-heading" className="headline-md mb-4">Most Read</h2>
              <ol className="space-y-4">
                {mostRead.map((a, i) => (
                  <li key={a.slug} className="flex gap-3 items-start border-b border-border pb-3">
                    <span className="font-serif text-2xl font-bold text-accent shrink-0 w-8">
                      {i + 1}
                    </span>
                    <div>
                      <Link
                        to={`/mass-media/article/${a.slug}`}
                        className="font-serif text-base font-semibold text-foreground hover:text-accent transition-colors leading-snug block"
                      >
                        {a.headline}
                      </Link>
                      <p className="byline mt-1">{a.readTime}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* Newsletter */}
            <section aria-labelledby="newsletter-sidebar-heading">
              <h2 id="newsletter-sidebar-heading" className="sr-only">Newsletter signup</h2>
              <NewsletterSignup />
            </section>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
