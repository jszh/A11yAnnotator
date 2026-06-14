import { Link } from "react-router-dom";
import { Search, CreditCard, AlertTriangle, FileText, TreePine, ShieldAlert, Calendar, ArrowRight } from "lucide-react";
import { useState } from "react";

const quickServices = [
  { icon: CreditCard, label: "Pay a Bill", desc: "Pay utility bills online", path: "/government/services/pay-bill" },
  { icon: ShieldAlert, label: "Report an Issue", desc: "Report potholes, graffiti & more", path: "/government/contact" },
  { icon: FileText, label: "Apply for a Permit", desc: "Building & business permits", path: "/government/services/permits" },
  { icon: TreePine, label: "Find a Park", desc: "Parks & recreation facilities", path: "/government/services" },
];

const news = [
  { title: "City Council Approves New Community Center Funding", date: "November 15, 2024", summary: "The Lakewood City Council voted unanimously to allocate $12 million for the construction of a new community center in the east district." },
  { title: "Winter Holiday Schedule for City Services", date: "November 10, 2024", summary: "City offices will observe modified hours during the holiday season. Trash collection schedules will also be adjusted." },
  { title: "Water Conservation Program Launches", date: "November 5, 2024", summary: "New rebate programs available for residents who install water-efficient fixtures and landscaping." },
];

const events = [
  { title: "City Council Meeting", date: "Nov 20, 2024", time: "6:00 PM", location: "City Hall Chambers" },
  { title: "Winter Farmers Market", date: "Nov 23, 2024", time: "8:00 AM – 1:00 PM", location: "Civic Center Plaza" },
  { title: "Holiday Tree Lighting", date: "Dec 1, 2024", time: "5:30 PM", location: "Lakewood Park" },
  { title: "Community Budget Workshop", date: "Dec 5, 2024", time: "7:00 PM", location: "Community Center" },
];

const GovHome = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      {/* Emergency alert */}
      <div role="alert" aria-live="assertive" className="bg-gov-alert-bg border-b-2 border-gov-alert">
        <div className="container mx-auto flex items-start gap-3 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-gov-alert shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-sans font-semibold text-sm text-gov-alert">Emergency Alert</p>
            <p className="font-sans text-sm text-foreground">Road Closure: Main St between 3rd and 5th Ave until Nov 30. <a href="#" className="underline font-medium hover:text-gov-alert transition-colors">View details</a></p>
          </div>
        </div>
      </div>

      {/* Hero search */}
      <section aria-labelledby="hero-heading" className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 id="hero-heading" className="font-serif text-3xl md:text-4xl font-bold mb-3">How Can We Help You?</h1>
          <p className="font-sans text-primary-foreground/80 mb-8 text-lg">Find services, information, and resources for the City of Lakewood</p>
          <form role="search" aria-label="Search city services" className="max-w-xl mx-auto" onSubmit={(e) => e.preventDefault()}>
            <div className="relative">
              <label htmlFor="hero-search" className="sr-only">Search city services</label>
              <input
                id="hero-search"
                type="search"
                placeholder="Search for services, permits, events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border-0 bg-primary-foreground text-foreground placeholder:text-muted-foreground px-5 py-4 pr-12 font-sans text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-gov-gold"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Submit search">
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Quick services */}
      <section aria-labelledby="quick-services-heading" className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 id="quick-services-heading" className="font-serif text-2xl font-bold text-foreground mb-8 text-center">Popular Services</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickServices.map((svc) => (
              <li key={svc.label}>
                <Link
                  to={svc.path}
                  className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
                  aria-label={`${svc.label}: ${svc.desc}`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gov-info text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <svc.icon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="font-sans font-semibold text-foreground">{svc.label}</span>
                    <p className="text-sm text-muted-foreground font-sans mt-1">{svc.desc}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* News and events */}
      <section className="py-12 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-3">
            {/* News */}
            <div className="lg:col-span-2">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-6">News & Announcements</h2>
              <div className="space-y-4">
                {news.map((item, i) => (
                  <article key={i} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                    <time className="text-xs text-muted-foreground font-sans uppercase tracking-wide">{item.date}</time>
                    <h3 className="font-serif text-lg font-bold text-foreground mt-1 mb-2">{item.title}</h3>
                    <p className="font-sans text-sm text-muted-foreground leading-relaxed">{item.summary}</p>
                    <a href="#" className="inline-flex items-center gap-1 text-sm font-sans font-medium text-accent mt-3 hover:underline">
                      Read more <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </article>
                ))}
              </div>
            </div>

            {/* Events */}
            <aside aria-labelledby="events-heading">
              <h2 id="events-heading" className="font-serif text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-accent" aria-hidden="true" />
                Upcoming Events
              </h2>
              <ul className="space-y-3">
                {events.map((ev, i) => (
                  <li key={i} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                    <h3 className="font-sans font-semibold text-foreground text-sm">{ev.title}</h3>
                    <p className="text-xs text-muted-foreground font-sans mt-1">{ev.date} · {ev.time}</p>
                    <p className="text-xs text-muted-foreground font-sans">{ev.location}</p>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
};

export default GovHome;
