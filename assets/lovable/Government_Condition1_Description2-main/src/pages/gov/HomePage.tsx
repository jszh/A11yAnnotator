import { Link } from "react-router-dom";
import { Search, CreditCard, Heart, Vote, GraduationCap, AlertTriangle, Bell, ArrowRight } from "lucide-react";
import Layout from "@/components/gov/Layout";
import { useState } from "react";

const quickLinks = [
  { icon: CreditCard, label: "Renew Driver's License", to: "/services/drivers-license", color: "bg-gov-sky text-gov-navy" },
  { icon: Heart, label: "Apply for Benefits", to: "/services/benefits", color: "bg-green-50 text-gov-green" },
  { icon: Vote, label: "Register to Vote", to: "/services", color: "bg-gov-gold/10 text-gov-navy" },
  { icon: GraduationCap, label: "Find a School", to: "/services", color: "bg-secondary text-primary" },
];

const updates = [
  { dept: "Department of Health", text: "COVID-19 booster clinics available statewide. Walk-ins welcome.", time: "2 hours ago" },
  { dept: "Agency of Education", text: "School enrollment opens March 1 for the 2026–2027 academic year.", time: "5 hours ago" },
  { dept: "Department of Labor", text: "Unemployment rate drops to 2.8% — new workforce programs launching.", time: "1 day ago" },
  { dept: "Agency of Transportation", text: "Route 100 construction: expect delays through April 30.", time: "2 days ago" },
];

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Layout>
      {/* Alert banner */}
      <div className="bg-gov-gold/20 border-b border-gov-gold" role="alert">
        <div className="container flex items-center gap-3 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-amber-900">
            <strong>Tax Filing Deadline: April 15</strong> — <Link to="/services" className="underline font-semibold hover:no-underline focus:outline-none focus:ring-2 focus:ring-ring rounded">File Online Now</Link>
          </p>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container text-center">
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-4 leading-tight">
            What Do You Need Today?
          </h1>
          <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto">
            Access Vermont state services — licensing, benefits, education, and more.
          </p>
          <form
            className="mx-auto max-w-xl flex"
            role="search"
            aria-label="Search state services"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="hero-search" className="sr-only">Search services</label>
            <input
              id="hero-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for services, forms, or information..."
              className="flex-1 rounded-l-lg border-0 px-5 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gov-gold"
            />
            <button
              type="submit"
              className="rounded-r-lg bg-gov-green px-5 py-3.5 text-accent-foreground font-semibold hover:bg-gov-green-light transition-colors focus:outline-none focus:ring-2 focus:ring-gov-gold"
              aria-label="Search"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 md:py-16" aria-labelledby="quick-links-heading">
        <div className="container">
          <h2 id="quick-links-heading" className="font-display text-2xl font-bold text-foreground mb-8 text-center">
            Popular Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="group flex items-center gap-4 rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-gov-green focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${link.color} shrink-0`}>
                  <link.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground group-hover:text-gov-green transition-colors">
                    {link.label}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-gov-green transition-colors" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Live Updates */}
      <section className="bg-muted py-12 md:py-16" aria-labelledby="updates-heading">
        <div className="container">
          <div className="flex items-center gap-2 mb-8">
            <Bell className="h-5 w-5 text-gov-green" aria-hidden="true" />
            <h2 id="updates-heading" className="font-display text-2xl font-bold text-foreground">
              Latest Updates
            </h2>
          </div>
          <div className="space-y-4">
            {updates.map((update, i) => (
              <article key={i} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gov-green">{update.dept}</span>
                  <time className="text-xs text-muted-foreground">{update.time}</time>
                </div>
                <p className="text-sm text-foreground">{update.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;
