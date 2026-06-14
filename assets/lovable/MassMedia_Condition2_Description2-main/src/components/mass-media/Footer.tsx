import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gw-ink text-primary-foreground mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/mass-media" className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center text-primary-foreground font-sans font-black text-base leading-none">
                G
              </span>
              <span className="font-serif font-bold text-lg text-primary-foreground">
                Groundwork
              </span>
            </Link>
            <p className="text-sm text-primary-foreground/60 font-sans leading-relaxed">
              Independent, data-driven investigative journalism on climate, science, and environmental policy.
            </p>
          </div>

          {/* Topics */}
          <div>
            <h3 className="font-sans font-semibold text-sm uppercase tracking-wider mb-3 text-primary-foreground/80">Topics</h3>
            <ul className="space-y-2">
              {["Climate", "Energy", "Policy", "Science", "Data"].map((t) => (
                <li key={t}>
                  <Link to="/mass-media/category/climate" className="text-sm font-sans text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="font-sans font-semibold text-sm uppercase tracking-wider mb-3 text-primary-foreground/80">About</h3>
            <ul className="space-y-2">
              {["Our Mission", "Team", "Ethics Policy", "Contact", "Careers"].map((t) => (
                <li key={t}>
                  <span className="text-sm font-sans text-primary-foreground/60 cursor-default">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-sans font-semibold text-sm uppercase tracking-wider mb-3 text-primary-foreground/80">Support</h3>
            <p className="text-sm font-sans text-primary-foreground/60 mb-4 leading-relaxed">
              Groundwork is reader-supported. Your contribution funds independent reporting.
            </p>
            <Link
              to="/mass-media/subscribe"
              className="inline-flex px-5 py-2 text-sm font-sans font-semibold bg-accent text-accent-foreground rounded-sm hover:opacity-90 transition-opacity"
            >
              Become a Supporter
            </Link>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-sans text-primary-foreground/40">
            &copy; {new Date().getFullYear()} Groundwork. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-xs font-sans text-primary-foreground/40">Privacy</span>
            <span className="text-xs font-sans text-primary-foreground/40">Terms</span>
            <span className="text-xs font-sans text-primary-foreground/40">RSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}