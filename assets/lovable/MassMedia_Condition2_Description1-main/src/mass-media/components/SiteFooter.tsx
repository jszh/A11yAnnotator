import { Link } from "react-router-dom";
import NewsletterSignup from "./NewsletterSignup";

export default function SiteFooter() {
  return (
    <footer className="bg-foreground text-primary-foreground mt-16" role="contentinfo">
      <div className="container py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <h2 className="font-serif text-2xl font-bold mb-4">The Meridian</h2>
            <p className="text-primary-foreground/70 mb-6 max-w-md font-sans">
              Independent journalism covering global affairs, politics, technology,
              and culture. Truth without compromise.
            </p>
            <NewsletterSignup variant="footer" />
          </div>
          <div>
            <h3 className="font-sans text-sm font-bold uppercase tracking-widest mb-4 text-primary-foreground/50">
              Sections
            </h3>
            <ul className="space-y-2">
              {["World", "Politics", "Tech", "Culture", "Opinion"].map((s) => (
                <li key={s}>
                  <Link
                    to={s === "Opinion" ? "/mass-media/opinion" : "/mass-media/world"}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors font-sans"
                  >
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-sans text-sm font-bold uppercase tracking-widest mb-4 text-primary-foreground/50">
              Company
            </h3>
            <ul className="space-y-2">
              {["About", "Careers", "Contact", "Ethics Policy", "Subscribe"].map((s) => (
                <li key={s}>
                  <Link
                    to={s === "Subscribe" ? "/mass-media/subscribe" : "/mass-media"}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors font-sans"
                  >
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 pt-6 text-center text-sm text-primary-foreground/50 font-sans">
          © 2026 The Meridian. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
