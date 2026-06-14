import {
  Home, Compass, Bell, MessageCircle, User, Settings, Leaf,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Feed", url: "/social-media", icon: Home },
  { title: "Explore", url: "/social-media/explore", icon: Compass },
  { title: "Notifications", url: "/social-media/notifications", icon: Bell },
  { title: "Messages", url: "/social-media/messages", icon: MessageCircle },
  { title: "Profile", url: "/social-media/profile", icon: User },
  { title: "Settings", url: "/social-media/settings", icon: Settings },
];

export function FoliaSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="pt-6">
        <div className="px-4 mb-8 flex items-center gap-2">
          <Leaf className="h-6 w-6 text-primary shrink-0" aria-hidden="true" />
          {!collapsed && (
            <span className="font-display text-2xl text-foreground tracking-tight">
              Folia
            </span>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/social-media"}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                      activeClassName="bg-accent text-foreground font-medium"
                      aria-current={isActive(item.url) ? "page" : undefined}
                    >
                      <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
