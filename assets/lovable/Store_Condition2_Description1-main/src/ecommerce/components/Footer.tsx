import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background mt-16" role="contentinfo">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h2 className="text-lg font-display font-bold mb-4">
              Nova<span className="text-primary">Mart</span>
            </h2>
            <p className="text-sm opacity-70 leading-relaxed">
              Your one-stop marketplace for electronics, home goods, apparel, and more. Quality products at competitive prices.
            </p>
          </div>
          <nav aria-label="Shop links">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-80">Shop</h3>
            <ul className="space-y-2">
              {["Electronics", "Kitchen", "Clothing", "Sports", "Home"].map(cat => (
                <li key={cat}>
                  <Link to={`/products?category=${cat}`} className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Support links">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-80">Support</h3>
            <ul className="space-y-2">
              {["Help Center", "Shipping Info", "Returns", "Contact Us"].map(item => (
                <li key={item}>
                  <span className="text-sm opacity-70 cursor-default">{item}</span>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Company links">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-80">Company</h3>
            <ul className="space-y-2">
              {["About Us", "Careers", "Press", "Affiliates"].map(item => (
                <li key={item}>
                  <span className="text-sm opacity-70 cursor-default">{item}</span>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="border-t border-background/20 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs opacity-60">© 2026 NovaMart. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-xs opacity-60">Privacy Policy</span>
            <span className="text-xs opacity-60">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
