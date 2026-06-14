import { Link } from "react-router-dom";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-1 text-xs tracking-widest text-muted-foreground border-b border-border">
          <span>Free shipping on orders over $150</span>
          <span>Sustainably made. Always.</span>
        </div>

        {/* Main nav */}
        <div className="flex items-center justify-between py-4">
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/" className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            ThreadHouse
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide uppercase">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">Home</Link>
            <Link to="/products" className="text-foreground hover:text-primary transition-colors">Shop</Link>
            <Link to="/products?category=Tops" className="text-muted-foreground hover:text-foreground transition-colors">Tops</Link>
            <Link to="/products?category=Bottoms" className="text-muted-foreground hover:text-foreground transition-colors">Bottoms</Link>
            <Link to="/products?category=Outerwear" className="text-muted-foreground hover:text-foreground transition-colors">Outerwear</Link>
            <Link to="/products?category=Accessories" className="text-muted-foreground hover:text-foreground transition-colors">Accessories</Link>
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={() => setSearchOpen(!searchOpen)} className="text-foreground hover:text-primary transition-colors">
              <Search size={18} />
            </button>
            <Link to="/account" className="text-foreground hover:text-primary transition-colors">
              <User size={18} />
            </Link>
            <Link to="/cart" className="relative text-foreground hover:text-primary transition-colors">
              <ShoppingBag size={18} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
            </Link>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="pb-4">
            <input
              type="text"
              placeholder="Search for sustainable fashion..."
              className="w-full px-4 py-3 bg-muted text-foreground text-sm rounded-sm border-none outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        )}

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-3 text-sm font-medium tracking-wide uppercase">
            <Link to="/" className="text-foreground py-2 border-b border-border" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/products" className="text-foreground py-2 border-b border-border" onClick={() => setMenuOpen(false)}>Shop All</Link>
            <Link to="/products?category=Tops" className="text-muted-foreground py-2 border-b border-border" onClick={() => setMenuOpen(false)}>Tops</Link>
            <Link to="/products?category=Bottoms" className="text-muted-foreground py-2 border-b border-border" onClick={() => setMenuOpen(false)}>Bottoms</Link>
            <Link to="/products?category=Outerwear" className="text-muted-foreground py-2 border-b border-border" onClick={() => setMenuOpen(false)}>Outerwear</Link>
            <Link to="/products?category=Accessories" className="text-muted-foreground py-2 border-b border-border" onClick={() => setMenuOpen(false)}>Accessories</Link>
            <Link to="/account" className="text-foreground py-2" onClick={() => setMenuOpen(false)}>My Account</Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
