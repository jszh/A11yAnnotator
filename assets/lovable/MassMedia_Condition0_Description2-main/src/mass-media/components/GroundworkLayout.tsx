import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Climate", path: "/category/climate" },
  { label: "Energy", path: "/category/climate" },
  { label: "Policy", path: "/category/climate" },
  { label: "Science", path: "/category/climate" },
  { label: "Data", path: "/category/climate" },
  { label: "Perspectives", path: "/opinion" },
];

export default function GroundworkLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Breaking news bar */}
      <div className="gw-breaking-bar">
        Breaking: EPA releases new groundwater contamination data for 12 Western states — <Link to="/article" className="underline">Read the analysis →</Link>
      </div>

      {/* Header */}
      <header className="border-b gw-rule">
        <div className="gw-section flex items-center justify-between py-4">
          <Link to="/" className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Groundwork
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.path}
                className={`font-sans text-sm font-medium uppercase tracking-wider transition-colors hover:text-primary ${
                  location.pathname === l.path ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button className="p-2 text-muted-foreground hover:text-foreground">
              <Search className="w-5 h-5" />
            </button>
            <Link
              to="/subscribe"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Support Us
            </Link>
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t gw-rule pb-4">
            <div className="gw-section flex flex-col gap-3 pt-4">
              {navLinks.map((l) => (
                <Link
                  key={l.label}
                  to={l.path}
                  onClick={() => setMenuOpen(false)}
                  className="font-sans text-sm font-medium uppercase tracking-wider text-muted-foreground hover:text-primary"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to="/subscribe"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded bg-primary text-primary-foreground"
              >
                Support Us
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="gw-surface-dark border-t border-border/20">
        <div className="gw-section py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="font-serif text-xl font-bold mb-3">Groundwork</h3>
              <p className="text-sm leading-relaxed opacity-80 max-w-md">
                Independent, data-driven investigative journalism focused on climate,
                science, and environmental policy. Reader-supported since 2019.
              </p>
            </div>
            <div>
              <h4 className="font-sans text-xs font-bold uppercase tracking-widest mb-4 opacity-60">Sections</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><Link to="/category/climate" className="hover:opacity-100">Climate</Link></li>
                <li><Link to="/category/climate" className="hover:opacity-100">Energy</Link></li>
                <li><Link to="/category/climate" className="hover:opacity-100">Policy</Link></li>
                <li><Link to="/opinion" className="hover:opacity-100">Perspectives</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-sans text-xs font-bold uppercase tracking-widest mb-4 opacity-60">Support</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><Link to="/subscribe" className="hover:opacity-100">Become a Member</Link></li>
                <li><a href="#" className="hover:opacity-100">Newsletter</a></li>
                <li><a href="#" className="hover:opacity-100">Contact</a></li>
                <li><a href="#" className="hover:opacity-100">Ethics Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/10 mt-10 pt-6 text-xs opacity-50 text-center">
            © 2026 Groundwork Media. All rights reserved. This is a mockup for demonstration purposes.
          </div>
        </div>
      </footer>
    </div>
  );
}
