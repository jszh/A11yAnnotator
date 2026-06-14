import {
  Home, Compass, Bell, MessageCircle, User, Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const items = [
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

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        {!collapsed && (
          <div className="px-6 pb-4 mb-2 border-b border-border">
            <span className="font-display text-2xl text-folia-coral">f</span>
            <span className="font-display text-lg ml-0.5 text-foreground">olia</span>
            <p className="text-xs text-muted-foreground mt-1">Creative Community</p>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/social-media"}
                      className="hover:bg-secondary/80 rounded-lg transition-colors"
                      activeClassName="bg-secondary text-folia-coral font-semibold"
                    >
                      <item.icon className="mr-3 h-5 w-5" />
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
