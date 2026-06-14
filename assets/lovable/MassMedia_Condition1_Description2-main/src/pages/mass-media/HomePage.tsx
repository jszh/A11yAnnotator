import { Link } from "react-router-dom";
import Layout from "@/components/mass-media/Layout";
import { ArrowRight, Heart } from "lucide-react";

const latestInvestigations = [
  {
    tag: "Carbon Markets",
    title: "The Phantom Credits: How Carbon Offset Fraud Undermines Climate Action",
    desc: "A six-month investigation reveals that nearly a third of voluntary carbon credits traded in 2025 are linked to projects that never reduced emissions.",
    author: "Maya Chen",
    date: "Mar 18, 2026",
    readTime: "14 min read",
  },
  {
    tag: "Wildfire",
    title: "After the Burn: Toxic Legacy of PFAS in Wildfire Ash",
    desc: "When homes built with synthetic materials burn, they leave behind a chemical footprint that lasts decades in soil and water.",
    author: "James Harlow",
    date: "Mar 12, 2026",
    readTime: "11 min read",
  },
  {
    tag: "Energy Policy",
    title: "Grid Collapse: Why Rural America Is Losing Power — Literally",
    desc: "Aging infrastructure and climate stress are causing cascading blackouts across underserved communities.",
    author: "Priya Nair",
    date: "Mar 7, 2026",
    readTime: "9 min read",
  },
];

const stats = [
  { number: "40%", label: "of U.S. aquifers show contamination above EPA thresholds" },
  { number: "2.1M", label: "acres of farmland lost to groundwater collapse since 2020" },
  { number: "$14B", label: "in unreported fossil fuel subsidies identified by our data team" },
  { number: "127", label: "investigations published in 2025" },
];

const HomePage = () => (
  <Layout>
    {/* Hero Feature Story */}
    <section className="relative bg-primary overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-editorial-green to-primary opacity-90" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
        <span className="inline-block font-sans text-xs uppercase tracking-widest font-semibold text-editorial-amber mb-4">
          Featured Investigation
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-6xl font-bold text-primary-foreground leading-tight max-w-4xl">
          The Invisible Flood: How Groundwater Collapse Is Reshaping the American West
        </h1>
        <p className="mt-6 font-sans text-lg sm:text-xl text-primary-foreground opacity-80 max-w-2xl leading-relaxed">
          Beneath the surface of the nation's most productive farmland, a crisis decades in the making is reaching its tipping point. Our year-long investigation reveals the scope of the damage — and who's profiting from inaction.
        </p>
        <div className="mt-4 flex items-center gap-4 font-sans text-sm text-primary-foreground opacity-60">
          <span>By Sarah Thornton & David Liu</span>
          <span>·</span>
          <span>22 min read</span>
          <span>·</span>
          <span>March 20, 2026</span>
        </div>
        <Link
          to="/mass-media/article"
          className="inline-flex items-center gap-2 mt-8 bg-editorial-amber text-accent-foreground font-sans font-semibold text-sm px-6 py-3 rounded hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Read the Investigation <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>

    {/* Latest Investigations */}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="flex items-end justify-between mb-8">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">Latest Investigations</h2>
        <Link to="/mass-media/category/climate" className="font-sans text-sm font-medium text-editorial-green-light hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {latestInvestigations.map((story) => (
          <Link
            key={story.title}
            to="/mass-media/article"
            className="group block bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="aspect-video bg-muted flex items-center justify-center">
              <span className="font-sans text-xs text-muted-foreground uppercase tracking-wider">{story.tag}</span>
            </div>
            <div className="p-5">
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-editorial-green-light">{story.tag}</span>
              <h3 className="font-serif text-lg font-bold text-foreground mt-2 group-hover:text-editorial-green-light transition-colors leading-snug">
                {story.title}
              </h3>
              <p className="font-sans text-sm text-muted-foreground mt-2 leading-relaxed">{story.desc}</p>
              <div className="mt-4 flex items-center gap-2 font-sans text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{story.author}</span>
                <span>·</span>
                <span>{story.date}</span>
                <span>·</span>
                <span>{story.readTime}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>

    {/* By the Numbers */}
    <section className="bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary-foreground mb-10 text-center">By the Numbers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.number} className="text-center">
              <span className="font-serif text-4xl sm:text-5xl font-bold text-editorial-amber">{s.number}</span>
              <p className="mt-2 font-sans text-sm text-primary-foreground opacity-80 leading-relaxed">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Donation CTA */}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="bg-editorial-cream border border-border rounded-xl p-8 sm:p-12 text-center">
        <Heart className="w-8 h-8 text-editorial-amber mx-auto mb-4" />
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">Reader-Supported Journalism</h2>
        <p className="mt-3 font-sans text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Groundwork is funded by readers like you. No corporate sponsors. No paywalls. Just rigorous, independent reporting on the issues that matter most.
        </p>
        <Link
          to="/mass-media/subscribe"
          className="inline-flex items-center gap-2 mt-6 bg-primary text-primary-foreground font-sans font-semibold text-sm px-8 py-3 rounded hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Become a Supporter <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  </Layout>
);

export default HomePage;
