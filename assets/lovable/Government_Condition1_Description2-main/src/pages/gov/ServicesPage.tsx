import { Link } from "react-router-dom";
import { Users, Baby, GraduationCap, HeartHandshake, Building2, Clock, ArrowRight } from "lucide-react";
import Layout from "@/components/gov/Layout";

const categories = [
  {
    icon: Users,
    title: "New Residents",
    description: "Getting started in Vermont — IDs, registration, and essential services.",
    services: [
      { name: "Driver's License or State ID", time: "~15 min online", to: "/services/drivers-license" },
      { name: "Vehicle Registration", time: "~10 min online", to: "/services" },
      { name: "Voter Registration", time: "~5 min online", to: "/services" },
    ],
  },
  {
    icon: Baby,
    title: "Families",
    description: "Support programs, childcare, and family health services.",
    services: [
      { name: "Apply for Benefits (SNAP, Medicaid)", time: "~20 min online", to: "/services/benefits" },
      { name: "Child Care Financial Assistance", time: "~15 min online", to: "/services" },
      { name: "Birth Certificate Request", time: "~10 min online", to: "/services" },
    ],
  },
  {
    icon: GraduationCap,
    title: "Students",
    description: "Education resources, financial aid, and school enrollment.",
    services: [
      { name: "School Enrollment", time: "~10 min online", to: "/services" },
      { name: "State Scholarship Programs", time: "~15 min online", to: "/services" },
      { name: "Student Loan Resources", time: "~10 min online", to: "/services" },
    ],
  },
  {
    icon: HeartHandshake,
    title: "Seniors",
    description: "Health coverage, retirement, and senior assistance programs.",
    services: [
      { name: "Medicare & Medicaid Enrollment", time: "~20 min online", to: "/services/benefits" },
      { name: "Heating Assistance (LIHEAP)", time: "~15 min online", to: "/services/benefits" },
      { name: "Senior Transportation Services", time: "~5 min online", to: "/services" },
    ],
  },
  {
    icon: Building2,
    title: "Businesses",
    description: "Licensing, permits, tax filing, and business development.",
    services: [
      { name: "Business Registration", time: "~20 min online", to: "/services" },
      { name: "Tax Filing & Permits", time: "~15 min online", to: "/services" },
      { name: "Employer Resources", time: "~10 min online", to: "/services" },
    ],
  },
];

const ServicesPage = () => (
  <Layout>
    <section className="bg-primary text-primary-foreground py-12">
      <div className="container">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">State Services</h1>
        <p className="text-lg opacity-80">Browse services organized by who you are and what you need.</p>
      </div>
    </section>

    <section className="py-12 md:py-16" aria-labelledby="services-heading">
      <div className="container space-y-10">
        <h2 id="services-heading" className="sr-only">Services by category</h2>
        {categories.map((cat) => (
          <div key={cat.title} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 bg-muted px-6 py-5 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gov-green/10 text-gov-green">
                <cat.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">{cat.title}</h3>
                <p className="text-sm text-muted-foreground">{cat.description}</p>
              </div>
            </div>
            <ul className="divide-y divide-border" role="list">
              {cat.services.map((svc) => (
                <li key={svc.name}>
                  <Link
                    to={svc.to}
                    className="flex items-center justify-between px-6 py-4 text-sm hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset group"
                  >
                    <span className="font-medium text-foreground group-hover:text-gov-green transition-colors">{svc.name}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1 text-xs">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {svc.time}
                      </span>
                      <ArrowRight className="h-4 w-4 group-hover:text-gov-green transition-colors" aria-hidden="true" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  </Layout>
);

export default ServicesPage;
