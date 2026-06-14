import { Link } from "react-router-dom";
import Layout from "@/components/mass-media/Layout";
import ArticleCard from "@/components/mass-media/ArticleCard";
import { ArrowRight, FileText } from "lucide-react";

const stories = [
  {
    title: "Rising Tides: Mapping the Communities Climate Migration Will Displace",
    excerpt: "Using federal flood data and demographic modeling, we project which coastal areas face the highest displacement risk by 2040.",
    tag: "Sea Level",
    author: "Sarah Chen",
    date: "Mar 16, 2026",
    readTime: "20 min read",
    featured: true,
  },
  {
    title: "Wildfire Smoke Is Now a Year-Round Health Crisis",
    excerpt: "Fine particulate exposure from wildfires has tripled in Western states over the past decade. Our analysis of air quality data reveals the scope.",
    tag: "Wildfire",
    author: "Maria Gutierrez",
    date: "Mar 10, 2026",
    readTime: "16 min read",
  },
  {
    title: "The Carbon Credit Shell Game",
    excerpt: "An investigation into how offset programs are selling credits for forests that were never at risk.",
    tag: "Carbon Markets",
    author: "David Okonkwo",
    date: "Mar 8, 2026",
    readTime: "22 min read",
  },
  {
    title: "Arctic Ice Loss Accelerates Past Worst-Case Models",
    excerpt: "New satellite measurements show sea ice extent dropping faster than any IPCC scenario predicted.",
    tag: "Sea Level",
    author: "Elena Vasquez",
    date: "Mar 5, 2026",
    readTime: "12 min read",
  },
  {
    title: "California's Groundwater Banks Are Running Dry",
    excerpt: "Water districts promised sustainable management. A decade later, aquifer levels tell a different story.",
    tag: "Wildfire",
    author: "Sarah Chen",
    date: "Mar 1, 2026",
    readTime: "18 min read",
  },
];

const documents = [
  { title: "EPA Carbon Standards Report 2026", type: "PDF" },
  { title: "IPCC Sea-Level Projections Update", type: "PDF" },
  { title: "USGS Groundwater Monitoring Dataset", type: "CSV" },
  { title: "Federal Flood Risk Assessment", type: "PDF" },
];

const tags = ["All", "Sea Level", "Wildfire", "Carbon Markets", "Policy", "Water"];

export default function CategoryPage() {
  return (
    <Layout title="Climate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="font-serif font-bold text-3xl md:text-4xl mb-2">Climate</h1>
          <p className="font-sans text-muted-foreground max-w-2xl">
            Investigations and data analysis covering climate change impacts, adaptation, and the policies shaping our response.
          </p>
        </div>

        {/* Tag Filter */}
        <div className="mb-8 border-b border-border pb-4" role="group" aria-label="Filter stories by topic">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <button
                key={tag}
                className={`px-3 py-1 text-sm font-sans font-medium rounded-sm transition-colors
                  ${i === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                aria-pressed={i === 0}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Lead story */}
            <ArticleCard {...stories[0]} featured />

            {/* Story list */}
            <div className="space-y-6">
              {stories.slice(1).map((story) => (
                <ArticleCard key={story.title} {...story} />
              ))}
            </div>

            {/* Data Viz Preview */}
            <div className="bg-gw-surface rounded-sm p-6 border border-border">
              <h2 className="font-serif font-bold text-xl mb-2">Interactive: Global Temperature Anomaly Timeline</h2>
              <p className="text-sm font-sans text-muted-foreground mb-4">
                Explore 150 years of temperature data overlaid with key policy decisions and climate events.
              </p>
              <div className="bg-muted rounded-sm h-48 flex items-center justify-center mb-4">
                <span className="text-sm font-sans text-muted-foreground">[Data Visualization Preview]</span>
              </div>
              <Link
                to="/mass-media/article"
                className="inline-flex items-center gap-2 text-sm font-sans font-semibold text-primary hover:underline"
              >
                View Full Report <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8" aria-label="Sidebar">
            {/* Key Documents */}
            <div>
              <h2 className="font-sans font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                Key Documents
              </h2>
              <ul className="space-y-3">
                {documents.map((doc) => (
                  <li key={doc.title}>
                    <a
                      href="#"
                      className="flex items-start gap-3 p-3 rounded-sm border border-border hover:bg-muted transition-colors group"
                      aria-label={`Download ${doc.title} (${doc.type})`}
                    >
                      <FileText size={18} className="shrink-0 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-sans font-medium group-hover:text-primary transition-colors">{doc.title}</p>
                        <p className="text-xs font-sans text-muted-foreground">{doc.type}</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="bg-gw-surface rounded-sm p-5 border border-border">
              <h2 className="font-serif font-bold text-lg mb-2">Stay Informed</h2>
              <p className="text-sm font-sans text-muted-foreground mb-4">
                Get our weekly analysis of the stories shaping climate policy.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
                <label htmlFor="sidebar-email" className="sr-only">Email address</label>
                <input
                  id="sidebar-email"
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 text-sm font-sans border border-border rounded-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-required="true"
                  required
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-sm font-sans font-semibold bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}