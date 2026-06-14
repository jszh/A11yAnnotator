import { useState, useEffect, useRef } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(true);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && bannerRef.current) {
      const firstButton = bannerRef.current.querySelector("button");
      firstButton?.focus();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg p-4"
    >
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-sans text-sm text-foreground">
          We use cookies to improve your experience. By continuing, you agree to our use of cookies.
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => setVisible(false)}
            className="px-4 py-2 bg-accent text-accent-foreground text-sm font-sans font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Accept
          </button>
          <button
            onClick={() => setVisible(false)}
            className="px-4 py-2 border border-border text-foreground text-sm font-sans font-bold uppercase tracking-wider hover:bg-secondary transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
