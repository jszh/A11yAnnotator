import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";

const navItems = [
  { label: "Climate", href: "/mass-media/category/climate" },
  { label: "Energy", href: "/mass-media/category/climate" },
  { label: "Policy", href: "/mass-media/category/climate" },
  { label: "Science", href: "/mass-media/category/climate" },
  { label: "Data", href: "/mass-media/category/climate" },
  { label: "Perspectives", href: "/mass-media/opinion" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between h-14">
          <Link to="/mass-media" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center text-primary-foreground font-sans font-black text-lg leading-none">
              G
            </span>
            <span className="font-serif font-bold text-xl tracking-tight text-foreground">
              Groundwork
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`px-3 py-1.5 text-sm font-sans font-medium rounded-sm transition-colors
                    ${active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground hover:bg-muted"}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button aria-label="Search articles" className="p-2 rounded-sm text-foreground/60 hover:text-foreground hover:bg-muted transition-colors">
              <Search size={18} />
            </button>
            <Link
              to="/mass-media/subscribe"
              className="hidden sm:inline-flex px-4 py-1.5 text-sm font-sans font-semibold bg-accent text-accent-foreground rounded-sm hover:opacity-90 transition-opacity"
            >
              Support Us
            </Link>
            <button
              className="md:hidden p-2 rounded-sm text-foreground/60 hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 border-t border-border pt-3" aria-label="Mobile navigation">
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="block px-3 py-2 text-sm font-sans font-medium text-foreground/80 hover:bg-muted rounded-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/mass-media/subscribe"
                  className="block px-3 py-2 text-sm font-sans font-semibold text-accent-foreground bg-accent rounded-sm mt-2"
                  onClick={() => setMobileOpen(false)}
                >
                  Support Us
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}