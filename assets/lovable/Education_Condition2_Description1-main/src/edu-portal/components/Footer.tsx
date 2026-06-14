import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "Browse Courses", href: "/courses" },
    { label: "Pricing", href: "/pricing" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  Learn: [
    { label: "Web Development", href: "/courses" },
    { label: "Data Science", href: "/courses" },
    { label: "UX Design", href: "/courses" },
  ],
  Company: [
    { label: "About", href: "/" },
    { label: "Careers", href: "/" },
    { label: "Contact", href: "/" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-card" role="contentinfo">
      <div className="edu-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 edu-focus-ring rounded" aria-label="LearnPath homepage">
              <BookOpen className="h-6 w-6 text-accent" aria-hidden="true" />
              <span className="text-lg font-bold font-display text-foreground">LearnPath</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Empowering learners worldwide with expert-led courses and structured learning pathways.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm text-foreground mb-3">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-accent transition-colors edu-focus-ring rounded"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 LearnPath. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/" className="text-xs text-muted-foreground hover:text-accent edu-focus-ring rounded">Privacy</Link>
            <Link to="/" className="text-xs text-muted-foreground hover:text-accent edu-focus-ring rounded">Terms</Link>
            <Link to="/" className="text-xs text-muted-foreground hover:text-accent edu-focus-ring rounded">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
