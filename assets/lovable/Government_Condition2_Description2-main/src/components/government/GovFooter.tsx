import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";

export default function GovFooter() {
  return (
    <footer className="bg-gov-navy text-gov-navy-foreground" role="contentinfo">
      <div className="gov-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Branding */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gov-gold font-serif text-sm font-bold text-gov-gold-foreground" aria-hidden="true">
                VT
              </div>
              <div>
                <div className="font-serif font-bold">Vermont</div>
                <div className="text-xs text-gov-navy-foreground/60">Resident Services</div>
              </div>
            </div>
            <p className="text-sm text-gov-navy-foreground/70 leading-relaxed">
              Serving the people of Vermont with accessible, transparent government services.
            </p>
          </div>

          {/* Quick Links */}
          <nav aria-label="Footer quick links">
            <h3 className="font-serif font-bold text-sm mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm" role="list">
              {[
                { to: "/services", label: "All Services" },
                { to: "/services/drivers-license", label: "Driver's License" },
                { to: "/services/benefits", label: "Apply for Benefits" },
                { to: "/about", label: "About Vermont" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gov-navy-foreground/70 hover:text-gov-navy-foreground transition-colors focus-ring rounded">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Footer resources">
            <h3 className="font-serif font-bold text-sm mb-3">Resources</h3>
            <ul className="space-y-2 text-sm" role="list">
              <li><Link to="/about" className="text-gov-navy-foreground/70 hover:text-gov-navy-foreground transition-colors focus-ring rounded">Open Data</Link></li>
              <li><Link to="/about" className="text-gov-navy-foreground/70 hover:text-gov-navy-foreground transition-colors focus-ring rounded">Transparency Reports</Link></li>
              <li><Link to="/contact" className="text-gov-navy-foreground/70 hover:text-gov-navy-foreground transition-colors focus-ring rounded">Contact Us</Link></li>
              <li><Link to="/about" className="text-gov-navy-foreground/70 hover:text-gov-navy-foreground transition-colors focus-ring rounded">Accessibility</Link></li>
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="font-serif font-bold text-sm mb-3">Contact</h3>
            <ul className="space-y-3 text-sm" role="list">
              <li className="flex items-center gap-2 text-gov-navy-foreground/70">
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>1-800-VT-HELP1</span>
              </li>
              <li className="flex items-center gap-2 text-gov-navy-foreground/70">
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>help@vermont.gov</span>
              </li>
              <li className="flex items-start gap-2 text-gov-navy-foreground/70">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>109 State Street<br />Montpelier, VT 05609</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gov-navy-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gov-navy-foreground/50">
          <p>© {new Date().getFullYear()} State of Vermont. All rights reserved.</p>
          <p>An official website of the State of Vermont.</p>
        </div>
      </div>
    </footer>
  );
}
