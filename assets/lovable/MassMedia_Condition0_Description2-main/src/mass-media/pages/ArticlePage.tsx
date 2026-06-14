import { Link } from "react-router-dom";
import heroImg from "@/assets/mass-media/hero-groundwater.jpg";
import storyWildfire from "@/assets/mass-media/story-wildfire.jpg";
import storyCarbon from "@/assets/mass-media/story-carbon.jpg";
import storyEnergy from "@/assets/mass-media/story-energy.jpg";

const relatedStories = [
  { img: storyWildfire, tag: "Wildfire", title: "The Burn Zone: Why Fire Seasons Are Getting Longer", author: "James Okoro" },
  { img: storyCarbon, tag: "Carbon Markets", title: "Phantom Credits: Inside the Carbon Offset Scandal", author: "Priya Dasgupta" },
  { img: storyEnergy, tag: "Energy", title: "The Grid That Wasn't Ready: Texas Failed Again", author: "Alex Rivera" },
];

export default function ArticlePage() {
  return (
    <article>
      {/* Hero */}
      <div className="relative h-[50vh] md:h-[65vh]">
        <img src={heroImg} alt="Cracked earth" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Article header */}
      <div className="gw-section max-w-3xl -mt-32 relative z-10 mb-10">
        <span className="gw-tag mb-4 inline-block">Featured Investigation</span>
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-4" style={{ color: "hsl(var(--gw-surface-dark-fg))" }}>
          The Invisible Flood: How Groundwater Collapse Is Reshaping the American West
        </h1>
        <p className="font-sans text-lg md:text-xl leading-relaxed mb-6" style={{ color: "hsl(var(--gw-surface-dark-fg) / 0.85)" }}>
          Beneath the surface of the drought-stricken West, a hidden crisis is accelerating — and millions of Americans have no idea their water supply is running out.
        </p>
      </div>

      {/* Byline */}
      <div className="gw-section max-w-3xl mb-10">
        <div className="flex items-center gap-4 pb-6 border-b gw-rule">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-sans font-bold text-muted-foreground">SC</div>
          <div>
            <p className="font-sans text-sm font-semibold">Sarah Chen & David Reyes</p>
            <p className="gw-meta text-[11px]">Published March 24, 2026 · 32 min read</p>
          </div>
        </div>
      </div>

      {/* Methodology note */}
      <div className="gw-section max-w-3xl mb-10">
        <div className="gw-surface-warm rounded-sm p-5 border gw-rule">
          <h4 className="font-sans text-sm font-bold mb-2">How We Reported This</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This investigation is based on 14 months of reporting, including analysis of USGS well monitoring data from 8,400 sites across 12 states, interviews with 47 hydrologists and water policy experts, and review of thousands of pages of state and federal water-rights documents. Our methodology and data are available for peer review.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="gw-section max-w-3xl">
        <div className="gw-body space-y-6">
          <p>
            In the small farming community of Paso Robles, California, wells that once reached water at 200 feet now must drill past 1,000. The aquifer beneath the Salinas Valley — sometimes called the "salad bowl of the world" — is dropping by as much as six feet per year. And across the broader American West, from the Ogallala Aquifer under the Great Plains to the basins beneath Arizona's sprawling suburbs, the story is the same: water that took millennia to accumulate is being extracted in decades.
          </p>
          <p>
            Yet unlike a drought-parched reservoir or a receding glacier, groundwater decline is invisible. There are no dramatic photographs, no satellite imagery that makes cable news. The crisis unfolds slowly, underground, measured in well logs and pump tests rather than fire lines or floodwaters.
          </p>

          {/* Pull quote */}
          <blockquote className="gw-pull-quote my-10">
            "We're mining water that fell as rain during the last Ice Age. Once it's gone, it's gone for generations — maybe forever."
            <footer className="font-sans text-sm mt-3 not-italic text-muted-foreground">
              — Dr. Elena Vásquez, USGS Hydrologist
            </footer>
          </blockquote>

          <p>
            The consequences are already being felt. In Kansas, the Ogallala has declined by more than 150 feet in some areas, forcing farmers to abandon irrigated agriculture. In Arizona, entire neighborhoods have lost access to well water, with homeowners forced to rely on trucked-in supplies. And in California's Central Valley, land subsidence from over-pumping has caused the ground itself to sink by as much as 28 feet, permanently reducing the aquifer's capacity to store water.
          </p>

          {/* Embedded chart */}
          <div className="my-10 p-6 rounded-sm border gw-rule gw-surface-warm">
            <h4 className="font-sans text-sm font-bold mb-1">Ogallala Aquifer Decline, 1950–2025</h4>
            <p className="text-xs text-muted-foreground mb-4">Estimated saturated thickness change by decade (feet)</p>
            <div className="flex items-end gap-2 h-36">
              {[
                { decade: "'50s", val: 95 },
                { decade: "'60s", val: 88 },
                { decade: "'70s", val: 78 },
                { decade: "'80s", val: 68 },
                { decade: "'90s", val: 60 },
                { decade: "'00s", val: 50 },
                { decade: "'10s", val: 38 },
                { decade: "'20s", val: 25 },
              ].map((d) => (
                <div key={d.decade} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t transition-all"
                    style={{ height: `${d.val}%`, background: `hsl(var(--primary) / ${0.3 + d.val / 150})` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{d.decade}</span>
                </div>
              ))}
            </div>
          </div>

          <p>
            Federal oversight of groundwater remains fractured. Unlike surface water, which is managed under interstate compacts and federal reclamation law, groundwater is largely governed by a patchwork of state and local regulations — many of which date to an era when the resource was assumed to be inexhaustible.
          </p>
          <p>
            The 2014 Sustainable Groundwater Management Act (SGMA) in California was hailed as a landmark. But more than a decade later, enforcement remains weak, deadlines have been pushed back, and many of the state's most critical basins have yet to adopt enforceable sustainability plans.
          </p>

          {/* Embedded map placeholder */}
          <div className="my-10 p-6 rounded-sm border gw-rule bg-muted">
            <h4 className="font-sans text-sm font-bold mb-1">Critical Groundwater Basins in the Western U.S.</h4>
            <p className="text-xs text-muted-foreground mb-4">Basins in red have declined more than 50% since monitoring began</p>
            <div className="h-48 rounded bg-muted-foreground/5 flex items-center justify-center">
              <span className="text-sm text-muted-foreground italic">[Interactive map — data visualization]</span>
            </div>
          </div>

          <p>
            "What we're seeing is a tragedy of the commons playing out in slow motion," says Dr. Robert Glennon, a water law professor at the University of Arizona. "Every individual farmer, every municipality, every developer is acting rationally from their own perspective. But collectively, we're draining the bank account."
          </p>

          {/* Footnotes */}
          <div className="mt-12 pt-6 border-t gw-rule">
            <h4 className="font-sans text-sm font-bold mb-3">Notes & Sources</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>USGS National Water Information System, groundwater level data accessed January 2026.</li>
              <li>Scanlon, B.R., et al. "Groundwater depletion and sustainability of irrigation in the US High Plains and Central Valley." PNAS, 2012.</li>
              <li>California Department of Water Resources, SGMA Implementation Progress Report, 2025.</li>
              <li>Famiglietti, J.S. "The global groundwater crisis." Nature Climate Change, 2014.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Related investigations */}
      <section className="gw-section py-12 mt-10 border-t gw-rule">
        <h2 className="gw-headline-lg mb-8">Related Investigations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {relatedStories.map((story) => (
            <Link key={story.title} to="/article" className="group">
              <img src={story.img} alt={story.title} className="w-full h-44 object-cover rounded-sm mb-3" loading="lazy" width={800} height={600} />
              <span className="gw-tag mb-1 inline-block text-[10px]">{story.tag}</span>
              <h3 className="gw-headline-sm text-base group-hover:text-primary transition-colors">{story.title}</h3>
              <p className="gw-meta text-[11px] mt-1">{story.author}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Support CTA */}
      <section className="gw-surface-warm py-12">
        <div className="gw-section text-center max-w-xl mx-auto">
          <h3 className="gw-headline-md mb-3">Support This Reporting</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Investigations like this take months of dedicated reporting. Your contribution makes it possible.
          </p>
          <Link
            to="/subscribe"
            className="inline-flex items-center px-8 py-3 font-sans text-sm font-bold rounded transition-opacity hover:opacity-90"
            style={{ background: "hsl(var(--gw-highlight))", color: "hsl(0 0% 100%)" }}
          >
            Donate Now
          </Link>
        </div>
      </section>
    </article>
  );
}
