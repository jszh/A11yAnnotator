import { Users, Baby, GraduationCap, Heart, Briefcase, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/government/Layout";

const categories = [
  {
    icon: Users,
    title: "New Residents",
    desc: "Moving to Vermont? Start here.",
    services: [
      { name: "Driver's License Transfer", time: "~15 min online", link: "/services/drivers-license" },
      { name: "Vehicle Registration", time: "~10 min online", link: "/services" },
      { name: "Voter Registration", time: "~5 min online", link: "/services" },
    ],
  },
  {
    icon: Baby,
    title: "Families",
    desc: "Support for families at every stage.",
    services: [
      { name: "Apply for Benefits", time: "~20 min online", link: "/services/benefits" },
      { name: "Child Care Assistance", time: "~15 min online", link: "/services" },
      { name: "Birth Certificate Request", time: "~10 min online", link: "/services" },
    ],
  },
  {
    icon: GraduationCap,
    title: "Students",
    desc: "Education resources and financial aid.",
    services: [
      { name: "Find a Public School", time: "~5 min", link: "/services" },
      { name: "Apply for Scholarships", time: "~20 min online", link: "/services" },
      { name: "Student Loan Info", time: "~5 min", link: "/services" },
    ],
  },
  {
    icon: Heart,
    title: "Seniors",
    desc: "Programs and services for older adults.",
    services: [
      { name: "Medicare Assistance", time: "~15 min", link: "/services/benefits" },
      { name: "Heating Assistance", time: "~10 min online", link: "/services/benefits" },
      { name: "Senior Center Directory", time: "~5 min", link: "/services" },
    ],
  },
  {
    icon: Briefcase,
    title: "Businesses",
    desc: "Start, grow, and manage your business.",
    services: [
      { name: "Business Registration", time: "~15 min online", link: "/services" },
      { name: "Tax Filing", time: "~20 min online", link: "/services" },
      { name: "Permits & Licensing", time: "~10 min online", link: "/services" },
    ],
  },
];

const ServicesPage = () => (
  <Layout>
    <section className="bg-primary">
      <div className="container py-12 text-center">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-3">State Services</h1>
        <p className="text-primary-foreground/80 font-body text-lg max-w-2xl mx-auto">
          Browse services organized by who you are and what you need. Most can be completed entirely online.
        </p>
      </div>
    </section>

    <section className="container py-12">
      <div className="space-y-10">
        {categories.map((cat) => (
          <div key={cat.title} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-muted px-6 py-4 flex items-center gap-3">
              <cat.icon className="text-secondary" size={24} />
              <div>
                <h2 className="font-heading font-bold text-lg text-foreground">{cat.title}</h2>
                <p className="text-sm text-muted-foreground font-body">{cat.desc}</p>
              </div>
            </div>
            <div className="divide-y divide-border">
              {cat.services.map((svc) => (
                <Link
                  key={svc.name}
                  to={svc.link}
                  className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors group"
                >
                  <div>
                    <span className="font-body font-semibold text-foreground">{svc.name}</span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Clock size={12} />
                      <span>{svc.time}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  </Layout>
);

export default ServicesPage;
