import { Heart, UserPlus, MessageCircle, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type NotifType = "like" | "follow" | "comment" | "mention";

interface Notification {
  id: string;
  type: NotifType;
  user: { name: string; avatar: string };
  action: string;
  snippet?: string;
  time: string;
  read: boolean;
}

const notifications: Notification[] = [
  { id: "1", type: "like", user: { name: "Maya Chen", avatar: "Maya" }, action: "liked your post", snippet: "Just finished building my first AI-powered app!", time: "2h", read: false },
  { id: "2", type: "follow", user: { name: "Kai Tanaka", avatar: "KaiTanaka" }, action: "started following you", time: "3h", read: false },
  { id: "3", type: "comment", user: { name: "Sam Rivera", avatar: "Sam" }, action: "commented on your post", snippet: "Totally agree! Less code = better code every time.", time: "5h", read: false },
  { id: "4", type: "mention", user: { name: "Priya Patel", avatar: "Priya" }, action: "mentioned you in a post", snippet: "@alexmorgan would love your thoughts on this climate tech article.", time: "6h", read: true },
  { id: "5", type: "like", user: { name: "Jordan Lee", avatar: "Jordan" }, action: "liked your post", snippet: "Golden hour at Joshua Tree never disappoints.", time: "8h", read: true },
  { id: "6", type: "follow", user: { name: "Nina Rossi", avatar: "NinaRossi" }, action: "started following you", time: "12h", read: true },
  { id: "7", type: "like", user: { name: "Leo Martinez", avatar: "Leo" }, action: "liked your photo", snippet: "Street photography in Tokyo", time: "1d", read: true },
  { id: "8", type: "mention", user: { name: "Dev Sharma", avatar: "DevSharma" }, action: "mentioned you", snippet: "Check out @alexmorgan's new project — super clean code.", time: "1d", read: true },
  { id: "9", type: "comment", user: { name: "Aisha Obi", avatar: "AishaObi" }, action: "replied to your comment", snippet: "Great point about carbon capture scalability!", time: "2d", read: true },
];

const tabs = [
  { label: "All", filter: null },
  { label: "Mentions", filter: "mention" as NotifType },
  { label: "Likes", filter: "like" as NotifType },
  { label: "Follows", filter: "follow" as NotifType },
];

const typeIcon: Record<NotifType, typeof Heart> = {
  like: Heart,
  follow: UserPlus,
  comment: MessageCircle,
  mention: AtSign,
};

const typeColor: Record<NotifType, string> = {
  like: "text-pulse-rose",
  follow: "text-primary",
  comment: "text-pulse-amber",
  mention: "text-pulse-success",
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotifType | null>(null);
  const filtered = activeTab ? notifications.filter((n) => n.type === activeTab) : notifications;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.filter)}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.filter
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-1">
        {filtered.map((notif) => {
          const Icon = typeIcon[notif.type];
          return (
            <div
              key={notif.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer",
                !notif.read ? "bg-primary/5" : "hover:bg-secondary/50"
              )}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.user.avatar}`}
                  alt={notif.user.name}
                  className="w-10 h-10 rounded-full bg-secondary"
                />
                <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card flex items-center justify-center", typeColor[notif.type])}>
                  <Icon className="w-3 h-3" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-foreground">{notif.user.name}</span>{" "}
                  <span className="text-muted-foreground">{notif.action}</span>{" "}
                  <span className="text-muted-foreground">· {notif.time}</span>
                </p>
                {notif.snippet && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.snippet}</p>
                )}
              </div>
              {!notif.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
