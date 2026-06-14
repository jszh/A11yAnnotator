import { Link, useLocation } from "react-router-dom";
import { Home, Search, Bell, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { title: "Feed", url: "/social-media", icon: Home },
  { title: "Explore", url: "/social-media/explore", icon: Search },
  { title: "Notifications", url: "/social-media/notifications", icon: Bell },
  { title: "Messages", url: "/social-media/messages", icon: MessageCircle },
  { title: "Profile", url: "/social-media/profile", icon: User },
];

export function PulseMobileNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around h-14">
        {mobileNavItems.map((item) => {
          const isActive =
            item.url === "/social-media"
              ? location.pathname === "/social-media"
              : location.pathname.startsWith(item.url);
          return (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
