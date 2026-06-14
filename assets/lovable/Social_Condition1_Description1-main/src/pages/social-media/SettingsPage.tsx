import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [dmPermissions, setDmPermissions] = useState("everyone");
  const [postVisibility, setPostVisibility] = useState("public");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>

      {/* Account */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-foreground text-lg">Account</h2>
        <div className="pulse-card p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Username</label>
            <input type="text" defaultValue="alexmorgan" className="pulse-input w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
            <input type="email" defaultValue="alex@example.com" className="pulse-input w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
            <input type="password" defaultValue="********" className="pulse-input w-full" />
          </div>
          <Button size="sm" className="rounded-full">Save Changes</Button>
        </div>
      </section>

      {/* Privacy */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-foreground text-lg">Privacy</h2>
        <div className="pulse-card p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Who can see your posts</label>
            <select
              value={postVisibility}
              onChange={(e) => setPostVisibility(e.target.value)}
              className="pulse-input w-full"
            >
              <option value="public">Everyone</option>
              <option value="followers">Followers Only</option>
              <option value="private">Only Me</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Who can send you DMs</label>
            <select
              value={dmPermissions}
              onChange={(e) => setDmPermissions(e.target.value)}
              className="pulse-input w-full"
            >
              <option value="everyone">Everyone</option>
              <option value="followers">Followers Only</option>
              <option value="none">Nobody</option>
            </select>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-foreground text-lg">Notifications</h2>
        <div className="pulse-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive email updates for activity</p>
            </div>
            <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Push Notifications</p>
              <p className="text-xs text-muted-foreground">Get push notifications on your device</p>
            </div>
            <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-foreground text-lg">Appearance</h2>
        <div className="pulse-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle between light and dark themes</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-destructive text-lg">Danger Zone</h2>
        <div className="pulse-card border-destructive/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Deactivate Account</p>
              <p className="text-xs text-muted-foreground">Temporarily disable your account</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/10">
              Deactivate
            </Button>
          </div>
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently delete your account and data</p>
            </div>
            <Button variant="destructive" size="sm" className="rounded-full">
              Delete
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
