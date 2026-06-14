import { Search, Car, Heart, Vote, GraduationCap, Newspaper, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/government/Layout";
import heroBanner from "@/assets/hero-banner.jpg";

const quickLinks = [
  { icon: Car, label: "Renew Driver's License", desc: "Online renewal in ~10 minutes", link: "/services/drivers-license" },
  { icon: Heart, label: "Apply for Benefits", desc: "SNAP, Medicaid & more", link: "/services/benefits" },
  { icon: Vote, label: "Register to Vote", desc: "Check your registration status", link: "/services" },
  { icon: GraduationCap, label: "Find a School", desc: "Public school directory", link: "/services" },
];

const updates = [
  { dept: "Agency of Transportation", title: "Winter road closures updated for March 2026", date: "Mar 20, 2026" },
  { dept: "Department of Health", title: "Free flu vaccination clinics available statewide", date: "Mar 18, 2026" },
  { dept: "Department of Education", title: "School enrollment opens for 2026-2027 year", date: "Mar 15, 2026" },
  { dept: "Agency of Commerce", title: "Small business grant applications now accepted", date: "Mar 12, 2026" },
];

const HomePage = () => (
  <Layout>
    {/* Hero */}
    <section className="relative overflow-hidden">
      <img src={heroBanner} alt="Vermont landscape" className="absolute inset-0 w-full h-full object-cover" width={1920} height={640} />
      <div className="absolute inset-0 bg-primary/70" />
      <div className="relative container py-16 md:py-24 text-center">
        <h1 className="font-heading text-3xl md:text-5xl font-bold text-primary-foreground mb-4 leading-tight">
          What Do You Need Today?
        </h1>
        <p className="text-primary-foreground/80 font-body text-lg mb-8 max-w-2xl mx-auto">
          Access Vermont state services, apply for benefits, renew licenses, and more — all in one place.
        </p>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search for services, forms, or information..."
            className="w-full pl-12 pr-4 py-4 rounded-lg border-0 bg-card text-foreground font-body text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>
    </section>

    {/* Quick Links */}
    <section className="container py-12">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-8 text-center">Popular Services</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((item) => (
          <Link
            key={item.label}
            to={item.link}
            className="group bg-card border border-border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all"
          >
            <item.icon className="text-secondary mb-3" size={28} />
            <div className="font-heading font-bold text-foreground text-base mb-1">{item.label}</div>
            <div className="text-sm text-muted-foreground font-body">{item.desc}</div>
            <div className="mt-3 text-sm font-semibold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Get started <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </div>
    </section>

    {/* Live Updates */}
    <section className="bg-gov-cream">
      <div className="container py-12">
        <div className="flex items-center gap-3 mb-6">
          <Newspaper className="text-secondary" size={24} />
          <h2 className="font-heading text-2xl font-bold text-foreground">Live Updates</h2>
        </div>
        <div className="space-y-4">
          {updates.map((u, i) => (
            <div key={i} className="bg-card rounded-lg p-5 border border-border flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase text-secondary font-body tracking-wide">{u.dept}</span>
                <h3 className="font-body font-semibold text-foreground mt-1">{u.title}</h3>
              </div>
              <span className="text-sm text-muted-foreground font-body shrink-0">{u.date}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  </Layout>
);

export default HomePage;
