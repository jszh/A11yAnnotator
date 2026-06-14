import { Link, useLocation } from "react-router-dom";
import { BookOpen, Menu, X, User } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Courses", href: "/edu-portal/courses" },
  { label: "Study Room", href: "/edu-portal/study" },
  { label: "Pricing", href: "/edu-portal/pricing" },
  { label: "Dashboard", href: "/edu-portal/dashboard" },
];

export function EduHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-edu-navy" role="banner">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 lg:px-8">
        <Link
          to="/edu-portal"
          className="flex items-center gap-2 text-primary-foreground font-body font-bold text-xl"
          aria-label="SkillForge Home"
        >
          <BookOpen className="h-7 w-7 text-edu-amber" aria-hidden="true" />
          <span>SkillForge</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors hover:text-edu-amber ${
                location.pathname === link.href
                  ? "text-edu-amber"
                  : "text-primary-foreground/80"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/edu-portal/dashboard"
            className="flex items-center gap-1.5 rounded-lg bg-edu-amber px-4 py-2 text-sm font-semibold text-edu-navy transition-opacity hover:opacity-90"
          >
            <User className="h-4 w-4" aria-hidden="true" />
            Sign In
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-primary-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav
          className="md:hidden border-t border-edu-navy-light bg-edu-navy px-4 pb-4"
          aria-label="Mobile navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block py-2 text-sm font-medium ${
                location.pathname === link.href
                  ? "text-edu-amber"
                  : "text-primary-foreground/80"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/edu-portal/dashboard"
            onClick={() => setMobileOpen(false)}
            className="mt-2 block rounded-lg bg-edu-amber px-4 py-2 text-center text-sm font-semibold text-edu-navy"
          >
            Sign In
          </Link>
        </nav>
      )}
    </header>
  );
}
