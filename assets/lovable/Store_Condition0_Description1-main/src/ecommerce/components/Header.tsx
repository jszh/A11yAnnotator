import { Link } from "react-router-dom";
import { Search, ShoppingCart, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "../context/CartContext";
import { useState } from "react";

const Header = () => {
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-xs py-1.5">
        <div className="container flex items-center justify-between">
          <span>Free shipping on orders over $50</span>
          <div className="hidden sm:flex items-center gap-4">
            <span>Help & Support</span>
            <span>Track Order</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container flex items-center gap-4 py-3">
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        <Link to="/" className="font-display text-2xl font-bold tracking-tight text-foreground shrink-0">
          Nova<span className="text-accent">Mart</span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search products, brands, and more..."
              className="w-full h-10 pl-4 pr-10 rounded-lg border border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>
          <Link to="/account">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden lg:block border-t border-border">
        <div className="container flex items-center gap-6 py-2 text-sm">
          <Link to="/products" className="font-medium text-foreground hover:text-accent transition-colors">All Products</Link>
          <Link to="/products?category=electronics" className="text-muted-foreground hover:text-foreground transition-colors">Electronics</Link>
          <Link to="/products?category=kitchen" className="text-muted-foreground hover:text-foreground transition-colors">Kitchen</Link>
          <Link to="/products?category=clothing" className="text-muted-foreground hover:text-foreground transition-colors">Clothing</Link>
          <Link to="/products?category=sports" className="text-muted-foreground hover:text-foreground transition-colors">Sports</Link>
          <span className="text-accent font-semibold">🔥 Flash Sale</span>
        </div>
      </nav>
    </header>
  );
};

export default Header;
