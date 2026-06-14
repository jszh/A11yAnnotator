import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search, Globe } from "lucide-react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState("EN");
  const location = useLocation();

  return (
    <header>
      {/* Top utility bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container flex items-center justify-between py-1.5 text-sm">
          <span className="font-display text-xs tracking-wide opacity-90">
            State of Vermont — Official Website
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" role="group" aria-label="Language selector">
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              {["EN", "ES", "FR"].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gov-gold ${
                    lang === l ? "bg-primary-foreground/20" : "hover:bg-primary-foreground/10"
                  }`}
                  aria-pressed={lang === l}
                  aria-label={`Switch to ${l === "EN" ? "English" : l === "ES" ? "Spanish" : "French"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="border-b border-border bg-card shadow-sm" aria-label="Main navigation">
        <div className="container flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-ring rounded" aria-label="Vermont home">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gov-green text-accent-foreground font-display font-bold text-lg" aria-hidden="true">
              VT
            </div>
            <div>
              <div className="font-display text-lg font-bold text-foreground leading-tight">Vermont</div>
              <div className="text-xs text-muted-foreground">Resident Services Portal</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                  location.pathname === link.to
                    ? "bg-secondary text-primary font-semibold"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden rounded-md p-2 text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-md px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                  location.pathname === link.to
                    ? "bg-secondary text-primary font-semibold"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
