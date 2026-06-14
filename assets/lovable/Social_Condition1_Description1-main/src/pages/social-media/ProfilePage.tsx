import { MapPin, LinkIcon, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const profileTabs = ["Posts", "Replies", "Media", "Likes"];

const userPosts = [
  { id: "1", content: "Just shipped v2.0 of my side project. Feels incredible to see months of work come together. Thanks to everyone who beta tested! 🎉", time: "2h", likes: 342, comments: 28 },
  { id: "2", content: "Hot take: the best code is the code you don't write. Spent the day deleting 2000 lines and the app is faster than ever.", time: "5h", likes: 567, comments: 112 },
  { id: "3", content: "Reading 'Thinking in Systems' by Donella Meadows. If you work in tech and haven't read it yet, you're missing out.", time: "1d", likes: 189, comments: 34 },
];

const userMedia = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&h=300&fit=crop",
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Posts");

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cover Photo */}
      <div className="h-48 bg-gradient-to-br from-primary/30 via-secondary to-pulse-amber/20 relative">
        <div className="absolute -bottom-12 left-4">
          <div className="w-24 h-24 rounded-full border-4 border-background bg-secondary overflow-hidden">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
              alt="Alex Morgan"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 pt-14 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Alex Morgan</h1>
            <p className="text-sm text-muted-foreground">@alexmorgan</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full">
            Edit Profile
          </Button>
        </div>
        <p className="text-sm text-foreground mt-3 leading-relaxed">
          Builder of things. Designer turned developer. Obsessed with clean code and great UX. Currently working on something cool. ✨
        </p>
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> San Francisco</span>
          <span className="flex items-center gap-1"><LinkIcon className="w-3.5 h-3.5" /> alexmorgan.dev</span>
          <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Joined Mar 2023</span>
        </div>
        <div className="flex gap-4 mt-3 text-sm">
          <span><strong className="text-foreground">1,247</strong> <span className="text-muted-foreground">Following</span></span>
          <span><strong className="text-foreground">8,932</strong> <span className="text-muted-foreground">Followers</span></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          {profileTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4 space-y-4">
        {activeTab === "Posts" &&
          userPosts.map((post) => (
            <div key={post.id} className="pulse-card p-4">
              <div className="flex gap-3">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Alex" className="w-10 h-10 rounded-full bg-secondary flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">Alex Morgan</span>
                    <span className="text-muted-foreground">@alexmorgan · {post.time}</span>
                  </div>
                  <p className="text-sm text-foreground mt-1">{post.content}</p>
                  <div className="flex gap-6 mt-2 text-xs text-muted-foreground">
                    <span>❤️ {post.likes}</span>
                    <span>💬 {post.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

        {activeTab === "Media" && (
          <div className="grid grid-cols-3 gap-1.5">
            {userMedia.map((img, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border">
                <img src={img} alt="Media" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {(activeTab === "Replies" || activeTab === "Likes") && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No {activeTab.toLowerCase()} yet
          </div>
        )}
      </div>
    </div>
  );
}
