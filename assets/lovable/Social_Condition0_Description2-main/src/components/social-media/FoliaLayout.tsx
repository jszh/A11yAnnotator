import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FoliaSidebar } from "./FoliaSidebar";

export function FoliaLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background font-body">
        <FoliaSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 sticky top-0 bg-background/80 backdrop-blur-sm z-30">
            <SidebarTrigger className="mr-3" />
            <h1 className="font-display text-xl tracking-tight text-foreground">Folia</h1>
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
