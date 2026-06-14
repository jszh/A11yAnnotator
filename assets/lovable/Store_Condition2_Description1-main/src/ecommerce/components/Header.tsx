import { Link } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useState } from "react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/products", label: "All Products" },
  { to: "/products?category=Electronics", label: "Electronics" },
  { to: "/products?category=Kitchen", label: "Kitchen" },
  { to: "/products?category=Clothing", label: "Clothing" },
];

export default function Header() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border" role="banner">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      
      {/* Top bar */}
      <div className="bg-foreground text-background text-xs py-1.5">
        <div className="container flex justify-between items-center">
          <span>Free shipping on orders over $50</span>
          <span>📞 1-800-NOVAMART</span>
        </div>
      </div>

      {/* Main header */}
      <div className="container py-3">
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded-md hover:bg-secondary"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="NovaMart home">
            <span className="text-2xl font-display font-bold tracking-tight">
              Nova<span className="text-primary">Mart</span>
            </span>
          </Link>

          {/* Search */}
          <form
            role="search"
            aria-label="Search products"
            className="hidden md:flex flex-1 max-w-xl"
            onSubmit={e => { e.preventDefault(); }}
          >
            <div className="relative w-full">
              <label htmlFor="site-search" className="sr-only">Search products</label>
              <input
                id="site-search"
                type="search"
                placeholder="Search products, brands, categories..."
                className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                aria-label="Submit search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Link
              to="/account"
              className="p-2 rounded-md hover:bg-secondary transition-colors"
              aria-label="My account"
            >
              <User className="w-5 h-5" />
            </Link>
            <Link
              to="/cart"
              className="relative p-2 rounded-md hover:bg-secondary transition-colors"
              aria-label={`Shopping cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center" aria-hidden="true">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <form role="search" aria-label="Search products" className="md:hidden mt-3" onSubmit={e => e.preventDefault()}>
          <div className="relative">
            <label htmlFor="mobile-search" className="sr-only">Search products</label>
            <input
              id="mobile-search"
              type="search"
              placeholder="Search products..."
              className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-primary text-primary-foreground" aria-label="Submit search">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Desktop nav */}
      <nav aria-label="Main navigation" className="hidden lg:block border-t border-border">
        <div className="container">
          <ul className="flex items-center gap-1 py-1" role="list">
            {navLinks.map(link => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="block px-4 py-2 text-sm font-medium rounded-md hover:bg-secondary transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile nav */}
      {menuOpen && (
        <nav id="mobile-nav" aria-label="Mobile navigation" className="lg:hidden border-t border-border bg-card animate-fade-in">
          <ul className="container py-2 space-y-1" role="list">
            {navLinks.map(link => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="block px-4 py-3 text-sm font-medium rounded-md hover:bg-secondary"
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
