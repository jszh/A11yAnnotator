import { Outlet } from "react-router-dom";
import { PulseSidebar } from "./PulseSidebar";
import { PulseMobileNav } from "./PulseMobileNav";

export function PulseLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <PulseSidebar />
      <main className="flex-1 min-w-0 pb-16 lg:pb-0">
        <Outlet />
      </main>
      <PulseMobileNav />
    </div>
  );
}
