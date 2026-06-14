import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, AlertTriangle, CreditCard, FileText, TreePine, AlertCircle, Calendar, ChevronRight, Megaphone } from "lucide-react";
import Layout from "@/components/government/Layout";
import cityHero from "@/assets/city-hero.jpg";

const quickServices = [
  { icon: CreditCard, label: "Pay a Bill", desc: "Utility & water payments", path: "/services/pay-bill" },
  { icon: AlertCircle, label: "Report an Issue", desc: "Potholes, graffiti & more", path: "/contact" },
  { icon: FileText, label: "Apply for a Permit", desc: "Building & business permits", path: "/services/permits" },
  { icon: TreePine, label: "Find a Park", desc: "Parks & recreation info", path: "/services" },
];

const news = [
  { date: "Nov 15, 2026", title: "City Council Approves New Community Center Funding", excerpt: "The Lakewood City Council has unanimously approved $12.5 million in funding for the new Lakewood Community Center." },
  { date: "Nov 10, 2026", title: "Annual Holiday Tree Lighting Ceremony Announced", excerpt: "Join us at City Hall Plaza on December 5th for the annual tree lighting ceremony featuring live music and refreshments." },
  { date: "Nov 5, 2026", title: "Water Conservation Rebate Program Extended", excerpt: "Due to popular demand, the residential water conservation rebate program has been extended through March 2027." },
];

const events = [
  { date: "Dec 5", day: "Sat", title: "Holiday Tree Lighting", location: "City Hall Plaza", time: "5:00 PM" },
  { date: "Dec 12", day: "Sat", title: "Winter Farmers Market", location: "Lakewood Center", time: "9:00 AM" },
  { date: "Dec 18", day: "Thu", title: "City Council Meeting", location: "Council Chambers", time: "7:00 PM" },
];

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Layout>
      {/* Emergency Alert Banner */}
      <div className="bg-alert text-alert-foreground animate-slide-down">
        <div className="gov-container flex items-center gap-3 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            <strong>Road Closure:</strong> Main St between 3rd and 5th Ave until Nov 30.{" "}
            <a href="#" className="underline font-semibold">View details →</a>
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0">
          <img src={cityHero} alt="Aerial view of Lakewood" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/75" />
        </div>
        <div className="relative gov-container py-20 sm:py-28 text-primary-foreground">
          <h1 className="text-3xl sm:text-5xl font-serif font-bold mb-4 max-w-2xl">
            Welcome to the City of Lakewood
          </h1>
          <p className="text-lg sm:text-xl opacity-90 mb-8 max-w-xl">
            Your gateway to city services, community resources, and local government information.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl">
            <label className="text-sm font-medium mb-2 block opacity-80">How can we help you?</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for services, permits, events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-lg text-foreground bg-card shadow-lg text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Services */}
      <section className="bg-card border-b">
        <div className="gov-container -mt-8 relative z-10 pb-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickServices.map((service) => (
              <Link
                key={service.label}
                to={service.path}
                className="bg-card border rounded-lg p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 group"
              >
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/30 transition-colors">
                  <service.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{service.label}</h3>
                <p className="text-sm text-muted-foreground">{service.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* News & Events */}
      <section className="gov-section">
        <div className="gov-container">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* News */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                  <Megaphone className="h-6 w-6 text-accent" />
                  News & Announcements
                </h2>
                <a href="#" className="text-sm font-medium text-primary hover:underline">View All</a>
              </div>
              <div className="space-y-4">
                {news.map((item, i) => (
                  <article key={i} className="bg-card border rounded-lg p-5 hover:border-accent transition-colors">
                    <time className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{item.date}</time>
                    <h3 className="font-serif font-bold text-lg mt-1 mb-2 text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.excerpt}</p>
                    <a href="#" className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-3 hover:underline">
                      Read more <ChevronRight className="h-3 w-3" />
                    </a>
                  </article>
                ))}
              </div>
            </div>

            {/* Events */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-accent" />
                  Upcoming Events
                </h2>
              </div>
              <div className="space-y-3">
                {events.map((event, i) => (
                  <div key={i} className="bg-card border rounded-lg p-4 flex gap-4 hover:border-accent transition-colors">
                    <div className="bg-primary text-primary-foreground rounded-lg w-14 h-14 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-medium uppercase">{event.day}</span>
                      <span className="text-lg font-bold leading-tight">{event.date.split(" ")[1]}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{event.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{event.location} · {event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/contact" className="block mt-4 text-center py-3 border rounded-lg text-sm font-medium text-primary hover:bg-secondary transition-colors">
                View Full Calendar
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;
