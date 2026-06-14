import { useState } from "react";
import FoliaLayout from "@/components/social-media/FoliaLayout";
import { User, Palette, Eye, Briefcase, Bell, Shield } from "lucide-react";

interface ToggleProps {
  label: string;
  description: string;
  defaultOn?: boolean;
  id: string;
}

function Toggle({ label, description, defaultOn = false, id }: ToggleProps) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">{label}</label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={on}
        onClick={() => setOn(!on)}
        className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-primary" : "bg-border"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${on ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

const sections = [
  {
    icon: User,
    title: "Profile & Portfolio",
    content: (
      <div className="space-y-4">
        <div>
          <label htmlFor="settings-name" className="text-sm font-medium text-foreground">Display Name</label>
          <input id="settings-name" defaultValue="Elena Torres" className="folia-input mt-1" />
        </div>
        <div>
          <label htmlFor="settings-bio" className="text-sm font-medium text-foreground">Bio</label>
          <textarea id="settings-bio" defaultValue="Multidisciplinary artist exploring the intersection of digital and analog." className="folia-input mt-1 min-h-[80px] resize-none" />
        </div>
        <div>
          <label htmlFor="settings-website" className="text-sm font-medium text-foreground">Website</label>
          <input id="settings-website" defaultValue="elenatorres.art" className="folia-input mt-1" />
        </div>
      </div>
    ),
  },
  {
    icon: Palette,
    title: "Creative Tools",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">List the tools and software you work with</p>
        <div className="flex flex-wrap gap-2">
          {["Procreate", "Figma", "Film Photography", "Blender", "Watercolor"].map((t) => (
            <span key={t} className="folia-tag flex items-center gap-1">
              {t}
              <button aria-label={`Remove ${t}`} className="ml-1 text-muted-foreground hover:text-foreground">×</button>
            </span>
          ))}
        </div>
        <input placeholder="Add a tool or skill..." className="folia-input" aria-label="Add tool or skill" />
      </div>
    ),
  },
  {
    icon: Eye,
    title: "Visibility",
    content: (
      <div className="space-y-1 divide-y divide-border">
        <Toggle id="vis-portfolio" label="Public Portfolio" description="Allow anyone to view your portfolio" defaultOn />
        <Toggle id="vis-search" label="Appear in Search" description="Let others discover your profile via search" defaultOn />
        <Toggle id="vis-activity" label="Show Activity Status" description="Display when you're online" />
      </div>
    ),
  },
  {
    icon: Briefcase,
    title: "Commission Status",
    content: (
      <div className="space-y-1 divide-y divide-border">
        <Toggle id="comm-badge" label="Open for Work Badge" description="Show an 'Open for Work' badge on your profile" defaultOn />
        <Toggle id="comm-requests" label="Accept Commission Requests" description="Allow others to send you commission inquiries" defaultOn />
      </div>
    ),
  },
  {
    icon: Bell,
    title: "Notifications",
    content: (
      <div className="space-y-1 divide-y divide-border">
        <Toggle id="notif-appreciate" label="Appreciations" description="When someone appreciates your work" defaultOn />
        <Toggle id="notif-comment" label="Comments" description="When someone comments on your work" defaultOn />
        <Toggle id="notif-follow" label="New Followers" description="When someone follows you" defaultOn />
        <Toggle id="notif-message" label="Messages" description="When you receive a new message" defaultOn />
        <Toggle id="notif-email" label="Email Digest" description="Weekly summary of activity" />
      </div>
    ),
  },
  {
    icon: Shield,
    title: "Account Security",
    content: (
      <div className="space-y-4">
        <div>
          <label htmlFor="settings-email" className="text-sm font-medium text-foreground">Email</label>
          <input id="settings-email" type="email" defaultValue="elena@example.com" className="folia-input mt-1" aria-describedby="email-help" />
          <p id="email-help" className="text-xs text-muted-foreground mt-1">Used for login and notifications</p>
        </div>
        <div>
          <label htmlFor="settings-password" className="text-sm font-medium text-foreground">New Password</label>
          <input id="settings-password" type="password" placeholder="Enter new password" className="folia-input mt-1" />
        </div>
        <button className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
          Update Security Settings
        </button>
      </div>
    ),
  },
];

export default function FoliaSettings() {
  return (
    <FoliaLayout title="Settings | Folia">
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8 space-y-6">
        <h1 className="text-2xl font-display text-foreground">Settings</h1>
        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="folia-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <section.icon className="h-5 w-5 text-primary" />
                <h2 className="text-base font-display text-foreground">{section.title}</h2>
              </div>
              {section.content}
            </section>
          ))}
        </div>
      </div>
    </FoliaLayout>
  );
}
