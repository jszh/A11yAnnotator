import { ReactNode } from "react";
import { PulseSidebar } from "./PulseSidebar";
import { MobileNav } from "./MobileNav";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <PulseSidebar />
      <main className="flex-1 min-w-0 pb-16 lg:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
