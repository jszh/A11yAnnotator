import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";

const GovFooter = () => (
  <footer className="bg-primary text-primary-foreground" role="contentinfo">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <h2 className="font-serif text-lg font-bold mb-3">City of Lakewood</h2>
          <p className="text-sm text-primary-foreground/80 font-sans leading-relaxed">
            Serving approximately 160,000 residents with transparency, efficiency, and community focus.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold mb-3">Quick Links</h2>
          <ul className="space-y-2 text-sm font-sans">
            <li><Link to="/government/services" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Services</Link></li>
            <li><Link to="/government/services/permits" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Permits & Licenses</Link></li>
            <li><Link to="/government/services/pay-bill" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Pay a Bill</Link></li>
            <li><Link to="/government/about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">About</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold mb-3">Contact</h2>
          <ul className="space-y-2 text-sm font-sans">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
              <a href="tel:5555551234" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">(555) 555-1234</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <a href="mailto:info@lakewoodgov.org" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">info@lakewoodgov.org</a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="text-primary-foreground/80">123 Civic Center Dr<br />Lakewood, CA 90712</span>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold mb-3">Connect</h2>
          <ul className="space-y-2 text-sm font-sans">
            <li><a href="https://facebook.com" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors" target="_blank" rel="noopener noreferrer">Facebook</a></li>
            <li><a href="https://twitter.com" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors" target="_blank" rel="noopener noreferrer">X (Twitter)</a></li>
            <li><a href="https://instagram.com" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors" target="_blank" rel="noopener noreferrer">Instagram</a></li>
            <li><a href="https://youtube.com" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors" target="_blank" rel="noopener noreferrer">YouTube</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-10 border-t border-primary-foreground/20 pt-6 text-center text-sm text-primary-foreground/60 font-sans">
        <p>&copy; {new Date().getFullYear()} City of Lakewood. All rights reserved.</p>
        <p className="mt-1">
          <a href="#" className="hover:text-primary-foreground transition-colors">Privacy Policy</a>
          {" · "}
          <a href="#" className="hover:text-primary-foreground transition-colors">Accessibility</a>
          {" · "}
          <a href="#" className="hover:text-primary-foreground transition-colors">Terms of Use</a>
        </p>
      </div>
    </div>
  </footer>
);

export default GovFooter;
