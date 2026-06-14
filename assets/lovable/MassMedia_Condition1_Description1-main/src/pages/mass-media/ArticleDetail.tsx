import { Link } from "react-router-dom";
import MediaLayout from "@/components/mass-media/MediaLayout";
import heroRedsea from "@/assets/hero-redsea.jpg";
import storyPolitics from "@/assets/story-politics.jpg";
import storyTech from "@/assets/story-tech.jpg";
import storyCulture from "@/assets/story-culture.jpg";

const relatedStories = [
  { image: storyPolitics, title: "EU Weighs Military Response to Red Sea Attacks", category: "Politics" },
  { image: storyTech, title: "How Satellite Technology Is Tracking Maritime Threats", category: "Tech" },
  { image: storyCulture, title: "The Human Cost: Seafarers Caught in Geopolitical Crossfire", category: "World" },
];

const ArticleDetail = () => (
  <MediaLayout>
    {/* Article header */}
    <article className="bg-card">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <span className="section-label text-accent">World</span>
          <h1 className="headline-xl mt-3">
            UN Emergency Session Called as Red Sea Tensions Reach Breaking Point
          </h1>
          <p className="font-sans text-xl text-muted-foreground mt-4 leading-relaxed">
            The Security Council convenes amid escalating maritime attacks, with diplomats warning 
            that failure to act could trigger a wider regional conflict with global economic consequences.
          </p>

          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-border">
            <div>
              <p className="font-sans text-sm font-bold">Catherine Holloway</p>
              <p className="font-sans text-xs text-muted-foreground">
                March 15, 2026 · 12 min read
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            {["Red Sea", "UN", "Geopolitics", "Maritime"].map(tag => (
              <span key={tag} className="bg-secondary text-secondary-foreground px-3 py-1 text-xs font-sans font-semibold uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hero image */}
      <div className="w-full">
        <img src={heroRedsea} alt="Naval vessels in the Red Sea" className="w-full max-h-[60vh] object-cover" />
        <div className="container mx-auto px-4">
          <p className="max-w-3xl mx-auto text-xs text-muted-foreground font-sans mt-2 italic">
            Coalition naval vessels patrol the southern Red Sea. Photo: International Maritime Bureau
          </p>
        </div>
      </div>

      {/* Article body */}
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="body-text space-y-6 text-foreground">
            <p>
              The United Nations Security Council convened an emergency session on Friday as attacks on 
              commercial shipping in the Red Sea reached their highest frequency since the crisis began 
              late last year. At least three cargo vessels were struck in a 48-hour period, prompting 
              several major shipping companies to suspend transit through the Suez Canal entirely.
            </p>

            <p>
              The escalation marks a significant turning point in a conflict that has been simmering 
              for months. Houthi militants, who control large swaths of Yemen, have claimed responsibility 
              for most of the attacks, saying they are acting in solidarity with Palestinians. But 
              intelligence officials say the sophistication of recent strikes suggests external support 
              that goes beyond the group's known capabilities.
            </p>

            <div className="pull-quote">
              "We are witnessing a fundamental shift in maritime security. The rules that governed 
              freedom of navigation for decades are being rewritten in real time."
              <cite className="block mt-3 text-sm not-italic font-sans font-semibold text-muted-foreground">
                — Admiral James Crawford, Former NATO Maritime Commander
              </cite>
            </div>

            <p>
              The economic impact has been immediate and far-reaching. Container shipping rates from 
              Asia to Europe have surged by 300% since December, according to the Drewry World Container 
              Index. Major retailers are warning of supply chain disruptions that could affect consumer 
              prices across the Western world.
            </p>

            <p>
              "This is not just a regional security issue — it's a global economic crisis in the making," 
              said Dr. Elena Vasquez, a trade policy analyst at the Brookings Institution. "Roughly 12% 
              of global trade passes through the Red Sea. When you force ships to reroute around the 
              Cape of Good Hope, you're adding 10 to 14 days to shipping times and dramatically 
              increasing fuel costs."
            </p>

            <h2 className="headline-md mt-8">The Diplomatic Response</h2>

            <p>
              At the emergency session, the U.S. and its European allies pushed for a resolution 
              authorizing expanded military operations against launch sites in Yemen. Russia and China, 
              however, have expressed reservations, calling for a diplomatic approach that addresses the 
              root causes of the conflict.
            </p>

            <p>
              The divide on the Security Council reflects broader geopolitical tensions that have 
              complicated international responses to regional conflicts. "We're seeing the limitations 
              of the current multilateral system," said Professor Michael Torres of Georgetown University's 
              School of Foreign Service. "The mechanisms designed to maintain global order are being 
              tested in ways we haven't seen since the Cold War."
            </p>
          </div>

          {/* Related articles inline */}
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="section-label text-accent mb-2">Related Reading</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/mass-media/article" className="font-serif text-lg font-semibold hover:text-accent transition-colors">
                  Analysis: The Strategic Importance of the Bab el-Mandeb Strait →
                </Link>
              </li>
              <li>
                <Link to="/mass-media/article" className="font-serif text-lg font-semibold hover:text-accent transition-colors">
                  Timeline: How the Red Sea Crisis Unfolded →
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </article>

    {/* Comments section */}
    <section className="bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <h3 className="headline-md mb-6">Comments</h3>
          <div className="bg-card p-6 mb-6">
            <textarea
              placeholder="Join the discussion..."
              className="w-full bg-transparent border border-border p-4 font-sans text-sm resize-none h-24 focus:outline-none focus:border-accent"
            />
            <div className="flex justify-end mt-3">
              <button className="bg-primary text-primary-foreground px-6 py-2 font-sans text-sm font-semibold uppercase tracking-wider hover:bg-navy-light transition-colors">
                Post Comment
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {[
              { name: "Robert Clarke", time: "2 hours ago", text: "This is an excellent analysis. The economic implications are staggering — it's remarkable how quickly supply chains can be disrupted by a relatively small group of actors." },
              { name: "Maria Santos", time: "4 hours ago", text: "I appreciate the balanced reporting here. Too many outlets are framing this as purely a military issue when the diplomatic dimensions are just as critical." },
            ].map((comment, i) => (
              <div key={i} className="bg-card p-5 border-l-2 border-accent">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-sans text-sm font-bold">{comment.name}</span>
                  <span className="text-xs text-muted-foreground font-sans">· {comment.time}</span>
                </div>
                <p className="font-sans text-sm text-foreground leading-relaxed">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* More from World */}
    <section className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-10">
        <h3 className="section-label text-accent mb-6">More from World</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {relatedStories.map((story, i) => (
            <Link to="/mass-media/article" key={i} className="group flex gap-4 items-start">
              <img src={story.image} alt={story.title} className="w-24 h-24 object-cover shrink-0" />
              <div>
                <span className="section-label text-accent text-[10px]">{story.category}</span>
                <h4 className="font-serif text-base font-semibold group-hover:text-accent transition-colors mt-1 leading-snug">
                  {story.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  </MediaLayout>
);

export default ArticleDetail;
