import { Link } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "World", path: "/mass-media/world" },
  { label: "Politics", path: "/mass-media/world" },
  { label: "Tech", path: "/mass-media/world" },
  { label: "Culture", path: "/mass-media/world" },
  { label: "Opinion", path: "/mass-media/opinion" },
  { label: "Subscribe", path: "/mass-media/subscribe" },
];

const SiteHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="w-full">
      {/* Breaking news ticker */}
      <div className="bg-breaking overflow-hidden">
        <div className="flex items-center h-8">
          <span className="bg-foreground text-background px-3 py-1 text-xs font-bold uppercase tracking-widest shrink-0 font-sans">
            Breaking
          </span>
          <div className="overflow-hidden flex-1">
            <div className="ticker-scroll whitespace-nowrap flex gap-16 px-4">
              <span className="text-destructive-foreground text-sm font-sans">
                UN Emergency Session Called Over Red Sea Tensions — Security Council convenes as maritime attacks escalate
              </span>
              <span className="text-destructive-foreground text-sm font-sans">
                Global Markets React to Federal Reserve's Surprise Rate Decision
              </span>
              <span className="text-destructive-foreground text-sm font-sans">
                UN Emergency Session Called Over Red Sea Tensions — Security Council convenes as maritime attacks escalate
              </span>
              <span className="text-destructive-foreground text-sm font-sans">
                Global Markets React to Federal Reserve's Surprise Rate Decision
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main masthead */}
      <div className="bg-primary">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/mass-media" className="text-primary-foreground">
              <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">
                The Meridian
              </h1>
              <p className="text-xs font-sans uppercase tracking-[0.3em] text-primary-foreground/60 mt-0.5">
                Independent Journalism Since 2024
              </p>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              <button className="text-primary-foreground/70 hover:text-accent transition-colors p-2">
                <Search className="w-5 h-5" />
              </button>
            </div>

            <button
              className="md:hidden text-primary-foreground p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Navigation bar */}
        <nav className="border-t border-primary-foreground/10">
          <div className="container mx-auto px-4">
            <ul className="hidden md:flex items-center gap-8 py-3">
              {navItems.map((item) => (
                <li key={item.label}>
                  <Link to={item.path} className="nav-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-primary-foreground/10 pb-4">
            <ul className="container mx-auto px-4 flex flex-col gap-3 pt-3">
              {navItems.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="nav-link block py-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default SiteHeader;
