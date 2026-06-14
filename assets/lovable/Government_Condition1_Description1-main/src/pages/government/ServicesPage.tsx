import { Link } from "react-router-dom";
import { Droplets, FileText, Shield, Car, TreePine, Heart, ChevronRight, ArrowRight } from "lucide-react";
import Layout from "@/components/government/Layout";

const categories = [
  {
    icon: Droplets,
    title: "Utilities & Billing",
    desc: "Water, sewer, trash collection, and utility account management.",
    links: ["Pay Your Bill", "Start/Stop Service", "Billing Questions", "Water Conservation"],
    path: "/services/pay-bill",
    color: "bg-blue-50 text-blue-700",
  },
  {
    icon: FileText,
    title: "Permits & Licenses",
    desc: "Building permits, business licenses, special event permits, and inspections.",
    links: ["Apply for a Permit", "Check Permit Status", "Business License", "Inspection Schedule"],
    path: "/services/permits",
    color: "bg-amber-50 text-amber-700",
  },
  {
    icon: Shield,
    title: "Public Safety",
    desc: "Police, fire services, emergency preparedness, and community safety programs.",
    links: ["Report a Crime", "Fire Prevention", "Emergency Alerts", "Neighborhood Watch"],
    path: "/services",
    color: "bg-red-50 text-red-700",
  },
  {
    icon: Car,
    title: "Transportation",
    desc: "Road maintenance, traffic signals, public transit, and parking information.",
    links: ["Report a Pothole", "Traffic Updates", "Public Transit", "Parking Permits"],
    path: "/services",
    color: "bg-green-50 text-green-700",
  },
  {
    icon: TreePine,
    title: "Parks & Recreation",
    desc: "City parks, sports facilities, recreation programs, and community events.",
    links: ["Find a Park", "Recreation Classes", "Reserve a Facility", "Youth Programs"],
    path: "/services",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    icon: Heart,
    title: "Social Services",
    desc: "Housing assistance, senior services, family support, and community resources.",
    links: ["Housing Assistance", "Senior Programs", "Food Resources", "Youth Services"],
    path: "/services",
    color: "bg-purple-50 text-purple-700",
  },
];

const ServicesPage = () => {
  return (
    <Layout>
      {/* Page Header */}
      <section className="bg-primary text-primary-foreground">
        <div className="gov-container py-12">
          <nav className="text-sm mb-4 opacity-70">
            <Link to="/">Home</Link> <span className="mx-2">/</span> <span>Services</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">City Services</h1>
          <p className="text-lg opacity-85 max-w-2xl">
            Browse all services offered by the City of Lakewood. Find what you need and get started online.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="gov-section">
        <div className="gov-container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div key={cat.title} className="bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow group">
                <div className="p-6">
                  <div className={`w-12 h-12 rounded-lg ${cat.color} flex items-center justify-center mb-4`}>
                    <cat.icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-serif font-bold text-foreground mb-2">{cat.title}</h2>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{cat.desc}</p>
                  <ul className="space-y-2 mb-4">
                    {cat.links.map((link) => (
                      <li key={link}>
                        <Link
                          to={cat.path}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <ChevronRight className="h-3 w-3" />
                          {link}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to={cat.path}
                  className="flex items-center justify-between px-6 py-3 bg-secondary text-sm font-medium text-secondary-foreground group-hover:bg-accent/20 transition-colors"
                >
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ServicesPage;
