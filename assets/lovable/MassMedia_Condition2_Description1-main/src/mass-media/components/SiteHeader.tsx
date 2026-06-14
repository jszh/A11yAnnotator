import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";

const navLinks = [
  { label: "World", href: "/mass-media/world" },
  { label: "Politics", href: "/mass-media/world" },
  { label: "Tech", href: "/mass-media/world" },
  { label: "Culture", href: "/mass-media/world" },
  { label: "Opinion", href: "/mass-media/opinion" },
  { label: "Subscribe", href: "/mass-media/subscribe" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container flex items-center justify-between py-3">
        <Link to="/mass-media" className="flex items-center gap-2" aria-label="The Meridian — Home">
          <span className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            The Meridian
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-sm font-semibold uppercase tracking-wider text-foreground hover:text-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <button aria-label="Search" className="p-2 text-foreground hover:text-accent transition-colors">
            <Search size={18} />
          </button>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav aria-label="Mobile navigation" className="md:hidden border-t border-border bg-card">
          <ul className="flex flex-col">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.href}
                  className="block px-4 py-3 text-sm font-semibold uppercase tracking-wider text-foreground hover:bg-secondary transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
