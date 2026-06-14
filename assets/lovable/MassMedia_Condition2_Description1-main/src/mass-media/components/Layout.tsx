import { ReactNode } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import BreakingNewsTicker from "./BreakingNewsTicker";
import CookieBanner from "./CookieBanner";

interface Props {
  children: ReactNode;
  title?: string;
  showTicker?: boolean;
}

export default function Layout({ children, title, showTicker = false }: Props) {
  // Set document title
  if (title) {
    document.title = title;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:bg-accent focus:text-accent-foreground focus:px-4 focus:py-2 font-sans"
      >
        Skip to main content
      </a>
      <SiteHeader />
      {showTicker && <BreakingNewsTicker />}
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CookieBanner />
    </div>
  );
}
