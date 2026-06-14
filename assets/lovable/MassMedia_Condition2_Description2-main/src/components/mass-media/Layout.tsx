import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import BreakingNewsBanner from "./BreakingNewsBanner";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const location = useLocation();

  useEffect(() => {
    if (title) {
      document.title = `${title} | Groundwork`;
    }
  }, [title, location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-sm font-sans text-sm"
      >
        Skip to main content
      </a>
      <BreakingNewsBanner />
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}