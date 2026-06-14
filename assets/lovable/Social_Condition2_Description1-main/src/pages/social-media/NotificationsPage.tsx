import { useState } from "react";
import { Heart, AtSign, UserPlus, MessageCircle } from "lucide-react";
import { AppLayout } from "@/components/social-media/AppLayout";
import { notifications, Notification } from "@/data/mockData";

const tabs = [
  { id: "all", label: "All" },
  { id: "mention", label: "Mentions" },
  { id: "like", label: "Likes" },
  { id: "follow", label: "Follows" },
];

const iconMap: Record<string, typeof Heart> = {
  like: Heart,
  mention: AtSign,
  follow: UserPlus,
  comment: MessageCircle,
};

const iconColorMap: Record<string, string> = {
  like: "text-primary",
  mention: "text-pulse-info",
  follow: "text-pulse-success",
  comment: "text-pulse-warning",
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = activeTab === "all"
    ? notifications
    : notifications.filter((n) => n.type === activeTab);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <header className="sticky top-0 z-10 pulse-glass border-b border-border">
          <h1 className="text-xl font-bold text-foreground px-4 py-3">Notifications</h1>
          <div role="tablist" aria-label="Notification categories" className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                id={`tab-${tab.id}`}
                aria-controls={`panel-${tab.id}`}
                className={`pulse-tab flex-1 ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {filtered.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} />
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No notifications yet</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const Icon = iconMap[notification.type] || Heart;
  const colorClass = iconColorMap[notification.type] || "";

  return (
    <article
      className={`flex items-start gap-3 p-4 border-b border-border transition-colors hover:bg-muted/30 ${
        !notification.read ? "bg-primary/5" : ""
      }`}
      aria-label={`${notification.user.displayName} ${notification.text}`}
    >
      <div className={`mt-1 ${colorClass}`}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <img
        src={notification.user.avatar}
        alt={notification.user.displayName}
        className="pulse-avatar w-10 h-10"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{notification.user.displayName}</span>{" "}
          <span className="text-muted-foreground">{notification.text}</span>{" "}
          <span className="text-muted-foreground">· {notification.timestamp}</span>
        </p>
        {notification.snippet && (
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {notification.snippet}
          </p>
        )}
      </div>
      {!notification.read && (
        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" aria-label="Unread" />
      )}
    </article>
  );
}
