import { Link } from "react-router-dom";
import Layout from "@/components/mass-media/Layout";
import { Clock, FileText, ArrowRight } from "lucide-react";

const stories = [
  {
    tags: ["Sea Level", "Infrastructure"],
    title: "Drowning in Plain Sight: The Cities That Can't Afford to Retreat",
    desc: "As sea levels accelerate beyond projections, coastal cities face impossible choices between protecting property and protecting people.",
    author: "Elena Vasquez",
    date: "Mar 15, 2026",
    readTime: "16 min read",
  },
  {
    tags: ["Wildfire", "Public Health"],
    title: "Smoke Season Is Now Year-Round in the Pacific Northwest",
    desc: "Air quality data shows wildfire smoke exposure has tripled since 2015, with low-income communities bearing the heaviest burden.",
    author: "James Harlow",
    date: "Mar 10, 2026",
    readTime: "12 min read",
  },
  {
    tags: ["Carbon Markets"],
    title: "The Phantom Credits: Inside the Carbon Offset Scandal",
    desc: "Voluntary carbon markets are awash in credits tied to forests that were never at risk and emissions reductions that never happened.",
    author: "Maya Chen",
    date: "Mar 5, 2026",
    readTime: "14 min read",
  },
  {
    tags: ["Arctic", "Science"],
    title: "Permafrost Is Thawing 70 Years Ahead of Schedule",
    desc: "New borehole data from Siberia and Alaska reveals that deep permafrost layers scientists thought were stable are rapidly destabilizing.",
    author: "Dr. Anil Kapoor",
    date: "Feb 28, 2026",
    readTime: "10 min read",
  },
];

const keyDocuments = [
  "EPA Aquifer Contamination Report (2026)",
  "USGS Groundwater Depletion Data",
  "Congressional Budget Office: Climate Adaptation Costs",
  "UN IPCC AR7 Summary for Policymakers",
];

const CategoryPage = () => (
  <Layout>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Page header */}
      <div className="border-b border-border pb-6 mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">Climate</h1>
        <p className="mt-2 font-sans text-muted-foreground max-w-2xl">
          In-depth investigations into the climate crisis — from rising seas to collapsing ecosystems, policy failures to grassroots solutions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Story list */}
        <div className="lg:col-span-2 space-y-8">
          {/* Lead story */}
          <Link
            to="/mass-media/article"
            className="group block bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="aspect-[2/1] bg-muted flex items-center justify-center">
              <span className="font-sans text-xs text-muted-foreground uppercase tracking-wider">Lead Investigation</span>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-sans text-xs font-semibold uppercase tracking-wider text-editorial-green-light">Featured</span>
                <span className="flex items-center gap-1 font-sans text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" /> 22 min read
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground group-hover:text-editorial-green-light transition-colors leading-snug">
                The Invisible Flood: How Groundwater Collapse Is Reshaping the American West
              </h2>
              <p className="mt-3 font-sans text-sm text-muted-foreground leading-relaxed">
                A year-long investigation into aquifer depletion, corporate water extraction, and the communities left behind.
              </p>
              <span className="mt-3 inline-block font-sans text-xs font-medium text-foreground">By Sarah Thornton & David Liu</span>
            </div>
          </Link>

          {/* Story list */}
          {stories.map((story) => (
            <Link
              key={story.title}
              to="/mass-media/article"
              className="group flex flex-col sm:flex-row gap-4 pb-8 border-b border-border last:border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <div className="sm:w-48 aspect-video sm:aspect-square bg-muted rounded flex-shrink-0 flex items-center justify-center">
                <span className="font-sans text-xs text-muted-foreground uppercase tracking-wider">{story.tags[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  {story.tags.map((tag) => (
                    <span key={tag} className="font-sans text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                  ))}
                </div>
                <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-editorial-green-light transition-colors leading-snug">
                  {story.title}
                </h3>
                <p className="mt-1 font-sans text-sm text-muted-foreground leading-relaxed line-clamp-2">{story.desc}</p>
                <div className="mt-2 flex items-center gap-2 font-sans text-xs text-muted-foreground">
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

        {/* Sidebar */}
        <aside className="space-y-8">
          {/* Key Documents */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-sans text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-4">Key Documents</h3>
            <ul className="space-y-3">
              {keyDocuments.map((doc) => (
                <li key={doc}>
                  <a href="#" className="flex items-start gap-2 font-sans text-sm text-foreground hover:text-editorial-green-light transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    {doc}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Data Visualization Preview */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-sans text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-4">Data Report</h3>
            <div className="aspect-square bg-muted rounded flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="font-serif text-3xl font-bold text-editorial-green-light">2.1M</div>
                <div className="font-sans text-xs text-muted-foreground mt-1">Acres of farmland lost</div>
                <div className="mt-3 flex justify-center gap-1">
                  {[40, 55, 30, 65, 80, 75, 90, 85].map((h, i) => (
                    <div key={i} className="w-3 bg-editorial-green-light rounded-t opacity-70" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
            <Link
              to="/mass-media/article"
              className="inline-flex items-center gap-1 font-sans text-sm font-medium text-editorial-green-light hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              View Full Report <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  </Layout>
);

export default CategoryPage;
