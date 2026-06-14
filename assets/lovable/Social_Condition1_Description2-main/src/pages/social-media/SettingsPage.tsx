import { useState } from "react";
import { FoliaLayout } from "@/components/social-media/FoliaLayout";
import { User, Wrench, Eye, Briefcase, Bell, Shield, ChevronRight } from "lucide-react";

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  id: string;
}

function Toggle({ label, description, checked, onChange, id }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="pr-4">
        <label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">{label}</label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-primary-foreground transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

const sections = [
  { key: "profile", label: "Profile & Portfolio", icon: User },
  { key: "tools", label: "Creative Tools", icon: Wrench },
  { key: "visibility", label: "Visibility", icon: Eye },
  { key: "commission", label: "Commission Status", icon: Briefcase },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Account Security", icon: Shield },
] as const;

type SectionKey = (typeof sections)[number]["key"];

export default function SettingsPage() {
  const [publicProfile, setPublicProfile] = useState(true);
  const [openForWork, setOpenForWork] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [feedbackNotifs, setFeedbackNotifs] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionKey>("profile");

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="display-name" className="text-sm font-medium text-foreground">Display Name</label>
              <input id="display-name" type="text" defaultValue="Mika Chen" className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label htmlFor="bio-text" className="text-sm font-medium text-foreground">Bio</label>
              <textarea id="bio-text" defaultValue="Multidisciplinary artist exploring the intersection of organic forms and digital media." className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-24" />
            </div>
            <div>
              <label htmlFor="location-input" className="text-sm font-medium text-foreground">Location</label>
              <input id="location-input" type="text" defaultValue="Tokyo, Japan" className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label htmlFor="portfolio-url" className="text-sm font-medium text-foreground">Portfolio URL</label>
              <input id="portfolio-url" type="url" defaultValue="https://mikachen.design" className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        );
      case "tools":
        return (
          <div>
            <p className="text-sm text-muted-foreground mb-4">Skills and software you use</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {["Procreate", "Figma", "Film Photography", "After Effects", "Blender", "Photoshop"].map((tool) => (
                <span key={tool} className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  {tool}
                  <button className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${tool}`}>×</button>
                </span>
              ))}
            </div>
            <label htmlFor="add-tool" className="sr-only">Add a tool</label>
            <input id="add-tool" type="text" placeholder="Add a tool or skill..." className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border-0 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        );
      case "visibility":
        return (
          <div className="space-y-1">
            <Toggle id="public-profile" label="Public Portfolio" description="Your work is visible to everyone" checked={publicProfile} onChange={setPublicProfile} />
            <Toggle id="show-process" label="Show Process Posts" description="Display work-in-progress updates on your profile" checked={true} onChange={() => {}} />
            <Toggle id="show-collections" label="Public Collections" description="Others can see what you've collected" checked={false} onChange={() => {}} />
          </div>
        );
      case "commission":
        return (
          <div>
            <Toggle id="open-for-work" label="Open for Work" description="Show an 'Open for Work' badge on your profile" checked={openForWork} onChange={setOpenForWork} />
            <div className="mt-4">
              <label htmlFor="commission-note" className="text-sm font-medium text-foreground">Commission Note</label>
              <textarea id="commission-note" defaultValue="Currently accepting illustration commissions. DM for rates." className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20" />
            </div>
          </div>
        );
      case "notifications":
        return (
          <div className="space-y-1">
            <Toggle id="email-notifs" label="Email Notifications" description="Receive notifications via email" checked={emailNotifs} onChange={setEmailNotifs} />
            <Toggle id="push-notifs" label="Push Notifications" description="Browser push notifications" checked={pushNotifs} onChange={setPushNotifs} />
            <Toggle id="feedback-notifs" label="Feedback Requests" description="Get notified when someone requests your feedback" checked={feedbackNotifs} onChange={setFeedbackNotifs} />
          </div>
        );
      case "security":
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="text-sm font-medium text-foreground">Email Address</label>
              <input id="email-address" type="email" defaultValue="mika@example.com" className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <button className="text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
              Change Password
            </button>
            <div className="pt-2">
              <Toggle id="two-factor" label="Two-Factor Authentication" description="Add an extra layer of security" checked={false} onChange={() => {}} />
            </div>
            <div className="pt-4 border-t border-border">
              <button className="text-sm text-destructive hover:underline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                Delete Account
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <FoliaLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-8">
          Settings
        </h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Section Nav */}
          <nav className="md:w-56 shrink-0" aria-label="Settings sections">
            <div className="space-y-0.5">
              {sections.map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                    activeSection === section.key
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  aria-current={activeSection === section.key ? "true" : undefined}
                >
                  <section.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{section.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 md:hidden" aria-hidden="true" />
                </button>
              ))}
            </div>
          </nav>

          {/* Section Content */}
          <div className="flex-1 bg-card rounded-2xl border border-border p-6">
            <h2 className="font-display text-lg text-foreground mb-5">
              {sections.find((s) => s.key === activeSection)?.label}
            </h2>
            {renderSection()}
            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </FoliaLayout>
  );
}
