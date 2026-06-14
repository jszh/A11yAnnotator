import { ReactNode } from "react";
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";

interface GovLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function GovLayout({ children, title }: GovLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground">
        Skip to main content
      </a>
      <GovHeader />
      <main id="main-content" className="flex-1" role="main">
        {children}
      </main>
      <GovFooter />
    </div>
  );
}
