import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = {
  Platform: [
    { label: "Browse Courses", to: "/courses" },
    { label: "Pricing", to: "/pricing" },
    { label: "Dashboard", to: "/dashboard" },
  ],
  Subjects: [
    { label: "Web Development", to: "/courses" },
    { label: "Data Science", to: "/courses" },
    { label: "UX Design", to: "/courses" },
    { label: "Business", to: "/courses" },
  ],
  Company: [
    { label: "About Us", to: "/" },
    { label: "Careers", to: "/" },
    { label: "Blog", to: "/" },
    { label: "Contact", to: "/" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="edu-container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
              <BookOpen className="h-6 w-6 text-secondary" />
              LearnPath
            </div>
            <p className="text-sm text-primary-foreground/70">
              Empowering millions of learners worldwide with expert-led courses and structured learning paths.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-primary-foreground/50">
                {title}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-primary-foreground/70 transition-colors hover:text-secondary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-primary-foreground/10 pt-6 text-center text-xs text-primary-foreground/40">
          © 2026 LearnPath. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
