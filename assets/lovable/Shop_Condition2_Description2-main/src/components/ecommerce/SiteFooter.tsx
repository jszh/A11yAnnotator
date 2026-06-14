import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="bg-foreground text-background mt-20" role="contentinfo">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <h2 className="font-display text-xl font-bold mb-4">ThreadHouse</h2>
            <p className="text-sm opacity-70 leading-relaxed">
              Sustainable, independently designed clothing for people who wear what they stand for.
            </p>
          </div>
          <div>
            <h3 className="font-body text-sm font-semibold uppercase tracking-wider mb-4 opacity-60">Shop</h3>
            <ul className="space-y-2">
              {["New Arrivals", "Best Sellers", "Sale"].map(item => (
                <li key={item}><Link to="/shop" className="text-sm opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">{item}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-body text-sm font-semibold uppercase tracking-wider mb-4 opacity-60">About</h3>
            <ul className="space-y-2">
              {["Our Mission", "Sustainability", "Careers"].map(item => (
                <li key={item}><Link to="/" className="text-sm opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">{item}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-body text-sm font-semibold uppercase tracking-wider mb-4 opacity-60">Help</h3>
            <ul className="space-y-2">
              {["Shipping & Returns", "Size Guide", "Contact Us"].map(item => (
                <li key={item}><Link to="/" className="text-sm opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">{item}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-background/20 text-sm opacity-50 text-center">
          © {new Date().getFullYear()} ThreadHouse. All rights reserved. Built with care for people and planet.
        </div>
      </div>
    </footer>
  );
}
