import { useState } from "react";
import { FoliaLayout } from "@/components/social-media/FoliaLayout";
import { Heart, MessageCircle, Bookmark, Users } from "lucide-react";
import { motion } from "framer-motion";

const tabs = ["Activity", "Feedback Requests", "Collections"] as const;

const activityItems = [
  { id: 1, icon: Heart, color: "text-folia-coral", user: "Hana", action: "appreciated your piece", target: "'Solstice III'", time: "4h", thumb: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=60&h=60&fit=crop" },
  { id: 2, icon: Users, color: "text-folia-teal", user: "Oscar Blume", action: "started following you", target: "", time: "5h", thumb: null },
  { id: 3, icon: MessageCircle, color: "text-folia-gold", user: "Ava Moretti", action: "commented on", target: "'Variable Font Explorations'", time: "8h", thumb: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=60&h=60&fit=crop" },
  { id: 4, icon: Heart, color: "text-folia-coral", user: "Tomás Rivera", action: "appreciated your piece", target: "'Desert Textures'", time: "12h", thumb: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=60&h=60&fit=crop" },
  { id: 5, icon: Bookmark, color: "text-folia-plum", user: "Kai Hoffman", action: "collected", target: "'Neon Botanicals'", time: "1d", thumb: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=60&h=60&fit=crop" },
];

const feedbackItems = [
  { id: 1, user: "Lena Oort", message: "Would love your thoughts on my new color study series", time: "2h", thumb: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=60&h=60&fit=crop" },
  { id: 2, user: "Priya Nair", message: "Seeking feedback on layout composition for my portfolio header", time: "6h", thumb: "https://images.unsplash.com/photo-1633177317976-3f9bc45e1d1d?w=60&h=60&fit=crop" },
];

const collectionItems = [
  { id: 1, user: "Jin Park", action: "added your work to", collection: "'Urban Inspiration'", time: "3h" },
  { id: 2, user: "Sara Novak", action: "created a collection featuring", collection: "'Desert Light'", time: "1d" },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Activity");

  return (
    <FoliaLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="font-display text-2xl text-foreground mb-4">Notifications</h2>

        <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-sm py-2 rounded-md transition-all ${
                activeTab === tab
                  ? "bg-card text-foreground font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {activeTab === "Activity" && activityItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-secondary/30 transition-colors cursor-pointer"
            >
              <item.icon className={`h-5 w-5 ${item.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{item.user}</span>{" "}
                  {item.action}{" "}
                  {item.target && <span className="font-medium text-folia-coral">{item.target}</span>}
                </p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
              {item.thumb && (
                <img src={item.thumb} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
              )}
            </motion.div>
          ))}

          {activeTab === "Feedback Requests" && feedbackItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-secondary/30 transition-colors cursor-pointer"
            >
              <MessageCircle className="h-5 w-5 text-folia-teal shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{item.user}</span>: {item.message}
                </p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
              <img src={item.thumb} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
            </motion.div>
          ))}

          {activeTab === "Collections" && collectionItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-secondary/30 transition-colors cursor-pointer"
            >
              <Bookmark className="h-5 w-5 text-folia-plum shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{item.user}</span>{" "}
                  {item.action}{" "}
                  <span className="font-medium text-folia-coral">{item.collection}</span>
                </p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </FoliaLayout>
  );
}
