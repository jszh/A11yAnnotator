import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search, Globe } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function GovHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState("EN");
  const location = useLocation();

  return (
    <header className="bg-gov-navy border-b border-border">
      {/* Top utility bar */}
      <div className="bg-primary">
        <div className="gov-container flex items-center justify-between py-1.5 text-xs text-primary-foreground">
          <span className="font-medium">State of Vermont — Official Government Website</span>
          <div className="flex items-center gap-3" role="group" aria-label="Language selector">
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            {["EN", "ES", "FR"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`focus-ring rounded px-1.5 py-0.5 transition-colors ${
                  lang === l ? "bg-primary-foreground/20 font-semibold" : "hover:bg-primary-foreground/10"
                }`}
                aria-label={`Switch language to ${l === "EN" ? "English" : l === "ES" ? "Spanish" : "French"}`}
                aria-pressed={lang === l}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="gov-container flex items-center justify-between py-3" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-3 focus-ring rounded" aria-label="State of Vermont Home">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gov-gold font-serif text-lg font-bold text-gov-gold-foreground" aria-hidden="true">
            VT
          </div>
          <div className="text-gov-navy-foreground">
            <div className="text-lg font-bold font-serif leading-tight">Vermont</div>
            <div className="text-xs text-gov-navy-foreground/70">Resident Services Portal</div>
          </div>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {navLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`focus-ring rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "bg-primary-foreground/15 text-gov-navy-foreground"
                    : "text-gov-navy-foreground/80 hover:bg-primary-foreground/10 hover:text-gov-navy-foreground"
                }`}
                aria-current={location.pathname === link.to ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-gov-navy-foreground hover:bg-primary-foreground/10"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-primary-foreground/10 bg-gov-navy">
          <ul className="gov-container py-3 space-y-1" role="list">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`focus-ring block rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? "bg-primary-foreground/15 text-gov-navy-foreground"
                      : "text-gov-navy-foreground/80 hover:bg-primary-foreground/10"
                  }`}
                  aria-current={location.pathname === link.to ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
