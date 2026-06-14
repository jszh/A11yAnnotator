import { ReactNode } from "react";
import { EduHeader } from "./EduHeader";
import { EduFooter } from "./EduFooter";

interface EduLayoutProps {
  children: ReactNode;
  title?: string;
}

export function EduLayout({ children, title }: EduLayoutProps) {
  // Update document title
  if (title) {
    document.title = `${title} | SkillForge`;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <EduHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <EduFooter />
    </div>
  );
}
