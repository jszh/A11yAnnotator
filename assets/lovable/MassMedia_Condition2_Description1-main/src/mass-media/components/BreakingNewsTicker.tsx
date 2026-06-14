import { useState } from "react";

const headlines = [
  "BREAKING: UN Emergency Session Called Over Red Sea Tensions",
  "EU Announces New Climate Package Targeting 2035 Emissions Goals",
  "Tech Giants Face Antitrust Scrutiny in Multiple Jurisdictions",
  "Global Markets Rally After Central Bank Policy Shift",
];

export default function BreakingNewsTicker() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="ticker-strip relative" role="marquee" aria-label="Breaking news ticker" aria-live="off">
      <div className="container flex items-center gap-3">
        <span className="font-sans text-xs font-bold uppercase tracking-widest shrink-0 bg-foreground text-primary-foreground px-2 py-0.5">
          Breaking
        </span>
        <div className="overflow-hidden flex-1 relative">
          <div
            className={`ticker-animate whitespace-nowrap font-sans text-sm font-medium ${paused ? "[animation-play-state:paused]" : ""}`}
          >
            {headlines.map((h, i) => (
              <span key={i} className="mx-8">
                {h}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setPaused(!paused)}
          className="shrink-0 text-xs font-sans font-bold uppercase px-2 py-1 border border-accent-foreground/30 hover:bg-accent-foreground/10 transition-colors"
          aria-label={paused ? "Resume breaking news ticker" : "Pause breaking news ticker"}
        >
          {paused ? "Play" : "Pause"}
        </button>
      </div>
    </div>
  );
}
