import { Link } from "react-router-dom";
import { Droplets, FileText, ShieldCheck, Bus, TreePine, Heart, ArrowRight } from "lucide-react";
import GovBreadcrumb from "@/components/government/Breadcrumb";

const categories = [
  {
    icon: Droplets, title: "Utilities & Billing", desc: "Water, sewer, trash, and utility account management. Pay bills, start or stop service.",
    links: [
      { label: "Pay a Bill", path: "/government/services/pay-bill" },
      { label: "Start/Stop Service", path: "#" },
      { label: "Report an Outage", path: "#" },
    ],
  },
  {
    icon: FileText, title: "Permits & Licenses", desc: "Building permits, business licenses, and special event permits. Apply and track applications online.",
    links: [
      { label: "Apply for a Permit", path: "/government/services/permits" },
      { label: "Business Licenses", path: "#" },
      { label: "Special Event Permits", path: "#" },
    ],
  },
  {
    icon: ShieldCheck, title: "Public Safety", desc: "Police, fire, and emergency services. File reports, community safety programs, and emergency preparedness.",
    links: [
      { label: "File a Police Report", path: "#" },
      { label: "Fire Safety Inspections", path: "#" },
      { label: "Emergency Preparedness", path: "#" },
    ],
  },
  {
    icon: Bus, title: "Transportation", desc: "Roads, traffic signals, public transit, and bike lanes. Report potholes and view road closures.",
    links: [
      { label: "Report a Pothole", path: "#" },
      { label: "Traffic Updates", path: "#" },
      { label: "Public Transit Info", path: "#" },
    ],
  },
  {
    icon: TreePine, title: "Parks & Recreation", desc: "Parks, community centers, sports leagues, and recreation programs for all ages.",
    links: [
      { label: "Find a Park", path: "#" },
      { label: "Recreation Programs", path: "#" },
      { label: "Facility Rentals", path: "#" },
    ],
  },
  {
    icon: Heart, title: "Social Services", desc: "Housing assistance, food programs, senior services, and community resources for residents in need.",
    links: [
      { label: "Housing Assistance", path: "#" },
      { label: "Senior Services", path: "#" },
      { label: "Community Resources", path: "#" },
    ],
  },
];

const GovServices = () => (
  <>
    <GovBreadcrumb items={[{ label: "Services" }]} />

    <section aria-labelledby="services-heading" className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <h1 id="services-heading" className="font-serif text-3xl font-bold text-foreground mb-2">City Services</h1>
        <p className="font-sans text-muted-foreground mb-10 max-w-2xl">Browse all services offered by the City of Lakewood. Select a category to find what you need.</p>

        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <li key={cat.title}>
              <article className="h-full rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gov-info text-primary" aria-hidden="true">
                    <cat.icon className="h-6 w-6" />
                  </div>
                  <h2 className="font-serif text-lg font-bold text-foreground">{cat.title}</h2>
                </div>
                <p className="font-sans text-sm text-muted-foreground mb-4 leading-relaxed">{cat.desc}</p>
                <nav aria-label={`${cat.title} services`}>
                  <ul className="space-y-1.5">
                    {cat.links.map((link) => (
                      <li key={link.label}>
                        <Link to={link.path} className="inline-flex items-center gap-1.5 text-sm font-sans font-medium text-accent hover:underline">
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  </>
);

export default GovServices;
