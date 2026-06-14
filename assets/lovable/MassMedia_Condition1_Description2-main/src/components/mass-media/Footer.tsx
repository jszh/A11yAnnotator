import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground" role="contentinfo">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <span className="font-serif text-2xl font-bold">Groundwork</span>
          <p className="mt-3 text-sm opacity-80 max-w-md font-sans leading-relaxed">
            Independent, nonprofit investigative journalism covering climate change, energy policy, and environmental science. Reader-supported since 2019.
          </p>
        </div>
        <nav aria-label="Footer navigation - Topics">
          <h3 className="font-sans text-xs uppercase tracking-widest font-semibold mb-3 opacity-60">Topics</h3>
          <ul className="space-y-2 font-sans text-sm">
            {["Climate", "Energy", "Policy", "Science", "Data"].map((t) => (
              <li key={t}>
                <Link to="/mass-media/category/climate" className="opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                  {t}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Footer navigation - About">
          <h3 className="font-sans text-xs uppercase tracking-widest font-semibold mb-3 opacity-60">About</h3>
          <ul className="space-y-2 font-sans text-sm">
            {["Our Mission", "Team", "Ethics Policy", "Contact", "Donate"].map((t) => (
              <li key={t}>
                <Link to="/mass-media" className="opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                  {t}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-sidebar-border mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="font-sans text-xs opacity-60">© 2026 Groundwork. All rights reserved. Nonprofit 501(c)(3).</p>
        <div className="flex gap-4 font-sans text-xs opacity-60">
          <Link to="/mass-media" className="hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">Privacy</Link>
          <Link to="/mass-media" className="hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">Terms</Link>
          <Link to="/mass-media" className="hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">RSS</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
