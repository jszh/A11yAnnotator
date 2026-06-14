import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  Bell,
  MessageCircle,
  User,
  Settings,
  Zap,
  LogOut,
  PenSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Feed", url: "/social-media", icon: Home },
  { title: "Explore", url: "/social-media/explore", icon: Search },
  { title: "Notifications", url: "/social-media/notifications", icon: Bell, badge: 5 },
  { title: "Messages", url: "/social-media/messages", icon: MessageCircle, badge: 3 },
  { title: "Profile", url: "/social-media/profile", icon: User },
  { title: "Settings", url: "/social-media/settings", icon: Settings },
];

export function PulseSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-sidebar border-r border-border px-3 py-6 justify-between">
      <div>
        {/* Logo */}
        <Link to="/social-media" className="flex items-center gap-2.5 px-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center glow-primary-sm">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground tracking-tight">Pulse</span>
        </Link>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.url === "/social-media"
                ? location.pathname === "/social-media"
                : location.pathname.startsWith(item.url);
            return (
              <Link
                key={item.title}
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-pulse-surface-hover hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.title}</span>
                {item.badge && (
                  <span className="ml-auto pulse-badge bg-primary text-primary-foreground text-[10px]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Compose button */}
        <div className="mt-6 px-1">
          <Button className="w-full gap-2 rounded-xl h-11 font-display font-semibold glow-primary">
            <PenSquare className="w-4 h-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* User section */}
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
            alt="avatar"
            className="w-full h-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">Alex Morgan</p>
          <p className="text-xs text-muted-foreground">@alexmorgan</p>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
