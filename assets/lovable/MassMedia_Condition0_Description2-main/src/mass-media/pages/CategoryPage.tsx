import { Link } from "react-router-dom";
import storySeaLevel from "@/assets/mass-media/story-sealevel.jpg";
import storyWildfire from "@/assets/mass-media/story-wildfire.jpg";
import storyCarbon from "@/assets/mass-media/story-carbon.jpg";
import storyEnergy from "@/assets/mass-media/story-energy.jpg";

const leadStory = {
  img: storySeaLevel,
  tag: "Sea Level",
  title: "Rising Tides, Sinking Futures: The Gulf Coast's Vanishing Shoreline",
  deck: "A year-long investigation into how accelerating sea-level rise is displacing communities, destroying ecosystems, and redrawing America's coastline — with no federal plan in sight.",
  author: "Maria Santos",
  date: "March 22, 2026",
  readTime: "18 min read",
};

const stories = [
  { tag: "Wildfire", title: "The Burn Zone: Why Fire Seasons Are Getting Longer and Deadlier", author: "James Okoro", date: "March 18, 2026", readTime: "14 min", img: storyWildfire },
  { tag: "Carbon Markets", title: "Phantom Credits: Inside the Billion-Dollar Carbon Offset Scandal", author: "Priya Dasgupta", date: "March 14, 2026", readTime: "22 min", img: storyCarbon },
  { tag: "Energy", title: "The Grid That Wasn't Ready: How Texas Failed to Winterize — Again", author: "Alex Rivera", date: "March 10, 2026", readTime: "16 min", img: storyEnergy },
  { tag: "Permafrost", title: "Thawing Ground, Rising Mercury: The Arctic Feedback Loop", author: "Elena Kuznetsova", date: "March 6, 2026", readTime: "20 min", img: storyWildfire },
  { tag: "Water Policy", title: "Who Owns the Colorado River? A Legal Battle for the West's Future", author: "David Reyes", date: "March 2, 2026", readTime: "25 min", img: storySeaLevel },
];

const keyDocuments = [
  { title: "EPA Groundwater Assessment 2025", type: "PDF · 4.2 MB" },
  { title: "NOAA Sea Level Projections Update", type: "PDF · 2.8 MB" },
  { title: "Carbon Offset Registry Analysis (Dataset)", type: "CSV · 1.1 MB" },
  { title: "Western Water Rights Legal Brief", type: "PDF · 890 KB" },
];

export default function CategoryPage() {
  return (
    <div className="gw-section py-10 md:py-14">
      <div className="mb-8">
        <h1 className="gw-headline-xl mb-2">Climate</h1>
        <p className="gw-deck max-w-2xl">
          Investigating the systems, policies, and science shaping our climate future.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Lead story */}
          <Link to="/article" className="group block mb-10">
            <div className="overflow-hidden rounded-sm mb-4">
              <img
                src={leadStory.img}
                alt={leadStory.title}
                className="w-full h-64 md:h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                width={800}
                height={600}
              />
            </div>
            <span className="gw-tag mb-2 inline-block">{leadStory.tag}</span>
            <h2 className="gw-headline-lg mb-3 group-hover:text-primary transition-colors">{leadStory.title}</h2>
            <p className="gw-deck text-base mb-3">{leadStory.deck}</p>
            <p className="gw-meta text-xs">{leadStory.author} · {leadStory.date} · {leadStory.readTime}</p>
          </Link>

          <hr className="gw-rule mb-8" />

          {/* Story list */}
          <div className="space-y-8">
            {stories.map((story) => (
              <Link key={story.title} to="/article" className="group flex gap-5">
                <img
                  src={story.img}
                  alt={story.title}
                  className="w-28 h-28 md:w-36 md:h-28 object-cover rounded-sm flex-shrink-0"
                  loading="lazy"
                  width={800}
                  height={600}
                />
                <div>
                  <span className="gw-tag mb-1 inline-block text-[10px]">{story.tag}</span>
                  <h3 className="gw-headline-sm text-base mb-1 group-hover:text-primary transition-colors">{story.title}</h3>
                  <p className="gw-meta text-[11px]">{story.author} · {story.date} · {story.readTime}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Data viz preview */}
          <div className="mt-12 rounded-sm border gw-rule p-6 gw-surface-warm">
            <span className="gw-meta text-xs mb-3 block">Data Visualization</span>
            <h3 className="gw-headline-md mb-2">Global Temperature Anomaly Tracker</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Interactive chart showing monthly temperature departures from the 1951–1980 baseline, updated with the latest NOAA and NASA datasets.
            </p>
            <div className="h-40 rounded bg-muted flex items-center justify-center mb-4">
              <div className="flex items-end gap-1 h-24">
                {[28,35,42,38,50,55,48,62,58,70,65,72,68,75,80].map((h, i) => (
                  <div key={i} className="w-4 md:w-5 rounded-t transition-all" style={{ height: `${h}%`, background: `hsl(var(--gw-highlight) / ${0.4 + (h/120)})` }} />
                ))}
              </div>
            </div>
            <Link to="/article" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
              View Full Report →
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <aside>
          <div className="border gw-rule rounded-sm p-5 mb-8">
            <h3 className="gw-meta text-xs mb-4">Key Documents</h3>
            <ul className="space-y-4">
              {keyDocuments.map((doc) => (
                <li key={doc.title}>
                  <a href="#" className="group block">
                    <p className="font-sans text-sm font-medium group-hover:text-primary transition-colors">{doc.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{doc.type}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-sm p-5 gw-surface-dark">
            <h3 className="font-sans text-sm font-bold mb-2">Newsletter</h3>
            <p className="text-xs opacity-80 mb-4">Get our weekly climate briefing delivered to your inbox.</p>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-3 py-2 text-sm rounded bg-background/10 border border-border/20 text-foreground placeholder:opacity-50 mb-3"
            />
            <button className="w-full py-2 text-sm font-semibold rounded transition-opacity hover:opacity-90" style={{ background: "hsl(var(--gw-highlight))", color: "hsl(0 0% 100%)" }}>
              Subscribe
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
