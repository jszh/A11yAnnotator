import { Link } from "react-router-dom";
import Layout from "@/components/mass-media/Layout";
import { ArrowRight, Share2, Bookmark, MessageSquare } from "lucide-react";

const relatedStories = [
  { title: "Methane Plumes Over the Permian Basin Are Worse Than Reported", tag: "Energy" },
  { title: "The Carbon Credit Shell Game", tag: "Carbon Markets" },
  { title: "Inside the Fight Over PFAS in Rural Drinking Water", tag: "Policy" },
];

export default function ArticlePage() {
  return (
    <Layout title="The Invisible Flood">
      <article className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Article Header */}
        <header className="max-w-3xl mx-auto pt-10 md:pt-14 pb-8">
          <span className="inline-block px-2.5 py-1 text-[11px] font-sans font-bold uppercase tracking-widest bg-muted text-muted-foreground rounded-sm mb-4">
            Climate Investigation
          </span>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl leading-[1.1] mb-4">
            The Invisible Flood: How Groundwater Collapse Is Reshaping the American West
          </h1>
          <p className="font-serif text-lg md:text-xl text-muted-foreground italic leading-relaxed mb-6">
            Beneath the most productive farmlands in America, a slow-motion crisis is accelerating.
            Aquifers that took millennia to fill are being drained in decades.
          </p>

          {/* Byline */}
          <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="font-sans font-bold text-sm text-muted-foreground">SC</span>
              </div>
              <div>
                <p className="text-sm font-sans font-medium">By Sarah Chen &amp; David Okonkwo</p>
                <p className="text-xs font-sans text-muted-foreground">
                  <time dateTime="2026-03-20">March 20, 2026</time> &middot; 35 min read
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button aria-label="Share this article on social media" className="p-2 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Share2 size={16} />
              </button>
              <button aria-label="Bookmark this article" className="p-2 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Bookmark size={16} />
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10 max-w-5xl mx-auto">
          {/* Article Body */}
          <div className="max-w-3xl">
            {/* Methodology Note */}
            <div className="bg-gw-surface border border-border rounded-sm p-5 mb-8">
              <h2 className="font-sans font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2">
                How We Reported This
              </h2>
              <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                This investigation is based on 14 months of reporting, analysis of USGS groundwater monitoring data from 2,400 wells,
                satellite imagery from NASA's GRACE mission, and interviews with 47 hydrologists, farmers, and policymakers
                across eight Western states.
              </p>
            </div>

            {/* Body Content */}
            <div className="prose-gw space-y-6">
              <p className="font-sans text-base leading-[1.8] text-foreground/90">
                The Ogallala Aquifer stretches beneath eight states, from South Dakota to Texas. For more than a century,
                it has been the invisible engine of American agriculture — irrigating crops that feed the nation and
                generate billions in economic output annually. But today, large sections of this vital resource are in
                terminal decline.
              </p>

              <h2 className="font-serif font-bold text-2xl mt-10 mb-4">A Crisis Beneath the Surface</h2>

              <p className="font-sans text-base leading-[1.8] text-foreground/90">
                In the Texas Panhandle, where the Ogallala was once more than 200 feet thick, well levels have dropped
                by over 150 feet since the 1950s. Farmers who once drilled 100-foot wells now drill past 400 feet —
                when they can afford to drill at all. The water that remains is increasingly brackish, contaminated by
                minerals concentrated as volumes shrink.
              </p>

              {/* Pull Quote */}
              <blockquote className="border-l-4 border-accent pl-6 py-2 my-8">
                <p className="font-serif text-xl md:text-2xl italic text-foreground leading-snug">
                  "We're farming on borrowed water. Everyone knows it. Nobody wants to be the one who stops."
                </p>
                <cite className="block mt-3 text-sm font-sans text-muted-foreground not-italic">
                  — Jim Hargrove, fourth-generation farmer, Haskell County, Kansas
                </cite>
              </blockquote>

              <p className="font-sans text-base leading-[1.8] text-foreground/90">
                Our analysis of USGS monitoring data reveals that 47% of aquifers in the Western United States are now
                declining faster than they naturally recharge. In practical terms, this means the water being pumped
                today will not be available for future generations. It is, by any measure, a form of resource extraction
                — not sustainable use.
              </p>

              {/* Embedded Chart Placeholder */}
              <div className="bg-gw-surface border border-border rounded-sm p-6 my-8">
                <h3 className="font-sans font-semibold text-sm mb-3">Ogallala Aquifer Decline, 1950–2025</h3>
                <div className="bg-muted rounded-sm h-56 flex items-center justify-center">
                  <span className="text-sm font-sans text-muted-foreground">[Interactive Chart: Water Level Decline by Region]</span>
                </div>
                <p className="text-xs font-sans text-muted-foreground mt-3">
                  Source: USGS National Water Information System, 2025. Analysis by Groundwork.
                </p>
              </div>

              <h2 className="font-serif font-bold text-2xl mt-10 mb-4">The Human Cost</h2>

              <p className="font-sans text-base leading-[1.8] text-foreground/90">
                In Garden City, Kansas, the consequences of aquifer depletion are already reshaping daily life.
                The city's water treatment facility, built to serve 30,000 residents, now operates at the edge of
                capacity — not because the population has grown, but because the source water quality has deteriorated.
                Treatment costs have tripled in a decade.
              </p>

              <p className="font-sans text-base leading-[1.8] text-foreground/90">
                Small farming communities across the High Plains face an existential question: what happens when the
                water runs out? For some, that future is not hypothetical. In portions of western Kansas and the
                Oklahoma Panhandle, the aquifer has already been pumped below economically recoverable levels.
                Fields that once grew corn and wheat now lie fallow. Property values have cratered. Young people leave.
              </p>

              {/* Map Placeholder */}
              <div className="bg-gw-surface border border-border rounded-sm p-6 my-8">
                <h3 className="font-sans font-semibold text-sm mb-3">Aquifer Depletion Across the Western U.S.</h3>
                <div className="bg-muted rounded-sm h-64 flex items-center justify-center">
                  <span className="text-sm font-sans text-muted-foreground">[Interactive Map: Regional Aquifer Levels]</span>
                </div>
                <p className="text-xs font-sans text-muted-foreground mt-3">
                  Data: NASA GRACE satellite measurements, 2002–2025.
                </p>
              </div>

              <h2 className="font-serif font-bold text-2xl mt-10 mb-4">Policy Paralysis</h2>

              <p className="font-sans text-base leading-[1.8] text-foreground/90">
                Despite decades of warnings from hydrologists, meaningful policy action has been slow. Water rights
                in most Western states are governed by a doctrine of "first in time, first in right" — a legal
                framework designed for surface water in an era of abundance, now applied to finite underground reserves.
              </p>

              <blockquote className="border-l-4 border-accent pl-6 py-2 my-8">
                <p className="font-serif text-xl md:text-2xl italic text-foreground leading-snug">
                  "The legal framework was built for rivers. It was never designed to manage something you can't see."
                </p>
                <cite className="block mt-3 text-sm font-sans text-muted-foreground not-italic">
                  — Dr. Rebecca Torres, hydrologist, University of Arizona
                </cite>
              </blockquote>

              <p className="font-sans text-base leading-[1.8] text-foreground/90">
                Kansas has pioneered one approach: Local Enhanced Management Areas, or LEMAs, which allow farmers
                in a designated zone to collectively agree to reduce pumping. In Sheridan County, where the first
                LEMA was established in 2013, total water use has dropped by 20%. But aquifer levels have continued
                to fall — just more slowly. Critics argue the reductions are too modest, too late.
              </p>

              {/* Footnotes */}
              <div className="border-t border-border mt-12 pt-6">
                <h2 className="font-sans font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Footnotes</h2>
                <ol className="list-decimal list-inside space-y-2 text-sm font-sans text-muted-foreground">
                  <li>USGS, "Groundwater Depletion in the United States (1900–2025)," National Water-Use Science Project.</li>
                  <li>Scanlon, B.R. et al., "Global water resources monitoring with GRACE satellite data," <em>Water Resources Research</em>, 2024.</li>
                  <li>Kansas Department of Agriculture, Division of Water Resources, LEMA Annual Report, 2025.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8 lg:pt-0" aria-label="Article sidebar">
            {/* Table of Contents */}
            <nav className="hidden lg:block sticky top-20" aria-label="Article sections">
              <h2 className="font-sans font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                In This Article
              </h2>
              <ul className="space-y-2 border-l border-border pl-4">
                <li><a href="#" className="text-sm font-sans text-muted-foreground hover:text-foreground">A Crisis Beneath the Surface</a></li>
                <li><a href="#" className="text-sm font-sans text-muted-foreground hover:text-foreground">The Human Cost</a></li>
                <li><a href="#" className="text-sm font-sans text-muted-foreground hover:text-foreground">Policy Paralysis</a></li>
              </ul>
            </nav>
          </aside>
        </div>

        {/* Related Stories */}
        <section className="max-w-3xl mx-auto py-12 border-t border-border mt-12" aria-labelledby="related-heading">
          <h2 id="related-heading" className="font-serif font-bold text-xl mb-6">Related Investigations</h2>
          <ul className="space-y-4">
            {relatedStories.map((story) => (
              <li key={story.title}>
                <Link
                  to="/mass-media/article"
                  className="flex items-center justify-between gap-4 p-4 rounded-sm border border-border hover:bg-muted transition-colors group"
                >
                  <div>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-sans font-bold uppercase tracking-wider bg-muted text-muted-foreground rounded-sm mb-1">
                      {story.tag}
                    </span>
                    <h3 className="font-serif font-bold text-base group-hover:text-primary transition-colors">{story.title}</h3>
                  </div>
                  <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Support CTA */}
        <section className="max-w-3xl mx-auto pb-12" aria-labelledby="support-heading">
          <div className="bg-primary rounded-sm p-8 text-center">
            <h2 id="support-heading" className="font-serif font-bold text-2xl text-primary-foreground mb-3">
              Support This Reporting
            </h2>
            <p className="font-sans text-sm text-primary-foreground/70 max-w-md mx-auto mb-5">
              Investigations like this take months of work. Help us continue holding power accountable.
            </p>
            <Link
              to="/mass-media/subscribe"
              className="inline-flex items-center gap-2 px-6 py-3 font-sans font-semibold text-sm bg-accent text-accent-foreground rounded-sm hover:opacity-90 transition-opacity"
            >
              Donate Now <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </article>
    </Layout>
  );
}