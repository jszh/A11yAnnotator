import { Link } from "react-router-dom";
import MediaLayout from "@/components/mass-media/MediaLayout";
import columnist1 from "@/assets/columnist-1.jpg";
import columnist2 from "@/assets/columnist-2.jpg";
import columnist3 from "@/assets/columnist-3.jpg";

const columnists = [
  {
    name: "Eleanor Vance",
    title: "Chief Political Correspondent",
    image: columnist1,
    pieces: [
      { headline: "The Myth of Bipartisan Consensus in an Age of Extremes", date: "March 14, 2026" },
      { headline: "Why the Filibuster Debate Misses the Real Problem", date: "March 10, 2026" },
      { headline: "What Britain's Labour Experiment Tells Us About Power", date: "March 5, 2026" },
    ],
  },
  {
    name: "Marcus Chen",
    title: "Technology & Society Editor",
    image: columnist2,
    pieces: [
      { headline: "AI Is Not Coming for Your Job — It's Coming for Your Judgment", date: "March 13, 2026" },
      { headline: "The Case Against Digital Minimalism", date: "March 8, 2026" },
      { headline: "Silicon Valley's Libertarian Fantasy Is Crumbling", date: "March 2, 2026" },
    ],
  },
  {
    name: "Professor David Ashworth",
    title: "Foreign Affairs Analyst",
    image: columnist3,
    pieces: [
      { headline: "Multipolarity Is a Fantasy — The Real World Order Is Chaos", date: "March 12, 2026" },
      { headline: "The West's Moral Authority Was Never Real", date: "March 7, 2026" },
      { headline: "Why Small Nations Will Define the 21st Century", date: "March 1, 2026" },
    ],
  },
];

const letters = [
  { author: "Dr. Sarah Jennings, Oxford", text: "Eleanor Vance's recent column on bipartisanship was both incisive and timely. However, I would argue that the erosion of consensus began not with ideological extremism, but with the collapse of local journalism..." },
  { author: "Miguel Torres, New York", text: "Marcus Chen's dismissal of digital minimalism overlooks the genuine mental health benefits documented in recent longitudinal studies. While his critique of the movement's commercialisation is valid..." },
  { author: "Anne-Marie Dubois, Paris", text: "Professor Ashworth's analysis of multipolarity fails to account for the European Union's growing role as a regulatory superpower. Brussels may not project military power, but its normative influence..." },
];

const OpinionPage = () => (
  <MediaLayout>
    {/* Header */}
    <section className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-10">
        <div className="border-b-2 border-opinion-teal pb-4">
          <h1 className="headline-xl">Opinion</h1>
          <p className="text-muted-foreground font-sans mt-2">
            Analysis, commentary, and debate from The Meridian's leading voices.
          </p>
        </div>
      </div>
    </section>

    {/* Featured opinion */}
    <section className="bg-card">
      <div className="container mx-auto px-4 py-10">
        <Link to="/mass-media/article" className="group block max-w-3xl">
          <span className="section-label text-opinion-teal">Featured Essay</span>
          <h2 className="headline-xl mt-3 group-hover:text-opinion-teal transition-colors">
            The Death of Expertise and the Rise of Algorithmic Authority
          </h2>
          <p className="body-text text-muted-foreground mt-4">
            In an age where AI can generate convincing analysis on any topic, the very concept of 
            human expertise is being challenged. But the stakes of abandoning it couldn't be higher.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <img src={columnist1} alt="Eleanor Vance" className="w-14 h-14 rounded-full object-cover" />
            <div>
              <p className="font-sans text-sm font-bold">Eleanor Vance</p>
              <p className="font-sans text-xs text-muted-foreground">Chief Political Correspondent · 18 min read</p>
            </div>
          </div>
        </Link>
      </div>
    </section>

    {/* Columnists grid */}
    <section className="bg-background">
      <div className="container mx-auto px-4 py-10">
        <h3 className="section-label text-opinion-teal mb-8">Our Columnists</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {columnists.map((col) => (
            <div key={col.name} className="bg-card p-6">
              <div className="flex items-center gap-4 mb-6">
                <img src={col.image} alt={col.name} className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <h4 className="font-serif font-bold text-lg">{col.name}</h4>
                  <p className="font-sans text-xs text-muted-foreground">{col.title}</p>
                </div>
              </div>
              <ul className="space-y-4">
                {col.pieces.map((piece, i) => (
                  <li key={i} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <Link to="/mass-media/article" className="group">
                      <h5 className="font-serif text-base font-semibold group-hover:text-opinion-teal transition-colors leading-snug">
                        {piece.headline}
                      </h5>
                      <span className="text-xs text-muted-foreground font-sans mt-1 block">{piece.date}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Letters to the Editor */}
    <section className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-10">
        <h3 className="section-label text-opinion-teal mb-6">Letters to the Editor</h3>
        <div className="max-w-3xl space-y-6">
          {letters.map((letter, i) => (
            <div key={i} className="border-l-2 border-opinion-teal pl-6">
              <p className="font-sans text-sm text-foreground leading-relaxed">{letter.text}</p>
              <p className="font-sans text-xs text-muted-foreground mt-2 font-semibold">— {letter.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </MediaLayout>
);

export default OpinionPage;
