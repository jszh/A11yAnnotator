import { Link } from "react-router-dom";
import MediaLayout from "@/components/mass-media/MediaLayout";
import StoryCard from "@/components/mass-media/StoryCard";
import heroRedsea from "@/assets/hero-redsea.jpg";
import storyPolitics from "@/assets/story-politics.jpg";
import storyTech from "@/assets/story-tech.jpg";
import storyCulture from "@/assets/story-culture.jpg";
import storyClimate from "@/assets/story-climate.jpg";
import heroUn from "@/assets/hero-un.jpg";

const mostRead = [
  "Red Sea Crisis: What It Means for Global Shipping",
  "The AI Regulation Debate Europe Can't Afford to Lose",
  "Inside the Secret Negotiations Over Arctic Mining Rights",
  "Why Gen Z Is Abandoning Social Media",
  "The Hidden Cost of Fast Fashion's Greenwashing",
];

const secondaryStories = [
  {
    image: storyPolitics,
    category: "Politics",
    headline: "EU Parliament Passes Landmark Digital Rights Act After Months of Debate",
    byline: "Sofia Marchetti",
    timestamp: "3 hours ago",
    summary: "The sweeping legislation will reshape how tech companies operate across the bloc.",
  },
  {
    image: storyTech,
    category: "Technology",
    headline: "Silicon Valley's Quiet Pivot: Why Big Tech Is Betting on Nuclear Energy",
    byline: "James Whitford",
    timestamp: "5 hours ago",
    summary: "Major tech firms are investing billions in small modular reactors to power AI data centers.",
  },
  {
    image: storyCulture,
    category: "Culture",
    headline: "The Venice Biennale Opens With a Bold Statement on Climate Grief",
    byline: "Amara Osei",
    timestamp: "6 hours ago",
    summary: "This year's exhibition confronts ecological loss through immersive installations.",
  },
  {
    image: storyClimate,
    category: "World",
    headline: "Record Turnout at Global Climate Marches Signals Shift in Public Urgency",
    byline: "Raj Patel",
    timestamp: "8 hours ago",
    summary: "Millions take to the streets demanding binding emission targets before COP31.",
  },
];

const sectionStories: Record<string, { headline: string; timestamp: string }[]> = {
  World: [
    { headline: "China's Belt and Road Initiative Enters Its Next Phase", timestamp: "2h ago" },
    { headline: "Mediterranean Migration Routes Shift Amid Political Turmoil", timestamp: "4h ago" },
    { headline: "Brazil's Amazon Deforestation Rate Hits 15-Year Low", timestamp: "5h ago" },
  ],
  Politics: [
    { headline: "Senate Confirms New Supreme Court Justice in Narrow Vote", timestamp: "1h ago" },
    { headline: "UK Labour Party Faces Internal Split Over Defence Spending", timestamp: "3h ago" },
    { headline: "India's Opposition Forms Unexpected Coalition Ahead of State Elections", timestamp: "6h ago" },
  ],
  Tech: [
    { headline: "OpenAI Announces New Model That Can 'Reason' Through Scientific Problems", timestamp: "30m ago" },
    { headline: "EU Fines Meta €2.3 Billion for Data Privacy Violations", timestamp: "2h ago" },
    { headline: "Quantum Computing Milestone: First Error-Corrected Calculation Achieved", timestamp: "7h ago" },
  ],
};

const MediaHome = () => (
  <MediaLayout>
    {/* Hero section */}
    <section className="bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main hero */}
          <div className="lg:col-span-2">
            <Link to="/mass-media/article" className="group block">
              <div className="overflow-hidden aspect-[16/9]">
                <img
                  src={heroRedsea}
                  alt="Red Sea naval vessels"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="mt-5">
                <span className="section-label text-breaking">Breaking News</span>
                <h2 className="headline-xl mt-2 group-hover:text-accent transition-colors">
                  UN Emergency Session Called as Red Sea Tensions Reach Breaking Point
                </h2>
                <p className="body-text text-muted-foreground mt-3 max-w-2xl">
                  The Security Council convenes an emergency meeting as maritime attacks escalate, threatening 
                  global trade routes and raising fears of a wider regional conflict.
                </p>
                <div className="mt-4 flex items-center gap-3 byline">
                  <span>By Catherine Holloway</span>
                  <span>·</span>
                  <span>12 min read</span>
                  <span>·</span>
                  <span>March 15, 2026</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Most read sidebar */}
          <div className="lg:border-l lg:border-border lg:pl-8">
            <h3 className="section-label text-accent mb-6">Most Read</h3>
            <ol className="space-y-5">
              {mostRead.map((title, i) => (
                <li key={i}>
                  <Link to="/mass-media/article" className="group flex gap-4">
                    <span className="font-serif text-3xl font-bold text-muted-foreground/30 leading-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="headline-sm text-base group-hover:text-accent transition-colors leading-snug">
                      {title}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>

    {/* Secondary stories grid */}
    <section className="bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {secondaryStories.map((story, i) => (
            <StoryCard key={i} {...story} />
          ))}
        </div>
      </div>
    </section>

    {/* Section strips */}
    <section className="bg-card">
      <div className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(sectionStories).map(([section, stories]) => (
            <div key={section}>
              <div className="flex items-center justify-between mb-5 border-b-2 border-accent pb-2">
                <h3 className="section-label text-foreground">{section}</h3>
                <Link to="/mass-media/world" className="text-xs font-sans text-accent font-semibold hover:underline">
                  See all →
                </Link>
              </div>
              <ul className="space-y-4">
                {stories.map((s, i) => (
                  <li key={i} className="border-b border-border pb-4 last:border-0">
                    <Link to="/mass-media/article" className="group">
                      <h4 className="font-serif text-base font-semibold group-hover:text-accent transition-colors leading-snug">
                        {s.headline}
                      </h4>
                      <span className="text-xs text-muted-foreground font-sans mt-1 block">{s.timestamp}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Editorial feature */}
    <section className="bg-primary">
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="section-label text-accent">The Long Read</span>
            <h2 className="headline-xl text-primary-foreground mt-3">
              The Invisible War: How Cyber Attacks Are Reshaping Geopolitics
            </h2>
            <p className="text-primary-foreground/70 font-sans text-lg mt-4 leading-relaxed">
              From power grids to elections, state-sponsored hackers are waging a quiet conflict 
              that threatens the foundations of democratic governance.
            </p>
            <Link
              to="/mass-media/article"
              className="inline-block mt-6 bg-accent text-accent-foreground px-6 py-3 font-sans text-sm font-bold uppercase tracking-wider hover:bg-amber-light transition-colors"
            >
              Read the full investigation
            </Link>
          </div>
          <div className="overflow-hidden">
            <img src={heroUn} alt="Geopolitics" className="w-full aspect-[4/3] object-cover" />
          </div>
        </div>
      </div>
    </section>
  </MediaLayout>
);

export default MediaHome;
