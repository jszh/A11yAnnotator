import { useState } from "react";
import { CalendarDays, MapPin, Link as LinkIcon } from "lucide-react";
import { AppLayout } from "@/components/social-media/AppLayout";
import { PostCard } from "@/components/social-media/PostCard";
import { currentUser, feedPosts } from "@/data/mockData";
import { Button } from "@/components/ui/button";

const profileTabs = [
  { id: "posts", label: "Posts" },
  { id: "replies", label: "Replies" },
  { id: "media", label: "Media" },
  { id: "likes", label: "Likes" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("posts");

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <header className="sticky top-0 z-10 pulse-glass px-4 py-3 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">{currentUser.displayName}</h1>
          <p className="text-xs text-muted-foreground">{feedPosts.length} posts</p>
        </header>

        {/* Cover */}
        <div className="h-48 bg-gradient-to-br from-primary/40 to-primary/10 relative">
          <div className="absolute -bottom-16 left-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.displayName}
              className="pulse-avatar w-32 h-32 border-4 border-background"
            />
          </div>
        </div>

        {/* Profile info */}
        <div className="px-4 pt-20 pb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">{currentUser.displayName}</h2>
              <p className="text-muted-foreground">@{currentUser.handle}</p>
            </div>
            <Button variant="outline" className="rounded-full">
              Edit Profile
            </Button>
          </div>

          <p className="text-foreground text-[15px] mb-3">{currentUser.bio}</p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" aria-hidden="true" /> San Francisco
            </span>
            <span className="flex items-center gap-1">
              <LinkIcon className="w-4 h-4" aria-hidden="true" /> pulse.design
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="w-4 h-4" aria-hidden="true" /> Joined March 2023
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span>
              <span className="font-bold text-foreground">{currentUser.following?.toLocaleString()}</span>{" "}
              <span className="text-muted-foreground">Following</span>
            </span>
            <span>
              <span className="font-bold text-foreground">{currentUser.followers?.toLocaleString()}</span>{" "}
              <span className="text-muted-foreground">Followers</span>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Profile content" className="flex border-b border-border">
          {profileTabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              id={`profile-tab-${tab.id}`}
              aria-controls={`profile-panel-${tab.id}`}
              className={`pulse-tab flex-1 ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div
          role="tabpanel"
          id={`profile-panel-${activeTab}`}
          aria-labelledby={`profile-tab-${activeTab}`}
          className="p-4 space-y-4"
        >
          {activeTab === "posts" && feedPosts.slice(0, 3).map((post) => (
            <PostCard key={post.id} post={{ ...post, user: currentUser }} />
          ))}
          {activeTab === "replies" && (
            <p className="text-center text-muted-foreground py-8">No replies yet</p>
          )}
          {activeTab === "media" && (
            <div className="grid grid-cols-3 gap-1">
              {feedPosts.filter(p => p.image).map((post) => (
                <img
                  key={post.id}
                  src={post.image}
                  alt={`Media by ${currentUser.displayName}`}
                  className="w-full aspect-square object-cover rounded-md"
                  loading="lazy"
                />
              ))}
            </div>
          )}
          {activeTab === "likes" && (
            <p className="text-center text-muted-foreground py-8">No liked posts yet</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
