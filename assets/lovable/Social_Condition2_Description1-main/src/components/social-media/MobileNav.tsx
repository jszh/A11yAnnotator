import { Home, Compass, Bell, Mail, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

const navItems = [
  { title: "Feed", url: "/", icon: Home },
  { title: "Explore", url: "/explore", icon: Compass },
  { title: "Notifications", url: "/notifications", icon: Bell, badge: 3 },
  { title: "Messages", url: "/messages", icon: Mail, badge: 3 },
  { title: "Profile", url: "/profile", icon: User },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.title}
              to={item.url}
              end={item.url === "/"}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground transition-colors relative"
              activeClassName="text-primary"
              aria-label={item.title}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-medium">{item.title}</span>
              {item.badge && item.badge > 0 && (
                <span
                  className="absolute -top-0.5 right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-primary text-primary-foreground"
                  aria-label={`${item.badge} unread`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
