import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="font-heading font-bold text-lg mb-3">State of Vermont</div>
          <p className="text-sm opacity-80 font-body leading-relaxed">
            Serving Vermont residents with accessible, transparent, and efficient government services.
          </p>
        </div>
        <div>
          <h4 className="font-heading font-bold text-sm mb-3 uppercase tracking-wide opacity-70">Services</h4>
          <ul className="space-y-2 text-sm font-body">
            <li><Link to="/services/drivers-license" className="opacity-80 hover:opacity-100 hover:underline">Driver's License</Link></li>
            <li><Link to="/services/benefits" className="opacity-80 hover:opacity-100 hover:underline">Apply for Benefits</Link></li>
            <li><Link to="/services" className="opacity-80 hover:opacity-100 hover:underline">All Services</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-heading font-bold text-sm mb-3 uppercase tracking-wide opacity-70">Government</h4>
          <ul className="space-y-2 text-sm font-body">
            <li><Link to="/about" className="opacity-80 hover:opacity-100 hover:underline">About Vermont</Link></li>
            <li><Link to="/contact" className="opacity-80 hover:opacity-100 hover:underline">Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-heading font-bold text-sm mb-3 uppercase tracking-wide opacity-70">Contact</h4>
          <ul className="space-y-2 text-sm font-body opacity-80">
            <li>109 State Street</li>
            <li>Montpelier, VT 05609</li>
            <li>(802) 828-1110</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center text-xs font-body opacity-60">
        © 2026 State of Vermont. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
