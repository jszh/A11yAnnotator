import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Compass,
  Bell,
  MessageCircle,
  User,
  Settings,
  Menu,
  X,
  Leaf,
} from "lucide-react";

interface FoliaLayoutProps {
  children: ReactNode;
  title: string;
}

const navItems = [
  { to: "/social-media", icon: Home, label: "Feed" },
  { to: "/social-media/explore", icon: Compass, label: "Explore" },
  { to: "/social-media/notifications", icon: Bell, label: "Notifications", badge: 3 },
  { to: "/social-media/messages", icon: MessageCircle, label: "Messages", badge: 2 },
  { to: "/social-media/profile", icon: User, label: "Profile" },
  { to: "/social-media/settings", icon: Settings, label: "Settings" },
];

export default function FoliaLayout({ children, title }: FoliaLayoutProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/social-media") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <title>{title}</title>
      <div className="min-h-screen bg-background flex">
        {/* Desktop sidebar */}
        <aside
          className="hidden lg:flex flex-col w-64 border-r border-border bg-card fixed inset-y-0 left-0 z-30"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="p-6 flex items-center gap-2">
            <Leaf className="h-7 w-7 text-primary" />
            <span className="text-xl font-display text-foreground tracking-tight">Folia</span>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                  isActive(item.to)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                aria-current={isActive(item.to) ? "page" : undefined}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className="ml-auto bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    aria-label={`${item.badge} unread`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                E
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">Elena Torres</p>
                <p className="text-xs text-muted-foreground truncate">@elena.creates</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile header */}
        <header className="lg:hidden fixed top-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-b border-border h-14 flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-lg font-display text-foreground">Folia</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="p-2 rounded-lg hover:bg-secondary text-foreground"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile nav overlay */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
            <nav
              className="absolute top-14 left-0 right-0 bg-card border-b border-border p-4 space-y-1 shadow-lg"
              role="navigation"
              aria-label="Main navigation"
              onClick={(e) => e.stopPropagation()}
            >
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.to)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                  aria-current={isActive(item.to) ? "page" : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
          <div className="scroll-mt-16">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur border-t border-border flex justify-around py-2"
          role="navigation"
          aria-label="Quick navigation"
        >
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors relative ${
                isActive(item.to) ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label={item.label}
              aria-current={isActive(item.to) ? "page" : undefined}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="absolute -top-0.5 right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
