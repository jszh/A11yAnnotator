import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-display text-lg font-bold mb-4">
              Nova<span className="text-accent">Mart</span>
            </h3>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              Your one-stop marketplace for electronics, home goods, and apparel.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Shop</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/products?category=electronics" className="hover:text-primary-foreground transition-colors">Electronics</Link></li>
              <li><Link to="/products?category=kitchen" className="hover:text-primary-foreground transition-colors">Kitchen</Link></li>
              <li><Link to="/products?category=clothing" className="hover:text-primary-foreground transition-colors">Clothing</Link></li>
              <li><Link to="/products?category=sports" className="hover:text-primary-foreground transition-colors">Sports</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Customer Service</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><span className="hover:text-primary-foreground transition-colors cursor-pointer">Contact Us</span></li>
              <li><span className="hover:text-primary-foreground transition-colors cursor-pointer">Shipping & Returns</span></li>
              <li><span className="hover:text-primary-foreground transition-colors cursor-pointer">FAQ</span></li>
              <li><span className="hover:text-primary-foreground transition-colors cursor-pointer">Track Order</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Stay Connected</h4>
            <p className="text-sm text-primary-foreground/70 mb-3">Get exclusive deals & updates</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 h-9 px-3 rounded-md bg-primary-foreground/10 border border-primary-foreground/20 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-primary-foreground/10 text-center text-xs text-primary-foreground/50">
          © 2026 NovaMart. All rights reserved. This is a demo store.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
