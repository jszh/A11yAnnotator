import { useState } from "react";
import { X } from "lucide-react";

export default function BreakingNewsBanner() {
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);

  if (!visible) return null;

  return (
    <div
      className="bg-primary text-primary-foreground relative overflow-hidden"
      role="region"
      aria-label="Breaking news"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-9 gap-3">
        <span className="shrink-0 px-2 py-0.5 text-[10px] font-sans font-bold uppercase tracking-widest bg-accent text-accent-foreground rounded-sm">
          Breaking
        </span>
        <div
          className="flex-1 overflow-hidden relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <p
            className={`text-xs font-sans font-medium whitespace-nowrap ${paused ? "" : "animate-ticker"}`}
            aria-live="polite"
          >
            EPA announces new carbon emission standards for power plants — IPCC releases updated sea-level projections — Congress debates clean energy infrastructure bill
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss breaking news banner"
          className="shrink-0 p-1 rounded-sm hover:bg-primary-foreground/10 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}