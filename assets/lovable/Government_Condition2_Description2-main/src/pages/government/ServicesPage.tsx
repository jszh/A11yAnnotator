import { Link } from "react-router-dom";
import { Users, Baby, GraduationCap, Heart, Building2, Clock, ArrowRight } from "lucide-react";
import GovLayout from "@/components/government/GovLayout";
import Breadcrumbs from "@/components/government/Breadcrumbs";

const categories = [
  {
    icon: Users,
    title: "New Residents",
    desc: "Start your life in Vermont with essential setup services.",
    services: [
      { name: "Register Your Vehicle", time: "~15 min online", to: "/services" },
      { name: "Driver's License Transfer", time: "~20 min online", to: "/services/drivers-license" },
      { name: "Voter Registration", time: "~5 min online", to: "/services" },
    ],
  },
  {
    icon: Baby,
    title: "Families",
    desc: "Support and services for Vermont families.",
    services: [
      { name: "Apply for Benefits", time: "~20 min online", to: "/services/benefits" },
      { name: "Child Care Assistance", time: "~15 min online", to: "/services" },
      { name: "Birth Certificate Request", time: "~10 min online", to: "/services" },
    ],
  },
  {
    icon: GraduationCap,
    title: "Students",
    desc: "Educational resources and financial aid.",
    services: [
      { name: "College Financial Aid", time: "~25 min online", to: "/services" },
      { name: "School Enrollment", time: "~10 min online", to: "/services" },
      { name: "Transcript Request", time: "~5 min online", to: "/services" },
    ],
  },
  {
    icon: Heart,
    title: "Seniors",
    desc: "Programs and support for older Vermonters.",
    services: [
      { name: "Medicare Assistance", time: "~15 min online", to: "/services" },
      { name: "Property Tax Credit", time: "~10 min online", to: "/services" },
      { name: "Senior Transportation", time: "~5 min online", to: "/services" },
    ],
  },
  {
    icon: Building2,
    title: "Businesses",
    desc: "Licenses, permits, and resources for business owners.",
    services: [
      { name: "Business Registration", time: "~30 min online", to: "/services" },
      { name: "Tax Filing", time: "~20 min online", to: "/services" },
      { name: "Employer Resources", time: "~10 min online", to: "/services" },
    ],
  },
];

export default function ServicesPage() {
  return (
    <GovLayout title="Services">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Services" }]} />

      <section className="gov-container gov-section" aria-labelledby="services-heading">
        <div className="mb-10">
          <h1 id="services-heading" className="text-3xl font-serif font-bold mb-3">Services by Life Stage</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Find the services you need organized by where you are in life. Select a category to explore available resources.
          </p>
        </div>

        <div className="space-y-8">
          {categories.map((cat) => (
            <section key={cat.title} className="rounded-lg border bg-card overflow-hidden" aria-labelledby={`cat-${cat.title}`}>
              <div className="flex items-center gap-4 bg-secondary/50 px-6 py-4 border-b">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <cat.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 id={`cat-${cat.title}`} className="font-serif font-bold text-lg text-card-foreground">{cat.title}</h2>
                  <p className="text-sm text-muted-foreground">{cat.desc}</p>
                </div>
              </div>
              <ul className="divide-y" role="list" aria-label={`${cat.title} services`}>
                {cat.services.map((svc) => (
                  <li key={svc.name}>
                    <Link
                      to={svc.to}
                      className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors focus-ring group"
                      aria-label={`${svc.name} — estimated ${svc.time}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-card-foreground group-hover:text-primary transition-colors">{svc.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {svc.time}
                        </span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </GovLayout>
  );
}
