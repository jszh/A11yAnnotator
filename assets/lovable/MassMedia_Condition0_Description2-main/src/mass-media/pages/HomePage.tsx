import { Link } from "react-router-dom";
import heroImg from "@/assets/mass-media/hero-groundwater.jpg";
import storySeaLevel from "@/assets/mass-media/story-sealevel.jpg";
import storyWildfire from "@/assets/mass-media/story-wildfire.jpg";
import storyCarbon from "@/assets/mass-media/story-carbon.jpg";

const latestInvestigations = [
  {
    img: storySeaLevel,
    tag: "Sea Level",
    title: "Rising Tides, Sinking Futures: The Gulf Coast's Vanishing Shoreline",
    deck: "A year-long investigation into how accelerating sea-level rise is displacing communities and redrawing America's coastline.",
    author: "Maria Santos",
    date: "March 22, 2026",
    readTime: "18 min read",
  },
  {
    img: storyWildfire,
    tag: "Wildfire",
    title: "The Burn Zone: Why Fire Seasons Are Getting Longer and Deadlier",
    deck: "New data reveals a disturbing pattern: wildfires are burning hotter, faster, and in places they've never reached before.",
    author: "James Okoro",
    date: "March 18, 2026",
    readTime: "14 min read",
  },
  {
    img: storyCarbon,
    tag: "Carbon Markets",
    title: "Phantom Credits: Inside the Billion-Dollar Carbon Offset Scandal",
    deck: "Our analysis of 2,400 offset projects found that more than a third failed to deliver measurable climate benefits.",
    author: "Priya Dasgupta",
    date: "March 14, 2026",
    readTime: "22 min read",
  },
];

const stats = [
  { number: "1.7M", label: "Acre-feet of groundwater lost annually in the Colorado Basin" },
  { number: "47%", label: "Of Western wells showing critical decline since 2015" },
  { number: "12", label: "States where aquifer collapse threatens drinking water" },
  { number: "$8.2B", label: "Estimated annual economic loss from groundwater depletion" },
];

const categories = ["Climate", "Energy", "Policy", "Science", "Data"];

export default function HomePage() {
  return (
    <div>
      {/* Hero Feature */}
      <section className="relative">
        <div className="relative h-[70vh] md:h-[85vh] overflow-hidden">
          <img
            src={heroImg}
            alt="Cracked dry earth in the American West"
            className="absolute inset-0 w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
            <div className="max-w-4xl">
              <span className="gw-meta text-accent mb-3 block" style={{ color: "hsl(var(--gw-highlight))" }}>
                Featured Investigation
              </span>
              <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-4" style={{ color: "hsl(var(--gw-surface-dark-fg))" }}>
                The Invisible Flood: How Groundwater Collapse Is Reshaping the American West
              </h1>
              <p className="font-sans text-base md:text-lg leading-relaxed mb-6 max-w-2xl opacity-90" style={{ color: "hsl(var(--gw-surface-dark-fg))" }}>
                Beneath the surface of the drought-stricken West, a hidden crisis is accelerating.
                Our 14-month investigation reveals how decades of over-pumping have pushed aquifers
                past the point of recovery.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  to="/article"
                  className="inline-flex items-center px-6 py-3 font-sans text-sm font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Read the Investigation →
                </Link>
                <span className="font-sans text-sm opacity-70" style={{ color: "hsl(var(--gw-surface-dark-fg))" }}>
                  By Sarah Chen & David Reyes · 32 min read
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Nav */}
      <section className="border-b gw-rule">
        <div className="gw-section py-4 flex items-center gap-6 overflow-x-auto">
          {categories.map((cat) => (
            <Link
              key={cat}
              to="/category/climate"
              className="gw-meta whitespace-nowrap hover:text-primary transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Investigations */}
      <section className="gw-section py-12 md:py-16">
        <h2 className="gw-headline-lg mb-8">Latest Investigations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {latestInvestigations.map((story) => (
            <Link key={story.title} to="/article" className="group">
              <div className="overflow-hidden rounded-sm mb-4">
                <img
                  src={story.img}
                  alt={story.title}
                  className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  width={800}
                  height={600}
                />
              </div>
              <span className="gw-tag mb-2 inline-block">{story.tag}</span>
              <h3 className="gw-headline-sm mb-2 group-hover:text-primary transition-colors">{story.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{story.deck}</p>
              <p className="gw-meta text-xs">
                {story.author} · {story.date} · {story.readTime}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* By the Numbers */}
      <section className="gw-surface-warm py-16 md:py-20">
        <div className="gw-section">
          <h2 className="gw-meta text-center mb-12">By the Numbers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.number} className="text-center">
                <div className="gw-stat-number mb-3">{stat.number}</div>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation CTA */}
      <section className="gw-surface-dark py-16 md:py-20">
        <div className="gw-section text-center max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Independent Journalism Needs Your Support
          </h2>
          <p className="font-sans text-base leading-relaxed opacity-80 mb-8">
            Groundwork is entirely reader-funded. No corporate sponsors.
            No paywalls. Every dollar directly funds investigative reporting
            on the environmental issues that matter most.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/subscribe"
              className="inline-flex items-center px-8 py-3 font-sans text-sm font-bold rounded transition-opacity hover:opacity-90"
              style={{ background: "hsl(var(--gw-highlight))", color: "hsl(0 0% 100%)" }}
            >
              Become a Supporter
            </Link>
            <span className="font-sans text-sm opacity-60">Starting at $7/month</span>
          </div>
        </div>
      </section>
    </div>
  );
}
