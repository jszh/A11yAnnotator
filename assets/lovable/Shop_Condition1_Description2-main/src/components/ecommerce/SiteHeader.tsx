import { Link } from "react-router-dom";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "New Arrivals", href: "/products" },
  { label: "Women", href: "/products" },
  { label: "Men", href: "/products" },
  { label: "Accessories", href: "/products" },
  { label: "Our Story", href: "/" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border" role="banner">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 -ml-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Logo */}
        <Link to="/" className="font-display text-xl font-semibold tracking-tight" aria-label="ThreadHouse home">
          ThreadHouse
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-secondary rounded-md transition-colors" aria-label="Search products">
            <Search className="h-5 w-5" />
          </button>
          <Link to="/account" className="p-2 hover:bg-secondary rounded-md transition-colors" aria-label="My account">
            <User className="h-5 w-5" />
          </Link>
          <Link to="/cart" className="p-2 hover:bg-secondary rounded-md transition-colors relative" aria-label="Shopping cart, 2 items">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 bg-terracotta text-terracotta-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
              2
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-background px-4 pb-4" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="block py-3 text-sm font-medium text-foreground border-b border-border last:border-0"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
