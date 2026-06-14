import { useState } from "react";
import { FoliaLayout } from "@/components/social-media/FoliaLayout";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Bookmark, Users } from "lucide-react";
import post1 from "@/assets/post-1.jpg";
import post2 from "@/assets/post-2.jpg";
import post3 from "@/assets/post-3.jpg";

type TabKey = "activity" | "feedback" | "collections";

const tabs: { key: TabKey; label: string }[] = [
  { key: "activity", label: "Activity" },
  { key: "feedback", label: "Feedback Requests" },
  { key: "collections", label: "Collections" },
];

const activityItems = [
  { id: 1, type: "appreciate" as const, user: "Hana", avatar: "HK", piece: "Solstice III", time: "4h", image: post2 },
  { id: 2, type: "comment" as const, user: "Leo Sato", avatar: "LS", piece: "Organic Forms", time: "6h", image: post1, comment: "The color blending is incredible here." },
  { id: 3, type: "follow" as const, user: "Zoe Lin", avatar: "ZL", piece: "", time: "8h", image: null },
  { id: 4, type: "collect" as const, user: "Ravi Patel", avatar: "RP", piece: "Serif Study", time: "12h", image: post3 },
  { id: 5, type: "appreciate" as const, user: "Ada Moreau", avatar: "AM", piece: "Golden Hour #04", time: "1d", image: post1 },
  { id: 6, type: "comment" as const, user: "Jin Park", avatar: "JP", piece: "Solstice III", time: "1d", image: post2, comment: "Would love to see a process breakdown!" },
];

const feedbackRequests = [
  { id: 1, user: "Felix Brandt", avatar: "FB", piece: "New logo concept", time: "2h", image: post3, message: "Would love your thoughts on this direction" },
  { id: 2, user: "Nia Okafor", avatar: "NO", piece: "Portfolio layout v2", time: "1d", image: post1, message: "Trying a new grid — does it feel balanced?" },
];

const collectionItems = [
  { id: 1, user: "Ella Moss", avatar: "EM", collection: "Warm Minimalism", piece: "Organic Forms", time: "3h", image: post1 },
  { id: 2, user: "Dante Cruz", avatar: "DC", collection: "Type Inspo", piece: "Serif Study", time: "1d", image: post3 },
];

const iconMap = {
  appreciate: Heart,
  comment: MessageCircle,
  follow: Users,
  collect: Bookmark,
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("activity");

  const renderActivity = () => (
    <div className="space-y-1">
      {activityItems.map((item, i) => {
        const Icon = iconMap[item.type];
        const getMessage = () => {
          switch (item.type) {
            case "appreciate": return <><strong className="text-foreground">{item.user}</strong> appreciated your piece <strong className="text-foreground">'{item.piece}'</strong></>;
            case "comment": return <><strong className="text-foreground">{item.user}</strong> commented on <strong className="text-foreground">'{item.piece}'</strong></>;
            case "follow": return <><strong className="text-foreground">{item.user}</strong> started following you</>;
            case "collect": return <><strong className="text-foreground">{item.user}</strong> collected <strong className="text-foreground">'{item.piece}'</strong></>;
          }
        };
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
            role="listitem"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0" aria-hidden="true">
              {item.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getMessage()} · <span className="text-xs">{item.time}</span>
              </p>
              {item.type === "comment" && "comment" in item && (
                <p className="text-xs text-muted-foreground mt-1 bg-muted rounded-lg px-2 py-1.5 italic">
                  "{item.comment}"
                </p>
              )}
            </div>
            {item.image && (
              <img src={item.image} alt={`Thumbnail of ${item.piece}`} className="h-12 w-12 rounded-lg object-cover shrink-0" loading="lazy" width={48} height={48} />
            )}
          </motion.div>
        );
      })}
    </div>
  );

  const renderFeedback = () => (
    <div className="space-y-3">
      {feedbackRequests.map((item) => (
        <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0" aria-hidden="true">
            {item.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium">{item.user}</p>
            <p className="text-xs text-muted-foreground">{item.message} · {item.time}</p>
            <div className="flex items-center gap-3 mt-3">
              <img src={item.image} alt={`Thumbnail of ${item.piece}`} className="h-16 w-24 rounded-lg object-cover" loading="lazy" width={96} height={64} />
              <div>
                <p className="text-sm text-foreground">{item.piece}</p>
                <button className="text-xs text-primary hover:underline mt-1 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                  Give Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCollections = () => (
    <div className="space-y-1">
      {collectionItems.map((item) => (
        <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors" role="listitem">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0" aria-hidden="true">
            {item.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{item.user}</strong> added <strong className="text-foreground">'{item.piece}'</strong> to <strong className="text-foreground">{item.collection}</strong> · {item.time}
            </p>
          </div>
          <img src={item.image} alt={`Thumbnail of ${item.piece}`} className="h-12 w-12 rounded-lg object-cover shrink-0" loading="lazy" width={48} height={48} />
        </div>
      ))}
    </div>
  );

  return (
    <FoliaLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-8">
          Notifications
        </h1>

        <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1" role="tablist" aria-label="Notification tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div role="list" aria-label={`${activeTab} notifications`}>
          {activeTab === "activity" && renderActivity()}
          {activeTab === "feedback" && renderFeedback()}
          {activeTab === "collections" && renderCollections()}
        </div>
      </div>
    </FoliaLayout>
  );
}
