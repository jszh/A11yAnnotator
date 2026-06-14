import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";

const navLinks = [
  { label: "Climate", href: "/mass-media/category/climate" },
  { label: "Energy", href: "/mass-media/category/climate" },
  { label: "Policy", href: "/mass-media/category/climate" },
  { label: "Science", href: "/mass-media/category/climate" },
  { label: "Data", href: "/mass-media/category/climate" },
  { label: "Perspectives", href: "/mass-media/perspectives" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Breaking news banner */}
      <div className="bg-editorial-red text-primary-foreground text-sm font-sans py-2 px-4 text-center font-semibold tracking-wide" role="banner">
        <span className="uppercase tracking-widest mr-2 font-bold">Breaking</span>
        New EPA report reveals 40% of U.S. aquifers contaminated beyond safe drinking thresholds
      </div>

      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between py-4 border-b border-border">
            <Link to="/mass-media" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" aria-label="Groundwork homepage">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Groundwork</span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <button className="p-2 rounded hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Search">
                <Search className="w-5 h-5 text-muted-foreground" />
              </button>
              <Link
                to="/mass-media/subscribe"
                className="bg-primary text-primary-foreground font-sans text-sm font-semibold px-5 py-2 rounded hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Support Us
              </Link>
            </div>
            <button
              className="md:hidden p-2 rounded hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 py-2" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={`font-sans text-sm font-medium px-3 py-1.5 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  location.pathname === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-border bg-background px-4 pb-4" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block font-sans text-base font-medium px-3 py-3 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  location.pathname === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/mass-media/subscribe"
              onClick={() => setMobileOpen(false)}
              className="block mt-2 text-center bg-primary text-primary-foreground font-sans text-sm font-semibold px-5 py-3 rounded hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Support Us
            </Link>
          </nav>
        )}
      </header>
    </>
  );
};

export default Header;
