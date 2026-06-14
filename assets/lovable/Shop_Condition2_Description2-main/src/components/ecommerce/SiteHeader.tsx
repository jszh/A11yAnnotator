import { Link } from "react-router-dom";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

export default function SiteHeader() {
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/" className="font-display text-xl font-bold tracking-tight" aria-label="ThreadHouse home">
            ThreadHouse
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
          <Link to="/shop" className="text-sm font-medium hover:text-primary transition-colors">Shop</Link>
          <Link to="/shop?mood=Minimalist" className="text-sm font-medium hover:text-primary transition-colors">Minimalist</Link>
          <Link to="/shop?mood=Streetwear" className="text-sm font-medium hover:text-primary transition-colors">Streetwear</Link>
          <Link to="/shop?mood=Workwear" className="text-sm font-medium hover:text-primary transition-colors">Workwear</Link>
          <Link to="/shop?mood=Weekend" className="text-sm font-medium hover:text-primary transition-colors">Weekend</Link>
        </nav>

        <div className="flex items-center gap-2">
          {searchOpen && (
            <input
              type="search"
              placeholder="Search products..."
              className="w-48 px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Search products"
              autoFocus
              onBlur={() => setSearchOpen(false)}
            />
          )}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-md hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            to="/account"
            className="p-2 rounded-md hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="My account"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            to="/cart"
            className="p-2 rounded-md hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring relative"
            aria-label={`Shopping cart, ${totalItems} items`}
          >
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center" aria-hidden="true">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <nav className="lg:hidden border-t border-border bg-background p-4 space-y-2" aria-label="Mobile navigation">
          {[
            { to: "/", label: "Home" },
            { to: "/shop", label: "Shop All" },
            { to: "/shop?mood=Minimalist", label: "Minimalist" },
            { to: "/shop?mood=Streetwear", label: "Streetwear" },
            { to: "/shop?mood=Workwear", label: "Workwear" },
            { to: "/shop?mood=Weekend", label: "Weekend" },
          ].map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="block py-2 px-3 rounded-md text-sm font-medium hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
