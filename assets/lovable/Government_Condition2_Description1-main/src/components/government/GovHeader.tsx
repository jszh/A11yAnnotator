import { Link, useLocation } from "react-router-dom";
import { Phone, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Home", path: "/government" },
  { label: "Services", path: "/government/services" },
  { label: "About", path: "/government/about" },
  { label: "Contact", path: "/government/contact" },
];

const GovHeader = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-border bg-card">
      {/* Top utility bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto flex items-center justify-between px-4 py-1.5 text-sm">
          <span className="font-sans">Official Website of the City of Lakewood</span>
          <a
            href="tel:5555551234"
            className="flex items-center gap-1.5 text-primary-foreground/90 hover:text-primary-foreground transition-colors"
            aria-label="Call City Hall at 555-555-1234"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            <span>(555) 555-1234</span>
          </a>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/government" className="flex items-center gap-3" aria-label="City of Lakewood Home">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-serif font-bold text-lg" aria-hidden="true">
            CL
          </div>
          <div>
            <div className="font-serif text-xl font-bold text-foreground leading-tight">City of Lakewood</div>
            <div className="text-xs text-muted-foreground font-sans tracking-wide uppercase">Official Government Portal</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`px-4 py-2 rounded font-sans font-medium text-sm transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded text-foreground hover:bg-secondary"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav aria-label="Mobile navigation" id="mobile-nav" className="md:hidden border-t border-border">
          <ul className="container mx-auto px-4 py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-3 rounded font-sans font-medium text-sm transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default GovHeader;
