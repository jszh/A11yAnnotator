import { FoliaLayout } from "@/components/social-media/FoliaLayout";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Shield, Eye, Briefcase, Bell, Palette, User } from "lucide-react";

function Section({ icon: Icon, title, children, delay = 0 }: { icon: any; title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-xl border border-border p-5 mb-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-folia-coral" />
        <h3 className="font-display text-base text-foreground">{title}</h3>
      </div>
      {children}
    </motion.section>
  );
}

export default function SettingsPage() {
  return (
    <FoliaLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="font-display text-2xl text-foreground mb-6">Settings</h2>

        <Section icon={User} title="Profile & Portfolio" delay={0}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
              <Input defaultValue="Maya Chen" className="bg-muted/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
              <textarea
                defaultValue="Creating textured digital worlds inspired by nature and light."
                rows={2}
                className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Website</label>
              <Input defaultValue="mayachen.studio" className="bg-muted/50" />
            </div>
          </div>
        </Section>

        <Section icon={Palette} title="Creative Tools" delay={0.05}>
          <div className="flex flex-wrap gap-2 mb-3">
            {["Procreate", "Figma", "Film Photography", "Risograph", "Blender"].map((tool) => (
              <span key={tool} className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground flex items-center gap-1">
                {tool}
                <button className="ml-1 text-muted-foreground hover:text-foreground">×</button>
              </span>
            ))}
          </div>
          <Input placeholder="Add a tool or skill..." className="bg-muted/50" />
        </Section>

        <Section icon={Eye} title="Visibility" delay={0.1}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Public Portfolio</p>
                <p className="text-xs text-muted-foreground">Your work is visible to everyone</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Show in Explore</p>
                <p className="text-xs text-muted-foreground">Appear in the Explore discovery feed</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Section>

        <Section icon={Briefcase} title="Commission Status" delay={0.15}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Open for Work</p>
              <p className="text-xs text-muted-foreground">Display an "Open for Work" badge on your profile</p>
            </div>
            <Switch />
          </div>
        </Section>

        <Section icon={Bell} title="Notifications" delay={0.2}>
          <div className="space-y-4">
            {[
              { label: "Appreciations", desc: "When someone appreciates your work" },
              { label: "Comments & Feedback", desc: "When someone comments on your project" },
              { label: "New Followers", desc: "When someone starts following you" },
              { label: "Collection Adds", desc: "When your work is added to a collection" },
              { label: "Messages", desc: "New direct messages and collaboration requests" },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{n.label}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </Section>

        <Section icon={Shield} title="Account Security" delay={0.25}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <Input defaultValue="maya@example.com" className="bg-muted/50" />
            </div>
            <Button variant="outline" className="text-sm">Change Password</Button>
            <div className="flex items-center justify-between mt-2">
              <div>
                <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch />
            </div>
          </div>
        </Section>

        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline">Cancel</Button>
          <Button className="bg-folia-coral text-primary-foreground hover:bg-folia-coral/90">Save Changes</Button>
        </div>
      </div>
    </FoliaLayout>
  );
}
