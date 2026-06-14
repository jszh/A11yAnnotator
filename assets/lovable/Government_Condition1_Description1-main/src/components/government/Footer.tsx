import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="gov-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-serif font-bold text-lg">L</span>
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg">City of Lakewood</h3>
              </div>
            </div>
            <p className="text-sm opacity-80 leading-relaxed">
              Serving approximately 160,000 residents with transparency, efficiency, and dedication.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif font-bold mb-4 text-accent">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/services" className="opacity-80 hover:opacity-100 transition-opacity">All Services</Link></li>
              <li><Link to="/services/permits" className="opacity-80 hover:opacity-100 transition-opacity">Permits & Licenses</Link></li>
              <li><Link to="/services/pay-bill" className="opacity-80 hover:opacity-100 transition-opacity">Pay a Bill</Link></li>
              <li><Link to="/about" className="opacity-80 hover:opacity-100 transition-opacity">About Lakewood</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif font-bold mb-4 text-accent">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                <span className="opacity-80">6000 Woodruff Ave<br />Lakewood, CA 90713</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-accent" />
                <span className="opacity-80">(562) 866-9771</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-accent" />
                <span className="opacity-80">info@lakewoodcity.org</span>
              </li>
            </ul>
          </div>

          {/* Hours & Social */}
          <div>
            <h4 className="font-serif font-bold mb-4 text-accent">City Hall Hours</h4>
            <p className="text-sm opacity-80 mb-4">
              Monday – Friday<br />
              8:00 AM – 5:00 PM<br />
              Closed on public holidays
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-foreground/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs opacity-60">
          <p>© 2026 City of Lakewood. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
