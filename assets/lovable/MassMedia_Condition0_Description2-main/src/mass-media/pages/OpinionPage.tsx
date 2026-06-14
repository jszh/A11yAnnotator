import { Link } from "react-router-dom";

const perspectives = [
  {
    title: "The Moral Case for Climate Reparations",
    author: "Dr. Amara Okafor",
    bio: "Climate justice researcher at Columbia University and former IPCC contributing author.",
    date: "March 20, 2026",
    excerpt: "The nations that contributed least to carbon emissions are bearing the greatest costs. A framework for accountability isn't just ethical — it's economically inevitable.",
    initials: "AO",
  },
  {
    title: "Why We Need a Federal Groundwater Authority — Now",
    author: "Sen. Rosa Martinez (D-NM)",
    bio: "U.S. Senator from New Mexico and ranking member of the Senate Energy & Natural Resources Committee.",
    date: "March 16, 2026",
    excerpt: "The patchwork of state regulations has failed. Without federal coordination, we will watch aquifer after aquifer collapse while Congress debates jurisdiction.",
    initials: "RM",
  },
  {
    title: "Carbon Markets Can Work — If We Let Science Lead",
    author: "Dr. James Thornton",
    bio: "Environmental economist at MIT Sloan and advisor to the Voluntary Carbon Markets Integrity Initiative.",
    date: "March 12, 2026",
    excerpt: "The offset scandals exposed real problems, but abandoning market mechanisms entirely would be a catastrophic mistake. Here's how to fix the system.",
    initials: "JT",
  },
  {
    title: "A Rancher's View: Living on the Edge of the Ogallala",
    author: 'Katherine "Kit" Daniels',
    bio: "Fourth-generation cattle rancher in western Kansas and founder of the High Plains Water Cooperative.",
    date: "March 8, 2026",
    excerpt: "My family has worked this land for over a century. The aquifer sustained us through droughts, dust storms, and market crashes. Now, for the first time, I'm not sure it will sustain my children.",
    initials: "KD",
  },
  {
    title: "The Data Gap: Why We Can't Manage What We Don't Measure",
    author: "Dr. Li Wei",
    bio: "Remote sensing scientist at NASA's Jet Propulsion Laboratory specializing in GRACE satellite groundwater monitoring.",
    date: "March 4, 2026",
    excerpt: "We have better data on the water content of Mars than on many of America's critical aquifers. Closing this monitoring gap should be a national priority.",
    initials: "LW",
  },
];

export default function OpinionPage() {
  return (
    <div className="gw-section py-10 md:py-14 max-w-4xl">
      <h1 className="gw-headline-xl mb-2">Perspectives</h1>
      <p className="gw-deck max-w-2xl mb-10">
        Bylined essays from scientists, policymakers, and community voices on the issues Groundwork covers.
      </p>

      <div className="space-y-0">
        {perspectives.map((piece, i) => (
          <div key={piece.title} className={`py-8 ${i > 0 ? "border-t gw-rule" : ""}`}>
            <div className="flex gap-5">
              {/* Author avatar */}
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-sans text-sm font-bold text-primary">{piece.initials}</span>
              </div>
              <div className="flex-1">
                <Link to="/article" className="group">
                  <h2 className="gw-headline-md text-xl mb-2 group-hover:text-primary transition-colors">{piece.title}</h2>
                </Link>
                <p className="gw-body text-base mb-3">{piece.excerpt}</p>
                {/* Contributor bio */}
                <div className="gw-surface-warm rounded-sm p-4 mt-4">
                  <p className="font-sans text-sm font-semibold">{piece.author}</p>
                  <p className="text-xs text-muted-foreground mt-1">{piece.bio}</p>
                  <p className="gw-meta text-[11px] mt-2">{piece.date}</p>
                </div>
                <a
                  href="#"
                  className="inline-flex items-center mt-3 text-sm font-medium text-primary hover:underline"
                >
                  Respond to This Piece →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
