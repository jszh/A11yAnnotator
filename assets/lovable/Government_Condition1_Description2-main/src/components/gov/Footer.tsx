import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground" role="contentinfo">
    <div className="container py-12">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="font-display text-lg font-bold mb-3">State of Vermont</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            Serving the people of Vermont with transparency, accessibility, and efficiency.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider opacity-70">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {[
              { to: "/services", label: "All Services" },
              { to: "/services/drivers-license", label: "Driver's License" },
              { to: "/services/benefits", label: "Apply for Benefits" },
              { to: "/contact", label: "Contact Us" },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="opacity-80 hover:opacity-100 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-gov-gold rounded">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider opacity-70">Contact</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li>General Helpline: (802) 828-1110</li>
            <li>Mon–Fri, 8:00 AM – 5:00 PM ET</li>
            <li>109 State Street, Montpelier, VT 05609</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider opacity-70">Accessibility</h4>
          <p className="text-sm opacity-80 leading-relaxed">
            This site is committed to WCAG 2.1 AA compliance. If you encounter accessibility barriers,{" "}
            <Link to="/contact" className="underline focus:outline-none focus:ring-2 focus:ring-gov-gold rounded">
              please let us know
            </Link>.
          </p>
        </div>
      </div>
      <div className="mt-10 border-t border-primary-foreground/20 pt-6 text-center text-xs opacity-60">
        © {new Date().getFullYear()} State of Vermont. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
