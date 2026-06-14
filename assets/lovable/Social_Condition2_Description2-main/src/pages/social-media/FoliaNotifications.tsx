import { useState } from "react";
import FoliaLayout from "@/components/social-media/FoliaLayout";
import { Heart, MessageCircle, FolderPlus, Star } from "lucide-react";
import post1 from "@/assets/social-media/post1.jpg";
import post3 from "@/assets/social-media/post3.jpg";
import post4 from "@/assets/social-media/post4.jpg";

const tabs = ["Activity", "Feedback Requests", "Collections"] as const;

interface Notification {
  id: string;
  type: "appreciate" | "comment" | "collect" | "feedback";
  user: string;
  action: string;
  piece: string;
  time: string;
  thumbnail: string;
  read: boolean;
}

const notifications: Record<typeof tabs[number], Notification[]> = {
  Activity: [
    { id: "1", type: "appreciate", user: "Hana Kim", action: "appreciated your piece", piece: "Solstice III", time: "4h", thumbnail: post1, read: false },
    { id: "2", type: "comment", user: "Leo Kraft", action: "commented on", piece: "Geometric Studies", time: "6h", thumbnail: post1, read: false },
    { id: "3", type: "appreciate", user: "Priya Sharma", action: "appreciated your piece", piece: "Dawn Portrait", time: "12h", thumbnail: post3, read: true },
    { id: "4", type: "collect", user: "Aiden Park", action: "added your work to collection", piece: "Lettering Series", time: "1d", thumbnail: post4, read: true },
    { id: "5", type: "appreciate", user: "Sofia Reyes", action: "appreciated your piece", piece: "Solstice III", time: "1d", thumbnail: post1, read: true },
  ],
  "Feedback Requests": [
    { id: "6", type: "feedback", user: "Maya Chen", action: "requested feedback on", piece: "Color Study #7", time: "2h", thumbnail: post1, read: false },
    { id: "7", type: "feedback", user: "Carlos Mendez", action: "requested feedback on", piece: "Motion Reel v2", time: "1d", thumbnail: post3, read: true },
  ],
  Collections: [
    { id: "8", type: "collect", user: "Yuki Tanaka", action: "added your work to", piece: "Best of Typography 2024", time: "3h", thumbnail: post4, read: false },
    { id: "9", type: "collect", user: "Ava Li", action: "created collection featuring", piece: "Emerging 3D Artists", time: "2d", thumbnail: post1, read: true },
  ],
};

const iconMap = {
  appreciate: Heart,
  comment: MessageCircle,
  collect: FolderPlus,
  feedback: Star,
};

const colorMap = {
  appreciate: "text-appreciate",
  comment: "text-primary",
  collect: "text-collect",
  feedback: "text-primary",
};

export default function FoliaNotifications() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Activity");
  const [unreadCount, setUnreadCount] = useState(3);

  return (
    <FoliaLayout title="Notifications | Folia">
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display text-foreground">Notifications</h1>
          <span aria-live="polite" className="text-sm text-muted-foreground">
            {unreadCount} new
          </span>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Notification categories" className="flex gap-1 p-1 bg-secondary rounded-full w-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="space-y-2" role="list" aria-label={`${activeTab} notifications`}>
          {notifications[activeTab].map((n) => {
            const Icon = iconMap[n.type];
            return (
              <div
                key={n.id}
                role="listitem"
                className={`folia-card p-3 flex items-center gap-3 ${!n.read ? "ring-1 ring-primary/20 bg-primary/[0.03]" : ""}`}
              >
                <div className={`p-2 rounded-full bg-secondary ${colorMap[n.type]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{n.user}</span>{" "}
                    {n.action}{" "}
                    <span className="font-medium">'{n.piece}'</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{n.time} ago</p>
                </div>
                <img
                  src={n.thumbnail}
                  alt={`Thumbnail of ${n.piece}`}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  loading="lazy"
                />
              </div>
            );
          })}
        </div>
      </div>
    </FoliaLayout>
  );
}
