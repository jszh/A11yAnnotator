import { Link } from "react-router-dom";
import { Search, Car, HeartPulse, Vote, GraduationCap, Building2, Newspaper, ArrowRight } from "lucide-react";
import { useState } from "react";
import GovLayout from "@/components/government/GovLayout";
import AlertBanner from "@/components/government/AlertBanner";
import { Button } from "@/components/ui/button";

const quickLinks = [
  { icon: Car, label: "Renew Driver's License", to: "/services/drivers-license", desc: "Renew online in ~10 minutes" },
  { icon: HeartPulse, label: "Apply for Benefits", to: "/services/benefits", desc: "Check eligibility for programs" },
  { icon: Vote, label: "Register to Vote", to: "/services", desc: "Update your registration" },
  { icon: GraduationCap, label: "Find a School", to: "/services", desc: "Search schools by district" },
];

const updates = [
  { dept: "Department of Health", title: "COVID-19 booster clinics available statewide starting March 28", date: "Mar 22, 2026" },
  { dept: "Agency of Transportation", title: "Spring road construction schedule released for I-89 corridor", date: "Mar 20, 2026" },
  { dept: "Department of Education", title: "Pre-K enrollment opens April 1 for 2026–27 school year", date: "Mar 19, 2026" },
  { dept: "Agency of Natural Resources", title: "Fishing season opens April 10 — licenses available online", date: "Mar 18, 2026" },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <GovLayout title="Home">
      <AlertBanner
        message="Tax Filing Deadline: April 15"
        linkText="File Online Now"
        linkHref="/services"
      />

      {/* Hero */}
      <section className="bg-primary" aria-labelledby="hero-heading">
        <div className="gov-container py-16 sm:py-20">
          <h1 id="hero-heading" className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-primary-foreground mb-4 max-w-2xl">
            What Do You Need Today?
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl">
            Access Vermont state services, renew licenses, apply for benefits, and more.
          </p>
          <form
            className="flex gap-2 max-w-xl"
            role="search"
            aria-label="Search state services"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search services, forms, or information..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border-0 bg-card pl-10 pr-4 py-3 text-card-foreground placeholder:text-muted-foreground focus-ring"
                aria-label="Search services"
              />
            </div>
            <Button type="submit" className="px-6" aria-label="Submit search">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Quick Links */}
      <section className="gov-section" aria-labelledby="quick-links-heading">
        <div className="gov-container">
          <h2 id="quick-links-heading" className="text-2xl font-serif font-bold mb-8">Popular Services</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="list">
            {quickLinks.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="group flex flex-col items-start gap-3 rounded-lg border bg-card p-6 transition-all hover:shadow-md hover:border-primary/30 focus-ring"
                  aria-label={`${item.label} — ${item.desc}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <item.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{item.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                  <span className="text-sm font-medium text-primary flex items-center gap-1 mt-auto">
                    Get started <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Live Updates */}
      <section className="bg-secondary/50 gov-section" aria-labelledby="updates-heading">
        <div className="gov-container">
          <div className="flex items-center justify-between mb-8">
            <h2 id="updates-heading" className="text-2xl font-serif font-bold flex items-center gap-3">
              <Newspaper className="h-6 w-6 text-primary" aria-hidden="true" />
              Latest Updates
            </h2>
            <Link to="/about" className="text-sm font-medium text-primary hover:underline focus-ring rounded">
              View all news <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <ul className="space-y-3" role="list">
            {updates.map((item, i) => (
              <li key={i}>
                <article className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 rounded-lg bg-card border p-4 hover:shadow-sm transition-shadow">
                  <span className="text-xs font-semibold text-gov-info bg-gov-info/10 rounded-full px-3 py-1 w-fit shrink-0">
                    {item.dept}
                  </span>
                  <p className="text-sm font-medium text-card-foreground flex-1">{item.title}</p>
                  <time className="text-xs text-muted-foreground shrink-0" dateTime="2026-03-22">{item.date}</time>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Stats */}
      <section className="gov-section" aria-labelledby="stats-heading">
        <div className="gov-container text-center">
          <h2 id="stats-heading" className="text-2xl font-serif font-bold mb-10">Serving Vermont Residents</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { stat: "647K+", label: "Residents Served" },
              { stat: "120+", label: "Online Services" },
              { stat: "24/7", label: "Digital Access" },
              { stat: "98%", label: "Satisfaction Rate" },
            ].map((item) => (
              <div key={item.label} className="p-6 rounded-lg bg-secondary">
                <div className="text-3xl font-bold text-primary font-serif">{item.stat}</div>
                <div className="text-sm text-muted-foreground mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </GovLayout>
  );
}
