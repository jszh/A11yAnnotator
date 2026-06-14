import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import { useState } from "react";

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
    <header className="border-b border-border bg-card">
      {/* Top utility bar */}
      <div className="bg-primary">
        <div className="container flex items-center justify-between py-1.5 text-sm text-primary-foreground">
          <span className="font-body">An official website of the State of Vermont</span>
          <div className="hidden md:flex items-center gap-4">
            <button className="hover:underline font-semibold">EN</button>
            <button className="hover:underline opacity-75">ES</button>
            <button className="hover:underline opacity-75">FR</button>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-heading font-bold text-lg">VT</div>
          <div>
            <div className="font-heading font-bold text-lg leading-tight text-foreground">State of Vermont</div>
            <div className="text-xs text-muted-foreground font-body">Official Resident Services Portal</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-md text-sm font-semibold font-body transition-colors ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-border bg-card pb-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-6 py-3 font-body font-semibold text-sm ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Header;
