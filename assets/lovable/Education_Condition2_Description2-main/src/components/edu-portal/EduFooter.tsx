import { Link } from "react-router-dom";
import { BookOpen, Mail, Phone, MapPin } from "lucide-react";

export function EduFooter() {
  return (
    <footer className="bg-edu-navy text-primary-foreground/70" role="contentinfo">
      <div className="container mx-auto px-4 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/edu-portal" className="flex items-center gap-2 text-primary-foreground font-bold text-lg mb-3">
              <BookOpen className="h-6 w-6 text-edu-amber" aria-hidden="true" />
              SkillForge
            </Link>
            <p className="text-sm leading-relaxed">
              Industry-recognized certificates for career changers. Accredited programs in trades, healthcare, IT, and business.
            </p>
          </div>

          {/* Programs */}
          <div>
            <h3 className="font-body font-semibold text-primary-foreground mb-3 text-sm uppercase tracking-wider">Programs</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/edu-portal/courses" className="hover:text-edu-amber transition-colors">Healthcare Support</Link></li>
              <li><Link to="/edu-portal/courses" className="hover:text-edu-amber transition-colors">IT & Cybersecurity</Link></li>
              <li><Link to="/edu-portal/courses" className="hover:text-edu-amber transition-colors">Skilled Trades</Link></li>
              <li><Link to="/edu-portal/courses" className="hover:text-edu-amber transition-colors">Business Admin</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-body font-semibold text-primary-foreground mb-3 text-sm uppercase tracking-wider">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/edu-portal/pricing" className="hover:text-edu-amber transition-colors">Pricing & Financial Aid</Link></li>
              <li><Link to="/edu-portal" className="hover:text-edu-amber transition-colors">Accreditation</Link></li>
              <li><Link to="/edu-portal" className="hover:text-edu-amber transition-colors">Accessibility</Link></li>
              <li><Link to="/edu-portal" className="hover:text-edu-amber transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-body font-semibold text-primary-foreground mb-3 text-sm uppercase tracking-wider">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-edu-amber" aria-hidden="true" /> support@skillforge.edu</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-edu-amber" aria-hidden="true" /> 1-800-SKILL-UP</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-edu-amber" aria-hidden="true" /> Austin, TX</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 SkillForge. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/edu-portal" className="hover:text-edu-amber transition-colors">Privacy Policy</Link>
            <Link to="/edu-portal" className="hover:text-edu-amber transition-colors">Terms of Service</Link>
            <Link to="/edu-portal" className="hover:text-edu-amber transition-colors">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
