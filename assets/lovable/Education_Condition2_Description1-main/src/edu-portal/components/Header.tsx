import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Courses", href: "/courses" },
  { label: "Pricing", href: "/pricing" },
  { label: "Dashboard", href: "/dashboard" },
];

export function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80" role="banner">
      <div className="edu-container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 edu-focus-ring rounded" aria-label="LearnPath homepage">
          <BookOpen className="h-7 w-7 text-accent" aria-hidden="true" />
          <span className="text-xl font-bold font-display text-foreground">LearnPath</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors edu-focus-ring ${
                location.pathname.startsWith(link.href)
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              aria-current={location.pathname.startsWith(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">Log In</Link>
          </Button>
          <Button variant="accent" size="sm" asChild>
            <Link to="/pricing">Start Free Trial</Link>
          </Button>
        </div>

        <button
          className="md:hidden edu-focus-ring rounded p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t bg-card p-4 space-y-2" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors edu-focus-ring ${
                location.pathname.startsWith(link.href)
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              aria-current={location.pathname.startsWith(link.href) ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 space-y-2 border-t">
            <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Log In</Link>
            </Button>
            <Button variant="accent" size="sm" className="w-full" asChild>
              <Link to="/pricing" onClick={() => setMobileOpen(false)}>Start Free Trial</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
