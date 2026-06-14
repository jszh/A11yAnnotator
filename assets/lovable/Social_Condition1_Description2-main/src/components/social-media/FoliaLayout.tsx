import { ReactNode } from "react";
import { FoliaSidebar } from "./FoliaSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

interface FoliaLayoutProps {
  children: ReactNode;
}

export function FoliaLayout({ children }: FoliaLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <FoliaSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 lg:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-sm">
            <SidebarTrigger aria-label="Toggle navigation menu">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <span className="ml-3 font-display text-xl text-foreground">Folia</span>
          </header>
          <main className="flex-1" role="main">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
