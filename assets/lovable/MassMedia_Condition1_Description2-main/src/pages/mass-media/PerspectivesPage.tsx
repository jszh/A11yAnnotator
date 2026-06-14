import { Link } from "react-router-dom";
import Layout from "@/components/mass-media/Layout";
import { Mail, User } from "lucide-react";

const essays = [
  {
    title: "The Climate Fight Needs Farmers, Not Just Activists",
    author: "Dr. Maria Gonzalez",
    role: "Agricultural scientist, UC Davis",
    bio: "Dr. Gonzalez studies regenerative farming systems and soil carbon sequestration. She advises the USDA on climate-smart agriculture initiatives.",
    date: "March 19, 2026",
    excerpt: "We've spent decades framing climate action as an urban, progressive cause. But the most transformative carbon sequestration technology already exists — it's called soil. And the people who know it best are being left out of the conversation.",
  },
  {
    title: "Why I Left Big Oil to Fight for Climate Justice",
    author: "Marcus Williams",
    role: "Former petroleum engineer, climate advocate",
    bio: "Marcus spent 15 years at ExxonMobil before becoming an advocate for equitable energy transition. He now leads the Gulf Coast Climate Alliance.",
    date: "March 14, 2026",
    excerpt: "I helped design extraction systems that pulled billions of barrels from the Gulf. I saw the internal memos about climate risk. I watched my company fund disinformation campaigns. And eventually, I couldn't look away anymore.",
  },
  {
    title: "Environmental Regulation Doesn't Kill Jobs — It Creates Them",
    author: "Sen. Rachel Torres",
    role: "U.S. Senator (D-NM), Environment Committee",
    bio: "Senator Torres represents New Mexico and chairs the Senate Subcommittee on Clean Air, Climate, and Nuclear Safety.",
    date: "March 8, 2026",
    excerpt: "Every major environmental regulation in American history — the Clean Air Act, the Clean Water Act, the phase-out of leaded gasoline — was met with dire predictions of economic catastrophe. Every single one created more jobs than it displaced.",
  },
  {
    title: "My Town Is Disappearing Into the Sea",
    author: "James Dardar Jr.",
    role: "Resident, Isle de Jean Charles, Louisiana",
    bio: "James is a member of the Isle de Jean Charles Band of Biloxi-Chitimacha-Choctaw tribe. His community was among the first U.S. climate refugees.",
    date: "March 1, 2026",
    excerpt: "The island where I grew up has lost 98% of its land since 1955. The oak trees my grandmother planted are underwater. The cemetery where my ancestors rest floods every month now. We didn't cause this crisis, but we're paying for it first.",
  },
];

const PerspectivesPage = () => (
  <Layout>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Page header */}
      <div className="border-b border-border pb-6 mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">Perspectives</h1>
        <p className="mt-2 font-sans text-muted-foreground max-w-2xl">
          Voices from the frontlines — bylined essays from scientists, policymakers, community leaders, and those most affected by the climate crisis.
        </p>
      </div>

      {/* Essays */}
      <div className="space-y-12">
        {essays.map((essay) => (
          <article key={essay.title} className="pb-12 border-b border-border last:border-0">
            <Link
              to="/mass-media/article"
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground group-hover:text-editorial-green-light transition-colors leading-snug">
                {essay.title}
              </h2>
            </Link>
            <p className="mt-3 font-serif text-base text-muted-foreground italic leading-relaxed">
              {essay.excerpt}
            </p>
            <Link
              to="/mass-media/article"
              className="inline-block mt-3 font-sans text-sm font-medium text-editorial-green-light hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Read Full Essay →
            </Link>

            {/* Contributor card */}
            <div className="mt-6 bg-card border border-border rounded-lg p-5 flex flex-col sm:flex-row gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-sans text-sm font-semibold text-foreground">{essay.author}</div>
                <div className="font-sans text-xs text-muted-foreground">{essay.role}</div>
                <p className="mt-1 font-sans text-sm text-muted-foreground leading-relaxed">{essay.bio}</p>
                <div className="mt-2 font-sans text-xs text-muted-foreground">{essay.date}</div>
              </div>
            </div>

            {/* Respond link */}
            <a
              href="#"
              className="inline-flex items-center gap-2 mt-4 font-sans text-sm text-editorial-green-light hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              aria-label={`Submit a response to "${essay.title}"`}
            >
              <Mail className="w-4 h-4" /> Respond to This Piece
            </a>
          </article>
        ))}
      </div>
    </div>
  </Layout>
);

export default PerspectivesPage;
