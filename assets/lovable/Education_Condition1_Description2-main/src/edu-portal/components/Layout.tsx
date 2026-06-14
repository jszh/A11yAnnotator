import { Link, useLocation } from "react-router-dom";
import { BookOpen, GraduationCap, Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { to: "/edu-portal", label: "Home" },
  { to: "/edu-portal/courses", label: "Courses" },
  { to: "/edu-portal/study", label: "Classroom" },
  { to: "/edu-portal/pricing", label: "Plans & Pricing" },
  { to: "/edu-portal/dashboard", label: "Dashboard" },
];

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/edu-portal" className="flex items-center gap-2 font-display text-xl font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded" aria-label="SkillForge Home">
            <GraduationCap className="w-7 h-7 text-accent" aria-hidden="true" />
            <span>SkillForge</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  location.pathname === link.to
                    ? "bg-edu-navy-light text-accent"
                    : "hover:bg-edu-navy-light"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/edu-portal/courses" className="text-sm font-medium hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-2 py-1">
              Sign In
            </Link>
            <Link to="/edu-portal/courses" className="bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm font-bold hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
              Start Learning
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-edu-navy-light" aria-label="Mobile navigation">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  location.pathname === link.to ? "bg-edu-navy-light text-accent" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/edu-portal/courses" onClick={() => setMobileOpen(false)} className="block bg-accent text-accent-foreground px-3 py-2 rounded-md text-sm font-bold text-center mt-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              Start Learning
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-bold mb-4">
              <GraduationCap className="w-6 h-6 text-accent" aria-hidden="true" />
              SkillForge
            </div>
            <p className="text-sm text-muted-foreground">
              Industry-recognized certifications for career changers and professionals. Accredited programs in trades, healthcare, IT, and business.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3 text-accent">Programs</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/edu-portal/courses" className="hover:text-accent transition-colors focus:outline-none focus-visible:underline">Healthcare Support</Link></li>
              <li><Link to="/edu-portal/courses" className="hover:text-accent transition-colors focus:outline-none focus-visible:underline">IT & Cybersecurity</Link></li>
              <li><Link to="/edu-portal/courses" className="hover:text-accent transition-colors focus:outline-none focus-visible:underline">Skilled Trades</Link></li>
              <li><Link to="/edu-portal/courses" className="hover:text-accent transition-colors focus:outline-none focus-visible:underline">Business Administration</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3 text-accent">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/edu-portal/pricing" className="hover:text-accent transition-colors focus:outline-none focus-visible:underline">Financing Options</Link></li>
              <li><Link to="/edu-portal/pricing" className="hover:text-accent transition-colors focus:outline-none focus-visible:underline">Employer Partners</Link></li>
              <li><Link to="/edu-portal/pricing" className="hover:text-accent transition-colors focus:outline-none focus-visible:underline">Scholarships</Link></li>
              <li><Link to="/edu-portal" className="hover:text-accent transition-colors focus:outline-none focus-visible:underline">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3 text-accent">Accreditations</h3>
            <div className="flex flex-wrap gap-2">
              {["DEAC", "CompTIA", "NAHP", "IACET"].map((badge) => (
                <span key={badge} className="bg-edu-navy-light text-xs px-2 py-1 rounded font-medium">{badge}</span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">© 2026 SkillForge Learning Inc. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-body">
      <Header />
      <main className="flex-1" id="main-content">{children}</main>
      <Footer />
    </div>
  );
}
