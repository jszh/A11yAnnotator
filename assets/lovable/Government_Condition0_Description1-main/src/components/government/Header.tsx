import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search, Phone } from "lucide-react";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Services", path: "/services" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header>
      {/* Top utility bar */}
      <div className="bg-primary">
        <div className="gov-container flex items-center justify-between py-2 text-sm text-primary-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              (562) 866-9771
            </span>
            <span className="hidden sm:inline">Mon–Fri 8:00 AM – 5:00 PM</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/contact" className="hover:text-accent transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="bg-card shadow-sm border-b-2 border-accent">
        <div className="gov-container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif font-bold text-lg">L</span>
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-primary leading-tight">City of Lakewood</h1>
              <p className="text-xs text-muted-foreground tracking-wide uppercase">Official Government Portal</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-card animate-slide-down">
            <div className="gov-container py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
