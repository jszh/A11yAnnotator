import { Link } from "react-router-dom";

const SiteFooter = () => (
  <footer className="bg-primary text-primary-foreground">
    {/* Newsletter signup */}
    <div className="border-b border-primary-foreground/10">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="font-serif text-2xl font-bold mb-2">Stay Informed</h3>
          <p className="text-primary-foreground/60 font-sans text-sm mb-6">
            Get The Meridian's daily briefing delivered to your inbox every morning.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 bg-primary-foreground/10 border border-primary-foreground/20 px-4 py-3 text-sm font-sans text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-accent"
            />
            <button className="bg-accent text-accent-foreground px-6 py-3 text-sm font-sans font-bold uppercase tracking-wider hover:bg-amber-light transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>

    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
        <div>
          <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-primary-foreground/40 mb-4">Sections</h4>
          <ul className="space-y-2 font-sans text-sm">
            <li><Link to="/mass-media/world" className="text-primary-foreground/70 hover:text-accent transition-colors">World</Link></li>
            <li><Link to="/mass-media/world" className="text-primary-foreground/70 hover:text-accent transition-colors">Politics</Link></li>
            <li><Link to="/mass-media/world" className="text-primary-foreground/70 hover:text-accent transition-colors">Technology</Link></li>
            <li><Link to="/mass-media/world" className="text-primary-foreground/70 hover:text-accent transition-colors">Culture</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-primary-foreground/40 mb-4">Opinion</h4>
          <ul className="space-y-2 font-sans text-sm">
            <li><Link to="/mass-media/opinion" className="text-primary-foreground/70 hover:text-accent transition-colors">Editorials</Link></li>
            <li><Link to="/mass-media/opinion" className="text-primary-foreground/70 hover:text-accent transition-colors">Columnists</Link></li>
            <li><Link to="/mass-media/opinion" className="text-primary-foreground/70 hover:text-accent transition-colors">Letters</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-primary-foreground/40 mb-4">About</h4>
          <ul className="space-y-2 font-sans text-sm">
            <li><span className="text-primary-foreground/70">Our Mission</span></li>
            <li><span className="text-primary-foreground/70">Newsroom</span></li>
            <li><span className="text-primary-foreground/70">Careers</span></li>
            <li><span className="text-primary-foreground/70">Contact</span></li>
          </ul>
        </div>
        <div>
          <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-primary-foreground/40 mb-4">Subscribe</h4>
          <ul className="space-y-2 font-sans text-sm">
            <li><Link to="/mass-media/subscribe" className="text-primary-foreground/70 hover:text-accent transition-colors">Pricing</Link></li>
            <li><span className="text-primary-foreground/70">Student Discount</span></li>
            <li><span className="text-primary-foreground/70">Gift Subscription</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="font-serif text-xl font-bold">The Meridian</p>
        <p className="text-xs font-sans text-primary-foreground/40">
          © 2026 The Meridian Media Group. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
