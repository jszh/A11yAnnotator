import { Link } from "react-router-dom";
import Layout from "@/components/mass-media/Layout";
import { Clock, Share2, BookOpen, ArrowRight, Heart } from "lucide-react";

const relatedStories = [
  { title: "The Phantom Credits: How Carbon Offset Fraud Undermines Climate Action", tag: "Carbon Markets" },
  { title: "Smoke Season Is Now Year-Round in the Pacific Northwest", tag: "Wildfire" },
  { title: "Permafrost Is Thawing 70 Years Ahead of Schedule", tag: "Arctic" },
];

const ArticlePage = () => (
  <Layout>
    {/* Article header */}
    <header className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-8">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/mass-media/category/climate" className="font-sans text-xs font-semibold uppercase tracking-wider text-editorial-green-light hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
          Climate
        </Link>
        <span className="flex items-center gap-1 font-sans text-xs text-muted-foreground">
          <Clock className="w-3 h-3" /> 22 min read
        </span>
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
        The Invisible Flood: How Groundwater Collapse Is Reshaping the American West
      </h1>
      <p className="mt-4 font-serif text-lg sm:text-xl text-muted-foreground italic leading-relaxed">
        Beneath the surface of the nation's most productive farmland, a crisis decades in the making is reaching its tipping point. Our year-long investigation reveals the scope — and who profits from inaction.
      </p>

      {/* Byline */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-border">
        <div>
          <div className="font-sans text-sm font-semibold text-foreground">By Sarah Thornton & David Liu</div>
          <div className="font-sans text-xs text-muted-foreground">March 20, 2026 · Updated March 22, 2026</div>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <button className="p-2 rounded border border-border hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Share article">
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="p-2 rounded border border-border hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Save article">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>

    {/* Article body */}
    <article className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
      {/* Methodology */}
      <aside className="bg-editorial-cream border border-border rounded-lg p-5 mb-8" aria-label="Methodology note">
        <h2 className="font-sans text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-2">How We Reported This</h2>
        <p className="font-sans text-sm text-muted-foreground leading-relaxed">
          This investigation is based on 18 months of reporting, including analysis of USGS groundwater monitoring data from 4,200 wells across 11 states, interviews with 85 farmers, hydrologists, and policymakers, and review of corporate water rights filings obtained through public records requests.
        </p>
      </aside>

      {/* Body content */}
      <div className="prose prose-lg max-w-none">
        <p className="font-serif text-lg text-foreground leading-relaxed mb-6">
          In the small farming town of Sublette, Kansas, population 1,453, the ground is sinking. Not dramatically — not in the catastrophic way that swallows homes in Florida sinkholes or collapses streets in Mexico City. Here, the subsidence is measured in inches per year, a slow-motion geological emergency that most residents can't see but all of them feel.
        </p>

        <p className="font-serif text-lg text-foreground leading-relaxed mb-6">
          The Ogallala Aquifer, one of the world's largest underground freshwater reserves, has sustained agriculture across eight states for more than a century. It made the Great Plains bloom, transforming arid grassland into one of the most productive food-producing regions on Earth. But the water is running out — and it's running out far faster than anyone publicly admits.
        </p>

        {/* Pull quote */}
        <blockquote className="border-l-4 border-editorial-amber pl-6 my-10">
          <p className="font-serif text-xl sm:text-2xl text-foreground italic leading-relaxed">
            "We're mining water that took ten thousand years to accumulate, and we're doing it in a generation. There's no technology that fixes this. The water is simply gone."
          </p>
          <cite className="block mt-3 font-sans text-sm text-muted-foreground not-italic">
            — Dr. Robert Buddemeier, Kansas Geological Survey (retired)
          </cite>
        </blockquote>

        <p className="font-serif text-lg text-foreground leading-relaxed mb-6">
          According to our analysis of U.S. Geological Survey data, the Ogallala has lost an estimated 410 cubic kilometers of water since large-scale irrigation began in the 1950s. In parts of western Kansas and the Texas Panhandle, the water table has dropped more than 150 feet. Wells that once reached water at 30 feet now must drill past 300.
        </p>

        {/* Embedded chart placeholder */}
        <figure className="my-10">
          <div className="bg-muted rounded-lg aspect-[16/9] flex items-center justify-center border border-border">
            <div className="text-center p-8">
              <div className="flex justify-center items-end gap-2 mb-4">
                {[95, 88, 75, 68, 55, 42, 35, 28, 20].map((h, i) => (
                  <div key={i} className="w-6 sm:w-8 rounded-t transition-all" style={{ height: `${h * 1.5}px`, backgroundColor: `hsl(160, 45%, ${18 + i * 4}%)` }} />
                ))}
              </div>
              <div className="flex justify-between font-sans text-xs text-muted-foreground">
                <span>1950</span>
                <span>2026</span>
              </div>
            </div>
          </div>
          <figcaption className="mt-2 font-sans text-sm text-muted-foreground text-center">
            Fig. 1: Ogallala Aquifer water levels, 1950–2026. Data: USGS National Water Information System.
          </figcaption>
        </figure>

        <h2 className="font-serif text-2xl font-bold text-foreground mt-10 mb-4">The Corporate Water Rush</h2>

        <p className="font-serif text-lg text-foreground leading-relaxed mb-6">
          While family farms struggle with dwindling wells, a different story is unfolding in county water rights offices. Over the past decade, corporate agricultural operations and investment funds have been quietly acquiring water rights across the Ogallala region. Our review of water rights transfers in Kansas, Texas, and Nebraska found that corporate entities now control approximately 23% of all active irrigation permits — up from just 8% in 2010.
        </p>

        {/* Map placeholder */}
        <figure className="my-10">
          <div className="bg-muted rounded-lg aspect-[4/3] flex items-center justify-center border border-border">
            <div className="text-center">
              <p className="font-sans text-sm text-muted-foreground">Interactive Map: Corporate Water Rights Acquisitions, 2010–2026</p>
              <p className="font-sans text-xs text-editorial-green-light mt-1">[Interactive visualization]</p>
            </div>
          </div>
          <figcaption className="mt-2 font-sans text-sm text-muted-foreground text-center">
            Fig. 2: Geographic distribution of corporate water rights purchases across the Ogallala Aquifer region.
          </figcaption>
        </figure>

        <p className="font-serif text-lg text-foreground leading-relaxed mb-6">
          The consequences are already being felt. In Haskell County, Kansas, where corporate operations have concentrated their pumping, the water table dropped 12 feet in a single year — more than triple the regional average. Small farmers nearby watched their wells go dry, unable to compete with operations pumping millions of gallons per day.
        </p>

        {/* Pull quote 2 */}
        <blockquote className="border-l-4 border-editorial-amber pl-6 my-10">
          <p className="font-serif text-xl sm:text-2xl text-foreground italic leading-relaxed">
            "My grandfather dug the first well on this land in 1947. We've farmed it for three generations. Now I'm the one who has to tell my kids there's no water left."
          </p>
          <cite className="block mt-3 font-sans text-sm text-muted-foreground not-italic">
            — Tom Becker, fifth-generation farmer, Sublette, Kansas
          </cite>
        </blockquote>

        <h2 className="font-serif text-2xl font-bold text-foreground mt-10 mb-4">Policy Paralysis</h2>

        <p className="font-serif text-lg text-foreground leading-relaxed mb-6">
          Despite decades of warnings from hydrologists, meaningful regulation of groundwater extraction remains elusive. Kansas, the state with perhaps the most advanced groundwater management framework, still relies largely on voluntary conservation districts that lack enforcement power. Texas, governed by the "rule of capture," essentially treats groundwater as the property of whoever can pump it fastest.
        </p>

        <p className="font-serif text-lg text-foreground leading-relaxed mb-6">
          Federal action has been similarly absent. The 2024 Farm Bill allocated $2.3 billion for water conservation programs — a fraction of what experts say is needed. Meanwhile, subsidized crop insurance continues to incentivize water-intensive agriculture in regions where sustainable farming may no longer be possible.
        </p>

        {/* Footnotes */}
        <div className="mt-12 pt-6 border-t border-border">
          <h3 className="font-sans text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">Notes & Sources</h3>
          <ol className="list-decimal pl-5 space-y-2 font-sans text-sm text-muted-foreground">
            <li>USGS National Water Information System, accessed February 2026. Well monitoring data for Kansas, Texas, Nebraska, Oklahoma, Colorado, New Mexico, South Dakota, and Wyoming.</li>
            <li>Kansas Department of Agriculture, Division of Water Resources. Water rights transfer records, 2010–2025.</li>
            <li>Scanlon, B.R., et al. "Groundwater depletion and sustainability of irrigation in the US High Plains and Central Valley." PNAS, 2012.</li>
            <li>Congressional Budget Office. "Federal Crop Insurance: Costs and Policy Options." September 2025.</li>
          </ol>
        </div>
      </div>

      {/* Related investigations */}
      <section className="mt-16 pt-10 border-t border-border">
        <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Related Investigations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {relatedStories.map((story) => (
            <Link
              key={story.title}
              to="/mass-media/article"
              className="group block bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="aspect-video bg-muted flex items-center justify-center">
                <span className="font-sans text-xs text-muted-foreground uppercase tracking-wider">{story.tag}</span>
              </div>
              <div className="p-4">
                <span className="font-sans text-xs font-semibold uppercase tracking-wider text-editorial-green-light">{story.tag}</span>
                <h3 className="font-serif text-sm font-bold text-foreground mt-1 group-hover:text-editorial-green-light transition-colors leading-snug">
                  {story.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Support widget */}
      <section className="mt-16 bg-editorial-cream border border-border rounded-xl p-8 text-center">
        <Heart className="w-8 h-8 text-editorial-amber mx-auto mb-3" />
        <h2 className="font-serif text-xl font-bold text-foreground">Support This Reporting</h2>
        <p className="mt-2 font-sans text-sm text-muted-foreground max-w-md mx-auto">
          Investigations like this take months of work. Your tax-deductible donation keeps Groundwork independent and free for everyone.
        </p>
        <Link
          to="/mass-media/subscribe"
          className="inline-flex items-center gap-2 mt-5 bg-primary text-primary-foreground font-sans font-semibold text-sm px-6 py-3 rounded hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Donate Now <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </article>
  </Layout>
);

export default ArticlePage;
