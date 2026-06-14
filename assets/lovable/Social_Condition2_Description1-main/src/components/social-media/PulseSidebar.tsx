import { Home, Compass, Bell, Mail, User, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { currentUser } from "@/data/mockData";

const navItems = [
  { title: "Feed", url: "/", icon: Home },
  { title: "Explore", url: "/explore", icon: Compass },
  { title: "Notifications", url: "/notifications", icon: Bell, badge: 3 },
  { title: "Messages", url: "/messages", icon: Mail, badge: 3 },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function PulseSidebar() {
  const location = useLocation();

  return (
    <aside
      className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-sidebar border-r border-sidebar-border p-4"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-black text-lg">P</span>
        </div>
        <span className="text-xl font-extrabold pulse-gradient-text">Pulse</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.title}
              to={item.url}
              end={item.url === "/"}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors group"
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
              <span className="flex-1">{item.title}</span>
              {item.badge && item.badge > 0 && (
                <span className="pulse-badge" aria-label={`${item.badge} unread`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border pt-4 mt-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <img
            src={currentUser.avatar}
            alt={currentUser.displayName}
            className="pulse-avatar w-10 h-10"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-accent-foreground truncate">
              {currentUser.displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">@{currentUser.handle}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
