import { Link } from "react-router-dom";

const footerSections = [
  {
    title: "Shop",
    links: [
      { label: "New Arrivals", href: "/products" },
      { label: "Bestsellers", href: "/products" },
      { label: "Sale", href: "/products" },
      { label: "Gift Cards", href: "/" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our Mission", href: "/" },
      { label: "Sustainability", href: "/" },
      { label: "Careers", href: "/" },
      { label: "Press", href: "/" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Shipping & Returns", href: "/" },
      { label: "Size Guide", href: "/" },
      { label: "Contact Us", href: "/" },
      { label: "FAQ", href: "/" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground mt-20" role="contentinfo">
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <h2 className="font-display text-lg font-semibold mb-4">ThreadHouse</h2>
            <p className="text-sm opacity-70 leading-relaxed">
              Sustainable, independently designed clothing for those who wear what they stand for.
            </p>
            <div className="mt-6">
              <label htmlFor="footer-email" className="sr-only">Email for newsletter</label>
              <div className="flex gap-2">
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Your email"
                  className="bg-primary-foreground/10 border border-primary-foreground/20 rounded-md px-3 py-2 text-sm flex-1 placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label="Enter your email for newsletter"
                />
                <button className="bg-terracotta text-terracotta-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
                  Join
                </button>
              </div>
            </div>
          </div>
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-medium text-sm mb-4 uppercase tracking-wider opacity-60">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs opacity-50">© 2026 ThreadHouse. All rights reserved.</p>
          <div className="flex gap-6 text-xs opacity-50">
            <Link to="/" className="hover:opacity-100 transition-opacity">Privacy</Link>
            <Link to="/" className="hover:opacity-100 transition-opacity">Terms</Link>
            <Link to="/" className="hover:opacity-100 transition-opacity">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
