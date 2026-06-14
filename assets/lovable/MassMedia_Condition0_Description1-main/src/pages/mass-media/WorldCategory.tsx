import { useState } from "react";
import { Link } from "react-router-dom";
import MediaLayout from "@/components/mass-media/MediaLayout";
import StoryCard from "@/components/mass-media/StoryCard";
import heroRedsea from "@/assets/hero-redsea.jpg";
import storyPolitics from "@/assets/story-politics.jpg";
import storyTech from "@/assets/story-tech.jpg";
import storyCulture from "@/assets/story-culture.jpg";
import storyClimate from "@/assets/story-climate.jpg";
import heroUn from "@/assets/hero-un.jpg";

const filters = ["All", "Asia", "Europe", "Americas", "Middle East", "Africa"];

const stories = [
  { image: heroRedsea, category: "Middle East", headline: "Red Sea Crisis Deepens as Coalition Forces Respond to Attacks", byline: "Catherine Holloway", timestamp: "2 hours ago", summary: "International naval coalition expands operations as maritime security deteriorates." },
  { image: storyPolitics, category: "Europe", headline: "EU Parliament Passes Landmark Digital Rights Act", byline: "Sofia Marchetti", timestamp: "3 hours ago", summary: "The legislation will reshape how tech companies operate across the bloc." },
  { image: heroUn, category: "Americas", headline: "Brazil's Amazon Deforestation Rate Hits 15-Year Low", byline: "Luisa Fernandes", timestamp: "4 hours ago", summary: "Environmental policies yield results as satellite data shows dramatic decline." },
  { image: storyTech, category: "Asia", headline: "Japan's Semiconductor Strategy Reshapes Pacific Trade", byline: "Kenji Watanabe", timestamp: "5 hours ago", summary: "Tokyo's investment in chip manufacturing draws both allies and rivals closer." },
  { image: storyCulture, category: "Europe", headline: "Venice Biennale Opens With Bold Climate Statement", byline: "Amara Osei", timestamp: "6 hours ago", summary: "This year's exhibition confronts ecological loss through immersive installations." },
  { image: storyClimate, category: "Africa", headline: "Sahel Region Faces Unprecedented Humanitarian Challenge", byline: "Ibrahim Diallo", timestamp: "7 hours ago", summary: "Conflict and climate change combine to displace millions across West Africa." },
  { image: heroRedsea, category: "Middle East", headline: "Iran Nuclear Talks Enter Critical Phase in Vienna", byline: "David Kessler", timestamp: "8 hours ago", summary: "Diplomats report cautious optimism as new proposals emerge." },
  { image: storyPolitics, category: "Asia", headline: "India's Opposition Forms Unexpected Coalition", byline: "Priya Sharma", timestamp: "9 hours ago", summary: "Historic alliance could reshape the country's political landscape." },
];

const WorldCategory = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = activeFilter === "All"
    ? stories
    : stories.filter(s => s.category === activeFilter);

  return (
    <MediaLayout>
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-10">
          <div className="border-b-2 border-accent pb-4 mb-2">
            <h1 className="headline-xl">World</h1>
            <p className="text-muted-foreground font-sans mt-2">
              Comprehensive coverage of international affairs, diplomacy, and global events.
            </p>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`category-pill whitespace-nowrap ${activeFilter === f ? "category-pill-active" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lead story */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-10">
          <Link to="/mass-media/article" className="group grid lg:grid-cols-2 gap-8 items-center">
            <div className="overflow-hidden aspect-[16/9]">
              <img src={heroRedsea} alt="Lead story" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div>
              <span className="section-label text-accent">Lead Story</span>
              <h2 className="headline-lg mt-2 group-hover:text-accent transition-colors">
                Red Sea Crisis: How Maritime Tensions Are Redrawing Global Trade Routes
              </h2>
              <p className="text-muted-foreground font-sans mt-3">
                As attacks on commercial vessels escalate, shipping companies are rerouting around 
                Africa, adding weeks to delivery times and billions in costs.
              </p>
              <div className="mt-4 byline">
                <span>By Catherine Holloway</span>
                <span className="mx-2">·</span>
                <span>March 15, 2026</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Story grid */}
      <section className="bg-card">
        <div className="container mx-auto px-4 py-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((story, i) => (
              <StoryCard key={i} {...story} />
            ))}
          </div>
        </div>
      </section>
    </MediaLayout>
  );
};

export default WorldCategory;
