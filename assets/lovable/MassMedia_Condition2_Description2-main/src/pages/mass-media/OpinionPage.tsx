import { Link } from "react-router-dom";
import Layout from "@/components/mass-media/Layout";
import { Mail } from "lucide-react";

const perspectives = [
  {
    title: "We Cannot Adapt Our Way Out of the Water Crisis",
    author: "Dr. Rebecca Torres",
    role: "Hydrologist, University of Arizona",
    initials: "RT",
    date: "March 18, 2026",
    excerpt: "Adaptation without addressing root causes is a strategy for managed decline. We need to fundamentally rethink how we allocate water in the American West.",
  },
  {
    title: "Carbon Markets Need Radical Transparency, Not Abolition",
    author: "James Whitfield",
    role: "Former Director, Global Carbon Initiative",
    initials: "JW",
    date: "March 14, 2026",
    excerpt: "The problems with carbon offsets are real but fixable. Abandoning market mechanisms entirely would set climate policy back decades.",
  },
  {
    title: "Environmental Justice Means Listening to Frontline Communities First",
    author: "Maria Santos",
    role: "Community organizer, Central Valley Environmental Alliance",
    initials: "MS",
    date: "March 10, 2026",
    excerpt: "Too often, environmental policy is made for communities rather than by them. The people living with contamination should be leading the conversation.",
  },
  {
    title: "The Data Is Clear: We're Running Out of Time on Methane",
    author: "Dr. Aisha Patel",
    role: "Atmospheric Scientist, NOAA",
    initials: "AP",
    date: "March 6, 2026",
    excerpt: "Methane is responsible for a quarter of current warming, yet it receives a fraction of the policy attention. Satellite data gives us no more room for denial.",
  },
];

export default function OpinionPage() {
  return (
    <Layout title="Perspectives">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="font-serif font-bold text-3xl md:text-4xl mb-2">Perspectives</h1>
          <p className="font-sans text-muted-foreground max-w-xl">
            Bylined essays from scientists, policymakers, and community voices on the issues that define our environmental future.
          </p>
        </header>

        <ul className="space-y-0">
          {perspectives.map((piece, i) => (
            <li key={piece.title}>
              <article className={`py-8 ${i < perspectives.length - 1 ? "border-b border-border" : ""}`}>
                <Link
                  to="/mass-media/article"
                  className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  <h2 className="font-serif font-bold text-xl md:text-2xl leading-tight mb-3 group-hover:text-primary transition-colors">
                    {piece.title}
                  </h2>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-4">
                    {piece.excerpt}
                  </p>
                </Link>

                {/* Contributor bio card */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                    role="img"
                    aria-label={`Photo of ${piece.author}`}
                  >
                    <span className="font-sans font-bold text-sm text-muted-foreground">{piece.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-sans font-medium">{piece.author}</p>
                    <p className="text-xs font-sans text-muted-foreground">{piece.role}</p>
                  </div>
                  <time className="text-xs font-sans text-muted-foreground ml-auto">{piece.date}</time>
                </div>

                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-sm font-sans font-medium text-primary hover:underline"
                  aria-label={`Respond to "${piece.title}" by ${piece.author}`}
                  onClick={(e) => e.preventDefault()}
                >
                  <Mail size={14} />
                  Respond to This Piece
                </a>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}