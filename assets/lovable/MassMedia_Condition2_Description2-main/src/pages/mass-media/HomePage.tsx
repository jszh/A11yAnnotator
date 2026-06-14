import { Link } from "react-router-dom";
import Layout from "@/components/mass-media/Layout";
import ArticleCard from "@/components/mass-media/ArticleCard";
import { ArrowRight } from "lucide-react";

const latestInvestigations = [
  {
    title: "Methane Plumes Over the Permian Basin Are Worse Than Reported",
    excerpt: "Satellite data reveals emissions from oil and gas operations are 60% higher than EPA estimates, raising questions about regulatory oversight.",
    tag: "Energy",
    author: "Sarah Chen",
    date: "Mar 18, 2026",
    readTime: "14 min read",
  },
  {
    title: "The Carbon Credit Shell Game",
    excerpt: "An investigation into how offset programs are selling credits for forests that were never at risk — and who profits.",
    tag: "Carbon Markets",
    author: "David Okonkwo",
    date: "Mar 15, 2026",
    readTime: "22 min read",
  },
  {
    title: "Inside the Fight Over PFAS in Rural Drinking Water",
    excerpt: "Small towns across the Midwest face contamination crises with little federal support. We mapped every affected community.",
    tag: "Policy",
    author: "Maria Gutierrez",
    date: "Mar 12, 2026",
    readTime: "18 min read",
  },
];

const stats = [
  { value: "2.4 billion", label: "gallons of groundwater lost daily in the Western U.S." },
  { value: "47%", label: "of U.S. aquifers declining faster than they recharge" },
  { value: "12 states", label: "face critical water shortages by 2030" },
  { value: "$1.1T", label: "estimated economic impact of water scarcity by 2035" },
];

const categories = ["Climate", "Energy", "Policy", "Science", "Data"];

export default function HomePage() {
  return (
    <Layout title="Home">
      {/* Hero Feature Story */}
      <section className="relative bg-gw-ink" aria-labelledby="hero-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="inline-block px-2.5 py-1 text-[11px] font-sans font-bold uppercase tracking-widest bg-accent text-accent-foreground rounded-sm mb-6">
              Featured Investigation
            </span>
            <h1
              id="hero-heading"
              className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-primary-foreground leading-[1.1] mb-6"
            >
              The Invisible Flood: How Groundwater Collapse Is Reshaping the American West
            </h1>
            <p className="font-sans text-base md:text-lg text-primary-foreground/70 leading-relaxed mb-8 max-w-2xl">
              Beneath the surface of the nation's most productive farmlands, a crisis decades in the making is accelerating.
              Our year-long investigation reveals the scale of aquifer depletion — and the communities caught in its path.
            </p>
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm font-sans text-primary-foreground/60">
                <span className="font-medium text-primary-foreground/80">By Sarah Chen &amp; David Okonkwo</span>
                <span aria-hidden="true">&middot;</span>
                <time>March 20, 2026</time>
                <span aria-hidden="true">&middot;</span>
                <span>35 min read</span>
              </div>
            </div>
            <Link
              to="/mass-media/article"
              className="inline-flex items-center gap-2 px-6 py-3 font-sans font-semibold text-sm bg-accent text-accent-foreground rounded-sm hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Read the Investigation
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="border-b border-border" aria-label="Topic categories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 py-3 overflow-x-auto" role="group" aria-label="Filter by topic">
            {categories.map((cat) => (
              <Link
                key={cat}
                to="/mass-media/category/climate"
                className="shrink-0 px-4 py-1.5 text-sm font-sans font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Investigations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16" aria-labelledby="latest-heading">
        <div className="flex items-center justify-between mb-8">
          <h2 id="latest-heading" className="font-serif font-bold text-2xl md:text-3xl">
            Latest Investigations
          </h2>
          <Link
            to="/mass-media/category/climate"
            className="text-sm font-sans font-medium text-primary hover:underline flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {latestInvestigations.map((article) => (
            <ArticleCard key={article.title} {...article} />
          ))}
        </div>
      </section>

      {/* By the Numbers */}
      <section className="bg-gw-surface border-y border-border" aria-labelledby="numbers-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <h2 id="numbers-heading" className="font-serif font-bold text-2xl md:text-3xl text-center mb-10">
            By the Numbers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-serif font-bold text-4xl md:text-5xl text-primary mb-2">{stat.value}</p>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16" aria-labelledby="cta-heading">
        <div className="bg-primary rounded-sm p-8 md:p-12 text-center">
          <h2 id="cta-heading" className="font-serif font-bold text-2xl md:text-3xl text-primary-foreground mb-4">
            Reporting Like This Takes Resources
          </h2>
          <p className="font-sans text-primary-foreground/70 max-w-xl mx-auto mb-6 leading-relaxed">
            Groundwork is 100% reader-supported. We take no corporate funding. Your support ensures our investigations remain
            independent, thorough, and free to read.
          </p>
          <Link
            to="/mass-media/subscribe"
            className="inline-flex items-center gap-2 px-8 py-3 font-sans font-semibold text-sm bg-accent text-accent-foreground rounded-sm hover:opacity-90 transition-opacity"
          >
            Support Independent Journalism
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </Layout>
  );
}