import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen flex-col font-sans">
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-gov-gold focus:px-4 focus:py-2 focus:text-foreground focus:font-semibold"
    >
      Skip to main content
    </a>
    <Header />
    <main id="main-content" className="flex-1">
      {children}
    </main>
    <Footer />
  </div>
);

export default Layout;
