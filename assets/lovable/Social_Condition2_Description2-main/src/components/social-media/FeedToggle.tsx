import { useState } from "react";

export default function FeedToggle() {
  const [active, setActive] = useState<"foryou" | "following">("foryou");

  return (
    <div role="tablist" aria-label="Feed filter" className="flex gap-1 p-1 bg-secondary rounded-full w-fit">
      <button
        role="tab"
        aria-selected={active === "foryou"}
        onClick={() => setActive("foryou")}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          active === "foryou"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        For You
      </button>
      <button
        role="tab"
        aria-selected={active === "following"}
        onClick={() => setActive("following")}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          active === "following"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Following
      </button>
    </div>
  );
}
