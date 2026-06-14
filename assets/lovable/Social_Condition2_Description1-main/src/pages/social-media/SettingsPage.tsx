import { useState } from "react";
import { AppLayout } from "@/components/social-media/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [dmPermission, setDmPermission] = useState("everyone");

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <header className="sticky top-0 z-10 pulse-glass px-4 py-3 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </header>

        <div className="p-4 space-y-6">
          {/* Account */}
          <section className="pulse-card p-6" aria-labelledby="account-heading">
            <h2 id="account-heading" className="text-lg font-bold text-foreground mb-4">Account</h2>
            <div className="space-y-4">
              <SettingsField label="Username" value="alexrivera" />
              <SettingsField label="Email" value="alex@pulse.design" />
              <SettingsField label="Password" value="••••••••" type="password" />
            </div>
          </section>

          {/* Privacy */}
          <section className="pulse-card p-6" aria-labelledby="privacy-heading">
            <h2 id="privacy-heading" className="text-lg font-bold text-foreground mb-4">Privacy</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Private Account</p>
                  <p className="text-xs text-muted-foreground">Only approved followers can see your posts</p>
                </div>
                <Switch
                  checked={privateAccount}
                  onCheckedChange={setPrivateAccount}
                  aria-label="Toggle private account"
                />
              </div>
              <div>
                <label htmlFor="dm-permission" className="text-sm font-medium text-foreground block mb-1">
                  Who can send you DMs
                </label>
                <select
                  id="dm-permission"
                  value={dmPermission}
                  onChange={(e) => setDmPermission(e.target.value)}
                  className="pulse-input"
                >
                  <option value="everyone">Everyone</option>
                  <option value="followers">Followers only</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="pulse-card p-6" aria-labelledby="notifications-heading">
            <h2 id="notifications-heading" className="text-lg font-bold text-foreground mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive email for important updates</p>
                </div>
                <Switch
                  checked={emailNotifs}
                  onCheckedChange={setEmailNotifs}
                  aria-label="Toggle email notifications"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive push notifications on your device</p>
                </div>
                <Switch
                  checked={pushNotifs}
                  onCheckedChange={setPushNotifs}
                  aria-label="Toggle push notifications"
                />
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section className="pulse-card p-6" aria-labelledby="appearance-heading">
            <h2 id="appearance-heading" className="text-lg font-bold text-foreground mb-4">Appearance</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Use dark theme across the app</p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
                aria-label="Toggle dark mode"
              />
            </div>
          </section>

          {/* Danger Zone */}
          <section className="pulse-card p-6 border-destructive/30" aria-labelledby="danger-heading">
            <h2 id="danger-heading" className="text-lg font-bold text-destructive mb-4">Danger Zone</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Deactivate Account</p>
                  <p className="text-xs text-muted-foreground">Temporarily disable your account</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-full">
                  Deactivate
                </Button>
              </div>
              <div className="flex items-center justify-between">
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
      </div>
    </AppLayout>
  );
}

function SettingsField({ label, value, type = "text" }: { label: string; value: string; type?: string }) {
  return (
    <div>
      <label htmlFor={`settings-${label.toLowerCase()}`} className="text-sm font-medium text-foreground block mb-1">
        {label}
      </label>
      <input
        id={`settings-${label.toLowerCase()}`}
        type={type}
        defaultValue={value}
        className="pulse-input"
      />
    </div>
  );
}
